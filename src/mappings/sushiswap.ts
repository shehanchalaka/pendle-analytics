import { PairCreated as PairCreatedEvent } from "../../generated/SushiswapFactory/SushiswapFactory";
import {
  Swap as SwapEvent,
  Mint as MintEvent,
  Burn as BurnEvent,
  Sync as SyncEvent,
} from "../../generated/templates/SushiswapPair/SushiswapPair";
import { SushiswapPair as SushiswapPairTemplate } from "../../generated/templates";
import { Market, Token, Transaction } from "../../generated/schema";
import { getTokenAmount, loadToken } from "../entities/token";
import { loadUser } from "../entities/user";
import { ZERO_BD, ZERO_BI } from "../utils/constants";
import { dataSource, DataSourceContext } from "@graphprotocol/graph-ts";
import { rawToDecimal } from "../utils/math";
import { getTokenPrice } from "../pricing";

function isOT(id: string): boolean {
  let token = Token.load(id);
  // token must already exist in the store
  if (!token || token.type != "ot") return false;

  return true;
}

export function handleSushiswapPairCreated(event: PairCreatedEvent): void {
  // save only OT tokens
  let token0 = event.params.token0.toHexString();
  let token1 = event.params.token1.toHexString();

  let otAddress = "";
  let quoteTokenAddress = "";

  if (isOT(token0)) {
    otAddress = token0;
    quoteTokenAddress = token1;
  }
  if (isOT(token1)) {
    otAddress = token1;
    quoteTokenAddress = token0;
  }
  // return if neither of the tokens are OT tokens
  if (otAddress === "") return;

  let market = new Market(event.params.pair.toHexString());

  let lp = loadToken(event.params.pair.toHexString());
  lp.type = "lp-ot";
  lp.save();

  let ot = loadToken(otAddress);
  ot.market = market.id;
  ot.save();

  let quoteToken = loadToken(quoteTokenAddress);

  market.type = "ot";
  market.token0 = token0;
  market.token1 = token1;
  market.baseToken = ot.id;
  market.quoteToken = quoteToken.id;
  market.expiry = ot.expiry;
  market.name = ot.symbol + " / " + quoteToken.symbol;
  market.swapCount = ZERO_BI;
  market.createdTimestamp = event.block.timestamp;
  market.createdBlock = event.block.number;

  market.save();

  const context = new DataSourceContext();
  context.setString("market", event.params.pair.toHexString());
  SushiswapPairTemplate.createWithContext(event.params.pair, context);
}

export function handleSushiswapMint(event: MintEvent): void {
  let hash = event.transaction.hash.toHexString();

  let transaction = new Transaction(hash);
  transaction.hash = event.transaction.hash.toHexString();
  transaction.timestamp = event.block.timestamp;
  transaction.block = event.block.number;
  transaction.action = "join";

  let user = loadUser(event.params.sender.toHexString());
  transaction.user = user.id;

  // market MUST exist at this point
  let context = dataSource.context();
  let market = Market.load(context.getString("market"))!;
  transaction.market = market.id;

  // NOTE no way to find the out LP token amount
  let token0 = loadToken(market.token0);
  let token1 = loadToken(market.token1);
  let lpToken = loadToken(market.id);

  let token0Amount = rawToDecimal(event.params.amount0, token0.decimals);
  let token1Amount = rawToDecimal(event.params.amount1, token1.decimals);

  let inToken0Amount = getTokenAmount(hash, token0, token0Amount);
  let inToken1Amount = getTokenAmount(hash, token1, token1Amount);

  let inputs = transaction.inputs;
  inputs.push(inToken0Amount.id);
  inputs.push(inToken1Amount.id);
  transaction.inputs = inputs;

  transaction.amountUSD = inToken0Amount.amountUSD.plus(
    inToken1Amount.amountUSD
  );

  // derive lp token amount from transaction amountUSD
  let lpPrice = getTokenPrice(lpToken);
  let outLPAmount = inToken0Amount.amountUSD
    .plus(inToken1Amount.amountUSD)
    .div(lpPrice);
  let outLPTokenAmount = getTokenAmount(hash, lpToken, outLPAmount);

  let outputs = transaction.outputs;
  outputs.push(outLPTokenAmount.id);
  transaction.outputs = outputs;

  transaction.save();
}

export function handleSushiswapBurn(event: BurnEvent): void {
  let hash = event.transaction.hash.toHexString();

  let transaction = new Transaction(hash);
  transaction.hash = event.transaction.hash.toHexString();
  transaction.timestamp = event.block.timestamp;
  transaction.block = event.block.number;
  transaction.action = "exit";

  let user = loadUser(event.params.sender.toHexString());
  transaction.user = user.id;

  // market MUST exist at this point
  let context = dataSource.context();
  let market = Market.load(context.getString("market"))!;
  transaction.market = market.id;

  // NOTE no way to find the in LP token amount
  let lpToken = loadToken(market.id);
  let token0 = loadToken(market.token0);
  let token1 = loadToken(market.token1);

  let token0Amount = rawToDecimal(event.params.amount0, token0.decimals);
  let token1Amount = rawToDecimal(event.params.amount1, token1.decimals);

  let outToken0Amount = getTokenAmount(hash, token0, token0Amount);
  let outToken1Amount = getTokenAmount(hash, token1, token1Amount);

  let outputs = transaction.outputs;
  outputs.push(outToken0Amount.id);
  outputs.push(outToken1Amount.id);
  transaction.outputs = outputs;

  transaction.amountUSD = outToken0Amount.amountUSD.plus(
    outToken1Amount.amountUSD
  );

  // derive lp token amount from transaction amountUSD
  let lpPrice = getTokenPrice(lpToken);
  let inLPAmount = outToken0Amount.amountUSD
    .plus(outToken1Amount.amountUSD)
    .div(lpPrice);
  let inLPTokenAmount = getTokenAmount(hash, lpToken, inLPAmount);

  let inputs = transaction.inputs;
  inputs.push(inLPTokenAmount.id);
  transaction.inputs = inputs;

  transaction.save();
}

export function handleSushiswapSwap(event: SwapEvent): void {
  let hash = event.transaction.hash.toHexString();

  let transaction = new Transaction(hash);
  transaction.hash = event.transaction.hash.toHexString();
  transaction.timestamp = event.block.timestamp;
  transaction.block = event.block.number;
  transaction.action = "swap";

  let user = loadUser(event.params.sender.toHexString());
  transaction.user = user.id;

  // market MUST exist at this point
  let context = dataSource.context();
  let market = Market.load(context.getString("market"))!;
  transaction.market = market.id;

  let token0 = loadToken(market.token0);
  let token1 = loadToken(market.token1);

  let inToken: Token;
  let outToken: Token;

  let inAmount = ZERO_BD;
  let outAmount = ZERO_BD;

  // NOTE: either amount0In or amount1In is > 0
  if (event.params.amount0In.gt(ZERO_BI)) {
    inToken = token0;
    inAmount = rawToDecimal(event.params.amount0In, inToken.decimals);
  } else {
    inToken = token1;
    inAmount = rawToDecimal(event.params.amount1In, inToken.decimals);
  }

  if (event.params.amount0Out.gt(ZERO_BI)) {
    outToken = token0;
    outAmount = rawToDecimal(event.params.amount0Out, outToken.decimals);
  } else {
    outToken = token1;
    outAmount = rawToDecimal(event.params.amount1Out, outToken.decimals);
  }

  let inTokenAmount = getTokenAmount(hash, inToken, inAmount);
  let outTokenAmount = getTokenAmount(hash, outToken, outAmount);

  let inputs = transaction.inputs;
  inputs.push(inTokenAmount.id);
  transaction.inputs = inputs;

  let outputs = transaction.outputs;
  outputs.push(outTokenAmount.id);
  transaction.outputs = outputs;

  // find the price of quoteToken (ex: USDC, PENDLE)
  let amountUSD = ZERO_BD;
  if (inToken.type == "ot") {
    amountUSD = getTokenPrice(outToken).times(outAmount);
  } else {
    amountUSD = getTokenPrice(inToken).times(inAmount);
  }
  transaction.amountUSD = amountUSD;

  transaction.save();
}

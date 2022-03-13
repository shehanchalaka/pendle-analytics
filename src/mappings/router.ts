import {
  BigDecimal,
  BigInt,
  dataSource,
  TypedMap,
} from "@graphprotocol/graph-ts";
import {
  Exit,
  Join,
  MarketCreated,
  SwapEvent,
} from "../../generated/PendleRouter/PendleRouter";
import { Market, Transaction } from "../../generated/schema";
import { loadToken, getTokenAmount } from "../entities/token";
import { loadUser } from "../entities/user";
import { ZERO_BD, ZERO_BI } from "../utils/constants";
import { rawToDecimal } from "../utils/math";
import { debug } from "../utils/debug";
import { getTokenPrice } from "../pricing";
import { PENDLE_WRAPPER } from "../utils/constants/ethereum";

export function handleMarketCreated(event: MarketCreated): void {
  let market = new Market(event.params.market.toHexString());
  market.block = event.block.number;
  market.timestamp = event.block.timestamp;

  let lp = loadToken(event.params.market.toHexString());
  lp.type = "lp-yt";
  lp.save();

  let yt = loadToken(event.params.xyt.toHexString());
  yt.market = market.id;
  yt.save();

  let quoteToken = loadToken(event.params.token.toHexString());

  market.type = "yt";
  // for YT markets token0 is the yt
  market.token0 = yt.id;
  market.token1 = quoteToken.id;
  market.baseToken = yt.id;
  market.quoteToken = quoteToken.id;
  market.expiry = yt.expiry;
  market.name = yt.symbol + " / " + quoteToken.symbol;
  market.swapCount = ZERO_BI;

  market.save();
}

export function handleJoin(event: Join): void {
  if (event.params.sender.equals(PENDLE_WRAPPER)) return;

  let hash = event.transaction.hash.toHexString();

  let transaction = new Transaction(hash);
  transaction.hash = event.transaction.hash.toHexString();
  transaction.timestamp = event.block.timestamp;
  transaction.block = event.block.number;
  transaction.action = "join";

  let user = loadUser(event.params.sender.toHexString());
  transaction.user = user.id;

  // market MUST exist at this point
  let market = Market.load(event.params.market.toHexString())!;

  transaction.market = market.id;

  // * NOTE: token0 is the YT (or baseToken)
  let token0 = loadToken(market.baseToken);
  let token1 = loadToken(market.quoteToken);
  let lpToken = loadToken(market.id);

  let token0Amount = rawToDecimal(event.params.token0Amount, token0.decimals);
  let token1Amount = rawToDecimal(event.params.token1Amount, token1.decimals);
  let outLPAmount = rawToDecimal(event.params.exactOutLp, lpToken.decimals);

  let inToken0Amount = getTokenAmount(hash, token0, token0Amount);
  let inToken1Amount = getTokenAmount(hash, token1, token1Amount);
  let outLPTokenAmount = getTokenAmount(hash, lpToken, outLPAmount);

  let inputs = transaction.inputs;
  inputs.push(inToken0Amount.id);
  inputs.push(inToken1Amount.id);
  transaction.inputs = inputs;

  let outputs = transaction.outputs;
  outputs.push(outLPTokenAmount.id);
  transaction.outputs = outputs;

  transaction.amountUSD = inToken0Amount.amountUSD.plus(
    inToken1Amount.amountUSD
  );

  transaction.save();
}

export function handleExit(event: Exit): void {
  if (event.params.sender.equals(PENDLE_WRAPPER)) return;

  let hash = event.transaction.hash.toHexString();

  let transaction = new Transaction(hash);
  transaction.hash = event.transaction.hash.toHexString();
  transaction.timestamp = event.block.timestamp;
  transaction.block = event.block.number;
  transaction.action = "exit";

  let user = loadUser(event.params.sender.toHexString());
  transaction.user = user.id;

  // market MUST exist at this point
  let market = Market.load(event.params.market.toHexString())!;

  transaction.market = market.id;

  let lpToken = loadToken(market.id);
  // * NOTE token0 is the YT (or baseToken)
  let token0 = loadToken(market.baseToken);
  let token1 = loadToken(market.quoteToken);

  let inLPAmount = rawToDecimal(event.params.exactInLp, lpToken.decimals);
  let token0Amount = rawToDecimal(event.params.token0Amount, token0.decimals);
  let token1Amount = rawToDecimal(event.params.token1Amount, token1.decimals);

  let inLPTokenAmount = getTokenAmount(hash, lpToken, inLPAmount);
  let outToken0Amount = getTokenAmount(hash, token0, token0Amount);
  let outToken1Amount = getTokenAmount(hash, token1, token1Amount);

  let inputs = transaction.inputs;
  inputs.push(inLPTokenAmount.id);
  transaction.inputs = inputs;

  let outputs = transaction.outputs;
  outputs.push(outToken0Amount.id);
  outputs.push(outToken1Amount.id);
  transaction.outputs = outputs;

  transaction.amountUSD = inLPTokenAmount.amountUSD;

  transaction.save();
}

export function handleSwapEvent(event: SwapEvent): void {
  if (event.params.trader.equals(PENDLE_WRAPPER)) return;

  let hash = event.transaction.hash.toHexString();

  let transaction = new Transaction(hash);
  transaction.hash = event.transaction.hash.toHexString();
  transaction.timestamp = event.block.timestamp;
  transaction.block = event.block.number;
  transaction.action = "swap";

  let user = loadUser(event.params.trader.toHexString());
  transaction.user = user.id;

  // market MUST exist at this point
  let market = Market.load(event.params.market.toHexString())!;

  transaction.market = market.id;

  let inToken = loadToken(event.params.inToken.toHexString());
  let outToken = loadToken(event.params.outToken.toHexString());

  let inAmount = rawToDecimal(event.params.exactIn, inToken.decimals);
  let outAmount = rawToDecimal(event.params.exactOut, outToken.decimals);

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
  if (inToken.type == "yt") {
    amountUSD = getTokenPrice(outToken).times(outAmount);
  } else {
    amountUSD = getTokenPrice(inToken).times(inAmount);
  }
  transaction.amountUSD = amountUSD;

  transaction.save();
}

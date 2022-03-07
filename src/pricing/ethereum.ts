import { BigDecimal, BigInt, Address } from "@graphprotocol/graph-ts";
import { Market, Token, TokenPrice } from "../../generated/schema";
import { PendleMarket as PendleMarketContract } from "../../generated/PendleRouter/PendleMarket";
import { SushiswapPair as SushiswapPairContract } from "../../generated/templates/IPendleForge/SushiswapPair";
import { debug } from "../utils/debug";
import { rawToDecimal } from "../utils/math";
import { ONE_BD, RONE_BD, ZERO_BD } from "../utils/constants";
import { getTokenDecimals } from "../entities/token";

let USDC_TOKEN_ADDRESS = Address.fromString(
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
);
let PENDLE_TOKEN_ADDRESS = Address.fromString(
  "0x808507121B80c02388fAd14726482e061B8da827"
);
let ZERO_ADDRESS = Address.fromString(
  "0x0000000000000000000000000000000000000000"
);

export let QUOTE_TOKENS: Address[] = [USDC_TOKEN_ADDRESS, PENDLE_TOKEN_ADDRESS];

export function getWETHPrice(): BigDecimal {
  // calculate WETH price from Sushiswap's USDC-WETH pool
  // USDC-WETH Address 0x397ff1542f962076d0bfe58ea045ffa2d347aca0
  // token0 USDC token1 WETH
  const USDC_WETH_POOL_ADDRESS = Address.fromString(
    "0x397FF1542f962076d0BFE58eA045FfA2d347ACa0"
  );
  let pair = SushiswapPairContract.bind(USDC_WETH_POOL_ADDRESS);
  let reserves = pair.getReserves();
  let usdc = rawToDecimal(reserves.value0, BigInt.fromI32(6));
  let weth = rawToDecimal(reserves.value1, BigInt.fromI32(18));

  return usdc.div(weth);
}

export function getPendlePrice(): BigDecimal {
  // calculate PENDLE price from Sushiswap's PENDLE-WETH pool
  // PENDLE-WETH Address 0x37922c69b08babcceae735a31235c81f1d1e8e43
  // token0 PENDLE token1 WETH
  const PENDLE_WETH_POOL_ADDRESS = Address.fromString(
    "0x37922c69b08babcceae735a31235c81f1d1e8e43"
  );
  let pair = SushiswapPairContract.bind(PENDLE_WETH_POOL_ADDRESS);
  let reserves = pair.getReserves();
  let pendle = rawToDecimal(reserves.value0, BigInt.fromI32(6));
  let weth = rawToDecimal(reserves.value1, BigInt.fromI32(18));
  let wethPrice = getWETHPrice();

  return weth.times(wethPrice).div(pendle);
}

export function getOTPrice(token: Token): BigDecimal {
  // calculate OT price from Sushiswap's OT pool
  if (!token.market) return BigDecimal.fromString("0");

  let market = Market.load(token.market!);
  if (!market) return BigDecimal.fromString("0");

  let otDecimals = getTokenDecimals(market.baseToken);
  let quoteDecimals = getTokenDecimals(market.quoteToken);

  let pair = SushiswapPairContract.bind(Address.fromString(market.id));
  let reserves = pair.getReserves();
  let otBalance = rawToDecimal(reserves.value0, otDecimals);
  let quoteBalance = rawToDecimal(reserves.value1, quoteDecimals);
  let quotePrice = getGenericTokenPrice(market.quoteToken);

  return quoteBalance.times(quotePrice).div(otBalance);
}

export function getYTPrice(token: Token): BigDecimal {
  // calculate YT price from Pendle AMM
  if (!token.market) return BigDecimal.fromString("0");

  let market = Market.load(token.market!);
  if (!market) return BigDecimal.fromString("0");

  let ytDecimals = getTokenDecimals(market.baseToken);
  let quoteDecimals = getTokenDecimals(market.quoteToken);

  let pair = PendleMarketContract.bind(Address.fromString(market.id));
  let reserves = pair.getReserves();
  let ytBalance = rawToDecimal(reserves.value0, ytDecimals);
  let ytWeight = reserves.value1.toBigDecimal().div(RONE_BD);
  let quoteBalance = rawToDecimal(reserves.value2, quoteDecimals);
  let quoteWeight = ONE_BD.minus(ytWeight);
  let quotePrice = getGenericTokenPrice(market.quoteToken);

  if (quoteWeight == ZERO_BD || ytBalance == ZERO_BD) {
    return BigDecimal.fromString("0");
  }

  return quoteBalance
    .times(quotePrice)
    .div(quoteWeight)
    .times(ytWeight)
    .div(ytBalance);
}

export function getPendleLPPrice(token: Token): BigDecimal {
  let pair = PendleMarketContract.bind(Address.fromString(token.id));

  return BigDecimal.fromString("0");
}

export function getSushiswapLPPrice(token: Token): BigDecimal {
  // let pair = SushiswapPair.bind(Address.fromString(token.id));

  return BigDecimal.fromString("0");
}

export function getGenericTokenPrice(id: string): BigDecimal {
  if (id == USDC_TOKEN_ADDRESS.toHexString()) {
    return BigDecimal.fromString("1");
  } else if (id == PENDLE_TOKEN_ADDRESS.toHexString()) {
    return getPendlePrice();
  }

  return BigDecimal.fromString("0");
}

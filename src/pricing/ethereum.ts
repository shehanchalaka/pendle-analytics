import { BigDecimal, BigInt, Address } from "@graphprotocol/graph-ts";
import { Market, Token, TokenPrice } from "../../generated/schema";
import { PendleMarket as PendleMarketContract } from "../../generated/PendleRouter/PendleMarket";
import { SushiswapPair as SushiswapPairContract } from "../../generated/templates/IPendleForge/SushiswapPair";
import { ICToken as ICTokenContract } from "../../generated/templates/IPendleForge/ICToken";
import { debug } from "../utils/debug";
import { pow10, rawToDecimal } from "../utils/math";
import { ONE_BD, RONE_BD, TWO_BD, ZERO_BD } from "../utils/constants";
import { getTokenDecimals, loadToken } from "../entities/token";
import { getTokenPrice } from "./index";

let WETH_TOKEN_ADDRESS = Address.fromString(
  "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
);
let USDC_TOKEN_ADDRESS = Address.fromString(
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
);
let USDT_TOKEN_ADDRESS = Address.fromString(
  "0xdAC17F958D2ee523a2206206994597C13D831ec7"
);
let DAI_TOKEN_ADDRESS = Address.fromString(
  "0x6B175474E89094C44Da98b954EedeAC495271d0F"
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
  let pendle = rawToDecimal(reserves.value0, BigInt.fromI32(18));
  let weth = rawToDecimal(reserves.value1, BigInt.fromI32(18));
  let wethPrice = getWETHPrice();

  return weth.times(wethPrice).div(pendle);
}

export function getOTPrice(token: Token): BigDecimal {
  // calculate OT price from Sushiswap's OT pool
  if (!token.market) return ZERO_BD;

  let market = Market.load(token.market!);
  if (!market) return ZERO_BD;

  let otDecimals = getTokenDecimals(market.baseToken);
  let quoteDecimals = getTokenDecimals(market.quoteToken);

  let pair = SushiswapPairContract.bind(Address.fromString(market.id));

  let reserves = pair.try_getReserves();
  if (reserves.reverted) {
    return ZERO_BD;
  }

  let otBalance = rawToDecimal(reserves.value.value0, otDecimals);
  let quoteBalance = rawToDecimal(reserves.value.value1, quoteDecimals);

  let quotePrice = getGenericTokenPrice(market.quoteToken);

  if (otBalance == ZERO_BD) {
    return ZERO_BD;
  }

  return quoteBalance.times(quotePrice).div(otBalance);
}

export function getYTPrice(token: Token): BigDecimal {
  // calculate YT price from Pendle AMM
  if (!token.market) return ZERO_BD;

  let market = Market.load(token.market!);
  if (!market) return ZERO_BD;

  let ytDecimals = getTokenDecimals(market.baseToken);
  let quoteDecimals = getTokenDecimals(market.quoteToken);

  let pair = PendleMarketContract.bind(Address.fromString(market.id));

  let reserves = pair.try_getReserves();
  if (reserves.reverted) {
    return ZERO_BD;
  }

  let ytBalance = rawToDecimal(reserves.value.value0, ytDecimals);
  let ytWeight = reserves.value.value1.toBigDecimal().div(RONE_BD);
  let quoteBalance = rawToDecimal(reserves.value.value2, quoteDecimals);
  let quoteWeight = ONE_BD.minus(ytWeight);
  let quotePrice = getGenericTokenPrice(market.quoteToken);

  if (quoteWeight == ZERO_BD || ytBalance == ZERO_BD) {
    return ZERO_BD;
  }

  let tvl = quoteBalance.times(quotePrice).div(quoteWeight);

  return tvl.times(ytWeight).div(ytBalance);
}

export function getPendleLPPrice(token: Token): BigDecimal {
  let pair = PendleMarketContract.bind(Address.fromString(token.id));

  let totalSupply = rawToDecimal(pair.totalSupply(), token.decimals);

  let market = Market.load(token.id)!;

  let ytDecimals = getTokenDecimals(market.baseToken);
  let quoteDecimals = getTokenDecimals(market.quoteToken);

  let reserves = pair.try_getReserves();
  if (reserves.reverted) {
    return ZERO_BD;
  }

  let ytBalance = rawToDecimal(reserves.value.value0, ytDecimals);
  let ytWeight = reserves.value.value1.toBigDecimal().div(RONE_BD);
  let quoteBalance = rawToDecimal(reserves.value.value2, quoteDecimals);
  let quoteWeight = ONE_BD.minus(ytWeight);
  let quotePrice = getGenericTokenPrice(market.quoteToken);

  if (
    quoteWeight == ZERO_BD ||
    ytBalance == ZERO_BD ||
    totalSupply == ZERO_BD
  ) {
    return ZERO_BD;
  }

  let tvl = quoteBalance.times(quotePrice).div(quoteWeight);

  return tvl.div(totalSupply);
}

// TODO make this function generic
// export function getSushiswapLPPrice(token: Token): BigDecimal {
//   let pair = SushiswapPairContract.bind(Address.fromString(token.id));

//   let totalSupply = rawToDecimal(pair.totalSupply(), token.decimals);

//   let reserves = pair.try_getReserves();
//   if (reserves.reverted) {
//     return ZERO_BD;
//   }

//   let market = Market.load(token.id)!;

//   let quoteToken = loadToken(market.quoteToken);
//   let quoteTokenBalance: BigDecimal;

//   if (market.quoteToken == pair.token0().toHexString()) {
//     // quote token (ex: USDC) is token0
//     quoteTokenBalance = rawToDecimal(
//       reserves.value.value0,
//       quoteToken.decimals
//     );
//   } else {
//     // quote token (ex: USDC) is token1
//     quoteTokenBalance = rawToDecimal(
//       reserves.value.value1,
//       quoteToken.decimals
//     );
//   }

//   let quoteTokenPrice = getGenericTokenPrice(market.quoteToken);

//   return quoteTokenBalance
//     .times(quoteTokenPrice)
//     .times(TWO_BD)
//     .div(totalSupply);
// }

export function getSushiLPTokenPrice(token: Token): BigDecimal {
  let pair = SushiswapPairContract.bind(Address.fromString(token.id));

  let totalSupply = rawToDecimal(pair.totalSupply(), token.decimals);

  let reserves = pair.try_getReserves();
  if (reserves.reverted) {
    return ZERO_BD;
  }

  let token1 = loadToken(pair.token1().toHexString());
  let token1Balance = rawToDecimal(reserves.value.value1, token1.decimals);
  let token1Price = getTokenPrice(token1);

  return token1Balance
    .times(token1Price)
    .times(TWO_BD)
    .div(totalSupply);
}

export function getYieldBearingTokenPrice(token: Token): BigDecimal {
  // find underlying token price
  if (token.forgeId.startsWith("Sushi")) {
    return getSushiLPTokenPrice(token);
  }

  let underlyingToken = loadToken(token.underlyingToken!);

  if (token.forgeId.startsWith("Compound")) {
    let COMPOUND_EXCHANGE_RATE_DECIMAL = BigInt.fromI32(10)
      .pow(18)
      .toBigDecimal();

    let contract = ICTokenContract.bind(Address.fromString(token.id));
    return contract
      .exchangeRateCurrent()
      .toBigDecimal()
      .div(COMPOUND_EXCHANGE_RATE_DECIMAL)
      .div(pow10(underlyingToken.decimals.minus(token.decimals)));
  }

  let underlyingPrice = getGenericTokenPrice(token.underlyingToken!);

  if (token.forgeId.startsWith("Aave")) {
    // 1 aToken = 1 underlygin token
    return underlyingPrice;
  }

  if (token.forgeId.startsWith("Redacted")) {
  }

  return ZERO_BD;
}

export function getGenericTokenPrice(id: string): BigDecimal {
  if (id == USDC_TOKEN_ADDRESS.toHexString()) {
    return BigDecimal.fromString("1");
  } else if (id == DAI_TOKEN_ADDRESS.toHexString()) {
    return BigDecimal.fromString("1");
  } else if (id == USDT_TOKEN_ADDRESS.toHexString()) {
    return BigDecimal.fromString("1");
  } else if (id == PENDLE_TOKEN_ADDRESS.toHexString()) {
    return getPendlePrice();
  }

  let STABLE_TOKENS: Address[] = [
    USDC_TOKEN_ADDRESS,
    USDT_TOKEN_ADDRESS,
    DAI_TOKEN_ADDRESS,
  ];

  return ZERO_BD;
}

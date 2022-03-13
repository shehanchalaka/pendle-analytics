import { BigDecimal, Address } from "@graphprotocol/graph-ts";
import { UniswapPool as UniswapPoolContract } from "../../generated/PendleRouter/UniswapPool";
import { ONE_BD, UNISWAP_Q192, ZERO_BD } from "../utils/constants";
import { TokenUtils } from "../entities/token";
import { getGenericTokenPrice } from "./generic";

export function getPriceOfTokenInPool(
  tokenAddress: string,
  marketAddress: string
): BigDecimal {
  let contract = UniswapPoolContract.bind(Address.fromString(marketAddress));

  let token0 = new TokenUtils(contract.token0().toHexString());
  let token1 = new TokenUtils(contract.token1().toHexString());
  let token0Decimals = token0.getDecimals().toBigDecimal();
  let token1Decimals = token1.getDecimals().toBigDecimal();

  let slot0 = contract.slot0();
  let poolState = slot0.value0.toBigDecimal();

  let price0 = poolState
    .times(poolState)
    .div(UNISWAP_Q192)
    .times(token0Decimals)
    .div(token1Decimals);

  if (Address.fromString(tokenAddress) == token0.getAddress()) {
    return price0;
  } else {
    return ONE_BD.div(price0);
  }
}

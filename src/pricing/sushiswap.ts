import { BigDecimal, Address } from "@graphprotocol/graph-ts";
import { SushiswapPair as SushiswapPairContract } from "../../generated/templates/SushiswapPair/SushiswapPair";
import { ZERO_BD } from "../utils/constants";
import { TokenUtils } from "../entities/token";
import { getGenericTokenPrice } from "./generic";

export function getPriceOfTokenInPool(
  tokenAddress: string,
  marketAddress: string
): BigDecimal {
  let contract = SushiswapPairContract.bind(Address.fromString(marketAddress));
  let token0 = new TokenUtils(contract.token0().toHexString());
  let token1 = new TokenUtils(contract.token1().toHexString());
  let reserves = contract.getReserves();
  let balance0 = token0.volumeOf(reserves.value0);
  let balance1 = token1.volumeOf(reserves.value1);

  // TODO write this more clearly
  if (Address.fromString(tokenAddress) == token0.getAddress()) {
    if (balance0.gt(ZERO_BD)) {
      let token1Price = getGenericTokenPrice(token1.getAddress().toHexString());
      return balance1.times(token1Price).div(balance0);
    } else {
      return ZERO_BD;
    }
  } else {
    if (balance1.gt(ZERO_BD)) {
      let token0Price = getGenericTokenPrice(token0.getAddress().toHexString());
      return balance0.times(token0Price).div(balance1);
    } else {
      return ZERO_BD;
    }
  }
}

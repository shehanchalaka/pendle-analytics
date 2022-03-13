import { Address, BigDecimal } from "@graphprotocol/graph-ts";
import { TraderJoePair as TraderJoePairContract } from "../../../generated/templates/TraderJoePair/TraderJoePair";
import { Token } from "../../../generated/schema";
import { TWO_BD, ZERO_BD } from "../../utils/constants";
import { TokenUtils } from "../../entities/token";
import { getGenericTokenPrice } from "../generic";

export function getLPOTPrice(token: Token): BigDecimal {
  let contract = TraderJoePairContract.bind(Address.fromString(token.id));
  let token0 = new TokenUtils(contract.token0().toHexString());
  let token1 = new TokenUtils(contract.token1().toHexString());
  // TODO try_getReserves()
  let reserves = contract.getReserves();
  let totalSupply = new TokenUtils(token.id).volumeOf(contract.totalSupply());
  let balance0 = token0.volumeOf(reserves.value0);
  let balance1 = token1.volumeOf(reserves.value1);

  if (totalSupply == ZERO_BD) return ZERO_BD;

  if (token0.getType() == "generic") {
    let token0Price = getGenericTokenPrice(token0.getAddress().toHexString());

    return balance0
      .times(token0Price)
      .times(TWO_BD)
      .div(totalSupply);
  } else {
    let token1Price = getGenericTokenPrice(token1.getAddress().toHexString());

    return balance1
      .times(token1Price)
      .times(TWO_BD)
      .div(totalSupply);
  }
}

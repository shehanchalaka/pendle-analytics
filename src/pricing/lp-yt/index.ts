import { Address, BigDecimal } from "@graphprotocol/graph-ts";
import { PendleMarket as PendleMarketContract } from "../../../generated/PendleRouter/PendleMarket";
import { Market, Token } from "../../../generated/schema";
import { TokenUtils } from "../../entities/token";
import { ONE_BD, RONE_BD, ZERO_BD } from "../../utils/constants";
import { getGenericTokenPrice } from "../generic";

export function getLPYTPrice(token: Token): BigDecimal {
  let market = Market.load(token.id);
  if (!market) return ZERO_BD;

  let contract = PendleMarketContract.bind(Address.fromString(token.id));
  let reserves = contract.try_getReserves();

  if (reserves.reverted) return ZERO_BD;

  let ytBalance = new TokenUtils(market.baseToken).volumeOf(
    reserves.value.value0
  );
  let ytWeight = reserves.value.value1.toBigDecimal().div(RONE_BD);
  let quoteBalance = new TokenUtils(market.quoteToken).volumeOf(
    reserves.value.value2
  );
  let quoteWeight = ONE_BD.minus(ytWeight);
  let totalSupply = new TokenUtils(token.id).volumeOf(contract.totalSupply());

  if (totalSupply == ZERO_BD) return ZERO_BD;

  if (quoteWeight == ZERO_BD || ytBalance == ZERO_BD) return ZERO_BD;

  let quotePrice = getGenericTokenPrice(market.quoteToken);

  let tvl = quoteBalance.times(quotePrice).div(quoteWeight);

  return tvl.div(totalSupply);
}

import { BigDecimal } from "@graphprotocol/graph-ts";
import { Token } from "../../../generated/schema";
import { ONE_BD, ZERO_BD } from "../../utils/constants";
import { getPriceOfTokenInPool } from "../sushiswap";

export function getOTPrice(token: Token): BigDecimal {
  if (!token.market) return ZERO_BD;

  return getPriceOfTokenInPool(token.id, token.market!);
}

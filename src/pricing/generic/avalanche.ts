import { BigDecimal } from "@graphprotocol/graph-ts";
import { ZERO_BD } from "../../utils/constants";

export function getGenericTokenPrice(id: string): BigDecimal {
  return ZERO_BD;
}

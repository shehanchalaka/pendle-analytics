import { BigDecimal } from "@graphprotocol/graph-ts";
import { Token } from "../../../generated/schema";
import { ZERO_BD } from "../../utils/constants";

export function getLPYTPrice(token: Token): BigDecimal {
  return ZERO_BD;
}

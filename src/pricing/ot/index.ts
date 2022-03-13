import { BigDecimal, dataSource } from "@graphprotocol/graph-ts";
import { ZERO_BD } from "../../utils/constants";
import * as ethereum from "./ethereum";
import * as avalanche from "./avalanche";
import { Token } from "../../../generated/schema";

export function getOTPrice(token: Token): BigDecimal {
  if (dataSource.network() == "mainnet") {
    return ethereum.getOTPrice(token);
  } else if (dataSource.network() == "avalanche") {
    return avalanche.getOTPrice(token);
  }
  return ZERO_BD;
}

import { BigDecimal, dataSource } from "@graphprotocol/graph-ts";
import { ZERO_BD } from "../../utils/constants";
import * as ethereum from "./ethereum";
import * as avalanche from "./avalanche";
import { Token } from "../../../generated/schema";

export function getYTPrice(token: Token): BigDecimal {
  if (dataSource.network() == "mainnet") {
    return ethereum.getYTPrice(token);
  } else if (dataSource.network() == "avalanche") {
    return avalanche.getYTPrice(token);
  }
  return ZERO_BD;
}

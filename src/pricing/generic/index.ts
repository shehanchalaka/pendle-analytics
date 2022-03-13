import { BigDecimal, dataSource } from "@graphprotocol/graph-ts";
import { ZERO_BD } from "../../utils/constants";
import * as ethereum from "./ethereum";
import * as avalanche from "./avalanche";

export function getGenericTokenPrice(id: string): BigDecimal {
  if (dataSource.network() == "mainnet") {
    return ethereum.getGenericTokenPrice(id);
  } else if (dataSource.network() == "avalanche") {
    return avalanche.getGenericTokenPrice(id);
  }
  return ZERO_BD;
}

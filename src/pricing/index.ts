import { BigDecimal } from "@graphprotocol/graph-ts";
import { Token } from "../../generated/schema";
import { getOTPrice } from "./ot";
import { getYTPrice } from "./yt";
import { getLPOTPrice } from "./lp-ot";
import { getLPYTPrice } from "./lp-yt";
import { getYieldBearingTokenPrice } from "./yieldBearing";
import { getGenericTokenPrice } from "./generic";
import { ZERO_BD } from "../utils/constants";

export function getTokenPrice(token: Token): BigDecimal {
  if (token.type == "ot") {
    return getOTPrice(token);
  } else if (token.type == "yt") {
    return getYTPrice(token);
  } else if (token.type == "lp-yt") {
    return getLPYTPrice(token);
  } else if (token.type == "lp-ot") {
    return getLPOTPrice(token);
  } else if (token.type == "yieldBearing") {
    return getYieldBearingTokenPrice(token);
  }
  return getGenericTokenPrice(token.id);
}

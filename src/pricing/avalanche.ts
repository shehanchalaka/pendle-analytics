import { BigDecimal } from "@graphprotocol/graph-ts";
import { Token } from "../../generated/schema";

export function getWAVAXPrice(): BigDecimal {
  // calculate WAVAX price from TraderJoe's USDC-WAVAX pool
  // 0xA389f9430876455C36478DeEa9769B7Ca4E3DDB1
  // token0 USDC.e token1 WAVAX
  return BigDecimal.fromString("87.34");
}

export function getPendlePrice(): BigDecimal {
  return BigDecimal.fromString("0.19");
}

export function getOTPrice(token: Token): BigDecimal {
  return BigDecimal.fromString("1");
}

export function getYTPrice(token: Token): BigDecimal {
  return BigDecimal.fromString("1");
}

export function getPendleLPTokenPrice(token: Token): BigDecimal {
  return BigDecimal.fromString("0");
}

export function getTraderJoeLPTokenPrice(token: Token): BigDecimal {
  return BigDecimal.fromString("0");
}

export function getYieldBearingTokenPrice(token: Token): BigDecimal {
  return BigDecimal.fromString("0");
}

export function getGenericTokenPrice(id: string): BigDecimal {
  return BigDecimal.fromString("1");
}

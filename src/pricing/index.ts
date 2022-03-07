import { BigDecimal, dataSource } from "@graphprotocol/graph-ts";
import { Token } from "../../generated/schema";
import * as ethereum from "./ethereum";
import * as avalanche from "./avalanche";

export function getTokenPrice(token: Token): BigDecimal {
  if (token.type == "ot") {
    return getOTPrice(token);
  } else if (token.type == "yt") {
    return getYTPrice(token);
  } else if (token.type == "lp-yt") {
    return getGenericTokenPrice(token);
  } else if (token.type == "lp-ot") {
    return getGenericTokenPrice(token);
  } else if (token.type == "yieldBearing") {
    return getGenericTokenPrice(token);
  }
  return getGenericTokenPrice(token);
}

export function getNativeTokenPrice(): BigDecimal {
  if (dataSource.network() == "mainnet") {
    return ethereum.getWETHPrice();
  } else if (dataSource.network() == "avalanche") {
    return avalanche.getWAVAXPrice();
  }
  return BigDecimal.fromString("0");
}

function getOTPrice(token: Token): BigDecimal {
  if (dataSource.network() == "mainnet") {
    return ethereum.getOTPrice(token);
  } else if (dataSource.network() == "avalanche") {
    return avalanche.getOTPrice(token);
  }
  return BigDecimal.fromString("0");
}

function getYTPrice(token: Token): BigDecimal {
  if (dataSource.network() == "mainnet") {
    return ethereum.getYTPrice(token);
  } else if (dataSource.network() == "avalanche") {
    return avalanche.getYTPrice(token);
  }
  return BigDecimal.fromString("0");
}

function getPendleLPPrice(token: Token): BigDecimal {
  if (dataSource.network() == "mainnet") {
    return ethereum.getPendleLPPrice(token);
  } else if (dataSource.network() == "avalanche") {
    return avalanche.getPendleLPPrice(token);
  }
  return BigDecimal.fromString("0");
}

function getSushiswapLPPrice(token: Token): BigDecimal {
  if (dataSource.network() == "mainnet") {
    return ethereum.getSushiswapLPPrice(token);
  } else if (dataSource.network() == "avalanche") {
    return avalanche.getTraderJoeLPPrice(token);
  }
  return BigDecimal.fromString("0");
}

function getGenericTokenPrice(token: Token): BigDecimal {
  if (dataSource.network() == "mainnet") {
    return ethereum.getGenericTokenPrice(token.id);
  } else if (dataSource.network() == "avalanche") {
    return avalanche.getGenericTokenPrice(token.id);
  }
  return BigDecimal.fromString("0");
}

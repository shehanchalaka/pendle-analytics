import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { ICToken as ICTokenContract } from "../../../generated/templates/IPendleForge/ICToken";
import { WMEMO as WMEMOContract } from "../../../generated/templates/IPendleForge/WMEMO";
import { ERC20 } from "../../../generated/templates/IPendleForge/ERC20";
import { Token } from "../../../generated/schema";
import { loadToken } from "../../entities/token";
import { ZERO_BD } from "../../utils/constants";
import { TOKEN_TIME, TOKEN_WMEMO } from "../../utils/constants/avalanche";
import { pow10 } from "../../utils/math";
import { getGenericTokenPrice } from "../generic";

export function getYieldBearingTokenPrice(token: Token): BigDecimal {
  let underlyingTokenAddress = token.underlyingToken;
  if (!underlyingTokenAddress) return ZERO_BD;

  // Change underlying token of rebasing tokens
  if (token.forgeId.startsWith("Wonderland")) {
    underlyingTokenAddress = TOKEN_TIME.toHexString();
  }

  let underlyingToken = loadToken(underlyingTokenAddress!);
  let underlyingPrice = getGenericTokenPrice(underlyingToken.id);

  // STEP 2: Find current rate
  if (token.forgeId.startsWith("BenQi")) {
    let rate = getCTokenRate(token, underlyingToken);
    return underlyingPrice.times(rate);
  }

  if (token.forgeId.startsWith("xJoe")) {
    let rate = getxJOERate(token, underlyingToken);
    return underlyingPrice.times(rate);
  }

  if (token.forgeId.startsWith("Wonderland")) {
    let rate = getMemoRate();
    return underlyingPrice.div(rate);
  }

  return ZERO_BD;
}

function getCTokenRate(token: Token, underlyingToken: Token): BigDecimal {
  let COMPOUND_EXCHANGE_RATE_DECIMAL = BigInt.fromI32(10)
    .pow(18)
    .toBigDecimal();

  let contract = ICTokenContract.bind(Address.fromString(token.id));
  return contract
    .exchangeRateCurrent()
    .toBigDecimal()
    .div(COMPOUND_EXCHANGE_RATE_DECIMAL)
    .div(pow10(underlyingToken.decimals.minus(token.decimals)));
}

function getxJOERate(token: Token, underlyingToken: Token): BigDecimal {
  let xJoeAddress = Address.fromString(token.id);

  let xJoeToken = ERC20.bind(Address.fromString(token.id));
  let joeToken = ERC20.bind(Address.fromString(underlyingToken.id));

  let xJoeTotalSupply = xJoeToken.totalSupply().toBigDecimal();
  let joeBalance = joeToken.balanceOf(xJoeAddress).toBigDecimal();

  let rate = xJoeTotalSupply.div(joeBalance);

  return rate;
}

function getMemoRate(): BigDecimal {
  let contract = WMEMOContract.bind(TOKEN_WMEMO);
  return contract
    .MEMOTowMEMO(BigInt.fromI32(10).pow(9))
    .toBigDecimal()
    .div(pow10(BigInt.fromI32(18)));
}

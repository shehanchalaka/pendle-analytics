import { BigDecimal, BigInt, Address } from "@graphprotocol/graph-ts";
import { ICToken as ICTokenContract } from "../../../generated/templates/IPendleForge/ICToken";
import { IWXBTRFLY as IWXBTRFLYContract } from "../../../generated/templates/IPendleForge/IWXBTRFLY";
import { Token } from "../../../generated/schema";
import { ONE_BD, ZERO_BD } from "../../utils/constants";
import { getGenericTokenPrice } from "../generic";
import { pow10 } from "../../utils/math";
import { loadToken } from "../../entities/token";
import { TOKEN_WXBTRFLY } from "../../utils/constants/ethereum";

export function getYieldBearingTokenPrice(token: Token): BigDecimal {
  let underlyingToken = loadToken(token.underlyingToken!);
  let underlyingPrice = getGenericTokenPrice(underlyingToken.id);

  if (token.forgeId.startsWith("Aave")) {
    return underlyingPrice;
  }

  if (token.forgeId.startsWith("Compound")) {
    let COMPOUND_EXCHANGE_RATE_DECIMAL = BigInt.fromI32(10)
      .pow(18)
      .toBigDecimal();

    let contract = ICTokenContract.bind(Address.fromString(token.id));
    let rate = contract
      .exchangeRateCurrent()
      .toBigDecimal()
      .div(COMPOUND_EXCHANGE_RATE_DECIMAL)
      .div(pow10(underlyingToken.decimals.minus(token.decimals)));

    return underlyingPrice.times(rate);
  }

  if (token.forgeId.startsWith("Redacted")) {
    let contract = IWXBTRFLYContract.bind(TOKEN_WXBTRFLY);
    let rate = contract
      .wBTRFLYValue(BigInt.fromI32(10).pow(9))
      .toBigDecimal()
      .div(pow10(BigInt.fromI32(18)));

    return underlyingPrice.times(rate);
  }

  return ZERO_BD;
}

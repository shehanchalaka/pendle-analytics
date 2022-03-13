import { BigDecimal, BigInt, Address } from "@graphprotocol/graph-ts";
import { ICToken as ICTokenContract } from "../../../generated/templates/IPendleForge/ICToken";
import { IWXBTRFLY as IWXBTRFLYContract } from "../../../generated/templates/IPendleForge/IWXBTRFLY";
import { Token } from "../../../generated/schema";
import { ONE_BD, ZERO_BD } from "../../utils/constants";
import { getGenericTokenPrice } from "../generic";
import { pow10 } from "../../utils/math";
import { loadToken } from "../../entities/token";
import { TOKEN_BTRFLY, TOKEN_WXBTRFLY } from "../../utils/constants/ethereum";
import { debug } from "../../utils/debug";

export function getYieldBearingTokenPrice(token: Token): BigDecimal {
  // STEP 1: Find the underlying token price
  let underlyingTokenAddress = token.underlyingToken;
  if (!underlyingTokenAddress) return ZERO_BD;

  // Change underlying token of rebasing tokens
  if (token.forgeId.startsWith("Redacted")) {
    underlyingTokenAddress = TOKEN_BTRFLY.toHexString();
  }

  let underlyingToken = loadToken(underlyingTokenAddress!);
  let underlyingPrice = getGenericTokenPrice(underlyingToken.id);

  // STEP 2: Find current rate
  if (token.forgeId.startsWith("Aave")) {
    return underlyingPrice;
  }

  if (token.forgeId.startsWith("Compound")) {
    let rate = getCTokenRate(token, underlyingToken);
    return underlyingPrice.times(rate);
  }

  if (token.forgeId.startsWith("Redacted")) {
    let rate = getBtrflyRate();
    debug(
      "BTRFLY price: " +
        underlyingPrice.toString() +
        ", index: " +
        rate.toString()
    );
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

function getBtrflyRate(): BigDecimal {
  let contract = IWXBTRFLYContract.bind(TOKEN_WXBTRFLY);
  return contract
    .wBTRFLYValue(BigInt.fromI32(10).pow(9))
    .toBigDecimal()
    .div(pow10(BigInt.fromI32(18)));
}

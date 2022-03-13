import { Address, BigDecimal } from "@graphprotocol/graph-ts";
import { ONE_BD, ZERO_BD } from "../../utils/constants";
import {
  POOL_MIM_TIME,
  POOL_USDC_WAVAX,
  POOL_WAVAX_X_PENDLE,
  TOKEN_MIM,
  TOKEN_PENDLE,
  TOKEN_TIME,
  TOKEN_USDC,
  TOKEN_WAVAX,
} from "../../utils/constants/avalanche";
import { getPriceOfTokenInPool as getPricefromTraderJoe } from "../traderJoe";

export function getGenericTokenPrice(id: string): BigDecimal {
  let tokenAddress = Address.fromString(id);

  if (tokenAddress == TOKEN_USDC) return ONE_BD;

  if (tokenAddress == TOKEN_MIM) return ONE_BD;

  if (tokenAddress == TOKEN_PENDLE) return getPendlePrice();

  if (tokenAddress == TOKEN_WAVAX) return getAvaxPrice();

  if (tokenAddress == TOKEN_TIME) return getTimePrice();

  return ZERO_BD;
}

function getAvaxPrice(): BigDecimal {
  return getPricefromTraderJoe(TOKEN_WAVAX.toHexString(), POOL_USDC_WAVAX);
}

function getPendlePrice(): BigDecimal {
  return getPricefromTraderJoe(TOKEN_PENDLE.toHexString(), POOL_WAVAX_X_PENDLE);
}

function getTimePrice(): BigDecimal {
  return getPricefromTraderJoe(TOKEN_TIME.toHexString(), POOL_MIM_TIME);
}

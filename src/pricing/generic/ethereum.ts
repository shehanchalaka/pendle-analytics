import { Address, BigDecimal } from "@graphprotocol/graph-ts";
import { ONE_BD, ZERO_BD } from "../../utils/constants";
import {
  POOL_PENDLE_X_WETH,
  POOL_USDC_X_WETH,
  POOL_WETH_X_BTRFLY,
  TOKEN_BTRFLY,
  TOKEN_DAI,
  TOKEN_PENDLE,
  TOKEN_USDC,
  TOKEN_WETH,
} from "../../utils/constants/ethereum";
import { getPriceOfTokenInPool as getPricefromSushiswap } from "../sushiswap";
import { getPriceOfTokenInPool as getPricefromUniswap } from "../uniswap";

export function getGenericTokenPrice(id: string): BigDecimal {
  let tokenAddress = Address.fromString(id);

  if (tokenAddress == TOKEN_USDC) return ONE_BD;

  if (tokenAddress == TOKEN_DAI) return ONE_BD;

  if (tokenAddress == TOKEN_PENDLE) return getPendlePrice();

  if (tokenAddress == TOKEN_WETH) return getEthPrice();

  if (tokenAddress == TOKEN_BTRFLY) return getBtrflyPrice();

  return ZERO_BD;
}

function getEthPrice(): BigDecimal {
  return getPricefromSushiswap(TOKEN_WETH.toHexString(), POOL_USDC_X_WETH);
}

function getPendlePrice(): BigDecimal {
  return getPricefromSushiswap(TOKEN_PENDLE.toHexString(), POOL_PENDLE_X_WETH);
}

function getBtrflyPrice(): BigDecimal {
  let priceInEth = getPricefromUniswap(
    TOKEN_BTRFLY.toHexString(),
    POOL_WETH_X_BTRFLY
  );
  let ethPrice = getEthPrice();
  return priceInEth.times(ethPrice);
}

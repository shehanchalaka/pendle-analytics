import { Address, BigDecimal, BigInt, TypedMap } from "@graphprotocol/graph-ts";

export const ZERO_BI = BigInt.fromI32(0);
export const ZERO_BD = BigDecimal.fromString("0");
export const ONE_BI = BigInt.fromI32(1);
export const ONE_BD = BigDecimal.fromString("1");
export let RONE_BD = BigInt.fromI32(2)
  .pow(40)
  .toBigDecimal();

export const PENDLE_AXAX_JOE_POOL = Address.fromString(
  "0x3acD2FF1c3450bc8a9765AfD8d0DeA8E40822c86"
);

export let PENDLE_ADDRESS = new TypedMap<string, string>();
PENDLE_ADDRESS.set("mainnet", "mainnet pendle address");
PENDLE_ADDRESS.set("avalache", "avalache pendle address");

export let WNATIVE_TOKEN_ADDRESS = new TypedMap<string, string>();
WNATIVE_TOKEN_ADDRESS.set(
  "mainnet",
  "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
); // WETH
WNATIVE_TOKEN_ADDRESS.set(
  "avalanche",
  "0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7"
); // WAVAX

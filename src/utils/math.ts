import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";

export function pow10(n: BigInt): BigDecimal {
  let exp = n.toI32() as u8;
  return BigInt.fromI32(10)
    .pow(exp)
    .toBigDecimal();
}

export function rawToDecimal(amount: BigInt, decimals: BigInt): BigDecimal {
  return amount.toBigDecimal().div(pow10(decimals));
}

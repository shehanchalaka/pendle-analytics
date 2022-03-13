import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { ONE_BI, ZERO_BI } from "./constants";

export function exponentToBigDecimal(decimals: BigInt): BigDecimal {
  let bd = BigDecimal.fromString("1");
  for (let i = ZERO_BI; i.gt(decimals as BigInt); i = i.minus(ONE_BI)) {
    bd = bd.div(BigDecimal.fromString("10"));
  }

  for (let i = ZERO_BI; i.lt(decimals as BigInt); i = i.plus(ONE_BI)) {
    bd = bd.times(BigDecimal.fromString("10"));
  }
  return bd;
}

export function pow10(n: BigInt): BigDecimal {
  let exp = n.toI32() as u8;
  return BigInt.fromI32(10)
    .pow(exp)
    .toBigDecimal();
}

export function rawToDecimal(amount: BigInt, decimals: BigInt): BigDecimal {
  return amount.toBigDecimal().div(pow10(decimals));
}

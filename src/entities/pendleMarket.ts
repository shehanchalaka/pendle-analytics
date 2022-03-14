import { Address, BigInt } from "@graphprotocol/graph-ts";
import { PendleMarket as PendleMarketContract } from "../../generated/PendleRouter/PendleMarket";

export function getMarketStartTime(marketAddress: string): BigInt {
  let contract = PendleMarketContract.bind(Address.fromString(marketAddress));
  let startTime = contract.try_lockStartTime();
  if (startTime.reverted) {
    return BigInt.fromI32(0);
  }
  return startTime.value;
}

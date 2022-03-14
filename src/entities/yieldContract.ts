import { BigInt } from "@graphprotocol/graph-ts";
import { YieldContract } from "../../generated/schema";
import { ZERO_BD, ZERO_BI } from "../utils/constants";

export function loadYieldContract(
  forgeId: string,
  expiry: BigInt,
  underlyingTokenAddress: string
): YieldContract {
  let id = `${forgeId}-${expiry.toString()}-${underlyingTokenAddress}`;
  let yieldContract = YieldContract.load(id);
  if (!yieldContract) {
    yieldContract = new YieldContract(id);
    yieldContract.forgeId = forgeId;
    yieldContract.expiry = expiry;
    yieldContract.underlyingToken = underlyingTokenAddress;
    yieldContract.mintedVolume = ZERO_BD;
    yieldContract.mintedVolumeUSD = ZERO_BD;
    yieldContract.mintCount = ZERO_BI;
    yieldContract.redeemedVolume = ZERO_BD;
    yieldContract.redeemedVolumeUSD = ZERO_BD;
    yieldContract.redeemCount = ZERO_BI;
    yieldContract.lockedVolume = ZERO_BD;
    yieldContract.lockedVolumeUSD = ZERO_BD;
    yieldContract.save();
  }
  return yieldContract;
}

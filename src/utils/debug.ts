import { BigInt } from "@graphprotocol/graph-ts";
import { DebugLog } from "../../generated/schema";
import { ONE_BI } from "./constants";

export function debug(message: string): void {
  let logId = getNextLogId();
  let debugLog = new DebugLog(logId);
  debugLog.message = message;
  debugLog.save();
}

function getNextLogId(): string {
  let debugLog = DebugLog.load("1");

  if (!debugLog) {
    debugLog = new DebugLog("1");
    debugLog.nextId = "2";
    debugLog.save();
  }

  let nextId = debugLog.nextId;

  debugLog.nextId = BigInt.fromString(debugLog.nextId)
    .plus(ONE_BI)
    .toString();
  debugLog.save();

  return nextId;
}

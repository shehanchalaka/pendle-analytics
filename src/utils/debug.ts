import { DebugLog } from "../../generated/schema";

export function debug(id: string, message: string): void {
  let debugLog = new DebugLog(id);
  debugLog.message = message;
  debugLog.save();
}

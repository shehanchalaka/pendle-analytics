import { Address } from "@graphprotocol/graph-ts";
import { Token } from "../../generated/schema";

let LP_WHITELIST: Address[] = [
  Address.fromString("0x37922c69b08babcceae735a31235c81f1d1e8e43"), // SLP PENDLE-WETH
  Address.fromString("0x397ff1542f962076d0bfe58ea045ffa2d347aca0"), // SLP USDC-WETH
  Address.fromString("0x3acd2ff1c3450bc8a9765afd8d0dea8e40822c86"), // JLP WAVAX-PENDLE
  Address.fromString("0xd82B9b055F79D1A244005406988f85ed970797ed"), // JLP TESTPENDLE-WAVAX
];

export function isOT(id: string): boolean {
  let token = Token.load(id);
  // token must already exist in the store
  if (!token || token.type != "ot") return false;

  return true;
}

export function isLP(id: string): boolean {
  if (LP_WHITELIST.includes(Address.fromString(id))) {
    return true;
  }
  return false;
}

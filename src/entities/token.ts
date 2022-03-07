import { Address, BigInt, BigDecimal } from "@graphprotocol/graph-ts";
import { Token, TokenAmount } from "../../generated/schema";
import { ERC20 } from "../../generated/templates/IPendleForge/ERC20";
import { ZERO_BD } from "../utils/constants";
import { getTokenPrice } from "../pricing";

export function loadToken(id: string): Token {
  let token = Token.load(id);
  if (!token) {
    token = new Token(id);
    token.symbol = getTokenSymbol(id);
    token.name = getTokenName(id);
    token.decimals = getTokenDecimals(id);
    token.totalSupply = ZERO_BD;
    token.forgeId = "unknown";
    token.type = "generic";
    token.save();
  }
  return token;
}

export function getTokenAmount(
  hash: string,
  token: Token,
  amount: BigDecimal
): TokenAmount {
  let tokenAmount = new TokenAmount(hash + "_" + token.id);
  tokenAmount.token = token.id;
  tokenAmount.amount = amount;
  let price = getTokenPrice(token);
  tokenAmount.amountUSD = amount.times(price);
  tokenAmount.save();

  return tokenAmount;
}

export function getTokenSymbol(id: string): string {
  let contract = ERC20.bind(Address.fromString(id));
  let result = contract.try_symbol();
  if (result.reverted) {
    return "Unknown";
  }
  return result.value;
}

export function getTokenName(id: string): string {
  let contract = ERC20.bind(Address.fromString(id));
  let result = contract.try_symbol();
  if (result.reverted) {
    return "Unknown";
  }
  return result.value;
}

export function getTokenDecimals(id: string): BigInt {
  let contract = ERC20.bind(Address.fromString(id));
  let result = contract.try_decimals();
  if (result.reverted) {
    return BigInt.fromI32(0);
  }
  return BigInt.fromI32(result.value);
}

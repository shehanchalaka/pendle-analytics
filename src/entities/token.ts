import { Address, BigInt, BigDecimal } from "@graphprotocol/graph-ts";
import { Token, TokenAmount } from "../../generated/schema";
import { ERC20 } from "../../generated/templates/IPendleForge/ERC20";
import { ZERO_BD } from "../utils/constants";
import { pow10 } from "../utils/math";
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

export class TokenUtils {
  private address: string;
  private contract: ERC20;
  private token: Token;

  constructor(id: string) {
    this.address = id;
    this.contract = ERC20.bind(Address.fromString(id));
    this.token = loadToken(id);
  }

  volumeOf(reserves: BigInt): BigDecimal {
    let decimals = this.getDecimals();
    return reserves.toBigDecimal().div(pow10(decimals));
  }

  getAddress(): Address {
    return Address.fromString(this.address);
  }

  getSymbol(): string {
    let result = this.contract.try_symbol();
    if (result.reverted) {
      return "Unknown";
    }
    return result.value;
  }

  getName(): string {
    let result = this.contract.try_name();
    if (result.reverted) {
      return "Unknown";
    }
    return result.value;
  }

  getDecimals(): BigInt {
    let result = this.contract.try_decimals();
    if (result.reverted) {
      return BigInt.fromI32(0);
    }
    return BigInt.fromI32(result.value);
  }

  getTotalSupply(): BigDecimal {
    let result = this.contract.try_totalSupply();
    if (result.reverted) {
      return BigDecimal.fromString("0");
    }
    let decimals = this.getDecimals();
    return result.value.toBigDecimal().div(pow10(decimals));
  }

  getType(): string {
    return this.token.type;
  }
}

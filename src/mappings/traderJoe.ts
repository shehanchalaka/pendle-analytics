import { PairCreated as PairCreatedEvent } from "../../generated/TraderJoeFactory/TraderJoeFactory";
import { Market, Token } from "../../generated/schema";
import { loadToken } from "../entities/token";
import { ZERO_BI } from "../utils/constants";
import { debug } from "../utils/debug";

function isOT(id: string): boolean {
  let token = Token.load(id);
  // token must already exist in the store
  if (!token || token.type != "ot") return false;

  return true;
}

export function handleTraderJoePairCreated(event: PairCreatedEvent): void {
  // save only OT tokens
  let token0 = event.params.token0.toHexString();
  let token1 = event.params.token1.toHexString();

  let otAddress = "";
  let quoteTokenAddress = "";

  if (isOT(token0)) {
    otAddress = token0;
    quoteTokenAddress = token1;
  }
  if (isOT(token1)) {
    otAddress = token1;
    quoteTokenAddress = token0;
  }
  // return if neither of the tokens are OT tokens
  if (otAddress === "") return;

  let market = new Market(event.params.pair.toHexString());
  market.block = event.block.number;
  market.timestamp = event.block.timestamp;

  let lp = loadToken(event.params.pair.toHexString());
  lp.type = "lp-ot";
  lp.save();

  let ot = loadToken(otAddress);
  ot.market = market.id;
  ot.save();

  let quoteToken = loadToken(quoteTokenAddress);

  market.type = "ot";
  market.token0 = token0;
  market.token1 = token1;
  market.baseToken = ot.id;
  market.quoteToken = quoteToken.id;
  market.expiry = ot.expiry;
  market.name = ot.symbol + " / " + quoteToken.symbol;
  market.swapCount = ZERO_BI;

  market.save();
}

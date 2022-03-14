import { Address, Bytes, BigInt, BigDecimal } from "@graphprotocol/graph-ts";
import {
  NewYieldContracts as NewYieldContractsEvent,
  MintYieldTokens as MintYieldTokensEvent,
  RedeemYieldToken as RedeemYieldTokenEvent,
} from "../../generated/templates/IPendleForge/IPendleForge";
import { Transaction } from "../../generated/schema";
import { loadToken, getTokenAmount } from "../entities/token";
import { rawToDecimal } from "../utils/math";
import { loadYieldContract } from "../entities/yieldContract";
import { loadUser } from "../entities/user";
import { isLP } from "../helpers";
import { ONE_BI } from "../utils/constants";

export function handleNewYieldContracts(event: NewYieldContractsEvent): void {
  let forgeId = event.params.forgeId.toString();
  let expiry = event.params.expiry;
  let underlyingTokenAddress = event.params.underlyingAsset.toHexString();
  let yieldBearingTokenAddress = event.params.yieldBearingAsset.toHexString();
  let otAddress = event.params.ot.toHexString();
  let ytAddress = event.params.xyt.toHexString();

  let yieldContract = loadYieldContract(
    forgeId,
    expiry,
    underlyingTokenAddress
  );

  let underlyingToken = loadToken(underlyingTokenAddress);
  if (isLP(underlyingToken.id)) {
    underlyingToken.type = "lp-ot";
    underlyingToken.save();
  }

  let yieldBearingToken = loadToken(yieldBearingTokenAddress);
  yieldBearingToken.forgeId = forgeId;
  if (isLP(yieldBearingToken.id)) {
    yieldBearingToken.type = "lp-ot";
  } else {
    yieldBearingToken.type = "yieldBearing";
  }
  yieldBearingToken.underlyingToken = underlyingToken.id;
  yieldBearingToken.save();

  let ot = loadToken(otAddress);
  ot.forgeId = forgeId;
  ot.expiry = expiry;
  ot.type = "ot";
  ot.underlyingToken = underlyingToken.id;
  ot.save();

  let yt = loadToken(ytAddress);
  yt.forgeId = forgeId;
  yt.expiry = expiry;
  yt.type = "yt";
  yt.underlyingToken = underlyingToken.id;
  yt.save();

  yieldContract.block = event.block.number;
  yieldContract.timestamp = event.block.timestamp;
  yieldContract.underlyingToken = underlyingToken.id;
  yieldContract.yieldBearingToken = yieldBearingToken.id;
  yieldContract.ot = ot.id;
  yieldContract.yt = yt.id;

  yieldContract.save();
}

export function handleMintYieldTokens(event: MintYieldTokensEvent): void {
  let hash = event.transaction.hash.toHexString();

  let transaction = new Transaction(hash + "-mint");
  transaction.hash = event.transaction.hash.toHexString();
  transaction.timestamp = event.block.timestamp;
  transaction.block = event.block.number;
  transaction.action = "mint";

  let user = loadUser(event.params.user.toHexString());
  transaction.user = user.id;

  let forgeId = event.params.forgeId.toString();
  let expiry = event.params.expiry;
  let underlyingTokenAddress = event.params.underlyingAsset.toHexString();

  // yield contract MUST exist at this point
  let yieldContract = loadYieldContract(
    forgeId,
    expiry,
    underlyingTokenAddress
  );

  transaction.yieldContract = yieldContract.id;

  let inToken = loadToken(yieldContract.yieldBearingToken);
  let yt = loadToken(yieldContract.yt);
  let ot = loadToken(yieldContract.ot);

  let inAmount = rawToDecimal(event.params.amountToTokenize, inToken.decimals);
  let ytAmount = rawToDecimal(event.params.amountTokenMinted, yt.decimals);
  let otAmount = rawToDecimal(event.params.amountTokenMinted, ot.decimals);

  let inTokenAmount = getTokenAmount(hash, inToken, inAmount);
  let ytTokenAmount = getTokenAmount(hash, yt, ytAmount);
  let otTokenAmount = getTokenAmount(hash, ot, otAmount);

  let inputs = transaction.inputs;
  inputs.push(inTokenAmount.id);
  transaction.inputs = inputs;

  let outputs = transaction.outputs;
  outputs.push(otTokenAmount.id);
  outputs.push(ytTokenAmount.id);
  transaction.outputs = outputs;

  transaction.amountUSD = inTokenAmount.amountUSD;

  transaction.save();

  yieldContract.mintCount = yieldContract.mintCount.plus(ONE_BI);
  yieldContract.mintedVolume = yieldContract.mintedVolume.plus(
    inTokenAmount.amount
  );
  yieldContract.mintedVolumeUSD = yieldContract.mintedVolumeUSD.plus(
    inTokenAmount.amountUSD
  );
  yieldContract.lockedVolume = yieldContract.lockedVolume.plus(
    inTokenAmount.amount
  );
  yieldContract.lockedVolumeUSD = yieldContract.lockedVolumeUSD.plus(
    inTokenAmount.amountUSD
  );
  yieldContract.save();
}

export function handleRedeemYieldToken(event: RedeemYieldTokenEvent): void {
  let hash = event.transaction.hash.toHexString();

  let transaction = new Transaction(hash + "-redeem");
  transaction.hash = event.transaction.hash.toHexString();
  transaction.timestamp = event.block.timestamp;
  transaction.block = event.block.number;
  transaction.action = "redeem";

  let user = loadUser(event.params.user.toHexString());
  transaction.user = user.id;

  let forgeId = event.params.forgeId.toString();
  let expiry = event.params.expiry;
  let underlyingTokenAddress = event.params.underlyingAsset.toHexString();

  // yield contract MUST exist at this point
  let yieldContract = loadYieldContract(
    forgeId,
    expiry,
    underlyingTokenAddress
  );

  transaction.yieldContract = yieldContract.id;

  let yt = loadToken(yieldContract.yt);
  let ot = loadToken(yieldContract.ot);
  let outToken = loadToken(yieldContract.yieldBearingToken);

  let ytAmount = rawToDecimal(event.params.amountToRedeem, yt.decimals);
  let otAmount = rawToDecimal(event.params.amountToRedeem, ot.decimals);
  let outAmount = rawToDecimal(event.params.redeemedAmount, outToken.decimals);

  let ytTokenAmount = getTokenAmount(hash, yt, ytAmount);
  let otTokenAmount = getTokenAmount(hash, ot, otAmount);
  let outTokenAmount = getTokenAmount(hash, outToken, outAmount);

  let inputs = transaction.inputs;
  inputs.push(otTokenAmount.id);
  // YT cannot be redeemed after expiry
  if (event.block.timestamp < expiry) {
    inputs.push(ytTokenAmount.id);
  }
  transaction.inputs = inputs;

  let outputs = transaction.outputs;
  outputs.push(outTokenAmount.id);
  transaction.outputs = outputs;

  transaction.amountUSD = otTokenAmount.amountUSD.plus(ytTokenAmount.amountUSD);

  transaction.save();

  yieldContract.redeemCount = yieldContract.redeemCount.plus(ONE_BI);
  yieldContract.redeemedVolume = yieldContract.redeemedVolume.plus(
    outTokenAmount.amount
  );
  yieldContract.redeemedVolumeUSD = yieldContract.redeemedVolumeUSD.plus(
    outTokenAmount.amountUSD
  );
  yieldContract.lockedVolume = yieldContract.lockedVolume.minus(
    outTokenAmount.amount
  );
  yieldContract.lockedVolumeUSD = yieldContract.lockedVolumeUSD.minus(
    outTokenAmount.amountUSD
  );
  yieldContract.save();
}

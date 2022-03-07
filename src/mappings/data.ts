import { ForgeAdded as ForgeAddedEvent } from "../../generated/PendleData/PendleData";
import { Forge } from "../../generated/schema";
import { IPendleForge as PendleForgeTemplate } from "../../generated/templates";

export function handleForgeAdded(event: ForgeAddedEvent): void {
  let forge = new Forge(event.params.forgeAddress.toHexString());
  forge.forgeId = event.params.forgeId.toString();
  forge.save();

  // create new YieldContract from template
  PendleForgeTemplate.create(event.params.forgeAddress);
}

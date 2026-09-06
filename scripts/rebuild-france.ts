import { rebuildFranceDaily } from "../src/lib/aggregates";

const count = rebuildFranceDaily();
console.log(`Indice France recalculé sur ${count} jours.`);

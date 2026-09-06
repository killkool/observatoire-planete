import { ingestMeteoFranceDaily } from "../src/lib/ingestMeteoFrance";

const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const [k, v = "true"] = arg.replace(/^--/, "").split("=");
  return [k, v];
}));

const currentYear = new Date().getFullYear();
const fromYear = Number(args.from || currentYear - 1);
const toYear = Number(args.to || currentYear);
const target = String(args.department || args.dept || "38").toUpperCase();

const mainlandDepartments = [
  ...Array.from({ length: 19 }, (_, i) => String(i + 1).padStart(2, "0")),
  "2A", "2B",
  ...Array.from({ length: 75 }, (_, i) => String(i + 21).padStart(2, "0"))
].filter((d) => d !== "20");

const departments = target === "FRANCE" || target === "ALL" ? mainlandDepartments : [target.padStart(2, "0")];

async function main() {

let total = 0;
for (const department of departments) {
  console.log(`\n[${department}] Import Météo-France ${fromYear}-${toYear} (source registry + checksum)...`);
  const result = await ingestMeteoFranceDaily(department, fromYear, toYear);
  total += result.rowsWritten;
  console.log(`  ressources: ${result.resources.length}, écrites: ${result.rowsWritten}, checksum identique ignoré: ${result.skippedUnchanged}`);
  if (result.minDate) console.log(`  période: ${result.minDate} → ${result.maxDate}`);
}

console.log(`\nTerminé : ${total.toLocaleString("fr-FR")} observations importées/mises à jour.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

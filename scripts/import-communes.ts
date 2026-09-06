import { ingestIsereCommunes } from "../src/lib/ingestCommunes";

const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const [k, v = "true"] = arg.replace(/^--/, "").split("=");
  return [k, v];
}));

async function main() {
  const mode = args.refresh === "true" ? "refresh" : "local-first";
  const result = await ingestIsereCommunes(mode);
  console.log(
    `${result.written} communes ${result.department} (${result.region}) — API ${result.communesApi}, sans centre ${result.skippedNoCentre} (${mode})`
  );
  console.log(result.attribution);
  console.log(`checksum ${result.checksum}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

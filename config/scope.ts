/**
 * Product scope flags. Global / ocean / worldwide search stay in the repo
 * but must not drive the V1 UI. Default: off.
 */
function envFlag(name: string, defaultValue = false): boolean {
  const raw = process.env[name];
  if (raw == null || raw === "") return defaultValue;
  return raw === "1" || raw.toLowerCase() === "true";
}

export const SCOPE = {
  ENABLE_GLOBAL_DATA: envFlag("ENABLE_GLOBAL_DATA", false),
  ENABLE_OCEAN: envFlag("ENABLE_OCEAN", false),
  ENABLE_GLOBAL_SEARCH: envFlag("ENABLE_GLOBAL_SEARCH", false)
} as const;

export type ScopeFlags = typeof SCOPE;

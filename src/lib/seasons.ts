export type SeasonCode = "HIVER" | "PRINTEMPS" | "ETE" | "AUTOMNE";

export function getSeason(date: string): { season: SeasonCode; seasonYear: number; label: string } {
  const [year, month] = date.split("-").map(Number);

  if (month === 12 || month <= 2) {
    const seasonYear = month === 12 ? year + 1 : year;
    return { season: "HIVER", seasonYear, label: `Hiver ${seasonYear - 1}-${seasonYear}` };
  }
  if (month <= 5) return { season: "PRINTEMPS", seasonYear: year, label: `Printemps ${year}` };
  if (month <= 8) return { season: "ETE", seasonYear: year, label: `Été ${year}` };
  return { season: "AUTOMNE", seasonYear: year, label: `Automne ${year}` };
}

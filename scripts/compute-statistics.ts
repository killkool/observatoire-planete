import { computeStationStatistics } from "../src/lib/computeStatistics";

const result = computeStationStatistics();
console.log(
  `stats ${result.methodVersion}: ${result.annualRows} années-station (${result.completeYears} complètes), ` +
    `${result.monthlyRows} mois-station (${result.completeMonths} complets), ` +
    `${result.seasonalRows} saisons-station (${result.completeSeasons} complètes), ` +
    `${result.normalRows} normales ${result.completeNormals} affichables, ` +
    `${result.dayOfYearRows} jours de l’année`
);

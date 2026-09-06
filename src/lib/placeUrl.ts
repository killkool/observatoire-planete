export type PlaceRef = {
  slug: string;
  name: string;
  insee_code: string;
  region_slug: string;
  department_slug: string;
};

const REGION_LABEL: Record<string, string> = {
  "auvergne-rhone-alpes": "Auvergne-Rhône-Alpes"
};

const DEPARTMENT_LABEL: Record<string, string> = {
  isere: "Isère"
};

export function regionLabel(slug: string): string {
  return REGION_LABEL[slug] || slug;
}

export function departmentLabel(slug: string): string {
  return DEPARTMENT_LABEL[slug] || slug;
}

export function communePath(place: Pick<PlaceRef, "region_slug" | "department_slug" | "slug">): string {
  return `/meteo/${place.region_slug}/${place.department_slug}/${place.slug}`;
}

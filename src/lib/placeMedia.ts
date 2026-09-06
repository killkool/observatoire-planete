export function placePhotoSrc(slug: string): string {
  if (slug === "grenoble" || slug === "crolles" || slug === "la-pierre") {
    return `/images/places/${slug}.jpg`;
  }
  return "/images/place-alps.png";
}

export const IGN_PHOTO_CREDIT = "Photo aérienne © IGN — Géoplateforme";

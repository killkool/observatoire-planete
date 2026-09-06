export function placePhotoSrc(slug: string): string {
  if (slug === "grenoble" || slug === "crolles" || slug === "la-pierre") {
    return `/images/places/${slug}.jpg`;
  }
  return "/images/place-alps.jpg";
}

export const IGN_PHOTO_CREDIT = "Photo aérienne © IGN — Géoplateforme";

/** Héros pleine largeur : ne pas demander 3840 px. */
export const HERO_IMAGE_SIZES = "(max-width: 650px) 100vw, 1480px";

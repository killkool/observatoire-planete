import { departmentLabel, regionLabel } from "./placeUrl";
import { publicAbsoluteUrl, publicSiteOrigin } from "./seoContent";

export const JSONLD_WEBSITE_ID = "#website";

export type CommuneJsonLdPlace = {
  name: string;
  slug: string;
  insee_code: string;
  latitude: number;
  longitude: number;
  region_slug: string;
  department_slug: string;
};

export type CommuneJsonLdObservation = {
  originType: string;
  date: string;
  tmin: number | null;
  tmax: number | null;
  precipitationMm: number | null;
  station: { id: string; name: string };
};

type JsonLdNode = Record<string, unknown>;

export function websiteJsonLd(): JsonLdNode {
  const origin = publicSiteOrigin();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${origin}/${JSONLD_WEBSITE_ID}`,
    name: "Observatoire Planète",
    url: `${origin}/`,
    inLanguage: "fr-FR",
    description:
      "Histoire météo de la France : températures, pluie, records et sources. Ce n’est pas une prévision."
  };
}

function observedProperties(observation: CommuneJsonLdObservation): JsonLdNode[] {
  const properties: JsonLdNode[] = [];
  if (observation.tmin != null) {
    properties.push({
      "@type": "PropertyValue",
      name: "tmin",
      value: observation.tmin,
      unitCode: "CEL"
    });
  }
  if (observation.tmax != null) {
    properties.push({
      "@type": "PropertyValue",
      name: "tmax",
      value: observation.tmax,
      unitCode: "CEL"
    });
  }
  if (observation.precipitationMm != null) {
    properties.push({
      "@type": "PropertyValue",
      name: "precipitation",
      value: observation.precipitationMm,
      unitText: "mm"
    });
  }
  return properties;
}

export function communeJsonLd(input: {
  place: CommuneJsonLdPlace;
  path: string;
  title: string;
  description: string;
  observation?: CommuneJsonLdObservation | null;
}): JsonLdNode {
  const url = publicAbsoluteUrl(input.path);
  const origin = publicSiteOrigin();
  const placeId = `${url}#place`;
  const measured =
    input.observation?.originType === "OBSERVED" ? observedProperties(input.observation) : [];
  const graph: JsonLdNode[] = [
    {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: input.title,
      description: input.description,
      inLanguage: "fr-FR",
      isPartOf: { "@id": `${origin}/${JSONLD_WEBSITE_ID}` },
      about: { "@id": placeId },
      breadcrumb: { "@id": `${url}#breadcrumb` }
    },
    {
      "@type": "City",
      "@id": placeId,
      name: input.place.name,
      identifier: {
        "@type": "PropertyValue",
        propertyID: "INSEE",
        value: input.place.insee_code
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: input.place.latitude,
        longitude: input.place.longitude
      },
      containedInPlace: {
        "@type": "AdministrativeArea",
        name: departmentLabel(input.place.department_slug)
      },
      additionalProperty: {
        "@type": "PropertyValue",
        name: "région",
        value: regionLabel(input.place.region_slug)
      }
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Accueil",
          item: `${origin}/`
        },
        {
          "@type": "ListItem",
          position: 2,
          name: input.place.name,
          item: url
        }
      ]
    }
  ];

  if (input.observation?.originType === "OBSERVED" && measured.length) {
    graph.push({
      "@type": "WeatherObservation",
      "@id": `${url}#observation`,
      name: "Mesure officielle",
      observationDate: input.observation.date,
      observationAbout: { "@id": placeId },
      measuredFrom: {
        "@type": "WeatherStation",
        identifier: input.observation.station.id,
        name: input.observation.station.name
      },
      additionalProperty: measured
    });
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph
  };
}

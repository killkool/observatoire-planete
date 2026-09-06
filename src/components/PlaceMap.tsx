"use client";

import { useEffect, useRef, useState } from "react";
import { LngLatBounds, Map as MapLibreMap, Marker, NavigationControl, Popup } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const IGN_ORTHO = "/api/tiles/ign/ortho/{z}/{y}/{x}";
const IGN_PLAN = "/api/tiles/ign/plan/{z}/{y}/{x}";

type Nearby = {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
};

const EMPTY_NEARBY: Nearby[] = [];

type Pin = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  kind: "place" | "station" | "nearby";
};

export default function PlaceMap({
  placeName,
  placeLat,
  placeLon,
  station,
  nearby = EMPTY_NEARBY
}: {
  placeName: string;
  placeLat: number;
  placeLon: number;
  station?: { id: string; name: string; latitude: number | null; longitude: number | null } | null;
  nearby?: Nearby[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [basemap, setBasemap] = useState<"ortho" | "plan">("ortho");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = new MapLibreMap({
      container: ref.current,
      attributionControl: { compact: true },
      style: {
        version: 8,
        sources: {
          "ign-ortho": {
            type: "raster",
            tiles: [IGN_ORTHO],
            tileSize: 256,
            minzoom: 12,
            maxzoom: 14,
            attribution: "© IGN — Géoplateforme, orthophotographie"
          },
          "ign-plan": {
            type: "raster",
            tiles: [IGN_PLAN],
            tileSize: 256,
            minzoom: 12,
            maxzoom: 14,
            attribution: "© IGN — Géoplateforme, Plan IGN"
          }
        },
        layers: [
          { id: "ign-ortho", type: "raster", source: "ign-ortho" },
          { id: "ign-plan", type: "raster", source: "ign-plan", layout: { visibility: "none" } }
        ]
      },
      center: [placeLon, placeLat],
      zoom: 12,
      minZoom: 12,
      maxZoom: 14
    });
    map.addControl(new NavigationControl({ showCompass: false }), "top-right");
    map.on("load", () => setReady(true));
    mapRef.current = map;
    return () => {
      setReady(false);
      map.remove();
      mapRef.current = null;
    };
  }, [placeLat, placeLon]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    map.setLayoutProperty("ign-ortho", "visibility", basemap === "ortho" ? "visible" : "none");
    map.setLayoutProperty("ign-plan", "visibility", basemap === "plan" ? "visible" : "none");
  }, [basemap, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const pins: Pin[] = [{ id: "place", name: placeName, latitude: placeLat, longitude: placeLon, kind: "place" }];
    if (station?.latitude != null && station.longitude != null) {
      pins.push({
        id: station.id,
        name: `Station ${station.name}`,
        latitude: station.latitude,
        longitude: station.longitude,
        kind: "station"
      });
    }
    for (const item of nearby) {
      if (item.latitude == null || item.longitude == null) continue;
      if (station?.id && item.id === station.id) continue;
      pins.push({
        id: item.id,
        name: item.name,
        latitude: item.latitude,
        longitude: item.longitude,
        kind: "nearby"
      });
    }

    const markers = pins.map((item) => {
      const el = document.createElement("div");
      el.className = `mapPin mapPin-${item.kind}`;
      el.title = item.name;
      el.innerHTML = `<span></span>`;
      return new Marker({ element: el })
        .setLngLat([item.longitude, item.latitude])
        .setPopup(new Popup({ closeButton: false, className: "mapPopup" }).setText(item.name))
        .addTo(map);
    });

    if (pins.length > 1) {
      const bounds = new LngLatBounds([pins[0].longitude, pins[0].latitude], [pins[0].longitude, pins[0].latitude]);
      for (const pin of pins) bounds.extend([pin.longitude, pin.latitude]);
      map.fitBounds(bounds, { padding: 72, maxZoom: 14, duration: 600 });
    } else {
      map.setCenter([placeLon, placeLat]);
      map.setZoom(13);
    }

    return () => {
      markers.forEach((marker) => marker.remove());
    };
  }, [ready, placeName, placeLat, placeLon, station?.id, station?.latitude, station?.longitude, station?.name, nearby]);

  return (
    <div className="mapWrap">
      <div className="mapToolbar">
        <button type="button" className={basemap === "ortho" ? "on" : ""} onClick={() => setBasemap("ortho")}>
          Photo IGN
        </button>
        <button type="button" className={basemap === "plan" ? "on" : ""} onClick={() => setBasemap("plan")}>
          Plan IGN
        </button>
      </div>
      <div ref={ref} className="mapCanvas" />
      <p className="mapLegend">
        <i className="mapPin mapPin-place" /> lieu
        <i className="mapPin mapPin-station" /> station du jour
        <i className="mapPin mapPin-nearby" /> autres postes
      </p>
    </div>
  );
}

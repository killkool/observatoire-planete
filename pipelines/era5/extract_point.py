"""Extract one ERA5 grid cell for one UTC day. France bbox only. No invented values."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import xarray as xr

ARCO_ZARR = "gs://gcp-public-data-arco-era5/ar/full_37-1h-0p25deg-chunk-1.zarr-v3"
SOURCE_ID = "copernicus.c3s.era5.single-levels-hourly"
METHOD = "nearest"
METHOD_VERSION = "era5-point-nearest-hourly-2t-d2m-minmax-v1"
DOI = "10.24381/cds.adbb2d47"
# Aligné sur docs/V1_DATA_VOLUME.md (~41–51°N, 5°W–10°E) + petit buffer.
FRANCE_LAT = (41.0, 51.5)
FRANCE_LON = (-5.5, 10.0)
T2M_NAMES = ("2m_temperature", "t2m", "2t")
D2M_NAMES = ("2m_dewpoint_temperature", "2m_dewpoint", "d2m", "2d")


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()


def assert_in_france(lat: float, lon: float) -> None:
    if not (FRANCE_LAT[0] <= lat <= FRANCE_LAT[1] and FRANCE_LON[0] <= lon <= FRANCE_LON[1]):
        raise SystemExit(
            f"Point hors bbox France V1 ({FRANCE_LAT[0]}–{FRANCE_LAT[1]}°N, "
            f"{FRANCE_LON[0]}–{FRANCE_LON[1]}°E) : {lat}, {lon}. Pas d'extraction mondiale."
        )


def open_era5():
    return xr.open_zarr(ARCO_ZARR, storage_options={"token": "anon"})


def pick_var(ds: xr.Dataset, names: tuple[str, ...], label: str) -> xr.DataArray:
    for name in names:
        if name in ds:
            return ds[name]
    raise SystemExit(f"Variable {label} absente. Cherché {names}. Variables: {list(ds.data_vars)[:40]}")


def coord_name(da: xr.DataArray, *candidates: str) -> str:
    for name in candidates:
        if name in da.coords or name in da.dims:
            return name
    raise SystemExit(f"Coordonnée introuvable parmi {candidates}: {list(da.coords)}")


def load_day_point(da: xr.DataArray, lat: float, lon: float, date: str, label: str) -> tuple[list[float], list[str], float, float]:
    time_name = coord_name(da, "time", "valid_time")
    lat_name = coord_name(da, "latitude", "lat")
    lon_name = coord_name(da, "longitude", "lon")
    sliced = da.sel(
        {
            time_name: slice(
                np.datetime64(f"{date}T00:00:00"),
                np.datetime64(f"{date}T23:59:59"),
            )
        }
    )
    if sliced[time_name].size == 0:
        raise SystemExit(f"Aucune heure ERA5 {label} pour {date}")

    point = sliced.sel({lat_name: lat, lon_name: lon}, method="nearest").load()
    values = point.astype("float64").values
    if values.size == 0 or np.all(np.isnan(values)):
        raise SystemExit(f"Extraction {label} vide : aucune valeur Kelvin.")

    hours_k = [float(v) for v in np.ravel(values) if np.isfinite(v)]
    if len(hours_k) < 20:
        raise SystemExit(f"Trop peu d'heures {label} ({len(hours_k)}) pour un min/max quotidien.")

    times = [str(np.datetime_as_string(t, unit="s")) for t in point[time_name].values]
    grid_lat = float(point[lat_name].values)
    grid_lon = float(point[lon_name].values)
    return hours_k, times, grid_lat, grid_lon


def daily_points(date: str, hours_k: list[float], vmin_id: str, vmax_id: str, vmean_id: str) -> list[dict]:
    return [
        {"date": date, "variable_id": vmin_id, "value": min(hours_k), "unit": "K"},
        {"date": date, "variable_id": vmax_id, "value": max(hours_k), "unit": "K"},
        {"date": date, "variable_id": vmean_id, "value": sum(hours_k) / len(hours_k), "unit": "K"},
    ]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--lat", type=float, default=45.1885)
    parser.add_argument("--lon", type=float, default=5.7245)
    parser.add_argument("--date", default="1983-05-12")
    parser.add_argument(
        "--out",
        default=str(Path(__file__).resolve().parent / "extracts" / "grenoble-1983-05-12.json"),
    )
    parser.add_argument("--bbox-only", action="store_true", help="Vérifie la bbox France, n'ouvre pas ARCO.")
    args = parser.parse_args()
    assert_in_france(args.lat, args.lon)
    if args.bbox_only:
        print(f"bbox France ok {args.lat},{args.lon}")
        return

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    ds = open_era5()
    t2m = pick_var(ds, T2M_NAMES, "2m_temperature")
    d2m = pick_var(ds, D2M_NAMES, "2m_dewpoint_temperature")
    hours_2t, times, grid_lat, grid_lon = load_day_point(t2m, args.lat, args.lon, args.date, "2t")
    hours_d2m, times_d2m, grid_lat_d, grid_lon_d = load_day_point(d2m, args.lat, args.lon, args.date, "d2m")
    if (grid_lat, grid_lon) != (grid_lat_d, grid_lon_d):
        raise SystemExit(f"Maille 2t {grid_lat},{grid_lon} ≠ d2m {grid_lat_d},{grid_lon_d}")
    if times != times_d2m:
        raise SystemExit("Heures UTC 2t et d2m différentes : pas de mélange.")

    attrs = dict(ds.attrs)
    era5_stop = str(attrs.get("valid_time_stop") or attrs.get("valid_time_stop_era5") or "")
    dataset_version = "ERA5"
    if era5_stop and args.date > era5_stop[:10]:
        dataset_version = "ERA5T"

    payload = {
        "source_id": SOURCE_ID,
        "dataset_version": dataset_version,
        "method": METHOD,
        "method_version": METHOD_VERSION,
        "doi": DOI,
        "access": {
            "kind": "arco-era5-public-zarr",
            "uri": ARCO_ZARR,
            "note": "Copie analysis-ready du jeu ERA5 C3S (même DOI). Pas une autre réanalyse.",
        },
        "latitude": args.lat,
        "longitude": args.lon,
        "grid_latitude": round(grid_lat, 4),
        "grid_longitude": round(grid_lon, 4),
        "date": args.date,
        "hours_used": len(hours_2t),
        "hourly_times_utc": times,
        "hourly_2t_K": [round(v, 4) for v in hours_2t],
        "hourly_d2m_K": [round(v, 4) for v in hours_d2m],
        "extracted_at": datetime.now(timezone.utc).isoformat(),
        "points": daily_points(args.date, hours_2t, "air_temperature_min", "air_temperature_max", "air_temperature")
        + daily_points(args.date, hours_d2m, "dew_point_min", "dew_point_max", "dew_point"),
    }

    text = json.dumps(payload, indent=2, ensure_ascii=False)
    out_path.write_text(text + "\n", encoding="utf-8")
    checksum = sha256_file(out_path)

    tmin_k, tmax_k = min(hours_2t), max(hours_2t)
    dmin_k, dmax_k = min(hours_d2m), max(hours_d2m)
    print(f"wrote {out_path}", flush=True)
    print(f"grid nearest {grid_lat},{grid_lon} hours={len(hours_2t)} tmin_K={tmin_k:.4f} tmax_K={tmax_k:.4f}", flush=True)
    print(f"d2m min_K={dmin_k:.4f} max_K={dmax_k:.4f}", flush=True)
    print(f"sha256 {checksum}", flush=True)
    ds.close()
    os._exit(0)


if __name__ == "__main__":
    main()

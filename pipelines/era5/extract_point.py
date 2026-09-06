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
METHOD_VERSION = "era5-point-nearest-hourly-2t-d2m-tp-v1"
FRANCE_DAILY_METHOD = "bbox_daily_minmax"
FRANCE_DAILY_METHOD_VERSION = "era5-france-daily-2t-minmax-v1"
DOI = "10.24381/cds.adbb2d47"
# Aligné sur docs/V1_DATA_VOLUME.md (~41–51°N, 5°W–10°E) + petit buffer.
FRANCE_LAT = (41.0, 51.5)
FRANCE_LON = (-5.5, 10.0)
T2M_NAMES = ("2m_temperature", "t2m", "2t")
D2M_NAMES = ("2m_dewpoint_temperature", "2m_dewpoint", "d2m", "2d")
TP_NAMES = ("total_precipitation", "tp")
# Preuve déjà extraite (même miroir, même jour, maille 45,25 / 5,75). Échec si ARCO diverge.
GRENOBLE_GRID = (45.25, 5.75)
GRENOBLE_TMIN_K = 276.5640
GRENOBLE_TMAX_K = 287.3429
EXPECTED_FRANCE_CELLS = 43 * 63  # 0,25° sur la bbox V1 inclusive


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


def signed_longitude(lon: float | np.ndarray) -> float | np.ndarray:
    """ARCO longitude = 0–359,75. La bbox France a besoin de 5,5°W = 354,5°."""
    arr = np.asarray(lon, dtype="float64")
    wrapped = np.where(arr > 180.0, arr - 360.0, arr)
    if np.ndim(lon) == 0:
        return float(wrapped)
    return wrapped


def load_day(da: xr.DataArray, date: str, label: str) -> xr.DataArray:
    time_name = coord_name(da, "time", "valid_time")
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
    return sliced.load()


def point_from_day(day: xr.DataArray, lat: float, lon: float, label: str) -> tuple[list[float], list[str], float, float]:
    lat_name = coord_name(day, "latitude", "lat")
    lon_name = coord_name(day, "longitude", "lon")
    time_name = coord_name(day, "time", "valid_time")
    point = day.sel({lat_name: lat, lon_name: lon}, method="nearest")
    values = np.asarray(point.astype("float64").values)
    if values.size == 0 or np.all(np.isnan(values)):
        raise SystemExit(f"Extraction {label} vide : aucune valeur.")

    hours = [float(v) for v in np.ravel(values) if np.isfinite(v)]
    if len(hours) < 20:
        raise SystemExit(f"Trop peu d'heures {label} ({len(hours)}) pour un agrégat quotidien.")

    times = [str(np.datetime_as_string(t, unit="s")) for t in point[time_name].values]
    grid_lat = float(point[lat_name].values)
    grid_lon = float(signed_longitude(float(point[lon_name].values)))
    return hours, times, grid_lat, grid_lon


def load_day_point(da: xr.DataArray, lat: float, lon: float, date: str, label: str) -> tuple[list[float], list[str], float, float]:
    return point_from_day(load_day(da, date, label), lat, lon, label)


def daily_points(date: str, hours_k: list[float], vmin_id: str, vmax_id: str, vmean_id: str) -> list[dict]:
    return [
        {"date": date, "variable_id": vmin_id, "value": min(hours_k), "unit": "K"},
        {"date": date, "variable_id": vmax_id, "value": max(hours_k), "unit": "K"},
        {"date": date, "variable_id": vmean_id, "value": sum(hours_k) / len(hours_k), "unit": "K"},
    ]


def daily_precip_point(date: str, hours_m: list[float]) -> dict:
    if any(v < -1e-12 for v in hours_m):
        raise SystemExit("total_precipitation négative : extraction refusée.")
    # ARCO ar/full : accumulation horaire (m), série non monotone. Pas last−first (cumul de step CDS).
    # Un 0 horaire est un zéro du modèle, pas un NULL.
    return {"date": date, "variable_id": "precipitation", "value": float(sum(hours_m)), "unit": "m"}


def france_daily_2t(day_2t: xr.DataArray, date: str, hours_2t: list[float], grid_lat: float, grid_lon: float) -> dict:
    lat_name = coord_name(day_2t, "latitude", "lat")
    lon_name = coord_name(day_2t, "longitude", "lon")
    time_name = coord_name(day_2t, "time", "valid_time")
    lats = np.asarray(day_2t[lat_name].values, dtype="float64")
    lons_signed = signed_longitude(day_2t[lon_name].values)
    assert isinstance(lons_signed, np.ndarray)
    lat_idx = np.where((lats >= FRANCE_LAT[0]) & (lats <= FRANCE_LAT[1]))[0]
    lon_idx = np.where((lons_signed >= FRANCE_LON[0]) & (lons_signed <= FRANCE_LON[1]))[0]
    lon_idx = lon_idx[np.argsort(lons_signed[lon_idx])]
    if lat_idx.size == 0 or lon_idx.size == 0:
        raise SystemExit("Subset France vide : bbox sans maille.")

    subset = day_2t.isel({lat_name: lat_idx.tolist(), lon_name: lon_idx.tolist()})
    subset = subset.transpose(time_name, lat_name, lon_name)
    values = np.asarray(subset.astype("float64").values)
    if not np.all(np.isfinite(values)):
        raise SystemExit("NaN dans le subset France 2t : pas de substitution par 0.")

    tmin = np.min(values, axis=0)
    tmax = np.max(values, axis=0)
    lat_sub = lats[lat_idx]
    lon_sub = lons_signed[lon_idx]
    cell_count = int(lat_sub.size * lon_sub.size)
    if cell_count != EXPECTED_FRANCE_CELLS:
        raise SystemExit(f"cell_count France {cell_count} ≠ {EXPECTED_FRANCE_CELLS} (grille 0,25° bbox V1).")

    gi = np.where(np.isclose(lat_sub, GRENOBLE_GRID[0], atol=1e-6))[0]
    gj = np.where(np.isclose(lon_sub, GRENOBLE_GRID[1], atol=1e-6))[0]
    if gi.size != 1 or gj.size != 1:
        raise SystemExit("Maille Grenoble 45,25 / 5,75 absente du subset France.")
    g_tmin = float(tmin[int(gi[0]), int(gj[0])])
    g_tmax = float(tmax[int(gi[0]), int(gj[0])])
    if round(g_tmin, 4) != GRENOBLE_TMIN_K or round(g_tmax, 4) != GRENOBLE_TMAX_K:
        raise SystemExit(
            f"Subset France maille Grenoble {g_tmin:.4f}/{g_tmax:.4f} K ≠ preuve "
            f"{GRENOBLE_TMIN_K}/{GRENOBLE_TMAX_K} K."
        )
    if round(g_tmin, 4) != round(min(hours_2t), 4) or round(g_tmax, 4) != round(max(hours_2t), 4):
        raise SystemExit("Subset France ≠ point Grenoble (même 2t chargé) : pas de mélange.")
    if round(grid_lat, 4) != GRENOBLE_GRID[0] or round(grid_lon, 4) != GRENOBLE_GRID[1]:
        raise SystemExit(f"Point nearest {grid_lat},{grid_lon} ≠ maille preuve {GRENOBLE_GRID}.")

    return {
        "source_id": SOURCE_ID,
        "dataset_version": "ERA5",
        "method": FRANCE_DAILY_METHOD,
        "method_version": FRANCE_DAILY_METHOD_VERSION,
        "doi": DOI,
        "access": {
            "kind": "arco-era5-public-zarr",
            "uri": ARCO_ZARR,
            "note": (
                "Copie analysis-ready du jeu ERA5 C3S (même DOI). Pas une autre réanalyse. "
                "Chunks ARCO (1, 721, 1440) = 1 h × globe : un jour 2t télécharge 24 tranches horaires "
                "mondiales ; seules les mailles France (min/max journaliers) sont stockées. "
                "Pas l'archive 1940–2026, pas la grille horaire, pas un dump SQL."
            ),
        },
        "bbox": {
            "lat_min": FRANCE_LAT[0],
            "lat_max": FRANCE_LAT[1],
            "lon_min": FRANCE_LON[0],
            "lon_max": FRANCE_LON[1],
        },
        "date": date,
        "hours_used": int(subset.sizes[time_name]),
        "cell_count": cell_count,
        "latitude": [round(float(v), 4) for v in lat_sub],
        "longitude": [round(float(v), 4) for v in lon_sub],
        "tmin_K": np.round(tmin, 4).tolist(),
        "tmax_K": np.round(tmax, 4).tolist(),
        "grenoble_cell": {
            "latitude": GRENOBLE_GRID[0],
            "longitude": GRENOBLE_GRID[1],
            "tmin_K": g_tmin,
            "tmax_K": g_tmax,
        },
        "extracted_at": datetime.now(timezone.utc).isoformat(),
    }


def dataset_version_for(ds: xr.Dataset, date: str) -> str:
    attrs = dict(ds.attrs)
    era5_stop = str(attrs.get("valid_time_stop") or attrs.get("valid_time_stop_era5") or "")
    if era5_stop and date > era5_stop[:10]:
        return "ERA5T"
    return "ERA5"


def write_json(path: Path, payload: dict) -> str:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return sha256_file(path)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--lat", type=float, default=45.1885)
    parser.add_argument("--lon", type=float, default=5.7245)
    parser.add_argument("--date", default="1983-05-12")
    parser.add_argument(
        "--out",
        default=str(Path(__file__).resolve().parent / "extracts" / "grenoble-1983-05-12.json"),
    )
    parser.add_argument(
        "--france-out",
        default=str(Path(__file__).resolve().parent / "extracts" / "france-1983-05-12-2t-daily.json"),
    )
    parser.add_argument("--skip-france-daily", action="store_true", help="N'écrit pas le quotidien bbox France.")
    parser.add_argument("--bbox-only", action="store_true", help="Vérifie la bbox France, n'ouvre pas ARCO.")
    args = parser.parse_args()
    assert_in_france(args.lat, args.lon)
    if args.bbox_only:
        print(f"bbox France ok {args.lat},{args.lon}")
        return

    out_path = Path(args.out)
    france_path = Path(args.france_out)

    ds = open_era5()
    t2m = pick_var(ds, T2M_NAMES, "2m_temperature")
    d2m = pick_var(ds, D2M_NAMES, "2m_dewpoint_temperature")
    tp = pick_var(ds, TP_NAMES, "total_precipitation")

    day_2t = load_day(t2m, args.date, "2t")
    hours_2t, times, grid_lat, grid_lon = point_from_day(day_2t, args.lat, args.lon, "2t")
    hours_d2m, times_d2m, grid_lat_d, grid_lon_d = load_day_point(d2m, args.lat, args.lon, args.date, "d2m")
    hours_tp, times_tp, grid_lat_p, grid_lon_p = load_day_point(tp, args.lat, args.lon, args.date, "tp")
    if (grid_lat, grid_lon) != (grid_lat_d, grid_lon_d) or (grid_lat, grid_lon) != (grid_lat_p, grid_lon_p):
        raise SystemExit(f"Maille 2t {grid_lat},{grid_lon} ≠ d2m {grid_lat_d},{grid_lon_d} ≠ tp {grid_lat_p},{grid_lon_p}")
    if times != times_d2m or times != times_tp:
        raise SystemExit("Heures UTC 2t / d2m / tp différentes : pas de mélange.")

    precip = daily_precip_point(args.date, hours_tp)
    dataset_version = dataset_version_for(ds, args.date)

    payload = {
        "source_id": SOURCE_ID,
        "dataset_version": dataset_version,
        "method": METHOD,
        "method_version": METHOD_VERSION,
        "doi": DOI,
        "access": {
            "kind": "arco-era5-public-zarr",
            "uri": ARCO_ZARR,
            "note": (
                "Copie analysis-ready du jeu ERA5 C3S (même DOI). Pas une autre réanalyse. "
                "total_precipitation ARCO = mètres par pas horaire (non monotone) ; "
                "cumul journalier UTC = somme des 24 pas, pas last−first."
            ),
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
        "hourly_tp_m": [float(v) for v in hours_tp],
        "extracted_at": datetime.now(timezone.utc).isoformat(),
        "points": daily_points(args.date, hours_2t, "air_temperature_min", "air_temperature_max", "air_temperature")
        + daily_points(args.date, hours_d2m, "dew_point_min", "dew_point_max", "dew_point")
        + [precip],
    }

    checksum = write_json(out_path, payload)
    tmin_k, tmax_k = min(hours_2t), max(hours_2t)
    dmin_k, dmax_k = min(hours_d2m), max(hours_d2m)
    tp_mm = precip["value"] * 1000.0
    print(f"wrote {out_path}", flush=True)
    print(f"grid nearest {grid_lat},{grid_lon} hours={len(hours_2t)} tmin_K={tmin_k:.4f} tmax_K={tmax_k:.4f}", flush=True)
    print(f"d2m min_K={dmin_k:.4f} max_K={dmax_k:.4f}", flush=True)
    print(f"tp_sum_m={precip['value']:.10f} tp_mm={tp_mm:.4f}", flush=True)
    print(f"sha256 {checksum}", flush=True)

    if not args.skip_france_daily:
        france_payload = france_daily_2t(day_2t, args.date, hours_2t, grid_lat, grid_lon)
        france_payload["dataset_version"] = dataset_version
        france_checksum = write_json(france_path, france_payload)
        print(f"wrote {france_path}", flush=True)
        print(f"france_cells={france_payload['cell_count']} grenoble_tmin_K={france_payload['grenoble_cell']['tmin_K']:.4f}", flush=True)
        print(f"france_sha256 {france_checksum}", flush=True)

    ds.close()
    os._exit(0)


if __name__ == "__main__":
    main()

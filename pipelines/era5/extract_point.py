"""Extract ERA5 at one France point, or a few daily 2t France-bbox days. No invented values."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import math
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import xarray as xr

ARCO_ZARR = "gs://gcp-public-data-arco-era5/ar/full_37-1h-0p25deg-chunk-1.zarr-v3"
SOURCE_ID = "copernicus.c3s.era5.single-levels-hourly"
METHOD = "nearest"
METHOD_VERSION = "era5-point-nearest-hourly-2t-d2m-tp-uv10-msl-sp-sd-ssrd-i10fg-v1"
FRANCE_DAILY_METHOD = "bbox_daily_minmax"
FRANCE_DAILY_METHOD_VERSION = "era5-france-daily-2t-minmax-v1"
DOI = "10.24381/cds.adbb2d47"
# Aligné sur docs/V1_DATA_VOLUME.md (~41–51°N, 5°W–10°E) + petit buffer.
FRANCE_LAT = (41.0, 51.5)
FRANCE_LON = (-5.5, 10.0)
T2M_NAMES = ("2m_temperature", "t2m", "2t")
D2M_NAMES = ("2m_dewpoint_temperature", "2m_dewpoint", "d2m", "2d")
TP_NAMES = ("total_precipitation", "tp")
U10_NAMES = ("10m_u_component_of_wind",)
V10_NAMES = ("10m_v_component_of_wind",)
MSL_NAMES = ("mean_sea_level_pressure", "msl")
SP_NAMES = ("surface_pressure", "sp")
SNOW_NAMES = ("snow_depth", "sd")
SSRD_NAMES = ("surface_solar_radiation_downwards", "ssrd")
GUST_NAMES = ("instantaneous_10m_wind_gust",)
ZS_NAMES = ("geopotential_at_surface",)
G0 = 9.80665
CALM_MS = 0.05
# Preuve déjà extraite (même miroir, même jour, maille 45,25 / 5,75). Échec si ARCO diverge.
GRENOBLE_GRID = (45.25, 5.75)
GRENOBLE_TMIN_K = 276.5640
GRENOBLE_TMAX_K = 287.3429
EXPECTED_FRANCE_CELLS = 43 * 63  # 0,25° sur la bbox V1 inclusive
EXTRACTS_DIR = Path(__file__).resolve().parent / "extracts"
GOLDEN_POINT_DATE = "1983-05-12"
GOLDEN_POINT_FILE = "grenoble-1983-05-12.json"
GOLDEN_FRANCE_FILE = "france-1983-05-12-2t-daily.json"
MAX_FRANCE_DAILY_DATES = 7
T2M_PLAUSIBLE_K = (220.0, 330.0)


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


def load_orography_point(da: xr.DataArray, lat: float, lon: float, date: str) -> tuple[float, float, float]:
    """geopotential_at_surface est 2D (ou constant dans le temps). Un pas suffit ; pas 24 chunks globaux."""
    lat_name = coord_name(da, "latitude", "lat")
    lon_name = coord_name(da, "longitude", "lon")
    work = da
    time_name = next((n for n in ("time", "valid_time") if n in da.coords or n in da.dims), None)
    if time_name:
        sliced = da.sel(
            {
                time_name: slice(
                    np.datetime64(f"{date}T00:00:00"),
                    np.datetime64(f"{date}T23:59:59"),
                )
            }
        )
        if sliced[time_name].size == 0:
            raise SystemExit("Aucune heure ERA5 zs pour l'orographie.")
        work = sliced.isel({time_name: 0})
    point = work.sel({lat_name: lat, lon_name: lon}, method="nearest").load()
    values = [float(v) for v in np.ravel(np.asarray(point.astype("float64").values)) if np.isfinite(v)]
    if not values:
        raise SystemExit("Orographie modèle vide : aucune valeur.")
    grid_lat = float(point[lat_name].values)
    grid_lon = float(signed_longitude(float(point[lon_name].values)))
    return sum(values) / len(values), grid_lat, grid_lon


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


def wind_from_uv(u: float, v: float) -> tuple[float, float]:
    """Même convention que packages/weather-core : direction d'où vient le vent."""
    speed = math.hypot(u, v)
    to_deg = math.degrees(math.atan2(u, v))
    from_deg = (to_deg + 180.0 + 360.0) % 360.0
    return speed, from_deg


def daily_wind_points(date: str, hours_u: list[float], hours_v: list[float]) -> list[dict]:
    if len(hours_u) != len(hours_v):
        raise SystemExit("u10 et v10 : nombre d'heures différent.")
    speeds = [math.hypot(u, v) for u, v in zip(hours_u, hours_v)]
    mean_speed = sum(speeds) / len(speeds)
    points = [{"date": date, "variable_id": "wind_speed", "value": mean_speed, "unit": "m s-1"}]
    mean_u = sum(hours_u) / len(hours_u)
    mean_v = sum(hours_v) / len(hours_v)
    vec_speed, from_deg = wind_from_uv(mean_u, mean_v)
    if vec_speed < CALM_MS:
        return points
    points.append({"date": date, "variable_id": "wind_direction", "value": from_deg, "unit": "degree"})
    return points


def daily_msl_point(date: str, hours_pa: list[float]) -> dict:
    if any(v < 80000 or v > 110000 for v in hours_pa):
        raise SystemExit("mean_sea_level_pressure hors plage : extraction refusée.")
    return {
        "date": date,
        "variable_id": "sea_level_pressure",
        "value": sum(hours_pa) / len(hours_pa),
        "unit": "Pa",
    }


def daily_sp_point(date: str, hours_pa: list[float]) -> dict:
    if any(v < 30000 or v > 110000 for v in hours_pa):
        raise SystemExit("surface_pressure hors plage : extraction refusée.")
    return {"date": date, "variable_id": "pressure", "value": sum(hours_pa) / len(hours_pa), "unit": "Pa"}


def daily_snow_point(date: str, hours_m: list[float]) -> dict:
    if any(v < -1e-12 for v in hours_m):
        raise SystemExit("snow_depth négatif : extraction refusée.")
    # ARCO snow_depth = mètres d'équivalent en eau, pas une hauteur de manteau.
    return {"date": date, "variable_id": "snow_depth", "value": sum(hours_m) / len(hours_m), "unit": "m"}


def daily_ssrd_point(date: str, hours_j: list[float]) -> dict:
    if any(v < -1e-6 for v in hours_j):
        raise SystemExit("SSRD négatif : extraction refusée.")
    # Comme TP : accumulation horaire ARCO, non monotone, last−first = 0. Somme des 24 pas.
    return {"date": date, "variable_id": "solar_radiation", "value": float(sum(hours_j)), "unit": "J m-2"}


def daily_gust_point(date: str, hours_ms: list[float]) -> dict:
    if any(v < -1e-12 for v in hours_ms):
        raise SystemExit("rafale 10 m négative : extraction refusée.")
    return {"date": date, "variable_id": "wind_gust", "value": max(hours_ms), "unit": "m s-1"}


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
    if not (T2M_PLAUSIBLE_K[0] <= g_tmin <= T2M_PLAUSIBLE_K[1] and T2M_PLAUSIBLE_K[0] <= g_tmax <= T2M_PLAUSIBLE_K[1]):
        raise SystemExit(f"2t Grenoble hors Kelvin plausibles ({g_tmin}/{g_tmax}) : extraction refusée.")
    if g_tmax < g_tmin:
        raise SystemExit("Tmax < Tmin sur la maille Grenoble : extraction refusée.")
    if date == GOLDEN_POINT_DATE:
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


def parse_iso_dates(raw: str) -> list[str]:
    dates = [part.strip() for part in raw.split(",") if part.strip()]
    if not dates:
        raise SystemExit("Aucune date : rien n'est inventé.")
    seen: set[str] = set()
    ordered: list[str] = []
    for date in dates:
        if len(date) != 10 or date[4] != "-" or date[7] != "-":
            raise SystemExit(f"Date invalide {date} (attendu YYYY-MM-DD).")
        try:
            datetime.strptime(date, "%Y-%m-%d")
        except ValueError as exc:
            raise SystemExit(f"Date invalide {date}.") from exc
        if date in seen:
            continue
        seen.add(date)
        ordered.append(date)
    if len(ordered) > MAX_FRANCE_DAILY_DATES:
        raise SystemExit(
            f"Pas l'archive 1940–2026 : max {MAX_FRANCE_DAILY_DATES} jours par run ({len(ordered)} demandés)."
        )
    return ordered


def france_daily_path(date: str, explicit: str | None) -> Path:
    path = Path(explicit) if explicit else EXTRACTS_DIR / f"france-{date}-2t-daily.json"
    if path.name == GOLDEN_FRANCE_FILE and date != GOLDEN_POINT_DATE:
        raise SystemExit("Refus d'écraser la preuve quotidienne 1983-05-12.")
    if date == GOLDEN_POINT_DATE:
        raise SystemExit("Preuve quotidienne 1983-05-12 non réécrite.")
    return path


def extract_one_france_daily(
    ds: xr.Dataset,
    t2m: xr.DataArray,
    lat: float,
    lon: float,
    date: str,
    out_path: Path,
) -> dict:
    day_2t = load_day(t2m, date, "2t")
    hours_2t, _times, grid_lat, grid_lon = point_from_day(day_2t, lat, lon, "2t")
    payload = france_daily_2t(day_2t, date, hours_2t, grid_lat, grid_lon)
    payload["dataset_version"] = dataset_version_for(ds, date)
    checksum = write_json(out_path, payload)
    payload["_sha256"] = checksum
    payload["_path"] = str(out_path)
    print(f"wrote {out_path}", flush=True)
    print(
        f"france_cells={payload['cell_count']} date={date} "
        f"grenoble_tmin_K={payload['grenoble_cell']['tmin_K']:.4f} "
        f"grenoble_tmax_K={payload['grenoble_cell']['tmax_K']:.4f}",
        flush=True,
    )
    print(f"france_sha256 {checksum}", flush=True)
    return payload


def write_france_daily_index(extra_days: list[dict]) -> str:
    golden = EXTRACTS_DIR / GOLDEN_FRANCE_FILE
    if not golden.is_file():
        raise SystemExit("Preuve quotidienne 1983-05-12 absente : pas d'index incomplet.")
    golden_payload = json.loads(golden.read_text(encoding="utf-8"))
    days = [
        {
            "date": GOLDEN_POINT_DATE,
            "file": GOLDEN_FRANCE_FILE,
            "sha256": sha256_file(golden),
            "grenoble_tmin_K": golden_payload["grenoble_cell"]["tmin_K"],
            "grenoble_tmax_K": golden_payload["grenoble_cell"]["tmax_K"],
            "cell_count": golden_payload["cell_count"],
        }
    ]
    for payload in extra_days:
        days.append(
            {
                "date": payload["date"],
                "file": Path(payload["_path"]).name,
                "sha256": payload["_sha256"],
                "grenoble_tmin_K": payload["grenoble_cell"]["tmin_K"],
                "grenoble_tmax_K": payload["grenoble_cell"]["tmax_K"],
                "cell_count": payload["cell_count"],
            }
        )
    days.sort(key=lambda row: row["date"])
    index = {
        "source_id": SOURCE_ID,
        "method": FRANCE_DAILY_METHOD,
        "method_version": FRANCE_DAILY_METHOD_VERSION,
        "variable": "2m_temperature",
        "aggregation": "daily_minmax_utc",
        "cell_count": EXPECTED_FRANCE_CELLS,
        "bbox": {
            "lat_min": FRANCE_LAT[0],
            "lat_max": FRANCE_LAT[1],
            "lon_min": FRANCE_LON[0],
            "lon_max": FRANCE_LON[1],
        },
        "imported_to_sql": False,
        "archive_1940_2026": False,
        "days": days,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    checksum = write_json(EXTRACTS_DIR / "france-2t-daily-index.json", index)
    print(f"wrote {EXTRACTS_DIR / 'france-2t-daily-index.json'} days={len(days)} sha256 {checksum}", flush=True)
    return checksum


def run_france_only(ds: xr.Dataset, lat: float, lon: float, dates: list[str], france_out: str | None) -> None:
    t2m = pick_var(ds, T2M_NAMES, "2m_temperature")
    extra: list[dict] = []
    for date in dates:
        out_path = france_daily_path(date, france_out if len(dates) == 1 else None)
        extra.append(extract_one_france_daily(ds, t2m, lat, lon, date, out_path))
    write_france_daily_index(extra)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--lat", type=float, default=45.1885)
    parser.add_argument("--lon", type=float, default=5.7245)
    parser.add_argument("--date", default="1983-05-12")
    parser.add_argument(
        "--dates",
        default="",
        help="Liste YYYY-MM-DD (france-only). Max 7 jours. N'est pas l'archive 1940–2026.",
    )
    parser.add_argument(
        "--out",
        default=str(EXTRACTS_DIR / GOLDEN_POINT_FILE),
    )
    parser.add_argument(
        "--france-out",
        default="",
        help="Chemin du JSON quotidien France (un seul --date). Sinon france-{date}-2t-daily.json.",
    )
    parser.add_argument("--skip-france-daily", action="store_true", help="N'écrit pas le quotidien bbox France.")
    parser.add_argument(
        "--france-only",
        action="store_true",
        help="N'extrait que le quotidien 2t bbox France (pas le point, pas les autres variables).",
    )
    parser.add_argument("--bbox-only", action="store_true", help="Vérifie la bbox France, n'ouvre pas ARCO.")
    args = parser.parse_args()
    assert_in_france(args.lat, args.lon)
    if args.bbox_only:
        print(f"bbox France ok {args.lat},{args.lon}")
        return
    if args.dates and not args.france_only:
        raise SystemExit("--dates exige --france-only (pas un dump point multi-jours).")

    out_path = Path(args.out)
    if args.date != GOLDEN_POINT_DATE and out_path.name == GOLDEN_POINT_FILE:
        raise SystemExit("Refus d'écraser la preuve point 1983-05-12.")

    ds = open_era5()
    if args.france_only:
        dates = parse_iso_dates(args.dates or args.date)
        run_france_only(ds, args.lat, args.lon, dates, args.france_out or None)
        ds.close()
        os._exit(0)

    t2m = pick_var(ds, T2M_NAMES, "2m_temperature")
    d2m = pick_var(ds, D2M_NAMES, "2m_dewpoint_temperature")
    tp = pick_var(ds, TP_NAMES, "total_precipitation")
    u10 = pick_var(ds, U10_NAMES, "10m_u_component_of_wind")
    v10 = pick_var(ds, V10_NAMES, "10m_v_component_of_wind")
    msl = pick_var(ds, MSL_NAMES, "mean_sea_level_pressure")
    sp = pick_var(ds, SP_NAMES, "surface_pressure")
    snow = pick_var(ds, SNOW_NAMES, "snow_depth")
    ssrd = pick_var(ds, SSRD_NAMES, "surface_solar_radiation_downwards")
    gust = pick_var(ds, GUST_NAMES, "instantaneous_10m_wind_gust")
    zs = pick_var(ds, ZS_NAMES, "geopotential_at_surface")

    day_2t = load_day(t2m, args.date, "2t")
    hours_2t, times, grid_lat, grid_lon = point_from_day(day_2t, args.lat, args.lon, "2t")
    hours_d2m, times_d2m, grid_lat_d, grid_lon_d = load_day_point(d2m, args.lat, args.lon, args.date, "d2m")
    hours_tp, times_tp, grid_lat_p, grid_lon_p = load_day_point(tp, args.lat, args.lon, args.date, "tp")
    hours_u, times_u, grid_lat_u, grid_lon_u = load_day_point(u10, args.lat, args.lon, args.date, "10u")
    hours_v, times_v, grid_lat_v, grid_lon_v = load_day_point(v10, args.lat, args.lon, args.date, "10v")
    hours_msl, times_msl, grid_lat_m, grid_lon_m = load_day_point(msl, args.lat, args.lon, args.date, "msl")
    hours_sp, times_sp, grid_lat_sp, grid_lon_sp = load_day_point(sp, args.lat, args.lon, args.date, "sp")
    hours_snow, times_snow, grid_lat_sd, grid_lon_sd = load_day_point(snow, args.lat, args.lon, args.date, "sd")
    hours_ssrd, times_ssrd, grid_lat_ss, grid_lon_ss = load_day_point(ssrd, args.lat, args.lon, args.date, "ssrd")
    hours_gust, times_gust, grid_lat_g, grid_lon_g = load_day_point(gust, args.lat, args.lon, args.date, "i10fg")
    phi_zs, grid_lat_z, grid_lon_z = load_orography_point(zs, args.lat, args.lon, args.date)
    grids = {
        "d2m": (grid_lat_d, grid_lon_d),
        "tp": (grid_lat_p, grid_lon_p),
        "10u": (grid_lat_u, grid_lon_u),
        "10v": (grid_lat_v, grid_lon_v),
        "msl": (grid_lat_m, grid_lon_m),
        "sp": (grid_lat_sp, grid_lon_sp),
        "sd": (grid_lat_sd, grid_lon_sd),
        "ssrd": (grid_lat_ss, grid_lon_ss),
        "i10fg": (grid_lat_g, grid_lon_g),
        "zs": (grid_lat_z, grid_lon_z),
    }
    for label, grid in grids.items():
        if grid != (grid_lat, grid_lon):
            raise SystemExit(f"Maille 2t {grid_lat},{grid_lon} ≠ {label} {grid[0]},{grid[1]}")
    for label, series_times in (
        ("d2m", times_d2m),
        ("tp", times_tp),
        ("10u", times_u),
        ("10v", times_v),
        ("msl", times_msl),
        ("sp", times_sp),
        ("sd", times_snow),
        ("ssrd", times_ssrd),
        ("i10fg", times_gust),
    ):
        if series_times != times:
            raise SystemExit(f"Heures UTC 2t / {label} différentes : pas de mélange.")
    if args.date == GOLDEN_POINT_DATE:
        if round(min(hours_2t), 4) != GRENOBLE_TMIN_K or round(max(hours_2t), 4) != GRENOBLE_TMAX_K:
            raise SystemExit("2t Grenoble a divergé de la preuve 276.5640 / 287.3429 K.")

    precip = daily_precip_point(args.date, hours_tp)
    wind_points = daily_wind_points(args.date, hours_u, hours_v)
    msl_point = daily_msl_point(args.date, hours_msl)
    sp_point = daily_sp_point(args.date, hours_sp)
    snow_point = daily_snow_point(args.date, hours_snow)
    ssrd_point = daily_ssrd_point(args.date, hours_ssrd)
    gust_point = daily_gust_point(args.date, hours_gust)
    model_alt_m = phi_zs / G0
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
                "cumul journalier UTC = somme des 24 pas, pas last−first. "
                "Vent 10 m = hypot(u,v) horaire puis moyenne ; direction = d'où vient le vent, "
                "moyenne vectorielle u/v (pas moyenne des angles). MSL = moyenne 24 h UTC en Pa. "
                "SP = moyenne 24 h UTC à la surface du modèle (geopotential_at_surface / g0), pas l'altitude commune. "
                "snow_depth ARCO = mètres d'équivalent en eau, pas une hauteur de manteau. "
                "SSRD = somme des 24 pas horaires en J m-2 (comme TP, pas last−first). "
                "Rafale = max des instantaneous_10m_wind_gust, pas une rafale officielle."
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
        "hourly_10u_ms": [float(v) for v in hours_u],
        "hourly_10v_ms": [float(v) for v in hours_v],
        "hourly_msl_Pa": [float(v) for v in hours_msl],
        "hourly_sp_Pa": [float(v) for v in hours_sp],
        "hourly_snow_swe_m": [float(v) for v in hours_snow],
        "hourly_ssrd_Jm2": [float(v) for v in hours_ssrd],
        "hourly_i10fg_ms": [float(v) for v in hours_gust],
        "model_surface_geopotential_m2s2": float(phi_zs),
        "model_surface_altitude_m": round(model_alt_m, 1),
        "extracted_at": datetime.now(timezone.utc).isoformat(),
        "points": daily_points(args.date, hours_2t, "air_temperature_min", "air_temperature_max", "air_temperature")
        + daily_points(args.date, hours_d2m, "dew_point_min", "dew_point_max", "dew_point")
        + [precip]
        + wind_points
        + [msl_point, sp_point, snow_point, ssrd_point, gust_point],
    }

    checksum = write_json(out_path, payload)
    tmin_k, tmax_k = min(hours_2t), max(hours_2t)
    dmin_k, dmax_k = min(hours_d2m), max(hours_d2m)
    tp_mm = precip["value"] * 1000.0
    print(f"wrote {out_path}", flush=True)
    print(f"grid nearest {grid_lat},{grid_lon} hours={len(hours_2t)} tmin_K={tmin_k:.4f} tmax_K={tmax_k:.4f}", flush=True)
    print(f"d2m min_K={dmin_k:.4f} max_K={dmax_k:.4f}", flush=True)
    print(f"tp_sum_m={precip['value']:.10f} tp_mm={tp_mm:.4f}", flush=True)
    wind_speed = next(p["value"] for p in wind_points if p["variable_id"] == "wind_speed")
    print(f"wind_speed_ms={wind_speed:.4f} wind_speed_kmh={wind_speed * 3.6:.1f}", flush=True)
    wind_dir = next((p["value"] for p in wind_points if p["variable_id"] == "wind_direction"), None)
    if wind_dir is not None:
        print(f"wind_from_deg={wind_dir:.1f}", flush=True)
    print(f"msl_mean_Pa={msl_point['value']:.2f} msl_hPa={msl_point['value'] / 100:.0f}", flush=True)
    print(f"sp_mean_Pa={sp_point['value']:.2f} sp_hPa={sp_point['value'] / 100:.0f} model_alt_m={model_alt_m:.1f}", flush=True)
    print(f"snow_swe_m={snow_point['value']:.6f} snow_swe_mm={snow_point['value'] * 1000:.1f}", flush=True)
    print(f"ssrd_sum_Jm2={ssrd_point['value']:.1f} ssrd_MJm2={ssrd_point['value'] / 1e6:.1f}", flush=True)
    print(f"gust_max_ms={gust_point['value']:.4f} gust_kmh={gust_point['value'] * 3.6:.1f}", flush=True)
    print(f"sha256 {checksum}", flush=True)

    if not args.skip_france_daily:
        if args.date == GOLDEN_POINT_DATE:
            print("preuve quotidienne 1983-05-12 conservée (pas réécrite)", flush=True)
        else:
            france_path = Path(args.france_out) if args.france_out else EXTRACTS_DIR / f"france-{args.date}-2t-daily.json"
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

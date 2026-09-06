"""Extract one ERA5 grid cell for one UTC day. No invented values."""

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
METHOD_VERSION = "era5-point-nearest-hourly-2t-minmax-v1"
DOI = "10.24381/cds.adbb2d47"


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()


def open_era5():
    return xr.open_zarr(ARCO_ZARR, storage_options={"token": "anon"})


def pick_2t(ds: xr.Dataset) -> xr.DataArray:
    for name in ("2m_temperature", "t2m", "2t"):
        if name in ds:
            return ds[name]
    raise SystemExit(f"Variable 2m_temperature absente. Variables: {list(ds.data_vars)[:40]}")


def coord_name(da: xr.DataArray, *candidates: str) -> str:
    for name in candidates:
        if name in da.coords or name in da.dims:
            return name
    raise SystemExit(f"Coordonnée introuvable parmi {candidates}: {list(da.coords)}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--lat", type=float, default=45.1885)
    parser.add_argument("--lon", type=float, default=5.7245)
    parser.add_argument("--date", default="1983-05-12")
    parser.add_argument(
        "--out",
        default=str(Path(__file__).resolve().parent / "extracts" / "grenoble-1983-05-12.json"),
    )
    args = parser.parse_args()

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    ds = open_era5()
    t2m = pick_2t(ds)
    time_name = coord_name(t2m, "time", "valid_time")
    lat_name = coord_name(t2m, "latitude", "lat")
    lon_name = coord_name(t2m, "longitude", "lon")

    sliced = t2m.sel(
        {
            time_name: slice(
                np.datetime64(f"{args.date}T00:00:00"),
                np.datetime64(f"{args.date}T23:59:59"),
            )
        }
    )
    if sliced[time_name].size == 0:
        raise SystemExit(f"Aucune heure ERA5 pour {args.date}")

    point = sliced.sel({lat_name: args.lat, lon_name: args.lon}, method="nearest").load()
    values = point.astype("float64").values
    if values.size == 0 or np.all(np.isnan(values)):
        raise SystemExit("Extraction vide : aucune valeur Kelvin.")

    hours_k = [float(v) for v in np.ravel(values) if np.isfinite(v)]
    if len(hours_k) < 20:
        raise SystemExit(f"Trop peu d'heures ({len(hours_k)}) pour un min/max quotidien.")

    tmin_k = min(hours_k)
    tmax_k = max(hours_k)
    tmean_k = sum(hours_k) / len(hours_k)
    grid_lat = float(point[lat_name].values)
    grid_lon = float(point[lon_name].values)
    times = [str(np.datetime_as_string(t, unit="s")) for t in point[time_name].values]

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
        "hours_used": len(hours_k),
        "hourly_times_utc": times,
        "hourly_2t_K": [round(v, 4) for v in hours_k],
        "extracted_at": datetime.now(timezone.utc).isoformat(),
        "points": [
            {"date": args.date, "variable_id": "air_temperature_min", "value": tmin_k, "unit": "K"},
            {"date": args.date, "variable_id": "air_temperature_max", "value": tmax_k, "unit": "K"},
            {"date": args.date, "variable_id": "air_temperature", "value": tmean_k, "unit": "K"},
        ],
    }

    text = json.dumps(payload, indent=2, ensure_ascii=False)
    out_path.write_text(text + "\n", encoding="utf-8")
    checksum = sha256_file(out_path)

    print(f"wrote {out_path}")
    print(f"grid nearest {grid_lat},{grid_lon} hours={len(hours_k)} tmin_K={tmin_k:.4f} tmax_K={tmax_k:.4f}")
    print(f"sha256 {checksum}")
    ds.close()
    # gcsfs/dask keep threads alive after a successful extract
    os._exit(0)


if __name__ == "__main__":
    main()

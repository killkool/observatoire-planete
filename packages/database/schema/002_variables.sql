-- Variables canoniques initiales. Précision d'affichage = après conversion UI.

INSERT INTO variables (variable_id, canonical_unit, display_unit_default, display_precision, description, standard_name, allowed_min, allowed_max) VALUES
('air_temperature', 'K', 'degC', 1, 'Air temperature', 'air_temperature', 180, 340),
('air_temperature_min', 'K', 'degC', 1, 'Daily minimum air temperature', 'air_temperature', 180, 340),
('air_temperature_max', 'K', 'degC', 1, 'Daily maximum air temperature', 'air_temperature', 180, 340),
('dew_point', 'K', 'degC', 1, 'Dew point temperature', 'dew_point_temperature', 180, 340),
('relative_humidity', '1', '%', 0, 'Relative humidity (0-1 canonical)', 'relative_humidity', 0, 1.05),
('precipitation', 'm', 'mm', 1, 'Precipitation amount', 'thickness_of_rainfall_amount', 0, 2),
('wind_speed', 'm s-1', 'km/h', 1, 'Wind speed', 'wind_speed', 0, 150),
('wind_direction', 'degree', 'degree', 0, 'Meteorological wind direction (from)', 'wind_from_direction', 0, 360),
('wind_gust', 'm s-1', 'km/h', 1, 'Wind gust', 'wind_speed_of_gust', 0, 200),
('pressure', 'Pa', 'hPa', 0, 'Surface pressure', 'surface_air_pressure', 30000, 110000),
('sea_level_pressure', 'Pa', 'hPa', 0, 'Mean sea level pressure', 'air_pressure_at_mean_sea_level', 80000, 110000),
('snow_depth', 'm', 'cm', 0, 'Snow depth', 'surface_snow_thickness', 0, 20),
('solar_radiation', 'J m-2', 'MJ/m2', 1, 'Surface solar radiation', 'surface_downwelling_shortwave_flux_in_air', 0, NULL),
('cloud_cover', '1', '%', 0, 'Cloud cover fraction', 'cloud_area_fraction', 0, 1),
('sea_surface_temperature', 'K', 'degC', 1, 'Sea surface temperature', 'sea_surface_temperature', 260, 320),
('water_temperature', 'K', 'degC', 1, 'Sea water temperature at depth', 'sea_water_temperature', 250, 320),
('salinity', '1e-3', 'PSU', 2, 'Sea water practical salinity', 'sea_water_practical_salinity', 0, 45),
('current_velocity_u', 'm s-1', 'm/s', 2, 'Eastward sea water velocity', 'eastward_sea_water_velocity', -5, 5),
('current_velocity_v', 'm s-1', 'm/s', 2, 'Northward sea water velocity', 'northward_sea_water_velocity', -5, 5),
('wave_height', 'm', 'm', 1, 'Significant wave height', 'sea_surface_wave_significant_height', 0, 30),
('wave_direction', 'degree', 'degree', 0, 'Wave direction (product convention documented at ingest)', 'sea_surface_wave_from_direction', 0, 360),
('wave_period', 's', 's', 1, 'Wave period', 'sea_surface_wave_mean_period', 0, 40),
('sea_level', 'm', 'm', 2, 'Sea surface height', 'sea_surface_height_above_geoid', -3, 3)
ON CONFLICT (variable_id) DO NOTHING;

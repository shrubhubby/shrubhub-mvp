# Site Location & Hardiness Zone Migration Guide

This guide explains how to set up the database for site boundary mapping and automatic hardiness zone detection.

## Part 1: Enable PostGIS Extension

Run this in your Supabase SQL editor:

```sql
-- Enable PostGIS extension for spatial data
CREATE EXTENSION IF NOT EXISTS postgis;
```

## Part 2: Update Sites Table Schema

Add the boundary polygon column to the sites table:

```sql
-- Add boundary column to store site polygon
ALTER TABLE sites
ADD COLUMN boundary GEOGRAPHY(POLYGON, 4326);

-- Add index for spatial queries
CREATE INDEX sites_boundary_idx ON sites USING GIST(boundary);

-- Add comment
COMMENT ON COLUMN sites.boundary IS 'Site boundary polygon in WGS84 (lat/lng). Stores the drawn boundary from the map interface.';
```

## Part 3: Create Hardiness Zones Table

Create a new table to store USDA Plant Hardiness Zone data:

```sql
-- Create hardiness zones table
CREATE TABLE hardiness_zones (
  id SERIAL PRIMARY KEY,
  zone TEXT NOT NULL,
  trange TEXT,
  zone_description TEXT,
  geometry GEOGRAPHY(MULTIPOLYGON, 4326) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add spatial index
CREATE INDEX hardiness_zones_geometry_idx ON hardiness_zones USING GIST(geometry);

-- Add comment
COMMENT ON TABLE hardiness_zones IS 'USDA Plant Hardiness Zones with geometric boundaries for spatial queries';
```

## Part 4: Load Hardiness Zone Data

### Finding Your Supabase Database Credentials

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Project Settings** (gear icon) → **Database**
4. Under "Connection Info" you'll find:
   - **Host**: `db.xxxxxxxxxxxxx.supabase.co`
   - **Database name**: `postgres` (always this for Supabase)
   - **User**: `postgres` (always this for Supabase)
   - **Password**: Click "Reset Database Password" if you don't have it, or use your original password

### Option 1: Using Supabase Dashboard (Easiest)

**This is the simplest approach - no command line tools needed!**

1. Download the GeoJSON file:
   - Get the simplified US zones: https://github.com/rurban/usda-plant-hardiness-zones/raw/master/phzm_us.geojson

2. **Convert GeoJSON to SQL** (you'll need to do this preprocessing):
   ```bash
   # Install jq if you don't have it (for JSON parsing)
   # On Mac: brew install jq
   # On Linux: apt-get install jq

   # Convert GeoJSON to SQL INSERT statements
   cat phzm_us.geojson | jq -r '.features[] |
     "INSERT INTO hardiness_zones (zone, trange, geometry) VALUES (" +
     "'\(.properties.zone // .properties.ZONE)'," +
     "'\(.properties.trange // .properties.TRANGE)'," +
     "'SRID=4326;" + (.geometry | @json) + "'::geography);"' > zones.sql
   ```

3. Copy the SQL statements and run them in your Supabase SQL Editor

### Option 2: Using ogr2ogr (Advanced)

1. Download the USDA Plant Hardiness Zone GeoJSON data:
   - Source: https://github.com/rurban/usda-plant-hardiness-zones
   - Or: https://planthardiness.ars.usda.gov/pages/data-downloads

2. Install GDAL (if not installed):
   ```bash
   # On Mac
   brew install gdal

   # On Ubuntu/Debian
   apt-get install gdal-bin

   # On Windows
   # Download from: https://trac.osgeo.org/osgeo4w/
   ```

3. Get your Supabase credentials from dashboard (see above), then run:

   ```bash
   # Replace these with your actual values from Supabase Dashboard:
   # - YOUR_SUPABASE_HOST: Found in Project Settings → Database → Host
   # - YOUR_PASSWORD: Your database password

   ogr2ogr -f "PostgreSQL" \
     PG:"host=YOUR_SUPABASE_HOST dbname=postgres user=postgres password=YOUR_PASSWORD sslmode=require" \
     phzm_us.geojson \
     -nln hardiness_zones \
     -nlt PROMOTE_TO_MULTI \
     -lco GEOMETRY_NAME=geometry \
     -lco FID=id
   ```

   **Example with actual values:**
   ```bash
   ogr2ogr -f "PostgreSQL" \
     PG:"host=db.abcdefghijk.supabase.co dbname=postgres user=postgres password=your_db_password sslmode=require" \
     phzm_us.geojson \
     -nln hardiness_zones \
     -nlt PROMOTE_TO_MULTI \
     -lco GEOMETRY_NAME=geometry \
     -lco FID=id
   ```

### Option 3: Simplified SQL Import (Recommended for Quick Testing)

If the above options are too complex, here's a simplified dataset for testing with just the major zones:

```sql
-- Simplified hardiness zones for testing
-- This covers the continental US with approximate boundaries
-- For production, use the full GeoJSON dataset

-- Zone 3a (Northern areas)
INSERT INTO hardiness_zones (zone, trange, geometry) VALUES
('3a', '-40°F to -35°F',
  ST_GeogFromText('MULTIPOLYGON(((-97 48, -95 48, -95 47, -97 47, -97 48)))')
);

-- Zone 5a (Northern mid-latitude)
INSERT INTO hardiness_zones (zone, trange, geometry) VALUES
('5a', '-20°F to -15°F',
  ST_GeogFromText('MULTIPOLYGON(((-90 43, -88 43, -88 42, -90 42, -90 43)))')
);

-- Zone 7a (Mid-latitude)
INSERT INTO hardiness_zones (zone, trange, geometry) VALUES
('7a', '0°F to 5°F',
  ST_GeogFromText('MULTIPOLYGON(((-85 38, -83 38, -83 37, -85 37, -85 38)))')
);

-- Zone 9a (Southern areas)
INSERT INTO hardiness_zones (zone, trange, geometry) VALUES
('9a', '20°F to 25°F',
  ST_GeogFromText('MULTIPOLYGON(((-95 30, -93 30, -93 29, -95 29, -95 30)))')
);

-- Zone 10a (Coastal California, South Florida)
INSERT INTO hardiness_zones (zone, trange, geometry) VALUES
('10a', '30°F to 35°F',
  ST_GeogFromText('MULTIPOLYGON(((-122 37.5, -121.5 37.5, -121.5 37, -122 37, -122 37.5)))')
);

-- Add more zones as needed...
-- For production, use the full GeoJSON dataset from USDA
```

## Part 5: Create Function to Auto-Detect Zone

Create a PostgreSQL function to automatically determine the hardiness zone from a location:

```sql
-- Function to get hardiness zone from lat/lng
CREATE OR REPLACE FUNCTION get_hardiness_zone(lat DOUBLE PRECISION, lng DOUBLE PRECISION)
RETURNS TEXT AS $$
DECLARE
  detected_zone TEXT;
BEGIN
  SELECT zone INTO detected_zone
  FROM hardiness_zones
  WHERE ST_Intersects(
    geometry,
    ST_GeogFromText('POINT(' || lng || ' ' || lat || ')')
  )
  LIMIT 1;

  RETURN detected_zone;
END;
$$ LANGUAGE plpgsql;

-- Usage example:
-- SELECT get_hardiness_zone(37.7749, -122.4194); -- San Francisco
```

## Part 6: Create Trigger to Auto-Set Hardiness Zone

Automatically set hardiness_zone when a site location is saved:

```sql
-- Function to auto-set hardiness zone
CREATE OR REPLACE FUNCTION auto_set_hardiness_zone()
RETURNS TRIGGER AS $$
BEGIN
  -- If location coordinates are set and hardiness_zone is not manually set
  IF NEW.location_lat IS NOT NULL AND NEW.location_lng IS NOT NULL THEN
    NEW.hardiness_zone := get_hardiness_zone(NEW.location_lat, NEW.location_lng);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS set_hardiness_zone_on_location ON sites;
CREATE TRIGGER set_hardiness_zone_on_location
  BEFORE INSERT OR UPDATE OF location_lat, location_lng ON sites
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_hardiness_zone();
```

## Data Source Information

### USDA Plant Hardiness Zone Data

**Official Source:**
- URL: https://planthardiness.ars.usda.gov/
- Data Format: Shapefile or GeoJSON
- License: Public Domain (US Government data)

**Alternative Sources:**
1. **GitHub Repository (Recommended for GeoJSON):**
   - https://github.com/rurban/usda-plant-hardiness-zones
   - Provides pre-converted GeoJSON format

2. **USDA ARS Direct Download:**
   - https://planthardiness.ars.usda.gov/pages/data-downloads
   - Provides official ZIP codes and geographic data

### Data Format Expected

The GeoJSON should have this structure:
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "zone": "10a",
        "trange": "-1.1°C to 1.7°C (30°F to 35°F)"
      },
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [[[...]]]
      }
    }
  ]
}
```

## Testing

After setup, test with a known location:

```sql
-- Test San Francisco (should be zone 10b)
SELECT get_hardiness_zone(37.7749, -122.4194);

-- Test New York City (should be zone 7b)
SELECT get_hardiness_zone(40.7128, -74.0060);

-- Test your actual site
SELECT get_hardiness_zone(your_lat, your_lng);
```

## Verification Queries

```sql
-- Check if PostGIS is enabled
SELECT PostGIS_Version();

-- Check hardiness zones table
SELECT zone, trange, ST_Area(geometry::geometry) as area_sq_degrees
FROM hardiness_zones
ORDER BY zone;

-- Find zone for a specific point
SELECT z.zone, z.trange
FROM hardiness_zones z
WHERE ST_Intersects(
  z.geometry,
  ST_GeogFromText('POINT(-122.4194 37.7749)')  -- lng, lat
);
```

## Notes

- The `boundary` column stores the user-drawn polygon for the site
- The `geometry` in hardiness_zones uses MULTIPOLYGON because zones can span multiple non-contiguous areas
- All coordinates use WGS84 (SRID 4326): standard lat/lng
- The trigger automatically updates `hardiness_zone` when coordinates change
- Users can override the auto-detected zone if needed

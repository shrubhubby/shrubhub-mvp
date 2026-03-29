const shapefile = require('shapefile');
const fs = require('fs');

async function convertToSQL() {
  const sqlStatements = [];

  try {
    const source = await shapefile.open(
      '/Users/chris.larsen/Downloads/phzm_us_zones_shp_2023.shp',
      '/Users/chris.larsen/Downloads/phzm_us_zones_shp_2023.dbf'
    );

    let result;
    let count = 0;

    while (!(result = await source.read()).done) {
      const feature = result.value;
      const props = feature.properties;

      // Extract zone and temperature range
      const zone = props.zone || props.ZONE || props.Zone;
      const trange = props.trange || props.TRANGE || props.Trange || '';
      const zoneDesc = props.zone_label || props.ZONE_LABEL || '';

      // Convert GeoJSON geometry to WKT format for PostGIS
      const geojsonStr = JSON.stringify(feature.geometry);

      // Create SQL INSERT statement
      const sql = `INSERT INTO hardiness_zones (zone, trange, zone_description, geometry)
VALUES ('${zone}', '${trange}', '${zoneDesc}', ST_GeomFromGeoJSON('${geojsonStr.replace(/'/g, "''")}')::geography);`;

      sqlStatements.push(sql);
      count++;

      if (count % 10 === 0) {
        console.log(`Processed ${count} zones...`);
      }
    }

    console.log(`\nTotal zones processed: ${count}`);

    // Write to file
    const outputPath = '/Users/chris.larsen/Downloads/hardiness_zones.sql';
    fs.writeFileSync(outputPath, sqlStatements.join('\n\n'));

    console.log(`\nSQL file created: ${outputPath}`);
    console.log(`\nYou can now run this SQL file in your Supabase SQL Editor.`);

  } catch (error) {
    console.error('Error converting shapefile:', error);
  }
}

convertToSQL();

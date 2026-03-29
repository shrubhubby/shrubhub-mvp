const fs = require('fs');

// Read the full SQL file
const sqlContent = fs.readFileSync('/Users/chris.larsen/Downloads/hardiness_zones.sql', 'utf8');

// Split by INSERT statements (each zone is one INSERT)
const inserts = sqlContent.split('INSERT INTO hardiness_zones').filter(s => s.trim());

console.log(`Total INSERT statements: ${inserts.length}`);

// Split into chunks of 1 zone each (one file per zone)
const chunkSize = 1;
const chunks = [];

for (let i = 0; i < inserts.length; i += chunkSize) {
  const chunk = inserts.slice(i, i + chunkSize);
  // Add "INSERT INTO hardiness_zones" back to each statement
  const chunkContent = chunk.map(insert => 'INSERT INTO hardiness_zones' + insert).join('\n\n');
  chunks.push(chunkContent);
}

// Write each chunk to a separate file
chunks.forEach((chunk, index) => {
  const filename = `/Users/chris.larsen/Downloads/hardiness_zones_part${index + 1}.sql`;
  fs.writeFileSync(filename, chunk);
  console.log(`Created: hardiness_zones_part${index + 1}.sql (${Math.round(chunk.length / 1024 / 1024 * 100) / 100}MB)`);
});

console.log(`\nTotal chunks created: ${chunks.length}`);
console.log('\nRun each file in order in your Supabase SQL Editor:');
chunks.forEach((_, index) => {
  console.log(`  ${index + 1}. hardiness_zones_part${index + 1}.sql`);
});

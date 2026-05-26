const { Client } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

async function runMigration() {
  const connectionString = process.env.SUPABASE_DB_URI;
  if (!connectionString) {
    console.error("Error: SUPABASE_DB_URI environment variable is missing!");
    process.exit(1);
  }

  console.log("Connecting to Supabase PostgreSQL database...");
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log("Connected successfully!");

    console.log("Adding columns to rideschedules table...");
    await client.query(`
      ALTER TABLE "rideschedules" 
      ADD COLUMN IF NOT EXISTS "vehicleType" TEXT DEFAULT 'Car',
      ADD COLUMN IF NOT EXISTS "vehicleModel" TEXT DEFAULT '';
    `);
    console.log("Columns added to rideschedules!");

    console.log("Adding columns to rideposts table...");
    await client.query(`
      ALTER TABLE "rideposts" 
      ADD COLUMN IF NOT EXISTS "vehicleType" TEXT DEFAULT 'Car',
      ADD COLUMN IF NOT EXISTS "vehicleModel" TEXT DEFAULT '';
    `);
    console.log("Columns added to rideposts!");

    console.log("Migration completed successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.end();
  }
}

runMigration();

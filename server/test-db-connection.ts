
import 'dotenv/config';
import pg from 'pg';
const { Client } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not defined in .env");
  process.exit(1);
}

// Log host (masked)
try {
    const url = new URL(connectionString);
    console.log(`Testing connection to host: ${url.hostname}`);
} catch (e) {
    console.log("Testing connection (URL parsing failed, checking raw string...)");
}

const client = new Client({
  connectionString: connectionString,
});

async function testConnection() {
  try {
    await client.connect();
    const res = await client.query('SELECT 1');
    console.log("Database connection successful:", res.rows[0]);
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error("Database connection failed details:", err);
    process.exit(1);
  }
}

testConnection();

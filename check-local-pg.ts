
import pg from 'pg';
const { Client } = pg;

async function checkLocalPostgres() {
  // Common default credentials to try
  const configs = [
    'postgresql://postgres:postgres@localhost:5432/postgres',
    'postgresql://postgres:password@localhost:5432/postgres',
    'postgresql://postgres:@localhost:5432/postgres', // Empty password
  ];

  for (const connStr of configs) {
    console.log(`Trying connection: ${connStr.replace(/:[^:@]*@/, ':****@')}`);
    const client = new Client({ connectionString: connStr });
    try {
      await client.connect();
      console.log("✅ Success! Found local Postgres.");
      console.log(`Connection string: ${connStr}`);
      await client.end();
      return; // Exit on first success
    } catch (err) {
      // Ignore auth errors, just logging connection refused
      if (err.code === 'ECONNREFUSED') {
        console.log("❌ Connection refused (Postgres might not be running)");
      } else {
        console.log(`❌ Auth/Other error: ${err.message}`);
        if (err.message.includes('password authentication failed')) {
            console.log("   (Service IS running, but password incorrect)");
        }
      }
    }
  }
}

checkLocalPostgres();

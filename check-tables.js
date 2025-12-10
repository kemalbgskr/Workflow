// Check database tables
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkTables() {
  try {
    console.log('Checking database tables...\n');
    
    // Check if approval_rounds table exists
    const roundsCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'approval_rounds'
      );
    `);
    console.log('approval_rounds table exists:', roundsCheck.rows[0].exists);
    
    // Check if approvers table exists
    const approversCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'approvers'
      );
    `);
    console.log('approvers table exists:', approversCheck.rows[0].exists);
    
    // Count records in approval_rounds
    if (roundsCheck.rows[0].exists) {
      const roundsCount = await pool.query('SELECT COUNT(*) FROM approval_rounds');
      console.log('approval_rounds records:', roundsCount.rows[0].count);
    }
    
    // Count records in approvers
    if (approversCheck.rows[0].exists) {
      const approversCount = await pool.query('SELECT COUNT(*) FROM approvers');
      console.log('approvers records:', approversCount.rows[0].count);
    }
    
    // Check documents table
    const docsCount = await pool.query('SELECT COUNT(*) FROM documents');
    console.log('documents records:', docsCount.rows[0].count);
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    await pool.end();
  }
}

checkTables();

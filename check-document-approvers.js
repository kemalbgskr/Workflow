// Check document approvers
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkDocumentApprovers() {
  try {
    const documentId = '65e8c2b9-af91-4e49-9689-28721f6f09fb';
    
    console.log('Checking approvers for document:', documentId, '\n');
    
    // Check if document exists
    const doc = await pool.query('SELECT * FROM documents WHERE id = $1', [documentId]);
    console.log('Document exists:', doc.rows.length > 0);
    if (doc.rows.length > 0) {
      console.log('Document:', doc.rows[0].filename, '-', doc.rows[0].status);
    }
    
    // Check approval rounds
    const rounds = await pool.query('SELECT * FROM approval_rounds WHERE document_id = $1', [documentId]);
    console.log('\nApproval rounds:', rounds.rows.length);
    if (rounds.rows.length > 0) {
      console.log('Round details:', rounds.rows[0]);
      
      // Check approvers for this round
      const approvers = await pool.query(`
        SELECT a.*, u.name as user_name 
        FROM approvers a 
        LEFT JOIN users u ON a.user_id = u.id 
        WHERE a.round_id = $1 
        ORDER BY a.order_index
      `, [rounds.rows[0].id]);
      
      console.log('\nApprovers:', approvers.rows.length);
      approvers.rows.forEach(a => {
        console.log(`  - ${a.user_name || a.email} (${a.status})`);
      });
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    await pool.end();
  }
}

checkDocumentApprovers();

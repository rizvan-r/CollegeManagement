import { query, pool } from './config/db.js';

async function run() {
  const res = await query(`
    SELECT
      tablename,
      indexname,
      indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname;
  `);

  console.log('=== Database Indexes in Public Schema ===');
  for (const row of res.rows) {
    console.log(`[${row.tablename}] ${row.indexname}: ${row.indexdef}`);
  }

  // Also inspect Foreign Key constraints
  const fkRes = await query(`
    SELECT
      tc.table_name, 
      kcu.column_name, 
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      rc.delete_rule
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON rc.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
    ORDER BY tc.table_name, kcu.column_name;
  `);

  console.log('\n=== Foreign Key Constraints & Delete Rules ===');
  for (const row of fkRes.rows) {
    console.log(`[${row.table_name}.${row.column_name}] -> [${row.foreign_table_name}.${row.foreign_column_name}] (ON DELETE ${row.delete_rule})`);
  }

  await pool.end();
}

run().catch(console.error);


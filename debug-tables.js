require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function debugTables() {
  const tables = ['direct_message_conversations', 'messages', 'notifications'];
  for (const table of tables) {
    console.log(`Checking ${table}...`);
    // Try to select everything with a limit of 0 to just check schema
    const { data, error } = await supabase.from(table).select('*').limit(0);
    if (error) {
      console.log(`❌ ${table} Error:`, error.message);
    } else {
      console.log(`✅ ${table} OK`);
    }
  }
}

debugTables().catch(console.error);

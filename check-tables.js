require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkAllTables() {
  const tablesToCheck = [
    'users', 
    'workspaces', 
    'workspace_memberships', 
    'channels', 
    'channel_memberships', 
    'direct_message_conversations', 
    'messages', 
    'notifications', 
    'files', 
    'drafts'
  ];

  console.log("--- Table Existence Check ---");
  for (const table of tablesToCheck) {
    const { error } = await supabase.from(table).select('id').limit(1);
    if (error) {
      console.log(`❌ ${table}: ${error.message}`);
    } else {
      console.log(`✅ ${table}: Exists and accessible.`);
    }
  }
}

checkAllTables().catch(console.error);

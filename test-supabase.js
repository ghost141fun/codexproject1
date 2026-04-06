require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testDrafts() {
  console.log("Fetching drafts...");
  const { data, error } = await supabase.from('drafts').select('*').limit(5);
  console.log("Drafts result:", data, error);

  if (error && error.code === '42P01') {
     console.log("Table 'drafts' does not exist!");
  }
}

testDrafts().catch(console.error);

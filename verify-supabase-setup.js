require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function verifySetup() {
  console.log("--- Supabase Setup Verification ---");
  
  // 1. Check Tables
  const { data: tables, error: tableError } = await supabase.from('users').select('count', { count: 'exact', head: true });
  if (tableError) {
    console.error("❌ Database Schema Error:", tableError.message);
  } else {
    console.log("✅ Database Schema: Tables found (Users table accessible).");
  }

  // 2. Check Storage
  const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
  if (storageError) {
    console.error("❌ Storage Error:", storageError.message);
  } else {
    const filesBucket = buckets.find(b => b.name === 'Files');
    if (filesBucket) {
      console.log(`✅ Storage: 'Files' bucket found (Public: ${filesBucket.public}).`);
    } else {
      console.log("❌ Storage: 'Files' bucket NOT found. Please create it in the dashboard.");
    }
  }
}

verifySetup().catch(console.error);

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkColumn() {
  const { data, error } = await supabase.from('users').select('avatar_url').limit(1);
  if (error) {
    console.error('Error:', error.message);
    if (error.message.includes('column "avatar_url" does not exist')) {
      console.log('STATUS: COLUMN_MISSING');
    } else {
      console.log('STATUS: OTHER_ERROR');
    }
  } else {
    console.log('STATUS: COLUMN_EXISTS');
  }
}

checkColumn();

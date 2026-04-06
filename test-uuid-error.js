require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testFetch() {
  const userId = "undefined"; // simulating user.id being string 'undefined', or undefined meaning we pass undefined
  
  const { data, error } = await supabase
    .from('direct_message_conversations')
    .select(`
      *,
      user1:user1_id(id, display_name, username, avatar_gradient, role, status),
      user2:user2_id(id, display_name, username, avatar_gradient, role, status)
    `)
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .limit(1);

  if (error) {
    console.log("Error generated:");
    console.dir(error);
  } else {
    console.log("Success! Found:", data.length);
  }
}

testFetch().catch(console.error);

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testFetch() {
  const email = "test@example.com"; // We don't have user.id, but we can query with a fake UUID or no filter
  
  const { data, error } = await supabase
    .from('direct_message_conversations')
    .select(`
      *,
      user1:user1_id(id, display_name, username, avatar_gradient, role, status),
      user2:user2_id(id, display_name, username, avatar_gradient, role, status)
    `)
    .limit(1);

  if (error) {
    console.log("Error object details:");
    console.log("Message:", error.message);
    console.log("Details:", error.details);
    console.log("Hint:", error.hint);
    console.log("Code:", error.code);
    console.dir(error);
  } else {
    console.log("Success! Found:", data.length);
  }
}

testFetch().catch(console.error);

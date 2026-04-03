const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const url = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1].trim();
const key = envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)[1].trim();

const supabase = createClient(url, key);

(async () => {
  const { data } = await supabase.from('orders').select('id, status, total_amount, payment_link, created_at, paid_at').order('created_at', { ascending: false }).limit(5);
  console.log(JSON.stringify(data, null, 2));
})();

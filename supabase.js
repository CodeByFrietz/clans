const SUPABASE_URL = "postgresql://postgres.kighvxotanotjyvhdlwy:[5hhtgXydF?/GbuD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
  ";
const SUPABASE_ANON_KEY = "postgresql://postgres.kighvxotanotjyvhdlwy:[5hhtgXydF?/GbuD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

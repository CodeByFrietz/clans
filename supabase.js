<script type="module">
  import { createClient } from
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

  const SUPABASE_URL = "https://yoziukydjjmnvbvjdgvc.supabase.co";
  const SUPABASE_KEY = "sb_secret_-gdC6ZEhAaFNVgqjR0gBIw_gDN1gEJA";

  window.supabaseClient = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );
</script>

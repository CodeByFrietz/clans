<script type="module">
  import { createClient } from
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

  const SUPABASE_URL = "https://yoziukydjjmnvbvjdgvc.supabase.co";
  const SUPABASE_KEY = "sb_publishable_0R_f4QUNYXxwoSiWVJes6g_M7VdO-X3";

  window.supabaseClient = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );
</script>

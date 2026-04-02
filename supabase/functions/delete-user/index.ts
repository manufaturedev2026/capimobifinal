import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const { user_id } = await req.json();
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const { error } = await supabase.auth.admin.deleteUser(user_id);
  return new Response(JSON.stringify({ success: !error, error: error?.message }), {
    headers: { "Content-Type": "application/json" },
  });
});

// supabase/functions/delete-user/index.ts
import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js';

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRole = Deno.env.get('SERVICE_ROLE');

    console.log('supabaseUrl is ' + supabaseUrl);
    console.log('serviceRoleKey is ' + serviceRole);

    const { userId } = await req.json();

    if (!userId) {
      console.error('Missing userId in request');
      return new Response(JSON.stringify({ error: 'Missing userId' }), { status: 400 });
    }

    
    if (!supabaseUrl || !serviceRole) {
      console.error('Missing environment variables');
      return new Response(JSON.stringify({ error: 'Missing environment variables' }), {
        status: 500,
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRole);

    console.log(`Attempting to delete user: ${userId}`);

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      console.error('Supabase Admin API error:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    console.log(`Successfully deleted user: ${userId}`);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error('Unhandled error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Unexpected error' }),
      { status: 500 }
    );
  }
});

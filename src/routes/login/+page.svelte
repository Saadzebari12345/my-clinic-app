<script lang="ts">
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';

  let username = $state(""), password = $state(""), msg = $state("");

  async function handleLogin() {
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();

    if (data) {
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("doctor_id", data.id);
      localStorage.setItem("doctor_username", data.username);
      localStorage.setItem("doctor_role", data.role); // ئەدمین یان دکتۆر
      goto("/");
    } else {
      msg = "❌ ناڤ یان پاسوۆرد خەلەتە!";
    }
  }
</script>

<div style="height: 100vh; display: flex; justify-content: center; align-items: center; background: #f3f4f6;">
  <div style="background: white; padding: 40px; border-radius: 15px; width: 350px; color: #333;">
    <h2>🏥 Clinic Login</h2>
    <input bind:value={username} placeholder="Username" style="width: 100%; margin-bottom: 10px; padding: 10px;" />
    <input bind:value={password} type="password" placeholder="Password" style="width: 100%; margin-bottom: 20px; padding: 10px;" />
    <button onclick={handleLogin} style="width: 100%; background: #4f46e5; color: white; padding: 12px; border: none; border-radius: 8px; cursor: pointer;">Login</button>
    <p style="color: red; text-align: center;">{msg}</p>
  </div>
</div>
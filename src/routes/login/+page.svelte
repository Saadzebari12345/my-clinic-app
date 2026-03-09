<script lang="ts">
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';

  let username = $state(""), password = $state(""), msg = $state("");
  let isLoading = $state(false);

  async function handleLogin() {
    isLoading = true;
    const { data } = await supabase
      .from('doctors')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();

    if (data) {
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("doctor_id", data.id);
      localStorage.setItem("doctor_username", data.username);
      localStorage.setItem("doctor_role", data.role.toLowerCase()); // سەیڤکرنا admin یان doctor
      goto("/");
    } else {
      msg = "❌ ناڤ یان پاسوۆرد خەلەتە!";
    }
    isLoading = false;
  }
</script>

<div style="height: 100vh; display: flex; justify-content: center; align-items: center; background: #f3f4f6;">
  <div style="background: white; padding: 40px; border-radius: 20px; width: 350px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); color: #333;">
    <h2 style="text-align: center; color: #4f46e5;">🏥 E-Clinic Login</h2>
    <div style="margin-bottom: 15px;">
      <label for="u" style="display: block; font-size: 0.8rem; margin-bottom: 5px;">Username</label>
      <input id="u" bind:value={username} style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #ddd; box-sizing: border-box;" />
    </div>
    <div style="margin-bottom: 25px;">
      <label for="p" style="display: block; font-size: 0.8rem; margin-bottom: 5px;">Password</label>
      <input id="p" bind:value={password} type="password" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #ddd; box-sizing: border-box;" />
    </div>
    <button onclick={handleLogin} style="width: 100%; background: #4f46e5; color: white; border: none; padding: 12px; border-radius: 10px; cursor: pointer; font-weight: bold;">
      {isLoading ? 'Checking...' : 'Login'}
    </button>
    {#if msg}<p style="color: red; text-align: center; margin-top: 15px;">{msg}</p>{/if}
  </div>
</div>
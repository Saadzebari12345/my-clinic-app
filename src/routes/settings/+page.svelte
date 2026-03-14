<script lang="ts">
  import { supabase } from '$lib/supabaseClient';
  import { onMount } from 'svelte';

  let doctorId = $state(''), currentPass = $state(''), newPass = $state(''), msg = $state(''), isError = $state(false);

  onMount(() => doctorId = localStorage.getItem('doctor_id') || '');

  async function updatePassword() {
    const { data: doctor } = await supabase.from('doctors').select('password').eq('id', doctorId).single();
    if (doctor && doctor.password === currentPass) {
      const { error } = await supabase.from('doctors').update({ password: newPass }).eq('id', doctorId);
      if (!error) { msg = "✅ Password updated!"; isError = false; currentPass = ""; newPass = ""; }
    } else { msg = "❌ Current password incorrect!"; isError = true; }
  }
</script>

<div class="card" style="max-width: 400px; margin: 0 auto;">
  <h3>🔐 Change Password</h3>
  <input type="password" bind:value={currentPass} placeholder="Current Password" style="width:100%; margin-bottom:10px; padding:10px;"/>
  <input type="password" bind:value={newPass} placeholder="New Password" style="width:100%; margin-bottom:20px; padding:10px;"/>
  <button onclick={updatePassword} style="width:100%; background:#4f46e5; color:white; padding:12px; border:none; border-radius:8px;">Update Password</button>
  <p style="color: {isError ? 'red' : 'green'}; text-align:center;">{msg}</p>
</div>
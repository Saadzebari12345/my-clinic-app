<script lang="ts">
  import { supabase } from '$lib/supabaseClient';
  let currentPass = $state(""), newUser = $state(""), newPass = $state(""), msg = $state("");

  async function updateSecurity() {
    const docId = localStorage.getItem("doctor_id");
    const { data } = await supabase.from('doctors').select('password').eq('id', docId).single();

    if (data && data.password === currentPass) {
      await supabase.from('doctors').update({ username: newUser, password: newPass }).eq('id', docId);
      localStorage.setItem("doctor_username", newUser);
      msg = "✅ Updated Successfully!";
      currentPass = ""; newUser = ""; newPass = "";
    } else {
      msg = "❌ Current password incorrect!";
    }
  }
</script>

<div style="max-width: 400px;">
  <h2>⚙️ Security Settings</h2>
  <div class="card" style="padding: 25px; background: var(--card); border: 1px solid var(--border); border-radius: 15px;">
    <div style="margin-bottom: 15px;">
      <label for="c-pass">Current Password</label>
      <input id="c-pass" type="password" bind:value={currentPass} style="width: 100%;" />
    </div>
    <hr />
    <div style="margin-bottom: 10px;">
      <label for="n-user">New Username</label>
      <input id="n-user" bind:value={newUser} style="width: 100%;" />
    </div>
    <div style="margin-bottom: 20px;">
      <label for="n-pass">New Password</label>
      <input id="n-pass" type="password" bind:value={newPass} style="width: 100%;" />
    </div>
    <button onclick={updateSecurity} style="width: 100%; background: #4f46e5; color: white; padding: 12px; border: none; border-radius: 8px;">Save Changes</button>
    <p style="text-align: center;">{msg}</p>
  </div>
</div>
<script lang="ts">
 import { supabase } from '$lib/supabaseClient';
 let user = $state(''), pass = $state(''), role = $state('doctor'), msg = $state('');

 async function createAccount() {
  const { error } = await supabase.from('doctors').insert([{ username: user, password: pass, role: role }]);
  if (!error) {
   msg = '✅ Account created successfully!';
   user = ''; pass = '';
  } else {
   msg = '❌ Error: ' + error.message;
  }
 }
</script>

<div style="max-width: 400px; padding: 20px;">
 <h2>➕ Create New Staff Account</h2>
 <div class="card" style="padding: 30px; background: white; border-radius: 15px; border: 1px solid #ddd;">
  <div style="margin-bottom: 15px;">
   <label for="reg-user" style="display: block; margin-bottom: 5px;">Username</label>
   <input id="reg-user" bind:value={user} style="width: 100%;" />
  </div>
  
  <div style="margin-bottom: 15px;">
   <label for="reg-pass" style="display: block; margin-bottom: 5px;">Password</label>
   <input id="reg-pass" bind:value={pass} type="password" style="width: 100%;" />
  </div>
  
  <div style="margin-bottom: 20px;">
   <label for="reg-role" style="display: block; margin-bottom: 5px;">Role</label>
   <select id="reg-role" bind:value={role} style="width: 100%;">
    <option value="doctor">Doctor</option>
    <option value="admin">Admin</option>
   </select>
  </div>

  <button onclick={createAccount} style="width: 100%; background: #059669; color: white; padding: 12px; border: none; border-radius: 8px; cursor: pointer;">Create Account</button>
  <p style="margin-top: 15px; font-weight: bold;">{msg}</p>
 </div>
</div>
<script lang="ts">
 import { supabase } from '$lib/supabaseClient';
 let user = $state(''), pass = $state(''), role = $state('doctor'), msg = $state('');

 async function createAccount() {
  if (user && pass) {
   const { error } = await supabase.from('doctors').insert([{ username: user, password: pass, role: role }]);
   if (!error) {
    msg = '✅ Account created successfully!';
    user = ''; pass = '';
   } else {
    msg = '❌ Error: ' + error.message;
   }
  }
 }
</script>

<div style="max-width: 400px; padding: 20px; color: inherit;">
 <h2 style="margin-bottom: 20px;">➕ Create New Staff Account</h2>
 
 <div class="card" style="padding: 30px; background: var(--card, white); border-radius: 15px; border: 1px solid var(--border, #ddd);">
  
  <!-- ١. خانەیا ناڤێ بەکارهێنەری -->
  <div style="margin-bottom: 15px;">
   <label for="reg-user" style="display: block; margin-bottom: 8px; font-weight: bold;">Username</label>
   <input id="reg-user" bind:value={user} placeholder="e.g. dr_ahmed" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #ccc; background: white; color: black;" />
  </div>
  
  <!-- ٢. خانەیا پاسوۆردی -->
  <div style="margin-bottom: 15px;">
   <label for="reg-pass" style="display: block; margin-bottom: 8px; font-weight: bold;">Password</label>
   <input id="reg-pass" bind:value={pass} type="password" placeholder="••••••••" style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #ccc; background: white; color: black;" />
  </div>
  
  <!-- ٣. هەلبژارتنا پلەی (Role) -->
  <div style="margin-bottom: 20px;">
   <label for="reg-role" style="display: block; margin-bottom: 8px; font-weight: bold;">Role</label>
   <select id="reg-role" bind:value={role} style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #ccc; background: white; color: black;">
    <option value="doctor">Doctor</option>
    <option value="admin">Admin</option>
   </select>
  </div>

  <button onclick={createAccount} style="width: 100%; background: #059669; color: white; padding: 14px; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; font-size: 1rem;">
   Create Account
  </button>
  
  {#if msg}
   <p style="margin-top: 15px; text-align: center; font-weight: bold; color: #4f46e5;">{msg}</p>
  {/if}
 </div>
</div>
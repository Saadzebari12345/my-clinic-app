<script lang="ts">
  import { supabase } from '$lib/supabaseClient';
  let user = $state(""), pass = $state(""), role = $state("doctor");
  let docName = $state(""), cName = $state(""), cAddr = $state(""), cPhone = $state("");
  let msg = $state(""), isError = $state(false);

  async function createAccount() {
    if (!user || !pass || !docName) return alert("Please fill credentials");
    
    const { error } = await supabase.from('doctors').insert([{ 
      username: user, password: pass, role, 
      doctor_name: docName, clinic_name: cName, 
      clinic_address: cAddr, clinic_phone: cPhone 
    }]);

    if (!error) {
      msg = "✅ Account created with full clinic profile!";
      isError = false;
      user = ""; pass = ""; docName = ""; cName = ""; cAddr = ""; cPhone = "";
    } else {
      msg = "❌ Error: " + error.message;
      isError = true;
    }
  }
</script>

<div class="reg-container">
  <h2>➕ Create New Doctor Account</h2>
  <div class="card grid">
    <section>
      <h4>🔐 Login Info</h4>
      <input bind:value={user} placeholder="Username" />
      <input bind:value={pass} type="password" placeholder="Password" />
      <select bind:value={role}><option value="doctor">Doctor</option><option value="admin">Admin</option></select>
    </section>
    
    <section>
      <h4>🏥 Clinic Profile (Fixed for Print)</h4>
      <input bind:value={docName} placeholder="Doctor Full Name" />
      <input bind:value={cName} placeholder="Clinic Name" />
      <input bind:value={cAddr} placeholder="Clinic Address" />
      <input bind:value={cPhone} placeholder="Clinic Phone" />
    </section>

    <button onclick={createAccount} class="btn-reg">Create Complete Account</button>
    {#if msg}<p style="color: {isError ? 'red' : 'green'};">{msg}</p>{/if}
  </div>
</div>

<style>
  .reg-container { max-width: 800px; margin: 0 auto; color: var(--text); }
  .card { background: var(--card, white); padding: 30px; border-radius: 20px; border: 1px solid var(--border); }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  section { display: flex; flex-direction: column; gap: 10px; }
  h4 { margin: 0; color: #4f46e5; border-bottom: 1px solid #eee; padding-bottom: 5px; }
  input, select { padding: 12px; border-radius: 10px; border: 1px solid #ddd; }
  .btn-reg { grid-column: span 2; background: #059669; color: white; padding: 15px; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; }
</style>
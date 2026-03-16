<script lang="ts">
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 let doctors = $state<any[]>([]);
 let user = $state(""), pass = $state(""), docName = $state(""), cName = $state(""), cAddr = $state(""), cPhone = $state(""), whatsapp = $state(""), tests = $state("");
 let editingDoc = $state<any>(null);

 async function fetchDoctors() {
  const { data } = await supabase.from('doctors').select('*').order('id', { ascending: false });
  if (data) doctors = data;
 }

 onMount(fetchDoctors);

 async function handleSave() {
  if (!user || !pass || !docName || !whatsapp) return alert("تکایە هەمی خانەیان پڕ بکە");
  const docData = { 
   username: user, password: pass, role: 'doctor', 
   doctor_name: docName, clinic_name: cName, 
   clinic_address: cAddr, clinic_phone: cPhone, 
   whatsapp_number: whatsapp, allowed_tests: tests 
  };

  if (editingDoc) {
   await supabase.from('doctors').update(docData).eq('id', editingDoc.id);
  } else {
   await supabase.from('doctors').insert([docData]);
  }
  user = ""; pass = ""; docName = ""; cName = ""; cAddr = ""; cPhone = ""; whatsapp = ""; tests = ""; editingDoc = null;
  fetchDoctors();
  alert("✅ هاتە سەیڤکرن");
 }

 function startEdit(doc: any) {
  editingDoc = doc;
  user = doc.username; pass = doc.password; docName = doc.doctor_name;
  cName = doc.clinic_name; cAddr = doc.clinic_address; cPhone = doc.clinic_phone;
  whatsapp = doc.whatsapp_number; tests = doc.allowed_tests;
 }
</script>

<div style="padding: 20px; color: var(--text);">
 <h2>🛠️ Admin: Manage Doctors & WhatsApp</h2>
 
 <div style="background: var(--card, white); padding: 25px; border-radius: 15px; border: 1px solid var(--border); margin-bottom: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
  <input bind:value={user} placeholder="Username" />
  <input bind:value={pass} type="password" placeholder="Password" />
  <input bind:value={whatsapp} placeholder="WhatsApp (e.g. 964750...)" />
  <input bind:value={docName} placeholder="Doctor's Full Name" />
  <input bind:value={cName} placeholder="Clinic Name" />
  <input bind:value={cAddr} placeholder="Address" />
  <textarea bind:value={tests} placeholder="Lab Tests (CBC, Sugar...)" style="grid-column: span 2;"></textarea>
  <button onclick={handleSave} style="grid-column: span 2; background:#059669; color:white; padding:12px; border:none; border-radius:10px; cursor:pointer;">
   {editingDoc ? 'Update Doctor Info' : 'Create Account'}
  </button>
 </div>

 <h3>📋 List of Doctors</h3>
 {#each doctors as doc}
  <div style="background:var(--card); padding:15px; border-radius:10px; border:1px solid var(--border); margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
   <div><b>Dr. {doc.doctor_name}</b> <br> <small>WhatsApp: {doc.whatsapp_number}</small></div>
   <button onclick={() => startEdit(doc)} style="background:#e0f2fe; color:#0369a1; border:none; padding:8px 15px; border-radius:8px; cursor:pointer;">Edit Info</button>
  </div>
 {/each}
</div>

<style>
 input, textarea { padding: 10px; border-radius: 8px; border: 1px solid #ccc; }
</style>
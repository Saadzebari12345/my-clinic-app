<script lang="ts">
 import { supabase } from '$lib/supabaseClient';
 import { onMount } from 'svelte';

 let doctorId = $state(''), role = $state('');
 let currentPass = $state(''), newUser = $state(''), newPass = $state('');
 
 // گۆڕاوێن ناسنامەیا کلینیکێ (خاڵا ٣)
 let clinicName = $state(''), clinicAddress = $state(''), clinicPhone = $state('');
 
 let msg = $state(''), isError = $state(false), isLoading = $state(false);

 onMount(async () => {
  doctorId = localStorage.getItem('doctor_id') || '';
  role = localStorage.getItem('doctor_role') || '';
  
  if (doctorId) {
   // ئینانا زانیاریێن کلینیکێ ژ داتابەیسێ
   const { data } = await supabase.from('doctors').select('*').eq('id', doctorId).single();
   if (data) {
    clinicName = data.clinic_name || '';
    clinicAddress = data.clinic_address || '';
    clinicPhone = data.clinic_phone || '';
   }
  }
 });

 async function saveClinicInfo() {
  isLoading = true;
  const { error } = await supabase.from('doctors').update({
   clinic_name: clinicName,
   clinic_address: clinicAddress,
   clinic_phone: clinicPhone
  }).eq('id', doctorId);

  if (!error) {
   msg = "✅ Clinic information updated!";
   isError = false;
  } else {
   msg = "❌ Error updating info.";
   isError = true;
  }
  isLoading = false;
 }

 async function updatePassword() {
  // (هەمان کۆدێ تە یێ بەرێ یێ گۆهۆڕینا پاسوۆردی لێرە دابنێ)
 }
</script>

<div class="settings-grid">
 <div class="header">
  <h2>⚙️ System Settings</h2>
 </div>

 <!-- 🏥 بەشێ ناسنامەیا کلینیکێ (خاڵا ٣) -->
 <div class="card clinic-card">
  <h3>🏥 Clinic Identity</h3>
  <p>This information will appear on all printed prescriptions and reports.</p>
  
  <div class="field">
   <label for="cname">Clinic / Center Name</label>
   <input id="cname" bind:value={clinicName} placeholder="e.g. Hope Medical Center" />
  </div>

  <div class="field">
   <label for="caddr">Address / Location</label>
   <input id="caddr" bind:value={clinicAddress} placeholder="e.g. Duhok, KRO Street" />
  </div>

  <div class="field">
   <label for="cphone">Official Phone Number</label>
   <input id="cphone" bind:value={clinicPhone} placeholder="e.g. +964 750 000 0000" />
  </div>

  <button class="btn-save" onclick={saveClinicInfo} disabled={isLoading}>
   {isLoading ? 'Saving...' : '💾 Save Clinic Info'}
  </button>
 </div>

 <!-- 🔐 بەشێ پاراستنا ئەکاونتی -->
 <div class="card">
  <h3>🔐 Account Security</h3>
  <!-- خانەیێن پاسوۆردی لێرە دابنێ وەکی یێن مە بەرێ چێکرین -->
 </div>

 {#if msg}<p class="status-msg {isError ? 'err' : 'ok'}">{msg}</p>{/if}
</div>

<style>
 .settings-grid { max-width: 800px; margin: 0 auto; color: var(--text); }
 .card { background: var(--card, white); padding: 30px; border-radius: 20px; border: 1px solid var(--border, #ddd); margin-bottom: 25px; }
 .clinic-card { border-left: 6px solid #4f46e5; }
 h3 { margin-top: 0; color: #4f46e5; }
 p { font-size: 0.85rem; opacity: 0.7; margin-bottom: 20px; }
 .field { margin-bottom: 15px; }
 label { display: block; font-weight: bold; font-size: 0.85rem; margin-bottom: 5px; }
 input { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border, #ccc); background: white; color: black; box-sizing: border-box; }
 .btn-save { width: 100%; padding: 14px; background: #4f46e5; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; margin-top: 10px; }
 .status-msg { text-align: center; font-weight: bold; }
 .err { color: #ef4444; } .ok { color: #10b981; }
</style>
<script lang="ts">
 import { supabase } from '$lib/supabaseClient';
 import { onMount } from 'svelte';

 // ١. گۆڕاوێن سەرەکی
 let doctorId = $state(''), role = $state('');
 let msg = $state(''), isError = $state(false), isLoading = $state(false);

 // ٢. گۆڕاوێن ناسنامەیا کلینیکێ (خاڵا ٣)
 let clinicName = $state(''), clinicAddress = $state(''), clinicPhone = $state('');

 // ٣. گۆڕاوێن پاراستنا ئەکاونتی
 let currentPass = $state(''), newUsername = $state(''), newPassword = $state('');

 // فانکشنا ئینانا داتایان دا خانە ب خودکار پڕ ببن
 async function fetchDoctorData() {
  if (!doctorId) return;
  const { data, error } = await supabase.from('doctors').select('*').eq('id', doctorId).single();
  if (data) {
   clinicName = data.clinic_name || '';
   clinicAddress = data.clinic_address || '';
   clinicPhone = data.clinic_phone || '';
   // ناڤێ دکتۆری بۆ لایێ چەپێ (Sidebar) ژی نووژەن دکەین
   localStorage.setItem('doctor_username', data.username);
  }
 }

 onMount(async () => {
  doctorId = localStorage.getItem('doctor_id') || '';
  role = localStorage.getItem('doctor_role') || '';
  await fetchDoctorData();
 });

 // ✅ سەیڤکرنا زانیاریێن کلینیکێ
 async function saveClinicInfo() {
  isLoading = true;
  const { error } = await supabase.from('doctors').update({
   clinic_name: clinicName,
   clinic_address: clinicAddress,
   clinic_phone: clinicPhone
  }).eq('id', doctorId);

  if (!error) {
   msg = "✅ Clinic information updated successfully!";
   isError = false;
   await fetchDoctorData(); // نووژەنکرنا ئێکسەر یا شاشێ
  } else {
   msg = "❌ Error: " + error.message;
   isError = true;
  }
  isLoading = false;
 }

 // ✅ گۆهۆڕینا ناڤێ بەکارهێنەری و پاسوۆردی
 async function updateSecurity() {
  if (!currentPass || !newUsername || !newPassword) return alert("Please fill all security fields");
  
  isLoading = true;
  // پشکنینا پاسوۆردێ کۆن
  const { data: doctor } = await supabase.from('doctors').select('password').eq('id', doctorId).single();

  if (doctor && doctor.password === currentPass) {
   const { error } = await supabase.from('doctors').update({
    username: newUsername,
    password: newPassword
   }).eq('id', doctorId);

   if (!error) {
    msg = "✅ Security credentials updated!";
    isError = false;
    currentPass = ""; newUsername = ""; newPassword = "";
    await fetchDoctorData();
   }
  } else {
   msg = "❌ Current password incorrect!";
   isError = true;
  }
  isLoading = false;
 }
</script>

<div class="settings-layout">
 <h2 class="title">⚙️ System Settings</h2>

 {#if msg}
  <div class="alert {isError ? 'error' : 'success'}">{msg}</div>
 {/if}

 <div class="grid">
  <!-- 🏥 بەشێ ناسنامەیا کلینیکێ -->
  <div class="card clinic-section">
   <h3>🏥 Clinic Identity</h3>
   <p class="subtitle">This appears on your printed A4 prescriptions.</p>
   
   <div class="form-group">
    <label for="c-name">Clinic Name</label>
    <input id="c-name" bind:value={clinicName} placeholder="e.g. Duhok Medical Center" />
   </div>

   <div class="form-group">
    <label for="c-addr">Address</label>
    <input id="c-addr" bind:value={clinicAddress} placeholder="e.g. KRO, Near Hospital" />
   </div>

   <div class="form-group">
    <label for="c-phone">Clinic Phone</label>
    <input id="c-phone" bind:value={clinicPhone} placeholder="e.g. 0750 000 0000" />
   </div>

   <button class="btn info" onclick={saveClinicInfo} disabled={isLoading}>
    {isLoading ? 'Wait...' : '💾 Save Clinic Details'}
   </button>
  </div>

  <!-- 🔐 بەشێ پاراستنا ئەکاونتی -->
  <div class="card security-section">
   <h3>🔐 Account Security</h3>
   <p class="subtitle">Change your login username and password.</p>

   <div class="form-group highlight">
    <label for="old-p">Verify Current Password</label>
    <input id="old-p" type="password" bind:value={currentPass} placeholder="••••••••" />
   </div>

   <div class="form-group">
    <label for="new-u">New Username</label>
    <input id="new-u" bind:value={newUsername} placeholder="Enter new username" />
   </div>

   <div class="form-group">
    <label for="new-p">New Password</label><input id="new-p" type="password" bind:value={newPassword} placeholder="••••••••" />
   </div>

   <button class="btn secure" onclick={updateSecurity} disabled={isLoading}>
    {isLoading ? 'Wait...' : '🔑 Update Credentials'}
   </button>
  </div>
 </div>
</div>

<style>
 .settings-layout { max-width: 1000px; margin: 0 auto; color: var(--text); padding: 10px; }
 .title { font-weight: 800; margin-bottom: 30px; }
 
 .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; }
 @media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }

 .card { background: var(--card, white); padding: 25px; border-radius: 20px; border: 1px solid var(--border, #ddd); box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
 .clinic-section { border-top: 5px solid #4f46e5; }
 .security-section { border-top: 5px solid #ef4444; }

 h3 { margin-top: 0; margin-bottom: 5px; }
 .subtitle { font-size: 0.8rem; opacity: 0.6; margin-bottom: 25px; }

 .form-group { margin-bottom: 15px; }
 .highlight { background: rgba(239, 68, 68, 0.05); padding: 15px; border-radius: 12px; }
 
 label { display: block; font-size: 0.85rem; font-weight: bold; margin-bottom: 6px; }
 input { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border, #ccc); background: white !important; color: black !important; box-sizing: border-box; }
 
 .btn { width: 100%; padding: 14px; border: none; border-radius: 12px; cursor: pointer; font-weight: bold; transition: 0.3s; margin-top: 10px; }
 .info { background: #4f46e5; color: white; }
 .secure { background: #ef4444; color: white; }
 .btn:hover { transform: translateY(-2px); opacity: 0.9; }

 .alert { padding: 15px; border-radius: 12px; text-align: center; font-weight: bold; margin-bottom: 20px; }
 .success { background: #dcfce7; color: #166534; }
 .error { background: #fee2e2; color: #991b1b; }
</style>
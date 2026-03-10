<script lang="ts">
 import { supabase } from '$lib/supabaseClient';
 import { onMount } from 'svelte';

 // ١. پێناسەکردنی گۆڕاوەکان (States)
 let currentPass = $state('');
 let newUsername = $state('');
 let newPassword = $state('');
 let msg = $state('');
 let isError = $state(false);
 let isLoading = $state(false);
 
 let doctorId = $state('');
 let role = $state('');

 onMount(() => {
  doctorId = localStorage.getItem('doctor_id') || '';
  role = localStorage.getItem('doctor_role') || '';
 });

 async function saveSettings() {
  if (!doctorId) return;

  // پشکنینی پڕکردنەوەی خانەکان (چارەسەرکردنی خەڵەتی هێڵی ٢٦ ب نیشانێن ||)
  if (role === 'admin') {
   if (!currentPass || !newUsername || !newPassword) {
    msg = "❌ تکایە هەمی خانەیان پڕ بکە.";
    isError = true;
    return;
   }
  } else {
   if (!currentPass || !newPassword) {
    msg = "❌ تکایە پاسوۆردێ کۆن و یێ نوی بنڤیسە.";
    isError = true;
    return;
   }
  }

  isLoading = true;
  msg = "Checking credentials...";

  try {
   // ٢. وەرگرتنی زانیاری دکتۆر (چارەسەرکردنی خەڵەتی possibly null لە هێڵی ٥١)
   const { data: doctor, error: fetchError } = await supabase
    .from('doctors')
    .select('password')
    .eq('id', doctorId)
    .single();

   // پشکنین ئەگەر داتا نەبوو یان پاسوۆرد خەله‌ت بوو
   if (fetchError || !doctor || doctor.password !== currentPass) {
    msg = "❌ پاسوۆردێ نوکە (Current) خەلەتە!";
    isError = true;
    isLoading = false;
    return;
   }

   // ٣. ئامادەکردنی داتاکان بۆ نوێکردنەوە
   let updateData: any = { password: newPassword };
   if (role === 'admin') {
    updateData.username = newUsername; // بتنێ ئەدمین دشێت ناڤی بگۆهۆڕیت
   }

   const { error: updateError } = await supabase
    .from('doctors')
    .update(updateData)
    .eq('id', doctorId);

   if (!updateError) {
    if (role === 'admin') localStorage.setItem('doctor_username', newUsername);
    msg = "✅ زانیاری ب سەرکەفتی هاتنە گۆهۆڕین!";
    isError = false;
    currentPass = ""; newUsername = ""; newPassword = "";
   } else {
    msg = "❌ خەلەتیەک د سەیڤکرنێ دا هەبوو.";
    isError = true;
   }
  } catch (e) {
   msg = "❌ Connection Error!";
   isError = true;
  } finally {
   isLoading = false;
  }
 }
</script>

<div class="settings-wrapper">
 <h2 class="page-title">
  <span>⚙️</span> {role === 'admin' ? 'Admin: System Settings' : 'Doctor: Security Settings'}
 </h2>

 <div class="settings-card">
  <!-- نامەیەک بۆ دکتۆری دا بزانیت بتنێ پاسوۆردی دشێت بگۆهۆڕیت -->
  {#if role === 'doctor'}
   <p class="role-notice">You are logged in as a <b>Doctor</b>. You can only update your password.</p>
  {/if}

  <div class="form-group">
   <label for="cp">Current Password</label>
   <input id="cp" type="password" bind:value={currentPass} placeholder="Enter old password" />
  </div>

  <hr style="margin: 25px 0; opacity: 0.1;" />

  {#if role === 'admin'}
   <div class="form-group">
    <label for="nu">New Admin Username</label>
    <input id="nu" type="text" bind:value={newUsername} placeholder="Enter new username" />
   </div>
  {/if}

  <div class="form-group">
   <label for="np">New Password</label>
   <input id="np" type="password" bind:value={newPassword} placeholder="Enter new password" />
  </div>

  <button onclick={saveSettings} disabled={isLoading} class="btn-save">
   {isLoading ? 'Processing...' : (role === 'admin' ? 'Save Changes Online' : 'Update Password')}
  </button>

  {#if msg}
   <p class="status-msg" style="color: {isError ? '#ef4444' : '#10b981'};">
    {msg}
   </p>
  {/if}
 </div>
</div>

<style>
 .settings-wrapper { padding: 10px; color: inherit; }
 .page-title { display: flex; align-items: center; gap: 10px; color: var(--text, #333); font-size: 1.5rem; margin-bottom: 25px; }
 .settings-card { background: var(--card, white); padding: 30px; border-radius: 15px; border: 1px solid var(--border, #ddd); max-width: 450px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
 .form-group { margin-bottom: 20px; }
 
 .role-notice { font-size: 0.85rem; background: #f0f9ff; color: #0369a1; padding: 12px; border-radius: 8px; border: 1px solid #bae6fd; margin-bottom: 20px; }label { display: block; margin-bottom: 8px; font-size: 0.9rem; font-weight: bold; color: var(--text, #555); }
 input { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #ccc; background: white; color: black; box-sizing: border-box; outline: none; }
 input:focus { border-color: #4f46e5; }

 .btn-save { width: 100%; background: #4f46e5; color: white; border: none; padding: 14px; border-radius: 10px; cursor: pointer; font-weight: bold; font-size: 1rem; transition: 0.3s; }
 .btn-save:hover { background: #4338ca; }
 .btn-save:disabled { background: #94a3b8; cursor: not-allowed; }
 .status-msg { text-align: center; margin-top: 15px; font-size: 0.9rem; font-weight: bold; }

 /* پشتگیری بۆ Dark Mode */
 :global(.dark-mode) .settings-card { --border: #334155; }
 :global(.dark-mode) input { background: #0f172a; color: white; border-color: #334155; }
 :global(.dark-mode) .role-notice { background: #0c4a6e; color: #e0f2fe; border-color: #075985; }
</style>
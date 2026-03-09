<script lang="ts">
 import { supabase } from '$lib/supabaseClient';
 import { onMount } from 'svelte';

 let currentPasswordInput = $state(''); // پاسوۆردێ نوکە بۆ پشکنینێ
 let newUsername = $state('');
 let newPassword = $state('');
 let message = $state('');
 let isError = $state(false);
 let doctorId = $state('');

 onMount(() => {
  doctorId = localStorage.getItem('doctor_id') || '';
 });

 async function saveSettings() {
  if (!doctorId) return;

  // ١. پشکنینا پاسوۆردێ کۆن د داتابەیسێ دا
  const { data: doctor, error: fetchError } = await supabase
   .from('doctors')
   .select('password')
   .eq('id', doctorId)
   .single();

  if (fetchError || doctor.password !== currentPasswordInput) {
   message = '❌ پاسوۆردێ نوکە (Current Password) خەلەتە!';
   isError = true;
   return;
  }

  // ٢. ئەگەر درست بوو، نوکە داتایێن نوی د Supabase دا Update بکە
  if (newUsername && newPassword) {
   const { error: updateError } = await supabase
    .from('doctors')
    .update({ username: newUsername, password: newPassword })
    .eq('id', doctorId);

   if (!updateError) {
    // ٣. نووژەنکرنا LocalStorage دا کو ناڤێ تە ل سەرێ شاشێ بگۆهۆڕیت
    localStorage.setItem('doctor_username', newUsername);
    message = '✅ زانیاری ب سەرکەفتی د داتابەیسێ دا هاتنە گۆهۆڕین!';
    isError = false;
    
    // ڤالاکرنا خانەیان
    currentPasswordInput = '';
    newUsername = '';
    newPassword = '';
   } else {
    message = '❌ خەلەتیەک هەبوو د کاتی سەیڤکرنێ دا.';
    isError = true;
   }
  } else {
   message = '❌ تکایە ناڤ و پاسوۆردێ نوی بنڤیسە.';
   isError = true;
  }
 }
</script>

<div class="settings-page">
 <h2 style="margin-bottom: 25px;">⚙️ System Security Settings</h2>

 <div class="settings-card">
  <h3 style="margin-top: 0; border-bottom: 1px solid var(--border); padding-bottom: 15px;">
   Update Credentials
  </h3>

  <!-- بەشێ پاسوۆردێ نوکە -->
  <div class="input-section warning-box">
   <label for="curr-pass">Current Password (Required)</label>
   <input
    id="curr-pass"
    type="password"
    bind:value={currentPasswordInput}
    placeholder="Enter your current password"
   />
  </div>

  <hr style="border: 0; border-top: 1px solid var(--border); margin: 25px 0;" />

  <!-- بەشێ داتایێن نوی -->
  <div class="input-section">
   <label for="new-user">New Admin Username</label>
   <input
    id="new-user"
    type="text"
    bind:value={newUsername}
    placeholder="e.g. New_Name"
   />
  </div>

  <div class="input-section">
   <label for="new-pass">New Admin Password</label>
   <input
    id="new-pass"
    type="password"
    bind:value={newPassword}
    placeholder="••••••••"
   />
  </div>

  {#if message}
   <p class="status-msg {isError ? 'error' : 'success'}">{message}</p>
  {/if}

  <button onclick={saveSettings} class="save-btn">
   Update Info Online
  </button>
 </div>
</div>

<style>
 .settings-page { color: inherit; max-width: 500px; }
 
 .settings-card { 
  background: var(--card, white); 
  padding: 30px; 
  border-radius: 20px; 
  border: 1px solid var(--border, #ddd);
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
 }

 .input-section { margin-bottom: 20px; display: flex; flex-direction: column; gap: 8px; }
 
 .warning-box { background: rgba(245, 158, 11, 0.1); padding: 15px; border-radius: 12px; border: 1px solid #f59e0b; }

 label { font-size: 0.85rem; font-weight: bold; color: inherit; opacity: 0.8; }
 
 input { 
  padding: 12px; border-radius: 10px; border: 1px solid var(--border, #ccc);
  background: var(--card, white); color: inherit; outline: none;
 }

 .save-btn { 
  width: 100%; padding: 14px; background: #4f46e5; color: white; 
  border: none; border-radius: 12px; cursor: pointer; font-weight: bold; font-size: 1rem;
  transition: 0.3s;
 }
 .save-btn:hover { background: #4338ca; transform: translateY(-2px); }

 .status-msg { text-align: center; font-weight: bold; font-size: 0.85rem; margin-bottom: 15px; }
 .error { color: #ef4444; }
 .success { color: #10b981; }

 /* پشتگیری بۆ Dark Mode */
 :global(.dark-mode) .settings-card {
  --card: #1e293b; --border: #334155;
 }
</style>
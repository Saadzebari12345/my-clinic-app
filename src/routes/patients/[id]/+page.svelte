<script lang="ts">
 import { page } from '$app/state';
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 interface Patient { id: number; name: string; age: number; phone: string; gender: string; }
 interface MedicalRecord { id: number; diagnosis: string; treatment: string; notes: string; created_at: string; doctor_id: number; }

 let patientId = page.params.id;
 let doctorId = $state(0);
 let patientInfo = $state<Patient | null>(null);
 let records = $state<MedicalRecord[]>([]);
 
 let diagnosis = $state(''), treatment = $state(''), notes = $state('');
 let isSaving = $state(false);

 // ١. فانکشنا سەرەکی بۆ ئینانا داتایێن پاراستی ژ Supabase
 async function loadAllData() {
  const storedId = localStorage.getItem('doctor_id');
  if (storedId) doctorId = Number(storedId);

  // وەرگرتنا زانیاریێن نەخۆشی
  const { data: p } = await supabase.from('patients').select('*').eq('id', patientId).single();
  if (p) patientInfo = p;

  // وەرگرتنا مێژوویا پزیشکی (فلتەرکرن ب ئایدییا دکتۆری دا تێکەلی چێنەبیت)
  const { data: r, error } = await supabase
   .from('medical_records')
   .select('*')
   .eq('patient_id', Number(patientId))
   .eq('doctor_id', doctorId) // تەنێ ڕاپۆرتێن ڤی دکتۆری
   .order('created_at', { ascending: false });
  
  if (r) records = r;
  if (error) console.error("Error loading history:", error.message);
 }

 onMount(loadAllData);

 // ٢. فانکشنا زێدەکرنا ڕاپۆرتا نوی (سەیڤکرن بۆ هەتا هەتایێ)
 async function addRecord() {
  if (!diagnosis || !treatment) return alert("تکایە خانەیان پڕ بکە");
  
  isSaving = true;
  const { data, error } = await supabase.from('medical_records').insert([{
   patient_id: Number(patientId),
   doctor_id: doctorId,
   diagnosis: diagnosis,
   treatment: treatment,
   notes: notes
  }]).select();
  
  if (!error && data) {
   diagnosis = ''; treatment = ''; notes = '';
   // زێدەکرنا ڕاستەوخۆ بۆ لیستا لایێ ڕاستێ دا تو ب لێزی ببینی
   records = [data[0], ...records];
   alert("✅ Record saved and protected!");
  } else {
   alert("Error saving to cloud: " + error?.message);
  }
  isSaving = false;
 }
</script>

{#if patientInfo}
 <div class="profile-container">
  <header class="card header-card">
   <div class="info">
    <h1>👤 {patientInfo.name}</h1>
    <div class="meta">Age: {patientInfo.age} | Phone: {patientInfo.phone}</div>
   </div>
   <a href="/patients" class="btn-back">⬅ Back to Patients</a>
  </header>

  <div class="main-grid">
   <!-- فۆرما نڤیسینا ڕاپۆرتێ -->
   <div class="card form-section">
    <h3>📝 New Medical Record</h3>
    <div class="field">
     <label for="diag">Diagnosis</label>
     <input id="diag" bind:value={diagnosis} placeholder="Condition name..." />
    </div>
    <div class="field">
     <label for="treat">Treatment / Medications</label>
     <textarea id="treat" bind:value={treatment} placeholder="Medications and dosage..."></textarea>
    </div>
    <div class="field">
     <label for="note">Private Notes</label>
     <textarea id="note" bind:value={notes} placeholder="Notes for future visits..."></textarea>
    </div>
    <button class="save-btn" onclick={addRecord} disabled={isSaving}>
     {isSaving ? 'Connecting to Database...' : '💾 Save & Protect Record'}
    </button>
   </div>

   <!-- لایێ ڕاستێ: تاریخا پزیشکی یا پاراستی -->
   <div class="history-section">
    <h3>📜 Medical History ({records.length})</h3>
    {#each records as record (record.id)}
     <div class="history-item card">
      <div class="date">📅 {new Date(record.created_at).toLocaleDateString()}</div>
      <h4>{record.diagnosis}</h4>
      <p class="txt"><b>Treatment:</b> {record.treatment}</p>
      {#if record.notes}<p class="note"><i>{record.notes}</i></p>{/if}
     </div>
    {:else}
     <div class="empty-msg">No medical records found. New entries will be saved online.</div>
    {/each}
   </div>
  </div>
 </div>
{:else}
 <div class="loading">Fetching patient data from Supabase...</div>
{/if}

<style>
 .profile-container { max-width: 1200px; margin: 0 auto; color: var(--text); }
 .card { background: var(--card, white); padding: 25px; border-radius: 15px; border: 1px solid var(--border, #ddd); margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
 .header-card { display: flex; justify-content: space-between; align-items: center; border-left: 6px solid #4f46e5; }
 .main-grid { display: grid; grid-template-columns: 450px 1fr; gap: 20px; }
 @media (max-width: 1000px) { .main-grid { grid-template-columns: 1fr; } }
 
 .field { margin-bottom: 15px; }
 label { display: block; font-weight: bold; margin-bottom: 5px; font-size: 0.85rem; }
 input, textarea { width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ccc; background: white; color: black; box-sizing: border-box; }
 textarea { height: 100px; resize: none; }
 
 .save-btn { width: 100%; padding: 15px; background: #4f46e5; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; font-size: 1rem; }
 .btn-back { text-decoration: none; background: #f3f4f6; color: #333; padding: 10px 15px; border-radius: 8px; font-weight: bold; font-size: 0.85rem; }

 .history-item { border-left: 5px solid #10b981; }
 .date { font-size: 0.8rem; font-weight: bold; color: #10b981; margin-bottom: 10px; }
 h4 { margin: 0 0 10px 0; color: inherit; font-size: 1.1rem; }
 .txt { font-size: 0.95rem; line-height: 1.5; }
 .note { opacity: 0.7; font-size: 0.85rem; margin-top: 10px; border-top: 1px dashed #ddd; padding-top: 10px; }
 .empty-msg { text-align: center; padding: 60px; border: 2px dashed #ddd; border-radius: 15px; color: #999; }
</style>
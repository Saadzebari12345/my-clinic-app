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

 // ١. فانکشنا سەرەکی بۆ ئینانا داتایان
 async function loadAllData() {
  // وەرگرتنا ئایدییا دکتۆرێ نوکە یێ چوونەژوورێ کری
  const storedId = localStorage.getItem('doctor_id');
  if (storedId) {
   doctorId = Number(storedId);
  } else {
   console.error("No doctor ID found in localStorage!");
   return;
  }

  // ئینانا زانیاریێن نەخۆشی
  const { data: p } = await supabase.from('patients').select('*').eq('id', patientId).single();
  if (p) patientInfo = p;

  // ئینانا مێژوویا پزیشکی
  // تێبینی: مە فلتەرێ doctor_id لادان دا تو بزانی کا داتایێن تە ل کیرێنە
  const { data: r, error } = await supabase
   .from('medical_records')
   .select('*')
   .eq('patient_id', Number(patientId))
   .order('created_at', { ascending: false });
  
  if (r) {
   records = r;
   console.log("Records found for this patient:", r);
  }
  if (error) console.error("Database Error:", error.message);
 }

 onMount(loadAllData);

 // ٢. فانکشنا زێدەکرنا ڕاپۆرتێ
 async function addRecord() {
  if (!diagnosis || !treatment) return alert("تکایە خانەیان پڕ بکە");
  
  isSaving = true;
  const { data, error } = await supabase.from('medical_records').insert([{
   patient_id: Number(patientId),
   doctor_id: doctorId, // لێرە ئایدییا دکتۆرێ نوکە دهێتە تۆمارکرن
   diagnosis,
   treatment,
   notes
  }]).select();
  
  if (!error && data) {
   diagnosis = ''; treatment = ''; notes = '';
   // نوژەنکرنا لیستێ ب ڕاستەوخۆ
   records = [data[0], ...records];
  } else {
   alert("Error saving: " + error?.message);
  }
  isSaving = false;
 }
</script>

{#if patientInfo}
 <div class="container">
  <header class="card header-box">
   <div class="p-info">
    <h1>👤 {patientInfo.name}</h1>
    <div class="meta">Age: {patientInfo.age} | Phone: {patientInfo.phone}</div>
   </div>
   <a href="/patients" class="back-link">⬅ Back</a>
  </header>

  <div class="main-grid">
   <!-- فۆرم (لایێ چەپێ) -->
   <div class="card">
    <h3>📝 New Consultation</h3>
    <div class="field">
     <label for="d">Diagnosis</label>
     <input id="d" bind:value={diagnosis} placeholder="Condition name..." />
    </div>
    <div class="field">
     <label for="t">Treatment</label>
     <textarea id="t" bind:value={treatment} placeholder="Meds and dosage..."></textarea>
    </div>
    <div class="field">
     <label for="n">Doctor's Notes</label>
     <textarea id="n" bind:value={notes} placeholder="Notes for you only..."></textarea>
    </div>
    <button class="save-btn" onclick={addRecord} disabled={isSaving}>
     {isSaving ? 'Connecting...' : '💾 Save & Protect'}
    </button>
   </div>

   <!-- مێژوو (لایێ ڕاستێ) -->
   <div class="history-list">
    <h3>📜 Medical History ({records.length})</h3>
    {#each records as record (record.id)}
     <div class="history-item card">
      <div class="date">📅 {new Date(record.created_at).toLocaleDateString()}</div>
      <div class="doc-tag">Doctor ID: {record.doctor_id}</div>
      <h4>{record.diagnosis}</h4>
      <p><b>Rx:</b> {record.treatment}</p>
      {#if record.notes}<p class="note"><i>{record.notes}</i></p>{/if}
     </div>
    {:else}
     <div class="empty">No records found. Records you save will always stay here.</div>
    {/each}
   </div>
  </div>
 </div>
{/if}

<style>
 .container { max-width: 1200px; margin: 0 auto; color: var(--text); padding: 10px; }
 .card { background: var(--card, white); padding: 25px; border-radius: 15px; border: 1px solid var(--border, #ddd); margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
 .header-box { display: flex; justify-content: space-between; align-items: center; border-left: 6px solid #4f46e5; }
 .main-grid { display: grid; grid-template-columns: 450px 1fr; gap: 20px; }
 @media (max-width: 1000px) { .main-grid { grid-template-columns: 1fr; } }
 
 .field { margin-bottom: 15px; }
 label { display: block; font-weight: bold; margin-bottom: 5px; font-size: 0.85rem; }
 input, textarea { width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ccc; background: white; color: black; box-sizing: border-box; font-family: inherit; }
 textarea { height: 80px; resize: none; }
 
 .save-btn { width: 100%; padding: 15px; background: #4f46e5; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; font-size: 1rem; }
 .back-link { text-decoration: none; background: #f3f4f6; color: #333; padding: 10px 15px; border-radius: 8px; font-weight: bold; }

 .history-item { border-left: 5px solid #10b981; }
 .date { font-size: 0.8rem; font-weight: bold; color: #10b981; margin-bottom: 5px; }
 .doc-tag { font-size: 0.65rem; color: #999; margin-bottom: 10px; }
 h4 { margin: 0 0 10px 0; font-size: 1.1rem; color: inherit; }
 .note { opacity: 0.7; font-size: 0.85rem; margin-top: 10px; border-top: 1px dashed #ddd; padding-top: 10px; }
 .empty { text-align: center; padding: 50px; border: 2px dashed #ddd; border-radius: 15px; opacity: 0.5; }
</style>
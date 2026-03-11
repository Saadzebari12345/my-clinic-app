<script lang="ts">
 import { page } from '$app/state';
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 // ١. پێناسەکرنا جۆرێ داتایان
 interface Patient { id: number; name: string; age: number; phone: string; gender: string; }
 interface MedicalRecord { id: number; diagnosis: string; treatment: string; notes: string; created_at: string; }

 let patientId = page.params.id; // وەرگرتنا ئایدییا نەخۆشی ژ لینکی
 let doctorId = $state(0);
 let patientInfo = $state<Patient | null>(null);
 let records = $state<MedicalRecord[]>([]); // لیستا ڕاپۆرتان
 
 let diagnosis = $state(''), treatment = $state(''), notes = $state('');
 let isSaving = $state(false);

 // ٢. فانکشنا سەرەکی بۆ ئینانا داتایێن پاراستی ژ Supabase
 async function loadAllData() {
  // وەرگرتنا ئایدییا دکتۆری ژ میشکێ بڕاوسەری
  const storedId = localStorage.getItem('doctor_id');
  if (storedId) {
   doctorId = Number(storedId);
  } else {
   console.error("No doctor ID found!");
   return;
  }

  // ئینانا زانیاریێن نەخۆشی
  const { data: p } = await supabase.from('patients').select('*').eq('id', patientId).single();
  if (p) patientInfo = p;

  // ئینانا مێژوویا پزیشکی (ئەڤە ئەو بەشەیە یێ بەرزە دبوو)
  // ئێمە لێرە مەرجێ patient_id بەکاردئینین دا ڕاپۆرتێن وی بتنێ بێین
  const { data: r, error } = await supabase
   .from('medical_records')
   .select('*')
   .eq('patient_id', Number(patientId))
   .order('created_at', { ascending: false });
  
  if (error) {
   console.error("Error fetching history:", error.message);
  } else if (r) {
   records = r; // نووژەنکرنا لایێ ڕاستێ ب داتایێن داتابەیسێ
  }
 }

 // ئەڤە گرنگترین پشکە: هەر دەمێ لاپەرە ڤەببیت، دێ چیت داتایان ئینیت
 onMount(() => {
  loadAllData();
 });

 // ٣. فانکشنا زێدەکرنا ڕاپۆرتا نوی و سەیڤکرن بۆ هەتا هەتایێ
 async function addRecord() {
  if (!diagnosis || !treatment) return alert("تکایە خانەیان پڕ بکە");
  
  isSaving = true;
  const { data, error } = await supabase.from('medical_records').insert([{
   patient_id: Number(patientId),
   doctor_id: doctorId,
   diagnosis,
   treatment,
   notes
  }]).select(); // select() دێ داتایا نوی زڤڕینیتەڤە
  
  if (!error && data) {
   diagnosis = ''; treatment = ''; notes = '';
   // زێدەکرنا ڕاپۆرتا نوی ل سەرێ لیستێ بێی ڕیفرێش
   records = [data[0], ...records];
   alert("✅ Record Saved Permanently!");
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
   <a href="/patients" class="back-link">⬅ Back to Patients</a>
  </header>

  <div class="main-grid">
   <!-- فۆرما نڤیسینێ (لایێ چەپێ) -->
   <div class="card form-section">
    <h3>📝 New Consultation</h3>
    <div class="field">
     <label for="diag">Diagnosis (نەخۆشی)</label>
     <input id="diag" bind:value={diagnosis} placeholder="Enter condition..." />
    </div>
    <div class="field">
     <label for="treat">Treatment (دەرمان)</label>
     <textarea id="treat" bind:value={treatment} placeholder="Meds and dosage..."></textarea>
    </div>
    <div class="field">
     <label for="note">Private Notes</label>
     <textarea id="note" bind:value={notes} placeholder="Notes for future..."></textarea>
    </div>
    <button class="save-btn" onclick={addRecord} disabled={isSaving}>
     {isSaving ? 'Protecting Data...' : '💾 Save & Protect Record'}
    </button>
   </div>

   <!-- مێژوویا پزیشکی (لایێ ڕاستێ) -->
   <div class="history-list">
    <h3>📜 Medical History ({records.length})</h3>
    {#each records as record (record.id)}
     <div class="record card">
      <div class="date">📅 {new Date(record.created_at).toLocaleDateString()}</div>
      <h4>{record.diagnosis}</h4>
      <p><b>Treatment:</b> {record.treatment}</p>
      {#if record.notes}<p class="note"><i>{record.notes}</i></p>{/if}
     </div>
    {:else}
     <div class="empty-msg">No medical records found. Add the first one to save it forever.</div>
    {/each}
   </div>
  </div>
 </div>
{:else}
 <div class="loading">Fetching patient data...</div>
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
 textarea { height: 100px; resize: none; }
 
 .save-btn { width: 100%; padding: 15px; background: #4f46e5; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; font-size: 1rem; }
 .back-link { text-decoration: none; background: #f3f4f6; color: #333; padding: 10px 15px; border-radius: 8px; font-weight: bold; }

 .record { border-left: 5px solid #10b981; margin-bottom: 15px; }
 .date { font-size: 0.8rem; font-weight: bold; color: #10b981; margin-bottom: 5px; }
 h4 { margin: 0 0 10px 0; font-size: 1.1rem; color: inherit; }
 .note { opacity: 0.7; font-size: 0.85rem; margin-top: 10px; border-top: 1px dashed #ddd; padding-top: 10px; }
 .empty-msg { text-align: center; padding: 50px; border: 2px dashed #ddd; border-radius: 15px; color: #999; }
</style>
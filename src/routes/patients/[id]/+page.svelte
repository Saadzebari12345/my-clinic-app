<script lang="ts">
 import { page } from '$app/state';
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 // ١. پێناسەکرنا جۆرێ داتایان
 interface Patient { id: number; name: string; age: number; phone: string; gender: string; }
 interface MedicalRecord { 
  id: number; 
  diagnosis: string; 
  treatment: string; 
  notes: string; 
  created_at: string; // ڕێکەفت لێرە دهێت
 }

 let patientId = page.params.id; // وەرگرتنا ئایدییا نەخۆشی ژ لینکێ سەرێ
 let doctorId = $state(0);
 let patientInfo = $state<Patient | null>(null);
 let records = $state<MedicalRecord[]>([]); // لیستا مێژوویا پزیشکی
 
 let diagnosis = $state(''), treatment = $state(''), notes = $state('');
 let isSaving = $state(false);

 // ٢. فانکشنا سەرەکی بۆ ئینانا داتایان ژ Supabase (ئەڤە داتایان د پارێزیت)
 async function loadAllData() {
  const storedId = localStorage.getItem('doctor_id');
  if (storedId) doctorId = Number(storedId);

  // ئینانا زانیاریێن نەخۆشی (ناڤ و تەمەن)
  const { data: p } = await supabase.from('patients').select('*').eq('id', patientId).single();
  if (p) patientInfo = p;

  // ئینانا مێژوویا پزیشکی (ئەوا بەرزە دبوو)
  const { data: r, error } = await supabase
   .from('medical_records')
   .select('*')
   .eq('patient_id', patientId)
   .order('created_at', { ascending: false }); // نویترین ل سەرێ بیت
  
  if (r) {
   records = r; 
  }
  if (error) console.error("Error loading records:", error.message);
 }

 // ئەڤە گرنگترین پشکە: هەر دەمێ تو دزڤڕی سەر ڤی لاپەرەی، ئەڤە دچیت داتایان دئینیت
 onMount(() => {
  loadAllData();
 });

 // ٣. فانکشنا سەیڤکرنا ڕاپۆرتا نوی
 async function addRecord() {
  if (!diagnosis || !treatment) return alert("تکایە خانەیان پڕ بکە");
  
  isSaving = true;
  const { error } = await supabase.from('medical_records').insert([{
   patient_id: Number(patientId),
   doctor_id: doctorId,
   diagnosis,
   treatment,
   notes
  }]);
  
  if (!error) {
   diagnosis = ''; treatment = ''; notes = '';
   await loadAllData(); // نوژەنکرنا لیستا لایێ ڕاستێ ب ڕاستەوخۆ
  } else {
   alert("Error: " + error.message);
  }
  isSaving = false;
 }

 // فانکشنا جوانکرنا شێوازێ ڕێکەفتی (Date Format)
 function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB') + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
 }
</script>

{#if patientInfo}
 <div class="profile-container">
  <!-- Header -->
  <header class="card patient-header">
   <div class="p-info">
    <h1>👤 {patientInfo.name}</h1>
    <div class="meta">Age: {patientInfo.age} | Phone: {patientInfo.phone}</div>
   </div>
   <a href="/patients" class="back-btn">⬅ Back to List</a>
  </header>

  <div class="main-grid">
   <!-- Form (لایێ چەپێ) -->
   <div class="card form-section">
    <h3>📝 New Consultation</h3>
    <div class="field">
     <label for="diag">Diagnosis (نەخۆشی)</label>
     <input id="diag" bind:value={diagnosis} placeholder="Condition name..." />
    </div>
    <div class="field">
     <label for="treat">Treatment & Medications</label>
     <textarea id="treat" bind:value={treatment} placeholder="Dosage and medicines..."></textarea>
    </div>
    <div class="field">
     <label for="note">Private Notes</label>
     <textarea id="note" bind:value={notes} placeholder="Notes for future visits..."></textarea>
    </div>
    <button class="save-btn" onclick={addRecord} disabled={isSaving}>
     {isSaving ? 'Saving...' : '💾 Save & Protect Record'}
    </button>
   </div>

   <!-- History (لایێ ڕاستێ - ئێدی لێرە دمینن) -->
   <div class="history-list">
    <h3>📜 Medical History ({records.length})</h3>
    {#each records as record (record.id)}
     <div class="record-item card">
      <!-- پیشاندانا ڕێکەفتی ب دروستی -->
      <div class="date-tag">📅 {formatDate(record.created_at)}</div>
      <h4>{record.diagnosis}</h4>
      <p class="txt"><b>Rx:</b> {record.treatment}</p>
      {#if record.notes}<p class="note"><i>Note: {record.notes}</i></p>{/if}
     </div>
    {:else}
     <div class="empty-msg">No history found.Records you save will stay here forever.</div>
    {/each}
   </div>
  </div>
 </div>
{:else}
 <div class="loading">Loading patient records...</div>
{/if}

<style>
 .profile-container { max-width: 1200px; margin: 0 auto; color: var(--text); animation: fadeIn 0.3s; }
 @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

 .card { background: var(--card, white); padding: 25px; border-radius: 15px; border: 1px solid var(--border, #ddd); margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
 
 .patient-header { display: flex; justify-content: space-between; align-items: center; border-left: 6px solid #4f46e5; }
 .back-btn { text-decoration: none; background: #f3f4f6; color: #333; padding: 10px 15px; border-radius: 8px; font-weight: bold; font-size: 0.9rem; }

 .main-grid { display: grid; grid-template-columns: 450px 1fr; gap: 20px; }
 @media (max-width: 1000px) { .main-grid { grid-template-columns: 1fr; } }
 
 .field { margin-bottom: 15px; }
 label { display: block; font-weight: bold; margin-bottom: 5px; font-size: 0.85rem; }
 input, textarea { width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ccc; background: white; color: black; box-sizing: border-box; font-family: inherit; }
 textarea { height: 100px; resize: none; }
 
 .save-btn { width: 100%; padding: 14px; background: #4f46e5; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; font-size: 1rem; }
 
 .record-item { border-left: 5px solid #10b981; margin-bottom: 15px; position: relative; }
 .date-tag { font-size: 0.8rem; font-weight: bold; color: #10b981; margin-bottom: 10px; }
 h4 { margin: 0 0 10px 0; font-size: 1.1rem; color: inherit; }
 .txt { font-size: 0.95rem; line-height: 1.5; }
 .note { opacity: 0.7; font-size: 0.85rem; margin-top: 10px; border-top: 1px dashed #ddd; padding-top: 10px; }

 .empty-msg { text-align: center; padding: 60px; border: 2px dashed #ddd; border-radius: 15px; color: #999; }
 .loading { text-align: center; padding: 100px; font-weight: bold; }
</style>
<script lang="ts">
 import { page } from '$app/state';
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 interface Patient { id: number; name: string; age: number; phone: string; gender: string; }
 interface MedicalRecord { id: number; diagnosis: string; treatment: string; notes: string; created_at: string; }

 // ١. وه‌رگرتنا ئایدییا نه‌خۆشی ب شێوه‌كێ باوه‌رپێكری
 let patientId = $derived(page.params.id); 
 
 let doctorId = $state(0);
 let patientInfo = $state<Patient | null>(null);
 let records = $state<MedicalRecord[]>([]);
 
 let diagnosis = $state(''), treatment = $state(''), notes = $state('');
 let isSaving = $state(false);

 // ٢. فانكشنا هێنانا مێژوویا پزیشكی (ئه‌ڤه‌ ئه‌و پشكه‌ بوو یا كێشه‌ تێدا)
 async function loadMedicalHistory() {
  if (!patientId) return;

  console.log("Loading history for patient:", patientId);

  // گرنگترین پشك: فلتەرکردن ب ڕێکا ئایدییا نه‌خۆشی وه‌ك "ژماره‌"
  const { data, error } = await supabase
   .from('medical_records')
   .select('*')
   .eq('patient_id', Number(patientId)) // ڤه‌گۆهۆڕین بۆ ژماره‌ Number()
   .order('created_at', { ascending: false });

  if (error) {
   console.error("Fetch Error:", error.message);
  } else {
   console.log("Data successfully loaded from DB:", data);
   records = data || []; // نوژه‌نكرنا لیستا لایێ ڕاستێ
  }
 }

 async function loadPatientInfo() {
  const { data } = await supabase
   .from('patients')
   .select('*')
   .eq('id', Number(patientId))
   .single();
  if (data) patientInfo = data;
 }

 onMount(async () => {
  doctorId = Number(localStorage.getItem('doctor_id'));
  await loadPatientInfo();
  await loadMedicalHistory(); // ئینانا تاریخا پزیشکی هه‌ر ده‌مێ لاپه‌ره‌ ڤه‌ببیت
 });

 // ٣. فانكشنا سه‌یڤكرنێ و پاراستنا داتایان بۆ هه‌تا هه‌تایێ
 async function addRecord() {
  if (!diagnosis || !treatment) return alert("تکایە خانەیان پڕ بکە");
  
  isSaving = true;
  const { data, error } = await supabase.from('medical_records').insert([{
   patient_id: Number(patientId),
   doctor_id: doctorId,
   diagnosis,
   treatment,
   notes
  }]).select(); // select() دا داتایا نوو ئێكسه‌ر ب ڕێكه‌فتا درست ڤه‌ بزڤڕیت
  
  if (!error && data) {
   diagnosis = ''; treatment = ''; notes = '';
   // زێده‌كرنا ڕاسته‌وخۆ بۆ لیستێ دا ده‌ستبه‌جێ دیار بیت
   records = [data[0], ...records];
   alert("✅ پیزانین ب سه‌ركه‌فتی هاتنە پاراستن و قوفڵ کرن!");
  } else {
   alert("Error saving: " + error?.message);
  }
  isSaving = false;
 }
</script>

{#if patientInfo}
 <div class="container">
  <header class="card header-card">
   <div class="info">
    <h1>👤 {patientInfo.name}</h1>
    <p>Age: {patientInfo.age} | Phone: {patientInfo.phone}</p>
   </div>
   <a href="/patients" class="btn-back">⬅ Back to List</a>
  </header>

  <div class="grid">
   <!-- فۆرم (لایێ چه‌پێ) -->
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
     <textarea id="note" bind:value={notes} placeholder="Notes for future visits..."></textarea>
    </div>
    <button class="save-btn" onclick={addRecord} disabled={isSaving}>
     {isSaving ? 'Saving...' : '💾 Save & Protect Record'}
    </button>
   </div>

   <!-- تاریخا پزیشكی (لایێ ڕاستێ - ئێدی لێرە دمینن) -->
   <div class="history-list">
    <h3>📜 Medical History ({records.length})</h3>
    {#each records as record (record.id)}
     <div class="record card">
      <div class="date">📅 {new Date(record.created_at).toLocaleString()}</div>
      <h4>Diagnosis: {record.diagnosis}</h4>
      <p><b>Rx:</b> {record.treatment}</p>
      {#if record.notes}<p class="note"><i>{record.notes}</i></p>{/if}
     </div>
    {:else}
     <div class="empty">No medical history found.Records saved will stay here forever.</div>
    {/each}
   </div>
  </div>
 </div>
{:else}
 <div class="loading">Loading patient records from database...</div>
{/if}

<style>
 .container { max-width: 1200px; margin: 0 auto; color: var(--text); padding: 10px; }
 .card { background: var(--card, white); padding: 25px; border-radius: 15px; border: 1px solid var(--border, #ddd); margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
 .header-card { display: flex; justify-content: space-between; align-items: center; border-left: 6px solid #4f46e5; }
 
 .grid { display: grid; grid-template-columns: 450px 1fr; gap: 20px; }
 @media (max-width: 1000px) { .grid { grid-template-columns: 1fr; } }
 
 .field { margin-bottom: 15px; }
 label { display: block; font-weight: bold; margin-bottom: 5px; font-size: 0.85rem; }
 input, textarea { width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ccc; background: white !important; color: black !important; box-sizing: border-box; font-family: inherit; }
 textarea { height: 100px; resize: none; }
 
 .save-btn { width: 100%; padding: 14px; background: #4f46e5; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; }
 .btn-back { text-decoration: none; background: #f3f4f6; color: #333; padding: 10px 15px; border-radius: 8px; font-weight: bold; }

 .record { border-left: 5px solid #10b981; margin-bottom: 15px; }
 .date { font-size: 0.8rem; font-weight: bold; color: #10b981; margin-bottom: 10px; }
 h4 { margin: 0 0 10px 0; color: inherit; }
 .note { opacity: 0.7; font-size: 0.85rem; margin-top: 10px; border-top: 1px dashed #ddd; padding-top: 10px; }
 .empty { text-align: center; padding: 50px; border: 2px dashed #ddd; border-radius: 15px; opacity: 0.5; }
</style>
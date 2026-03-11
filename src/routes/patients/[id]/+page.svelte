<script lang="ts">
 import { page } from '$app/state';
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 interface Patient { name: string; age: number; phone: string; gender: string; }
 interface MedicalRecord { id: number; diagnosis: string; treatment: string; notes: string; created_at: string; }

 let patientId = page.params.id;
 let doctorId = $state(0);
 let patientInfo = $state<Patient | null>(null);
 let records = $state<MedicalRecord[]>([]);
 
 let diagnosis = $state(''), treatment = $state(''), notes = $state('');
 let isSaving = $state(false);

 // ١. فانکشنا ئینانا تاریخا پزیشکی (گەلەک گرنگە)
 async function loadHistory() {
  console.log("Fetching history for patient:", patientId);
  
  const { data, error } = await supabase
   .from('medical_records')
   .select('*')
   .eq('patient_id', patientId) // دڤێت ئەڤ ناڤە ڕێک وەک داتابەیسێ بیت
   .order('created_at', { ascending: false });
  
  if (error) {
   console.error("Supabase Fetch Error:", error.message);
  } else {
   console.log("Records found:", data);
   records = data || []; // نووژەنکرنا لیستا لایێ ڕاستێ
  }
 }

 async function loadPatientInfo() {
  const { data } = await supabase.from('patients').select('*').eq('id', patientId).single();
  if (data) patientInfo = data;
 }

 onMount(async () => {
  const storedId = localStorage.getItem('doctor_id');
  if (storedId) doctorId = Number(storedId);

  await loadPatientInfo();
  await loadHistory();
 });

 // ٢. فانکشنا زێدەکرنا ڕاپۆرتا نوی
 async function addRecord() {
  if (!diagnosis || !treatment) return alert("تکایە خانەیان پڕ بکە");
  
  isSaving = true;
  const { data, error } = await supabase.from('medical_records').insert([{
   patient_id: Number(patientId),
   doctor_id: doctorId,
   diagnosis,
   treatment,
   notes
  }]).select(); // ئەڤە داتایا نوو دزڤڕینیت
  
  if (!error) {
   diagnosis = ''; treatment = ''; notes = '';
   // نووژەنکرنا لیستا لایێ ڕاستێ ب شێوازەکێ خێرا
   if (data) {
    records = [data[0], ...records];
   }
  } else {
   alert("Error adding record: " + error.message);
  }
  isSaving = false;
 }
</script>

{#if patientInfo}
 <div class="container">
  <header class="card header-card">
   <div class="p-info">
    <h1>👤 {patientInfo.name}</h1>
    <div class="meta">Age: {patientInfo.age} | Gender: {patientInfo.gender} | Phone: {patientInfo.phone}</div>
   </div>
   <a href="/patients" class="btn-back">⬅ Back</a>
  </header>

  <div class="grid">
   <!-- لایێ چەپێ: فۆرم -->
   <div class="card">
    <h3>📝 New Consultation</h3>
    <div class="field">
     <label for="d">Diagnosis</label>
     <input id="d" bind:value={diagnosis} placeholder="Enter condition..." />
    </div>
    <div class="field">
     <label for="t">Treatment</label>
     <textarea id="t" bind:value={treatment} placeholder="Meds and dosage..."></textarea>
    </div>
    <div class="field">
     <label for="n">Doctor's Notes</label>
     <textarea id="n" bind:value={notes} placeholder="Additional info..."></textarea>
    </div>
    <button class="btn-save" onclick={addRecord} disabled={isSaving}>
     {isSaving ? 'Saving...' : '💾 Save Record'}
    </button>
   </div>

   <!-- لایێ ڕاستێ: تاریخ -->
   <div class="history">
    <h3>📜 Medical History ({records.length})</h3>
    {#each records as record (record.id)}
     <div class="record-card card">
      <div class="date">📅 {new Date(record.created_at).toLocaleDateString()}</div>
      <h4>{record.diagnosis}</h4>
      <p><b>Treatment:</b> {record.treatment}</p>
      {#if record.notes}<p class="note"><i>{record.notes}</i></p>{/if}
     </div>
    {:else}
     <div class="empty">No records found. Add the first one!</div>
    {/each}
   </div>
  </div>
 </div>
{/if}

<style>
 .container { max-width: 1200px; margin: 0 auto; color: var(--text); }
 .card { background: var(--card, white); padding: 25px; border-radius: 15px; border: 1px solid var(--border, #ddd); margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
 .header-card { display: flex; justify-content: space-between; align-items: center; border-left: 6px solid #4f46e5; }
 .grid { display: grid; grid-template-columns: 450px 1fr; gap: 20px; }
 @media (max-width: 1000px) { .grid { grid-template-columns: 1fr; } }
 
 .field { margin-bottom: 15px; }
 label { display: block; font-weight: bold; margin-bottom: 5px; font-size: 0.85rem; }
 input, textarea { width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ccc; background: white; color: black; box-sizing: border-box; }
 textarea { height: 80px; resize: none; }
 
 .btn-save { width: 100%; padding: 14px; background: #4f46e5; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; }
 .btn-back { text-decoration: none; background: #f3f4f6; padding: 10px 15px; border-radius: 8px; color: #333; font-weight: bold; }

 .record-card { border-left: 5px solid #10b981; margin-bottom: 15px; }
 .date { font-size: 0.8rem; font-weight: bold; color: #10b981; margin-bottom: 10px; }
 h4 { margin: 0 0 10px 0; font-size: 1.1rem; }
 p { margin: 5px 0; font-size: 0.95rem; }
 .note { opacity: 0.7; font-size: 0.85rem; margin-top: 10px; border-top: 1px dashed #ddd; padding-top: 10px; }
 .empty { text-align: center; padding: 50px; border: 2px dashed #ddd; border-radius: 15px; opacity: 0.5; }
</style>
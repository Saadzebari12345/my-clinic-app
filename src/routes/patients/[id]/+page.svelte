<script lang="ts">
 import { page } from '$app/state';
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 interface Patient { id: number; name: string; age: number; phone: string; gender: string; }
 interface MedicalRecord { id: number; diagnosis: string; treatment: string; notes: string; created_at: string; }

 // وەرگرتنا ئایدییا نەخۆشی ژ لینکێ سەرێ (URL)
 let patientId = $derived(page.params.id); 
 
 let doctorId = $state(0);
 let patientInfo = $state<Patient | null>(null);
 let records = $state<MedicalRecord[]>([]);
 
 let diagnosis = $state(''), treatment = $state(''), notes = $state('');
 let isSaving = $state(false);

 // ١. فانکشنا وەرگرتنا مێژوویا پزیشکی
 async function loadRecords() {
  if (!patientId) return;
  
  const { data, error } = await supabase
   .from('medical_records')
   .select('*')
   .eq('patient_id', Number(patientId)) // گرنگە: وەک ژمارە بڕوات
   .order('created_at', { ascending: false });

  if (error) {
   console.error("Fetch Error:", error.message);
  } else {
   records = data || [];
  }
 }

 async function loadPatient() {
  const { data } = await supabase.from('patients').select('*').eq('id', Number(patientId)).single();
  if (data) patientInfo = data;
 }

 onMount(async () => {
  // وەرگرتنا ئایدییا دکتۆری ژ میشکێ بڕاوسەری
  const storedId = localStorage.getItem('doctor_id');
  if (storedId) doctorId = Number(storedId);

  await loadPatient();
  await loadRecords();
 });

 // ٢. فانکشنا زێدەکرنا ڕیزەکا نوی و سەیڤکرنا فەرمی
 async function addRecord() {
  if (!diagnosis || !treatment) return alert("تکایە Diagnosis و Treatment پڕ بکە");
  if (doctorId === 0) return alert("Error: Doctor ID not found. Please Login again.");

  isSaving = true;
  
  const { data, error } = await supabase.from('medical_records').insert([{
   patient_id: Number(patientId),
   doctor_id: doctorId,
   diagnosis: diagnosis,
   treatment: treatment,
   notes: notes
  }]).select();

  if (!error && data) {
   // ئەگەر سەیڤ بوو، ئێکسەر لایێ ڕاستێ نووژەن بکە
   records = [data[0], ...records];
   diagnosis = ''; treatment = ''; notes = '';
   alert("✅ پیزانین ب سەرکەفتی هاتنە پاراستن!");
  } else {
   // ئەگەر سەیڤ نەبوو، بێژە کێشە چییە
   alert("خەلەتی د سەیڤکرنێ دا: " + error?.message);
  }
  isSaving = false;
 }
</script>

{#if patientInfo}
 <div class="container">
  <header class="header card">
   <div class="info">
    <h1>👤 {patientInfo.name}</h1>
    <p>Age: {patientInfo.age} | Phone: {patientInfo.phone}</p>
   </div>
   <a href="/patients" class="back-btn">⬅ Back to Patients</a>
  </header>

  <div class="main-grid">
   <!-- فۆرم (لایێ چەپێ) -->
   <div class="card form-box">
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
     <textarea id="note" bind:value={notes} placeholder="Notes for you only..."></textarea>
    </div>
    <button class="save-btn" onclick={addRecord} disabled={isSaving}>
     {isSaving ? 'Connecting...' : '💾 Save Record'}
    </button>
   </div>

   <!-- مێژوو (لایێ ڕاستێ) -->
   <div class="history-section">
    <h3>📜 Medical History ({records.length})</h3>
    {#each records as record (record.id)}
     <div class="record-item card">
      <div class="date">📅 {new Date(record.created_at).toLocaleDateString()}</div>
      <h4>{record.diagnosis}</h4>
      <p><b>Rx:</b> {record.treatment}</p>
      {#if record.notes}<p class="note"><i>{record.notes}</i></p>{/if}
     </div>
    {:else}
     <div class="empty">No history found. Records saved will stay here permanently.</div>
    {/each}
   </div>
  </div>
 </div>
{:else}
 <div style="padding: 50px; text-align: center;">Loading...</div>
{/if}

<style>
 .container { max-width: 1200px; margin: 0 auto; color: var(--text); padding: 10px; }
 .card { background: var(--card, white); padding: 25px; border-radius: 15px; border: 1px solid var(--border, #ddd); margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
 .header { display: flex; justify-content: space-between; align-items: center; border-left: 6px solid #4f46e5; }
 .main-grid { display: grid; grid-template-columns: 450px 1fr; gap: 20px; }
 @media (max-width: 1000px) { .main-grid { grid-template-columns: 1fr; } }
 
 .field { margin-bottom: 15px; }
 label { display: block; font-weight: bold; margin-bottom: 5px; font-size: 0.85rem; }
 input, textarea { width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ccc; background: white; color: black; box-sizing: border-box; }
 textarea { height: 80px; resize: none; }
 
 .save-btn { width: 100%; padding: 15px; background: #4f46e5; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; }
 .back-btn { text-decoration: none; background: #f3f4f6; color: #333; padding: 10px 15px; border-radius: 8px; font-weight: bold; }

 .record-item { border-left: 5px solid #10b981; margin-bottom: 15px; }
 .date { font-size: 0.8rem; font-weight: bold; color: #10b981; margin-bottom: 10px; }
 .note { opacity: 0.7; font-size: 0.85rem; margin-top: 10px; border-top: 1px dashed #ddd; padding-top: 10px; }
 .empty { text-align: center; padding: 50px; border: 2px dashed #ddd; border-radius: 15px; opacity: 0.5; }
</style>
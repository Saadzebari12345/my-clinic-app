<script lang="ts">
 import { page } from '$app/state';
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 // پێناسەکرنا جۆرێ داتایان
 interface Patient { id: number; name: string; age: number; phone: string; gender: string; }
 interface MedicalRecord { id: number; diagnosis: string; treatment: string; notes: string; created_at: string; }

 let patientId = page.params.id; // ئەڤە ناسنامەیا نەخۆشی یە ژ لینکی
 let doctorId = $state(0);
 let patientInfo = $state<Patient | null>(null);
 let records = $state<MedicalRecord[]>([]);
 
 let diagnosis = $state(''), treatment = $state(''), notes = $state('');
 let isSaving = $state(false);

 // ١. فانکشنا ئینانا هەمی داتایان
 async function loadAllData() {
  const storedId = localStorage.getItem('doctor_id');
  if (storedId) doctorId = Number(storedId);

  // وەرگرتنا زانیاریێن نەخۆشی
  const { data: p } = await supabase.from('patients').select('*').eq('id', patientId).single();
  if (p) patientInfo = p;

  // وەرگرتنا مێژوویا پزیشکی (ئەوا بەرزە دبیت)
  // تێبینی: Number(patientId) گەلەک گرنگە دا داتابەیس ب ناسیت
  const { data: r, error } = await supabase
   .from('medical_records')
   .select('*')
   .eq('patient_id', Number(patientId)) 
   .order('created_at', { ascending: false });
  
  if (!error && r) {
   records = r;
  } else {
   console.error("Fetch Error:", error?.message);
  }
 }

 onMount(loadAllData);

 // ٢. فانکشنا زێدەکرنا ڕاپۆرتێ
 async function addRecord() {
  if (!diagnosis || !treatment) return alert("تکایە خانەیێن (Diagnosis) و (Treatment) پڕ بکە");
  
  isSaving = true;
  const { error } = await supabase.from('medical_records').insert([{
   patient_id: Number(patientId), // سەیڤکرن وەک ژمارە
   doctor_id: doctorId,
   diagnosis,
   treatment,
   notes
  }]);
  
  if (!error) {
   diagnosis = ''; treatment = ''; notes = '';
   await loadAllData(); // نوژەنکرنا لایێ ڕاستێ ئێکسەر
  } else {
   alert("Error saving: " + error.message);
  }
  isSaving = false;
 }
</script>

{#if patientInfo}
 <div class="container">
  <header class="card patient-card">
   <div class="p-details">
    <h1>👤 {patientInfo.name}</h1>
    <p>Age: {patientInfo.age} | Gender: {patientInfo.gender} | Phone: {patientInfo.phone}</p>
   </div>
   <a href="/patients" class="back-btn">⬅ Back to List</a>
  </header>

  <div class="grid-layout">
   <!-- لایێ چەپێ: نڤیسینا ڕاپۆرتا نوی -->
   <div class="card form-section">
    <h3>📝 New Consultation</h3>
    <div class="field">
     <label for="diag">Diagnosis (نەخۆشی)</label>
     <input id="diag" bind:value={diagnosis} placeholder="Condition name..." />
    </div>
    <div class="field">
     <label for="treat">Treatment (دەرمان)</label>
     <textarea id="treat" bind:value={treatment} placeholder="Medications and dosage..."></textarea>
    </div>
    <div class="field">
     <label for="note">Private Notes</label>
     <textarea id="note" bind:value={notes} placeholder="Notes for you only..."></textarea>
    </div>
    <button class="save-btn" onclick={addRecord} disabled={isSaving}>
     {isSaving ? 'Saving to Cloud...' : '💾 Save Record'}
    </button>
   </div>

   <!-- لایێ ڕاستێ: مێژوویا پزیشکی (ئەوا پاشکەفت دبیت) -->
   <div class="history-section">
    <h3>📜 Medical History ({records.length})</h3>
    {#each records as record (record.id)}
     <div class="history-card card">
      <div class="date">📅 {new Date(record.created_at).toLocaleDateString()}</div>
      <h4>{record.diagnosis}</h4>
      <p class="treatment-text"><b>Rx:</b> {record.treatment}</p>
      {#if record.notes}<p class="note-text"><i>Note: {record.notes}</i></p>{/if}
     </div>
    {:else}
     <div class="empty-msg">No history found. Records you save will appear here.</div>
    {/each}
   </div>
  </div>
 </div>
{:else}
 <div class="loading">Loading patient records...</div>
{/if}

<style>
 .container { max-width: 1200px; margin: 0 auto; padding: 10px; color: var(--text); }
 .card { background: var(--card, white); padding: 25px; border-radius: 15px; border: 1px solid var(--border, #ddd); margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
 
 .patient-card { display: flex; justify-content: space-between; align-items: center; border-left: 6px solid #4f46e5; }
 .back-btn { text-decoration: none; background: #f3f4f6; color: #333; padding: 10px 20px; border-radius: 8px; font-weight: bold; font-size: 0.9rem; }

 .grid-layout { display: grid; grid-template-columns: 450px 1fr; gap: 25px; }
 @media (max-width: 1000px) { .grid-layout { grid-template-columns: 1fr; } }

 .field { margin-bottom: 15px; }
 label { display: block; font-weight: bold; margin-bottom: 6px; font-size: 0.85rem; }
 input, textarea { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #ccc; background: white; color: black; box-sizing: border-box; font-family: inherit; }
 textarea { height: 100px; resize: none; }
 
 .save-btn { width: 100%; padding: 15px; background: #4f46e5; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; font-size: 1rem; transition: 0.3s; }
 .save-btn:disabled { background: #94a3b8; }

 .history-card { border-left: 5px solid #10b981; margin-bottom: 15px; }
 .date { font-size: 0.8rem; font-weight: bold; color: #10b981; margin-bottom: 10px; }
 h4 { margin: 0 0 10px 0; color: inherit; font-size: 1.1rem; }
 .treatment-text { line-height: 1.5; font-size: 0.95rem; }
 .note-text { margin-top: 10px; font-size: 0.85rem; opacity: 0.7; border-top: 1px dashed #ddd; padding-top: 10px; }
 .empty-msg { text-align: center; padding: 60px; border: 2px dashed #ddd; border-radius: 15px; color: #999; }
</style>
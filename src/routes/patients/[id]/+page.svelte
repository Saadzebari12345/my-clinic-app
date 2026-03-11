<script lang="ts">
 import { page } from '$app/state';
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 interface Patient { id: number; name: string; age: number; phone: string; gender: string; }
 interface MedicalRecord { id: number; diagnosis: string; treatment: string; notes: string; created_at: string; }

 let patientId = page.params.id; // وەرگرتنا ئایدییا نەخۆشی ژ لینکی
 let doctorId = $state(0);
 let patientInfo = $state<Patient | null>(null);
 let records = $state<MedicalRecord[]>([]);
 
 let diagnosis = $state(''), treatment = $state(''), notes = $state('');
 let isSaving = $state(false);

 async function loadAllData() {
  // ١. وەرگرتنا ئایدییا دکتۆری
  const storedId = localStorage.getItem('doctor_id');
  if (storedId) doctorId = Number(storedId);

  console.log("Loading data for Patient ID:", patientId);

  // ٢. ئینانا زانیاریێن نەخۆشی
  const { data: p, error: pErr } = await supabase
   .from('patients')
   .select('*')
   .eq('id', patientId)
   .single();
  if (p) patientInfo = p;
  if (pErr) console.error("Patient Info Error:", pErr.message);

  // ٣. ئینانا مێژوویا پزیشکی (ئەوا بەرزە دبیت)
  const { data: r, error: rErr } = await supabase
   .from('medical_records')
   .select('*')
   .eq('patient_id', patientId) // پشتڕاستبە ئەڤ ناڤە ل داتابەیسێ درستە
   .order('created_at', { ascending: false });
  
  if (r) {
   console.log("Records loaded:", r);
   records = r;
  }
  if (rErr) console.error("Records Load Error:", rErr.message);
 }

 onMount(loadAllData);

 async function addRecord() {
  if (!diagnosis || !treatment) return alert("تکایە خانەیان پڕ بکە");
  
  isSaving = true;
  // زێدەکرنا داتایان بۆ Supabase
  const { error } = await supabase.from('medical_records').insert([{
   patient_id: Number(patientId), // گرنگە: دڤێت ژمارە بیت
   doctor_id: doctorId,
   diagnosis: diagnosis,
   treatment: treatment,
   notes: notes
  }]);
  
  if (!error) {
   diagnosis = ''; treatment = ''; notes = '';
   await loadAllData(); // نوژەنکرنا لیستا لایێ ڕاستێ ئێکسەر
  } else {
   alert("Error adding record: " + error.message);
  }
  isSaving = false;
 }
</script>

{#if patientInfo}
 <div class="profile-container">
  <header class="card patient-header">
   <div class="p-info">
    <h1>👤 {patientInfo.name}</h1>
    <div class="meta">Age: {patientInfo.age} | Gender: {patientInfo.gender} | Phone: {patientInfo.phone}</div>
   </div>
   <a href="/patients" class="back-btn">⬅ Back to List</a>
  </header>

  <div class="main-grid">
   <!-- Form (Left) -->
   <div class="card">
    <h3>📝 New Consultation</h3>
    <div class="field">
     <label for="diag">Diagnosis</label>
     <input id="diag" bind:value={diagnosis} placeholder="Condition..." />
    </div>
    <div class="field">
     <label for="treat">Treatment</label>
     <textarea id="treat" bind:value={treatment} placeholder="Medications..."></textarea>
    </div>
    <div class="field">
     <label for="note">Private Notes</label>
     <textarea id="note" bind:value={notes} placeholder="Notes for yourself..."></textarea>
    </div>
    <button class="save-btn" onclick={addRecord} disabled={isSaving}>
     {isSaving ? 'Saving...' : '💾 Save Record'}
    </button>
   </div>

   <!-- History (Right) -->
   <div class="history-section">
    <h3>📜 Medical History ({records.length})</h3>
    {#each records as record (record.id)}
     <div class="history-item card">
      <div class="date">📅 {new Date(record.created_at).toLocaleDateString()}</div>
      <h4>Diagnosis: {record.diagnosis}</h4>
      <p><b>Rx:</b> {record.treatment}</p>
      {#if record.notes}<p class="note"><i>{record.notes}</i></p>{/if}
     </div>
    {:else}
     <div class="empty-state">No history found for this patient.</div>
    {/each}
   </div>
  </div>
 </div>
{:else}
 <div class="loading">Loading patient history...</div>
{/if}

<style>
 .profile-container { max-width: 1200px; margin: 0 auto; color: var(--text); }
 .card { background: var(--card, white); padding: 25px; border-radius: 15px; border: 1px solid var(--border, #ddd); margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
 .patient-header { display: flex; justify-content: space-between; align-items: center; border-left: 6px solid #4f46e5; }
 .main-grid { display: grid; grid-template-columns: 450px 1fr; gap: 20px; }
 @media (max-width: 1000px) { .main-grid { grid-template-columns: 1fr; } }
 
 .field { margin-bottom: 15px; }
 label { display: block; font-weight: bold; margin-bottom: 5px; font-size: 0.85rem; }
 input, textarea { width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ccc; background: white; color: black; box-sizing: border-box; }
 textarea { height: 100px; resize: none; }
 
 .save-btn { width: 100%; padding: 14px; background: #4f46e5; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; }
 .back-btn { text-decoration: none; background: #f3f4f6; color: #333; padding: 10px 15px; border-radius: 8px; font-weight: bold; font-size: 0.9rem; }

 .history-item { border-left: 5px solid #10b981; }
 .date { font-size: 0.8rem; font-weight: bold; color: #10b981; margin-bottom: 10px; }
 h4 { margin: 0 0 10px 0; color: inherit; }
 .note { opacity: 0.7; font-size: 0.85rem; margin-top: 10px; border-top: 1px dashed #ddd; padding-top: 10px; }
 .empty-state { text-align: center; padding: 50px; border: 2px dashed #ddd; border-radius: 15px; opacity: 0.5; }
</style>
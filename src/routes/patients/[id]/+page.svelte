<script lang="ts">
 import { page } from '$app/stores'; // مە ئەڤە گۆهۆڕی بۆ ستۆرێ فەرمی دا ئایدی درست بێت
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 interface Patient { id: number; name: string; age: number; phone: string; gender: string; }
 interface MedicalRecord { id: number; diagnosis: string; treatment: string; notes: string; created_at: string; }

 // وەرگرتنا ئایدییا نەخۆشی ب ڕێکا ستۆرێ لاپەرەی
 let patientId = $derived($page.params.id); 
 
 let doctorId = $state(0);
 let patientInfo = $state<Patient | null>(null);
 let records = $state<MedicalRecord[]>([]);
 
 let diagnosis = $state(''), treatment = $state(''), notes = $state('');
 let isSaving = $state(false);

 // ١. فانکشنا ئینانا مێژوویا پزیشکی (Fetching Data)
 async function loadMedicalHistory() {
  if (!patientId) return;

  console.log("Searching history for patient ID:", patientId);

  const { data, error } = await supabase
   .from('medical_records')
   .select('*')
   .eq('patient_id', Number(patientId)) // مەرجە وەکی ژمارە بێتە فرێکرن
   .order('created_at', { ascending: false });

  if (error) {
   console.error("Fetch Error:", error.message);
  } else {
   records = data || [];
   console.log("Records found:", records.length);
  }
 }

 // ٢. ئینانا زانیاریێن نەخۆشی (Name, Age, etc)
 async function loadPatientInfo() {
  const { data, error } = await supabase
   .from('patients')
   .select('*')
   .eq('id', Number(patientId))
   .single();
  
  if (data) patientInfo = data;
 }

 onMount(async () => {
  const storedId = localStorage.getItem('doctor_id');
  if (storedId) doctorId = Number(storedId);

  await loadPatientInfo();
  await loadMedicalHistory();
 });

 // ٣. فانکشنا زێدەکرنا ڕاپۆرتا نوی (Insert)
 async function addRecord() {
  if (!diagnosis || !treatment) return alert("تکایە خانەیان پڕ بکە");
  
  isSaving = true;
  const { error } = await supabase.from('medical_records').insert([{
   patient_id: Number(patientId), // گرێدانا ڕاستەوخۆ ب نەخۆشی ڤە
   doctor_id: doctorId,
   diagnosis: diagnosis,
   treatment: treatment,
   notes: notes
  }]);
  
  if (!error) {
   diagnosis = ''; treatment = ''; notes = '';
   // دووبارە بارکرنا داتایان دا ئێکسەر دیار ببن
   await loadMedicalHistory();
   alert("✅ Record saved successfully!");
  } else {
   alert("Error: " + error.message);
  }
  isSaving = false;
 }
</script>

{#if patientInfo}
 <div class="profile-layout">
  <header class="card header-card">
   <div class="p-info">
    <h1>👤 {patientInfo.name}</h1>
    <p>Age: {patientInfo.age} | Phone: {patientInfo.phone}</p>
   </div>
   <a href="/patients" class="btn-back">⬅ Back to Patients</a>
  </header>

  <div class="main-grid">
   <!-- Form (Left Side) -->
   <div class="card">
    <h3>📝 New Consultation</h3>
    <div class="field">
     <label for="diag">Diagnosis</label>
     <input id="diag" bind:value={diagnosis} placeholder="Condition name..." />
    </div>
    <div class="field">
     <label for="treat">Treatment</label>
     <textarea id="treat" bind:value={treatment} placeholder="Meds and dosage..."></textarea>
    </div>
    <div class="field">
     <label for="note">Private Notes</label>
     <textarea id="note" bind:value={notes} placeholder="Notes for future..."></textarea>
    </div>
    <button class="save-btn" onclick={addRecord} disabled={isSaving}>
     {isSaving ? 'Saving...' : '💾 Save Record'}
    </button>
   </div>

   <!-- Medical History (Right Side) -->
   <div class="history-list">
    <h3>📜 Medical History ({records.length})</h3>
    {#each records as record (record.id)}
     <div class="record-card card">
      <div class="date">📅 {new Date(record.created_at).toLocaleDateString()}</div>
      <h4>{record.diagnosis}</h4>
      <p><b>Rx:</b> {record.treatment}</p>
      {#if record.notes}<p class="note"><i>{record.notes}</i></p>{/if}
     </div>
    {:else}
     <div class="empty-msg">No medical records found for this patient.</div>
    {/each}
   </div>
  </div>
 </div>
{:else}
 <div class="loading">Loading patient records...</div>
{/if}

<style>
 .profile-layout { max-width: 1200px; margin: 0 auto; color: var(--text); }
 .card { background: var(--card, white); padding: 25px; border-radius: 15px; border: 1px solid var(--border, #ddd); margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
 .header-card { display: flex; justify-content: space-between; align-items: center; border-left: 6px solid #4f46e5; }
 .main-grid { display: grid; grid-template-columns: 450px 1fr; gap: 20px; }
 @media (max-width: 1000px) { .main-grid { grid-template-columns: 1fr; } }
 
 .field { margin-bottom: 15px; }
 label { display: block; font-weight: bold; margin-bottom: 5px; font-size: 0.85rem; }
 input, textarea { width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ccc; background: white; color: black; box-sizing: border-box; }
 textarea { height: 80px; resize: none; }
 
 .save-btn { width: 100%; padding: 15px; background: #4f46e5; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; }
 .btn-back { text-decoration: none; background: #f3f4f6; color: #333; padding: 10px 15px; border-radius: 8px; font-weight: bold; }

 .record-card { border-left: 5px solid #10b981; }
 .date { font-size: 0.8rem; font-weight: bold; color: #10b981; margin-bottom: 10px; }
 h4 { margin: 0 0 10px 0; color: inherit; }
 .note { opacity: 0.7; font-size: 0.85rem; margin-top: 10px; border-top: 1px dashed #ddd; padding-top: 10px; }
 .empty-msg { text-align: center; padding: 50px; border: 2px dashed #ddd; border-radius: 15px; color: #999; }
</style>
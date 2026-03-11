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

 // ١. فانکشنا سەرەکی بۆ ئینانا داتایان
 async function loadData() {
  const storedId = localStorage.getItem('doctor_id');
  if (storedId) doctorId = Number(storedId);

  // وەرگرتنا زانیاریێن نەخۆشی
  const { data: p } = await supabase.from('patients').select('*').eq('id', patientId).single();
  if (p) patientInfo = p;

  // وەرگرتنا مێژوویا پزیشکی ب ڕێزبندی (نویترین ل سەرێ بیت)
  const { data: r } = await supabase.from('medical_records')
   .select('*')
   .eq('patient_id', patientId)
   .order('created_at', { ascending: false });
  
  if (r) {
   records = r; // نوژەنکرنا لیستا لایێ ڕاستێ
  }
 }

 onMount(loadData);

 // ٢. فانکشنا زێدەکرنا ڕاپۆرتا نوی
 async function addRecord() {
  if (!diagnosis || !treatment) return alert("تکایە خانەیان پڕ بکە");
  
  isSaving = true;
  const { error } = await supabase.from('medical_records').insert([{
   patient_id: Number(patientId), // پشتڕاستکرنا ئایدیێ
   doctor_id: doctorId,
   diagnosis,
   treatment,
   notes
  }]);
  
  if (!error) {
   // ڤالاکرنا خانەیان پشتی سەیڤکرنێ
   diagnosis = ''; treatment = ''; notes = '';
   
   // ⚡ ئەڤە ئەو پشکەیە یا کار نەدکر: بانگکرنا داتایان ژ نوو
   await loadData(); 
  } else {
   alert("Error: " + error.message);
  }
  isSaving = false;
 }

 // ٣. فانکشنا چاپکرنا ڕەچەتەی (بۆ هەر سەرەدانەکێ)
 function printPrescription(record: MedicalRecord) {
  const printWin = window.open('', '', 'width=800,height=600');
  if (!printWin) return;
  
  const html = `
   <div style="font-family: sans-serif; padding: 40px; border: 2px solid #333; border-radius: 10px;">
    <h1 style="text-align: center; color: #4f46e5; border-bottom: 2px solid #eee; padding-bottom: 10px;">E-CLINIC PRESCRIPTION</h1>
    <p><b>Patient:</b> ${patientInfo?.name}</p>
    <p><b>Date:</b> ${new Date(record.created_at).toLocaleDateString()}</p>
    <hr>
    <h3>Diagnosis:</h3> <p>${record.diagnosis}</p>
    <h3>Medications (Rx):</h3> <p style="white-space: pre-line;">${record.treatment}</p>
    <br><br>
    <p style="text-align: right;">Doctor Signature: _________________</p>
   </div>
  `;
  printWin.document.write(html);
  printWin.document.close();
  printWin.print();
 }
</script>

{#if patientInfo}
 <div class="profile-container">
  <header class="patient-header card">
   <div class="info">
    <h1>👤 {patientInfo.name}</h1>
    <div class="meta">
     <span><b>Age:</b> {patientInfo.age}</span> | 
     <span><b>Gender:</b> {patientInfo.gender}</span> | 
     <span><b>Phone:</b> {patientInfo.phone}</span>
    </div>
   </div>
   <a href="/patients" class="back-btn">⬅ Back</a>
  </header>

  <div class="main-grid">
   <!-- لایێ چەپێ: فۆرما زێدەکرنێ -->
   <div class="consultation-form card">
    <h3>📝 New Consultation</h3>
    <div class="form-group">
     <label for="diag">Diagnosis (نەخۆشی)</label>
     <input id="diag" bind:value={diagnosis} placeholder="Enter condition..." />
    </div>
    <div class="form-group">
     <label for="treat">Treatment (دەرمان)</label>
     <textarea id="treat" bind:value={treatment} placeholder="Medications, dosage, and period..."></textarea>
    </div>
    <div class="form-group">
     <label for="note">Doctor's Private Notes</label>
     <textarea id="note" bind:value={notes} placeholder="Notes only for you..."></textarea>
    </div>
    <button class="save-btn" onclick={addRecord} disabled={isSaving}>
     {isSaving ? 'Saving...' : '💾 Save Record'}
    </button>
   </div>

   <!-- لایێ ڕاستێ: مێژوویا پزیشکی -->
   <div class="history-list">
<h3>📜 Medical History</h3>
    {#each records as record (record.id)}
     <div class="history-card card">
      <div class="card-header">
       <span class="date">📅 {new Date(record.created_at).toLocaleDateString()}</span>
       <button class="print-btn" onclick={() => printPrescription(record)}>🖨️ Print</button>
      </div>
      <div class="card-body">
       <h4>Diagnosis: {record.diagnosis}</h4>
       <p><b>Rx:</b> {record.treatment}</p>
       {#if record.notes}<p class="note"><i>{record.notes}</i></p>{/if}
      </div>
     </div>
    {:else}
     <div class="empty-state">No medical history found. Add the first record!</div>
    {/each}
   </div>
  </div>
 </div>
{/if}

<style>
 .profile-container { max-width: 1200px; margin: 0 auto; color: var(--text); animation: fadeIn 0.3s; }
 @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

 .card { background: var(--card, white); padding: 25px; border-radius: 15px; border: 1px solid var(--border, #ddd); box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
 
 .patient-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-left: 6px solid #4f46e5; }
 .patient-header h1 { margin: 0; font-size: 1.8rem; }
 .meta { margin-top: 5px; opacity: 0.8; }
 .back-btn { text-decoration: none; background: #f3f4f6; color: #374151; padding: 8px 15px; border-radius: 8px; font-weight: bold; font-size: 0.9rem; }

 .main-grid { display: grid; grid-template-columns: 450px 1fr; gap: 25px; }
 @media (max-width: 1000px) { .main-grid { grid-template-columns: 1fr; } }

 .form-group { margin-bottom: 15px; }
 label { display: block; font-size: 0.85rem; font-weight: bold; margin-bottom: 5px; }
 input, textarea { width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ccc; background: white; color: black; box-sizing: border-box; font-family: inherit; }
 textarea { height: 100px; resize: none; }
 
 .save-btn { width: 100%; padding: 14px; background: #4f46e5; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; font-size: 1rem; }
 .save-btn:disabled { background: #94a3b8; }

 .history-list { display: flex; flex-direction: column; gap: 20px; }
 .history-card { border-left: 5px solid #10b981; }
 .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
 .date { font-weight: bold; color: #10b981; font-size: 0.9rem; }
 .print-btn { background: #f3f4f6; border: 1px solid #ddd; padding: 5px 12px; border-radius: 6px; cursor: pointer; font-size: 0.8rem; font-weight: bold; }
 
 .card-body h4 { margin: 0 0 10px 0; color: var(--text); }
 .card-body p { margin: 5px 0; font-size: 0.95rem; line-height: 1.5; }
 .note { opacity: 0.7; font-size: 0.85rem; margin-top: 10px; border-top: 1px dashed #ddd; padding-top: 10px; }

 .empty-state { text-align: center; padding: 50px; border: 2px dashed #ddd; border-radius: 15px; color: #999; }
</style>
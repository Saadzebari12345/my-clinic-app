<script lang="ts">
 import { page } from '$app/stores'; // بەکارهێنانی ستۆری فەرمی بۆ وەرگرتنی ئایدی
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 // پێناسەکردنی جۆری داتاکان
 interface Patient { id: number; name: string; age: number; phone: string; gender: string; }
 interface MedicalRecord { id: number; diagnosis: string; treatment: string; notes: string; created_at: string; }

 // وەرگرتنی ئایدی نەخۆش لە لینکەکەوە و گۆڕینی بۆ ژمارە
 let patientId = $derived(Number($page.params.id));
 
 let doctorId = $state(0);
 let patientInfo = $state<Patient | null>(null);
 let records = $state<MedicalRecord[]>([]);
 
 let diagnosis = $state(''), treatment = $state(''), notes = $state('');
 let isSaving = $state(false);

 async function loadAllData() {
  const storedId = localStorage.getItem('doctor_id');
  if (storedId) doctorId = Number(storedId);

  // ١. ئینانا زانیاریێن نەخۆشی
  const { data: p } = await supabase.from('patients')
            .select('*')
            .eq('id', Number(patientId)) // پشتڕاستبە کو وەکی ژمارە دچیت
            .single();
  if (p) patientInfo = p;

  // ٢. ئینانا مێژوویا پزیشکی (ئەڤە ئەو پشکەیە یا بەرزە دبیت)
  const { data: r, error } = await supabase
   .from('medical_records')
   .select('*')
   .eq('patient_id', Number(patientId)) // لێرە مەرجە Number بیت
   .order('created_at', { ascending: false });
  
  if (r) {
   records = r; // نوکە داتایێن کۆن دکەڤنە د لیستێ دا
  }
 }

 onMount(() => {
  loadAllData();
 });

 // ٢. پاشەکەفتکردنی ڕاپۆرتی نوێ
 async function addRecord() {
  if (!diagnosis || !treatment) return alert("تکایە خانەکان پڕ بکەرەوە");
  if (doctorId === 0) return alert("کێشەیەک لە چوونەژوورەوە هەیە، دووبارە Login بکەرەوە");

  isSaving = true;
  
  // ناردنی داتا بۆ Supabase
  const { data, error } = await supabase.from('medical_records').insert([{
   patient_id: patientId,
   doctor_id: doctorId,
   diagnosis: diagnosis,
   treatment: treatment,
   notes: notes
  }]).select(); // بەکارهێنانی select بۆ ئەوەی داتا نوێیەکە بگەڕێتەوە (بۆ ڕاستکردنەوەی کێشەی ڕێکەوت)

  if (!error && data) {
   // پاککردنەوەی خانەکان
   diagnosis = ''; treatment = ''; notes = '';
   
   // نوێکردنەوەی لیستی لای ڕاست بەبێ Refresh
   records = [data[0], ...records];
   alert("✅ پیزانین ب سەرکەفتی هاتنە پاراستن!");
  } else {
   alert("خەلەتی د سەیڤکرنێ دا: " + (error?.message || "Unknown error"));
  }
  isSaving = false;
 }

 // جوانکردنی شێوازی کات و ڕێکەوت
 function formatDate(dateStr: string) {
  if (!dateStr) return "Just now";
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB') + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
 }
</script>

{#if patientInfo}
 <div class="container">
  <header class="card header-card">
   <div class="p-info">
    <h1>👤 {patientInfo.name}</h1>
    <div class="meta">Age: {patientInfo.age} | Phone: {patientInfo.phone}</div>
   </div>
   <a href="/patients" class="back-btn">⬅ Back to Patients</a>
  </header>

  <div class="main-grid">
   <!-- فۆرمی ناردنی داتا -->
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
     {isSaving ? 'Connecting...' : '💾 Save Record'}
    </button>
   </div>

   <!-- مێژووی پزیشکی (کە بۆ هەمیشە دەمێنێتەوە) -->
   <div class="history-section">
    <h3>📜 Medical History ({records.length})</h3>
    {#each records as record (record.id)}<div class="record-item card">
      <div class="date-tag">📅 {formatDate(record.created_at)}</div>
      <h4>{record.diagnosis}</h4>
      <p class="txt"><b>Rx:</b> {record.treatment}</p>
      {#if record.notes}<p class="note"><i>Note: {record.notes}</i></p>{/if}
     </div>
    {:else}
     <div class="empty-msg">No medical records found for this patient. New records will be saved permanently.</div>
    {/each}
   </div>
  </div>
 </div>
{:else}
 <div class="loading">Loading patient records...</div>
{/if}

<style>
 .container { max-width: 1200px; margin: 0 auto; color: var(--text); padding: 10px; }
 .card { background: var(--card, white); padding: 25px; border-radius: 15px; border: 1px solid var(--border, #ddd); margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
 .header-card { display: flex; justify-content: space-between; align-items: center; border-left: 6px solid #4f46e5; }
 
 .main-grid { display: grid; grid-template-columns: 450px 1fr; gap: 20px; }
 @media (max-width: 1000px) { .main-grid { grid-template-columns: 1fr; } }
 
 .field { margin-bottom: 15px; }
 label { display: block; font-weight: bold; margin-bottom: 5px; font-size: 0.85rem; }
 input, textarea { width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ccc; background: white !important; color: black !important; box-sizing: border-box; }
 textarea { height: 100px; resize: none; }
 
 .save-btn { width: 100%; padding: 15px; background: #4f46e5; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; font-size: 1rem; }
 .back-btn { text-decoration: none; background: #f3f4f6; color: #333; padding: 10px 15px; border-radius: 8px; font-weight: bold; }

 .record-item { border-left: 5px solid #10b981; margin-bottom: 15px; position: relative; }
 .date-tag { font-size: 0.8rem; font-weight: bold; color: #10b981; margin-bottom: 10px; }
 h4 { margin: 0 0 10px 0; font-size: 1.1rem; color: inherit; }
 .txt { font-size: 0.95rem; line-height: 1.5; }
 .note { opacity: 0.7; font-size: 0.85rem; margin-top: 10px; border-top: 1px dashed #ddd; padding-top: 10px; }

 .empty-msg { text-align: center; padding: 60px; border: 2px dashed #ddd; border-radius: 15px; color: #999; }
 .loading { text-align: center; padding: 100px; font-weight: bold; }
</style>
<script lang="ts">
 import { page } from '$app/state';
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 interface Patient { id: number; name: string; age: number; phone: string; gender: string; }
 interface MedicalRecord { id: number; diagnosis: string; treatment: string; notes: string; bp: string; temp: string; weight: string; fee: number; created_at: string; }

 let patientId = $derived(Number(page.params.id));
 let doctorId = $state(0);
 let doctorInfo = $state<any>(null); // بۆ ئینانا زانیاریێن کلینیکێ
 let patientInfo = $state<Patient | null>(null);
 let records = $state<MedicalRecord[]>([]);
 
 let diagnosis = $state(''), treatment = $state(''), notes = $state(''), fee = $state('');
 let bp = $state(''), temp = $state(''), weight = $state('');
 let isSaving = $state(false);
 let editingId = $state<number | null>(null); // بۆ زانینا كا كیش ڕاپۆرت دهێته‌ گۆهۆڕین

 async function loadAllData() {
  const storedId = localStorage.getItem('doctor_id');
  if (storedId) doctorId = Number(storedId);

  // ١. ئینانا زانیاریێن دکتۆری بۆ چاپێ
  const { data: doc } = await supabase.from('doctors').select('*').eq('id', doctorId).single();
  if (doc) doctorInfo = doc;

  // ٢. ئینانا زانیاریێن نەخۆشی
  const { data: p } = await supabase.from('patients').select('*').eq('id', patientId).single();
  if (p) patientInfo = p;

  // ٣. ئینانا مێژوویا پزیشکی
  const { data: r } = await supabase.from('medical_records').select('*').eq('patient_id', patientId).order('created_at', { ascending: false });
  if (r) records = r;
 }

 onMount(loadAllData);

 // 💾 سەیڤکرن یان نوژەنکرن (Insert or Update)
 async function saveRecord() {
  if (!diagnosis || !treatment) return alert("تکایە خانەیان پڕ بکە");
  isSaving = true;

  const recordData = {
   patient_id: patientId, doctor_id: doctorId, diagnosis, treatment, notes, bp, temp, weight,
   fee: Number(fee) || 0
  };

  if (editingId) {
   // ئەگەر یێ دەستکاریێ (Edit) بکەین
   const { error } = await supabase.from('medical_records').update(recordData).eq('id', editingId);
   if (!error) alert("✅ ڕاپۆرت هاتە نوژەنکرن");
  } else {
   // ئەگەر ڕاپۆرتەکا نوی بیت
   const { error } = await supabase.from('medical_records').insert([recordData]);
   if (!error) alert("✅ ڕاپۆرت هاتە سەیڤکرن");
  }

  editingId = null;
  diagnosis = ''; treatment = ''; notes = ''; bp = ''; temp = ''; weight = ''; fee = '';
  await loadAllData();
  isSaving = false;
 }

 // ✏️ دەستپێکرنا دەستکاریێ
 function startEdit(record: MedicalRecord) {
  editingId = record.id;
  diagnosis = record.diagnosis;
  treatment = record.treatment;
  notes = record.notes;
  bp = record.bp;
  temp = record.temp;
  weight = record.weight;
  fee = record.fee.toString();
  window.scrollTo({ top: 0, behavior: 'smooth' });
 }

 async function deleteRecord(id: number) {
  if (confirm('ئەرێ تو پشتراستی تو دڤێت ڤێ ڕاپۆرتێ ژێببەی؟')) {
   await supabase.from('medical_records').delete().eq('id', id);
   await loadAllData();
  }
 }

 // 🖨️ دیزاینێ A4 یێ جیهانی بۆ چاپکرنێ
 function printRx(record: MedicalRecord) {
  const win = window.open('', '', 'width=900,height=1000');
  const html = `
   <html>
   <head>
    <style>
     @page { size: A4; margin: 15mm; }
     body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; padding: 0; margin: 0; }
     .page-border { border: 2px solid #4f46e5; padding: 40px; height: 95vh; border-radius: 15px; position: relative; box-sizing: border-box; }
     .header { display: flex; justify-content: space-between; border-bottom: 4px solid #4f46e5; padding-bottom: 15px; margin-bottom: 30px; }
     .clinic-title { font-size: 28px; font-weight: 900; color: #4f46e5; margin: 0; }
     .contact-info { text-align: right; font-size: 13px; color: #555; }
     .patient-info { background: #f8fafc; padding: 20px; border-radius: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 15px; border: 1px solid #e2e8f0; margin-bottom: 40px; font-size: 14px; }
     .rx-symbol { font-size: 70px; font-weight: 900; color: #4f46e5; font-style: italic; margin-bottom: 10px; opacity: 0.8; }
     .content { min-height: 450px; font-size: 18px; line-height: 1.6; }
     .vitals-bar { background: #f1f5f9; padding: 10px; border-radius: 5px; font-weight: bold; text-align: center; margin-bottom: 25px; font-size: 13px; }
     .footer { position: absolute; bottom: 40px; left: 40px; right: 40px; border-top: 1px solid #eee; padding-top: 15px; display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; }
     .sig { text-align: center; width: 180px; border-top: 2px solid #333; padding-top: 5px; font-weight: bold; }
    </style>
   </head>
   <body>
    <div class="page-border">
     <div class="header">
      <div>
       <h1 class="clinic-title">${doctorInfo?.clinic_name || 'E-CLINIC CENTER'}</h1>
       <p style="font-size:18px; font-weight:bold; margin:5px 0;">Dr. ${doctorInfo?.doctor_name || 'Specialist'}</p>
      </div>
      <div class="contact-info">${doctorInfo?.clinic_address || ''}<br>Tel: ${doctorInfo?.clinic_phone || ''}</div>
     </div>
     <div class="patient-info">
      <div><b>Patient Name:</b> ${patientInfo?.name}</div>
      <div><b>Mobile:</b> ${patientInfo?.phone || 'N/A'}</div>
      <div><b>Age / Gender:</b> ${patientInfo?.age}Y / ${patientInfo?.gender}</div>
      <div><b>Date:</b> ${new Date(record.created_at).toLocaleString('en-GB')}</div>
     </div>
     <div class="vitals-bar">
      BP: ${record.bp || '--'} | Temp: ${record.temp || '--'}°C | Weight: ${record.weight || '--'}kg
     </div>
     <div class="content">
      <div class="rx-symbol">R𝓍</div>
      <p><b>Diagnosis:</b> ${record.diagnosis}</p>
      <p style="white-space: pre-line;"><b>Treatment & Plan:</b><br>${record.treatment}</p>
     </div>
     <div class="footer">
      <div>Printed via E-Clinic Digital System</div>
      <div class="sig">Doctor's Signature</div>
     </div>
    </div>
    <script>window.print(); window.close();<\/script>
   </body>
   </html>
  `;
  win?.document.write(html);
  win?.document.close();
 }
</script>

<div class="container">
 <header class="card patient-header">
  <div class="p-info">
   <h1>👤 {patientInfo?.name || 'Loading...'}</h1>
   <p>{patientInfo?.age} years | {patientInfo?.gender} | {patientInfo?.phone}</p>
  </div>
  <a href="/patients" class="btn-back">⬅ Back</a>
 </header>

 <div class="main-grid">
  <!-- فۆرما نڤیسین و دەستکاریێ -->
  <div class="card form-container">
   <h3>{editingId ? '✏️ Edit Consultation' : '📝 New Consultation'}</h3>
   <div class="vitals">
    <input bind:value={bp} placeholder="BP (120/80)" />
    <input bind:value={temp} placeholder="Temp°C" />
    <input bind:value={weight} placeholder="Weight kg" />
   </div>
   <input bind:value={diagnosis} placeholder="Diagnosis (نەخۆشی)" style="margin-bottom:10px;"/>
   <textarea bind:value={treatment} placeholder="Treatment & Plan..."></textarea>
   <div class="row-flex">
    <input bind:value={fee} type="number" placeholder="Fee $" style="flex:1;"/>
    <button class="save-btn" onclick={saveRecord} style="flex:2;">
     {editingId ? '💾 Update Record' : '💾 Save Record'}
    </button>
   </div>
   {#if editingId}
    <button onclick={() => { editingId = null; diagnosis = ''; treatment = ''; }} class="btn-cancel">Cancel Edit</button>
   {/if}
  </div>

  <!-- مێژوویا پزیشکی (History) -->
  <div class="history-list">
   <h3>📜 Medical History ({records.length})</h3>
   {#each records as record (record.id)}
    <div class="record card">
     <div class="record-head">
      <span class="date">📅 {new Date(record.created_at).toLocaleString('en-GB')}</span>
      <div class="actions">
       <button class="btn-p" onclick={() => printRx(record)} title="Print A4">🖨️</button>
       <button class="btn-e" onclick={() => startEdit(record)} title="Edit Record">✏️</button>
       <button class="btn-d" onclick={() => deleteRecord(record.id)} title="Delete">🗑️</button>
      </div>
     </div>
     <h4>{record.diagnosis}</h4>
     <p class="rx-txt">{record.treatment}</p>
    </div>
   {/each}
  </div>
 </div>
</div>

<style>
 .container { max-width: 1200px; margin: 0 auto; color: var(--text); padding: 10px; }
 .card { background: var(--card, white); padding: 25px; border-radius: 20px; border: 1px solid var(--border, #ddd); margin-bottom: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
 .patient-header { display: flex; justify-content: space-between; align-items: center; border-left: 6px solid #4f46e5; }
 .main-grid { display: grid; grid-template-columns: 450px 1fr; gap: 20px; }
 @media (max-width: 1000px) { .main-grid { grid-template-columns: 1fr; } }
 
 .vitals { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 10px; }
 input, textarea { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #ccc; background: white !important; color: black !important; box-sizing: border-box; }
 textarea { height: 100px; resize: none; }
 
 .row-flex { display: flex; gap: 10px; margin-top: 10px; }
 .save-btn { background: #4f46e5; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; }
 .btn-cancel { width: 100%; margin-top: 5px; background: #94a3b8; color: white; border: none; padding: 8px; border-radius: 8px; cursor: pointer; }

 .record { border-left: 5px solid #10b981; }
 .record-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
 .date { font-size: 0.8rem; font-weight: bold; color: #10b981; }
 .actions button { border: none; padding: 5px 10px; border-radius: 6px; cursor: pointer; font-weight: bold; }
 .btn-p { background: #f3f4f6; } .btn-e { background: #e0f2fe; color: #0369a1; } .btn-d { background: #fee2e2; color: #dc2626; }
 .rx-txt { font-size: 0.9rem; line-height: 1.5; white-space: pre-line; }
 .back-btn { text-decoration: none; background: #f3f4f6; color: #333; padding: 8px 15px; border-radius: 8px; font-weight: bold; font-size: 0.85rem; }
</style>
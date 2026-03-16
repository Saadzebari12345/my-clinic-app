<script lang="ts">
 import { page } from '$app/state';
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 interface Patient { id: number; name: string; age: number; phone: string; gender: string; }
 interface MedicalRecord { id: number; diagnosis: string; treatment: string; notes: string; bp: string; temp: string; weight: string; fee: number; created_at: string; }
 interface Template { id: number; title: string; diagnosis: string; treatment: string; }

 let patientId = $derived(Number(page.params.id)); 
 let doctorId = $state(0);
 let doctorName = $state('');
 let patientInfo = $state<Patient | null>(null);
 let records = $state<MedicalRecord[]>([]);
 
 // گۆڕاوێن فۆرمێ
 let diagnosis = $state(''), treatment = $state(''), notes = $state(''), fee = $state('');
 let bp = $state(''), temp = $state(''), weight = $state('');
 let isSaving = $state(false);

 // پشکا نوو: قاڵبێن ئامادە
 let templates = $state<Template[]>([]);
 let selectedTemplateId = $state('');

 async function loadAllData() {
  const storedId = localStorage.getItem('doctor_id');
  doctorName = localStorage.getItem('doctor_username') || 'Doctor';
  if (storedId) doctorId = Number(storedId);

  if (!patientId) return;

  // ئینانا زانیاریێن نەخۆشی، مێژوو، و قاڵبان پێکڤە
  const [pRes, rRes, tRes] = await Promise.all([
   supabase.from('patients').select('*').eq('id', patientId).single(),
   supabase.from('medical_records').select('*').eq('patient_id', patientId).order('created_at', { ascending: false }),
   supabase.from('medical_templates').select('*').eq('doctor_id', doctorId)
  ]);

  if (pRes.data) patientInfo = pRes.data;
  if (rRes.data) records = rRes.data;
  if (tRes.data) templates = tRes.data;
 }

 onMount(loadAllData);

 // ✨ جادووییا قاڵبان: پڕکرنا خانەیان ب خودکار
 function applyTemplate() {
  const template = templates.find(t => t.id === Number(selectedTemplateId));
  if (template) {
   diagnosis = template.diagnosis;
   treatment = template.treatment;
  }
 }

 async function addRecord() {
  if (!diagnosis || !treatment) return alert("تکایە خانەیان پڕ بکە");
  isSaving = true;
  const { data, error } = await supabase.from('medical_records').insert([{
   patient_id: patientId, doctor_id: doctorId, diagnosis, treatment, notes, bp, temp, weight,
   fee: Number(fee) || 0, created_at: new Date().toISOString()
  }]).select();

  if (!error && data) {
   diagnosis = ''; treatment = ''; notes = ''; fee = ''; bp = ''; temp = ''; weight = '';
   selectedTemplateId = '';
   records = [data[0], ...records];
   alert("✅ Record Saved!");
  }
  isSaving = false;
 }

 async function deleteRecord(id: number) {
  if (confirm('Are you sure?')) {
   await supabase.from('medical_records').delete().eq('id', id);
   await loadAllData();
  }
 }

 function printRx(record: MedicalRecord) {
  const win = window.open('', '', 'width=900,height=1000');
  win?.document.write(`
   <html>
   <head>
    <style>
     @page { size: A4; margin: 15mm; }
     body { font-family: sans-serif; padding: 40px; color: #1a1a1a; line-height: 1.6; }
     .page-border { border: 3px solid #4f46e5; padding: 40px; height: 93vh; border-radius: 20px; position: relative; box-sizing: border-box; }
     .header { display: flex; justify-content: space-between; border-bottom: 4px solid #4f46e5; padding-bottom: 15px; margin-bottom: 30px; }
     .clinic-title { font-size: 28px; font-weight: 900; color: #4f46e5; margin: 0; }
     .patient-box { background: #f8fafc; padding: 20px; border-radius: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 15px; border: 1px solid #e2e8f0; margin-bottom: 40px; font-size: 14px; }
     .main-content { min-height: 400px; font-size: 18px; }
     .footer { position: absolute; bottom: 40px; left: 40px; right: 40px; border-top: 1px solid #eee; padding-top: 20px; display: flex; justify-content: space-between; font-size: 12px; color: #94a3b8; }
    </style>
   </head>
   <body>
    <div class="page-border">
     <div class="header">
      <div><h1 class="clinic-title">E-CLINIC CENTER</h1><p style="font-weight:bold;">Dr.${doctorName}</p></div>
     </div>
     <div class="patient-info">
      <div><b>Patient:</b> ${patientInfo?.name}</div>
      <div><b>Date:</b> ${new Date(record.created_at).toLocaleDateString('en-GB')}</div>
     </div>
     <div class="main-content">
      <h2 style="font-size:60px; color:#4f46e5; font-style:italic; margin:0;">Rx</h2>
      <p><b>Diagnosis:</b> ${record.diagnosis}</p>
      <p style="white-space: pre-line;"><b>Treatment:</b><br>${record.treatment}</p>
     </div>
     <div class="footer"><div>E-Clinic Digital System</div><div style="border-top:2px solid #333; width:150px; text-align:center;">Signature</div></div>
    </div>
    <script>window.print(); window.close();<\/script>
   </body>
   </html>
  `);
  win?.document.close();
 }
</script>

<div class="container">
 <header class="card patient-header">
  <div class="p-info">
   <h1>👤 {patientInfo?.name}</h1>
   <p>{patientInfo?.age} years | {patientInfo?.gender} | {patientInfo?.phone}</p>
  </div>
  <a href="/patients" class="btn-back">⬅ Back</a>
 </header>

 <div class="main-grid">
  <!-- فۆرما نڤیسینێ -->
  <div class="card form-container">
   <h3>📝 New Consultation</h3>
   
   <!-- 🌟 بەشێ هەلبژارتنا قاڵبێن زیرەک -->
   <div class="template-select-box">
    <label for="temp-sel">⚡ Quick Template (Optional)</label>
    <select id="temp-sel" bind:value={selectedTemplateId} onchange={applyTemplate}>
     <option value="">-- Select a Ready Template --</option>
     {#each templates as t}
      <option value={t.id}>{t.title}</option>
     {/each}
    </select>
   </div>

   <div class="vitals">
    <input bind:value={bp} placeholder="BP (120/80)" />
    <input bind:value={temp} placeholder="T°C" />
    <input bind:value={weight} placeholder="Weight kg" />
   </div>
   <input bind:value={diagnosis} placeholder="Diagnosis" style="margin-bottom:10px;"/>
   <textarea bind:value={treatment} placeholder="Treatment & Plan..."></textarea>
   <div style="display:flex; gap:10px; margin-top:10px;">
    <input bind:value={fee} type="number" placeholder="Fee $" style="flex:1;"/>
    <button class="save-btn" onclick={addRecord} style="flex:2;">💾 Save Record</button>
   </div>
  </div>

  <!-- مێژوویا پزیشکی -->
  <div class="history-list">
   <h3>📜 Medical History ({records.length})</h3>
   {#each records as record (record.id)}
    <div class="record card">
     <div class="record-head">
      <span>📅 {new Date(record.created_at).toLocaleString('en-GB')}</span>
      <div class="actions">
       <button class="btn-p" onclick={() => printRx(record)}>🖨️ Print</button>
       <button class="btn-d" onclick={() => deleteRecord(record.id)}>🗑️</button>
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
 .container { max-width: 1300px; margin: 0 auto; color: var(--text); padding: 10px; }
 .card { background: var(--card, white); padding: 25px; border-radius: 20px; border: 1px solid var(--border, #ddd); margin-bottom: 20px; }
 .patient-header { display: flex; justify-content: space-between; align-items: center; border-left: 6px solid #4f46e5; }
 .main-grid { display: grid; grid-template-columns: 450px 1fr; gap: 20px; }
 @media (max-width: 1000px) { .main-grid { grid-template-columns: 1fr; } }
 
 /* ستایلێ پشکا قاڵبان */
 .template-select-box { background: #f0f4ff; padding: 12px; border-radius: 12px; margin-bottom: 15px; border: 1px solid #dbeafe; }
 .template-select-box label { display: block; font-size: 0.75rem; font-weight: bold; color: #1e40af; margin-bottom: 5px; }
 .template-select-box select { width: 100%; padding: 8px; border-radius: 8px; border: 1px solid #bfdbfe; background: white; cursor: pointer; }

 .vitals { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 10px; }
 input, textarea { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #ccc; background: white !important; color: black !important; box-sizing: border-box; }
 textarea { height: 120px; resize: none; }
 .save-btn { background: #4f46e5; color: white; border: none; padding: 12px; border-radius: 10px; cursor: pointer; font-weight: bold; }
 .record { border-left: 5px solid #10b981; }
 .record-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
 .date { font-size: 0.85rem; font-weight: bold; color: #10b981; }
 .btn-p { background: #f3f4f6; color: #333; border: 1px solid #ddd; padding: 5px 10px; border-radius: 6px; cursor: pointer; }
 .btn-d { background: #fee2e2; color: #dc2626; border: none; padding: 5px 10px; border-radius: 6px; cursor: pointer; }
 .rx-txt { font-size: 0.9rem; line-height: 1.5; white-space: pre-line; }
 .back-btn { text-decoration: none; background: #f3f4f6; color: #333; padding: 8px 15px; border-radius: 8px; font-weight: bold; font-size: 0.85rem; }
</style>
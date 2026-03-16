<script lang="ts">
 import { page } from '$app/state';
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 interface Patient { id: number; name: string; age: number; phone: string; gender: string; }
 interface MedicalRecord { id: number; diagnosis: string; treatment: string; notes: string; bp: string; temp: string; weight: string; fee: number; created_at: string; }
 interface Template { id: number; title: string; diagnosis: string; treatment: string; }

 let patientId = $derived(Number(page.params.id));
 let doctorId = $state(0);
 let doctorInfo = $state<any>(null);
 let patientInfo = $state<Patient | null>(null);
 let records = $state<MedicalRecord[]>([]);
 let templates = $state<Template[]>([]); 
 
 let diagnosis = $state(''), treatment = $state(''), notes = $state(''), fee = $state('');
 let bp = $state(''), temp = $state(''), weight = $state('');
 let isSaving = $state(false);
 let editingId = $state<number | null>(null);
 let selectedTemplateId = $state('');

 async function loadAllData() {
  const storedId = localStorage.getItem('doctor_id');
  if (storedId) doctorId = Number(storedId);

  if (!patientId || !doctorId) return;

  // ئینانا هەمی داتایان ب ئێکجار (نەخۆش، مێژوو، قاڵب، و دکتۆر)
  const [docRes, pRes, rRes, tRes] = await Promise.all([
   supabase.from('doctors').select('*').eq('id', doctorId).single(),
   supabase.from('patients').select('*').eq('id', patientId).single(),
   supabase.from('medical_records').select('*').eq('patient_id', patientId).order('created_at', { ascending: false }),
   supabase.from('medical_templates').select('*').eq('doctor_id', doctorId).order('title')
  ]);

  if (docRes.data) doctorInfo = docRes.data;
  if (pRes.data) patientInfo = pRes.data;
  if (rRes.data) records = rRes.data;
  if (tRes.data) templates = tRes.data;
 }

 onMount(loadAllData);

 function applyTemplate() {
  const template = templates.find(t => t.id === Number(selectedTemplateId));
  if (template) {
   diagnosis = template.diagnosis;
   treatment = template.treatment;
  }
 }

 async function saveRecord() {
  if (!diagnosis || !treatment) return alert("Please fill details");
  isSaving = true;
  const recordData = {
   patient_id: patientId, doctor_id: doctorId, diagnosis, treatment, notes, bp, temp, weight, fee: Number(fee) || 0
  };
  if (editingId) {
   await supabase.from('medical_records').update(recordData).eq('id', editingId);
  } else {
   await supabase.from('medical_records').insert([recordData]);
  }
  editingId = null;
  diagnosis = ''; treatment = ''; notes = ''; bp = ''; temp = ''; weight = ''; fee = '';
  await loadAllData();
  isSaving = false;
 }

 function startEdit(record: MedicalRecord) {
  editingId = record.id;
  diagnosis = record.diagnosis; treatment = record.treatment; notes = record.notes;
  bp = record.bp; temp = record.temp; weight = record.weight; fee = record.fee.toString();
  window.scrollTo({ top: 0, behavior: 'smooth' });
 }

 async function deleteRecord(id: number) {
  if (confirm('Are you sure?')) {
   await supabase.from('medical_records').delete().eq('id', id);
   await loadAllData();
  }
 }

 // 🖨️ فانکشنا چاپکرنا پڕۆفیشناڵ (Official A4 Medical Report)
 async function printRx(record: MedicalRecord) {
  // ١. ئینانا زانیاریێن فەرمی یێن دکتۆری ژ داتابەیسێ پێش چاپکرنێ
  const { data: doc } = await supabase.from('doctors').select('*').eq('id', doctorId).single();
  
  const win = window.open('', '', 'width=900,height=1100');
  
  const html = `
   <html>
   <head>
    <title>Prescription - ${patientInfo?.name}</title>
    <style>
     @page { size: A4; margin: 15mm; }
     body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; margin: 0; padding: 0; background: white; }
     
     /* چوارگۆشەیا سەرەکی یا وەرەقەی */
     .page-border { 
      border: 3px solid #4f46e5; 
      padding: 40px; 
      height: 94vh; 
      border-radius: 20px; 
      position: relative; 
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
     }
     
     /* سەرێ وەرەقەی (Clinic Info) */
     .header { 
      display: flex; 
      justify-content: space-between; 
      border-bottom: 4px solid #4f46e5; 
      padding-bottom: 20px; 
      margin-bottom: 30px; 
     }
     .clinic-title { font-size: 32px; font-weight: 900; color: #4f46e5; margin: 0; text-transform: uppercase; }
     .doctor-name { font-size: 22px; font-weight: bold; margin: 8px 0; color: #374151; }
     .contact-info { text-align: right; font-size: 14px; color: #4b5563; line-height: 1.5; }
     
     /* زانیاریێن نەخۆشی (Patient Bar) */
     .patient-info { 
      background: #f8fafc; 
      padding: 20px; 
      border-radius: 12px; 
      display: grid; 
      grid-template-columns: 1.2fr 0.8fr; 
      gap: 15px; 
      border: 1px solid #e2e8f0; 
      margin-bottom: 30px; 
      font-size: 15px; 
     }
     .patient-info b { color: #4f46e5; }
     
     /* نیشانێن ژیانێ (Vitals) */
     .vitals-bar { 
      background: #f1f5f9; 
      padding: 12px; 
      border-radius: 8px; 
      font-weight: bold; 
      text-align: center; 
      margin-bottom: 30px; 
      font-size: 14px;
      color: #334155;
     }

     /* ناڤەرۆکا پزیشکی (Diagnosis & Rx) */
     .rx-symbol { font-size: 70px; font-weight: 900; color: #4f46e5; font-style: italic; margin-bottom: 5px; opacity: 0.8; }
     .main-content { flex-grow: 1; font-size: 19px; line-height: 1.8; }
     .section-label { 
      font-size: 14px; 
      text-transform: uppercase; 
      color: #64748b; 
      border-bottom: 1px solid #e2e8f0; 
      margin-bottom: 10px; 
      padding-bottom: 5px; 
      font-weight: bold; 
     }
     .data-text { margin-bottom: 35px; white-space: pre-line; color: #1f2937; }

     /* خوارێ (Footer) */
     .footer { 
      border-top: 1px solid #e2e8f0; 
      padding-top: 20px; 
      display: flex; 
      justify-content: space-between; 
      font-size: 12px; 
      color: #94a3b8; 
     }
     .sig-box { 
      text-align: center; 
      width: 220px; 
      border-top: 2px solid #1f2937; 
      padding-top: 8px; 
      font-weight: bold; 
      color: #1f2937; 
     }
    </style>
   </head>
   <body>
    <div class="page-border">
     <!-- ١. زانیاریێن کلینیکێ -->
     <div class="header">
      <div>
       <h1 class="clinic-title">${doc?.clinic_name || 'E-CLINIC CENTER'}</h1>
       <p class="doctor-name">Dr. ${doc?.doctor_name || 'Specialist'}</p>
      </div>
      <div class="contact-info">
       ${doc?.clinic_address || 'Clinic Location'}<br>
       Tel: ${doc?.clinic_phone || 'Contact Info'}
      </div>
     </div>

     <!-- ٢. زانیاریێن نەخۆشی -->
     <div class="patient-info">
      <div>
       <div><b>Patient Name:</b> ${patientInfo?.name}</div>
       <div style="margin-top:8px;"><b>Age / Gender:</b> ${patientInfo?.age}Y / ${patientInfo?.gender || 'N/A'}</div>
      </div>
      <div style="text-align: right;">
       <div><b>Date:</b> ${new Date(record.created_at).toLocaleDateString('en-GB')}</div>
       <div style="margin-top:8px;"><b>Phone:</b> ${patientInfo?.phone || 'N/A'}</div>
      </div>
     </div>

     <!-- ٣. نیشانێن ژیانێ (Vitals) -->
     <div class="vitals-bar">
      Vitals: &nbsp; BP: ${record.bp || '--'} &nbsp; | &nbsp; Temp: ${record.temp || '--'}°C &nbsp; | &nbsp; Weight: ${record.weight || '--'}kg
     </div>

     <!-- ٤. ڕەچەتە (Rx) -->
     <div class="main-content">
      <div class="rx-symbol">R𝓍</div>
      
      <div class="section-label">Diagnosis / Clinical Findings</div>
      <div class="data-text">${record.diagnosis}</div>
      
      <div class="section-label">Treatment & Prescription</div>
      <div class="data-text">${record.treatment}</div>

      ${record.notes ? `
       <div class="section-label">Additional Instructions</div>
       <div class="data-text" style="font-size: 15px; color: #4b5563;">${record.notes}</div>
      ` : ''}
     </div>

     <!-- ٥. دووماهی -->
     <div class="footer">
      <div>System ID: #${patientInfo?.id} | Digitalized via E-Clinic Pro</div>
      <div class="sig-box">Doctor's Signature & Stamp</div>
     </div>
    </div>
    <script>
     window.onload = function() {
      window.print();
      window.onafterprint = function() { window.close(); };
     };
    <\/script>
   </body>
   </html>
  `;
  
  win?.document.write(html);
  win?.document.close();
 }
</script>

<div class="profile-container">
 <header class="card patient-header">
  <div class="p-info"><h1>👤 {patientInfo?.name || '...'}</h1>
   <p>{patientInfo?.age} years | {patientInfo?.phone}</p>
  </div>
  <a href="/patients" class="back-link">⬅ Back to List</a>
 </header>

 <div class="main-grid">
  <!-- فۆرما نڤیسینێ -->
  <div class="card form-container">
   <h3>{editingId ? '✏️ Edit consultation' : '📝 New Consultation'}</h3>
   
   <div class="template-section">
    <label for="ts">⚡ Quick Template</label>
    <select id="ts" bind:value={selectedTemplateId} onchange={applyTemplate}>
     <option value="">-- Choose Ready Template --</option>
     {#each templates as t}<option value={t.id}>{t.title}</option>{/each}
    </select>
   </div>

   <div class="vitals-row">
    <!-- svelte-ignore a11y_label_has_associated_control -->
    <div class="v-field"><label>BP</label><input bind:value={bp} placeholder="120/80" /></div>
    <!-- svelte-ignore a11y_label_has_associated_control -->
    <div class="v-field"><label>T°C</label><input bind:value={temp} placeholder="37" /></div>
    <!-- svelte-ignore a11y_label_has_associated_control -->
    <div class="v-field"><label>Weight</label><input bind:value={weight} placeholder="Kg" /></div>
   </div>

   <div class="field">
    <!-- svelte-ignore a11y_label_has_associated_control -->
    <label>Diagnosis</label>
    <input bind:value={diagnosis} placeholder="Condition name..." />
   </div>

   <div class="field">
    <!-- svelte-ignore a11y_label_has_associated_control -->
    <label>Treatment Plan</label>
    <textarea bind:value={treatment} placeholder="Medications..."></textarea>
   </div>

   <div class="footer-row">
    <!-- svelte-ignore a11y_label_has_associated_control -->
    <div class="f-item"><label>Fee $</label><input type="number" bind:value={fee} placeholder="0.00" /></div>
    <button class="save-btn" onclick={saveRecord}>{editingId ? 'Update' : 'Save'}</button>
   </div>
  </div>

  <!-- مێژوو -->
  <div class="history-list">
   <h3>📜 History ({records.length})</h3>
   {#each records as record (record.id)}
    <div class="record card">
     <div class="r-head">
      <span>📅 {new Date(record.created_at).toLocaleString('en-GB')}</span>
      <div class="r-btns">
       <button class="b-p" onclick={() => printRx(record)}>🖨️ Print</button>
       <button class="b-e" onclick={() => startEdit(record)}>✏️ Edit</button>
       <button class="b-d" onclick={() => deleteRecord(record.id)}>🗑️</button>
      </div>
     </div>
     <b>{record.diagnosis}</b>
     <p>{record.treatment}</p>
    </div>
   {/each}
  </div>
 </div>
</div>

<style>
 .profile-container { max-width: 1200px; margin: 0 auto; color: var(--text); padding: 10px; }
 .card { background: var(--card, white); padding: 25px; border-radius: 20px; border: 1px solid var(--border, #ddd); margin-bottom: 20px; }
 .patient-header { display: flex; justify-content: space-between; align-items: center; border-left: 6px solid #4f46e5; }
 
 .main-grid { display: grid; grid-template-columns: 420px 1fr; gap: 20px; }
 @media (max-width: 1000px) { .main-grid { grid-template-columns: 1fr; } }

 .template-section { background: rgba(79, 70, 229, 0.05); padding: 12px; border-radius: 12px; margin-bottom: 15px; border: 1px solid rgba(79, 70, 229, 0.1); }
 .template-section label { font-size: 0.75rem; font-weight: bold; color: #4f46e5; display: block; margin-bottom: 5px; }
 .template-section select { width: 100%; padding: 8px; border-radius: 8px; border: 1px solid #ccc; background: white; color: black; }

 .vitals-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 15px; }
 .v-field label { font-size: 0.7rem; font-weight: bold; display: block; margin-bottom: 3px; }

 input, textarea { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border, #ccc); background: white !important; color: black !important; box-sizing: border-box; }
 textarea { height: 100px; resize: none; margin-top: 5px; }
 
 .footer-row { display: flex; gap: 10px; align-items: flex-end; margin-top: 10px; }
 .f-item { flex: 1; }
 .f-item label { font-size: 0.7rem; font-weight: bold; display: block; margin-bottom: 3px; }
 .save-btn { flex: 2; height: 45px; background: #4f46e5; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; }

 .record { border-left: 5px solid #10b981; }
 .r-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; font-size: 0.8rem; font-weight: bold; color: #10b981; }
 .r-btns button { border: none; padding: 5px 10px; border-radius: 6px; cursor: pointer; margin-left: 5px; font-weight: bold; }
 .b-p { background: #f3f4f6; color: #333; }
 .b-e { background: #e0f2fe; color: #0369a1; }
 .b-d { background: #fee2e2; color: #dc2626; }

 .back-link { text-decoration: none; color: #4f46e5; font-weight: bold; }
</style>
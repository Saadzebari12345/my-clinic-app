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

 function printRx(record: MedicalRecord) {
  const win = window.open('', '', 'width=900,height=1000');
  win?.document.write(`
   <div style="font-family:sans-serif; padding:50px; border:2px solid #4f46e5; border-radius:15px;">
    <h1 style="text-align:center; color:#4f46e5;">E-CLINIC MEDICAL REPORT</h1>
    <p style="text-align:center;"><b>Dr. ${doctorInfo?.doctor_name || 'Specialist'}</b></p>
    <hr>
    <p><b>Patient:</b> ${patientInfo?.name} | <b>Date:</b> ${new Date(record.created_at).toLocaleDateString('en-GB')}</p>
    <p><b>Mobile:</b> ${patientInfo?.phone || 'N/A'}</p>
    <h3>Diagnosis:</h3><p>${record.diagnosis}</p>
    <h3>Treatment:</h3><p style="white-space:pre-line;">${record.treatment}</p>
    <div style="margin-top:50px; text-align:right;">Signature: _________________</div>
   </div>
  `);
  win?.document.close(); win?.print();
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
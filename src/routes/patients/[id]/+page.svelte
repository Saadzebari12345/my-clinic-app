<script lang="ts">
 import { page } from '$app/state';
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 interface Patient { id: number; name: string; age: number; phone: string; gender: string; }
 interface MedicalRecord { 
  id: number; diagnosis: string; treatment: string; notes: string; 
  bp: string; temp: string; weight: string; fee: number; created_at: string; 
 }

 let patientId = $derived(Number(page.params.id)); 
 let doctorId = $state(0);
 let doctorName = $state('');
 let patientInfo = $state<Patient | null>(null);
 let records = $state<MedicalRecord[]>([]);
 
 let diagnosis = $state(''), treatment = $state(''), notes = $state(''), fee = $state('');
 let bp = $state(''), temp = $state(''), weight = $state('');
 let isSaving = $state(false);

 async function loadAllData() {
  const storedId = localStorage.getItem('doctor_id');
  doctorName = localStorage.getItem('doctor_username') || 'Doctor';
  if (storedId) doctorId = Number(storedId);

  const { data: p } = await supabase.from('patients').select('*').eq('id', patientId).single();
  if (p) patientInfo = p;

  const { data: r } = await supabase.from('medical_records').select('*').eq('patient_id', patientId).order('created_at', { ascending: false });
  if (r) records = r;
 }

 onMount(loadAllData);

 async function addRecord() {
  if (!diagnosis || !treatment) return alert("Please fill Diagnosis and Treatment");
  isSaving = true;
  const { data, error } = await supabase.from('medical_records').insert([{
   patient_id: patientId, doctor_id: doctorId, diagnosis, treatment, notes, bp, temp, weight,
   fee: Number(fee) || 0, created_at: new Date().toISOString()
  }]).select();

  if (!error && data) {
   diagnosis = ''; treatment = ''; notes = ''; fee = ''; bp = ''; temp = ''; weight = '';
   records = [data[0], ...records];
  }
  isSaving = false;
 }

 // 🗑️ فانکشنا ژێبرنا ڕاپۆرتەکێ
 async function deleteRecord(id: number) {
  if (confirm('ئەرێ تو پشتراستی دڤێت ڤێ ڕاپۆرتێ ژێببەی؟')) {
   const { error } = await supabase.from('medical_records').delete().eq('id', id);
   if (!error) records = records.filter(r => r.id !== id);
  }
 }

 // 🖨️ چاپکرن (مۆبایل لێرە زێدە بوو)
 function printPrescription(record: MedicalRecord) {
  const printWin = window.open('', '', 'width=900,height=800');
  const html = `
   <html>
   <head>
    <style>
     body { font-family: sans-serif; padding: 40px; }
     .header { border-bottom: 3px solid #4f46e5; padding-bottom: 20px; margin-bottom: 20px; }
     .patient-info { background: #f3f4f6; padding: 15px; border-radius: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 30px; }
     .rx { font-size: 40px; color: #4f46e5; font-weight: bold; }
     .footer { margin-top: 50px; border-top: 1px solid #ddd; padding-top: 20px; }
    </style>
   </head>
   <body>
    <div class="header">
     <h1>E-CLINIC REPORT</h1>
     <p>Dr. ${doctorName}</p>
    </div>
    <div class="patient-info">
     <div><b>Patient:</b> ${patientInfo?.name}</div>
     <div><b>Phone:</b> ${patientInfo?.phone}</div> <!-- 📱 لێرە مۆبایل زێدە بوو -->
     <div><b>Age:</b> ${patientInfo?.age}</div>
     <div><b>Date:</b> ${new Date(record.created_at).toLocaleDateString()}</div>
    </div>
    <div class="rx">Rx</div>
    <p><b>Diagnosis:</b> ${record.diagnosis}</p>
    <p><b>Medications:</b><br>${record.treatment.replace(/\n/g, '<br>')}</p>
    <div class="footer"><p>Contact Support: +964 7XX XXX XXXX</p></div>
    <script>window.print(); window.close();<\/script>
   </body>
   </html>
  `;
  printWin?.document.write(html);
  printWin?.document.close();
 }
</script>

<div class="container">
 <header class="header-card card">
  <div class="p-info">
   <h1>👤 {patientInfo?.name}</h1>
   <p>Phone: {patientInfo?.phone}</p>
  </div>
  <a href="/patients" class="btn-back">⬅ Back</a>
 </header>

 <div class="main-grid">
  <div class="card form-container">
   <h3>📝 New Consultation</h3>
   <div class="vitals-row">
    <input bind:value={bp} placeholder="BP" />
    <input bind:value={temp} placeholder="Temp" /><input bind:value={weight} placeholder="Weight" />
   </div>
   <input bind:value={diagnosis} placeholder="Diagnosis" style="width:100%; margin-bottom:10px;"/>
   <textarea bind:value={treatment} placeholder="Treatment..."></textarea>
   <div style="display:flex; gap:10px; margin-top:10px;">
    <input bind:value={notes} placeholder="Notes" style="flex:2;"/>
    <input bind:value={fee} type="number" placeholder="Fee $" style="flex:1;"/>
   </div>
   <button onclick={addRecord} disabled={isSaving} class="btn-save">💾 Save</button>
  </div>

  <div class="history-list">
   <h3>📜 Records ({records.length})</h3>
   {#each records as record (record.id)}
    <div class="record-item card">
     <div class="item-header">
      <span class="date">📅 {new Date(record.created_at).toLocaleDateString()}</span>
      <div class="btns">
       <button class="btn-print" onclick={() => printPrescription(record)}>🖨️ Print</button>
       <button class="btn-del" onclick={() => deleteRecord(record.id)}>🗑️</button> <!-- 🗑️ دوگمێ ژێبرنێ ڤەگەڕیا -->
      </div>
     </div>
     <h4>{record.diagnosis}</h4>
     <p>{record.treatment}</p>
    </div>
   {/each}
  </div>
 </div>
</div>

<style>
 .container { max-width: 1200px; margin: 0 auto; color: var(--text); padding: 10px; }
 .card { background: var(--card, white); padding: 20px; border-radius: 15px; border: 1px solid var(--border, #ddd); margin-bottom: 20px; }
 .header-card { display: flex; justify-content: space-between; align-items: center; border-left: 6px solid #4f46e5; }
 .main-grid { display: grid; grid-template-columns: 450px 1fr; gap: 20px; }
 input, textarea { width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ccc; background: white !important; color: black !important; }
 textarea { height: 80px; }
 .vitals-row { display: flex; gap: 5px; margin-bottom: 10px; }
 .btn-save { width: 100%; padding: 12px; background: #4f46e5; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; }
 .item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
 .btn-print { background: #e0e7ff; color: #4338ca; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 0.7rem; font-weight: bold; }
 .btn-del { background: #fee2e2; color: #ef4444; border: none; padding: 5px 8px; border-radius: 5px; cursor: pointer; }
 .record-item { border-left: 5px solid #10b981; }
</style>
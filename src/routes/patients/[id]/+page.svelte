<script lang="ts">
 import { page } from '$app/state';
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 // ١. پێناسەکرنا جۆرێ داتایان (Interfaces)
 interface Patient { id: number; name: string; age: number; phone: string; gender: string; }
 interface MedicalRecord { 
  id: number; diagnosis: string; treatment: string; notes: string; 
  bp: string; temp: string; weight: string; fee: number; created_at: string; 
 }

 // ٢. گۆڕاوێن سەرەکی
 let patientId = $derived(Number(page.params.id));
 let doctorId = $state(0);
 let doctorName = $state('');
 let patientInfo = $state<Patient | null>(null);
 let records = $state<MedicalRecord[]>([]);
 
 // ٣. گۆڕاوێن فۆرمێ (Inputs)
 let diagnosis = $state(''), treatment = $state(''), notes = $state(''), fee = $state('');
 let bp = $state(''), temp = $state(''), weight = $state('');
 let isSaving = $state(false);

 async function loadAllData() {
  const storedId = localStorage.getItem('doctor_id');
  doctorName = localStorage.getItem('doctor_username') || 'Doctor';
  if (storedId) doctorId = Number(storedId);

  if (!patientId) return;

  // ئینانا زانیاریێن نەخۆشی
  const { data: p } = await supabase.from('patients').select('*').eq('id', patientId).single();
  if (p) patientInfo = p;

  // ئینانا مێژوویا پزیشکی
  const { data: r } = await supabase.from('medical_records')
   .select('*')
   .eq('patient_id', patientId)
   .order('created_at', { ascending: false });
  if (r) records = r;
 }

 onMount(loadAllData);

 // 💾 فانکشنا سەیڤکرنا ب هێز (ئەوا داهاتی ڕێک دکەت)
 async function addRecord() {
  if (!diagnosis || !treatment || !fee) return alert("تکایە Diagnosis, Treatment و Fee پڕ بکە");
  if (doctorId === 0) return alert("Error: Doctor ID not found. Please Login again.");

  isSaving = true;
  const newRecord = {
   patient_id: patientId,
   doctor_id: doctorId, // 🔒 گەلەک گرنگە بۆ داشبۆردێ
   diagnosis,
   treatment,
   notes,
   bp, temp, weight,
   fee: Number(fee), // 💰 سەیڤکرن وەک ژمارە بۆ حسابکرنا داهاتی
   created_at: new Date().toISOString() // 📅 کاتێ درست یێ کۆمپیوتەری
  };

  const { data, error } = await supabase.from('medical_records').insert([newRecord]).select();

  if (!error && data) {
   records = [data[0] as MedicalRecord, ...records];
   // ڤالاکرنا فۆرمێ
   diagnosis = ''; treatment = ''; notes = ''; fee = ''; bp = ''; temp = ''; weight = '';
   alert("✅ ب سەرکەفتی هاتە سەیڤکرن");
  } else {
   alert("Error: " + error?.message);
  }
  isSaving = false;
 }

 async function deleteRecord(id: number) {
  if (confirm('ئەرێ تو پشتراستی تو دڤێت ڤێ ڕاپۆرتێ ژێببەی؟')) {
   const { error } = await supabase.from('medical_records').delete().eq('id', id);
   if (!error) records = records.filter(r => r.id !== id);
  }
 }

 // 🖨️ چاپکرنا فەرمی (Official A4 Design)
 function printRx(record: MedicalRecord) {
  const win = window.open('', '', 'width=900,height=1000');
  win?.document.write(`
   <html>
   <head>
    <style>
     body { font-family: sans-serif; padding: 40px; color: #333; line-height: 1.6; }
     .header { border-bottom: 3px solid #4f46e5; padding-bottom: 20px; display: flex; justify-content: space-between; margin-bottom: 30px; }
     .clinic-info h1 { margin: 0; color: #4f46e5; }
     .p-box { background: #f3f4f6; padding: 15px; border-radius: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 30px; }
     .rx { font-size: 50px; color: #4f46e5; font-weight: bold; font-style: italic; }
     .footer { margin-top: 50px; border-top: 1px solid #ddd; padding-top: 20px; display: flex; justify-content: space-between; }
    </style>
   </head>
   <body>
    <div class="header">
     <div><h1>E-CLINIC CENTER</h1><p>Dr. ${doctorName}</p></div>
     <div style="text-align:right;">Date: ${new Date(record.created_at).toLocaleDateString('en-GB')}</div>
    </div>
    <div class="p-box">
     <div><b>Patient:</b> ${patientInfo?.name}</div>
     <div><b>Phone:</b> ${patientInfo?.phone}</div>
     <div><b>Age:</b> ${patientInfo?.age}</div>
     <div><b>Vitals:</b> BP: ${record.bp} | T: ${record.temp}°C</div>
    </div><div class="rx">Rx</div>
    <h3>Diagnosis:</h3> <p>${record.diagnosis}</p>
    <h3>Treatment Plan:</h3> <p style="white-space: pre-line;">${record.treatment}</p>
    <div class="footer"><p>E-Clinic Pro System</p><p>Signature: _________________</p></div>
    <script>window.print(); window.close();<\/script>
   </body>
   </html>
  `);
  win?.document.close();
 }
</script>

<div class="profile-page">
 <header class="card patient-card">
  <div class="p-info">
   <h1>👤 {patientInfo?.name || 'Loading...'}</h1>
   <p>Age: {patientInfo?.age} | Phone: {patientInfo?.phone}</p>
  </div>
  <a href="/patients" class="back-btn">⬅ Back</a>
 </header>

 <div class="main-grid">
  <!-- لایێ چەپێ: فۆرما نڤیسینێ -->
  <div class="card form-container">
   <h3>📝 New Consultation</h3>
   <div class="vitals-row">
    <input bind:value={bp} placeholder="BP (120/80)" />
    <input bind:value={temp} placeholder="Temp°C" />
    <input bind:value={weight} placeholder="Weight kg" />
   </div>
   <div class="field">
    <label for="dg">Diagnosis</label>
    <input id="dg" bind:value={diagnosis} placeholder="Condition name..." />
   </div>
   <div class="field">
    <label for="tr">Treatment & Medications</label>
    <textarea id="tr" bind:value={treatment} placeholder="Medications and dosage..."></textarea>
   </div>
   <div class="flex-row">
    <div class="field" style="flex:2;"><label for="nt">Notes</label><input id="nt" bind:value={notes} placeholder="Private notes..." /></div>
    <div class="field" style="flex:1;"><label for="fe">Fee ($)</label><input id="fe" type="number" bind:value={fee} placeholder="0.00" /></div>
   </div>
   <button class="save-btn" onclick={addRecord} disabled={isSaving}>
    {isSaving ? 'Saving...' : '💾 Save Record'}
   </button>
  </div>

  <!-- لایێ ڕاستێ: مێژوویا پزیشکی -->
  <div class="history-list">
   <h3>📜 Medical History ({records.length})</h3>
   {#each records as record (record.id)}
    <div class="record-item card">
     <div class="item-header">
      <span class="date">📅 {new Date(record.created_at).toLocaleString('en-GB', {day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit', hour12:true})}</span>
      <div class="actions">
       <button class="btn-print" onclick={() => printRx(record)}>🖨️ Print</button>
       <button class="btn-del" onclick={() => deleteRecord(record.id)}>🗑️</button>
      </div>
     </div>
     <h4>{record.diagnosis}</h4>
     <p class="rx-txt">{record.treatment}</p>
     {#if record.fee > 0}<span class="fee-tag">Paid: ${record.fee}</span>{/if}
    </div>
   {:else}
    <div class="empty">No history found for this patient.</div>
   {/each}
  </div>
 </div>
</div>

<style>
 .profile-page { max-width: 1200px; margin: 0 auto; color: var(--text); padding: 10px; }
 .card { background: var(--card, white); padding: 25px; border-radius: 20px; border: 1px solid var(--border, #ddd); margin-bottom: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
 .patient-card { display: flex; justify-content: space-between; align-items: center; border-left: 8px solid #4f46e5; }
 
 .main-grid { display: grid; grid-template-columns: 450px 1fr; gap: 25px; }
 @media (max-width: 1000px) { .main-grid { grid-template-columns: 1fr; } }
 
 .vitals-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 15px; }
 .field { margin-bottom: 15px; }
 .flex-row { display: flex; gap: 10px; }
 label { display: block; font-weight: bold; margin-bottom: 5px; font-size: 0.8rem; }
 input, textarea { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #ccc; background: white !important; color: black !important; box-sizing: border-box; }
 textarea { height: 100px; resize: none; }
 
 .save-btn { width: 100%; padding: 15px; background: #4f46e5; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; font-size: 1rem; }
 .btn-print { background: #f3f4f6; color: #333; border: 1px solid #ddd; padding: 5px 12px; border-radius: 8px; cursor: pointer; font-size: 0.75rem; font-weight: bold; }
 .btn-del { background: #fee2e2; color: #ef4444; border: none; padding: 5px 10px; border-radius: 8px; cursor: pointer; }
 .back-btn { text-decoration: none; background: #f3f4f6; color: #333; padding: 10px 15px; border-radius: 8px; font-weight: bold; font-size: 0.85rem; }

 .record-item { border-left: 5px solid #10b981; }
 .item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
 .date { font-size: 0.85rem; font-weight: bold; color: #10b981; }
 .fee-tag { display: inline-block; margin-top: 10px; background: #dcfce7; color: #15803d; padding: 2px 10px; border-radius: 15px; font-size: 0.75rem; font-weight: bold; }
 .empty { text-align: center; padding: 50px; border: 2px dashed #ddd; border-radius: 15px; opacity: 0.5; }
</style>
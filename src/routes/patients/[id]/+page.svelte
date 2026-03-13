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
  if (!diagnosis || !treatment) return alert("Please fill Vitals, Diagnosis, and Treatment");
  isSaving = true;

  const { data, error } = await supabase.from('medical_records').insert([{
   patient_id: patientId, doctor_id: doctorId, diagnosis, treatment, notes, bp, temp, weight,
   fee: Number(fee) || 0, created_at: new Date().toISOString()
  }]).select();

  if (!error && data) {
   diagnosis = ''; treatment = ''; notes = ''; fee = ''; bp = ''; temp = ''; weight = '';
   records = [data[0], ...records];
   alert("✅ Record Added!");
  }
  isSaving = false;
 }

 // 🖨️ فانکشنا چاپکرنا ڕەچەتەیا فەرمی (Professional Print)
 function printPrescription(record: MedicalRecord) {
  const printWin = window.open('', '', 'width=900,height=800');
  const html = `
   <html>
   <head>
    <style>
     @media print { .no-print { display: none; } }
     body { font-family: 'Segoe UI', sans-serif; padding: 40px; line-height: 1.6; }
     .header { display: flex; justify-content: space-between; border-bottom: 4px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; }
     .clinic-info h1 { margin: 0; color: #4f46e5; font-size: 24px; }
     .doc-info { text-align: right; font-size: 14px; color: #555; }
     .patient-bar { background: #f3f4f6; padding: 15px; border-radius: 10px; display: grid; grid-template-columns: 1fr 1fr 1fr; margin-bottom: 30px; font-weight: bold; }
     .rx-section { min-height: 400px; }
     .rx-title { font-size: 50px; font-weight: 900; color: #4f46e5; margin-bottom: 10px; }
     .footer { margin-top: 50px; border-top: 1px solid #ddd; padding-top: 20px; font-size: 12px; color: #777; display: flex; justify-content: space-between; }
     .signature { width: 200px; border-top: 2px solid #333; text-align: center; padding-top: 5px; margin-top: 40px; }
    </style>
   </head>
   <body>
    <div class="header">
     <div class="clinic-info">
      <h1>E-CLINIC MEDICAL CENTER</h1>
      <p>Duhok, Iraq | +964 7XX XXX XXXX</p>
     </div>
     <div class="doc-info">
      <p><b>Dr. ${doctorName}</b><br>General Medical Specialist</p>
     </div>
    </div>
    <div class="patient-bar">
     <div>Name: ${patientInfo?.name}</div>
     <div>Age/Sex: ${patientInfo?.age} / ${patientInfo?.gender}</div>
     <div>Date: ${new Date(record.created_at).toLocaleDateString()}</div>
    </div>
    <div class="rx-section">
     <div class="rx-title">R𝓍</div>
     <h3>Diagnosis:</h3> <p>${record.diagnosis}</p>
     <h3>Plan / Treatment:</h3> <p style="white-space: pre-line;">${record.treatment}</p>
     <p><b>Vitals:</b> BP: ${record.bp} | Temp: ${record.temp}°C | Weight: ${record.weight}kg</p>
    </div>
    <div class="footer">
     <p>This is a digital prescription from E-Clinic System</p><div class="signature">Doctor's Signature</div>
    </div>
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
   <p>History and clinical profile of the patient.</p>
  </div>
  <a href="/patients" class="btn-back">⬅ Back</a>
 </header>

 <div class="main-grid">
  <!-- Form (Left) -->
  <div class="card form-container">
   <h3>📝 New Consultation</h3>
   <div class="vitals-row">
    <input bind:value={bp} placeholder="BP (120/80)" />
    <input bind:value={temp} placeholder="Temp (°C)" />
    <input bind:value={weight} placeholder="Weight (kg)" />
   </div>
   <div class="field">
    <!-- svelte-ignore a11y_label_has_associated_control -->
    <label>Diagnosis (نەخۆشی)</label>
    <input bind:value={diagnosis} placeholder="Condition name..." />
   </div>
   <div class="field">
    <!-- svelte-ignore a11y_label_has_associated_control -->
    <label>Treatment (دەرمان)</label>
    <textarea bind:value={treatment} placeholder="Medications and doses..."></textarea>
   </div>
   <div class="flex-row">
    <div class="field" style="flex:2;">
        <!-- svelte-ignore a11y_label_has_associated_control -->
        <label>Notes</label><input bind:value={notes} placeholder="Extra notes..." /></div>
    <div class="field" style="flex:1;">
        <!-- svelte-ignore a11y_label_has_associated_control -->
        <label>Fee ($)</label><input type="number" bind:value={fee} placeholder="0.00" /></div>
   </div>
   <button onclick={addRecord} disabled={isSaving} class="btn-save">
    {isSaving ? 'Saving...' : '💾 Save Consultation'}
   </button>
  </div>

  <!-- History (Right) -->
  <div class="history-list">
   <h3>📜 Clinical Records ({records.length})</h3>
   {#each records as record (record.id)}
    <div class="record-item card">
     <div class="item-header">
      <span class="date">📅 {new Date(record.created_at).toLocaleDateString()}</span>
      <button class="btn-print" onclick={() => printPrescription(record)}>🖨️ Print Prescription</button>
     </div>
     <div class="record-body">
      <h4>{record.diagnosis}</h4>
      <p class="rx-txt">{record.treatment}</p>
     </div>
     {#if record.fee > 0}
      <div class="record-footer">
       <span class="fee-badge">Paid: ${record.fee}</span>
      </div>
     {/if}
    </div>
   {:else}
    <div class="empty">No clinical history for this patient.</div>
   {/each}
  </div>
 </div>
</div>

<style>
 .container { max-width: 1200px; margin: 0 auto; color: var(--text); padding: 10px; }
 .card { background: var(--card, white); padding: 25px; border-radius: 15px; border: 1px solid var(--border, #ddd); margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
 .header-card { display: flex; justify-content: space-between; align-items: center; border-left: 6px solid #4f46e5; }
 
 .main-grid { display: grid; grid-template-columns: 450px 1fr; gap: 20px; }
 @media (max-width: 1000px) { .main-grid { grid-template-columns: 1fr; } }
 
 .vitals-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 10px; }
 input, textarea { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #ccc; background: white !important; color: black !important; box-sizing: border-box; }
 textarea { height: 100px; resize: none; }
 label { display: block; font-weight: bold; font-size: 0.8rem; margin: 10px 0 5px; }

 .btn-save { width: 100%; padding: 15px; background: #4f46e5; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; font-size: 1rem; }
 .btn-print { background: #f3f4f6; color: #4f46e5; border: 1px solid #4f46e5; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 0.75rem; font-weight: bold; }
 .btn-back { text-decoration: none; background: #f3f4f6; color: #333; padding: 10px 15px; border-radius: 8px; font-weight: bold; font-size: 0.85rem; }

 .record-item { border-left: 5px solid #10b981; }
 .item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
 .date { font-size: 0.85rem; font-weight: bold; color: #10b981; }
 .rx-txt { font-size: 0.9rem; line-height: 1.5; white-space: pre-line; }
 .fee-badge { background: #dcfce7; color: #15803d; padding: 3px 10px; border-radius: 15px; font-size: 0.7rem; font-weight: bold; }
</style>
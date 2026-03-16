<script lang="ts">
 import { page } from '$app/state';
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 interface Patient { id: number; name: string; age: number; phone: string; gender: string; }
 interface MedicalRecord { id: number; diagnosis: string; treatment: string; notes: string; bp: string; temp: string; weight: string; fee: number; created_at: string; }
 interface Template { id: number; title: string; diagnosis: string; treatment: string; }

 let patientId = $derived(Number(page.params.id));
 let doctorId = $state(0);
 let doctorInfo = $state<any>(null); // زانیاریێن کلینیکێ یێن ئەدمین نڤیسین
 let patientInfo = $state<Patient | null>(null);
 let records = $state<MedicalRecord[]>([]);
 let templates = $state<Template[]>([]); // قاڵبێن ئامادە
 
 let diagnosis = $state(''), treatment = $state(''), notes = $state(''), fee = $state('');
 let bp = $state(''), temp = $state(''), weight = $state('');
 let isSaving = $state(false);
 let editingId = $state<number | null>(null); // بۆ فاکشنا Edit
 let selectedTemplateId = $state('');

 async function loadAllData() {
  const storedId = localStorage.getItem('doctor_id');
  if (storedId) doctorId = Number(storedId);

  // ئینانا زانیاریێن دکتۆری، نەخۆشی، مێژوو، و قاڵبان ب ئێکجار
  const [docRes, pRes, rRes, tRes] = await Promise.all([
   supabase.from('doctors').select('*').eq('id', doctorId).single(),
   supabase.from('patients').select('*').eq('id', patientId).single(),
   supabase.from('medical_records').select('*').eq('patient_id', patientId).order('created_at', { ascending: false }),
   supabase.from('medical_templates').select('*').eq('doctor_id', doctorId)
  ]);

  if (docRes.data) doctorInfo = docRes.data;
  if (pRes.data) patientInfo = pRes.data;
  if (rRes.data) records = rRes.data;
  if (tRes.data) templates = tRes.data;
 }

 onMount(loadAllData);

 // ✨ پڕکرنا خانەیان ب قاڵبێن ئامادە
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
   patient_id: patientId, doctor_id: doctorId, diagnosis, treatment, notes, bp, temp, weight,
   fee: Number(fee) || 0, created_at: new Date().toISOString()
  };

  if (editingId) {
   await supabase.from('medical_records').update(recordData).eq('id', editingId);
   alert("✅ Updated Successfully");
  } else {
   await supabase.from('medical_records').insert([recordData]);
   alert("✅ Saved Successfully");
  }

  editingId = null;
  diagnosis = ''; treatment = ''; notes = ''; bp = ''; temp = ''; weight = ''; fee = '';
  await loadAllData();
  isSaving = false;
 }

 // ✏️ دەستپێکرنا فاکشنا Edit
 function startEdit(record: MedicalRecord) {
  editingId = record.id;
  diagnosis = record.diagnosis;
  treatment = record.treatment;
  notes = record.notes;
  bp = record.bp; temp = record.temp; weight = record.weight;
  fee = record.fee.toString();
  window.scrollTo({ top: 0, behavior: 'smooth' });
 }

 async function deleteRecord(id: number) {
  if (confirm('Are you sure?')) {
   await supabase.from('medical_records').delete().eq('id', id);
   await loadAllData();
  }
 }

 // 🖨️ چاپکرنا A4 یا جیهانی ب زانیاریێن ئەدمینی
 function printRx(record: MedicalRecord) {
  const win = window.open('', '', 'width=900,height=1100');
  win?.document.write(`
   <html>
   <head>
    <style>
     @page { size: A4; margin: 15mm; }
     body { font-family: 'Segoe UI', sans-serif; padding: 0; margin: 0; color: #1a1a1a; }
     .page-border { border: 2px solid #4f46e5; padding: 40px; height: 94vh; border-radius: 20px; position: relative; box-sizing: border-box; }
     .header { display: flex; justify-content: space-between; border-bottom: 4px solid #4f46e5; padding-bottom: 15px; margin-bottom: 30px; }
     .clinic-title { font-size: 28px; font-weight: 900; color: #4f46e5; margin: 0; }
     .patient-info { background: #f8fafc; padding: 20px; border-radius: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 15px; border: 1px solid #e2e8f0; margin-bottom: 40px; font-size: 15px; }
     .content { min-height: 450px; font-size: 18px; line-height: 1.8; }
     .footer { position: absolute; bottom: 40px; left: 40px; right: 40px; border-top: 1px solid #eee; padding-top: 20px; display: flex; justify-content: space-between; font-size: 12px; color: #94a3b8; }
    </style>
   </head>
   <body>
    <div class="page-border">
     <div class="header">
      <div>
       <h1 class="clinic-title">${doctorInfo?.clinic_name || 'E-CLINIC CENTER'}</h1>
       <p style="font-size:18px; font-weight:bold; margin:5px 0;">Dr. ${doctorInfo?.doctor_name || 'Specialist'}</p>
      </div>
      <div style="text-align:right; font-size:13px;">${doctorInfo?.clinic_address || ''}<br>Tel: ${doctorInfo?.clinic_phone || ''}</div>
     </div>
     <div class="patient-info">
      <div><b>Patient:</b> ${patientInfo?.name}</div>
      <div><b>Mobile:</b> ${patientInfo?.phone || 'N/A'}</div>
      <div><b>Age / Gender:</b> ${patientInfo?.age}Y / ${patientInfo?.gender || 'N/A'}</div>
      <div><b>Date:</b> ${new Date(record.created_at).toLocaleDateString('en-GB')}</div>
     </div>
     <div class="content">
      <div style="font-size:60px; color:#4f46e5; font-style:italic; margin:0;">Rx</div>
      <p><b>Diagnosis:</b> ${record.diagnosis}</p>
      <p style="white-space: pre-line;"><b>Treatment:</b><br>${record.treatment}</p>
     </div>
     <div class="footer"><div>Printed by E-Clinic System</div><div style="text-align:center; width:200px; border-top:2px solid #333; padding-top:5px; font-weight:bold;">Signature</div></div>
    </div>
    <script>window.print(); window.close();<\/script>
   </body>
   </html>
  `);
  win?.document.close();
 }
</script>

<div class="container" style="max-width: 1200px; margin: 0 auto; padding: 10px; color: var(--text);">
 <header class="card" style="background: var(--card, white); padding: 20px; border-radius: 15px; border: 1px solid var(--border, #ddd); display: flex; justify-content: space-between; align-items: center; border-left: 6px solid #4f46e5; margin-bottom: 25px;">
  <div class="p-info">
   <h1 style="margin:0;">👤 {patientInfo?.name || 'Loading...'}</h1>
   <p style="margin:5px 0 0; opacity:0.7;">{patientInfo?.age} years | {patientInfo?.phone}</p>
  </div>
  <a href="/patients" style="text-decoration:none; font-weight:bold; color:#4f46e5;">⬅ Back to List</a>
 </header>

 <div class="main-grid" style="display: grid; grid-template-columns: 450px 1fr; gap: 20px;">
  <!-- لایێ چەپێ: فۆرم -->
  <div class="card" style="background: var(--card, white); padding: 25px; border-radius: 15px; border: 1px solid var(--border, #ddd);">
   <h3 style="margin-top:0;">{editingId ? '✏️ Edit Consultation' : '📝 New Consultation'}</h3>
   
   <!-- ⚡ پشکا قاڵبان -->
   <div style="margin-bottom: 15px; background: #f0f4ff; padding: 12px; border-radius: 10px; border: 1px solid #dbeafe;">
    <label for="t-sel" style="font-size: 0.75rem; font-weight: bold; display: block; margin-bottom: 5px; color:#1e40af;">⚡ Quick Template</label>
    <select id="t-sel" bind:value={selectedTemplateId} onchange={applyTemplate} style="width: 100%; padding: 8px; border-radius: 8px;">
     <option value="">-- Choose Ready Template --</option>
     {#each templates as t}<option value={t.id}>{t.title}</option>{/each}
    </select>
   </div>

   <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 12px;">
    <input bind:value={bp} placeholder="BP" style="padding:10px; border-radius:8px; border:1px solid #ccc;"/>
    <input bind:value={temp} placeholder="T°C" style="padding:10px; border-radius:8px; border:1px solid #ccc;"/>
    <input bind:value={weight} placeholder="Weight" style="padding:10px; border-radius:8px; border:1px solid #ccc;"/>
   </div>
   <input bind:value={diagnosis} placeholder="Diagnosis" style="width:100%; padding:12px; margin-bottom:12px; border-radius:8px; border:1px solid #ccc;"/><textarea bind:value={treatment} placeholder="Treatment & Plan..." style="width:100%; height:120px; padding:12px; border-radius:8px; border:1px solid #ccc; resize:none;"></textarea>
   <input bind:value={fee} type="number" placeholder="Fee $" style="width:100%; padding:10px; margin-bottom:15px; border-radius:8px; border:1px solid #ccc;"/>
   
   <button onclick={saveRecord} disabled={isSaving} style="width:100%; padding:14px; background:#4f46e5; color:white; border:none; border-radius:10px; cursor:pointer; font-weight:bold;">
    {isSaving ? '...' : (editingId ? '💾 Update Record' : '💾 Save Record')}
   </button>
   {#if editingId}<button onclick={() => editingId = null} style="width:100%; margin-top:5px; background:none; border:none; color:#666; cursor:pointer;">Cancel Edit</button>{/if}
  </div>

  <!-- لایێ ڕاستێ: مێژوو -->
  <div class="history">
   <h3 style="margin-top:0;">📜 Medical History ({records.length})</h3>
   {#each records as r (r.id)}
    <div class="card" style="background: var(--card, white); padding: 18px; border-radius: 12px; border: 1px solid var(--border, #ddd); border-left: 5px solid #10b981; margin-bottom: 15px;">
     <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
      <span style="font-weight:bold; font-size:0.8rem; color:#10b981;">📅 {new Date(r.created_at).toLocaleString('en-GB')}</span>
      <div style="display:flex; gap:5px;">
       <button onclick={() => printRx(r)} style="background:#f3f4f6; border:none; padding:5px 10px; border-radius:6px; cursor:pointer; font-weight:bold;">🖨️ Print</button>
       <button onclick={() => startEdit(r)} style="background:#e0f2fe; color:#0369a1; border:none; padding:5px 10px; border-radius:6px; cursor:pointer; font-weight:bold;">✏️ Edit</button>
       <button onclick={() => deleteRecord(r.id)} style="background:#fee2e2; color:#dc2626; border:none; padding:5px 10px; border-radius:6px; cursor:pointer;">🗑️</button>
      </div>
     </div>
     <b style="font-size:1.1rem;">{r.diagnosis}</b>
     <p style="font-size:0.95rem; margin-top:8px; line-height:1.5;">{r.treatment}</p>
    </div>
   {:else}
    <div style="text-align:center; padding:50px; border:2px dashed #ddd; border-radius:15px; color:#999;">No history found.</div>
   {/each}
  </div>
 </div>
</div>
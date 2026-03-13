<script lang="ts">
 import { page } from '$app/state';
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 interface Patient { id: number; name: string; age: number; phone: string; gender: string; }
 interface MedicalRecord { id: number; diagnosis: string; treatment: string; notes: string; bp: string; temp: string; weight: string; fee: number; created_at: string; }
 interface Attachment { id: number; file_url: string; file_name: string; created_at: string; }

 let patientId = $derived(Number(page.params.id)); 
 let doctorId = $state(0);
 let doctorName = $state('');
 let patientInfo = $state<Patient | null>(null);
 let records = $state<MedicalRecord[]>([]);
 let attachments = $state<Attachment[]>([]);
 
 let diagnosis = $state(''), treatment = $state(''), notes = $state(''), fee = $state('');
 let bp = $state(''), temp = $state(''), weight = $state('');
 let isSaving = $state(false);
 let isUploading = $state(false);
 let editingId = $state<number | null>(null);

 async function loadAllData() {
  const storedId = localStorage.getItem('doctor_id');
  doctorName = localStorage.getItem('doctor_username') || 'Doctor';
  if (storedId) doctorId = Number(storedId);

  const { data: p } = await supabase.from('patients').select('*').eq('id', patientId).single();
  if (p) patientInfo = p;

  const { data: r } = await supabase.from('medical_records').select('*').eq('patient_id', patientId).order('created_at', { ascending: false });
  if (r) records = r;

  const { data: att } = await supabase.from('patient_attachments').select('*').eq('patient_id', patientId).order('created_at', { ascending: false });
  if (att) attachments = att;
 }

 onMount(loadAllData);

 async function saveRecord() {
  if (!diagnosis || !treatment) return alert("Please fill Diagnosis and Treatment");
  isSaving = true;

  const recordData = {
   patient_id: patientId, doctor_id: doctorId, diagnosis, treatment, notes, bp, temp, weight,
   fee: Number(fee) || 0, created_at: new Date().toISOString()
  };

  if (editingId) {
   await supabase.from('medical_records').update(recordData).eq('id', editingId);
   alert("✅ هاتە نوژەنکرن");
  } else {
   await supabase.from('medical_records').insert([recordData]);
   alert("✅ هاتە سەیڤکرن");
  }

  clearForm();
  await loadAllData();
  isSaving = false;
 }

 function startEdit(record: MedicalRecord) {
  editingId = record.id;
  diagnosis = record.diagnosis;
  treatment = record.treatment;
  notes = record.notes;
  bp = record.bp; temp = record.temp; weight = record.weight;
  fee = record.fee.toString();
  window.scrollTo({ top: 0, behavior: 'smooth' });
 }

 function clearForm() {
  editingId = null;
  diagnosis = ''; treatment = ''; notes = ''; bp = ''; temp = ''; weight = ''; fee = '';
 }

 async function deleteRecord(id: number) {
  if (confirm('ئەرێ تو پشتراستی؟')) {
   await supabase.from('medical_records').delete().eq('id', id);
   await loadAllData();
  }
 }

 async function uploadFile(event: any) {
  const file = event.target.files[0];
  if (!file) return;
  isUploading = true;
  const fileName = `${Date.now()}_${file.name}`;
  const { data, error } = await supabase.storage.from('clinic-files').upload(fileName, file);

  if (data) {
   const fileUrl = supabase.storage.from('clinic-files').getPublicUrl(fileName).data.publicUrl;
   await supabase.from('patient_attachments').insert([{
    patient_id: patientId, doctor_id: doctorId, file_url: fileUrl, file_name: file.name
   }]);
   await loadAllData();
   alert("✅ وێنە بار بوو");
  } else {
   alert("Upload Error: " + error.message);
  }
  isUploading = false;
 }

 function printRx(record: MedicalRecord) {
  const lastImg = attachments[0]?.file_url || '';
  const win = window.open('', '', 'width=900,height=1000');
  win?.document.write(`
   <div style="font-family:sans-serif; padding:40px; border:5px solid #4f46e5; border-radius:15px; color:#333;">
    <h1 style="text-align:center; color:#4f46e5; margin-bottom:5px;">MEDICAL REPORT</h1>
    <p style="text-align:center;">Dr. ${doctorName}</p>
    <hr><div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; background:#f9fafb; padding:15px; border-radius:10px;">
     <div><b>Patient:</b> ${patientInfo?.name}</div>
     <div><b>Phone:</b> ${patientInfo?.phone}</div>
     <div><b>Date:</b> ${new Date(record.created_at).toLocaleString('en-GB')}</div>
     <div><b>Vitals:</b> BP: ${record.bp} | T: ${record.temp}°C | W: ${record.weight}kg</div>
    </div>
    <div style="margin-top:30px;">
     <h2 style="color:#4f46e5;">Rx</h2>
     <p><b>Diagnosis:</b> ${record.diagnosis}</p>
     <p><b>Treatment:</b><br>${record.treatment.replace(/\n/g, '<br>')}</p>
    </div>
    ${lastImg? `<div style="margin-top:20px; text-align:center;"><h3>Scan/Result:</h3><img src="${lastImg}" style="max-width:100%; max-height:350px; border-radius:10px; border:1px solid #ddd;"/></div>` : ''}
    <br><br><p style="text-align:right; border-top:1px solid #333; width:200px; float:right; margin-top:40px;">Signature</p>
   </div>
  `);
  win?.document.close();
  win?.print();
 }
</script>

<div class="container">
 <header class="card header-card">
  <div class="p-info">
   <h1>👤 {patientInfo?.name}</h1>
   <p>Age: {patientInfo?.age} | Phone: {patientInfo?.phone}</p>
  </div>
  <a href="/patients" class="btn-back">⬅ Back</a>
 </header>

 <div class="main-grid">
  <div class="card form-container">
   <h3>{editingId ? '✏️ Edit Record' : '📝 New Consultation'}</h3>
   <div class="vitals">
    <input bind:value={bp} placeholder="BP" />
    <input bind:value={temp} placeholder="T°C" />
    <input bind:value={weight} placeholder="Weight" />
   </div>
   <input bind:value={diagnosis} placeholder="Diagnosis" style="margin-bottom:10px;"/>
   <textarea bind:value={treatment} placeholder="Treatment & Plan..."></textarea>
   <input bind:value={notes} placeholder="Extra private notes..." style="margin:10px 0;"/>
   
   <div class="row-flex">
    <div style="flex:1;">
     <!-- svelte-ignore a11y_label_has_associated_control -->
     <label style="font-size:0.7rem; font-weight:bold; display:block; margin-bottom:2px;">Fee ($)</label>
     <input bind:value={fee} type="number" placeholder="0.00" />
    </div>
    <button class="save-btn" onclick={saveRecord} style="flex:2; height:45px; align-self:flex-end;">
     {editingId ? '💾 Update' : '💾 Save Record'}
    </button>
   </div>

   <div class="upload-section">
    <!-- svelte-ignore a11y_label_has_associated_control -->
    <label>📂 Attach X-Ray / Lab Result (Below Fee)</label>
    <input type="file" onchange={uploadFile} />
    {#if isUploading}<p style="color:blue;">Uploading...</p>{/if}
   </div>
   {#if editingId}<button onclick={clearForm} class="btn-cancel">Cancel Edit</button>{/if}
  </div>

  <div class="history-list">
   {#if attachments.length > 0}
    <div class="card gallery">
     <h4>🖼️ Medical Attachments</h4>
     <div class="images">
      {#each attachments as att}
       <a href={att.file_url} target="_blank"><img src={att.file_url} alt="Medical" /></a>
      {/each}
     </div>
    </div>
   {/if}

   <h3>📜 Medical History ({records.length})</h3>
   {#each records as record (record.id)}
    <div class="record card">
     <div class="record-head">
      <span class="date">📅 {new Date(record.created_at).toLocaleString('en-GB')}</span>
      <div class="actions">
       <button class="btn-p" onclick={() => printRx(record)}>🖨️ Print</button>
       <button class="btn-e" onclick={() => startEdit(record)}>✏️</button>
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
 .container { max-width: 1200px; margin: 0 auto; color: var(--text); padding: 10px; }
 .card { background: var(--card, white); padding: 25px; border-radius: 20px; border: 1px solid var(--border, #ddd); margin-bottom: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
 .header-card { display: flex; justify-content: space-between; align-items: center; border-left: 6px solid #4f46e5; }
 .main-grid { display: grid; grid-template-columns: 450px 1fr; gap: 20px; }
 @media (max-width: 1000px) { .main-grid { grid-template-columns: 1fr; } }
 
 .vitals { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 10px; }
 input, textarea { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #ccc; background: white !important; color: black !important; box-sizing: border-box; }
 textarea { height: 100px; resize: none; }
 
 .row-flex { display: flex; gap: 10px; margin-top: 10px; align-items: center; }
 .save-btn { background: #4f46e5; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; }
 .upload-section { margin-top: 20px; padding: 10px; background: #f9fafb; border-radius: 10px; font-size: 0.8rem; }
 .btn-cancel { width: 100%; margin-top: 5px; background: #94a3b8; color: white; border: none; padding: 8px; border-radius: 8px; cursor: pointer; }

 .images { display: flex; gap: 10px; overflow-x: auto; padding: 10px 0; }
 .images img { width: 80px; height: 80px; border-radius: 10px; object-fit: cover; border: 1px solid #ddd; }
 
 .record { border-left: 5px solid #10b981; }
 .record-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
 .date { font-size: 0.8rem; font-weight: bold; color: #10b981; }
 .actions button { border: none; padding: 5px 10px; border-radius: 6px; cursor: pointer; font-weight: bold; }
 .btn-p { background: #f3f4f6; } .btn-e { background: #e0f2fe; color: #0369a1; } .btn-d { background: #fee2e2; color: #dc2626; }
 .back-btn { text-decoration: none; background: #f3f4f6; color: #333; padding: 8px 15px; border-radius: 8px; font-weight: bold; font-size: 0.85rem; }
</style>
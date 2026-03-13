<script lang="ts">
 import { page } from '$app/state';
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 // ١. پێناسەکرنا جۆرێ داتایان
 interface Patient { id: number; name: string; age: number; phone: string; gender: string; }
 interface MedicalRecord { id: number; diagnosis: string; treatment: string; notes: string; bp: string; temp: string; weight: string; fee: number; created_at: string; }
 interface Attachment { id: number; file_url: string; file_name: string; created_at: string; }

 // ٢. وەرگرتنا ئایدییا نەخۆشی
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

  if (!patientId) return;

  const { data: p } = await supabase.from('patients').select('*').eq('id', patientId).single();
  if (p) patientInfo = p;

  const { data: r } = await supabase.from('medical_records').select('*').eq('patient_id', patientId).order('created_at', { ascending: false });
  if (r) records = r;

  const { data: att } = await supabase.from('patient_attachments').select('*').eq('patient_id', patientId).order('created_at', { ascending: false });
  if (att) attachments = att;
 }

 onMount(loadAllData);

 async function saveRecord() {
  if (!diagnosis || !treatment) return alert("تکایە خانەیان پڕ بکە");
  isSaving = true;

  const recordData = {
   patient_id: patientId, doctor_id: doctorId, diagnosis, treatment, notes, bp, temp, weight,
   fee: Number(fee) || 0
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
  }
  isUploading = false;
 }

 async function deleteRecord(id: number) {
  if (confirm('Are you sure?')) {
   await supabase.from('medical_records').delete().eq('id', id);
   await loadAllData();
  }
 }

 // 🖨️ فانکشنا چاپکرنا ڕاستکری ب بێ چو خەلەتییەکێ
 // 🖨️ فانکشنا چاپکرنا ڕاستکری ب بێ چو خەلەتییەکێ
 function printRx(record: MedicalRecord) {
  const lastImg = attachments[0]?.file_url || '';
  const win = window.open('', '', 'width=900,height=1000');
  
  // لێرە گەلەک ئاگه‌هدار بە: دڤێت نیشانا ( ` ) ل تەنشت نیشانا = هەبیت
  const printContent = `
   <div style="font-family:sans-serif; padding:40px; border:2px solid #4f46e5; border-radius:15px;">
    <h1 style="text-align:center; color:#4f46e5; margin-bottom:5px;">E-CLINIC MEDICAL REPORT</h1>
    <p style="text-align:center; margin-top:0;">Dr. ${doctorName}</p>
    <hr>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; background:#f9fafb; padding:15px; border-radius:10px; color:#333;">
     <div><b>Patient:</b> ${patientInfo?.name}</div>
     <div><b>Phone:</b> ${patientInfo?.phone}</div>
     <div><b>Date:</b> ${new Date(record.created_at).toLocaleDateString('en-GB')}</div>
     <div><b>Vitals:</b> BP: ${record.bp} | T: ${record.temp}°C | W: ${record.weight}kg</div>
    </div>
    <div style="margin-top:30px; color:#333;">
     <h2 style="color:#4f46e5; font-size:40px; margin-bottom:10px;">Rx</h2>
     <p><b>Diagnosis:</b> ${record.diagnosis}</p>
     <p><b>Treatment:</b><br>${record.treatment.replace(/\n/g, '<br>')}</p>
    </div>
    ${
      lastImg
        ? `<div style="margin-top:20px; text-align:center;"><h3>Attached Result:</h3><img src="${lastImg}" style="max-width:100%; max-height:350px; border-radius:10px; border:1px solid #ddd;"/></div>`
        : ''
    }
    <br><br><p style="text-align:right; border-top:1px solid #333; width:200px; float:right; margin-top:40px; color:#333;">Doctor Signature</p>
   </div>
  `;

  win?.document.write(printContent);
  win?.document.close();
  win?.print();
 }
</script>

<div class="container">
 <header class="card header-card">
  <div class="p-info">
   <h1>👤 {patientInfo?.name}</h1>
   <p>Age: {patientInfo?.age} | {patientInfo?.gender} | {patientInfo?.phone}</p>
  </div>
  <a href="/patients" class="btn-back">⬅ Back</a>
 </header>

 <div class="main-grid">
  <!-- فۆرما چەپێ -->
  <div class="card form-container">
   <h3>{editingId ? '✏️ Edit Record' : '📝 New Consultation'}</h3>
   <div class="vitals">
    <input bind:value={bp} placeholder="BP" />
    <input bind:value={temp} placeholder="T°C" />
    <input bind:value={weight} placeholder="Weight" />
   </div>
   <input bind:value={diagnosis} placeholder="Diagnosis" style="margin-bottom:10px;"/>
   <textarea bind:value={treatment} placeholder="Treatment & Plan..."></textarea>
   <div class="flex-row" style="display:flex; gap:10px; margin-top:10px;">
    <input bind:value={fee} type="number" placeholder="Fee $" style="flex:1;" />
    <button class="save-btn" onclick={saveRecord} style="flex:2;">💾 {editingId ? 'Update' : 'Save'}</button>
   </div>
   <hr style="margin:20px 0; opacity:0.1;" />
   <div class="upload-box">
    <!-- svelte-ignore a11y_label_has_associated_control -->
    <label>📂 Attach Image (X-Ray/Lab)</label>
    <input type="file" onchange={uploadFile} />
   </div>
  </div>

  <!-- لیستا ڕاستێ -->
  <div class="history-list">
   {#if attachments.length > 0}
    <div class="gallery card">
     <h4>🖼️ Attachments</h4>
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
      <span class="date">📅 {new Date(record.created_at).toLocaleDateString()}</span>
      <div class="actions">
       <button class="btn-print" onclick={() => printRx(record)}>🖨️ Print</button>
       <button class="btn-del" onclick={() => deleteRecord(record.id)}>🗑️</button>
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
 .card { background: var(--card, white); padding: 25px; border-radius: 20px; border: 1px solid var(--border, #ddd); margin-bottom: 20px; }
 .header-card { display: flex; justify-content: space-between; align-items: center; border-left: 6px solid #4f46e5; }
 .main-grid { display: grid; grid-template-columns: 450px 1fr; gap: 20px; }
 @media (max-width: 1000px) { .main-grid { grid-template-columns: 1fr; } }
 
 .vitals { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 10px; }
 input, textarea { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #ccc; background: white !important; color: black !important; box-sizing: border-box; }
 textarea { height: 100px; resize: none; }
 
 .save-btn { background: #4f46e5; color: white; border: none; padding: 12px; border-radius: 10px; cursor: pointer; font-weight: bold; }
 .btn-print { background: #f3f4f6; border: 1px solid #ddd; padding: 5px 10px; border-radius: 6px; cursor: pointer; font-size: 0.7rem; font-weight: bold; }
 .btn-del { background: #fee2e2; color: #ef4444; border: none; padding: 5px 10px; border-radius: 6px; cursor: pointer; }
 
 .images { display: flex; gap: 10px; overflow-x: auto; padding: 10px 0; }
 .images img { width: 80px; height: 80px; border-radius: 10px; object-fit: cover; border: 1px solid #ddd; }
 
 .record { border-left: 5px solid #10b981; }
 .record-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
 .date { font-size: 0.85rem; font-weight: bold; color: #10b981; }
 .rx-txt { font-size: 0.9rem; line-height: 1.5; white-space: pre-line; }
 .btn-back { text-decoration: none; background: #f3f4f6; color: #333; padding: 8px 15px; border-radius: 8px; font-weight: bold; font-size: 0.85rem; }
</style>
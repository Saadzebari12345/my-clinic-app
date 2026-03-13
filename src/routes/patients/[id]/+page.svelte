<script lang="ts">
 import { page } from '$app/state';
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 // ١. پێناسەکرنا جۆرێ داتایان (Interfaces)
 interface Patient { id: number; name: string; age: number; phone: string; gender: string; }
 interface MedicalRecord { id: number; diagnosis: string; treatment: string; notes: string; bp: string; temp: string; weight: string; fee: number; created_at: string; }
 interface Attachment { id: number; file_url: string; file_name: string; created_at: string; }

 // ٢. وەرگرتنا ئایدییا نەخۆشی ب ڕێکا Number()
 let patientId = $derived(Number(page.params.id));
 
 let doctorId = $state(0);
 let doctorName = $state('');
 let patientInfo = $state<Patient | null>(null);
 let records = $state<MedicalRecord[]>([]);
 let attachments = $state<Attachment[]>([]);
 
 // ٣. گۆڕاوێن فۆرمێ
 let diagnosis = $state(''), treatment = $state(''), notes = $state(''), fee = $state('');
 let bp = $state(''), temp = $state(''), weight = $state('');
 let isSaving = $state(false);
 let isUploading = $state(false);

 async function loadAllData() {
  const storedId = localStorage.getItem('doctor_id');
  doctorName = localStorage.getItem('doctor_username') || 'Doctor';
  if (storedId) doctorId = Number(storedId);

  if (!patientId) return;

  // ئینانا زانیاریێن نەخۆشی
  const { data: p } = await supabase.from('patients').select('*').eq('id', patientId).single();
  if (p) patientInfo = p;

  // ئینانا مێژوویا پزیشکی
  const { data: r } = await supabase.from('medical_records').select('*').eq('patient_id', patientId).order('created_at', { ascending: false });
  if (r) records = r;

  // ئینانا وێنەیێن بارکری (Attachments)
  const { data: att } = await supabase.from('patient_attachments').select('*').eq('patient_id', patientId).order('created_at', { ascending: false });
  if (att) attachments = att;
 }

 onMount(loadAllData);

 // ٤. فانکشنا زێدەکرنا ڕاپۆرتێ
 async function addRecord() {
  if (!diagnosis || !treatment) return alert("تکایە خانەیان پڕ بکە");
  isSaving = true;
  const { data, error } = await supabase.from('medical_records').insert([{
   patient_id: patientId, doctor_id: doctorId, diagnosis, treatment, notes, bp, temp, weight,
   fee: Number(fee) || 0, created_at: new Date().toISOString()
  }]).select();
  
  if (!error && data) {
   records = [data[0] as MedicalRecord, ...records];
   diagnosis = ''; treatment = ''; notes = ''; bp = ''; temp = ''; weight = ''; fee = '';
   alert("✅ Record Saved!");
  }
  isSaving = false;
 }

 // ٥. فانکشنا بارکرنا وێنەیان (ڕاستکری ب بکارئینانا Backticks)
 async function uploadFile(event: any) {
  const file = event.target.files[0];
  if (!file) return;

  isUploading = true;
  // ⚡ لێرە مەرجە نیشانا ( ` ) بەکاربهینی نەک ( ' )
  const fileName = `${Date.now()}_${file.name}`;
  
  try {
   // بارکرن بۆ Supabase Storage
   const { data: uploadData, error: uploadError } = await supabase.storage
    .from('clinic-files')
    .upload(fileName, file);

   if (uploadError) throw uploadError;

   // وەرگرتنا لینکا گشتی (Public URL)
   const { data: urlData } = supabase.storage.from('clinic-files').getPublicUrl(fileName);
   const fileUrl = urlData.publicUrl;
   
   // تۆمارکرن د خشتەیێ داتابەیسێ دا
   const { data: dbEntry, error: dbError } = await supabase.from('patient_attachments').insert([{
    patient_id: patientId, doctor_id: doctorId, file_url: fileUrl, file_name: file.name
   }]).select();
   
   if (dbError) throw dbError;
   if (dbEntry) {
    attachments = [dbEntry[0] as Attachment, ...attachments];
    alert("✅ وێنە ب سەرکەفتی بار بوو");
   }
  } catch (err: any) {
   alert("Upload Error: " + err.message);
  } finally {
   isUploading = false;
  }
 }

 // ٦. فانکشنا ژێبرنا ڕاپۆرتێ
 async function deleteRecord(id: number) {
  if (confirm('Delete this record?')) {
   const { error } = await supabase.from('medical_records').delete().eq('id', id);
   if (!error) records = records.filter(r => r.id !== id);
  }
 }

 // ٧. چاپکرنا فەرمی
 function printRx(record: MedicalRecord) {
  const win = window.open('', '', 'width=900,height=900');
  const html = `
   <div style="font-family:sans-serif; padding:50px; border:2px solid #333;">
    <h1 style="text-align:center; color:#4f46e5;">MEDICAL REPORT</h1>
    <p><b>Patient:</b> ${patientInfo?.name} | <b>Phone:</b> ${patientInfo?.phone}</p>
    <p><b>Date:</b> ${new Date(record.created_at).toLocaleString('en-GB')}</p>
    <hr>
    <p><b>Vitals:</b> BP: ${record.bp} | T: ${record.temp}°C | W: ${record.weight}kg</p>
    <h3>Diagnosis:</h3><p>${record.diagnosis}</p>
    <h3>Treatment:</h3><p style="white-space:pre-line;">${record.treatment}</p>
   </div>
  `;
  win?.document.write(html);
  win?.document.close();
  win?.print();
 }
</script>

{#if patientInfo}
 <div class="profile-container">
  <header class="card patient-header">
   <div class="p-info">
    <h1>👤 {patientInfo.name}</h1>
    <p class="meta">Age: {patientInfo.age} | {patientInfo.gender} | {patientInfo.phone}</p>
   </div>
   <a href="/patients" class="back-btn">⬅ Back</a>
  </header>

  <div class="main-grid">
   <!-- فۆرما چەپێ -->
   <div class="card form-section">
    <h3>📝 New Consultation</h3>
    <div class="vitals-row">
     <input bind:value={bp} placeholder="BP" />
     <input bind:value={temp} placeholder="Temp" />
     <input bind:value={weight} placeholder="Weight" />
    </div>
    <input bind:value={diagnosis} placeholder="Diagnosis" style="margin-bottom:10px;" />
    <textarea bind:value={treatment} placeholder="Treatment & Plan..."></textarea>
    <div class="flex-row">
     <input bind:value={fee} type="number" placeholder="Fee $" style="flex:1;" />
     <button class="save-btn" onclick={addRecord} disabled={isSaving}>{isSaving ? '...' : '💾 Save Record'}</button>
    </div>
    <hr style="margin:20px 0; opacity:0.1;" />
    <div class="upload-box">
     <label for="f-up">📂 Attach X-Ray / Lab Result</label>
     <input id="f-up" type="file" onchange={uploadFile} disabled={isUploading} />
     {#if isUploading}<p>Uploading...</p>{/if}
    </div>
   </div>

   <!-- مێژوو و وێنەکان (لایێ ڕاستێ) -->
   <div class="history-list">
    {#if attachments.length > 0}
     <div class="gallery card">
      <h4>🖼️ Attachments</h4>
      <div class="images">
       {#each attachments as att}
        <a href={att.file_url} target="_blank">
         <img src={att.file_url} alt="Medical" />
        </a>
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
        <button class="btn-print" onclick={() => printRx(record)}>🖨️ Print</button>
        <button class="btn-del" onclick={() => deleteRecord(record.id)}>🗑️</button>
       </div>
      </div>
      <h4>{record.diagnosis}</h4>
      <p class="rx-txt">{record.treatment}</p>
     </div>
    {:else}
     <div class="empty">No history found.</div>
    {/each}
   </div>
  </div>
 </div>
{/if}

<style>
 .profile-container { max-width: 1200px; margin: 0 auto; color: var(--text); padding: 10px; }
 .card { background: var(--card, white); padding: 25px; border-radius: 20px; border: 1px solid var(--border, #ddd); margin-bottom: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
 .patient-header { display: flex; justify-content: space-between; align-items: center; border-left: 6px solid #4f46e5; }
 .main-grid { display: grid; grid-template-columns: 450px 1fr; gap: 20px; }
 @media (max-width: 1000px) { .main-grid { grid-template-columns: 1fr; } }
 
 .vitals-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 10px; }
 input, textarea { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #ccc; background: white !important; color: black !important; box-sizing: border-box; }
 textarea { height: 100px; resize: none; }
 
 .save-btn { background: #4f46e5; color: white; border: none; padding: 12px; border-radius: 10px; cursor: pointer; font-weight: bold; }
 .back-btn { text-decoration: none; background: #f3f4f6; color: #333; padding: 10px 15px; border-radius: 8px; font-weight: bold; font-size: 0.85rem; }

 .images { display: flex; gap: 10px; overflow-x: auto; padding: 10px 0; }
 .images img { width: 90px; height: 90px; border-radius: 10px; object-fit: cover; border: 1px solid #ddd; }
 
 .record { border-left: 5px solid #10b981; }
 .record-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
 .date { font-size: 0.85rem; font-weight: bold; color: #10b981; }
 .actions { display: flex; gap: 5px; }
 .btn-print { background: #f3f4f6; border: 1px solid #ddd; padding: 5px 10px; border-radius: 6px; cursor: pointer; font-size: 0.7rem; font-weight: bold; }
 .btn-del { background: #fee2e2; color: #ef4444; border: none; padding: 5px 10px; border-radius: 6px; cursor: pointer; }
 .rx-txt { font-size: 0.9rem; line-height: 1.5; white-space: pre-line; }
</style>
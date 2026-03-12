<script lang="ts">
 import { page } from '$app/state';
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 interface Patient { id: number; name: string; age: number; phone: string; gender: string; }
 interface MedicalRecord { 
  id: number; diagnosis: string; treatment: string; notes: string; 
  bp: string; temp: string; weight: string; fee: number; created_at: string; 
 }

 // ١. وەرگرتنا ئایدییا نەخۆشی ب ڕێکا Number()
 let patientId = $derived(Number(page.params.id));
 let doctorId = $state(0);
 let patientInfo = $state<Patient | null>(null);
 let records = $state<MedicalRecord[]>([]);
 
 // ٢. گۆڕاوێن فۆرمێ
 let diagnosis = $state(''), treatment = $state(''), notes = $state(''), fee = $state('');
 let bp = $state(''), temp = $state(''), weight = $state('');
 let isSaving = $state(false);

 async function loadAllData() {
  const storedId = localStorage.getItem('doctor_id');
  if (storedId) doctorId = Number(storedId);
  if (!patientId) return;

  // ئینانا زانیاریێن نەخۆشی
  const { data: p } = await supabase.from('patients').select('*').eq('id', patientId).single();
  if (p) patientInfo = p;

  // ئینانا مێژوویا پزیشکی
  const { data: r } = await supabase
   .from('medical_records')
   .select('*')
   .eq('patient_id', patientId)
   .order('created_at', { ascending: false });
  if (r) records = r;
 }

 onMount(loadAllData);

 // ٣. فانکشنا زێدەکرنا ڕاپۆرتێ (نوکە ب ڕاستەوخۆ دیار دبیت)
 async function addRecord() {
  if (!diagnosis || !treatment) return alert("تکایە Diagnosis و Treatment پڕ بکە");
  isSaving = true;

  const { data, error } = await supabase.from('medical_records').insert([{
   patient_id: patientId,
   doctor_id: doctorId,
   diagnosis,
   treatment,
   notes,
   bp, temp, weight,
   fee: Number(fee) || 0,
   created_at: new Date().toISOString()
  }]).select(); // ئەڤ .select() گەلەک گرنگە بۆ نوژەنکرنا خێرا

  if (!error && data) {
   // زێدەکرنا داتایا نوی بۆ لیستا لایێ ڕاستێ ئێکسەر بێی چاوەڕێکرن
   records = [data[0] as MedicalRecord, ...records];
   
   // ڤالاکرنا فۆرمێ
   diagnosis = ''; treatment = ''; notes = ''; fee = ''; bp = ''; temp = ''; weight = '';
  } else if (error) {
   alert("Error: " + error.message);
  }
  isSaving = false;
 }

 // ٤. فانکشنا ژێبرنا ڕاپۆرتێ (ئەوا تە داخواز کری)
 async function deleteRecord(id: number) {
  if (confirm('ئەرێ تو پشتراستی تو دڤێت ڤێ ڕاپۆرتێ ژێببەی؟')) {
   const { error } = await supabase.from('medical_records').delete().eq('id', id);
   if (!error) {
    // لادان ژ سەر شاشێ ب ڕاستەوخۆ
    records = records.filter(r => r.id !== id);
   } else {
    alert("Error: " + error.message);
   }
  }
 }

 function printRx(record: MedicalRecord) {
  const printWin = window.open('', '', 'width=900,height=700');
  const html = `
   <div style="font-family:sans-serif; padding:40px; border:2px solid #333;">
    <h1 style="text-align:center; color:#4f46e5;">MEDICAL REPORT</h1>
    <hr>
    <p><b>Patient:</b> ${patientInfo?.name} | <b>Date:</b> ${new Date(record.created_at).toLocaleDateString()}</p>
    <p><b>Vitals:</b> BP: ${record.bp} | T: ${record.temp} | W: ${record.weight}</p>
    <h3>Diagnosis:</h3><p>${record.diagnosis}</p>
    <h3>Treatment:</h3><p style="white-space:pre-line;">${record.treatment}</p>
   </div>
  `;
  printWin?.document.write(html);
  printWin?.document.close();
  printWin?.print();
 }
</script>

{#if patientInfo}
 <div class="profile-container">
  <header class="card header-card">
   <div class="p-info">
    <h1>👤 {patientInfo.name}</h1>
    <div class="meta">Age: {patientInfo.age} | Phone: {patientInfo.phone}</div>
   </div>
   <a href="/patients" class="back-btn">⬅ Back to Patients</a>
  </header>

  <div class="main-grid">
   <!-- فۆرم (لایێ چەپێ) -->
   <div class="card form-container">
    <h3>📝 New Consultation</h3>
    <div class="vitals-row">
     <input bind:value={bp} placeholder="BP (120/80)" />
     <input bind:value={temp} placeholder="Temp" />
     <input bind:value={weight} placeholder="Weight" />
    </div>
    <label for="dg">Diagnosis</label><input id="dg" bind:value={diagnosis} placeholder="Condition..." />
    <label for="tr">Treatment / Plan</label>
    <textarea id="tr" bind:value={treatment} placeholder="Medications..."></textarea>
    <div style="display:flex; gap:10px;">
     <input bind:value={notes} placeholder="Extra Notes" style="flex:2;" />
     <input bind:value={fee} type="number" placeholder="Fee $" style="flex:1;" />
    </div>
    <button class="btn-save" onclick={addRecord} disabled={isSaving}>
     {isSaving ? 'Processing...' : '💾 Save Record'}
    </button>
   </div>

   <!-- لیستا مێژوویا پزیشکی (لایێ ڕاستێ) -->
   <div class="history-list">
    <h3>📜 Medical History ({records.length})</h3>
    {#each records as record (record.id)}
     <div class="record-item card">
      <div class="item-header">
       <span class="date">📅 {new Date(record.created_at).toLocaleDateString()}</span>
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
     <div class="empty">No records found. Save a new consultation to see it here.</div>
    {/each}
   </div>
  </div>
 </div>
{/if}

<style>
 .profile-container { max-width: 1200px; margin: 0 auto; color: var(--text); padding: 10px; }
 .card { background: var(--card, white); padding: 25px; border-radius: 15px; border: 1px solid var(--border, #ddd); margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
 .header-card { display: flex; justify-content: space-between; align-items: center; border-left: 6px solid #4f46e5; }
 
 .main-grid { display: grid; grid-template-columns: 450px 1fr; gap: 20px; }
 @media (max-width: 1000px) { .main-grid { grid-template-columns: 1fr; } }
 
 .vitals-row { display: flex; gap: 10px; margin-bottom: 10px; }
 input, textarea { width: 100%; padding: 10px; margin-bottom: 10px; border-radius: 8px; border: 1px solid #ccc; background: white !important; color: black !important; box-sizing: border-box; }
 label { display: block; font-weight: bold; font-size: 0.8rem; margin-bottom: 5px; }
 
 .btn-save { width: 100%; padding: 15px; background: #4f46e5; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; }
 .btn-print { background: #f3f4f6; border: 1px solid #ddd; padding: 5px 10px; border-radius: 6px; cursor: pointer; font-size: 0.75rem; font-weight: bold; color: #333; }
 .btn-del { background: #fee2e2; color: #dc2626; border: none; padding: 5px 8px; border-radius: 6px; cursor: pointer; font-size: 1rem; }
 .back-btn { text-decoration: none; background: #f3f4f6; color: #333; padding: 10px 15px; border-radius: 8px; font-weight: bold; font-size: 0.85rem; }

 .record-item { border-left: 5px solid #10b981; margin-bottom: 15px; position: relative; }
 .item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
 .date { font-size: 0.85rem; font-weight: bold; color: #10b981; }
 .rx-txt { font-size: 0.9rem; line-height: 1.4; white-space: pre-line; }
 .fee-tag { display: inline-block; margin-top: 10px; background: #dcfce7; color: #15803d; padding: 2px 10px; border-radius: 15px; font-size: 0.7rem; font-weight: bold; }
 .empty { text-align: center; padding: 50px; border: 2px dashed #ddd; border-radius: 15px; opacity: 0.5; }
</style>
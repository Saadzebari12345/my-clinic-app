<script lang="ts">
 import { page } from '$app/state';
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 // ١. پێناسەکرنا جۆرێ داتایان (بۆ لادانا هێڵێن سۆر)
 interface Patient {
  id: number;
  name: string;
  age: number;
  phone: string;
  gender: string;
 }

 interface MedicalRecord {
  id: number;
  diagnosis: string;
  treatment: string;
  notes: string;
  bp: string;
  temp: string;
  weight: string;
  fee: number;
  created_at: string;
 }

 // ٢. گۆڕاوێن سەرەکی
 let patientId = $derived(Number(page.params.id));
 let doctorId = $state(0);
 let patientInfo = $state<Patient | null>(null);
 let records = $state<MedicalRecord[]>([]);

 // ٣. گۆڕاوێن فۆرمێ
 let diagnosis = $state(''), treatment = $state(''), notes = $state(''), fee = $state('');
 let bp = $state(''), temp = $state(''), weight = $state('');
 let isSaving = $state(false);

 async function loadData() {
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

 onMount(loadData);

 async function addRecord() {
  if (!diagnosis || !treatment) return alert('Please fill Diagnosis and Treatment');
  isSaving = true;

  const { data, error } = await supabase
   .from('medical_records')
   .insert([
    {
     patient_id: patientId,
     doctor_id: doctorId,
     diagnosis,
     treatment,
     notes,
     bp,
     temp,
     weight,
     fee: Number(fee) || 0,
     created_at: new Date().toISOString()
    }
   ])
   .select();

  if (!error && data) {
   diagnosis = ''; treatment = ''; notes = ''; fee = ''; bp = ''; temp = ''; weight = '';
   records = [data[0] as MedicalRecord, ...records];
  }
  isSaving = false;
 }

 function printRx(record: MedicalRecord) {
  const html = `
   <div style="font-family:sans-serif; padding:40px; border:2px solid #333;">
    <h1 style="text-align:center;">MEDICAL REPORT</h1>
    <hr>
    <p><b>Patient:</b> ${patientInfo?.name} | <b>Date:</b> ${new Date(record.created_at).toLocaleDateString()}</p>
    <p><b>Vitals:</b> BP: ${record.bp} | T: ${record.temp} | W: ${record.weight}</p>
    <h3>Diagnosis:</h3><p>${record.diagnosis}</p>
    <h3>Treatment:</h3><p>${record.treatment}</p>
   </div>
  `;
  const win = window.open('', '', 'width=800,height=600');
  win?.document.write(html);
  win?.document.close();
  win?.print();
 }
</script>

{#if patientInfo}
 <div class="profile-container">
  <header class="card header-card">
   <div class="p-info">
    <h1>👤 {patientInfo.name}</h1>
    <p>Age: {patientInfo.age} | Phone: {patientInfo.phone}</p>
   </div>
   <a href="/patients" class="btn-back">⬅ Back</a>
  </header>

  <div class="main-grid">
   <div class="card">
    <h3>📝 New Consultation</h3>
    <div class="vitals-row">
     <input bind:value={bp} placeholder="BP" />
     <input bind:value={temp} placeholder="Temp" />
     <input bind:value={weight} placeholder="Weight" />
    </div>
    <label for="dg">Diagnosis</label>
    <input id="dg" bind:value={diagnosis} placeholder="Condition..." />
    <label for="tr">Treatment</label>
    <textarea id="tr" bind:value={treatment} placeholder="Medications..."></textarea>
    <div style="display:flex; gap:10px;">
     <input bind:value={notes} placeholder="Notes" style="flex:2;" />
     <input bind:value={fee} type="number" placeholder="Fee" style="flex:1;" />
    </div>
    <button class="btn-save" onclick={addRecord} disabled={isSaving}>
     {isSaving ? 'Saving...' : '💾 Save Record'}
    </button>
   </div>

   <div class="history-list">
    <h3>📜 Medical History</h3>
    {#each records as record (record.id)}
     <div class="record-item card">
      <div class="item-header">
       <span class="date">📅 {new Date(record.created_at).toLocaleDateString()}</span>
       <button class="btn-print" onclick={() => printRx(record)}>🖨️ Print</button>
      </div>
      <h4>{record.diagnosis}</h4>
      <p>{record.treatment}</p>
     </div>
    {/each}
   </div>
  </div>
 </div>
{/if}

<style>
 .profile-container { max-width: 1200px; margin: 0 auto; color: var(--text); }
 .card { background: var(--card, white); padding: 25px; border-radius: 15px; border: 1px solid var(--border, #ddd); margin-bottom: 20px; }
 .header-card { display: flex; justify-content: space-between; align-items: center; border-left: 6px solid #4f46e5; }
 .main-grid { display: grid; grid-template-columns: 450px 1fr; gap: 20px; }
 @media (max-width: 900px) { .main-grid { grid-template-columns: 1fr; } }
 .vitals-row { display: flex; gap: 10px; margin-bottom: 10px; }
 input, textarea { width: 100%; padding: 10px; margin-bottom: 10px; border-radius: 8px; border: 1px solid #ccc; background: white !important; color: black !important; }
 label { display: block; font-weight: bold; font-size: 0.8rem; margin-bottom: 5px; }
 .btn-save { width: 100%; padding: 15px; background: #4f46e5; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; }
 .btn-print { background: #f3f4f6; border: 1px solid #ddd; padding: 5px 10px; border-radius: 6px; cursor: pointer; font-size: 0.8rem; color: #333; }
 .btn-back { text-decoration: none; background: #f3f4f6; color: #333; padding: 10px 15px; border-radius: 8px; font-weight: bold; }
 .record-item { border-left: 5px solid #10b981; }
 .item-header { display: flex; justify-content: space-between; }
 .date { font-weight: bold; color: #10b981; font-size: 0.8rem; }
</style>
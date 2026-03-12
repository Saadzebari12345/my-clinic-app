<script lang="ts">
 import { page } from '$app/state';
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 interface Patient { id: number; name: string; age: number; phone: string; gender: string; }
 interface MedicalRecord { id: number; diagnosis: string; treatment: string; notes: string; created_at: string; }

 let patientId = $derived(Number(page.params.id)); 
 let doctorId = $state(0);
 let patientInfo = $state<Patient | null>(null);
 let records = $state<MedicalRecord[]>([]);
 
 let diagnosis = $state(''), treatment = $state(''), notes = $state('');
 let isSaving = $state(false);

 async function loadAllData() {
  const storedId = localStorage.getItem('doctor_id');
  if (storedId) doctorId = Number(storedId);

  if (!patientId) return;

  // ئینانا زانیاریێن نەخۆشی
  const { data: p } = await supabase.from('patients').select('*').eq('id', patientId).single();
  if (p) patientInfo = p;

  // ئینانا مێژوویا پزیشکی
  const { data: r, error } = await supabase
   .from('medical_records')
   .select('*')
   .eq('patient_id', patientId) 
   .order('created_at', { ascending: false });
  
  if (!error && r) records = r;
 }

 onMount(loadAllData);

 async function addRecord() {
  if (!diagnosis || !treatment) return alert("تکایە خانەیان پڕ بکە");
  isSaving = true;

  const { data, error } = await supabase.from('medical_records').insert([{
   patient_id: patientId,
   doctor_id: doctorId,
   diagnosis,
   treatment,
   notes
  }]).select();
  
  if (!error && data) {
   diagnosis = ''; treatment = ''; notes = '';
   records = [data[0], ...records];
   alert("✅ Record saved successfully!");
  }
  isSaving = false;
 }

 // فانکشنا ژێبرنا ڕاپۆرتەکێ (ئەوا تە داخواز کری)
 async function deleteRecord(id: number) {
  if (confirm('ئەرێ تو پشتراستی تو دڤێت ڤێ ڕاپۆرتێ ژێببەی؟')) {
   const { error } = await supabase.from('medical_records').delete().eq('id', id);
   if (!error) {
    records = records.filter(r => r.id !== id); // لادانا خێرا ل سەر شاشێ
   } else {
    alert("Error deleting record: " + error.message);
   }
  }
 }

 // فانکشنا ڕێکخستنا کاتی ب شێوازەکێ جوان
 function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB') + ' - ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
 }
</script>

{#if patientInfo}
 <div class="profile-layout">
  <header class="card header-box">
   <div class="p-info">
    <h1>👤 {patientInfo.name}</h1>
    <p>Age: {patientInfo.age} | Phone: {patientInfo.phone}</p>
   </div>
   <a href="/patients" class="btn-back">⬅ Back</a>
  </header>

  <div class="main-grid">
   <!-- Form (Left) -->
   <div class="card">
    <h3>📝 New Consultation</h3>
    <label for="diag">Diagnosis (نەخۆشی)</label>
    <input id="diag" bind:value={diagnosis} placeholder="Condition..." style="width:100%; padding:12px; margin-bottom:15px; border-radius:10px; border:1px solid #ccc; background: white; color: black;" />
    
    <label for="treat">Treatment (دەرمان)</label>
    <textarea id="treat" bind:value={treatment} placeholder="Medications..." style="width:100%; padding:12px; border-radius:10px; border:1px solid #ccc; height:100px; background: white; color: black;"></textarea>
    
    <button onclick={addRecord} disabled={isSaving} class="btn-save">
     {isSaving ? 'Saving...' : '💾 Save Record'}
    </button>
   </div>

   <!-- History (Right) -->
   <div class="history-list">
    <h3>📜 Medical History ({records.length})</h3>
    {#each records as record (record.id)}
     <div class="record-item card">
      <div class="item-header">
       <span class="date">📅 {formatTime(record.created_at)}</span>
       <!-- دوگمێ ژێبرنێ لێرەیە -->
       <button class="btn-delete" onclick={() => deleteRecord(record.id)} title="Delete Record">🗑️</button>
      </div>
      <h4>{record.diagnosis}</h4>
      <p><b>Rx:</b> {record.treatment}</p>
      {#if record.notes}<p class="note"><i>Note: {record.notes}</i></p>{/if}
     </div>
    {:else}
     <div class="empty">No history found. Records you save will stay here forever.</div>
    {/each}
   </div>
  </div>
 </div>
{/if}

<style>
 .profile-layout { max-width: 1200px; margin: 0 auto; color: var(--text); padding: 10px; }
 .card { background: var(--card, white); padding: 25px; border-radius: 15px; border: 1px solid var(--border, #ddd); margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
 .header-box { display: flex; justify-content: space-between; align-items: center; border-left: 6px solid #4f46e5; }
 .main-grid { display: grid; grid-template-columns: 450px 1fr; gap: 20px; }
 @media (max-width: 1000px) { .main-grid { grid-template-columns: 1fr; } }
 
 label { display: block; font-weight: bold; margin-bottom: 5px; font-size: 0.85rem; }
 .btn-save { width: 100%; padding: 15px; background: #4f46e5; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; }
 .btn-back { text-decoration: none; background: #f3f4f6; color: #333; padding: 10px 15px; border-radius: 8px; font-weight: bold; }

 .record-item { border-left: 5px solid #10b981; margin-bottom: 15px; transition: 0.2s; }
 .item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
 .date { font-size: 0.8rem; font-weight: bold; color: #10b981; }
 
 .btn-delete { background: #fee2e2; color: #ef4444; border: none; padding: 5px 8px; border-radius: 6px; cursor: pointer; font-size: 0.9rem; transition: 0.2s; }
 .btn-delete:hover { background: #fecaca; transform: scale(1.1); }

 h4 { margin: 0 0 10px 0; color: inherit; }
 .note { opacity: 0.7; font-size: 0.85rem; margin-top: 10px; border-top: 1px dashed #ddd; padding-top: 10px; }
 .empty { text-align: center; padding: 50px; border: 2px dashed #ddd; border-radius: 15px; opacity: 0.5; }
</style>
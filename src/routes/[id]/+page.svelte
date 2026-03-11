<script lang="ts">
 import { page } from '$app/state';
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 let patientId = page.params.id;
 let doctorId = $state(0);
 let patientInfo = $state<any>(null);
 let records = $state<any[]>([]);
 
 // گۆڕاوێن فۆرما نوی
 let diagnosis = $state(''), treatment = $state(''), notes = $state('');
 let isSaving = $state(false);

 async function loadData() {
  doctorId = Number(localStorage.getItem('doctor_id'));
  
  // ١. ئینانا زانیاریێن نەخۆشی
  const { data: p } = await supabase.from('patients').select('*').eq('id', patientId).single();
  patientInfo = p;

  // ٢. ئینانا تاریخا پزیشکی (Records)
  const { data: r } = await supabase.from('medical_records')
   .select('*')
   .eq('patient_id', patientId)
   .order('created_at', { ascending: false });
  if (r) records = r;
 }

 onMount(loadData);

 async function addRecord() {
  if (!diagnosis) return alert("Please enter a diagnosis");
  isSaving = true;
  const { error } = await supabase.from('medical_records').insert([{
   patient_id: patientId,
   doctor_id: doctorId,
   diagnosis,
   treatment,
   notes
  }]);
  
  if (!error) {
   diagnosis = ''; treatment = ''; notes = '';
   await loadData();
  }
  isSaving = false;
 }
</script>

{#if patientInfo}
 <div class="profile-header">
  <h1>👤 {patientInfo.name}</h1>
  <div class="badges">
   <span class="badge">Age: {patientInfo.age}</span>
   <span class="badge">Gender: {patientInfo.gender}</span>
   <span class="badge">Phone: {patientInfo.phone}</span>
  </div>
 </div>

 <div class="grid">
  <!-- بەشێ نڤیسینا ڕاپۆرتا نوی -->
  <div class="card add-record">
   <h3>📝 New Consultation</h3>
   <!-- svelte-ignore a11y_label_has_associated_control -->
   <label>Diagnosis (نەخۆشی)</label>
   <input bind:value={diagnosis} placeholder="e.g. Hypertension" />
   
   <!-- svelte-ignore a11y_label_has_associated_control -->
   <label>Treatment & Prescriptions (دەرمان)</label>
   <textarea bind:value={treatment} placeholder="List of medications..."></textarea>
   
   <!-- svelte-ignore a11y_label_has_associated_control -->
   <label>Doctor's Notes</label>
   <textarea bind:value={notes} placeholder="Additional observations..."></textarea>
   
   <button onclick={addRecord} disabled={isSaving}>
    {isSaving ? 'Saving...' : '💾 Save Record'}
   </button>
  </div>

  <!-- بەشێ تاریخا پزیشکی (Timeline) -->
  <div class="history">
   <h3>📜 Medical History</h3>
   {#each records as record}
    <div class="timeline-item">
     <div class="date">{new Date(record.created_at).toLocaleDateString()}</div>
     <div class="content">
      <h4>Diagnosis: {record.diagnosis}</h4>
      <p><b>Treatment:</b> {record.treatment}</p>
      {#if record.notes}<p class="note"><i>Note: {record.notes}</i></p>{/if}
     </div>
    </div>
   {:else}
    <p>No history found for this patient.</p>
   {/each}
  </div>
 </div>
{/if}

<style>
 .profile-header { margin-bottom: 30px; border-bottom: 2px solid var(--border); padding-bottom: 20px; }
 .badges { display: flex; gap: 10px; margin-top: 10px; }
 .badge { background: #e0e7ff; color: #4338ca; padding: 5px 12px; border-radius: 20px; font-weight: bold; font-size: 0.8rem; }
 
 .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
 @media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }

 .card { background: var(--card, white); padding: 25px; border-radius: 15px; border: 1px solid var(--border); box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
 label { display: block; margin: 15px 0 5px; font-weight: bold; font-size: 0.9rem; }
 input, textarea { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #ccc; background: white; color: black; font-family: inherit; }
 textarea { height: 100px; resize: none; }
 button { width: 100%; margin-top: 20px; padding: 12px; background: #4f46e5; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; }

 .timeline-item { position: relative; padding-left: 20px; border-left: 3px solid #6366f1; margin-bottom: 25px; }
 .timeline-item .date { font-size: 0.8rem; color: #6366f1; font-weight: bold; margin-bottom: 5px; }
 .timeline-item h4 { margin: 0 0 10px; color: var(--text); }
 .timeline-item p { margin: 5px 0; font-size: 0.9rem; }.note { color: #666; font-size: 0.85rem; }
</style>
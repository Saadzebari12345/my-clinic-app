<script lang="ts">
 import { page } from '$app/state';
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 // پێناسەکردنی جۆری داتاکان بۆ ئەوەی هێڵی سوور نەمێنێت
 interface Patient { name: string; age: number; phone: string; gender: string; }
 interface MedicalRecord { id: number; diagnosis: string; treatment: string; notes: string; created_at: string; }

 let patientId = page.params.id;
 let doctorId = $state(0);
 let patientInfo = $state<Patient | null>(null);
 let records = $state<MedicalRecord[]>([]);
 
 let diagnosis = $state(''), treatment = $state(''), notes = $state('');
 let isSaving = $state(false);

 async function loadData() {
  const storedId = localStorage.getItem('doctor_id');
  if (storedId) doctorId = Number(storedId);

  // وەرگرتنی زانیاری نەخۆش
  const { data: p } = await supabase.from('patients').select('*').eq('id', patientId).single();
  if (p) patientInfo = p;

  // وەرگرتنی مێژووی پزیشکی
  const { data: r } = await supabase.from('medical_records')
   .select('*')
   .eq('patient_id', patientId)
   .order('created_at', { ascending: false });
  
  if (r) records = r;
 }

 onMount(loadData);

 async function addRecord() {
  if (!diagnosis || !treatment) return alert("تکایە خانەکان پڕ بکەرەوە");
  
  isSaving = true;
  const { error } = await supabase.from('medical_records').insert([{
   patient_id: Number(patientId),
   doctor_id: doctorId,
   diagnosis,
   treatment,
   notes
  }]);
  
  if (!error) {
   diagnosis = ''; treatment = ''; notes = '';
   await loadData(); // بۆ ئەوەی ڕاستەوخۆ دیار بێت لە لای ڕاست
  } else {
   alert("Error: " + error.message);
  }
  isSaving = false;
 }
</script>

{#if patientInfo}
 <div style="max-width: 1200px; margin: 0 auto; color: var(--text);">
  <header style="background: var(--card); padding: 20px; border-radius: 15px; border: 1px solid var(--border); margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
   <div>
    <h1>👤 {patientInfo.name}</h1>
    <p style="opacity: 0.8;">Age: {patientInfo.age} | Phone: {patientInfo.phone}</p>
   </div>
   <a href="/patients" style="text-decoration: none; background: #eee; padding: 10px 20px; border-radius: 8px; color: #333; font-weight: bold;">⬅ Back</a>
  </header>

  <div style="display: grid; grid-template-columns: 450px 1fr; gap: 20px;">
   <!-- لای چەپ: فۆرمەکە -->
   <div style="background: var(--card); padding: 25px; border-radius: 15px; border: 1px solid var(--border);">
    <h3>📝 New Consultation</h3>
    
    <div style="margin-bottom: 15px;">
     <label for="diag" style="display:block; font-weight:bold; margin-bottom:5px;">Diagnosis</label>
     <input id="diag" bind:value={diagnosis} style="width:100%; padding:10px; border-radius:8px; border:1px solid #ccc; background: white; color: black;" />
    </div>

    <div style="margin-bottom: 15px;">
     <label for="treat" style="display:block; font-weight:bold; margin-bottom:5px;">Treatment</label>
     <textarea id="treat" bind:value={treatment} style="width:100%; padding:10px; border-radius:8px; border:1px solid #ccc; height: 100px; background: white; color: black;"></textarea>
    </div>

    <div style="margin-bottom: 15px;">
     <label for="note" style="display:block; font-weight:bold; margin-bottom:5px;">Notes</label>
     <textarea id="note" bind:value={notes} style="width:100%; padding:10px; border-radius:8px; border:1px solid #ccc; height: 60px; background: white; color: black;"></textarea>
    </div>

    <!-- لێرەدا کێشەی دوگمەکە چارەسەر کراوە -->
    <button onclick={addRecord} disabled={isSaving} style="width: 100%; padding: 12px; background: #4f46e5; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: bold;">
     {isSaving ? 'Saving...' : '💾 Save Record'}
    </button>
   </div>

   <!-- لای ڕاست: مێژووەکە -->
   <div>
    <h3 style="margin-top: 0;">📜 Medical History</h3>
    {#each records as record (record.id)}<div style="background: var(--card); padding: 20px; border-radius: 12px; border: 1px solid var(--border); border-left: 5px solid #10b981; margin-bottom: 15px;">
      <p style="font-size: 0.8rem; font-weight: bold; color: #10b981;">📅 {new Date(record.created_at).toLocaleDateString()}</p>
      <h4 style="margin: 10px 0;">{record.diagnosis}</h4>
      <p style="font-size: 0.9rem;"><b>Rx:</b> {record.treatment}</p>
      {#if record.notes}<p style="margin-top: 10px; font-size: 0.8rem; opacity: 0.7;"><i>{record.notes}</i></p>{/if}
     </div>
    {:else}
     <div style="text-align: center; padding: 40px; border: 2px dashed var(--border); border-radius: 15px; opacity: 0.5;">No history found.</div>
    {/each}
   </div>
  </div>
 </div>
{:else}
 <div style="text-align: center; padding: 50px;">Loading patient info...</div>
{/if}
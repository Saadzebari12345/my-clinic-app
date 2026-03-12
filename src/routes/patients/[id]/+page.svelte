<script lang="ts">
 import { page } from '$app/state';
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 interface Patient { id: number; name: string; age: number; phone: string; gender: string; }
 interface MedicalRecord { id: number; diagnosis: string; treatment: string; notes: string; created_at: string; }

 // وەرگرتنا ئایدییا نەخۆشی ژ لینکی
 let patientId = $derived(page.params.id); 
 
 let doctorId = $state(0);
 let patientInfo = $state<Patient | null>(null);
 let records = $state<MedicalRecord[]>([]);
 
 let diagnosis = $state(''), treatment = $state(''), notes = $state('');
 let isSaving = $state(false);

 async function loadAllData() {
  // ١. وەرگرتنا ئایدییا دکتۆری
  const storedId = localStorage.getItem('doctor_id');
  if (storedId) doctorId = Number(storedId);

  if (!patientId) return;

  // ٢. ئینانا زانیاریێن نەخۆشی
  const { data: p } = await supabase.from('patients').select('*').eq('id', patientId).single();
  if (p) patientInfo = p;

  // ٣. ئینانا مێژوویا پزیشکی (فلتەرکردن ب تنێ ب ئایدییا نەخۆشی)
  // مە لێرە doctor_id لادان دا تو پشتڕاست ببی کو داتایان دبینیت
  const { data: r, error } = await supabase
   .from('medical_records')
   .select('*')
   .eq('patient_id', patientId) 
   .order('created_at', { ascending: false });
  
  if (r) {
   records = r;
   console.log("Records found:", r);
  }
  if (error) console.error("Error:", error.message);
 }

 onMount(loadAllData);

 async function addRecord() {
  if (!diagnosis || !treatment) return alert("تکایە خانەیان پڕ بکە");
  
  isSaving = true;
  const { data, error } = await supabase.from('medical_records').insert([{
   patient_id: Number(patientId),
   doctor_id: doctorId,
   diagnosis,
   treatment,
   notes
  }]).select();
  
  if (!error && data) {
   records = [data[0], ...records];
   diagnosis = ''; treatment = ''; notes = '';
  } else {
   alert("Error: " + error?.message);
  }
  isSaving = false;
 }
</script>

{#if patientInfo}
 <div style="max-width: 1200px; margin: 0 auto; color: var(--text); padding: 10px;">
  <header style="background: var(--card); padding: 20px; border-radius: 15px; border: 1px solid var(--border); margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; border-left: 6px solid #4f46e5;">
   <div>
    <h1 style="margin:0;">👤 {patientInfo.name}</h1>
    <p style="margin:5px 0 0 0; opacity: 0.8;">Age: {patientInfo.age} | Phone: {patientInfo.phone} | ID: {patientId}</p>
   </div>
   <a href="/patients" style="text-decoration: none; background: #eee; padding: 10px 20px; border-radius: 8px; color: #333; font-weight: bold;">⬅ Back to List</a>
  </header>

  <div style="display: grid; grid-template-columns: 450px 1fr; gap: 20px;">
   <div style="background: var(--card); padding: 25px; border-radius: 15px; border: 1px solid var(--border);">
    <h3>📝 New Consultation</h3>
    <!-- svelte-ignore a11y_label_has_associated_control -->
    <label style="display:block; margin-bottom:5px; font-weight:bold;">Diagnosis</label>
    <input bind:value={diagnosis} style="width:100%; padding:10px; border-radius:8px; border:1px solid #ccc; margin-bottom:15px; background: white; color: black;" />
    
    <!-- svelte-ignore a11y_label_has_associated_control -->
    <label style="display:block; margin-bottom:5px; font-weight:bold;">Treatment</label>
    <textarea bind:value={treatment} style="width:100%; padding:10px; border-radius:8px; border:1px solid #ccc; height:100px; background: white; color: black;"></textarea>
    
    <button onclick={addRecord} disabled={isSaving} style="width: 100%; margin-top: 20px; padding: 15px; background: #4f46e5; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: bold;">
     {isSaving ? 'Saving...' : '💾 Save Record'}
    </button>
   </div>

   <div>
    <h3 style="margin-top:0;">📜 Medical History ({records.length})</h3>
    {#each records as record}
     <div style="background: var(--card); padding: 20px; border-radius: 12px; border: 1px solid var(--border); border-left: 5px solid #10b981; margin-bottom: 15px;">
      <div style="font-size: 0.8rem; font-weight: bold; color: #10b981; margin-bottom: 5px;">📅 {new Date(record.created_at).toLocaleDateString()}</div>
      <h4 style="margin:0 0 10px 0;">{record.diagnosis}</h4>
      <p style="margin:0; font-size: 0.9rem;"><b>Rx:</b> {record.treatment}</p>
     </div>
    {:else}
     <div style="text-align: center; padding: 40px; border: 2px dashed var(--border); border-radius: 15px; opacity: 0.5;">No history found for this patient.</div>
    {/each}
   </div>
  </div>
 </div>
{/if}
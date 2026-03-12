<script lang="ts">
 import { page } from '$app/state';
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 interface Patient { id: number; name: string; age: number; phone: string; gender: string; }
 interface MedicalRecord { id: number; diagnosis: string; treatment: string; notes: string; created_at: string; }

 // وەرگرتنا ئایدییا نەخۆشی ب ڕێکا Number()
 let patientId = $derived(Number(page.params.id)); 
 let doctorId = $state(0);
 let patientInfo = $state<Patient | null>(null);
 let records = $state<MedicalRecord[]>([]);
 
 let diagnosis = $state(''), treatment = $state(''), notes = $state('');
 let isSaving = $state(false);

 // ١. فانکشنا هێنانەڤەیا داتایان ژ داتابەیسێ
 async function loadData() {
  const storedId = localStorage.getItem('doctor_id');
  if (storedId) doctorId = Number(storedId);

  if (!patientId) return;

  // ئینانا زانیاریێن نەخۆشی
  const { data: p } = await supabase.from('patients').select('*').eq('id', patientId).single();
  if (p) patientInfo = p;

  // ئینانا مێژوویا پزیشکی (ئەڤە داتایێن تە دپارێزیت)
  const { data: r, error } = await supabase
   .from('medical_records')
   .select('*')
   .eq('patient_id', patientId) 
   .order('created_at', { ascending: false });
  
  if (!error && r) records = r;
 }

 onMount(loadData);

 // ٢. فانکشنا سەیڤکرنێ
 async function addRecord() {
  if (!diagnosis || !treatment) return alert("تکایە خانەیان پڕ بکە");
  isSaving = true;

  const { data, error } = await supabase.from('medical_records').insert([{
   patient_id: patientId,
   doctor_id: doctorId,
   diagnosis,
   treatment,
   notes
  }]).select(); // select() دا ئێکسەر داتایا نوی بزڤڕیتە سەر شاشێ
  
  if (!error && data) {
   diagnosis = ''; treatment = ''; notes = '';
   records = [data[0], ...records]; // زێدەکرنا ب لەز
   alert("✅ پیزانین ب سەرکەفتی هاتنە پاراستن!");
  } else {
   alert("Error: " + error?.message);
  }
  isSaving = false;
 }
</script>

{#if patientInfo}
 <div style="max-width: 1200px; margin: 0 auto; color: var(--text); padding: 10px;">
  <header style="background: var(--card, white); padding: 20px; border-radius: 15px; border: 1px solid var(--border, #ddd); margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; border-left: 6px solid #4f46e5;">
   <div>
    <h1 style="margin:0;">👤 {patientInfo.name}</h1>
    <p style="margin:5px 0 0 0; opacity: 0.8;">Age: {patientInfo.age} | Phone: {patientInfo.phone}</p>
   </div>
   <a href="/patients" style="text-decoration: none; background: #f3f4f6; color: #333; padding: 10px 20px; border-radius: 8px; font-weight: bold;">⬅ Back</a>
  </header>

  <div style="display: grid; grid-template-columns: 450px 1fr; gap: 25px;">
   <!-- Form (Left) -->
   <div style="background: var(--card, white); padding: 25px; border-radius: 15px; border: 1px solid var(--border, #ddd);">
    <h3>📝 New Consultation</h3>
    <!-- svelte-ignore a11y_label_has_associated_control -->
    <label style="display:block; margin:15px 0 5px; font-weight:bold;">Diagnosis</label>
    <input bind:value={diagnosis} placeholder="Condition..." style="width:100%; padding:12px; border-radius:8px; border:1px solid #ccc; background: white; color: black;" />
    
    <!-- svelte-ignore a11y_label_has_associated_control -->
    <label style="display:block; margin:15px 0 5px; font-weight:bold;">Treatment</label>
    <textarea bind:value={treatment} placeholder="Medications..." style="width:100%; padding:12px; border-radius:8px; border:1px solid #ccc; height:100px; background: white; color: black;"></textarea>
    
    <button onclick={addRecord} disabled={isSaving} style="width:100%; margin-top:20px; padding:15px; background:#4f46e5; color:white; border:none; border-radius:10px; cursor:pointer; font-weight:bold;">
     {isSaving ? 'Saving...' : '💾 Save Record'}
    </button>
   </div>

   <!-- History (Right) -->
   <div>
    <h3 style="margin-top:0;">📜 Medical History ({records.length})</h3>
    {#each records as record (record.id)}
     <div style="background: var(--card, white); padding: 20px; border-radius: 12px; border: 1px solid var(--border, #ddd); border-left: 5px solid #10b981; margin-bottom: 15px;"><div style="font-size: 0.8rem; font-weight: bold; color: #10b981; margin-bottom: 8px;">
       📅 {new Date(record.created_at).toLocaleString('en-GB')}
      </div>
      <h4 style="margin:0 0 10px 0;">{record.diagnosis}</h4>
      <p style="margin:0; font-size: 0.95rem;"><b>Rx:</b> {record.treatment}</p>
      {#if record.notes}<p style="margin-top:10px; font-size: 0.85rem; opacity: 0.7; border-top: 1px dashed #ddd; padding-top:10px;"><i>Note: {record.notes}</i></p>{/if}
     </div>
    {:else}
     <div style="text-align: center; padding: 50px; border: 2px dashed var(--border, #ddd); border-radius: 15px; opacity: 0.5;">No history found. Records saved will stay here forever.</div>
    {/each}
   </div>
  </div>
 </div>
{/if}
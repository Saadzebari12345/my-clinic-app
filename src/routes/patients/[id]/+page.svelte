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
 
 // گۆڕاوێن فۆرمێ
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
  if (!diagnosis || !treatment) return alert("تکایە خانەیێن (Diagnosis) و (Treatment) پڕ بکە");
  
  isSaving = true;
  const { data, error } = await supabase.from('medical_records').insert([{
   patient_id: patientId,
   doctor_id: doctorId,
   diagnosis: diagnosis,
   treatment: treatment,
   notes: notes // زێدەکرنا تێبینیان بۆ داتابەیسێ
  }]).select();
  
  if (!error && data) {
   diagnosis = ''; treatment = ''; notes = ''; // ڤالاکرنا فۆرمێ
   records = [data[0], ...records];
   alert("✅ ڕاپۆرت ب سەرکەفتی هاتە پاراستن!");
  }
  isSaving = false;
 }

 async function deleteRecord(id: number) {
  if (confirm('ئەرێ تو پشتراستی تو دڤێت ڤێ ڕاپۆرتێ ژێببەی؟')) {
   const { error } = await supabase.from('medical_records').delete().eq('id', id);
   if (!error) records = records.filter(r => r.id !== id);
  }
 }

 // فانکشنا کاتی (ڕێک دویڤ کاتێ کۆمپیوتەرێ تە دچیت)
 function formatLocalTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleString('en-GB', { 
   day: '2-digit', 
   month: '2-digit', 
   year: 'numeric', 
   hour: '2-digit', 
   minute: '2-digit',
   hour12: true 
  });
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
   <!-- فۆرما نڤیسینێ (لایێ چەپێ) -->
   <div class="card form-container">
    <h3>📝 New Consultation</h3>
    
    <div class="field">
     <label for="diag">Diagnosis (نەخۆشی)</label>
     <input id="diag" bind:value={diagnosis} placeholder="Enter condition name..." />
    </div>
    
    <div class="field">
     <label for="treat">Treatment (دەرمان)</label>
     <textarea id="treat" bind:value={treatment} placeholder="List medications and dosage..."></textarea>
    </div>

    <!-- بەشێ نوی یێ تێبینیان (Notes) -->
    <div class="field">
     <label for="note">Notes (تێبینیێن زێدە)</label>
     <textarea id="note" bind:value={notes} placeholder="Any other observations..." style="height: 70px;"></textarea>
    </div>
    
    <button onclick={addRecord} disabled={isSaving} class="btn-save">
     {isSaving ? 'Saving...' : '💾 Save Consultation'}
    </button>
   </div>

   <!-- مێژوویا پزیشکی (لایێ ڕاستێ) -->
   <div class="history-list">
    <h3>📜 Medical History ({records.length})</h3>
    {#each records as record (record.id)}
     <div class="record-item card">
      <div class="item-header">
       <!-- کات لێرە ڕێک دویڤ کۆمپیوتەرێ تە دهێت -->
       <span class="date">📅 {formatLocalTime(record.created_at)}</span>
       <button class="btn-delete" onclick={() => deleteRecord(record.id)}>🗑️</button>
      </div>
      <div class="record-content">
       <h4>Diagnosis: {record.diagnosis}</h4>
       <p class="rx-text"><b>Treatment (Rx):</b> {record.treatment}</p>
       {#if record.notes}
        <div class="note-box">
         <b>Note:</b> {record.notes}
        </div>
       {/if}
      </div>
     </div>
    {:else}
     <div class="empty">No history records found.</div>
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
 
 .field { margin-bottom: 15px; }
 label { display: block; font-weight: bold; margin-bottom: 5px; font-size: 0.85rem; }
 input, textarea { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #ccc; background: white; color: black; box-sizing: border-box; font-family: inherit; }
 textarea { height: 100px; resize: none; }
 
 .btn-save { width: 100%; padding: 15px; background: #4f46e5; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; font-size: 1rem; transition: 0.3s; }
 .btn-save:hover { background: #4338ca; }
 .btn-back { text-decoration: none; background: #f3f4f6; color: #333; padding: 10px 20px; border-radius: 8px; font-weight: bold; }

 .record-item { border-left: 5px solid #10b981; margin-bottom: 15px; padding: 20px; }
 .item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
 .date { font-size: 0.85rem; font-weight: bold; color: #10b981; }
 
 .btn-delete { background: #fee2e2; color: #ef4444; border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 0.9rem; }
 
 .record-content h4 { margin: 0 0 10px 0; font-size: 1.15rem; color: inherit; }
 .rx-text { font-size: 0.95rem; line-height: 1.6; margin: 0; }
 
 .note-box { margin-top: 12px; padding: 10px; background: rgba(0,0,0,0.03); border-radius: 8px; font-size: 0.85rem; border-left: 3px solid #ccc; }

 .empty { text-align: center; padding: 50px; border: 2px dashed #ddd; border-radius: 15px; opacity: 0.5; }
</style>
<script lang="ts">
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 let templates = $state<any[]>([]);
 let title = $state(''), diag = $state(''), treat = $state('');
 let doctorId = $state(0);

 onMount(async () => {
  const id = localStorage.getItem('doctor_id');
  if (id) {
   doctorId = Number(id);
   fetchTemplates();
  }
 });

 async function fetchTemplates() {
  const { data } = await supabase.from('medical_templates').select('*').eq('doctor_id', doctorId);
  if (data) templates = data;
 }

 async function addTemplate() {
  if (!title || !diag) return alert("Please fill Title and Diagnosis");
  await supabase.from('medical_templates').insert([{
   doctor_id: doctorId, title, diagnosis: diag, treatment: treat
  }]);
  title = ''; diag = ''; treat = '';
  fetchTemplates();
 }

 async function deleteTemplate(id: number) {
  await supabase.from('medical_templates').delete().eq('id', id);
  fetchTemplates();
 }
</script>

<div style="padding: 20px; color: var(--text);">
 <h2>📝 Medical Templates (Smart Prescribing)</h2>
 <p style="opacity: 0.7; font-size: 0.8rem; margin-bottom: 20px;">Create templates for common diseases to save time.</p>

 <div style="background:var(--card, white); padding:25px; border-radius:15px; border:1px solid var(--border); margin-bottom:30px; display:grid; gap:15px;">
  <input bind:value={title} placeholder="Template Title (e.g. Common Flu)" style="padding:12px; border-radius:8px; border:1px solid #ccc;"/>
  <input bind:value={diag} placeholder="Ready Diagnosis" style="padding:12px; border-radius:8px; border:1px solid #ccc;"/>
  <textarea bind:value={treat} placeholder="Ready Treatment List" style="padding:12px; border-radius:8px; border:1px solid #ccc; height:80px;"></textarea>
  <button onclick={addTemplate} style="background:#4f46e5; color:white; border:none; padding:12px; border-radius:8px; cursor:pointer; font-weight:bold;">+ Save Template</button>
 </div>

 <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap:15px;">
  {#each templates as t}
   <div style="background:var(--card); padding:15px; border-radius:12px; border:1px solid var(--border); position:relative;">
    <button onclick={() => deleteTemplate(t.id)} style="position:absolute; top:10px; right:10px; background:none; border:none; color:red; cursor:pointer;">🗑️</button>
    <b style="color:#4f46e5;">{t.title}</b>
    <p style="font-size:0.8rem; margin:10px 0;">{t.diagnosis}</p>
   </div>
  {/each}
 </div>
</div>
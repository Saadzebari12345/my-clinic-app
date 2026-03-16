<script lang="ts">
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 let templates = $state<any[]>([]);
 let title = $state(''), diag = $state(''), treat = $state('');
 let doctorId = $state(0);
 let isSaving = $state(false);

 async function fetchTemplates() {
  if (!doctorId) return;
  const { data, error } = await supabase
   .from('medical_templates')
   .select('*')
   .eq('doctor_id', doctorId)
   .order('id', { ascending: false });
  
  if (error) console.error("Error fetching templates:", error.message);
  if (data) templates = data;
 }

 onMount(async () => {
  const id = localStorage.getItem('doctor_id');
  if (id) {
   doctorId = Number(id);
   await fetchTemplates();
  }
 });

 async function addTemplate() {
  if (!title || !diag) return alert("تکایە ناڤێ قاڵبی و دەستنیشانکرنێ بنڤیسە");
  
  isSaving = true;
  const { data, error } = await supabase.from('medical_templates').insert([{
   doctor_id: doctorId,
   title: title,
   diagnosis: diag,
   treatment: treat
  }]).select(); // .select() دێ داتایا نوی ئێکسەر زڤڕینیت

  if (!error && data) {
   templates = [data[0], ...templates]; // زێدەکرنا ئێکسەر بۆ سەر شاشێ
   title = ''; diag = ''; treat = '';
   alert("✅ قاڵب ب سەرکەفتی هاتە سەیڤکرن");
  } else if (error) {
   // ئەگەر خەلەتی هەبیت دێ لێرە ب تە بێژیت (بۆ نموونە کێشا RLS)
   alert("خەلەتی ل داتابەیسێ: " + error.message);
  }
  isSaving = false;
 }

 async function deleteTemplate(id: number) {
  if (confirm('ئەرێ تو پشتراستی؟')) {
   const { error } = await supabase.from('medical_templates').delete().eq('id', id);
   if (!error) templates = templates.filter(t => t.id !== id);
  }
 }
</script>

<div class="templates-page">
 <h2>📝 Manage Medical Templates</h2>

 <div class="card form-container">
  <h3>➕ Create New Template</h3>
  <div class="field">
   <!-- svelte-ignore a11y_label_has_associated_control -->
   <label>Template Name</label>
   <input bind:value={title} placeholder="e.g. Common Cold" />
  </div>
  <div class="field">
   <!-- svelte-ignore a11y_label_has_associated_control -->
   <label>Default Diagnosis</label>
   <input bind:value={diag} placeholder="Diagnosis details..." />
  </div>
  <div class="field">
   <label>Default Treatment</label>
   <textarea bind:value={treat} placeholder="List medications..."></textarea>
  </div>
  <button class="save-btn" onclick={addTemplate} disabled={isSaving}>
   {isSaving ? 'Saving...' : '💾 Save Template'}
  </button>
 </div>

 <div class="grid">
  {#each templates as t (t.id)}
   <div class="template-card card">
    <button class="del" onclick={() => deleteTemplate(t.id)}>🗑️</button>
    <b>{t.title}</b>
    <p>{t.diagnosis}</p>
   </div>
  {/each}
 </div>
</div>

<style>
 /* دیزاینێ پڕۆفیشناڵ */
 .templates-page { max-width: 900px; margin: 0 auto; color: var(--text); padding: 10px; }
 .card { background: var(--card, white); padding: 25px; border-radius: 15px; border: 1px solid var(--border, #ddd); margin-bottom: 25px; }
 .field { margin-bottom: 12px; }
 label { display: block; font-size: 0.8rem; font-weight: bold; margin-bottom: 5px; }
 input, textarea { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #ccc; background: white; color: black; box-sizing: border-box; }
 textarea { height: 80px; resize: none; }
 .save-btn { width: 100%; padding: 14px; background: #4f46e5; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; }
 
 .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
 .template-card { position: relative; border-left: 5px solid #4f46e5; }
 .del { position: absolute; top: 10px; right: 10px; background: none; border: none; color: red; cursor: pointer; }
</style>
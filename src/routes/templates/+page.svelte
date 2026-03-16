<script lang="ts">
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 interface Template {
  id: number;
  title: string;
  diagnosis: string;
  treatment: string;
  instructions: string; // پشکا نوو بۆ ڕێنمایان
 }

 let templates = $state<Template[]>([]);
 let doctorId = $state(0);
 
 // گۆڕاوێن فۆرمێ
 let title = $state(''), diag = $state(''), treat = $state(''), instr = $state('');
 let isSaving = $state(false);
 let editingId = $state<number | null>(null);

 async function fetchTemplates() {
  if (!doctorId) return;
  const { data } = await supabase
   .from('medical_templates')
   .select('*')
   .eq('doctor_id', doctorId)
   .order('id', { ascending: false });
  if (data) templates = data;
 }

 onMount(async () => {
  const id = localStorage.getItem('doctor_id');
  if (id) {
   doctorId = Number(id);
   await fetchTemplates();
  }
 });

 // 💾 سەیڤکرن یان نووژەنکرن
 async function saveTemplate() {
  if (!title || !diag) return alert("تکایە ناڤێ قاڵبی و دەستنیشانکرنێ بنڤیسە");
  isSaving = true;

  const templateData = {
   doctor_id: doctorId,
   title: title,
   diagnosis: diag,
   treatment: treat,
   instructions: instr
  };

  if (editingId) {
   // Update - دەستکاری
   const { error } = await supabase.from('medical_templates').update(templateData).eq('id', editingId);
   if (!error) alert("✅ قاڵب هاتە نووژەنکرن");
  } else {
   // Insert - زێدەکرنا نوی
   const { error } = await supabase.from('medical_templates').insert([templateData]);
   if (!error) alert("✅ قاڵبێ نوی هاتە سەیڤکرن");
  }

  resetForm();
  await fetchTemplates();
  isSaving = false;
 }

 function startEdit(t: Template) {
  editingId = t.id;
  title = t.title;
  diag = t.diagnosis;
  treat = t.treatment;
  instr = t.instructions || '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
 }

 function resetForm() {
  editingId = null;
  title = ''; diag = ''; treat = ''; instr = '';
 }

 async function deleteTemplate(id: number) {
  if (confirm('ئەرێ تو پشتراستی؟')) {
   await supabase.from('medical_templates').delete().eq('id', id);
   await fetchTemplates();
  }
 }
</script>

<div class="templates-container">
 <div class="header">
  <h2>📝 Smart Medical Templates</h2>
  <p>Create shortcuts for common cases to prescribe in seconds.</p>
 </div>

 <!-- 🛠️ فۆڕما زێدەکرن و دەستکاریێ -->
 <div class="card form-box">
  <h3 style="margin-top: 0; color: #4f46e5;">
   {editingId ? '✏️ Edit Template' : '➕ Create New Template'}
  </h3>
  
  <div class="input-grid">
   <div class="field">
    <label for="title">Template Name (e.g. Throat Infection)</label>
    <input id="title" bind:value={title} placeholder="Title for your shortcut..." />
   </div>

   <div class="field">
    <label for="diag">Ready Diagnosis (دەستنیشانکرن)</label>
    <input id="diag" bind:value={diag} placeholder="Condition name..." />
   </div>

   <div class="field full">
    <label for="treat">Medication List (دەرمان)</label>
    <textarea id="treat" bind:value={treat} placeholder="Amoxicillin, Panadol, etc..."></textarea>
   </div>

   <div class="field full">
    <label for="instr">Patient Advice (ڕێنمایێن بۆ نەخۆشی)</label>
    <textarea id="instr" bind:value={instr} placeholder="Drink fluids, Rest for 3 days..."></textarea>
   </div>
  </div>

  <div class="actions">
   <button class="save-btn" onclick={saveTemplate} disabled={isSaving}>
    {isSaving ? 'Saving...' : (editingId ? '💾 Update Template' : '💾 Save Template')}
   </button>
   {#if editingId}
    <button class="cancel-btn" onclick={resetForm}>Cancel</button>
   {/if}
  </div>
 </div>

 <!-- 📋 لیستا قاڵبان -->
 <div class="list-grid">
  {#each templates as t (t.id)}
   <div class="template-card card">
    <div class="card-head">
     <span class="badge">TEMPLATE</span>
     <div class="btns">
      <button class="edit" onclick={() => startEdit(t)}>✏️</button>
      <button class="del" onclick={() => deleteTemplate(t.id)}>🗑️</button>
     </div>
    </div>
    <h4>{t.title}</h4>
    <p class="preview"><b>Diag:</b> {t.diagnosis}</p>
    <p class="preview"><b>Rx:</b> {t.treatment.substring(0, 40)}...</p>
   </div>
  {:else}
   <div class="empty">No templates yet. Create your first one above!</div>
  {/each}
 </div>
</div>

<style>
 .templates-container { max-width: 1100px; margin: 0 auto; padding: 10px; color: var(--text); }
 .header { margin-bottom: 30px; }
 .header h2 { margin: 0; color: #4f46e5; }
 
 .card { background: var(--card, white); padding: 25px; border-radius: 20px; border: 1px solid var(--border, #ddd); box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
 
 .input-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
 .full { grid-column: span 2; }
 
 label { display: block; font-size: 0.8rem; font-weight: bold; margin-bottom: 5px; opacity: 0.8; }
 input, textarea { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #ccc; background: white; color: black; box-sizing: border-box; font-family: inherit; }
 textarea { height: 80px; resize: none; }

 .actions { display: flex; gap: 10px; margin-top: 20px; }
 .save-btn { flex: 2; padding: 15px; background: #4f46e5; color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: bold; font-size: 1rem; }
 .cancel-btn { flex: 1; padding: 15px; background: #94a3b8; color: white; border: none; border-radius: 12px; cursor: pointer; }

 .list-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
 .template-card { border-left: 6px solid #4f46e5; transition: 0.3s; }
 .template-card:hover { transform: translateY(-5px); }
 
 .card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
 .badge { background: #e0e7ff; color: #4338ca; padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: bold; }
 
 .btns button { background: none; border: none; cursor: pointer; font-size: 1.1rem; padding: 5px; border-radius: 5px; }
 .btns .edit:hover { background: #e0f2fe; }
 .btns .del:hover { background: #fee2e2; }

 .preview { font-size: 0.85rem; margin: 5px 0; opacity: 0.7; }
 .empty { grid-column: 1/-1; text-align: center; padding: 50px; border: 2px dashed #ccc; border-radius: 20px; opacity: 0.5; }
</style>
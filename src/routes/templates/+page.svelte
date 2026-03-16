<script lang="ts">
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 interface Template {
  id: number;
  title: string;
  diagnosis: string;
  treatment: string;
 }

 let templates = $state<Template[]>([]);
 let title = $state(''), diag = $state(''), treat = $state('');
 let doctorId = $state(0);
 let isSaving = $state(false);
 let editingId = $state<number | null>(null); // بۆ زانینا كا كیش قاڵب دهێته‌ گۆهۆڕین

 async function fetchTemplates() {
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

 // 💾 سەیڤکرن یان نووژەنکرنا قاڵبی
 async function saveTemplate() {
  if (!title || !diag) return alert("تکایە ناونیشان و دەستنیشانکرنێ پڕ بکە");
  isSaving = true;

  const templateData = {
   doctor_id: doctorId,
   title: title,
   diagnosis: diag,
   treatment: treat
  };

  if (editingId) {
   // Update - دەستکاری کرنا قاڵبێ کۆن
   const { error } = await supabase
    .from('medical_templates')
    .update(templateData)
    .eq('id', editingId);
   if (!error) alert("✅ قاڵب ب سەرکەفتی هاتە نووژەنکرن");
  } else {
   // Insert - زێدەکرنا قاڵبەکێ نوی
   const { error } = await supabase
    .from('medical_templates')
    .insert([templateData]);
   if (!error) alert("✅ قاڵبێ نوی هاتە سەیڤکرن");
  }

  cancelEdit();
  await fetchTemplates();
  isSaving = false;
 }

 // ✏️ دەستپێکرنا دەستکاریێ
 function startEdit(t: Template) {
  editingId = t.id;
  title = t.title;
  diag = t.diagnosis;
  treat = t.treatment;
  window.scrollTo({ top: 0, behavior: 'smooth' }); // چوون بۆ سەرێ لاپەڕەی ب شێوەیەکێ نەرم
 }

 // ❌ هەڵوەشاندنەوەیا دەستکاریێ
 function cancelEdit() {
  editingId = null;
  title = ''; diag = ''; treat = '';
 }

 // 🗑️ ژێبرنا قاڵبی
 async function deleteTemplate(id: number) {
  if (confirm('ئەرێ تو پشتراستی تو دڤێت ڤی قاڵبی ژێببەی؟')) {
   await supabase.from('medical_templates').delete().eq('id', id);
   await fetchTemplates();
  }
 }
</script>

<div class="templates-page">
 <div class="header-section">
  <h2>📝 Manage Medical Templates</h2>
  <p>Create and edit ready-to-use prescriptions for common diseases.</p>
 </div>

 <!-- فۆڕما زێدەکرن و دەستکاریێ -->
 <div class="card form-container">
  <h3>{editingId ? '✏️ Edit Template' : '➕ Create New Template'}</h3>
  
  <div class="field">
   <label for="t-title">Template Name (e.g. Hypertension Plan)</label>
   <input id="t-title" bind:value={title} placeholder="Enter a title for this template..." />
  </div>

  <div class="field">
   <label for="t-diag">Default Diagnosis (دەستنیشانکرنا ئامادە)</label>
   <input id="t-diag" bind:value={diag} placeholder="e.g. Acute Tonsillitis" />
  </div>

  <div class="field">
   <label for="t-treat">Default Treatment List (لیستا دەرمانێن ئامادە)</label>
   <textarea id="t-treat" bind:value={treat} placeholder="Enter medications, dosage, and instructions..."></textarea>
  </div>

  <div class="button-group">
   <button class="save-btn" onclick={saveTemplate} disabled={isSaving}>
    {isSaving ? 'Saving...' : (editingId ? '💾 Update Template' : '💾 Save Template')}
   </button>
   
   {#if editingId}
    <button class="cancel-btn" onclick={cancelEdit}>Cancel</button>
   {/if}
  </div>
 </div>

 <!-- لیستا قاڵبێن هەین -->
 <div class="templates-grid">
  {#each templates as t (t.id)}
   <div class="template-card card">
    <div class="card-header">
     <span class="pill">Template</span>
     <div class="actions">
      <button class="edit-btn" onclick={() => startEdit(t)}>✏️</button>
      <button class="del-btn" onclick={() => deleteTemplate(t.id)}>🗑️</button>
     </div>
    </div>
    <h4>{t.title}</h4>
    <div class="preview">
     <b>Diagnosis:</b> {t.diagnosis} <br>
     <b>Meds:</b> {t.treatment.substring(0, 50)}...
    </div>
   </div>
  {:else}
   <div class="empty-state">
    <p>No templates found.Create your first medical template above! 🚀</p>
   </div>
  {/each}
 </div>
</div>

<style>
 .templates-page { max-width: 1000px; margin: 0 auto; color: var(--text); padding: 10px; }
 .header-section { margin-bottom: 30px; }
 .header-section h2 { margin: 0; color: #4f46e5; }
 .header-section p { opacity: 0.6; font-size: 0.9rem; margin-top: 5px; }

 .card { background: var(--card, white); padding: 25px; border-radius: 20px; border: 1px solid var(--border, #ddd); box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
 
 .form-container { margin-bottom: 40px; border-top: 5px solid #4f46e5; }
 .form-container h3 { margin-top: 0; margin-bottom: 20px; font-size: 1.2rem; }

 .field { margin-bottom: 15px; }
 label { display: block; font-size: 0.85rem; font-weight: bold; margin-bottom: 6px; }
 input, textarea { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #ccc; background: white !important; color: black !important; box-sizing: border-box; font-family: inherit; }
 textarea { height: 120px; resize: none; }

 .button-group { display: flex; gap: 10px; margin-top: 10px; }
 .save-btn { flex: 2; padding: 14px; background: #4f46e5; color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: bold; font-size: 1rem; transition: 0.3s; }
 .cancel-btn { flex: 1; padding: 14px; background: #94a3b8; color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: bold; }
 .save-btn:hover { background: #4338ca; }

 .templates-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
 .template-card { border-left: 5px solid #6366f1; transition: 0.3s; }
 .template-card:hover { transform: translateY(-5px); }
 
 .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
 .pill { background: #e0e7ff; color: #4338ca; padding: 3px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: bold; text-transform: uppercase; }
 
 .actions button { background: none; border: none; cursor: pointer; font-size: 1.1rem; padding: 5px; border-radius: 5px; transition: 0.2s; }
 .edit-btn:hover { background: #e0f2fe; }
 .del-btn:hover { background: #fee2e2; }

 .template-card h4 { margin: 0 0 10px 0; color: #1e293b; font-size: 1.1rem; }
 .preview { font-size: 0.85rem; color: #64748b; line-height: 1.5; }

 .empty-state { grid-column: 1 / -1; text-align: center; padding: 60px; border: 2px dashed #cbd5e1; border-radius: 20px; opacity: 0.6; }

 /* Dark Mode Fix */
 :global(.dark-mode) .template-card h4 { color: #f8fafc; }
</style>
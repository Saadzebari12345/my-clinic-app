<script lang="ts">
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 interface Patient { name: string; id: number; }
 interface Appointment { id: number; patient_name: string; date: string; status: string; doctor_id: number; }
 interface MedicalRecord { diagnosis: string; treatment: string; created_at: string; }

 let appointments = $state<Appointment[]>([]);
 let patients = $state<Patient[]>([]);
 let doctorId = $state(0);
 let searchTerm = $state('');
 let selectedPatient = $state(''), appDate = $state('');

 // بۆ مۆدێلێ تاریخێ (Quick View)
 let showHistory = $state(false);
 let historyRecords = $state<MedicalRecord[]>([]);
 let activePatientName = $state('');

 // کاتێ نوکە بۆ حسابکرنا Overdue
 let now = $state(new Date());

 let stats = $derived({
  done: appointments.filter(a => a.status === 'Done').length,
  waiting: appointments.filter(a => a.status === 'Pending' || a.status === 'Confirmed').length,
  overdue: appointments.filter(a => a.status !== 'Done' && new Date(a.date) < now).length
 });

 let filtered = $derived(appointments.filter(a => a.patient_name.toLowerCase().includes(searchTerm.toLowerCase())));

 async function fetchData() {
  if (!doctorId) return;
  const { data: p } = await supabase.from('patients').select('id, name').eq('doctor_id', doctorId);
  if (p) patients = p;
  const { data: a } = await supabase.from('appointments').select('*').eq('doctor_id', doctorId).order('date', { ascending: true });
  if (a) appointments = a;
 }

 onMount(() => {
  doctorId = Number(localStorage.getItem('doctor_id'));
  fetchData();
  const timer = setInterval(() => now = new Date(), 60000);
  return () => clearInterval(timer);
 });

 async function addApp() {
  if (!selectedPatient || !appDate) return;
  const { error } = await supabase.from('appointments').insert([{ 
   patient_name: selectedPatient, 
   date: appDate, 
   status: 'Pending', 
   doctor_id: doctorId 
  }]);
  if (!error) { fetchData(); selectedPatient = ''; appDate = ''; }
 }

 async function updateStatus(id: number, status: string) {
  await supabase.from('appointments').update({ status }).eq('id', id);
  fetchData();
 }

 // 🗑️ فانکشنا ژێبرنا ژڤانی (Delete Action)
 async function deleteApp(id: number) {
  if (confirm('ئەرێ تو پشتراستی تو دڤێت ڤی ژڤانی ژێببەی؟')) {
   const { error } = await supabase.from('appointments').delete().eq('id', id);
   if (!error) {
    appointments = appointments.filter(a => a.id !== id);
   }
  }
 }

 async function openQuickHistory(pName: string) {
  activePatientName = pName;
  const patient = patients.find(p => p.name === pName);
  if (!patient) return;
  
  const { data } = await supabase
   .from('medical_records')
   .select('diagnosis, treatment, created_at')
   .eq('patient_id', patient.id)
   .order('created_at', { ascending: false });
  
  if (data) {
   historyRecords = data;
   showHistory = true;
  }
 }

 function isOverdue(dateStr: string, status: string) {
  return status !== 'Done' && new Date(dateStr) < now;
 }
</script>

<div class="page">
 <div class="header">
  <h2>📅 Appointments Tracking</h2>
  <div class="stats">
   <span class="st done">✅ Done: {stats.done}</span>
   <span class="st wait">⏳ Waiting: {stats.waiting}</span>
   <span class="st alert">⚠️ Overdue: {stats.overdue}</span>
  </div>
 </div>

 <!-- فۆرما زێدەکرنێ -->
 <div class="card add-box">
  <select bind:value={selectedPatient}>
   <option value="">-- Select Patient --</option>
   {#each patients as p}<option value={p.name}>{p.name}</option>{/each}
  </select>
  <input type="datetime-local" bind:value={appDate} />
  <button class="btn-main" onclick={addApp}>Book Now</button>
 </div>

 <input bind:value={searchTerm} placeholder="🔍 Search patient by name..." class="search-bar" />

 <div class="table-container card">
  <table>
   <thead>
    <tr>
     <th>Patient Name (Click for History)</th>
     <th>Date & Time</th>
     <th>Status</th>
     <th style="text-align: center;">Actions</th>
    </tr>
   </thead>
   <tbody>
    {#each filtered as a (a.id)}
     <tr class={isOverdue(a.date, a.status) ? 'overdue-row' : ''}>
      <td>
       <button class="name-link" 
        style="color: {isOverdue(a.date, a.status) ? '#ef4444' : 'inherit'}"
        onclick={() => openQuickHistory(a.patient_name)}>
        {isOverdue(a.date, a.status) ? '🔴 ' : '👤 '} {a.patient_name}
       </button>
      </td>
      <td>{new Date(a.date).toLocaleString('en-GB', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}</td>
      <td><span class="badge {a.status}">{a.status}</span></td>
      <td class="actions">
       <button class="btn-c" onclick={() => updateStatus(a.id, 'Confirmed')} title="Confirm">🔵</button>
       <button class="btn-g" onclick={() => updateStatus(a.id, 'Done')} title="Mark as Done">✅</button>
       <!-- دوگمێ Delete لێرەیە -->
       <button class="btn-d" onclick={() => deleteApp(a.id)} title="Delete">🗑️</button>
      </td>
     </tr>
    {:else}
     <tr><td colspan="4" style="text-align: center; padding: 30px;">No appointments found.</td></tr>
    {/each}
   </tbody>
  </table>
 </div>
</div>

<!-- 📜 Quick History Modal -->
{#if showHistory}
 <!-- svelte-ignore a11y_no_static_element_interactions -->
 <!-- svelte-ignore a11y_click_events_have_key_events -->
 <div class="modal-overlay" onclick={() => showHistory = false}>
  <div class="modal-content" onclick={(e) => e.stopPropagation()}>
   <div class="modal-header">
    <h3>Medical History: {activePatientName}</h3>
    <button class="close-btn" onclick={() => showHistory = false}>✕</button>
   </div>
   <div class="modal-body">
    {#each historyRecords as rec}
     <div class="history-item">
      <small>📅 {new Date(rec.created_at).toLocaleDateString()}</small>
      <p><b>Diagnosis:</b> {rec.diagnosis}</p>
      <p><b>Treatment:</b> {rec.treatment}</p>
     </div>
    {:else}
     <p>No previous medical records found for this patient.</p>
    {/each}
   </div>
  </div>
 </div>
{/if}

<style>
 .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px; }
 .stats { display: flex; gap: 10px; }
 .st { padding: 8px 15px; border-radius: 12px; font-weight: bold; font-size: 0.8rem; }
 .done { background: #dcfce7; color: #166534; }
 .wait { background: #fef3c7; color: #92400e; }
 .alert { background: #fee2e2; color: #dc2626; border: 1px solid #ef4444; }

 .card { background: var(--card, white); padding: 20px; border-radius: 15px; border: 1px solid var(--border, #ddd); }
 .add-box { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
 select, input { flex: 1; padding: 10px; border-radius: 8px; border: 1px solid #ccc; background: white !important; color: black !important; }
 .btn-main { background: #4f46e5; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; }

 .search-bar { width: 100%; padding: 12px; border-radius: 12px; border: 1px solid #6366f1; margin-bottom: 15px; background: var(--card); color: inherit; outline: none; }

 table { width: 100%; border-collapse: collapse; }
 th, td { padding: 15px; text-align: left; border-bottom: 1px solid var(--border, #eee); }
 
 .name-link { background: none; border: none; font-weight: bold; cursor: pointer; padding: 0; text-decoration: underline; text-underline-offset: 4px; color: inherit; }
 .overdue-row { background: rgba(239, 68, 68, 0.05); }

 .badge { padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: bold; }
 .Pending { background: #fef3c7; color: #92400e; }
 .Confirmed { background: #e0f2fe; color: #0369a1; }
 .Done { background: #dcfce7; color: #166534; }

 .actions { display: flex; gap: 5px; justify-content: center; }
 .actions button { padding: 6px 10px; border: none; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: bold; transition: 0.2s; }
 .btn-c { background: #e0f2fe; color: #0369a1; }
 .btn-g { background: #dcfce7; color: #166534; }
 .btn-d { background: #fee2e2; color: #dc2626; }
 .actions button:hover { transform: scale(1.1); }

 /* Modal Style */
 .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 1000; }
 .modal-content { background: white; color: #333; width: 500px; max-width: 95%; border-radius: 20px; padding: 25px; box-shadow: 0 15px 40px rgba(0,0,0,0.3); }
 .modal-header { display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 15px; }
 .modal-body { max-height: 400px; overflow-y: auto; }
 .history-item { padding: 12px; border-bottom: 1px solid #f1f5f9; }
 .history-item h4 { margin: 5px 0; }
 .close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #999; }
</style>
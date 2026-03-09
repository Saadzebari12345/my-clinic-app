<script lang="ts">
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 // ١. پێناسەیا جۆرێ داتایان
 interface Patient { name: string; }
 interface Appointment {
  id: number;
  patient_name: string;
  date: string;
  status: string;
  doctor_id: number;
 }

 let patients = $state<Patient[]>([]);
 let appointments = $state<Appointment[]>([]);
 let searchTerm = $state(''); // بۆ بگەڕیانێ
 let selectedPatient = $state('');
 let appointmentDate = $state('');
 let doctorId = $state(0);

 // ٢. حسابکرنا ئاماران ب شێوەیەکێ داینامیکی (Stats)
 let pendingCount = $derived(appointments.filter(a => a.status === 'Pending').length);
 let doneCount = $derived(appointments.filter(a => a.status === 'Done').length);

 // ٣. فلتەرکرنا لیستا ژڤانان ل دویڤ گەڕیانێ
 let filteredApps = $derived(
  appointments.filter(a => a.patient_name.toLowerCase().includes(searchTerm.toLowerCase()))
 );

 onMount(async () => {
  // وەرگرتنا ئایدییا دکتۆری یێ چوونەژوورێ کری
  doctorId = Number(localStorage.getItem('doctor_id'));
  fetchData();
 });

 async function fetchData() {
  if (!doctorId) return;

  // ئینانا ناڤێن نەخۆشێن وی دکتۆری بتنێ
  const { data: pData } = await supabase
   .from('patients')
   .select('name')
   .eq('doctor_id', doctorId)
   .order('name');
  if (pData) patients = pData;

  // ئینانا ژڤانێن وی دکتۆری بتنێ ژ Supabase
  const { data: aData } = await supabase
   .from('appointments')
   .select('*')
   .eq('doctor_id', doctorId)
   .order('date', { ascending: true });
  if (aData) appointments = aData;
 }

 async function addAppointment() {
  if (selectedPatient && appointmentDate && doctorId) {
   const { error } = await supabase.from('appointments').insert([
    {
     patient_name: selectedPatient,
     date: appointmentDate,
     status: 'Pending',
     doctor_id: doctorId
    }
   ]);

   if (!error) {
    selectedPatient = '';
    appointmentDate = '';
    fetchData();
   }
  }
 }

 async function updateStatus(id: number, newStatus: string) {
  const { error } = await supabase
   .from('appointments')
   .update({ status: newStatus })
   .eq('id', id);
  if (!error) fetchData();
 }

 async function deleteApp(id: number) {
  if (confirm('ئەرێ تو پشتراستی تو دڤێت ڤی ژڤانی ژێببەی؟')) {
   const { error } = await supabase.from('appointments').delete().eq('id', id);
   if (!error) fetchData();
  }
 }
</script>

<div class="page-container">
 <div class="header-section">
  <h2>📅 Appointments Management</h2>
  <!-- ئامارێن سەرەکی -->
  <div class="stats-bar">
   <div class="stat-item pending">Waiting: <span>{pendingCount}</span></div>
   <div class="stat-item done">Completed: <span>{doneCount}</span></div>
  </div>
 </div>

 <!-- فۆرما زێدەکرنێ -->
 <div class="form-card">
  <div class="input-group">
   <label for="p-select">Select Patient</label>
   <select id="p-select" bind:value={selectedPatient}>
    <option value="">-- Choose Patient --</option>
    {#each patients as p}
     <option value={p.name}>{p.name}</option>
    {/each}
   </select>
  </div>

  <div class="input-group">
   <label for="d-time">Date & Time</label>
   <input id="d-time" type="datetime-local" bind:value={appointmentDate} />
  </div>

  <button onclick={addAppointment} class="btn-primary">Book Now</button>
 </div>

 <!-- خانەیا گەڕیانێ (Search) -->
 <div class="search-section">
  <input type="text" bind:value={searchTerm} placeholder="🔍 Search by patient name..." />
 </div>

 <!-- خشتەیێ ژڤانان -->
 <div class="table-wrapper">
  <table>
   <thead>
    <tr>
     <th>Patient Name</th>
     <th>Date & Time</th>
     <th>Status</th>
     <th>Actions</th>
    </tr>
   </thead>
   <tbody>
    {#each filteredApps as app}
     <tr class={app.status === 'Done' ? 'row-done' : ''}>
      <td class="patient-name">👤 {app.patient_name}</td>
      <td>{new Date(app.date).toLocaleString()}</td>
      <td>
       <span class="status-badge {app.status}">{app.status}</span>
      </td>
      <td class="actions">
       {#if app.status === 'Pending'}
        <button onclick={() => updateStatus(app.id, 'Done')} class="btn-confirm">✅ Done</button>
       {/if}
       <button onclick={() => deleteApp(app.id)} class="btn-delete">🗑️</button>
      </td>
     </tr>
    {:else}
     <tr><td colspan="4" class="empty">No appointments found.</td></tr>
    {/each}
   </tbody>
  </table>
 </div>
</div>

<style>
 /* دیزاینێ گشتی کو دگەل Dark Mode دگونجیت */
 .page-container { color: inherit; }
 
 .header-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px; }
 
 .stats-bar { display: flex; gap: 10px; }
 .stat-item { padding: 10px 20px; border-radius: 12px; font-weight: bold; font-size: 0.9rem; border: 1px solid rgba(0,0,0,0.1); }
 .pending { background: #fff7ed; color: #c2410c; }
 .done { background: #f0fdf4; color: #15803d; }

 .form-card { 
  background: var(--card, white); 
  padding: 20px; border-radius: 15px; border: 1px solid var(--border, #ddd);
  display: flex; gap: 15px; align-items: flex-end; margin-bottom: 20px; flex-wrap: wrap;
 }

 .input-group { flex: 1; min-width: 200px; }
 .input-group label { display: block; font-size: 0.8rem; margin-bottom: 5px; font-weight: bold; }
 
 input, select { 
  width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #ccc; 
  background: var(--card, white); color: inherit;
 }

 .search-section { margin-bottom: 15px; }
 .search-section input { width: 100%; border-radius: 25px; padding-left: 20px; border: 1px solid #6366f1; }

 .table-wrapper { background: var(--card, white); border-radius: 15px; border: 1px solid var(--border, #ddd); overflow: hidden; }
 table { width: 100%; border-collapse: collapse; }
 th, td { padding: 15px; text-align: left; border-bottom: 1px solid var(--border, #eee); }
 
 .status-badge { padding: 5px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: bold; }
 .status-badge.Pending { background: #fef3c7; color: #92400e; }
 .status-badge.Done { background: #dcfce7; color: #166534; }

 .btn-primary { background: #4f46e5; color: white; border: none; padding: 12px 25px; border-radius: 10px; cursor: pointer; font-weight: bold; }
 .btn-confirm { background: #10b981; color: white; border: none; padding: 6px 12px; border-radius: 8px; cursor: pointer; }
 .btn-delete { background: #fee2e2; color: #dc2626; border: none; padding: 6px 12px; border-radius: 8px; cursor: pointer; }

 .row-done { opacity: 0.6; background: #f9fafb; }

 /* Dark Mode Fixes */
 :global(.dark-mode) .form-card, :global(.dark-mode) .table-wrapper {
  --card: #1e293b; --border: #334155;
 }
 :global(.dark-mode) .row-done { background: #0f172a; }
</style>
<script lang="ts">
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 interface Appointment {
  id: number;
  patient_name: string;
  date: string;
  status: string;
  doctor_id: number;
 }

 let appointments = $state<Appointment[]>([]);
 let patients = $state<{ name: string }[]>([]);
 let searchTerm = $state('');
 let selectedPatient = $state('');
 let appointmentDate = $state('');
 let doctorId = $state(0);
 let now = $state(new Date());

 // ١. حسابکرنا ئاماران ب شێوەیەکێ داینامیکی
 let stats = $derived({
  done: appointments.filter(a => a.status === 'Done').length,
  waiting: appointments.filter(a => a.status === 'Pending' || a.status === 'Confirmed').length,
  overdue: appointments.filter(a => a.status !== 'Done' && new Date(a.date) < now).length
 });

 // ٢. فلتەرکرنا لیستا ژڤانان بۆ لێگەڕیانێ (Search)
 let filteredApps = $derived(
  appointments.filter(a => a.patient_name.toLowerCase().includes(searchTerm.toLowerCase()))
 );

 async function fetchData() {
  if (!doctorId) return;
  // ئینانا پاتێنتان
  const { data: pData } = await supabase.from('patients').select('name').eq('doctor_id', doctorId);
  if (pData) patients = pData;

  // ئینانا ژڤانان
  const { data: aData } = await supabase.from('appointments').select('*').eq('doctor_id', doctorId).order('date', { ascending: true });
  if (aData) appointments = aData;
 }

 onMount(() => {
  const storedId = localStorage.getItem('doctor_id');
  if (storedId) {
   doctorId = Number(storedId);
   fetchData();
  }
  // نووژەنکرنا دەمێ نوکە هەر خولەکەکێ دا Overdue درست بیت
  const interval = setInterval(() => now = new Date(), 60000);
  return () => clearInterval(interval);
 });

 async function addAppointment() {
  if (selectedPatient && appointmentDate && doctorId) {
   const { error } = await supabase.from('appointments').insert([
    { patient_name: selectedPatient, date: appointmentDate, status: 'Pending', doctor_id: doctorId }
   ]);
   if (!error) {
    selectedPatient = ''; appointmentDate = '';
    fetchData();
   }
  }
 }

 async function updateStatus(id: number, newStatus: string) {
  await supabase.from('appointments').update({ status: newStatus }).eq('id', id);
  fetchData();
 }

 async function deleteApp(id: number) {
  if (confirm('Are you sure?')) {
   await supabase.from('appointments').delete().eq('id', id);
   fetchData();
  }
 }

 // فانکشنەک بۆ پشکنینا کا ژڤان یێ دەربازبوویە (Overdue)
 function isOverdue(dateStr: string, status: string) {
  return status !== 'Done' && new Date(dateStr) < now;
 }
</script>

<div class="appointments-container">
 <div class="header-flex">
  <h2>📅 Appointments Tracking</h2>
  <div class="stats-grid">
   <div class="stat-box done">✅ Done: {stats.done}</div>
   <div class="stat-box waiting">⏳ Waiting: {stats.waiting}</div>
   <div class="stat-box overdue">⚠️ Overdue: {stats.overdue}</div>
  </div>
 </div>

 <!-- بەشێ زێدەکرنێ -->
 <div class="card add-card">
  <select bind:value={selectedPatient}>
   <option value="">-- Choose Patient --</option>
   {#each patients as p}
    <option value={p.name}>{p.name}</option>
   {/each}
  </select>
  <input type="datetime-local" bind:value={appointmentDate} />
  <button class="btn-add" onclick={addAppointment}>Book Now</button>
 </div>

 <!-- بەشێ لێگەڕیانێ (Search) -->
 <div class="search-box">
  <input bind:value={searchTerm} placeholder="🔍 Search by patient name..." />
 </div>

 <!-- خشتەیێ ژڤانان -->
 <div class="table-card">
  <table>
   <thead>
    <tr>
     <th>Patient Name</th>
     <th>Date & Time</th>
     <th>Status</th>
     <th style="text-align: center;">Actions</th>
    </tr>
   </thead>
   <tbody>
    {#each filteredApps as app}
     <tr class={isOverdue(app.date, app.status) ? 'overdue-row' : ''}>
      <td class="p-name" style="color: {isOverdue(app.date, app.status) ? '#ef4444' : 'inherit'}">
       {isOverdue(app.date, app.status) ? '🔴 ' : '👤 '} {app.patient_name}
      </td>
      <td>{new Date(app.date).toLocaleString()}</td>
      <td>
       <span class="badge {app.status}">{app.status}</span>
      </td>
      <td class="actions">
       <button class="btn-confirm" onclick={() => updateStatus(app.id, 'Confirmed')}>🔵 Confirm</button>
       <button class="btn-done" onclick={() => updateStatus(app.id, 'Done')}>✅ Done</button>
       <button class="btn-del" onclick={() => deleteApp(app.id)}>🗑️</button>
      </td>
     </tr>
    {:else}
     <tr><td colspan="4" style="text-align: center; padding: 30px;">No appointments found.</td></tr>
    {/each}
   </tbody>
  </table>
 </div>
</div>

<style>
 .header-flex { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; flex-wrap: wrap; gap: 15px; }
 .stats-grid { display: flex; gap: 10px; }
 .stat-box { padding: 10px 15px; border-radius: 10px; font-weight: bold; font-size: 0.85rem; border: 1px solid rgba(0,0,0,0.1); }
 .done { background: #dcfce7; color: #166534; }
 .waiting { background: #fef3c7; color: #92400e; }
 .overdue { background: #fee2e2; color: #dc2626; }

 .add-card { display: flex; gap: 10px; padding: 20px; background: var(--card, white); border-radius: 15px; border: 1px solid var(--border, #ddd); margin-bottom: 20px; flex-wrap: wrap; }
 .add-card select, .add-card input { flex: 1; padding: 10px; border-radius: 8px; border: 1px solid #ccc; background: var(--card, white); color: inherit; }
 .btn-add { background: #4f46e5; color: white; border: none; padding: 10px 25px; border-radius: 8px; cursor: pointer; font-weight: bold; }

 .search-box { margin-bottom: 15px; }
 .search-box input { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #4f46e5; background: var(--card, white); color: inherit; outline: none; }

 .table-card { background: var(--card, white); border-radius: 15px; border: 1px solid var(--border, #ddd); overflow: hidden; }
 table { width: 100%; border-collapse: collapse; }
 th, td { padding: 15px; text-align: left; border-bottom: 1px solid var(--border, #eee); }
 
 .overdue-row { background: rgba(239, 68, 68, 0.05); }
 .p-name { font-weight: bold; }

 .badge { padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: bold; }
 .badge.Pending { background: #fef3c7; color: #92400e; }
 .badge.Confirmed { background: #e0f2fe; color: #0369a1; }
 .badge.Done { background: #dcfce7; color: #166534; }

 .actions { display: flex; gap: 5px; justify-content: center; }
 .actions button { padding: 6px 10px; border: none; border-radius: 6px; cursor: pointer; font-size: 0.75rem; font-weight: bold; }
 .btn-confirm { background: #e0f2fe; color: #0369a1; }
 .btn-done { background: #10b981; color: white; }
 .btn-del { background: #fee2e2; color: #dc2626; }

 /* Dark Mode Fixes */
 :global(.dark-mode) .stat-box { border-color: #334155; }
 :global(.dark-mode) .overdue-row { background: rgba(239, 68, 68, 0.15); }
</style>
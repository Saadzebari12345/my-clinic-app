<script lang="ts">
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 interface Patient { name: string; gender: string; }
 interface Appointment {
  id: number;
  patient_name: string;
  gender: string;
  date: string;
  status: string;
  doctor_id: number;
 }

 let appointments = $state<Appointment[]>([]);
 let patients = $state<Patient[]>([]);
 let searchTerm = $state('');
 let selectedPatient = $state('');
 let appointmentDate = $state('');
 let doctorId = $state(0);
 let isLoading = $state(false);

 // ١. حسابکرنا ئاماران ب شێوەیەکێ داینامیکی
 let stats = $derived({
  done: appointments.filter(a => a.status === 'Done').length,
  waiting: appointments.filter(a => a.status === 'Pending' || a.status === 'Confirmed').length,
  overdue: appointments.filter(a => a.status !== 'Done' && new Date(a.date) < new Date()).length
 });

 // ٢. فلتەرکرنا لیستێ بۆ لێگەڕیانێ
 let filteredApps = $derived(
  appointments.filter(a => a.patient_name.toLowerCase().includes(searchTerm.toLowerCase()))
 );

 async function fetchData() {
  if (!doctorId) return;
  // ئینانا لیستا نەخۆشان دا کو ڕەگەزێ وان بزانی
  const { data: pData } = await supabase.from('patients').select('name, gender').eq('doctor_id', doctorId);
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
 });

 // ٣. فانکشنا زێدەکرنا ژڤانی (ڕاستکرنا کێشا Book Now)
 async function addAppointment() {
  if (selectedPatient && appointmentDate && doctorId) {
   isLoading = true;

   // دیتنا ڕەگەزێ نەخۆشێ هەلبژارتی
   const patientInfo = patients.find(p => p.name === selectedPatient);
   const patientGender = patientInfo ? patientInfo.gender : 'Unknown';

   const { data, error } = await supabase.from('appointments').insert([
    { 
     patient_name: selectedPatient, 
     gender: patientGender, 
     date: appointmentDate, 
     status: 'Pending', 
     doctor_id: doctorId 
    }
   ]).select();

   if (!error && data) {
    // زێدەکرنا ب لەز بۆ شاشێ
    appointments = [data[0], ...appointments];
    selectedPatient = ''; 
    appointmentDate = '';
   } else {
    alert("Error: " + error?.message);
   }
   isLoading = false;
  } else {
   alert("تکایە نەخۆشەکێ و کاتەکێ هەلبژێره");
  }
 }

 async function updateStatus(id: number, newStatus: string) {
  const { error } = await supabase.from('appointments').update({ status: newStatus }).eq('id', id);
  if (!error) {
   appointments = appointments.map(a => a.id === id ? { ...a, status: newStatus } : a);
  }
 }

 async function deleteApp(id: number) {
  if (confirm('Are you sure?')) {
   const { error } = await supabase.from('appointments').delete().eq('id', id);
   if (!error) appointments = appointments.filter(a => a.id !== id);
  }
 }
</script>

<div class="page-container">
 <div class="header-flex">
  <h2 style="color: var(--text);">📅 Appointments Tracking</h2>
  <div class="stats-grid">
   <div class="stat-box done">✅ Done: {stats.done}</div>
   <div class="stat-box waiting">⏳ Waiting: {stats.waiting}</div>
   <div class="stat-box overdue">⚠️ Overdue: {stats.overdue}</div>
  </div>
 </div>

 <!-- فۆرما زێدەکرنێ -->
 <div class="card add-card">
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
   <label for="a-date">Date & Time</label>
   <input id="a-date" type="datetime-local" bind:value={appointmentDate} />
  </div>
  <button class="btn-add" onclick={addAppointment} disabled={isLoading}>
   {isLoading ? '...' : 'Book Now'}
  </button>
 </div>

 <div class="search-box">
 <input bind:value={searchTerm} placeholder="🔍 Search patient name..." />
 </div>

 <div class="table-card">
  <table>
   <thead>
    <tr>
     <th>Patient Name</th>
     <th>Gender</th>
     <th>Date & Time</th>
     <th>Status</th>
     <th style="text-align: center;">Actions</th>
    </tr>
   </thead>
   <tbody>
    {#each filteredApps as app (app.id)}
     <tr class={app.status === 'Done' ? 'row-done' : ''}>
      <td style="font-weight: bold;">👤 {app.patient_name}</td>
      <td><span class="g-badge {app.gender?.toLowerCase()}">{app.gender}</span></td>
      <td>{new Date(app.date).toLocaleString()}</td>
      <td><span class="status-badge {app.status}">{app.status}</span></td>
      <td class="actions">
       <button class="b-conf" onclick={() => updateStatus(app.id, 'Confirmed')}>🔵</button>
       <button class="b-done" onclick={() => updateStatus(app.id, 'Done')}>✅</button>
       <button class="b-del" onclick={() => deleteApp(app.id)}>🗑️</button>
      </td>
     </tr>
    {:else}
     <tr><td colspan="5" style="text-align: center; padding: 30px; color: #888;">No appointments found.</td></tr>
    {/each}
   </tbody>
  </table>
 </div>
</div>

<style>
 .header-flex { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; flex-wrap: wrap; gap: 15px; }
 .stats-grid { display: flex; gap: 10px; }
 .stat-box { padding: 10px 15px; border-radius: 12px; font-weight: bold; font-size: 0.85rem; border: 1px solid rgba(0,0,0,0.1); }
 .done { background: #dcfce7; color: #166534; }
 .waiting { background: #fef3c7; color: #92400e; }
 .overdue { background: #fee2e2; color: #dc2626; }

 .add-card { display: flex; gap: 15px; padding: 20px; background: var(--card, white); border-radius: 15px; border: 1px solid var(--border, #ddd); margin-bottom: 20px; align-items: flex-end; flex-wrap: wrap; }
 .input-group { flex: 1; min-width: 200px; }
 .input-group label { display: block; font-size: 0.8rem; margin-bottom: 5px; font-weight: bold; }
 select, input { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #ccc; background: var(--card, white); color: var(--text); outline: none; }
 
 .btn-add { background: #4f46e5; color: white; border: none; padding: 13px 30px; border-radius: 10px; cursor: pointer; font-weight: bold; }

 .search-box input { width: 100%; padding: 12px; border-radius: 12px; border: 1px solid #6366f1; background: var(--card, white); color: var(--text); margin-bottom: 15px; outline: none; }

 .table-card { background: var(--card, white); border-radius: 15px; border: 1px solid var(--border, #ddd); overflow: hidden; }
 table { width: 100%; border-collapse: collapse; }
 th, td { padding: 15px; text-align: left; border-bottom: 1px solid var(--border, #eee); color: var(--text); }
 
 .g-badge { padding: 3px 10px; border-radius: 15px; font-size: 0.75rem; font-weight: bold; }
 .g-badge.male { background: #e0f2fe; color: #0369a1; }
 .g-badge.female { background: #fce7f3; color: #be185d; }

 .status-badge { padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: bold; }
 .status-badge.Pending { background: #fef3c7; color: #92400e; }
 .status-badge.Confirmed { background: #e0f2fe; color: #0369a1; }
 .status-badge.Done { background: #dcfce7; color: #166534; }

 .actions { display: flex; gap: 8px; justify-content: center; }
 .actions button { border: none; padding: 8px; border-radius: 8px; cursor: pointer; transition: 0.2s; }
 .b-conf { background: #e0f2fe; color: #0369a1; }
 .b-done { background: #dcfce7; color: #166534; }
 .b-del { background: #fee2e2; color: #dc2626; }
 
 .row-done { opacity: 0.6; }
</style>
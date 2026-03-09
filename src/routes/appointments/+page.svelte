<script lang="ts">
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

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
 let selectedPatient = $state('');
 let appointmentDate = $state('');
 let doctorId = $state(0);
 let isLoading = $state(false);

 // ١. وەرگرتنا داتایان ژ Supabase
 async function fetchData() {
  if (!doctorId) return;

  // ئینانا ناڤێن پاتێنتان بۆ Select
  const { data: pData } = await supabase.from('patients').select('name').eq('doctor_id', doctorId);
  if (pData) patients = pData;

  // ئینانا ژڤانان بۆ خشتەی
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

 // ٢. فانکشنا زێدەکرنا ژڤانی (ئەوا کار نەدکر)
 async function addAppointment() {
  if (selectedPatient && appointmentDate && doctorId) {
   isLoading = true;
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
    await fetchData(); // نووژەنکرنا لیستا خوارێ ب ڕاستەوخۆ
   } else {
    alert("Error: " + error.message);
   }
   isLoading = false;
  } else {
   alert("تکایە نەخۆشەکێ و کاتەکێ هەلبژێره");
  }
 }

 async function deleteApp(id: number) {
  if (confirm('Are you sure?')) {
   await supabase.from('appointments').delete().eq('id', id);
   fetchData();
  }
 }
</script>

<div class="appointments-page">
 <h2 style="color: var(--text);">📅 Appointments Management</h2>

 <div class="input-card">
  <div style="flex: 1; min-width: 200px;">
   <label for="p-select" style="display: block; font-size: 0.8rem; margin-bottom: 5px; font-weight: bold;">Select Patient</label>
   <select id="p-select" bind:value={selectedPatient} style="width: 100%;">
    <option value="">-- Choose Patient --</option>
    {#each patients as p}
     <option value={p.name}>{p.name}</option>
    {/each}
   </select>
  </div>

  <div style="flex: 1; min-width: 200px;">
   <label for="a-date" style="display: block; font-size: 0.8rem; margin-bottom: 5px; font-weight: bold;">Date & Time</label>
   <input id="a-date" type="datetime-local" bind:value={appointmentDate} style="width: 100%;" />
  </div>

  <button onclick={addAppointment} disabled={isLoading} style="height: 45px; align-self: flex-end;">
   {isLoading ? '...' : 'Book Now'}
  </button>
 </div>

 <div class="table-container">
  <table>
   <thead>
    <tr>
     <th>Patient Name</th><th>Date & Time</th><th>Status</th><th>Action</th>
    </tr>
   </thead>
   <tbody>
    {#each appointments as app}
     <tr>
      <td style="font-weight: bold;">👤 {app.patient_name}</td>
      <td>{new Date(app.date).toLocaleString()}</td>
      <td><span class="status-badge">{app.status}</span></td>
      <td><button onclick={() => deleteApp(app.id)} class="del-btn">🗑️</button></td>
     </tr>
    {:else}
     <tr><td colspan="4" style="text-align: center; padding: 30px; color: #888;">No appointments found.</td></tr>
    {/each}
   </tbody>
  </table>
 </div>
</div>

<style>
 .input-card { background: var(--card, white); padding: 25px; border-radius: 15px; border: 1px solid var(--border, #ddd); display: flex; gap: 15px; flex-wrap: wrap; margin-bottom: 30px; }
 input, select { padding: 12px; border-radius: 10px; border: 1px solid var(--border, #ccc); background: var(--card, white); color: var(--text); }
 button { background: #4f46e5; color: white; border: none; padding: 0 30px; border-radius: 10px; cursor: pointer; font-weight: bold; }
 .table-container { background: var(--card, white); border-radius: 15px; border: 1px solid var(--border, #ddd); overflow: hidden; }
 table { width: 100%; border-collapse: collapse; }
 th, td { padding: 15px; text-align: left; border-bottom: 1px solid var(--border, #eee); color: var(--text); }
 .status-badge { background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: bold; }
 .del-btn { background: #fee2e2; color: #ef4444; border: none; padding: 8px; border-radius: 8px; cursor: pointer; }
</style>
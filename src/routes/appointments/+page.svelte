<script lang="ts">
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 // ١. پێناسەیا جۆرێ داتایان (Interfaces) دا کو خەلەتیێن 'never' نەمینن
 interface Patient {
  name: string;
 }

 interface Appointment {
  id: number;
  patient: string;
  date: string;
  status: string;
 }

 // ٢. دیارکرنا جۆرێ لیستان ب بەکارهێنانا < >
 let patients = $state<Patient[]>([]); 
 let appointments = $state<Appointment[]>([]);
 
 let selectedPatient = $state('');
 let appointmentDate = $state('');

 async function fetchData() {
  // وەرگرتنا ناڤێن نەخۆشان ژ Supabase
  const { data: pData } = await supabase.from('patients').select('name').order('name');
  if (pData) patients = pData;

  // وەرگرتنا ژڤانان ژ localStorage
  const savedApps = localStorage.getItem('my_appointments');
  if (savedApps) {
   try {
    appointments = JSON.parse(savedApps);
   } catch (e) {
    console.error(e);
   }
  }
 }

 onMount(() => {
  fetchData();
 });

 function addAppointment() {
  if (selectedPatient && appointmentDate) {
   const newApp: Appointment = {
    id: Date.now(),
    patient: selectedPatient,
    date: appointmentDate,
    status: 'Pending'
   };
   appointments = [newApp, ...appointments];
   localStorage.setItem('my_appointments', JSON.stringify(appointments));
   selectedPatient = '';
   appointmentDate = '';
  }
 }

 function deleteAppointment(id: number) {
  if (confirm('Are you sure?')) {
   appointments = appointments.filter((a) => a.id !== id);
   localStorage.setItem('my_appointments', JSON.stringify(appointments));
  }
 }
</script>

<h2 style="margin-bottom: 20px;">📅 Appointments Management</h2>

<div style="background: white; padding: 25px; border-radius: 15px; border: 1px solid #ddd; margin-bottom: 30px; display: flex; gap: 15px; align-items: flex-end; flex-wrap: wrap;">
 <div style="flex: 1; min-width: 200px;">
  <label for="patient-select" style="display: block; font-size: 0.8rem; margin-bottom: 5px; font-weight: bold; color: #666;">Select Patient</label>
  <select id="patient-select" bind:value={selectedPatient} style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #ccc; background: #f9fafb;">
   <option value="">-- Choose Patient --</option>
   {#each patients as p}
    <option value={p.name}>{p.name}</option>
   {/each}
  </select>
 </div>

 <div style="flex: 1; min-width: 200px;">
  <label for="app-date" style="display: block; font-size: 0.8rem; margin-bottom: 5px; font-weight: bold; color: #666;">Date & Time</label>
  <input id="app-date" type="datetime-local" bind:value={appointmentDate} style="width: 100%; padding: 11px; border-radius: 10px; border: 1px solid #ccc;" />
 </div>

 <button onclick={addAppointment} style="background: #4f46e5; color: white; border: none; padding: 12px 30px; border-radius: 10px; cursor: pointer; font-weight: bold;">Book Appointment</button>
</div>

<div style="background: white; border-radius: 15px; border: 1px solid #eee; overflow: hidden;">
 <table style="width: 100%; border-collapse: collapse;">
  <thead style="background: #f8fafc;">
   <tr style="text-align: left;">
    <th style="padding: 15px; border-bottom: 2px solid #eee;">Patient Name</th>
    <th style="padding: 15px; border-bottom: 2px solid #eee;">Date & Time</th>
    <th style="padding: 15px; border-bottom: 2px solid #eee; text-align: center;">Action</th>
   </tr>
  </thead>
  <tbody>
   {#each appointments as app}
    <tr style="border-bottom: 1px solid #eee;">
     <td style="padding: 15px; font-weight: bold;">👤 {app.patient}</td>
     <td style="padding: 15px;">{new Date(app.date).toLocaleString()}</td>
     <td style="padding: 15px; text-align: center;">
      <button onclick={() => deleteAppointment(app.id)} style="background: #fee2e2; color: #dc2626; border: none; padding: 8px 12px; border-radius: 8px; cursor: pointer;">🗑️</button>
     </td>
    </tr>
   {:else}
    <tr><td colspan="3" style="padding: 40px; text-align: center; color: #999;">No appointments scheduled.</td></tr>
   {/each}
  </tbody>
 </table>
</div>
<script lang="ts">
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 interface Patient { id: number; name: string; age: number; phone: string; doctor_id: number; }
 let patients = $state<Patient[]>([]);
 let name = $state(''), age = $state(''), phone = $state('');
 let doctorId = $state(0);

 async function fetchPatients() {
  if (!doctorId) return;
  const { data } = await supabase.from('patients').select('*').eq('doctor_id', doctorId).order('id', { ascending: false });
  if (data) patients = data;
 }

 onMount(() => {
  doctorId = Number(localStorage.getItem('doctor_id'));
  if (doctorId) fetchPatients();
 });

 async function addPatient() {
  if (name && phone) {
   const { data, error } = await supabase.from('patients').insert([{ name, age: Number(age), phone, doctor_id: doctorId }]).select();
   if (!error && data) {
    patients = [data[0] as Patient, ...patients];
    name = ''; age = ''; phone = '';
   }
  }
 }

 async function deletePatient(id: number) {
  if (confirm('Are you sure?')) {
   await supabase.from('patients').delete().eq('id', id);
   patients = patients.filter(p => p.id !== id);
  }
 }
</script>

<div class="page-header">
 <h2>👥 Patients Directory</h2>
 <p style="font-size: 0.8rem; color: #666;">Click on a patient name to see medical history.</p>
</div>

<div class="card add-form">
 <input bind:value={name} placeholder="Patient Name" style="flex: 2;" />
 <input bind:value={age} type="number" placeholder="Age" style="width: 80px;" />
 <input bind:value={phone} placeholder="Phone" style="flex: 1;" />
 <button onclick={addPatient}>+ Add New</button>
</div>

<div class="table-container">
 <table>
  <thead>
   <tr><th>Name (Profile)</th><th>Age</th><th>Phone</th><th style="text-align: center;">Action</th></tr>
  </thead>
  <tbody>
   {#each patients as p (p.id)}
    <tr>
     <td>
      <!-- ئەڤە ئەو لینکەیە کو دکتۆری دباتە ناڤ پڕۆفایلێ نەخۆشی -->
      <a href="/patients/{p.id}" class="patient-link">
       👤 {p.name}
      </a>
     </td>
     <td>{p.age}</td>
     <td>{p.phone}</td>
     <td style="text-align: center;">
      <button class="del-btn" onclick={() => deletePatient(p.id)}>🗑️</button>
     </td>
    </tr>
   {/each}
  </tbody>
 </table>
</div>

<style>
 .add-form { display: flex; gap: 10px; flex-wrap: wrap; padding: 20px; background: var(--card, white); border: 1px solid var(--border, #ddd); border-radius: 12px; margin-bottom: 20px; }
 input { padding: 12px; border-radius: 8px; border: 1px solid var(--border, #ccc); background: var(--card, white); color: var(--text); }
 button { background: #4f46e5; color: white; border: none; padding: 12px 25px; border-radius: 8px; cursor: pointer; font-weight: bold; }
 
 .patient-link { color: #4f46e5; text-decoration: none; font-weight: bold; border-bottom: 1px solid transparent; transition: 0.2s; }
 .patient-link:hover { border-bottom: 1px solid #4f46e5; }

 .table-container { background: var(--card, white); border-radius: 12px; border: 1px solid var(--border, #ddd); overflow: hidden; }
 table { width: 100%; border-collapse: collapse; }
 th, td { padding: 15px; text-align: left; border-bottom: 1px solid var(--border, #eee); color: var(--text); }
 .del-btn { background: #fee2e2; color: #ef4444; border: none; padding: 8px; border-radius: 6px; cursor: pointer; }
</style>
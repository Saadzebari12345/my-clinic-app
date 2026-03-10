<script lang="ts">
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 interface Patient { id: number; name: string; age: number; gender: string; phone: string; illness: string; }
 let patients = $state<Patient[]>([]);
 let name = $state(''), age = $state(''), gender = $state('Male'), phone = $state(''), illness = $state('');
 let doctorId = $state(0);
 let isSaving = $state(false);

 async function fetchPatients() {
  if (!doctorId) return;
  const { data } = await supabase.from('patients').select('*').eq('doctor_id', doctorId).order('id', { ascending: false });
  if (data) patients = data;
 }

 onMount(() => {
  const storedId = localStorage.getItem('doctor_id');
  if (storedId) {
   doctorId = Number(storedId);
   fetchPatients();
  }
 });

 async function addPatient() {
  if (!name || !phone) return alert("تکایە خانەیان پڕ بکە");
  
  isSaving = true;
  const newPatientData = { name, age: Number(age), gender, phone, illness: illness || 'N/A', doctor_id: doctorId };

  const { data, error } = await supabase.from('patients').insert([newPatientData]).select();

  if (!error && data) {
   // نووژەنکرنا لیستێ ب شێوەیەکێ خێرا بێی ریفرێش
   patients = [data[0], ...patients]; 
   name = ''; age = ''; phone = ''; illness = '';
  } else {
   alert("Error: " + error?.message);
  }
  isSaving = false;
 }
</script>

<div class="page-container">
 <h2>👥 Patients Directory</h2>

 <div class="card add-form">
  <input bind:value={name} placeholder="Full Name" />
  <input bind:value={age} type="number" placeholder="Age" style="width: 70px;" />
  <select bind:value={gender}><option>Male</option><option>Female</option></select>
  <input bind:value={phone} placeholder="Phone" />
  <button onclick={addPatient} disabled={isSaving}>
   {isSaving ? 'Saving...' : '+ Add Patient'}
  </button>
 </div>

 <div class="table-container">
  <table>
   <thead>
    <tr><th>Name</th><th>Age</th><th>Gender</th><th>Phone</th></tr>
   </thead>
   <tbody>
    {#each patients as p (p.id)}
     <tr>
      <td><b>{p.name}</b></td><td>{p.age}</td><td>{p.gender}</td><td>{p.phone}</td>
     </tr>
    {:else}
     <tr><td colspan="4" style="text-align: center; padding: 20px;">Loading patients...</td></tr>
    {/each}
   </tbody>
  </table>
 </div>
</div>

<style>
 .page-container { animation: fadeIn 0.3s ease-in; }
 @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
 .add-form { display: flex; gap: 10px; flex-wrap: wrap; padding: 20px; background: var(--card); border: 1px solid var(--border); border-radius: 12px; margin-bottom: 20px; }
 input, select { padding: 10px; border-radius: 8px; border: 1px solid var(--border); background: var(--card); color: var(--text); }
 button { background: #4f46e5; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; }
 button:disabled { background: #94a3b8; }
 .table-container { background: var(--card); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
 table { width: 100%; border-collapse: collapse; }
 th, td { padding: 15px; text-align: left; border-bottom: 1px solid var(--border); color: var(--text); }
</style>
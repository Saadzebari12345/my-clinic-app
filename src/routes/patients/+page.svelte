<script lang="ts">
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 // ١. پێناسەکرنا جۆرێ داتایێ (ئەڤە هەمی هێڵێن سۆر لادەت)
 interface Patient {
  id: number;
  name: string;
  age: number;
  gender: string;
  phone: string;
  illness: string;
  doctor_id: number;
 }

 // ٢. دیارکرنا جۆرێ لیستێ ب <Patient[]> دا بزانیت دێ چ وەرگریت
 let patients = $state<Patient[]>([]);
 
 let name = $state(''), age = $state(''), gender = $state('Male');
 let phone = $state(''), illness = $state('');
 let doctorId = $state(0);

 async function fetchPatients() {
  if (!doctorId) return;
  const { data } = await supabase
   .from('patients')
   .select('*')
   .eq('doctor_id', doctorId)
   .order('id', { ascending: false });
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
  
  const newObj = { 
   name, 
   age: Number(age), 
   gender, 
   phone, 
   illness: illness || 'N/A', 
   doctor_id: doctorId 
  };

  // زێدەکرنا ب لەز (Optimistic UI)
  const { data, error } = await supabase.from('patients').insert([newObj]).select();
  
  if (!error && data) {
   patients = [data[0] as Patient, ...patients]; // نووژەنکرنا لیستا خوارێ ب ڕاستەوخۆ
   name = ''; age = ''; phone = ''; illness = '';
  }
 }

 async function deletePatient(id: number) {
  if (confirm('Are you sure?')) {
   const { error } = await supabase.from('patients').delete().eq('id', id);
   if (!error) patients = patients.filter(p => p.id !== id);
  }
 }
</script>

<div class="page-container">
 <h2 style="color: var(--text);">👥 Patients Directory</h2>

 <div class="card form-box">
  <input bind:value={name} placeholder="Full Name" />
  <input bind:value={age} type="number" placeholder="Age" style="width: 80px;" />
  <select bind:value={gender}>
   <option value="Male">Male</option>
   <option value="Female">Female</option>
  </select>
  <input bind:value={phone} placeholder="Phone" />
  <button onclick={addPatient}>+ Add Patient</button>
 </div>

 <div class="table-container card">
  <table>
   <thead>
    <tr><th>Name</th><th>Age</th><th>Gender</th><th>Phone</th><th>Action</th></tr>
   </thead>
   <tbody>
    {#each patients as p (p.id)}
     <tr>
      <td><b>{p.name}</b></td>
      <td>{p.age}</td>
      <td>{p.gender}</td>
      <td>{p.phone}</td>
      <td><button class="btn-del" onclick={() => deletePatient(p.id)}>🗑️</button></td>
     </tr>
    {:else}
     <tr><td colspan="5" style="text-align: center; padding: 20px;">No data found...</td></tr>
    {/each}
   </tbody>
  </table>
 </div>
</div>

<style>
 .form-box { display: flex; gap: 10px; flex-wrap: wrap; padding: 20px; background: var(--card); border: 1px solid var(--border); border-radius: 12px; margin-bottom: 20px; }
 input, select { padding: 10px; border-radius: 8px; border: 1px solid var(--border); background: var(--card); color: var(--text); outline: none; }
 button { background: #4f46e5; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; }
 .table-container { background: var(--card); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
 table { width: 100%; border-collapse: collapse; }
 th, td { padding: 15px; text-align: left; border-bottom: 1px solid var(--border); color: var(--text); }
 .btn-del { background: none; border: none; cursor: pointer; font-size: 1.1rem; }
</style>
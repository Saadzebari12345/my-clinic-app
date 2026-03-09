<script lang="ts">
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 interface Patient {
  id: number;
  name: string;
  age: number;
  gender: string;
  phone: string;
 }

 let patients = $state<Patient[]>([]);
 let name = $state(''), age = $state(''), gender = $state('Male'), phone = $state('');
 let doctorId = $state(0);
 let isLoading = $state(false);

 // ١. فانکشنا وەرگرتنا داتایان ژ Supabase
 async function fetchPatients() {
  if (!doctorId) return;
  const { data, error } = await supabase
   .from('patients')
   .select('*')
   .eq('doctor_id', doctorId)
   .order('id', { ascending: false });
  
  if (data) {
   patients = data;
  }
 }

 onMount(() => {
  const storedId = localStorage.getItem('doctor_id');
  if (storedId) {
   doctorId = Number(storedId);
   fetchPatients();
  }
 });

 // ٢. زێدەکرنا نەخۆشەکێ نوی و نووژەنکرنا لیستا خوارێ ب ڕاستەوخۆ
 async function addPatient() {
  if (name && phone && doctorId) {
   isLoading = true;
   const { error } = await supabase.from('patients').insert([
    { name, age: Number(age), gender, phone, doctor_id: doctorId }
   ]);

   if (!error) {
    name = ''; age = ''; phone = '';
    await fetchPatients(); // ئینا داتایێن نوی پشتی زێدەکرنێ
   } else {
    alert("Error: " + error.message);
   }
   isLoading = false;
  } else {
   alert("تکایە هەمی خانەیان پڕ بکە");
  }
 }

 async function deletePatient(id: number) {
  if (confirm('Are you sure?')) {
   await supabase.from('patients').delete().eq('id', id);
   fetchPatients();
  }
 }
</script>

<div class="patients-container">
 <h2>👥 Patients Directory</h2>

 <div class="input-card">
  <div class="grid-inputs">
   <input bind:value={name} placeholder="Full Name" />
   <input bind:value={age} type="number" placeholder="Age" style="width: 80px;" />
   <select bind:value={gender}>
    <option value="Male">Male</option>
    <option value="Female">Female</option>
   </select>
   <input bind:value={phone} placeholder="Phone Number" />
   <button onclick={addPatient} disabled={isLoading}>
    {isLoading ? '...' : '+ Add Patient'}
   </button>
  </div>
 </div>

 <div class="table-container">
  <table>
   <thead>
    <tr>
     <th>Name</th>
     <th>Age</th>
     <th>Gender</th>
     <th>Phone</th>
     <th style="text-align: center;">Action</th>
    </tr>
   </thead>
   <tbody>
    {#each patients as p}
     <tr>
      <td style="font-weight: bold;">{p.name}</td>
      <td>{p.age}</td>
      <td>{p.gender}</td>
      <td>{p.phone}</td>
      <td style="text-align: center;">
       <button class="del-btn" onclick={() => deletePatient(p.id)}>🗑️</button>
      </td>
     </tr>
    {:else}
     <tr><td colspan="5" style="text-align: center; padding: 40px; color: #888;">No patients found. Add one above.</td></tr>
    {/each}
   </tbody>
  </table>
 </div>
</div>

<style>
 .patients-container { color: inherit; }
 .input-card { background: var(--card, white); padding: 20px; border-radius: 15px; border: 1px solid var(--border, #ddd); margin-bottom: 25px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
 .grid-inputs { display: flex; gap: 10px; flex-wrap: wrap; }
 input, select { padding: 12px; border-radius: 10px; border: 1px solid #ccc; background: var(--card, white); color: inherit; flex: 1; min-width: 120px; }
 button { background: #4f46e5; color: white; border: none; padding: 12px 25px; border-radius: 10px; cursor: pointer; font-weight: bold; }
 
 .table-container { background: var(--card, white); border-radius: 15px; border: 1px solid var(--border, #ddd); overflow: hidden; }
 table { width: 100%; border-collapse: collapse; }
 th { background: rgba(0,0,0,0.03); padding: 15px; text-align: left; border-bottom: 2px solid var(--border, #eee); }
 td { padding: 15px; border-bottom: 1px solid var(--border, #eee); }
 .del-btn { background: #fee2e2; color: #ef4444; border: none; padding: 8px; border-radius: 8px; }
</style>
<script lang="ts">
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 // ١. پێناسەیا نەخۆشی دا TypeScript تێنەگەهیت کو لیستە یا ڤالایە
 interface Patient {
  id: number;
  name: string;
  age: number;
  gender: string;
  phone: string;
  doctor_id: number;
 }

 let patients = $state<Patient[]>([]); // لێرە مە کێشا 'never' چارەسەر کر
 let name = $state(''), age = $state(''), gender = $state('Male'), phone = $state('');
 let doctorId = $state(0);

 onMount(async () => {
  doctorId = Number(localStorage.getItem('doctor_id'));
  fetchPatients();
 });

 async function fetchPatients() {
  const { data } = await supabase
   .from('patients')
   .select('*')
   .eq('doctor_id', doctorId)
   .order('id', { ascending: false });
  if (data) patients = data;
 }

 async function addPatient() {
  if (name && phone) {
   await supabase.from('patients').insert([{ 
    name, 
    age: Number(age), 
    gender, 
    phone, 
    doctor_id: doctorId 
   }]);
   name = ''; age = ''; phone = '';
   fetchPatients();
  }
 }

 async function deletePatient(id: number) { // لێرە مە جۆرێ ئایدیێ دیار کر
  if (confirm('Are you sure?')) {
   await supabase.from('patients').delete().eq('id', id);
   fetchPatients();
  }
 }
</script>

<h2>👥 Patients Directory</h2>

<div class="card" style="padding: 20px; margin-bottom: 20px; display: flex; gap: 10px; flex-wrap: wrap; background: white; border-radius: 12px; border: 1px solid #ddd;">
 <div style="flex: 2;">
  <label for="p-name" style="display: block; font-size: 0.8rem; margin-bottom: 4px;">Full Name</label>
  <input id="p-name" bind:value={name} placeholder="Name" style="width: 100%;" />
 </div>
 <div style="width: 70px;">
  <label for="p-age" style="display: block; font-size: 0.8rem; margin-bottom: 4px;">Age</label>
  <input id="p-age" bind:value={age} type="number" style="width: 100%;" />
 </div>
 <div>
  <label for="p-gender" style="display: block; font-size: 0.8rem; margin-bottom: 4px;">Gender</label>
  <select id="p-gender" bind:value={gender} style="width: 100px;">
   <option value="Male">Male</option>
   <option value="Female">Female</option>
  </select>
 </div>
 <div style="flex: 1;">
  <label for="p-phone" style="display: block; font-size: 0.8rem; margin-bottom: 4px;">Phone</label>
  <input id="p-phone" bind:value={phone} placeholder="0750..." style="width: 100%;" />
 </div>
 <button onclick={addPatient} style="background: #4f46e5; color: white; padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; align-self: flex-end;">+ Add</button>
</div>

<div class="table-container" style="background: white; border-radius: 12px; overflow: hidden; border: 1px solid #ddd;">
 <table style="width: 100%; border-collapse: collapse;">
  <thead style="background: #f8fafc;">
   <tr>
    <th style="padding: 15px; text-align: left;">Name</th>
    <th style="padding: 15px; text-align: left;">Age</th>
    <th style="padding: 15px; text-align: left;">Phone</th>
    <th style="padding: 15px; text-align: center;">Action</th>
   </tr>
  </thead>
  <tbody>
   {#each patients as p}
    <tr style="border-bottom: 1px solid #eee;">
     <td style="padding: 15px; font-weight: bold;">{p.name}</td>
     <td style="padding: 15px;">{p.age}</td>
     <td style="padding: 15px;">{p.phone}</td>
     <td style="padding: 15px; text-align: center;">
      <button onclick={() => deletePatient(p.id)} style="color: #ef4444; background: none; border: none; cursor: pointer;">🗑️</button>
     </td>
    </tr>
   {/each}
  </tbody>
 </table>
</div>
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
  if (name && phone && doctorId) {
   isLoading = true;
   const { error } = await supabase.from('patients').insert([
    { name, age: Number(age), gender, phone, doctor_id: doctorId }
   ]);

   if (!error) {
    name = ''; age = ''; phone = '';
    await fetchPatients(); // نووژەنکرنا لیستا خوارێ
   }
   isLoading = false;
  }
 }

 // فانکشنا ژێبرنێ (Delete)
 async function deletePatient(id: number) {
  if (confirm('ئەرێ تو پشتراستی تو دڤێت ڤی نەخۆشی ژێببەی؟')) {
   const { error } = await supabase
    .from('patients')
    .delete()
    .eq('id', id);
   
   if (!error) {
    await fetchPatients(); // نووژەنکرنا لیستێ پشتی ژێبرنێ
   }
  }
 }
</script>

<div class="page-container">
 <h2 style="color: var(--text); margin-bottom: 20px;">👥 Patients Directory</h2>

 <!-- بەشێ نڤیسینێ -->
 <div class="input-card">
  <input bind:value={name} placeholder="Full Name" />
  <input bind:value={age} type="number" placeholder="Age" style="width: 70px;" />
  
  <!-- بەشێ ڕەگەز (Gender) -->
  <select bind:value={gender} class="gender-select">
   <option value="Male">Male</option>
   <option value="Female">Female</option>
  </select>

  <input bind:value={phone} placeholder="Phone Number" />
  <button class="add-btn" onclick={addPatient} disabled={isLoading}>
   {isLoading ? '...' : '+ Add'}
  </button>
 </div>

 <!-- خشتەیێ داتایان -->
 <div class="table-card">
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
      <td>
       <span class="gender-tag {p.gender.toLowerCase()}">{p.gender}</span>
      </td>
      <td>{p.phone}</td>
      <td style="text-align: center;">
       <button class="del-btn" onclick={() => deletePatient(p.id)}>
        🗑️ Delete
       </button>
      </td>
     </tr>
    {:else}
     <tr><td colspan="5" style="text-align: center; padding: 30px; color: #888;">No patients found.</td></tr>
    {/each}
   </tbody>
  </table>
 </div>
</div>

<style>
 .input-card { 
  background: var(--card, white); padding: 20px; border-radius: 15px; 
  border: 1px solid var(--border, #ddd); display: flex; gap: 10px; 
  flex-wrap: wrap; margin-bottom: 25px; align-items: center;
 }
 
 input, .gender-select { 
  padding: 12px; border-radius: 10px; border: 1px solid var(--border, #ccc); 
  background: var(--card, white); color: var(--text); flex: 1; min-width: 120px;
 }

 .add-btn { background: #4f46e5; color: white; border: none; padding: 12px 25px; border-radius: 10px; cursor: pointer; font-weight: bold; }
 
 .table-card { background: var(--card, white); border-radius: 15px; border: 1px solid var(--border, #ddd); overflow: hidden; }
 table { width: 100%; border-collapse: collapse; }
 th { background: rgba(0,0,0,0.03); padding: 15px; text-align: left; border-bottom: 2px solid var(--border, #eee); }
 td { padding: 15px; border-bottom: 1px solid var(--border, #eee); }

 /* ستایلێ تاگێ ڕەگەزی */
 .gender-tag { padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: bold; }
 .gender-tag.male { background: #e0f2fe; color: #0369a1; }
 .gender-tag.female { background: #fce7f3; color: #be185d; }

 /* ستایلێ دوگمێ Delete */
 .del-btn { background: #fee2e2; color: #dc2626; border: none; padding: 8px 15px; border-radius: 8px; cursor: pointer; font-weight: bold; transition: 0.2s; }
 .del-btn:hover { background: #fecaca; }

 :global(.dark-mode) th { background: rgba(255,255,255,0.03); }
</style>
<script lang="ts">
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 // ١. پێناسەیا نەخۆشی ب ستوونا نوی (gender)
 interface Patient {
  id: number;
  name: string;
  age: number;
  gender: string;
  phone: string;
  illness: string;
 }

 let patients = $state<Patient[]>([]);
 let name = $state(''), age = $state(''), gender = $state('Male'), phone = $state(''), illness = $state('');
 let doctorId = $state(0);
 let isSaving = $state(false);

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

 // ٢. زێدەکرنا نەخۆشی دگەل ڕەگەزی
 async function addPatient() {
  if (!name || !phone) return alert("تکایە ناڤ و مۆبایلێ بنڤیسە");
  
  isSaving = true;
  const { data, error } = await supabase.from('patients').insert([
   { 
    name, 
    age: Number(age), 
    gender, 
    phone, 
    illness: illness || 'General', 
    doctor_id: doctorId 
   }
  ]).select();

  if (!error && data) {
   patients = [data[0], ...patients]; // زێدەکرنا خێرا د لیستا خوارێ دا
   name = ''; age = ''; phone = ''; illness = '';
  } else {
   alert("Error: " + error?.message);
  }
  isSaving = false;
 }

 // ٣. فانکشنا ژێبرنێ (Delete) ژ Supabase
 async function deletePatient(id: number) {
  if (confirm('ئەرێ تو پشتراستی تو دڤێت ڤی نەخۆشی ژێببەی؟')) {
   const { error } = await supabase
    .from('patients')
    .delete()
    .eq('id', id);
   
   if (!error) {
    // لادانا نەخۆشی ژ لیستێ بێی ڕیفرێش
    patients = patients.filter(p => p.id !== id);
   } else {
    alert("Error deleting: " + error.message);
   }
  }
 }
</script>

<div class="page-container">
 <h2 style="margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
  <span>👥</span> Patients Directory
 </h2>

 <!-- فۆرما زێدەکرنێ -->
 <div class="card add-form">
  <div class="input-grid">
   <input bind:value={name} placeholder="Full Name" />
   <input bind:value={age} type="number" placeholder="Age" style="width: 70px;" />
   
   <select bind:value={gender} class="select-gender">
    <option value="Male">Male 👨</option>
    <option value="Female">Female 👩</option>
   </select>

   <input bind:value={phone} placeholder="Phone Number" />
   <button onclick={addPatient} disabled={isSaving} class="btn-add">
    {isSaving ? '...' : '+ Add'}
   </button>
  </div>
 </div>

 <!-- خشتەیێ داتایان -->
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
    {#each patients as p (p.id)}
     <tr>
      <td style="font-weight: bold;">{p.name}</td>
      <td>{p.age}</td>
      <td>
       <span class="badge {p.gender.toLowerCase()}">{p.gender}</span>
      </td>
      <td>{p.phone}</td>
      <td style="text-align: center;">
       <button class="btn-delete" onclick={() => deletePatient(p.id)} title="Delete">
        🗑️
       </button>
      </td>
     </tr>
    {:else}
     <tr><td colspan="5" style="text-align: center; padding: 40px; color: #888;">No patients found.</td></tr>
    {/each}
   </tbody>
  </table>
 </div>
</div>

<style>
 .page-container { color: inherit; }
 
 .add-form { 
  background: var(--card, white); padding: 20px; border-radius: 15px; 
  border: 1px solid var(--border, #ddd); margin-bottom: 25px; 
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
 }

 .input-grid { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }

 input, .select-gender { 
  padding: 12px; border-radius: 10px; border: 1px solid var(--border, #ccc); 
  background: var(--card, white); color: var(--text); flex: 1; min-width: 120px;
  outline: none;
 }

 .btn-add { background: #4f46e5; color: white; border: none; padding: 12px 25px; border-radius: 10px; cursor: pointer; font-weight: bold; }

 .table-container { background: var(--card, white); border-radius: 15px; border: 1px solid var(--border, #ddd); overflow: hidden; }
 table { width: 100%; border-collapse: collapse; }
 th { background: rgba(0,0,0,0.03); padding: 15px; text-align: left; border-bottom: 2px solid var(--border, #eee); }
 td { padding: 15px; border-bottom: 1px solid var(--border, #eee); }

 /* ستایلێ نێر و مێ */
 .badge { padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: bold; }
 .badge.male { background: #e0f2fe; color: #0369a1; }
 .badge.female { background: #fce7f3; color: #be185d; }

 /* ستایلێ دوگمێ Delete */
 .btn-delete { 
  background: #fee2e2; color: #dc2626; border: none; 
  padding: 8px 12px; border-radius: 8px; cursor: pointer; 
  transition: 0.2s; 
 }
 .btn-delete:hover { background: #fecaca; transform: scale(1.1); }

 :global(.dark-mode) .add-form, :global(.dark-mode) .table-container {
  --card: #1e293b; --border: #334155;
 }
</style>
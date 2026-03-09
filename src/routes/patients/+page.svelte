<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';

  interface Patient { id: number; name: string; age: number; gender: string; phone: string; }
  let patients = $state<Patient[]>([]);
  let name = $state(""), age = $state(""), gender = $state("Male"), phone = $state("");
  let doctorId = $state(0);

  onMount(() => {
    doctorId = Number(localStorage.getItem("doctor_id"));
    fetchPatients();
  });

  async function fetchPatients() {
    const { data } = await supabase.from('patients').select('*').eq('doctor_id', doctorId).order('id', {ascending: false});
    if (data) patients = data;
  }

  async function addPatient() {
    if (name && phone) {
      await supabase.from('patients').insert([{ name, age: Number(age), gender, phone, doctor_id: doctorId }]);
      name = ""; age = ""; phone = "";
      await fetchPatients(); // نوژەنکرنا لیستێ ب ڕاستەوخۆ
    }
  }
</script>

<h2>👥 Patients Directory</h2>

<div class="card" style="padding: 20px; margin-bottom: 20px; display: flex; gap: 10px; flex-wrap: wrap; background: var(--card); border: 1px solid var(--border); border-radius: 12px;">
  <input bind:value={name} placeholder="Full Name" />
  <input bind:value={age} type="number" placeholder="Age" style="width: 70px;" />
  <select bind:value={gender}><option>Male</option><option>Female</option></select>
  <input bind:value={phone} placeholder="Phone" />
  <button onclick={addPatient} style="background: #4f46e5; color: white; padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer;">+ Add</button>
</div>

<div class="table-container" style="background: var(--card); border: 1px solid var(--border); border-radius: 12px; overflow: hidden;">
  <table style="width: 100%; border-collapse: collapse;">
    <thead>
      <tr style="background: rgba(0,0,0,0.05); text-align: left;">
        <th style="padding: 15px;">Name</th><th style="padding: 15px;">Age</th><th style="padding: 15px;">Gender</th><th style="padding: 15px;">Phone</th>
      </tr>
    </thead>
    <tbody>
      {#each patients as p}
        <tr style="border-bottom: 1px solid var(--border);">
          <td style="padding: 15px; font-weight: bold;">{p.name}</td>
          <td style="padding: 15px;">{p.age}</td>
          <td style="padding: 15px;">{p.gender}</td>
          <td style="padding: 15px;">{p.phone}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
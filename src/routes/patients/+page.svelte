<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';

  interface Patient { id: number; name: string; age: number; phone: string; illness: string; }
  let patients = $state<Patient[]>([]);
  let name = $state(""), age = $state(""), phone = $state(""), illness = $state("N/A");
  let doctorId = $state(0);

  async function fetchPatients() {
    if (!doctorId) return;
    const { data } = await supabase.from('patients').select('*').eq('doctor_id', doctorId).order('id', {ascending: false});
    if (data) patients = data;
  }

  onMount(() => {
    doctorId = Number(localStorage.getItem("doctor_id"));
    fetchPatients();
  });

  async function addPatient() {
    if (name && phone && doctorId) {
      const { error } = await supabase.from('patients').insert([
        { name, age: Number(age), phone, illness, doctor_id: doctorId }
      ]);
      if (!error) {
        name = ""; age = ""; phone = "";
        await fetchPatients(); // نووژەنکرنا لیستا خوارێ
      }
    }
  }
</script>

<h2 style="color: var(--text);">👥 Patients Directory</h2>
<div style="background: var(--card); padding: 20px; border-radius: 12px; display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px; border: 1px solid var(--border);">
  <input bind:value={name} placeholder="Name" />
  <input bind:value={age} type="number" placeholder="Age" style="width: 70px;" />
  <input bind:value={phone} placeholder="Phone" />
  <button onclick={addPatient} style="background: #4f46e5; color: white; padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer;">+ Add</button>
</div>

<div style="background: var(--card); border-radius: 12px; border: 1px solid var(--border); overflow: hidden;">
  <table style="width: 100%; border-collapse: collapse;">
    <thead style="background: rgba(0,0,0,0.05);">
      <tr><th style="padding: 15px; text-align: left;">Name</th><th style="padding: 15px; text-align: left;">Age</th><th style="padding: 15px; text-align: left;">Phone</th></tr>
    </thead>
    <tbody>
      {#each patients as p}
        <tr style="border-bottom: 1px solid var(--border);">
          <td style="padding: 15px; font-weight: bold;">{p.name}</td>
          <td style="padding: 15px;">{p.age}</td>
          <td style="padding: 15px;">{p.phone}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';

  let patients = $state([]);
  let newName = $state("");
  let newAge = $state("");
  let newIllness = $state("");

  // وەرگرتنا داتایان ژ داتابەیسا ئۆنلاین
  async function fetchPatients() {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('id', { ascending: false });
    
    if (data) {
        patients = data;
    } else if (error) {
        console.error("Error fetching:", error.message);
    }
  }

  onMount(() => {
    fetchPatients();
  });

  // زێدەکرنا نەخۆشەکێ نوی
  async function addPatient() {
    if (newName && newAge) {
      const { error } = await supabase
        .from('patients')
        .insert([{ name: newName, age: parseInt(newAge), illness: newIllness }]);
      
      if (!error) {
        newName = ""; newAge = ""; newIllness = "";
        fetchPatients(); 
      } else {
        alert("Error adding: " + error.message);
      }
    }
  }

  // ژێبرنا نەخۆشی
  async function deletePatient(id) {
    if(confirm("Are you sure?")) {
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', id);
      
      if (!error) fetchPatients();
    }
  }
</script>

<div style="color: inherit;">
  <h2 style="margin-bottom: 20px;">🌍 Online Patient Directory</h2>

  <div style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 30px; border: 1px solid #ddd; display: flex; gap: 10px; align-items: flex-end; flex-wrap: wrap;">
    <input bind:value={newName} placeholder="Name" style="padding: 10px; border-radius: 8px; border: 1px solid #ccc; flex: 1;" />
    <input bind:value={newAge} type="number" placeholder="Age" style="width: 80px; padding: 10px; border-radius: 8px; border: 1px solid #ccc;" />
    <input bind:value={newIllness} placeholder="Illness" style="padding: 10px; border-radius: 8px; border: 1px solid #ccc; flex: 1;" />
    <button onclick={addPatient} style="background: #4f46e5; color: white; border: none; padding: 11px 25px; border-radius: 8px; cursor: pointer;">+ Add Online</button>
  </div>

  <div style="background: white; border-radius: 12px; overflow: hidden; border: 1px solid #ddd;">
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background: #f8fafc; text-align: left;">
          <th style="padding: 15px; border-bottom: 2px solid #eee;">Name</th>
          <th style="padding: 15px; border-bottom: 2px solid #eee;">Age</th>
          <th style="padding: 15px; border-bottom: 2px solid #eee; text-align: center;">Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each patients as p}
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 15px; font-weight: bold;">{p.name}</td>
            <td style="padding: 15px;">{p.age}</td>
            <td style="padding: 15px; text-align: center;">
              <button onclick={() => deletePatient(p.id)} style="background: #fee2e2; color: #dc2626; border: none; padding: 6px 12px; cursor: pointer; border-radius: 6px;">🗑️ Delete</button>
            </td>
          </tr>
        {:else}
           <tr><td colspan="3" style="padding: 20px; text-align: center;">No data found...</td></tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
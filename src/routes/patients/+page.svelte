<script lang="ts">
  import { onMount } from 'svelte';

  let patients = $state([]);
  let newName = $state("");
  let newAge = $state("");
  let newIllness = $state("");
  let editingId = $state(null);

  onMount(() => {
    const saved = localStorage.getItem('my_patients');
    if (saved) patients = JSON.parse(saved);
  });

  function saveToDB(data) {
    localStorage.setItem('my_patients', JSON.stringify(data));
  }

  function addPatient() {
    if (newName && newAge) {
      const newEntry = { id: Date.now(), name: newName, age: newAge, illness: newIllness };
      patients = [...patients, newEntry];
      saveToDB(patients);
      clearForm();
    }
  }

  function deletePatient(id) {
    if(confirm("Are you sure?")) {
        patients = patients.filter(p => p.id !== id);
        saveToDB(patients);
    }
  }

  function startEdit(p) {
    newName = p.name; newAge = p.age; newIllness = p.illness; editingId = p.id;
  }

  function updatePatient() {
    patients = patients.map(p => p.id === editingId ? { ...p, name: newName, age: newAge, illness: newIllness } : p);
    saveToDB(patients);
    clearForm();
  }

  function clearForm() { newName = ""; newAge = ""; newIllness = ""; editingId = null; }

  // فانکشنا چاپکرنێ
  function printPatient(p) {
    const printContent = `
      <div style="font-family: sans-serif; padding: 40px; border: 1px solid #ccc; border-radius: 10px;">
        <h2 style="color: #4f46e5; text-align: center;">PATIENT MEDICAL REPORT</h2>
        <hr>
        <p><strong>Full Name:</strong> ${p.name}</p>
        <p><strong>Age:</strong> ${p.age}</p>
        <p><strong>Condition:</strong> ${p.illness}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        <br><br><br>
        <p>Signature: ______________________</p>
      </div>
    `;
    const win = window.open('', '', 'height=500,width=700');
    win.document.write(printContent);
    win.document.close();
    win.print();
  }
</script>

<div style="color: inherit;">
  <h2 style="margin-bottom: 20px;">📋 Patient Directory</h2>

  <!-- Input Form -->
  <div style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 30px; border: 1px solid #ddd; display: flex; gap: 10px; align-items: flex-end; flex-wrap: wrap;">
    <input bind:value={newName} placeholder="Name" style="padding: 10px; border-radius: 8px; border: 1px solid #ccc; flex: 1;" />
    <input bind:value={newAge} type="number" placeholder="Age" style="width: 70px; padding: 10px; border-radius: 8px; border: 1px solid #ccc;" />
    <input bind:value={newIllness} placeholder="Illness" style="padding: 10px; border-radius: 8px; border: 1px solid #ccc; flex: 1;" />
    
    {#if editingId}
      <button onclick={updatePatient} style="background: #f59e0b; color: white; border: none; padding: 11px 20px; border-radius: 8px; cursor: pointer;">Save</button>
    {:else}
      <button onclick={addPatient} style="background: #4f46e5; color: white; border: none; padding: 11px 25px; border-radius: 8px; cursor: pointer;">+ Add</button>
    {/if}
  </div>

  <!-- Table -->
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
            <td style="padding: 15px;">{p.name}</td>
            <td style="padding: 15px;">{p.age}</td>
            <td style="padding: 15px; text-align: center;">
              <button onclick={() => startEdit(p)} style="background: #e0e7ff; color: #4338ca; border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer;">✏️</button>
              <button onclick={() => deletePatient(p.id)} style="background: #fee2e2; color: #dc2626; border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer;">🗑️</button>
              <button onclick={() => printPatient(p)} style="background: #f3f4f6; color: #374151; border: 1px solid #ddd; padding: 6px 10px; border-radius: 6px; cursor: pointer;">🖨️ Print</button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
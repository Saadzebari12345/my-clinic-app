<script lang="ts">
  import { onMount } from 'svelte';

  let patients = $state([]);
  let appointments = $state([]);
  
  let selectedPatient = $state("");
  let appointmentDate = $state("");

  onMount(() => {
    // ئینانا داتایان ژ داتابەیسێ
    const savedPatients = localStorage.getItem('my_patients');
    if (savedPatients) patients = JSON.parse(savedPatients);

    const savedApps = localStorage.getItem('my_appointments');
    if (savedApps) appointments = JSON.parse(savedApps);
  });

  function saveApps(data) {
    localStorage.setItem('my_appointments', JSON.stringify(data));
  }

  function addAppointment() {
    if (selectedPatient && appointmentDate) {
      const newApp = { 
        id: Date.now(), 
        patient: selectedPatient, 
        date: appointmentDate,
        status: "Pending" // حالەتێ دەسپێکێ
      };
      appointments = [newApp, ...appointments];
      saveApps(appointments);
      selectedPatient = ""; appointmentDate = "";
    }
  }

  function deleteAppointment(id) {
    appointments = appointments.filter(a => a.id !== id);
    saveApps(appointments);
  }

  function changeStatus(id, newStatus) {
    appointments = appointments.map(a => {
      if (a.id === id) return { ...a, status: newStatus };
      return a;
    });
    saveApps(appointments);
  }
</script>

<h2 style="margin-bottom: 20px;">📅 Appointments Management</h2>

<!-- فۆرما تۆمارکرنا ژڤانێ نوی -->
<div style="background: white; padding: 20px; border-radius: 12px; border: 1px solid #ddd; margin-bottom: 30px; display: flex; gap: 15px; align-items: flex-end; flex-wrap: wrap;">
  <div style="flex: 1; min-width: 200px;">
    <label style="display: block; font-size: 0.8rem; margin-bottom: 5px; font-weight: bold;">Select Patient</label>
    <select bind:value={selectedPatient} style="width: 100%; padding: 11px; border-radius: 8px; border: 1px solid #ccc;">
      <option value="">-- Choose Patient --</option>
      {#each patients as p}
        <option value={p.name}>{p.name}</option>
      {/each}
    </select>
  </div>

  <div style="flex: 1; min-width: 200px;">
    <label style="display: block; font-size: 0.8rem; margin-bottom: 5px; font-weight: bold;">Date & Time</label>
    <input type="datetime-local" bind:value={appointmentDate} style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ccc;" />
  </div>

  <button onclick={addAppointment} style="background: #10b981; color: white; border: none; padding: 11px 25px; border-radius: 8px; cursor: pointer; font-weight: bold;">Book Appointment</button>
</div>

<!-- لیستا ژڤانان -->
<div style="background: white; border-radius: 12px; border: 1px solid #ddd; overflow: hidden;">
  <table style="width: 100%; border-collapse: collapse;">
    <thead style="background: #f8fafc;">
      <tr style="text-align: left;">
        <th style="padding: 15px; border-bottom: 2px solid #eee;">Patient Name</th>
        <th style="padding: 15px; border-bottom: 2px solid #eee;">Date & Time</th>
        <th style="padding: 15px; border-bottom: 2px solid #eee;">Status</th>
        <th style="padding: 15px; border-bottom: 2px solid #eee; text-align: center;">Actions</th>
      </tr>
    </thead>
    <tbody>
      {#each appointments as app}
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 15px; font-weight: 500;">{app.patient}</td>
          <td style="padding: 15px;">{new Date(app.date).toLocaleString()}</td>
          <td style="padding: 15px;">
            <span style="padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: bold; 
              {app.status === 'Pending' ? 'background: #fef3c7; color: #92400e;' : ''}
              {app.status === 'Confirmed' ? 'background: #dcfce7; color: #166534;' : ''}
              {app.status === 'Done' ? 'background: #f3f4f6; color: #374151;' : ''}">
              {app.status}
            </span>
          </td>
          <td style="padding: 15px; text-align: center;">
            <button onclick={() => changeStatus(app.id, 'Confirmed')} style="background: #e0f2fe; color: #0369a1; border: none; padding: 5px 10px; border-radius: 6px; cursor: pointer; font-size: 0.8rem; margin-right: 5px;">Confirm</button>
            <button onclick={() => changeStatus(app.id, 'Done')} style="background: #f3f4f6; color: #374151; border: none; padding: 5px 10px; border-radius: 6px; cursor: pointer; font-size: 0.8rem; margin-right: 5px;">Done</button>
            <button onclick={() => deleteAppointment(app.id)} style="background: #fee2e2; color: #dc2626; border: none; padding: 5px 10px; border-radius: 6px; cursor: pointer; font-size: 0.8rem;">🗑️</button>
          </td>
        </tr>
      {:else}
        <tr><td colspan="4" style="padding: 40px; text-align: center; color: #999;">No appointments scheduled yet.</td></tr>
      {/each}
    </tbody>
  </table>
</div>
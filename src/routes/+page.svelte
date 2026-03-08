<script lang="ts">
  import { onMount } from 'svelte';

  let totalPatients = $state(0);
  let stats = $state({ pending: 0, confirmed: 0, done: 0 });

  onMount(() => {
    // ١. وەرگرتنا ژمارەیا هەمی نەخۆشان
    const savedPatients = localStorage.getItem('my_patients');
    if (savedPatients) {
      totalPatients = JSON.parse(savedPatients).length;
    }

    // ٢. وەرگرتنا ئامارێن ژڤانان (Appointments)
    const savedApps = localStorage.getItem('my_appointments');
    if (savedApps) {
      const apps = JSON.parse(savedApps);
      stats.pending = apps.filter(a => a.status === 'Pending').length;
      stats.confirmed = apps.filter(a => a.status === 'Confirmed').length;
      stats.done = apps.filter(a => a.status === 'Done').length;
    }
  });

  // دەستنیشانکرنا بەرزترین ژمارە بۆ دیارکرنا درێژاهیا گرافی
  let maxVal = $derived(Math.max(stats.pending, stats.confirmed, stats.done, 1));
</script>

<h2 style="margin-bottom: 25px; color: inherit;">Clinic Overview & Analytics</h2>

<!-- کارتێن ئاماران -->
<div style="display: flex; gap: 20px; margin-bottom: 40px; flex-wrap: wrap;">
  <div class="stat-card blue">
    <p>Total Patients</p>
    <h3>{totalPatients}</h3>
  </div>
  <div class="stat-card green">
    <p>Completed Visits</p>
    <h3>{stats.done}</h3>
  </div>
</div>

<!-- بەشێ گرافی (Visual Chart) -->
<div style="background: white; padding: 30px; border-radius: 15px; border: 1px solid #ddd; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
  <h3 style="margin-top: 0; margin-bottom: 20px; font-size: 1rem; color: #64748b;">Appointments Status Distribution</h3>
  
  <div style="display: flex; flex-direction: column; gap: 20px;">
    
    <!-- Pending Bar -->
    <div class="chart-row">
      <span class="label">Pending</span>
      <div class="bar-container">
        <div class="bar pending" style="width: {(stats.pending / maxVal) * 100}%"></div>
      </div>
      <span class="count">{stats.pending}</span>
    </div>

    <!-- Confirmed Bar -->
    <div class="chart-row">
      <span class="label">Confirmed</span>
      <div class="bar-container">
        <div class="bar confirmed" style="width: {(stats.confirmed / maxVal) * 100}%"></div>
      </div>
      <span class="count">{stats.confirmed}</span>
    </div>

    <!-- Done Bar -->
    <div class="chart-row">
      <span class="label">Done</span>
      <div class="bar-container">
        <div class="bar done" style="width: {(stats.done / maxVal) * 100}%"></div>
      </div>
      <span class="count">{stats.done}</span>
    </div>

  </div>
</div>

<style>
  .stat-card {
    flex: 1; min-width: 200px; padding: 25px; border-radius: 12px; color: white;
  }
  .blue { background: linear-gradient(135deg, #6366f1, #4338ca); }
  .green { background: linear-gradient(135deg, #10b981, #059669); }
  .stat-card p { margin: 0; font-size: 0.9rem; opacity: 0.9; }
  .stat-card h3 { margin: 10px 0 0 0; font-size: 2rem; }

  /* ستایلێ گرافی */
  .chart-row { display: flex; align-items: center; gap: 15px; }
  .label { width: 80px; font-size: 0.85rem; font-weight: bold; color: #475569; }
  .bar-container { flex: 1; background: #f1f5f9; height: 12px; border-radius: 6px; overflow: hidden; }
  .bar { height: 100%; transition: width 0.8s ease-out; }
  
  .pending { background: #f59e0b; }
  .confirmed { background: #3b82f6; }
  .done { background: #10b981; }
  
  .count { width: 30px; font-weight: bold; font-size: 0.9rem; text-align: right; }

  /* پشتگیری بۆ Dark Mode */
  :global(.dark-mode) .chart-row .label { color: #cbd5e1; }
  :global(.dark-mode) .bar-container { background: #334155; }
</style>
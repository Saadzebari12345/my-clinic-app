<script lang="ts">
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 // ١. گۆڕاوێن ئاماران (دیزاینێ ڕاست و ڕێكوپێك)
 let doctorId = $state(0);
 let isLoading = $state(true);
 
 let selectedMonth = $state(new Date().getMonth() + 1); 
 let selectedYear = $state(new Date().getFullYear());

 let monthlyStats = $state({ patients: 0, income: 0, expenses: 0, profit: 0 });
 let recentActivity = $state<any[]>([]);

 const months = [
  { id: 1, name: 'January' }, { id: 2, name: 'February' }, { id: 3, name: 'March' },
  { id: 4, name: 'April' }, { id: 5, name: 'May' }, { id: 6, name: 'June' },
  { id: 7, name: 'July' }, { id: 8, name: 'August' }, { id: 9, name: 'September' },
  { id: 10, name: 'October' }, { id: 11, name: 'November' }, { id: 12, name: 'December' }
 ];

 onMount(async () => {
  const storedId = localStorage.getItem('doctor_id');
  if (storedId) {
   doctorId = Number(storedId);
   await loadDashboard();
  }
 });

 async function loadDashboard() {
  if (!doctorId) return;
  isLoading = true;

  // ئینانا هەمی داتایان بێی فلتەرێ توند یێ کاتی (بۆ هندێ چو تشت بەرزە نەبن)
  const { data: records } = await supabase.from('medical_records').select('fee, created_at, diagnosis, patients(name)').eq('doctor_id', doctorId);
  const { data: exps } = await supabase.from('expenses').select('amount, created_at').eq('doctor_id', doctorId);

  // فلتەرکرنا داتایان ل دویڤ هەیڤا هەلبژارتی د ناڤ بەرنامەی دا
  if (records) {
   const filteredRecords = records.filter(r => {
    const d = new Date(r.created_at);
    return (d.getMonth() + 1) === selectedMonth && d.getFullYear() === selectedYear;
   });

   monthlyStats.patients = filteredRecords.length;
   monthlyStats.income = filteredRecords.reduce((sum, r) => sum + (Number(r.fee) || 0), 0);
   recentActivity = filteredRecords.slice(-6).reverse();
  }

  if (exps) {
   const filteredExps = exps.filter(e => {
    const d = new Date(e.created_at);
    return (d.getMonth() + 1) === selectedMonth && d.getFullYear() === selectedYear;
   });
   monthlyStats.expenses = filteredExps.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }

  monthlyStats.profit = monthlyStats.income - monthlyStats.expenses;
  isLoading = false;
 }
</script>

<div class="dashboard-container">
 <header class="dashboard-header">
  <div class="title-area">
   <h1>Performance Overview 🚀</h1>
   <p>ئامارێن کلینیکێ ل دویڤ هەیڤان</p>
  </div>
  
  <div class="controls">
   <select bind:value={selectedMonth} onchange={loadDashboard}>
    {#each months as m}<option value={m.id}>{m.name}</option>{/each}
   </select>
   <button class="refresh-btn" onclick={loadDashboard}>🔄 Update</button>
  </div>
 </header>

 {#if isLoading}
  <div class="loader">📊 Loading Analytics...</div>
 {:else}
  <!-- کارتێن جاران (شین، کەسک، سۆر، زەرد) -->
  <div class="stats-grid">
   <div class="stat-card blue">
    <p>Total Patients</p>
    <h3>{monthlyStats.patients}</h3>
   </div>
   <div class="stat-card green">
    <p>Monthly Income</p>
    <h3>${monthlyStats.income}</h3>
   </div>
   <div class="stat-card red">
    <p>Monthly Expenses</p>
    <h3>${monthlyStats.expenses}</h3>
   </div>
   <div class="stat-card gold">
    <p>Net Profit</p>
    <h3>${monthlyStats.profit}</h3>
   </div>
  </div>

  <div class="main-grid">
   <!-- گرافێ داهات و خەرجی -->
   <div class="card glass chart-card">
    <h3>📊 Income vs Expenses</h3>
    <div class="bar-container">
     <div class="bar-row">
      <!-- svelte-ignore a11y_label_has_associated_control -->
      <label>Income</label>
      <div class="bar-bg"><div class="bar-fill green" style="width: 100%"></div></div>
      <span class="val">${monthlyStats.income}</span>
     </div>
     <div class="bar-row">
      <!-- svelte-ignore a11y_label_has_associated_control -->
      <label>Expenses</label>
      <div class="bar-bg">
       <div class="bar-fill red" style="width: {monthlyStats.income > 0 ? (monthlyStats.expenses / monthlyStats.income) * 100 : 0}%"></div>
      </div>
      <span class="val">${monthlyStats.expenses}</span>
     </div>
    </div>
   </div>

   <!-- نویترین چالاکی -->
   <div class="card glass activity-card">
    <h3>🕒 Recent Activity</h3>
    <div class="list">{#each recentActivity as item}
      <div class="item">
       <b>{item.patients?.name || 'Patient'}</b>
       <span class="price">+${item.fee}</span>
      </div>
     {:else}
      <p class="empty">No records for this month.</p>
     {/each}
    </div>
   </div>
  </div>
 {/if}
</div>

<style>
 .dashboard-container { color: var(--text); padding: 10px; }
 .dashboard-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
 .refresh-btn { background: #4f46e5; color: white; border: none; padding: 10px 20px; border-radius: 12px; cursor: pointer; font-weight: bold; }
 select { padding: 10px; border-radius: 10px; border: 1px solid #ddd; background: white; color: black; font-weight: bold; }

 .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
 .stat-card { padding: 30px; border-radius: 20px; color: white; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); text-align: center; }
 
 .blue { background: #4f46e5; }
 .green { background: #10b981; }
 .red { background: #ef4444; }
 .gold { background: #f59e0b; }

 .stat-card h3 { margin: 10px 0 0; font-size: 2.2rem; font-weight: 900; }
 .stat-card p { margin: 0; font-size: 0.85rem; font-weight: bold; opacity: 0.9; text-transform: uppercase; }

 .main-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 25px; }
 @media (max-width: 1000px) { .main-grid { grid-template-columns: 1fr; } }

 .card { background: var(--card, white); padding: 25px; border-radius: 28px; border: 1px solid var(--border, #eee); }
 
 .bar-container { display: flex; flex-direction: column; gap: 20px; margin-top: 25px; }
 .bar-row { display: flex; align-items: center; gap: 15px; }
 .bar-row label { width: 70px; font-weight: bold; }
 .bar-bg { flex: 1; background: #f1f5f9; height: 12px; border-radius: 6px; overflow: hidden; }
 .bar-fill { height: 100%; transition: width 1s ease; }
 .bar-fill.green { background: #10b981; }
 .bar-fill.red { background: #f43f5e; }
 .val { width: 70px; text-align: right; font-weight: bold; }

 .item { display: flex; justify-content: space-between; padding: 12px; border-bottom: 1px solid rgba(0,0,0,0.05); }
 .price { color: #10b981; font-weight: bold; }
 .loader { text-align: center; padding: 100px; font-weight: bold; font-size: 1.2rem; }

 :global(.dark-mode) select { background: #1e293b; color: white; border-color: #334155; }
 :global(.dark-mode) .bar-bg { background: #334155; }
</style>
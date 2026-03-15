<script lang="ts">
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 // ١. گۆڕاوێن ئاماران
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

 // 📊 فانكشنا ئەسلى (بێ فلته‌رێ توند یێ كاتی)
 async function loadDashboard() {
  if (!doctorId) return;
  isLoading = true;
  
  console.log("Fetching data for Doctor ID:", doctorId);

  // ١. ئينانا هەمی داتايێن دكتۆرى بێى فلته‌رێ رۆژێ (دا پشتڕاست بین داتا دهێت)
  const { data: records, error: rErr } = await supabase.from('medical_records').select('fee, created_at, diagnosis, patients(name)').eq('doctor_id', doctorId);
  const { data: exps, error: eErr } = await supabase.from('expenses').select('amount, created_at').eq('doctor_id', doctorId);
  const { count: pCount } = await supabase.from('patients').select('*', { count: 'exact', head: true }).eq('doctor_id', doctorId);

  // ٢. فلته‌ركرنا داتايان ب ڕێكا JavaScript (بۆ هندێ خەلەتیێن Timezone نەمینن)
  if (records) {
   const filteredRecords = records.filter(r => {
    const d = new Date(r.created_at);
    return (d.getMonth() + 1) === selectedMonth && d.getFullYear() === selectedYear;
   });

   monthlyStats.patients = filteredRecords.length;
   monthlyStats.income = filteredRecords.reduce((sum, r) => sum + (Number(r.fee) || 0), 0);
   recentActivity = filteredRecords.slice(-5).reverse();
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

<div class="dashboard">
 <header class="dashboard-header">
  <div class="title-area">
   <h1>Performance Overview 🚀</h1>
   <p>Analytics for {months.find(m => m.id === selectedMonth)?.name} {selectedYear}</p>
  </div>
  
  <div class="controls">
   <select bind:value={selectedMonth} onchange={loadDashboard}>
    {#each months as m}<option value={m.id}>{m.name}</option>{/each}
   </select>
   <button class="refresh-btn" onclick={loadDashboard}>🔄 Update</button>
  </div>
 </header>

 {#if isLoading}
  <div class="loader">📊 Loading Clinic Data...</div>
 {:else}
  <div class="stats-grid">
   <div class="stat-card blue">
    <div class="info"><span>Total Patients</span><h3>{monthlyStats.patients}</h3></div>
    <div class="icon-bg">👥</div>
   </div>
   <div class="stat-card green">
    <div class="info"><span>Monthly Income</span><h3>${monthlyStats.income}</h3></div>
    <div class="icon-bg">💰</div>
   </div>
   <div class="stat-card red">
    <div class="info"><span>Monthly Expenses</span><h3>${monthlyStats.expenses}</h3></div>
    <div class="icon-bg">💸</div>
   </div>
   <div class="stat-card gold">
    <div class="info"><span>Net Profit</span><h3>${monthlyStats.profit}</h3></div>
    <div class="icon-bg">📈</div>
   </div>
  </div>

  <div class="main-grid">
   <div class="card glass chart-card">
    <h3>📊 Income vs Expenses</h3>
    <div class="bar-container">
     <div class="bar-row">
      <!-- svelte-ignore a11y_label_has_associated_control -->
      <label>Income</label>
      <div class="bar-bg"><div class="bar-fill green" style="width: 100%"></div></div>
      <span class="val">${monthlyStats.income}</span></div>
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

   <div class="card glass activity-card">
    <h3>🕒 Recent Activity</h3>
    <div class="list">
     {#each recentActivity as item}
      <div class="item">
       <b>{item.patients?.name || 'Unknown'}</b>
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
 .dashboard { color: var(--text); padding: 5px; }
 .dashboard-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
 .controls { display: flex; gap: 10px; }
 select { padding: 10px; border-radius: 12px; border: 1px solid #ddd; background: white; color: black; font-weight: bold; cursor: pointer; }
 .refresh-btn { background: #4f46e5; color: white; border: none; padding: 10px 20px; border-radius: 12px; cursor: pointer; font-weight: bold; }

 .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 30px; }
 .stat-card { padding: 25px; border-radius: 20px; display: flex; justify-content: space-between; align-items: center; color: white; box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
 
 .blue { background: #4f46e5; } .green { background: #10b981; } .red { background: #f43f5e; } .gold { background: #f59e0b; }
 .info h3 { margin: 5px 0 0; font-size: 1.8rem; font-weight: 900; }
 .icon-bg { font-size: 2.2rem; opacity: 0.3; }

 .main-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 25px; }
 @media (max-width: 1000px) { .main-grid { grid-template-columns: 1fr; } }

 .card { background: var(--card, white); padding: 25px; border-radius: 28px; border: 1px solid var(--border, #eee); }
 .bar-container { display: flex; flex-direction: column; gap: 20px; margin-top: 25px; }
 .bar-row { display: flex; align-items: center; gap: 15px; }
 .bar-bg { flex: 1; background: #f1f5f9; height: 12px; border-radius: 6px; overflow: hidden; }
 .bar-fill { height: 100%; transition: width 1s ease; }
 .bar-fill.green { background: #10b981; } .bar-fill.red { background: #f43f5e; }
 .val { width: 70px; text-align: right; font-weight: bold; }

 .item { display: flex; justify-content: space-between; padding: 12px; border-bottom: 1px solid rgba(0,0,0,0.05); }
 .price { color: #10b981; font-weight: bold; }
 .loader { text-align: center; padding: 100px; font-size: 1.2rem; font-weight: bold; color: #4f46e5; }
 .empty { text-align: center; padding: 30px; color: #999; }

 :global(.dark-mode) select { background: #1e293b; color: white; border-color: #334155; }
 :global(.dark-mode) .bar-bg { background: #334155; }
</style>
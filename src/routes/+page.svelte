<script lang="ts">
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 // ١. گۆڕاوە سەرەکییەکان
 let doctorId = $state(0);
 let isLoading = $state(true);
 
 // هەڵبژاردنی مانگ و ساڵ (بە شێوەی خۆکار مانگی ئێستا دادەنێت)
 let selectedMonth = $state(new Date().getMonth() + 1); 
 let selectedYear = $state(new Date().getFullYear());

 let monthlyStats = $state({
  patients: 0,
  income: 0,
  expenses: 0,
  profit: 0
 });

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

 // 📊 فانکشنی هێنانەوەی داتا (ڕاستکراوە بۆ ئەوەی ٠ نیشان نەدات)
 async function loadDashboard() {
  if (!doctorId) return;
  isLoading = true;
  
  // دروستکردنی مەودای کاتی (سەرەتای مانگ و کۆتایی مانگ)
  const startDate = new Date(selectedYear, selectedMonth - 1, 1).toISOString();
  const endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59).toISOString();

  // ١. هێنانەوەی داهات و نەخۆشەکان
  const { data: records, error: recError } = await supabase
   .from('medical_records')
   .select('fee, created_at, diagnosis, patients(name)')
   .eq('doctor_id', doctorId)
   .gte('created_at', startDate)
   .lte('created_at', endDate);

  // ٢. هێنانەوەی خەرجییەکان
  const { data: exps, error: expError } = await supabase
   .from('expenses')
   .select('amount, created_at')
   .eq('doctor_id', doctorId)
   .gte('created_at', startDate)
   .lte('created_at', endDate);

  if (records) {
   monthlyStats.patients = records.length;
   // کۆکردنەوەی پارەی نەخۆشەکان
   monthlyStats.income = records.reduce((sum, r) => sum + (Number(r.fee) || 0), 0);
   recentActivity = records.slice(-5).reverse();
  } else {
   monthlyStats.patients = 0;
   monthlyStats.income = 0;
  }

  if (exps) {
   // کۆکردنەوەی خەرجییەکان
   monthlyStats.expenses = exps.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  } else {
   monthlyStats.expenses = 0;
  }

  // ئەژمارکردنی قازانج
  monthlyStats.profit = monthlyStats.income - monthlyStats.expenses;
  isLoading = false;
 }

 function printMonthlyReport() {
  const monthName = months.find(m => m.id === selectedMonth)?.name;
  const win = window.open('', '', 'width=900,height=1000');
  win?.document.write(`
   <div style="font-family:sans-serif; padding:50px; border:2px solid #4f46e5; border-radius:15px;">
    <h1 style="text-align:center; color:#4f46e5;">Monthly Performance Report</h1>
    <p style="text-align:center; font-size:18px;">${monthName} ${selectedYear}</p>
    <hr>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin:30px 0; font-size:20px;">
     <div style="padding:20px; background:#f0f9ff; border-radius:10px;"><b>Patients:</b> ${monthlyStats.patients}</div>
     <div style="padding:20px; background:#f0fdf4; border-radius:10px;"><b>Income:</b> $${monthlyStats.income}</div>
     <div style="padding:20px; background:#fef2f2; border-radius:10px;"><b>Expenses:</b> $${monthlyStats.expenses}</div>
     <div style="padding:20px; background:#eef2ff; border-radius:10px;"><b>Net Profit:</b> $${monthlyStats.profit}</div>
    </div>
   </div>
  `);
  win?.document.close();
  win?.print();
 }
</script>

<div class="dashboard">
 <header class="dashboard-header">
  <div class="title-area">
   <h1>Performance Overview 🚀</h1>
   <p>ئامارێن هوور یێن کلینیکێ ل دویڤ هەیڤان</p>
  </div>
  
  <div class="controls">
   <select bind:value={selectedMonth} onchange={loadDashboard}>
    {#each months as m}<option value={m.id}>{m.name}</option>{/each}
   </select>
   <select bind:value={selectedYear} onchange={loadDashboard}>
    <option value={2025}>2025</option><option value={2026}>2026</option>
   </select>
   <button class="print-btn" onclick={printMonthlyReport}>🖨️ Print Report</button>
  </div>
 </header>

 {#if isLoading}
  <div class="loader">Loading Data...</div>
 {:else}
  <div class="stats-grid">
   <div class="stat-card blue">
    <div class="info"><span>Total Patients</span><h3>{monthlyStats.patients}</h3></div>
    <div class="icon-bg">👥</div>
   </div>
   <div class="stat-card green">
    <div class="info"><span>Total Income</span><h3>${monthlyStats.income}</h3></div>
    <div class="icon-bg">💰</div>
   </div>
   <div class="stat-card red">
    <div class="info"><span>Expenses</span><h3>${monthlyStats.expenses}</h3></div>
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
      <span class="val">${monthlyStats.income}</span>
     </div>
     <div class="bar-row">
      <!-- svelte-ignore a11y_label_has_associated_control -->
      <label>Expenses</label>
      <div class="bar-bg">
       <div class="bar-fill red" style="width: {(monthlyStats.expenses / (monthlyStats.income || 1)) * 100}%"></div>
      </div>
      <span class="val">${monthlyStats.expenses}</span>
     </div>
    </div>
   </div>

   <div class="card glass list-card">
    <h3>🕒 Recent Activity</h3>
    <div class="activity-list">
     {#each recentActivity as item}
      <div class="item">
       <b>{item.patients?.name || 'Patient'}</b>
       <span class="price">+${item.fee}</span>
      </div>
     {:else}
      <p class="empty">No records found for this month.</p>
     {/each}
    </div>
   </div>
  </div>
 {/if}
</div>

<style>
 .dashboard { color: var(--text); padding: 5px; }
 .dashboard-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; flex-wrap: wrap; gap: 20px; }
 .controls { display: flex; gap: 10px; }
 select { padding: 10px; border-radius: 10px; border: 1px solid #ddd; background: white; color: black; font-weight: bold; }
 .print-btn { background: #4f46e5; color: white; border: none; padding: 10px 20px; border-radius: 10px; cursor: pointer; font-weight: bold; }

 .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
 .stat-card { padding: 25px; border-radius: 20px; display: flex; justify-content: space-between; align-items: center; color: white; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
 
 .blue { background: #4f46e5; }
 .green { background: #10b981; }
 .red { background: #f43f5e; }
 .gold { background: #f59e0b; }

 .info span { font-size: 0.8rem; font-weight: 600; opacity: 0.9; }
 .info h3 { margin: 5px 0 0; font-size: 1.8rem; font-weight: 900; }
 .icon-bg { font-size: 2rem; opacity: 0.3; }

 .main-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 25px; }
 @media (max-width: 1000px) { .main-grid { grid-template-columns: 1fr; } }

 .card { background: var(--card, white); padding: 25px; border-radius: 25px; border: 1px solid var(--border, #eee); }
 
 .bar-container { display: flex; flex-direction: column; gap: 20px; margin-top: 20px; }
 .bar-row { display: flex; align-items: center; gap: 15px; }
 .bar-row label { width: 70px; font-size: 0.8rem; font-weight: bold; }
 .bar-bg { flex: 1; background: #f1f5f9; height: 12px; border-radius: 6px; overflow: hidden; }
 .bar-fill { height: 100%; transition: width 1s; }
 .bar-fill.green { background: #10b981; }
 .bar-fill.red { background: #f43f5e; }
 .val { width: 60px; text-align: right; font-weight: bold; }

 .item { display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid rgba(0,0,0,0.05); }
 .price { color: #10b981; font-weight: bold; }
 .loader { text-align: center; padding: 50px; font-weight: bold; }:global(.dark-mode) select { background: #1e293b; color: white; border-color: #334155; }
 :global(.dark-mode) .bar-bg { background: #334155; }
</style>
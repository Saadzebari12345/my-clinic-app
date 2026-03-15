<script lang="ts">
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 // ١. گۆڕاوێن سەرەکی یێن ئاماران
 let doctorId = $state(0);
 let isLoading = $state(true);
 
 let selectedMonth = $state(new Date().getMonth() + 1); 
 let selectedYear = $state(new Date().getFullYear());

 let stats = $state({ totalPatients: 0, todayIncome: 0, totalIncome: 0, totalExpenses: 0, netProfit: 0 });
 let monthlyData = $state({ patients: 0, income: 0, expenses: 0, profit: 0 });
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
  isLoading = true;
  const now = new Date();
  const todayStr = now.toDateString();

  // ئینانا هەمی داتایان ژ داتابەیسێ
  const { count: pCount } = await supabase.from('patients').select('*', { count: 'exact', head: true }).eq('doctor_id', doctorId);
  const { data: records } = await supabase.from('medical_records').select('fee, created_at, patients(name)').eq('doctor_id', doctorId);
  const { data: exps } = await supabase.from('expenses').select('amount, created_at').eq('doctor_id', doctorId);

  // حسابکرنا داتایان ب ڕێکا JavaScript (بۆ هندێ چو تشت بەرزە نەبن)
  if (records) {
   let tInc = 0; let dInc = 0; let mInc = 0; let mPat = 0;
   
   records.forEach(r => {
    const rFee = Number(r.fee) || 0;
    tInc += rFee; // کۆما گشتی

    if (r.created_at) {
     const rDate = new Date(r.created_at);
     if (rDate.toDateString() === todayStr) dInc += rFee;
     if ((rDate.getMonth() + 1) === selectedMonth && rDate.getFullYear() === selectedYear) {
      mInc += rFee;
      mPat++;
     }
    }
   });

   stats.totalIncome = tInc;
   stats.todayIncome = dInc;
   monthlyData.income = mInc;
   monthlyData.patients = mPat;
   recentActivity = records.slice(-5).reverse();
  }

  if (exps) {
   let tExp = 0; let mExp = 0;
   exps.forEach(e => {
    const eAmt = Number(e.amount) || 0;
    tExp += eAmt;
    if (e.created_at) {
     const eDate = new Date(e.created_at);
     if ((eDate.getMonth() + 1) === selectedMonth && eDate.getFullYear() === selectedYear) mExp += eAmt;
    }
   });
   stats.totalExpenses = tExp;
   monthlyData.expenses = mExp;
  }

  stats.totalPatients = pCount || 0;
  stats.netProfit = stats.totalIncome - stats.totalExpenses;
  monthlyData.profit = monthlyData.income - monthlyData.expenses;
  isLoading = false;
 }
</script>

<div class="dashboard">
 <!-- Top Bar -->
 <header class="header">
  <div class="title">
   <h1>Performance Overview 🚀</h1>
   <p>Analytics for {months.find(m => m.id === selectedMonth)?.name} {selectedYear}</p>
  </div>
  <div class="controls">
   <select bind:value={selectedMonth} onchange={loadDashboard}>
    {#each months as m}<option value={m.id}>{m.name}</option>{/each}
   </select>
   <button class="btn-up" onclick={loadDashboard}>🔄 Update</button>
  </div>
 </header>

 {#if isLoading}
  <div class="loading-state">📊 Loading Clinic Data...</div>
 {:else}
  <!-- کارتێن ئامارێن سەرەکی (ڕەنگاوڕەنگ) -->
  <div class="stats-grid">
   <div class="stat-card blue">
    <p>Total Patients</p>
    <h3>{stats.totalPatients}</h3>
   </div>
   <div class="stat-card green">
    <p>Today's Income</p>
    <h3>${stats.todayIncome}</h3>
   </div>
   <div class="stat-card indigo">
    <p>Total Income</p>
    <h3>${stats.totalIncome}</h3>
   </div>
   <div class="stat-card red">
    <p>Total Expenses</p>
    <h3>${stats.totalExpenses}</h3>
   </div>
  </div>

  <div class="main-grid">
   <!-- ڕاپۆرتا مەهانە (یا تەمام و ڕێکوپێک) -->
   <div class="card glass">
    <div class="card-head">
     <h3>📊 Monthly Report</h3><span class="month-label">{months.find(m => m.id === selectedMonth)?.name}</span>
    </div>
    <div class="report-body">
     <div class="r-item"><span>Monthly Income:</span> <b style="color:#10b981">+${monthlyData.income}</b></div>
     <div class="r-item"><span>Monthly Expenses:</span> <b style="color:#f43f5e">-${monthlyData.expenses}</b></div>
     <div class="r-total">
      <p>Net Profit for this Month</p>
      <h2 style="color: {monthlyData.profit >= 0 ? '#10b981' : '#f43f5e'}">${monthlyData.profit}</h2>
     </div>
    </div>
   </div>

   <!-- نویترین چالاکی -->
   <div class="card glass">
    <h3>🕒 Recent Activity</h3>
    <div class="activity-list">
     {#each recentActivity as item}
      <div class="activity-row">
       <span>{item.patients?.name || 'Patient'}</span>
       <b>+${item.fee}</b>
      </div>
     {:else}
      <p class="empty">No records found for this period.</p>
     {/each}
    </div>
   </div>
  </div>
 {/if}
</div>

<style>
 .dashboard { color: var(--text); padding: 10px; font-family: sans-serif; }
 .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; flex-wrap: wrap; gap: 15px; }
 .header h1 { margin: 0; font-size: 1.6rem; font-weight: 800; color: #4f46e5; }
 
 .controls { display: flex; gap: 10px; }
 select { padding: 10px; border-radius: 10px; border: 1px solid #ddd; background: white; color: black; font-weight: bold; cursor: pointer; }
 .btn-up { background: #4f46e5; color: white; border: none; padding: 10px 20px; border-radius: 10px; cursor: pointer; font-weight: bold; }

 .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 30px; }
 .stat-card { padding: 25px; border-radius: 20px; color: white; text-align: center; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); transition: 0.3s; }
 .stat-card:hover { transform: translateY(-5px); }
 
 .blue { background: linear-gradient(135deg, #6366f1, #4338ca); }
 .green { background: linear-gradient(135deg, #10b981, #059669); }
 .indigo { background: linear-gradient(135deg, #818cf8, #4f46e5); }
 .red { background: linear-gradient(135deg, #f43f5e, #be123c); }
 .stat-card h3 { margin: 10px 0 0; font-size: 2rem; font-weight: 900; }
 .stat-card p { margin: 0; font-size: 0.8rem; font-weight: bold; opacity: 0.8; text-transform: uppercase; }

 .main-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 25px; }
 @media (max-width: 1000px) { .main-grid { grid-template-columns: 1fr; } }

 .card { background: var(--card, white); padding: 30px; border-radius: 25px; border: 1px solid var(--border, #eee); box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
 .card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
 .month-label { background: #eef2ff; color: #4f46e5; padding: 5px 12px; border-radius: 20px; font-weight: bold; font-size: 0.8rem; }

 .r-item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid rgba(0,0,0,0.05); }
 .r-total { text-align: center; margin-top: 25px; padding-top: 15px; border-top: 2px dashed #eee; }
 .r-total h2 { font-size: 2.5rem; margin: 5px 0; font-weight: 900; }

 .activity-row { display: flex; justify-content: space-between; padding: 12px; background: rgba(0,0,0,0.03); border-radius: 12px; margin-bottom: 10px; }
 .loading-state { text-align: center; padding: 100px; font-weight: bold; font-size: 1.2rem; }

 :global(.dark-mode) .card { background: #1e293b; border-color: #334155; }
 :global(.dark-mode) .activity-row { background: #0f172a; }
 :global(.dark-mode) select { background: #1e293b; color: white; border-color: #334155; }
</style>
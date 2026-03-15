<script lang="ts">
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 // ١. لێرە مە todayVisits زێدە کر دا خەلەتی نەمینیت
 let stats = $state({
  totalPatients: 0,
  todayIncome: 0,
  totalIncome: 0,
  totalExpenses: 0,
  netProfit: 0,
  todayVisits: 0
 });

 let monthlyReport = $state({ patients: 0, income: 0, expenses: 0, profit: 0, show: false });
 let recentVisits = $state<any[]>([]);
 let doctorId = $state(0);
 let isLoading = $state(true);

 onMount(async () => {
  const storedId = localStorage.getItem('doctor_id');
  if (storedId) {
   doctorId = Number(storedId);
   await refreshData();
  }
 });

 async function refreshData() {
  isLoading = true;
  
  const now = new Date();
  const todayStr = now.toDateString(); 
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // --- ١. ئینانا ژمارەیا نەخۆشان ---
  const { count: pCount } = await supabase.from('patients').select('*', { count: 'exact', head: true }).eq('doctor_id', doctorId);
  stats.totalPatients = pCount || 0;

  // --- ٢. ئینانا داتایێن دارایی ---
  const { data: allRecords } = await supabase
   .from('medical_records')
   .select('fee, created_at, diagnosis, patients(name)')
   .eq('doctor_id', doctorId);

  if (allRecords) {
   let tempTotalIncome = 0;
   let tempTodayIncome = 0;
   let tempMonthIncome = 0;
   let tempMonthPatients = 0;
   let tempTodayVisits = 0;

   allRecords.forEach(r => {
    const rDate = new Date(r.created_at);
    const rFee = Number(r.fee) || 0;

    tempTotalIncome += rFee;

    if (rDate.toDateString() === todayStr) {
     tempTodayIncome += rFee;
     tempTodayVisits += 1;
    }

    if (rDate.getMonth() === currentMonth && rDate.getFullYear() === currentYear) {
     tempMonthIncome += rFee;
     tempMonthPatients += 1;
    }
   });

   stats.totalIncome = tempTotalIncome;
   stats.todayIncome = tempTodayIncome;
   stats.todayVisits = tempTodayVisits;
   monthlyReport.income = tempMonthIncome;
   monthlyReport.patients = tempMonthPatients;
   recentVisits = allRecords.slice(-6).reverse();
  }

  // --- ٣. ئینانا خەرجییان ---
  const { data: allExpenses } = await supabase.from('expenses').select('amount, created_at').eq('doctor_id', doctorId);

  if (allExpenses) {
   let tempTotalExp = 0;
   let tempMonthExp = 0;

   allExpenses.forEach(e => {
    const eDate = new Date(e.created_at);
    const eAmount = Number(e.amount) || 0;
    tempTotalExp += eAmount;

    if (eDate.getMonth() === currentMonth && eDate.getFullYear() === currentYear) {
     tempMonthExp += eAmount;
    }
   });

   stats.totalExpenses = tempTotalExp;
   monthlyReport.expenses = tempMonthExp;
  }

  stats.netProfit = stats.totalIncome - stats.totalExpenses;
  monthlyReport.profit = monthlyReport.income - monthlyReport.expenses;
  
  isLoading = false;
 }
</script>

<div class="dashboard-wrapper">
 <header class="header">
  <h1>ناڤەندا کۆنترۆڵا کلینیکێ 🏥</h1>
  <div class="header-btns">
   <button class="refresh-btn" onclick={refreshData}>{isLoading ? '...' : '🔄 Update'}</button>
   <button class="report-btn" onclick={() => monthlyReport.show = true}>📊 Monthly Report</button>
  </div>
 </header>

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

 <div class="grid-main">
  <div class="card glass">
   <h3>📈 Net Profit</h3>
   <div class="profit-val" style="color: {stats.netProfit >= 0 ? '#10b981' : '#f43f5e'}">
    ${stats.netProfit}
   </div>
   <div class="summary-list">
    <div class="sum-item"><span>Earned:</span> <b style="color:#10b981">+${stats.totalIncome}</b></div>
    <div class="sum-item"><span>Spent:</span> <b style="color:#f43f5e">-${stats.totalExpenses}</b></div>
   </div>
  </div><div class="card glass">
   <h3>🕒 Recent Activity</h3>
   <div class="recent-list">
    {#each recentVisits as v}
     <div class="v-row">
      <span>{v.patients?.name || 'Unknown'}</span>
      <b style="color:#10b981">+${v.fee}</b>
     </div>
    {:else}
     <p class="empty">No income records found.</p>
    {/each}
   </div>
  </div>
 </div>
</div>

{#if monthlyReport.show}
 <!-- svelte-ignore a11y_click_events_have_key_events -->
 <!-- svelte-ignore a11y_no_static_element_interactions -->
 <div class="modal-overlay" onclick={() => monthlyReport.show = false}>
  <div class="modal-card" onclick={e => e.stopPropagation()}>
   <h3>📊 Monthly Analytics ({new Date().toLocaleString('default', {month:'long'})})</h3>
   <hr style="opacity:0.2" />
   <div class="m-row"><span>Visits:</span> <b>{monthlyReport.patients}</b></div>
   <div class="m-row"><span>Income:</span> <b style="color:#10b981">+${monthlyReport.income}</b></div>
   <div class="m-row"><span>Expenses:</span> <b style="color:#f43f5e">-${monthlyReport.expenses}</b></div>
   <div class="m-total">
    <p>Net Profit This Month</p>
    <h2 style="color: {monthlyReport.profit >= 0 ? '#10b981' : '#f43f5e'}">${monthlyReport.profit}</h2>
   </div>
   <button class="close-btn" onclick={() => monthlyReport.show = false}>Close</button>
  </div>
 </div>
{/if}

<style>
 .dashboard-wrapper { color: var(--text); padding: 10px; font-family: sans-serif; }
 .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
 .header-btns { display: flex; gap: 10px; }
 .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
 .stat-card { padding: 25px; border-radius: 20px; color: white; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
 .blue { background: linear-gradient(135deg, #6366f1, #4338ca); }
 .green { background: linear-gradient(135deg, #10b981, #059669); }
 .indigo { background: linear-gradient(135deg, #818cf8, #4f46e5); }
 .red { background: linear-gradient(135deg, #f43f5e, #be123c); }
 h3 { margin: 5px 0 0; font-size: 1.8rem; font-weight: 800; }
 p { margin: 0; font-size: 0.8rem; font-weight: bold; opacity: 0.8; }
 .grid-main { display: grid; grid-template-columns: 1fr 1.5fr; gap: 25px; }
 .card { background: var(--card, white); padding: 30px; border-radius: 25px; border: 1px solid var(--border, #eee); }
 .profit-val { font-size: 3rem; font-weight: 900; text-align: center; margin: 20px 0; }
 .sum-item, .m-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(0,0,0,0.05); }
 .v-row { display: flex; justify-content: space-between; padding: 12px; background: rgba(0,0,0,0.03); border-radius: 12px; margin-bottom: 8px; }
 .report-btn { background: #4f46e5; color: white; border: none; padding: 10px 20px; border-radius: 12px; cursor: pointer; font-weight: bold; }
 .refresh-btn { background: #f3f4f6; color: #333; border: 1px solid #ddd; padding: 10px 20px; border-radius: 12px; cursor: pointer; }
 .modal-overlay { position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 1000; }
 .modal-card { background: white; width: 450px; padding: 30px; border-radius: 25px; color: #333; }
 .m-total { text-align: center; margin-top: 25px; padding-top: 15px; border-top: 2px dashed #eee; }
 .close-btn { width: 100%; margin-top: 20px; padding: 12px; background: #333; color: white; border: none; border-radius: 12px; cursor: pointer; }
 :global(.dark-mode) .card, :global(.dark-mode) .modal-card, :global(.dark-mode) .v-row { background: #1e293b; color: white; border-color: #334155; }
</style>
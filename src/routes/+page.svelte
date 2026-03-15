<script lang="ts">
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 // ١. گۆڕاوێن ئاماران
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
  // کاتێ دەسپێکا ئەڤرۆ (سەعەت ٠٠:٠٠)
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  // کاتێ دەسپێکا ڤێ هەیڤێ
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // ١. ئینانا ژمارەیا نەخۆشێن گشتی
  const { count: pCount } = await supabase.from('patients').select('*', { count: 'exact', head: true }).eq('doctor_id', doctorId);
  
  // ٢. ئینانا داهاتی (Medical Records)
  const { data: allRecords } = await supabase.from('medical_records').select('fee, created_at, diagnosis, patients(name)').eq('doctor_id', doctorId);
  
  // ٣. ئینانا خەرجییان (Expenses)
  const { data: allExpenses } = await supabase.from('expenses').select('amount, created_at').eq('doctor_id', doctorId);

  if (allRecords) {
   // حسابکرنا داهاتێ گشتی
   stats.totalIncome = allRecords.reduce((s, r) => s + (Number(r.fee) || 0), 0);
   
   // ✅ ڕاستکرنا داهاتێ ئەڤرۆ (هەر داتایەکا پشتی سەعەت ١٢ی شەڤێ بێت)
   stats.todayIncome = allRecords
    .filter(r => r.created_at >= startOfToday)
    .reduce((s, r) => s + (Number(r.fee) || 0), 0);

   stats.todayVisits = allRecords.filter(r => r.created_at >= startOfToday).length;
   recentVisits = allRecords.slice(-5).reverse();

   // حسابکرنا داتایێن مەهانە
   monthlyReport.income = allRecords
    .filter(r => r.created_at >= startOfMonth)
    .reduce((s, r) => s + (Number(r.fee) || 0), 0);
   monthlyReport.patients = allRecords.filter(r => r.created_at >= startOfMonth).length;
  }

  if (allExpenses) {
   stats.totalExpenses = allExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
   monthlyReport.expenses = allExpenses
    .filter(e => e.created_at >= startOfMonth)
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);
  }

  stats.totalPatients = pCount || 0;
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
    <div class="sum-item"><span>Total Earned:</span> <b style="color:#10b981">+${stats.totalIncome}</b></div>
    <div class="sum-item"><span>Total Spent:</span> <b style="color:#f43f5e">-${stats.totalExpenses}</b></div>
   </div>
  </div>

  <div class="card glass">
   <h3>🕒 Recent Activity</h3>
   <div class="recent-list">
    {#each recentVisits as v}
     <div class="v-row">
      <span>{v.patients?.name || 'Unknown'}</span><b style="color:#10b981">+${v.fee}</b>
     </div>
    {:else}
     <p class="empty">No recent visits.</p>
    {/each}
   </div>
  </div>
 </div>
</div>

{#if monthlyReport.show}
 <!-- svelte-ignore a11y_no_static_element_interactions -->
 <!-- svelte-ignore a11y_click_events_have_key_events -->
 <div class="modal-overlay" onclick={() => monthlyReport.show = false}>
  <div class="modal-card" onclick={e => e.stopPropagation()}>
   <h3>📊 Monthly Analytics (${new Date().toLocaleString('default', {month:'long'})})</h3>
   <hr />
   <div class="m-row"><span>New Patients:</span> <b>{monthlyReport.patients}</b></div>
   <div class="m-row"><span>Monthly Income:</span> <b style="color:#10b981">+${monthlyReport.income}</b></div>
   <div class="m-row"><span>Monthly Expenses:</span> <b style="color:#f43f5e">-${monthlyReport.expenses}</b></div>
   <div class="m-total">
    <p>Net Profit This Month</p>
    <h2 style="color: {monthlyReport.profit >= 0 ? '#10b981' : '#f43f5e'}">${monthlyReport.profit}</h2>
   </div>
   <button class="close-btn" onclick={() => monthlyReport.show = false}>Close</button>
  </div>
 </div>
{/if}

<style>
 .dashboard-wrapper { color: var(--text); padding: 10px; }
 .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
 .header-btns { display: flex; gap: 10px; }
 
 .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
 .stat-card { padding: 25px; border-radius: 20px; color: white; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
 .blue { background: linear-gradient(135deg, #6366f1, #4338ca); }
 .green { background: linear-gradient(135deg, #10b981, #059669); }
 .indigo { background: linear-gradient(135deg, #818cf8, #4f46e5); }
 .red { background: linear-gradient(135deg, #f43f5e, #be123c); }
 h3 { margin: 5px 0 0; font-size: 1.8rem; font-weight: 800; }

 .grid-main { display: grid; grid-template-columns: 1fr 1.5fr; gap: 25px; }
 .card { background: var(--card, white); padding: 30px; border-radius: 25px; border: 1px solid var(--border, #eee); }
 .profit-val { font-size: 3rem; font-weight: 900; text-align: center; margin: 20px 0; }
 
 .sum-item, .m-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(0,0,0,0.05); }
 .v-row { display: flex; justify-content: space-between; padding: 12px; background: rgba(0,0,0,0.02); border-radius: 12px; margin-bottom: 8px; }

 .report-btn { background: #4f46e5; color: white; border: none; padding: 10px 20px; border-radius: 12px; cursor: pointer; font-weight: bold; }
 .refresh-btn { background: #f3f4f6; color: #333; border: 1px solid #ddd; padding: 10px 20px; border-radius: 12px; cursor: pointer; }

 .modal-overlay { position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 1000; }
 .modal-card { background: white; width: 450px; padding: 30px; border-radius: 25px; color: #333; }
 .m-total { text-align: center; margin-top: 25px; padding-top: 15px; border-top: 2px dashed #eee; }
 .close-btn { width: 100%; margin-top: 20px; padding: 12px; background: #333; color: white; border: none; border-radius: 12px; cursor: pointer; }

 :global(.dark-mode) .card, :global(.dark-mode) .modal-card, :global(.dark-mode) .v-row { background: #1e293b; color: white; border-color: #334155; }
</style>
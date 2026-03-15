<script lang="ts">
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 let stats = $state({ totalPatients: 0, todayIncome: 0, totalIncome: 0, totalExpenses: 0, netProfit: 0 });
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

  // ١. ئینانا هەمی داتایان ب ئێکجار
  const { count: pCount } = await supabase.from('patients').select('*', { count: 'exact', head: true }).eq('doctor_id', doctorId);
  const { data: records } = await supabase.from('medical_records').select('fee, created_at, patients(name)').eq('doctor_id', doctorId);
  const { data: exps } = await supabase.from('expenses').select('amount, created_at').eq('doctor_id', doctorId);

  // ٢. حسابکرنا داهاتی (حتی ئەگەر created_at خەلەت بیت)
  if (records) {
   let tIncome = 0; let dIncome = 0; let mIncome = 0;
   
   records.forEach(r => {
    const rFee = Number(r.fee) || 0;
    tIncome += rFee; // کۆما گشتی هەمیشە زێدە دبیت

    if (r.created_at) {
     const rDate = new Date(r.created_at);
     if (rDate.toDateString() === todayStr) dIncome += rFee;
     if (rDate.getMonth() === currentMonth && rDate.getFullYear() === currentYear) mIncome += rFee;
    } else {
     // ئەگەر کات NULL بوو، ل داهاتێ ئەڤرۆ حساب بکە دا سفر نیشان نەدەت
     dIncome += rFee;
     mIncome += rFee;
    }
   });

   stats.totalIncome = tIncome;
   stats.todayIncome = dIncome;
   monthlyReport.income = mIncome;
   recentVisits = records.slice(-6).reverse();
  }

  // ٣. حسابکرنا خەرجییان
  if (exps) {
   let tExp = 0; let mExp = 0;
   exps.forEach(e => {
    const eAmt = Number(e.amount) || 0;
    tExp += eAmt;
    if (e.created_at) {
     const eDate = new Date(e.created_at);
     if (eDate.getMonth() === currentMonth && eDate.getFullYear() === currentYear) mExp += eAmt;
    } else {
     mExp += eAmt;
    }
   });
   stats.totalExpenses = tExp;
   monthlyReport.expenses = mExp;
  }

  stats.totalPatients = pCount || 0;
  stats.netProfit = stats.totalIncome - stats.totalExpenses;
  monthlyReport.profit = monthlyReport.income - monthlyReport.expenses;
  isLoading = false;
 }
</script>

<div class="dashboard-container">
 <header class="header">
  <h1>ناڤەندا کۆنترۆڵا کلینیکێ 👋</h1>
  <div class="btns">
   <button onclick={refreshData} class="refresh-btn">🔄 {isLoading ? '...' : 'Update'}</button>
   <button onclick={() => monthlyReport.show = true} class="report-btn">📊 Monthly</button>
  </div>
 </header>

 <div class="stats-grid">
  <div class="stat-card blue"><p>Total Patients</p><h3>{stats.totalPatients}</h3></div>
  <div class="stat-card green"><p>Today's Income</p><h3>${stats.todayIncome}</h3></div>
  <div class="stat-card indigo"><p>Total Income</p><h3>${stats.totalIncome}</h3></div>
  <div class="stat-card red"><p>Total Expenses</p><h3>${stats.totalExpenses}</h3></div>
 </div>

 <div class="main-layout">
  <div class="card glass">
   <h3>📈 Net Profit</h3>
   <h2 style="color: {stats.netProfit >= 0 ? '#10b981' : '#f43f5e'}">${stats.netProfit}</h2>
   <div class="profit-bar">
    <div class="income-bar" style="width: 100%">Income: ${stats.totalIncome}</div>
    <div class="expense-bar" style="width: {stats.totalIncome > 0 ? (stats.totalExpenses / stats.totalIncome) * 100 : 0}%">Expense: ${stats.totalExpenses}</div>
   </div>
  </div>

  <div class="card glass">
   <h3>🕒 Recent Activity</h3>
   {#each recentVisits as v}
    <div class="row"><span>{v.patients?.name || 'Patient'}</span> <b>+${v.fee}</b></div>
   {:else}
    <p class="empty">No records found.</p>
   {/each}
  </div>
 </div>
</div>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
{#if monthlyReport.show}<div class="modal" onclick={() => monthlyReport.show = false}>
  <div class="modal-card" onclick={e => e.stopPropagation()}>
   <h3>📊 Monthly Report</h3>
   <div class="m-row"><span>Income:</span> <b style="color:green">+${monthlyReport.income}</b></div>
   <div class="m-row"><span>Expenses:</span> <b style="color:red">-${monthlyReport.expenses}</b></div>
   <div class="m-total"><span>Profit:</span> <h2>${monthlyReport.profit}</h2></div>
   <button class="close-btn" onclick={() => monthlyReport.show = false}>Close</button>
  </div>
 </div>
{/if}

<style>
 .dashboard-container { color: var(--text); padding: 15px; font-family: sans-serif; }
 .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
 .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }
 .stat-card { padding: 25px; border-radius: 20px; color: white; text-align: center; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
 .blue { background: #4f46e5; } .green { background: #10b981; } .indigo { background: #6366f1; } .red { background: #f43f5e; }
 
 .main-layout { display: grid; grid-template-columns: 1fr 1.5fr; gap: 20px; }
 .card { background: var(--card, white); padding: 25px; border-radius: 20px; border: 1px solid var(--border); }
 
 .profit-bar { margin-top: 20px; background: #f1f5f9; height: 40px; border-radius: 10px; overflow: hidden; position: relative; }
 .income-bar { background: #10b981; height: 50%; color: white; font-size: 0.7rem; padding-left: 10px; display: flex; align-items: center; }
 .expense-bar { background: #f43f5e; height: 50%; color: white; font-size: 0.7rem; padding-left: 10px; display: flex; align-items: center; transition: 0.5s; }

 .row { display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid rgba(0,0,0,0.05); }
 .modal { position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 1000; }
 .modal-card { background: white; width: 400px; padding: 30px; border-radius: 20px; color: #333; }
 .m-row { display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid #eee; }
 
 .refresh-btn { background: #eee; color: #333; border: 1px solid #ddd; padding: 10px 15px; border-radius: 10px; cursor: pointer; }
 .report-btn { background: #4f46e5; color: white; border: none; padding: 10px 15px; border-radius: 10px; cursor: pointer; font-weight: bold; }
</style>
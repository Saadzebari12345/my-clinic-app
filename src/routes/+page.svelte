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

 // گۆڕاوێن ڕاپۆرتا مەهانە
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
  
  // دیارکرنا کاتێ ئەڤرۆ و دەسپێکا ڤێ هەیڤێ
  const now = new Date();
  const todayStr = now.toLocaleDateString('en-CA'); // YYYY-MM-DD
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // ١. ئینانا هەمی نەخۆشان
  const { count: pCount } = await supabase.from('patients').select('*', { count: 'exact', head: true }).eq('doctor_id', doctorId);
  
  // ٢. ئینانا ڕاپۆرتێن پزیشکی (Income)
  const { data: records } = await supabase.from('medical_records').select('fee, created_at, diagnosis, patients(name)').eq('doctor_id', doctorId);
  
  // ٣. ئینانا خەرجییان (Expenses)
  const { data: exps } = await supabase.from('expenses').select('amount, created_at').eq('doctor_id', doctorId);

  if (records) {
   // حسابکرنا داهاتێ گشتی
   stats.totalIncome = records.reduce((s, r) => s + (Number(r.fee) || 0), 0);
   
   // ✅ ڕاستکرنا داهاتێ ئەڤرۆ (بەراوردکرنا درست یا کاتی)
   stats.todayIncome = records
    .filter(r => new Date(r.created_at).toLocaleDateString('en-CA') === todayStr)
    .reduce((s, r) => s + (Number(r.fee) || 0), 0);

   stats.todayVisits = records.filter(r => new Date(r.created_at).toLocaleDateString('en-CA') === todayStr).length;
   recentVisits = records.slice(-5).reverse();

   // حسابکرنا داتایێن مەهانە
   monthlyReport.income = records
    .filter(r => new Date(r.created_at) >= new Date(firstDayOfMonth))
    .reduce((s, r) => s + (Number(r.fee) || 0), 0);
   
   monthlyReport.patients = records.filter(r => new Date(r.created_at) >= new Date(firstDayOfMonth)).length;
  }

  if (exps) {
   stats.totalExpenses = exps.reduce((s, e) => s + (Number(e.amount) || 0), 0);
   monthlyReport.expenses = exps
    .filter(e => new Date(e.created_at) >= new Date(firstDayOfMonth))
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);
  }

  stats.totalPatients = pCount || 0;
  stats.netProfit = stats.totalIncome - stats.totalExpenses;
  monthlyReport.profit = monthlyReport.income - monthlyReport.expenses;
  
  isLoading = false;
 }
</script>

<div class="dashboard-wrapper">
 <!-- Top Bar -->
 <header class="header">
  <h1>ناڤەندا کۆنترۆڵا کلینیکێ 🏥</h1>
  <button class="report-btn" onclick={() => monthlyReport.show = true}>📊 ڕاپۆرتا مەهانە</button>
 </header>

 <!-- Main Stats -->
 <div class="stats-grid">
  <div class="stat-card blue">
   <p>کۆما نەخۆشان</p>
   <h3>{stats.totalPatients}</h3>
  </div>
  <div class="stat-card green">
   <p>داهاتێ ئەڤرۆ 💰</p>
   <h3>${stats.todayIncome}</h3>
  </div>
  <div class="stat-card indigo">
   <p>داهاتێ گشتی</p>
   <h3>${stats.totalIncome}</h3>
  </div>
  <div class="stat-card red">
   <p>کۆما خەرجییان</p>
   <h3>${stats.totalExpenses}</h3>
  </div>
 </div>

 <div class="grid-2">
  <!-- Profit Section -->
  <div class="card glass">
   <h3>📈 کورتیا قازانجا سافی</h3>
   <div class="profit-val" style="color: {stats.netProfit >= 0 ? '#10b981' : '#f43f5e'}">
    ${stats.netProfit}
   </div>
   <div class="mini-bar">
    <div class="bar-item"><span>داهات (+)</span> <b>${stats.totalIncome}</b></div>
    <div class="bar-item"><span>خەرجی (-)</span> <b>${stats.totalExpenses}</b></div>
   </div>
  </div>

  <!-- Recent Visits -->
  <div class="card glass">
   <h3>🕒 نویترین سەرەدان</h3>
   <div class="visit-list">
    {#each recentVisits as v}
     <div class="v-item">
      <b>{v.patients?.name}</b>
      <span class="v-price">+${v.fee}</span>
     </div>
    {:else}<p>چو سەرەدان نەهاتینە تۆمارکرن.</p>
    {/each}
   </div>
  </div>
 </div>
</div>

<!-- 📊 ڕاپۆرتا مەهانە (Modal Window) -->
{#if monthlyReport.show}
 <!-- svelte-ignore a11y_click_events_have_key_events -->
 <!-- svelte-ignore a11y_no_static_element_interactions -->
 <div class="modal-overlay" onclick={() => monthlyReport.show = false}>
  <div class="modal-card" onclick={e => e.stopPropagation()}>
   <header>
    <h3>📊 ڕاپۆرتا دارایی یا ڤێ هەیڤێ</h3>
    <button onclick={() => monthlyReport.show = false}>✕</button>
   </header>
   <div class="modal-body">
    <div class="m-grid">
     <div class="m-box"><span>نەخۆشێن ڤێ هەیڤێ</span> <b>{monthlyReport.patients}</b></div>
     <div class="m-box"><span>داهاتێ هەیڤێ</span> <b style="color:#10b981">+${monthlyReport.income}</b></div>
     <div class="m-box"><span>خەرجیێن هەیڤێ</span> <b style="color:#f43f5e">-${monthlyReport.expenses}</b></div>
    </div>
    <div class="m-total">
     <p>قازانجا ڤێ هەیڤێ (Net Profit)</p>
     <h2 style="color: {monthlyReport.profit >= 0 ? '#10b981' : '#f43f5e'}">${monthlyReport.profit}</h2>
    </div>
    <button class="print-btn" onclick={() => window.print()}>🖨️ چاپکرنا ڕاپۆرتێ</button>
   </div>
  </div>
 </div>
{/if}

<style>
 .dashboard-wrapper { color: var(--text); animation: fadeIn 0.5s ease; }
 @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

 .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
 .report-btn { background: #4f46e5; color: white; border: none; padding: 10px 20px; border-radius: 12px; cursor: pointer; font-weight: bold; }

 .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 25px; }
 .stat-card { padding: 25px; border-radius: 20px; color: white; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
 .blue { background: linear-gradient(135deg, #6366f1, #4338ca); }
 .green { background: linear-gradient(135deg, #10b981, #059669); }
 .indigo { background: linear-gradient(135deg, #818cf8, #4f46e5); }
 .red { background: linear-gradient(135deg, #f43f5e, #be123c); }
 .stat-card h3 { margin: 5px 0 0; font-size: 1.8rem; font-weight: 800; }
 .stat-card p { margin: 0; font-size: 0.8rem; font-weight: bold; opacity: 0.8; }

 .grid-2 { display: grid; grid-template-columns: 1fr 1.5fr; gap: 20px; }
 @media (max-width: 900px) { .grid-2 { grid-template-columns: 1fr; } }
 
 .card { background: var(--card, white); padding: 25px; border-radius: 25px; border: 1px solid var(--border, #eee); }
 .profit-val { font-size: 2.5rem; font-weight: 900; text-align: center; margin: 15px 0; }
 .mini-bar { display: flex; flex-direction: column; gap: 8px; }
 .bar-item { display: flex; justify-content: space-between; font-size: 0.9rem; padding: 8px; background: rgba(0,0,0,0.02); border-radius: 10px; }

 .v-item { display: flex; justify-content: space-between; padding: 12px; border-bottom: 1px solid rgba(0,0,0,0.05); }
 .v-price { color: #10b981; font-weight: bold; }

 /* Modal Styles */
 .modal-overlay { position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 1000; }
 .modal-card { background: white; width: 500px; padding: 30px; border-radius: 25px; color: #333; }
 .modal-card header { display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 15px; margin-bottom: 20px; }
 .m-grid { display: grid; grid-template-columns: 1fr; gap: 10px; }
 .m-box { display: flex; justify-content: space-between; padding: 12px; background: #f9fafb; border-radius: 12px; }
 .m-total { text-align: center; margin-top: 25px; padding-top: 20px; border-top: 2px dashed #eee; }
 .print-btn { width: 100%; margin-top: 20px; background: #111827; color: white; padding: 12px; border-radius: 12px; cursor: pointer; font-weight: bold; }

 :global(.dark-mode) .card, :global(.dark-mode) .bar-item, :global(.dark-mode) .modal-card { background: #1e293b; color: white; border-color: #334155; }
</style>
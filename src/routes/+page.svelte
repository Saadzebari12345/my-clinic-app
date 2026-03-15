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
  const todayStart = new Date(now.setHours(0, 0, 0, 0)).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // --- ١. ئینانا ژمارەیا نەخۆشان ---
  const { count: pCount } = await supabase.from('patients').select('*', { count: 'exact', head: true }).eq('doctor_id', doctorId);
  stats.totalPatients = pCount || 0;

  // --- ٢. ئینانا هەمی ڕاپۆرتێن پزیشکی بۆ داهاتی ---
  const { data: allRecords, error: recErr } = await supabase
   .from('medical_records')
   .select('fee, created_at, diagnosis, patients(name)')
   .eq('doctor_id', doctorId);

  if (allRecords) {
   console.log("All Records Found:", allRecords); // بۆ پشکنینێ د Console دا

   // کۆما هەمی داهاتی
   const totalInc = allRecords.reduce((sum, r) => sum + (Number(r.fee) || 0), 0);
   
   // داهاتێ ئەڤرۆ
   const todayRecs = allRecords.filter(r => r.created_at >= todayStart);
   const todayInc = todayRecs.reduce((sum, r) => sum + (Number(r.fee) || 0), 0);

   // داتایێن مەهانە
   const monthRecs = allRecords.filter(r => r.created_at >= monthStart);
   const monthInc = monthRecs.reduce((sum, r) => sum + (Number(r.fee) || 0), 0);

   stats.totalIncome = totalInc;
   stats.todayIncome = todayInc;
   stats.todayVisits = todayRecs.length;
   
   monthlyReport.income = monthInc;
   monthlyReport.patients = monthRecs.length;
   recentVisits = allRecords.slice(-6).reverse();
  }

  // --- ٣. ئینانا هەمی خەرجییان ---
  const { data: allExpenses } = await supabase.from('expenses').select('amount, created_at').eq('doctor_id', doctorId);

  if (allExpenses) {
   const totalExp = allExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
   const monthExp = allExpenses.filter(e => e.created_at >= monthStart).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

   stats.totalExpenses = totalExp;
   monthlyReport.expenses = monthExp;
  }

  // حسابکرنا قازانجێ
  stats.netProfit = stats.totalIncome - stats.totalExpenses;
  monthlyReport.profit = monthlyReport.income - monthlyReport.expenses;
  
  isLoading = false;
 }
</script>

<div class="dashboard-wrapper">
 <header class="header">
  <h1>ناڤەندا کۆنترۆڵا کلینیکێ 👋</h1>
  <div class="header-btns">
   <button class="btn-update" onclick={refreshData}>{isLoading ? '...' : '🔄 نووژەنکرن'}</button>
   <button class="btn-report" onclick={() => monthlyReport.show = true}>📊 ڕاپۆرتا مەهانە</button>
  </div>
 </header>

 <!-- کارتێن سەرەکی یێن ئاماران -->
 <div class="stats-grid">
  <div class="stat-card blue">
   <p>کۆما نەخۆشان</p>
   <h3>{stats.totalPatients}</h3>
  </div>
  <div class="stat-card green">
   <p>داهاتێ ئەڤرۆ</p>
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

 <div class="main-layout">
  <!-- قازانجا سافی -->
  <div class="card glass">
   <h3>📈 قازانجا سافی (Net Profit)</h3>
   <div class="profit-val" style="color: {stats.netProfit >= 0 ? '#10b981' : '#f43f5e'}">
    ${stats.netProfit}
   </div>
   <div class="mini-stats">
    <div class="m-item"><span>داهات (+)</span> <b>${stats.totalIncome}</b></div>
    <div class="m-item"><span>خەرجی (-)</span> <b>${stats.totalExpenses}</b></div>
   </div>
  </div>

  <!-- لیستا نویترین سەرەدانان -->
  <div class="card glass"><h3>🕒 نویترین چالاکی</h3>
   <div class="visit-list">
    {#each recentVisits as v}
     <div class="v-row">
      <span>{v.patients?.name || 'نەخۆشێ بێ ناڤ'}</span>
      <b style="color:#10b981">+${v.fee}</b>
     </div>
    {:else}
     <p class="empty">چو داتایێن داهاتی نەهاتینە دیتن.</p>
    {/each}
   </div>
  </div>
 </div>
</div>

<!-- 📊 Modal ڕاپۆرتا مەهانە -->
{#if monthlyReport.show}
 <!-- svelte-ignore a11y_click_events_have_key_events -->
 <!-- svelte-ignore a11y_no_static_element_interactions -->
 <div class="modal-overlay" onclick={() => monthlyReport.show = false}>
  <div class="modal-card" onclick={e => e.stopPropagation()}>
   <h3>📊 ئامارێن ڤێ هەیڤێ</h3>
   <hr style="opacity:0.1; margin:15px 0;" />
   <div class="m-row"><span>نەخۆشێن هەیڤێ:</span> <b>{monthlyReport.patients}</b></div>
   <div class="m-row"><span>داهاتێ هەیڤێ:</span> <b style="color:#10b981">+${monthlyReport.income}</b></div>
   <div class="m-row"><span>خەرجیێن هەیڤێ:</span> <b style="color:#f43f5e">-${monthlyReport.expenses}</b></div>
   <div class="m-total">
    <p>قازانجا سافی یا ڤێ هەیڤێ</p>
    <h2 style="color: {monthlyReport.profit >= 0 ? '#10b981' : '#f43f5e'}">${monthlyReport.profit}</h2>
   </div>
   <button class="btn-close" onclick={() => monthlyReport.show = false}>داخستن</button>
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

 .main-layout { display: grid; grid-template-columns: 1fr 1.5fr; gap: 25px; }
 .card { background: var(--card, white); padding: 30px; border-radius: 25px; border: 1px solid var(--border, #eee); }
 .profit-val { font-size: 3rem; font-weight: 900; text-align: center; margin: 20px 0; }
 
 .m-item, .m-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid rgba(0,0,0,0.05); }
 .v-row { display: flex; justify-content: space-between; padding: 12px; background: rgba(0,0,0,0.03); border-radius: 12px; margin-bottom: 10px; }

 .btn-report { background: #4f46e5; color: white; border: none; padding: 10px 20px; border-radius: 12px; cursor: pointer; font-weight: bold; }
 .btn-update { background: #f3f4f6; color: #333; border: 1px solid #ddd; padding: 10px 20px; border-radius: 12px; cursor: pointer; }

 .modal-overlay { position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 1000; }
 .modal-card { background: white; width: 450px; padding: 30px; border-radius: 25px; color: #333; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2); }
 .m-total { text-align: center; margin-top: 25px; padding-top: 15px; border-top: 2px dashed #eee; }
 .btn-close { width: 100%; margin-top: 20px; padding: 12px; background: #111827; color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: bold; }

 :global(.dark-mode) .card, :global(.dark-mode) .modal-card, :global(.dark-mode) .v-row { background: #1e293b; color: white; border-color: #334155; }
</style>
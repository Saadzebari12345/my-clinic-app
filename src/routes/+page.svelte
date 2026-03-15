<script lang="ts">
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 // ١. گۆڕاوەکانی داشبۆرد
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
   await refreshDashboard();
  }
 });

 async function refreshDashboard() {
  isLoading = true;
  
  // وەرگرتنی کاتی ئێستا بەو شێوازەی لە وێنەکەدا دیارە (DD/MM/YYYY)
  const now = new Date();
  const todayStr = now.toLocaleDateString('en-CA'); // شێوازی YYYY-MM-DD بۆ بەراوردکردن
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // ١. هێنانی ژمارەی نەخۆشەکان
  const { count: pCount } = await supabase.from('patients').select('*', { count: 'exact', head: true }).eq('doctor_id', doctorId);
  stats.totalPatients = pCount || 0;

  // ٢. هێنانی هەموو ڕاپۆرتە پزیشکییەکان (بۆ داهات)
  const { data: allRecords, error: recErr } = await supabase
   .from('medical_records')
   .select('fee, created_at, patients(name)')
   .eq('doctor_id', doctorId);

  // ٣. هێنانی هەموو خەرجییەکان
  const { data: allExpenses } = await supabase.from('expenses').select('amount, created_at').eq('doctor_id', doctorId);

  if (allRecords) {
   let tInc = 0; let dInc = 0; let mInc = 0; let mPat = 0; let dVis = 0;

   allRecords.forEach(r => {
    const feeVal = Number(r.fee) || 0;
    const rDate = new Date(r.created_at);
    const rDateStr = rDate.toLocaleDateString('en-CA');

    tInc += feeVal; // کۆی داهاتی گشتی

    // بەراوردکردنی ڕۆژ (ئەمڕۆ)
    if (rDateStr === todayStr) {
     dInc += feeVal;
     dVis += 1;
    }

    // بەراوردکردنی مانگ
    if (rDate.getMonth() === currentMonth && rDate.getFullYear() === currentYear) {
     mInc += feeVal;
     mPat += 1;
    }
   });

   stats.totalIncome = tInc;
   stats.todayIncome = dInc;
   stats.todayVisits = dVis;
   monthlyReport.income = mInc;
   monthlyReport.patients = mPat;
   recentVisits = allRecords.slice(-6).reverse();
  }

  if (allExpenses) {
   let tExp = 0; let mExp = 0;
   allExpenses.forEach(e => {
    const expVal = Number(e.amount) || 0;
    const eDate = new Date(e.created_at);
    tExp += expVal;

    if (eDate.getMonth() === currentMonth && eDate.getFullYear() === currentYear) {
     mExp += expVal;
    }
   });
   stats.totalExpenses = tExp;
   monthlyReport.expenses = mExp;
  }

  stats.netProfit = stats.totalIncome - stats.totalExpenses;
  monthlyReport.profit = monthlyReport.income - monthlyReport.expenses;
  
  isLoading = false;
 }
</script>

<div class="dash-container">
 <header class="dash-header">
  <h1>ناڤەندا کۆنترۆڵا کلینیکێ 🏥</h1>
  <div class="header-actions">
   <button class="btn-refresh" onclick={refreshDashboard}>{isLoading ? '...' : '🔄 نووژەنکرن'}</button>
   <button class="btn-report" onclick={() => monthlyReport.show = true}>📊 ڕاپۆرتا مەهانە</button>
  </div>
 </header>

 <!-- کارتێن ڕەنگاوڕەنگ -->
 <div class="stats-grid">
  <div class="card blue"><p>نەخۆشێن گشتی</p><h3>{stats.totalPatients}</h3></div>
  <div class="card green"><p>داهاتێ ئەڤرۆ</p><h3>${stats.todayIncome}</h3></div>
  <div class="card indigo"><p>داهاتێ گشتی</p><h3>${stats.totalIncome}</h3></div>
  <div class="card red"><p>کۆما خەرجییان</p><h3>${stats.totalExpenses}</h3></div>
 </div>

 <div class="main-content">
  <!-- قازانجا سافی -->
  <div class="glass-card">
   <h3>📈 کورتیا قازانجا سافی</h3>
   <div class="profit-box" style="color: {stats.netProfit >= 0 ? '#10b981' : '#f43f5e'}">
    ${stats.netProfit}
   </div>
   <div class="summary">
    <div class="s-item"><span>داهات (+)</span> <b style="color:#10b981">${stats.totalIncome}</b></div>
    <div class="s-item"><span>خەرجی (-)</span> <b style="color:#f43f5e">${stats.totalExpenses}</b></div>
   </div>
  </div><!-- نویترین سەرەدان -->
  <div class="glass-card">
   <h3>🕒 نویترین سەرەدانێن تۆمارکری</h3>
   <div class="visit-list">
    {#each recentVisits as v}
     <div class="v-row">
      <span>{v.patients?.name || 'نەخۆش'}</span>
      <b style="color:#10b981">+${v.fee}</b>
     </div>
    {:else}
     <p class="empty">چو داتا نینن.</p>
    {/each}
   </div>
  </div>
 </div>
</div>

<!-- ڕاپۆرتا مەهانە -->
{#if monthlyReport.show}
 <!-- svelte-ignore a11y_click_events_have_key_events -->
 <!-- svelte-ignore a11y_no_static_element_interactions -->
 <div class="modal-bg" onclick={() => monthlyReport.show = false}>
  <div class="modal-content" onclick={e => e.stopPropagation()}>
   <h3>📊 ڕاپۆرتا دارایی یا ڤێ هەیڤێ</h3>
   <hr style="opacity:0.1" />
   <div class="m-row"><span>نەخۆشێن هەیڤێ:</span> <b>{monthlyReport.patients}</b></div>
   <div class="m-row"><span>داهاتێ هەیڤێ:</span> <b style="color:#10b981">+${monthlyReport.income}</b></div>
   <div class="m-row"><span>خەرجیێن هەیڤێ:</span> <b style="color:#f43f5e">-${monthlyReport.expenses}</b></div>
   <div class="m-result">
    <p>قازانجا هەیڤێ</p>
    <h2 style="color: {monthlyReport.profit >= 0 ? '#10b981' : '#f43f5e'}">${monthlyReport.profit}</h2>
   </div>
   <button class="close-btn" onclick={() => monthlyReport.show = false}>داخستن</button>
  </div>
 </div>
{/if}

<style>
 .dash-container { color: var(--text); padding: 15px; font-family: sans-serif; }
 .dash-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
 .header-actions { display: flex; gap: 10px; }
 
 .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }
 .card { padding: 25px; border-radius: 20px; color: white; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
 .blue { background: #4f46e5; } .green { background: #10b981; } .indigo { background: #6366f1; } .red { background: #f43f5e; }
 h3 { margin: 5px 0 0; font-size: 1.8rem; }
 p { margin: 0; font-size: 0.8rem; font-weight: bold; opacity: 0.8; }

 .main-content { display: grid; grid-template-columns: 1fr 1.5fr; gap: 20px; }
 .glass-card { background: var(--card, white); padding: 25px; border-radius: 25px; border: 1px solid var(--border); }
 .profit-box { font-size: 3rem; font-weight: 900; text-align: center; margin: 15px 0; }
 
 .s-item, .m-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(0,0,0,0.05); }
 .v-row { display: flex; justify-content: space-between; padding: 12px; background: rgba(0,0,0,0.02); border-radius: 12px; margin-bottom: 8px; }

 .btn-report { background: #4f46e5; color: white; border: none; padding: 10px 20px; border-radius: 12px; cursor: pointer; font-weight: bold; }
 .btn-refresh { background: #f3f4f6; color: #333; border: 1px solid #ddd; padding: 10px 20px; border-radius: 12px; cursor: pointer; }

 .modal-bg { position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 1000; }
 .modal-content { background: white; width: 450px; padding: 30px; border-radius: 25px; color: #333; }
 .m-result { text-align: center; margin-top: 20px; padding-top: 15px; border-top: 2px dashed #eee; }
 .close-btn { width: 100%; margin-top: 20px; padding: 12px; background: #111827; color: white; border: none; border-radius: 12px; cursor: pointer; }

 :global(.dark-mode) .glass-card, :global(.dark-mode) .modal-content, :global(.dark-mode) .v-row { background: #1e293b; color: white; border-color: #334155; }
</style>
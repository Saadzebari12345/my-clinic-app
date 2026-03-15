<script lang="ts">
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 // ١. گۆڕاوێن ئاماران (تەنێ پزیشکی و دارایی)
 let stats = $state({
  totalPatients: 0,
  todayIncome: 0,
  totalIncome: 0,
  totalExpenses: 0,
  netProfit: 0,
  todayVisits: 0
 });

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
  const today = new Date().toISOString().split('T')[0];

  // ئینانا هەمی نەخۆشان
  const { count: pCount } = await supabase.from('patients').select('*', { count: 'exact', head: true }).eq('doctor_id', doctorId);
  
  // ئینانا هەمی ڕاپۆرتێن پزیشکی (بۆ حسابکرنا پارەی)
  const { data: records, error: rErr } = await supabase
   .from('medical_records')
   .select('fee, created_at, diagnosis, patients(name)')
   .eq('doctor_id', doctorId);
  
  // ئینانا خەرجییان
  const { data: exps } = await supabase.from('expenses').select('amount').eq('doctor_id', doctorId);

  if (records) {
   // حسابکرنا داهاتێ گشتی
   stats.totalIncome = records.reduce((s, r) => s + (Number(r.fee) || 0), 0);
   
   // حسابکرنا داهاتێ ئەڤرۆ
   stats.todayIncome = records
    .filter(r => r.created_at.startsWith(today))
    .reduce((s, r) => s + (Number(r.fee) || 0), 0);

   stats.todayVisits = records.filter(r => r.created_at.startsWith(today)).length;
   recentVisits = records.slice(-6).reverse(); // نیشاندانا دووماهی ٦ سەرەدانان
  }

  if (exps) {
   stats.totalExpenses = exps.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  }

  stats.totalPatients = pCount || 0;
  stats.netProfit = stats.totalIncome - stats.totalExpenses;
  
  isLoading = false;
 }
</script>

<div class="dashboard-container">
 <!-- Header -->
 <header class="top-bar">
  <div>
   <h1>ناڤەندا کۆنترۆڵا کلینیکێ 🏥</h1>
   <p>کورتیا کارێ تە یێ ئەڤرۆ و داهاتێ گشتی</p>
  </div>
  <button class="refresh-btn {isLoading ? 'loading' : ''}" onclick={refreshData}>
   {isLoading ? '...' : '🔄 نووژەنکرن'}
  </button>
 </header>

 <!-- Stats Grid (نوکە ب تەمامی یێ دارایی یە) -->
 <div class="stats-grid">
  <div class="card stat-box blue">
   <span class="icon">👥</span>
   <div class="details">
    <p>کۆما نەخۆشان</p>
    <h3>{stats.totalPatients}</h3>
   </div>
  </div>

  <div class="card stat-box green">
   <span class="icon">💵</span>
   <div class="details">
    <p>داهاتێ ئەڤرۆ</p>
    <h3>${stats.todayIncome}</h3>
   </div>
  </div>

  <div class="card stat-box indigo">
   <span class="icon">💰</span>
   <div class="details">
    <p>داهاتێ گشتی</p>
    <h3>${stats.totalIncome}</h3>
   </div>
  </div>

  <div class="card stat-box red">
   <span class="icon">💸</span>
   <div class="details">
    <p>کۆما خەرجییان</p>
    <h3>${stats.totalExpenses}</h3>
   </div>
  </div>
 </div>

 <div class="main-grid">
  <!-- Profit Visualization -->
  <div class="glass-card finance-summary">
   <h3>📈 کورتیا قازانجا سافی</h3>
   <div class="profit-value">
    <h2 style="color: {stats.netProfit >= 0 ? '#10b981' : '#f43f5e'}">
     ${stats.netProfit}
    </h2>
    <p>پاش کێشکرنا هەمی خەرجییان</p>
   </div>
   <div class="mini-logs">
    <div class="log"><span>داهات (+)</span> <b style="color:#10b981">${stats.totalIncome}</b></div>
    <div class="log"><span>خەرجی (-)</span> <b style="color:#f43f5e">${stats.totalExpenses}</b></div>
   </div>
  </div>

  <!-- Recent Patients List -->
  <div class="glass-card recent-list">
   <h3>🕒 نویترین سەرەدانێن تۆمارکری</h3>
   <div class="list">
    {#each recentVisits as visit}
     <div class="visit-row">
      <div class="avatar">{visit.patients?.name[0]}</div>
      <div class="v-info">
       <b>{visit.patients?.name}</b>
       <span>{visit.diagnosis}</span>
      </div>
      <div class="v-price">+${visit.fee}</div>
     </div>
    {:else}
     <p class="empty">هیچ سەرەدانەک نەهاتییە تۆمارکرن.</p>
    {/each}
   </div>
  </div>
 </div>
</div>

<style>
 .dashboard-container { animation: fadeIn 0.5s ease; color: var(--text); }
 @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

 .top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
 .top-bar h1 { font-size: 1.6rem; font-weight: 900; color: #4f46e5; margin: 0; }
 .top-bar p { margin: 5px 0 0; opacity: 0.6; font-size: 0.9rem; }

 .refresh-btn { background: #4f46e5; color: white; border: none; padding: 10px 20px; border-radius: 10px; cursor: pointer; font-weight: bold; }
 .refresh-btn.loading { opacity: 0.5; cursor: not-allowed; }

 .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 30px; }
 .stat-box { padding: 25px; border-radius: 20px; display: flex; align-items: center; gap: 20px; color: white; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
 
 .blue { background: linear-gradient(135deg, #6366f1, #4338ca); }
 .green { background: linear-gradient(135deg, #10b981, #059669); }
 .indigo { background: linear-gradient(135deg, #818cf8, #4f46e5); }
 .red { background: linear-gradient(135deg, #f43f5e, #be123c); }

 .icon { font-size: 2.2rem; background: rgba(255,255,255,0.2); width: 55px; height: 55px; display: flex; align-items: center; justify-content: center; border-radius: 15px; }
 .details p { margin: 0; font-size: 0.8rem; font-weight: bold; opacity: 0.8; }
 .details h3 { margin: 5px 0 0; font-size: 1.6rem; font-weight: 800; }

 .main-grid { display: grid; grid-template-columns: 1fr 1.5fr; gap: 25px; }
 @media (max-width: 900px) { .main-grid { grid-template-columns: 1fr; } }

 .glass-card { background: var(--card, white); padding: 30px; border-radius: 25px; border: 1px solid var(--border, #eee); }
 
 .profit-value { text-align: center; margin: 20px 0; }
 .profit-value h2 { font-size: 2.5rem; margin: 0; font-weight: 900; }
 .profit-value p { font-size: 0.8rem; opacity: 0.5; }

 .mini-logs { display: flex; flex-direction: column; gap: 10px; margin-top: 20px; }
 .log { display: flex; justify-content: space-between; font-size: 0.9rem; padding: 10px; background: rgba(0,0,0,0.02); border-radius: 10px; }

 .list { display: flex; flex-direction: column; gap: 12px; margin-top: 20px; }
 .visit-row { display: flex; align-items: center; gap: 15px; padding: 12px; border-radius: 15px; background: rgba(0,0,0,0.02); border: 1px solid transparent; transition: 0.2s; }
 .avatar { width: 40px; height: 40px; background: #e0e7ff; color: #4f46e5; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; }
 .v-info { flex: 1; display: flex; flex-direction: column; }
 .v-info b { font-size: 0.95rem; }
 .v-info span { font-size: 0.75rem; opacity: 0.6; }
 .v-price { font-weight: 900; color: #10b981; }

 :global(.dark-mode) .glass-card, :global(.dark-mode) .log, :global(.dark-mode) .visit-row { background: #1e293b; border-color: #334155; }
</style>
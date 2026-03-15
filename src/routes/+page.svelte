<script lang="ts">
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 // ١. گۆڕاوێن ئاماران ب شێوازەکێ ڕێکخستی
 let stats = $state({
  totalPatients: 0,
  todayVisits: 0,
  totalIncome: 0,
  totalExpenses: 0,
  netProfit: 0,
  labTests: 0
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
  
  // ئینانا داهاتی و سەرەدانان
  const { data: records } = await supabase.from('medical_records').select('fee, created_at, diagnosis, patients(name)').eq('doctor_id', doctorId);
  
  // ئینانا خەرجییان
  const { data: exps } = await supabase.from('expenses').select('amount').eq('doctor_id', doctorId);

  // ئینانا پشکنینێن تاقیگەهێ
  const { count: lCount } = await supabase.from('lab_orders').select('*', { count: 'exact', head: true }).eq('doctor_id', doctorId);

  if (records) {
   stats.totalIncome = records.reduce((s, r) => s + (Number(r.fee) || 0), 0);
   stats.todayVisits = records.filter(r => r.created_at.startsWith(today)).length;
   recentVisits = records.slice(-5).reverse();
  }

  if (exps) {
   stats.totalExpenses = exps.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  }

  stats.totalPatients = pCount || 0;
  stats.labTests = lCount || 0;
  stats.netProfit = stats.totalIncome - stats.totalExpenses;
  
  isLoading = false;
 }
</script>

<div class="dashboard-wrapper">
 <!-- سەرێ لاپەرەی (Welcome Banner) -->
 <header class="welcome-banner">
  <div class="text">
   <h1>ب خێر بێی بۆ داشبۆردێ کلینیکێ 👋</h1>
   <p>ئەڤرۆ {new Date().toLocaleDateString('ku-IQ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>
  <button class="refresh-btn" onclick={refreshData}>
   <span>{isLoading ? '...' : '🔄 نووژەنکرن'}</span>
  </button>
 </header>

 <!-- کارتێن ئاماران (Stats Grid) -->
 <div class="stats-grid">
  <div class="stat-card blue">
   <div class="card-icon">👥</div>
   <div class="card-info">
    <p>هەمی نەخۆش</p>
    <h3>{stats.totalPatients}</h3>
   </div>
  </div>

  <div class="stat-card emerald">
   <div class="card-icon">💰</div>
   <div class="card-info">
    <p>کۆما داهاتی</p>
    <h3>${stats.totalIncome}</h3>
   </div>
  </div>

  <div class="stat-card rose">
   <div class="card-icon">📉</div>
   <div class="card-info">
    <p>هەمی خەرجی</p>
    <h3>${stats.totalExpenses}</h3>
   </div>
  </div>

  <div class="stat-card amber">
   <div class="card-icon">🧪</div>
   <div class="card-info">
    <p>پشکنینێن تاقیگەهێ</p>
    <h3>{stats.labTests}</h3>
   </div>
  </div>
 </div>

 <div class="main-content-grid">
  <!-- بەشێ دارایی (Financial Health) -->
  <div class="glass-card finance-box">
   <h3>📊 کورتیا دارایی (مەهانە)</h3>
   <div class="profit-display">
    <div class="profit-circle">
     <span class="label">قازانجا سافی</span>
     <span class="value">${stats.netProfit}</span>
    </div>
    <div class="mini-stats">
     <div class="m-item"><span>داهات</span> <b class="text-green">+${stats.totalIncome}</b></div>
     <div class="m-item"><span>خەرجی</span> <b class="text-red">-${stats.totalExpenses}</b></div>
    </div>
   </div>
  </div>

  <!-- لیستا نویترین سەرەدانان -->
  <div class="glass-card activity-box">
   <h3>🕒 نویترین سەرەدانێن نەخۆشان</h3>
   <div class="activity-list">
    {#each recentVisits as visit}
     <div class="visit-item">
      <div class="avatar">{visit.patients?.name[0]}</div>
      <div class="v-details">
       <span class="v-name">{visit.patients?.name}</span>
       <span class="v-diag">{visit.diagnosis}</span>
      </div>
      <div class="v-fee">+${visit.fee}</div>
     </div>
    {:else}
     <p class="empty-text">چو سەرەدان نەهاتینە تۆمارکرن.</p>
    {/each}
   </div>
  </div>
 </div>
</div>

<style>
 .dashboard-wrapper { animation: fadeIn 0.6s ease-out; color: var(--text); }
 @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

 .welcome-banner { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
 .welcome-banner h1 { font-size: 1.8rem; font-weight: 800; margin: 0; color: #4f46e5; }
 .welcome-banner p { margin: 5px 0 0; opacity: 0.7; font-weight: 500; }
 
 .refresh-btn { background: white; border: 1px solid #ddd; padding: 10px 20px; border-radius: 12px; cursor: pointer; font-weight: bold; transition: 0.3s; }
 .refresh-btn:hover { background: #f3f4f6; transform: scale(1.05); }

 .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 30px; }
 
 .stat-card { padding: 25px; border-radius: 24px; display: flex; align-items: center; gap: 20px; color: white; box-shadow: 0 10px 20px -5px rgba(0,0,0,0.1); transition: 0.3s; }
 .stat-card:hover { transform: translateY(-5px); }
 
 .blue { background: linear-gradient(135deg, #6366f1, #4338ca); }
 .emerald { background: linear-gradient(135deg, #10b981, #059669); }
 .rose { background: linear-gradient(135deg, #f43f5e, #be123c); }
 .amber { background: linear-gradient(135deg, #f59e0b, #b45309); }

 .card-icon { font-size: 2.5rem; background: rgba(255,255,255,0.2); width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; border-radius: 18px; }
 .card-info p { margin: 0; font-size: 0.9rem; font-weight: 600; opacity: 0.9; }
 .card-info h3 { margin: 5px 0 0; font-size: 1.8rem; font-weight: 800; }

 .main-content-grid { display: grid; grid-template-columns: 1fr 1.2fr; gap: 25px; }
 @media (max-width: 1000px) { .main-content-grid { grid-template-columns: 1fr; } }

 .glass-card { background: var(--card, white); padding: 30px; border-radius: 28px; border: 1px solid var(--border, #eee); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }

 .profit-display { display: flex; align-items: center; justify-content: space-around; margin-top: 20px; }
 .profit-circle { width: 150px; height: 150px; border: 8px solid #4f46e5; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
 .profit-circle .value { font-size: 1.5rem; font-weight: 900; color: #4f46e5; }
 .profit-circle .label { font-size: 0.7rem; font-weight: bold; opacity: 0.6; text-transform: uppercase; }

 .mini-stats { display: flex; flex-direction: column; gap: 15px; }
 .m-item { display: flex; flex-direction: column; font-size: 0.9rem; }
 .text-green { color: #10b981; font-size: 1.2rem; }
 .text-red { color: #f43f5e; font-size: 1.2rem; }

 .activity-list { display: flex; flex-direction: column; gap: 15px; margin-top: 20px; }
 .visit-item { display: flex; align-items: center; gap: 15px; padding: 12px; background: rgba(0,0,0,0.02); border-radius: 18px; border: 1px solid transparent; transition: 0.2s; }
 .visit-item:hover { background: white; border-color: #ddd; box-shadow: 0 5px 15px rgba(0,0,0,0.05); }
 .avatar { width: 45px; height: 45px; background: #e0e7ff; color: #4f46e5; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.2rem; }
 .v-details { flex: 1; display: flex; flex-direction: column; }
 .v-name { font-weight: 700; font-size: 1rem; }
 .v-diag { font-size: 0.8rem; opacity: 0.6; }
 .v-fee { font-weight: 900; color: #10b981; }

 :global(.dark-mode) .visit-item { background: rgba(255,255,255,0.05); }
 :global(.dark-mode) .refresh-btn { background: #1e293b; color: white; border-color: #334155; }
</style>
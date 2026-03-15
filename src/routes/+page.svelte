<script lang="ts">
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 // ١. گۆڕاوێن داتایان
 let stats = $state({ totalP: 0, todayV: 0, todayInc: 0, totalInc: 0, totalExp: 0, profit: 0 });
 let recentActivity = $state<any[]>([]);
 let doctorId = $state(0);
 let isLoading = $state(true);

 onMount(async () => {
  const storedId = localStorage.getItem('doctor_id');
  if (storedId) {
   doctorId = Number(storedId);
   await loadExecutiveData();
  }
 });

 async function loadExecutiveData() {
  isLoading = true;
  const now = new Date();
  const todayStr = now.toDateString();

  // ئینانا هەمی داتایان ب ئێکجار دا خێرایی زێدە بیت
  const [recs, exps, patients] = await Promise.all([
   supabase.from('medical_records').select('fee, created_at, patients(name), diagnosis').eq('doctor_id', doctorId),
   supabase.from('expenses').select('amount, created_at').eq('doctor_id', doctorId),
   supabase.from('patients').select('*', { count: 'exact', head: true }).eq('doctor_id', doctorId)
  ]);

  // حسابکرنا داتایێن دارایی ب ڕێکا JavaScript دا چو خەلەتی نەمینن
  if (recs.data) {
   let tInc = 0; let dInc = 0; let dVis = 0;
   recs.data.forEach(r => {
    const rFee = Number(r.fee) || 0;
    const rDate = new Date(r.created_at).toDateString();
    tInc += rFee;
    if (rDate === todayStr) { dInc += rFee; dVis++; }
   });
   stats.totalInc = tInc;
   stats.todayInc = dInc;
   stats.todayV = dVis;
   recentActivity = recs.data.slice(-5).reverse();
  }

  if (exps.data) {
   stats.totalExp = exps.data.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  }

  stats.totalP = patients.count || 0;
  stats.profit = stats.totalInc - stats.totalExp;
  isLoading = false;
 }
</script>

<div class="executive-dashboard">
 <!-- Header Section -->
 <header class="hero">
  <div class="welcome">
   <h1>سڵاڤ دکتۆر! 👋</h1>
   <p>ئەڤە کورتیا هەمی چالاکیێن کلینیکا تە یە بۆ ئەڤرۆ.</p>
  </div>
  <button class="refresh-pill" onclick={loadExecutiveData} class:loading={isLoading}>
   {isLoading ? '...' : '🔄 نووژەنکرنا داتایان'}
  </button>
 </header>

 <!-- Main Stats Grid -->
 <div class="main-stats">
  <div class="stat-glass blue">
   <span class="label">کۆما نەخۆشان</span>
   <h2 class="value">{stats.totalP}</h2>
   <div class="mini-chart">👥 Registered</div>
  </div>
  <div class="stat-glass green">
   <span class="label">داهاتێ ئەڤرۆ</span>
   <h2 class="value">${stats.todayInc}</h2>
   <div class="mini-chart">📈 +{stats.todayV} Visits</div>
  </div>
  <div class="stat-glass purple">
   <span class="label">قازانجا گشتی</span>
   <h2 class="value">${stats.profit}</h2>
   <div class="mini-chart">💰 Total Balance</div>
  </div>
  <div class="stat-glass red">
   <span class="label">کۆما خەرجییان</span>
   <h2 class="value">${stats.totalExp}</h2>
   <div class="mini-chart">📉 Expenses Log</div>
  </div>
 </div>

 <div class="details-grid">
  <!-- Finance Card -->
  <div class="card glass-card">
   <h3>📊 باری دارایی (Financial Health)</h3>
   <div class="progress-container">
    <div class="bar-info">
     <span>داهاتێ گشتی</span>
     <b>${stats.totalInc}</b>
    </div>
    <div class="progress-bg"><div class="progress-fill green" style="width: 100%"></div></div>
    
    <div class="bar-info" style="margin-top:20px;">
     <span>خەرجیێن کلینیکێ</span>
     <b>${stats.totalExp}</b>
    </div>
    <div class="progress-bg">
     <div class="progress-fill red" style="width: {stats.totalInc > 0 ? (stats.totalExp / stats.totalInc) * 100 : 0}%"></div>
    </div>
   </div>
   <div class="profit-footer" style="color: {stats.profit >= 0 ? '#10b981' : '#f43f5e'}">
    {stats.profit >= 0 ? '↗️ Your clinic is growing' : '⚠️ Expenses are high'}
   </div>
  </div>

  <!-- Recent Timeline Card -->
  <div class="card glass-card">
   <h3>🕒 نویترین سەرەدانێن تۆمارکری</h3>
   <div class="timeline">
    {#each recentActivity as item}
     <div class="timeline-item">
      <div class="time-dot"></div>
      <div class="time-content">
       <b>{item.patients?.name || 'Unknown'}</b>
       <span>{item.diagnosis || 'Consultation'}</span></div>
      <div class="time-price">+${item.fee}</div>
     </div>
    {:else}
     <p class="empty-msg">چو داتایێن دارایی نەهاتینە دیتن.</p>
    {/each}
   </div>
  </div>
 </div>
</div>

<style>
 .executive-dashboard { padding: 20px; font-family: 'Inter', sans-serif; color: var(--text); }

 .hero { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
 .hero h1 { font-size: 2.2rem; font-weight: 800; margin: 0; background: linear-gradient(to right, #4f46e5, #9333ea); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
 .hero p { opacity: 0.6; margin: 5px 0 0; }

 .refresh-pill { background: white; border: 1px solid #e2e8f0; padding: 10px 20px; border-radius: 50px; cursor: pointer; font-weight: 600; box-shadow: 0 4px 6px rgba(0,0,0,0.02); transition: 0.3s; }
 .refresh-pill:hover { background: #f8fafc; transform: translateY(-2px); }

 .main-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 25px; margin-bottom: 40px; }
 .stat-glass { padding: 30px; border-radius: 32px; color: white; position: relative; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
 
 .blue { background: #4f46e5; }
 .green { background: #10b981; }
 .purple { background: #7c3aed; }
 .red { background: #ef4444; }

 .label { font-size: 0.8rem; font-weight: 600; text-transform: uppercase; opacity: 0.8; letter-spacing: 1px; }
 .value { font-size: 2.5rem; font-weight: 800; margin: 10px 0; }
 .mini-chart { font-size: 0.75rem; background: rgba(255,255,255,0.2); display: inline-block; padding: 4px 12px; border-radius: 20px; }

 .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
 @media (max-width: 900px) { .details-grid { grid-template-columns: 1fr; } }

 .glass-card { background: var(--card, white); padding: 35px; border-radius: 32px; border: 1px solid var(--border, #f1f5f9); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.04); }
 
 .bar-info { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 0.9rem; }
 .progress-bg { background: #f1f5f9; height: 12px; border-radius: 10px; overflow: hidden; }
 .progress-fill { height: 100%; border-radius: 10px; transition: width 1s ease-out; }
 .progress-fill.green { background: #10b981; }
 .progress-fill.red { background: #ef4444; }
 .profit-footer { margin-top: 25px; text-align: center; font-weight: bold; font-size: 0.9rem; }

 .timeline { margin-top: 20px; }
 .timeline-item { display: flex; align-items: center; gap: 15px; padding: 15px 0; border-bottom: 1px solid rgba(0,0,0,0.03); }
 .time-dot { width: 10px; height: 10px; background: #4f46e5; border-radius: 50%; }
 .time-content { flex: 1; display: flex; flex-direction: column; }
 .time-content b { font-size: 1rem; }
 .time-content span { font-size: 0.8rem; opacity: 0.5; }
 .time-price { font-weight: 800; color: #10b981; }

 :global(.dark-mode) .glass-card { background: #1e293b; border-color: #334155; }
 :global(.dark-mode) .progress-bg { background: #0f172a; }
 :global(.dark-mode) .refresh-pill { background: #1e293b; color: white; border-color: #334155; }
</style>
<script lang="ts">
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';
 import { goto } from '$app/navigation';

 let doctorId = $state(0);
 let docInfo = $state<any>(null);
 let isLoading = $state(true);

 // داتایێن ژڤانان و ئاماران
 let todayApps = $state<any[]>([]);
 let stats = $state({ 
  totalPatients: 0, 
  waiting: 0, 
  completed: 0,
  todayIncome: 0,
  todayExpenses: 0
 });

 onMount(async () => {
  const id = localStorage.getItem('doctor_id');
  if (id) {
   doctorId = Number(id);
   await loadDashboardData();
  }
 });

 async function loadDashboardData() {
  isLoading = true;
  const today = new Date().toLocaleDateString('en-CA');

  // ١. ئینانا زانیاریێن دکتۆری
  const { data: doc } = await supabase.from('doctors').select('*').eq('id', doctorId).single();
  docInfo = doc;

  // ٢. ئینانا هەمی داتایێن ئەڤرۆ (ژڤان، داهات، خەرجی)
  const [apps, patients, records, expenses] = await Promise.all([
   supabase.from('appointments').select('*').eq('doctor_id', doctorId).eq('date', today).order('date', {ascending: true}),
   supabase.from('patients').select('id', { count: 'exact', head: true }).eq('doctor_id', doctorId),
   supabase.from('medical_records').select('fee, created_at').eq('doctor_id', doctorId),
   supabase.from('expenses').select('amount, created_at').eq('doctor_id', doctorId)
  ]);

  // ڕێکخستنا ژڤانێن ئەڤرۆ
  if (apps.data) {
   todayApps = apps.data;
   stats.waiting = todayApps.filter(a => a.status === 'Pending' || a.status === 'Confirmed').length;
   stats.completed = todayApps.filter(a => a.status === 'Done').length;
  }

  // ڕێکخستنا داهات و خەرجیێن ئەڤرۆ
  if (records.data) {
   stats.todayIncome = records.data
    .filter(r => new Date(r.created_at).toLocaleDateString('en-CA') === today)
    .reduce((s, r) => s + (Number(r.fee) || 0), 0);
  }
  if (expenses.data) {
   stats.todayExpenses = expenses.data
    .filter(e => new Date(e.created_at).toLocaleDateString('en-CA') === today)
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);
  }

  stats.totalPatients = patients.count || 0;
  isLoading = false;
 }

 // 📱 فرێکرنا ڕاپۆرتا دارایی بۆ واتساپێ
 function sendReportToWhatsapp() {
  if (!docInfo?.whatsapp_number) return alert("ژمارا واتساپێ نەهاتییە تۆمارکرن!");
  
  const profit = stats.todayIncome - stats.todayExpenses;
  const message = `📋 ڕاپۆرتا ڕۆژانە یا کلینیکێ%0A----------%0A👨‍⚕️ دکتۆر: ${docInfo.doctor_name}%0A👥 نەخۆشێن ئەڤرۆ: ${stats.completed}%0A💰 داهاتێ ئەڤرۆ: $${stats.todayIncome}%0A💸 خەرجیێن ئەڤrۆ: $${stats.todayExpenses}%0A📈 قازانجا سافی: $${profit}%0A📅 ڕێکەفت: ${new Date().toLocaleDateString()}%0A----------%0Aسیستەمێ E-Clinic Pro`;

  window.open(`https://wa.me/${docInfo.whatsapp_number}?text=${message}`, '_blank');
 }
</script>

<div class="pro-dashboard">
 <!-- 🌟 Top Section -->
 <header class="top-bar">
  <div class="welcome">
   <h1>سڵاڤ دکتۆر! 👋</h1>
   <p>ئەڤرۆ <b>{stats.waiting}</b> نەخۆش ل هێڤییا تە نە.</p>
  </div>
  <button class="whatsapp-btn" onclick={sendReportToWhatsapp}>
   <span>📱 فرێکرنا ڕاپۆرتێ بۆ واتساپێ</span>
  </button>
 </header>

 <!-- 📊 Stats Grid -->
 <div class="stats-grid">
  <div class="s-card blue">
   <span class="label">کۆما نەخۆشان</span>
   <span class="value">{stats.totalPatients}</span>
  </div>
  <div class="s-card amber">
   <span class="label">ل چاوەڕێیێ</span>
   <span class="value">{stats.waiting}</span>
  </div>
  <div class="s-card emerald">
   <span class="label">تەمام بووینە</span>
   <span class="value">{stats.completed}</span>
  </div>
  <div class="s-card indigo">
   <span class="label">داهاتێ ئەڤرۆ</span>
   <span class="value">${stats.todayIncome}</span>
  </div>
 </div>

 <div class="dashboard-grid">
  <!-- 🗓️ لایێ چەپێ: لیستا زیندی یا ئەڤرۆ (The Queue) -->
  <section class="card main-box">
   <div class="section-head">
    <h3>📅 نەخۆشێن ئەڤرۆ (Queue)</h3>
    <button class="refresh-btn" onclick={loadDashboardData}>🔄</button>
   </div>
   <div class="queue-list">
    {#each todayApps as app}
     <div class="queue-item {app.status === 'Done' ? 'done' : ''}"><div class="time">{new Date(app.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
      <div class="p-info">
       <b>{app.patient_name}</b>
       <span class="badge {app.status}">{app.status}</span>
      </div>
      <button class="btn-action" onclick={() => goto('/appointments')}>➡️</button>
     </div>
    {:else}
     <div class="empty-state">چو ژڤان بۆ ئەڤرۆ نەهاتینە تۆمارکرن.</div>
    {/each}
   </div>
  </section>

  <!-- 📜 لایێ ڕاستێ: کورتیا دارایی یا ئەڤرۆ -->
  <section class="card main-box">
   <h3>💰 کورتیا دارایی یا ئەڤرۆ</h3>
   <div class="finance-list">
    <div class="f-row">
     <span>کۆما داهاتێ ئەڤرۆ:</span>
     <b style="color: #10b981;">+${stats.todayIncome}</b>
    </div>
    <div class="f-row">
     <span>کۆما خەرجییێن ئەڤرۆ:</span>
     <b style="color: #ef4444;">-${stats.todayExpenses}</b>
    </div>
    <div class="f-total">
     <span>قازانجا سافی:</span>
     <h2 style="color: {stats.todayIncome - stats.todayExpenses >= 0 ? '#10b981' : '#ef4444'}">
      ${stats.todayIncome - stats.todayExpenses}
     </h2>
    </div>
   </div>
  </section>
 </div>
</div>

<style>
 .pro-dashboard { padding: 15px; color: var(--text); font-family: sans-serif; }
 
 .top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; flex-wrap: wrap; gap: 20px; }
 .welcome h1 { font-size: 1.8rem; font-weight: 900; color: #4f46e5; margin: 0; }
 
 .whatsapp-btn { background: #25d366; color: white; border: none; padding: 12px 20px; border-radius: 50px; cursor: pointer; font-weight: bold; transition: 0.3s; box-shadow: 0 4px 15px rgba(37, 211, 102, 0.3); }
 .whatsapp-btn:hover { transform: scale(1.05); }

 .stats-grid { display: flex; gap: 15px; margin-bottom: 30px; }
 .s-card { flex: 1; background: var(--card, white); padding: 20px; border-radius: 20px; border: 1px solid var(--border, #eee); text-align: center; }
 .s-card .label { display: block; font-size: 0.75rem; font-weight: bold; opacity: 0.5; text-transform: uppercase; margin-bottom: 5px; }
 .s-card .value { font-size: 1.8rem; font-weight: 900; }
 .blue { border-bottom: 5px solid #3b82f6; }
 .amber { border-bottom: 5px solid #f59e0b; }
 .emerald { border-bottom: 5px solid #10b981; }
 .indigo { border-bottom: 5px solid #6366f1; }

 .dashboard-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 25px; }
 @media (max-width: 900px) { .dashboard-grid { grid-template-columns: 1fr; } }

 .card { background: var(--card, white); border-radius: 24px; padding: 30px; border: 1px solid var(--border, #eee); }
 .section-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }

 .queue-item { display: flex; align-items: center; gap: 15px; padding: 15px; background: rgba(0,0,0,0.02); border-radius: 18px; margin-bottom: 10px; }
 .queue-item.done { opacity: 0.5; }
 .time { font-weight: 900; color: #4f46e5; font-size: 0.9rem; }
 .p-info { flex: 1; }
 .badge { font-size: 0.65rem; padding: 2px 8px; border-radius: 10px; font-weight: bold; }
 .badge.Pending { background: #fef3c7; color: #92400e; }
 .badge.Done { background: #dcfce7; color: #166534; }

 .finance-list { display: flex; flex-direction: column; gap: 15px; }
 .f-row { display: flex; justify-content: space-between; font-size: 1rem; padding-bottom: 10px; border-bottom: 1px solid rgba(0,0,0,0.05); }
 .f-total { text-align: center; margin-top: 20px; }
 .f-total h2 { font-size: 2.5rem; margin: 5px 0; }

 .btn-refresh { background: none; border: none; cursor: pointer; font-size: 1.2rem; }
 .btn-action { background: #eee; border: none; padding: 5px 10px; border-radius: 8px; cursor: pointer; }

 :global(.dark-mode) .card { background: #1e293b; border-color: #334155; }
 :global(.dark-mode) .queue-item { background: #0f172a; }
</style>
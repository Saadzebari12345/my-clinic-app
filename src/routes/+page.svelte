<script lang="ts">
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';
 import { goto } from '$app/navigation';

 let doctorId = $state(0);
 let docInfo = $state<any>(null);
 let isLoading = $state(true);

 // داتایێن داشبۆردێ (ئەوێن کار نەدکر)
 let todayApps = $state<any[]>([]); // لیستا نەخۆشێن ئەڤرۆ
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
  // ١. وەرگرتنا ڕێکەفتا ئەڤرۆ ب درستاهی (وەکی ٢٠٢٦-٠٣-١٦)
  const now = new Date();
  const todayStr = now.toLocaleDateString('en-CA'); 

  // ٢. ئینانا زانیاریێن دکتۆری
  const { data: doc } = await supabase.from('doctors').select('*').eq('id', doctorId).single();
  docInfo = doc;

  // ٣. ئینانا هەمی ژڤانان ب بێ فلتەر ل دەستپێکێ دا چو تشت بەرزە نەبیت
  const { data: allApps } = await supabase
   .from('appointments')
   .select('*')
   .eq('doctor_id', doctorId);

  if (allApps) {
   // ✅ فلتەرکرنا نەخۆشێن ئەڤرۆ (Today's Patients)
   todayApps = allApps.filter(a => {
    // پشکنین دکەت کا ڕێکەفتا داتابەیسێ دگەل ئەڤرۆ وەک ئێکە یان نا
    const appDate = new Date(a.date).toLocaleDateString('en-CA');
    return appDate === todayStr;
   });

   // ✅ حسابکرنا ئامارێن چاوەڕێی و تەمامبووی
   stats.waiting = todayApps.filter(a => a.status === 'Pending' || a.status === 'Confirmed').length;
   stats.completed = todayApps.filter(a => a.status === 'Done').length;
  }

  // ٤. ئینانا داهات و خەرجییان (وەک بەری نوکە)
  const { data: recs } = await supabase.from('medical_records').select('fee, created_at').eq('doctor_id', doctorId);
  const { data: exps } = await supabase.from('expenses').select('amount, created_at').eq('doctor_id', doctorId);
  const { count: pCount } = await supabase.from('patients').select('id', { count: 'exact', head: true }).eq('doctor_id', doctorId);

  if (recs) {
   stats.todayIncome = recs.filter(r => new Date(r.created_at).toLocaleDateString('en-CA') === todayStr).reduce((s, r) => s + (Number(r.fee) || 0), 0);
  }
  if (exps) {
   stats.todayExpenses = exps.filter(e => new Date(e.created_at).toLocaleDateString('en-CA') === todayStr).reduce((s, e) => s + (Number(e.amount) || 0), 0);
  }
  stats.totalPatients = pCount || 0;

  isLoading = false;
 }

 function sendWhatsapp(type: 'daily' | 'monthly') {
  if (!docInfo?.whatsapp_number) return alert("ژمارا واتساپێ ل دەف ئەدمینی نەهاتییە تۆمارکرن!");
  const msg = `📋 ڕاپۆرتا ڕۆژانە%0A----------%0A👨‍⚕️ دکتۆر: ${docInfo.doctor_name}%0A👥 تەمامبووی: ${stats.completed}%0A💰 داهات: $${stats.todayIncome}%0A💸 خەرجی: $${stats.todayExpenses}%0A📅 ڕێکەفت: ${new Date().toLocaleDateString()}`;
  window.open(`https://wa.me/${docInfo.whatsapp_number}?text=${msg}`, '_blank');
 }
</script>

<div class="pro-dashboard">
 <!-- 🌟 Top Section -->
 <header class="top-bar">
  <div class="welcome">
   <h1>سڵاڤ دکتۆر! 👋</h1>
   <p>ئەڤرۆ <b>{stats.waiting}</b> نەخۆش ل هێڤییا تە نە.</p>
  </div>
  <div class="wa-actions">
   <button class="whatsapp-btn daily" onclick={() => sendWhatsapp('daily')}>📱 واتساپا ڕۆژانە</button>
  </div>
 </header>

 <!-- 📊 Stats Grid (ئەو بەشێن درست بووین) -->
 <div class="stats-grid">
  <div class="s-card blue">
   <span class="label">کۆما نەخۆشان</span>
   <span class="value">{stats.totalPatients}</span>
  </div>
  <div class="s-card amber">
   <span class="label">ل چاوەڕێیێ (Waiting)</span>
   <span class="value">{stats.waiting}</span>
  </div>
  <div class="s-card emerald">
   <span class="label">تەمام بووینە (Done)</span>
   <span class="value">{stats.completed}</span>
  </div>
  <div class="s-card indigo">
   <span class="label">داهاتێ ئەڤرۆ</span>
   <span class="value">${stats.todayIncome}</span>
  </div>
 </div>

 <div class="dashboard-grid">
  <!-- 🗓️ لایێ چەپێ: لیستا نەخۆشێن ئەڤرۆ (ئەو بەشێ تژی نەدبوو) -->
  <section class="card main-box">
   <div class="section-head"><h3>📅 نەخۆشێن ئەڤرۆ (Today's Queue)</h3>
    <button class="btn-refresh" onclick={loadDashboardData}>🔄 Update</button>
   </div>
   <div class="queue-list">
    {#each todayApps as app}
     <div class="queue-item {app.status === 'Done' ? 'done' : ''}">
      <div class="time">{new Date(app.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
      <div class="p-info">
       <b>{app.patient_name}</b>
       <span class="badge {app.status}">{app.status}</span>
      </div>
      <button class="btn-action" onclick={() => goto('/appointments')}>⚙️</button>
     </div>
    {:else}
     <div class="empty-state">چو نەخۆش بۆ ڕێکەفتا ئەڤرۆ ({new Date().toLocaleDateString()}) نەهاتینە دیتن.</div>
    {/each}
   </div>
  </section>

  <!-- 💰 لایێ ڕاستێ: کورتیا دارایی -->
  <section class="card main-box">
   <h3>💰 کورتیا دارایی یا ئەڤرۆ</h3>
   <div class="finance-list">
    <div class="f-row"><span>داهاتێ ئەڤرۆ:</span> <b style="color: #10b981;">+${stats.todayIncome}</b></div>
    <div class="f-row"><span>خەرجیێن ئەڤرۆ:</span> <b style="color: #ef4444;">-${stats.todayExpenses}</b></div>
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
 /* دیزاین وەک خۆیە و نەهاتییە گۆهۆڕین */
 .pro-dashboard { padding: 15px; color: var(--text); font-family: sans-serif; }
 .top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
 .welcome h1 { font-size: 1.8rem; font-weight: 900; color: #4f46e5; margin: 0; }
 .whatsapp-btn { background: #25d366; color: white; border: none; padding: 12px 20px; border-radius: 50px; cursor: pointer; font-weight: bold; }
 .stats-grid { display: flex; gap: 15px; margin-bottom: 30px; }
 .s-card { flex: 1; background: var(--card, white); padding: 25px; border-radius: 20px; border: 1px solid var(--border, #eee); text-align: center; }
 .s-card .label { display: block; font-size: 0.75rem; font-weight: bold; opacity: 0.5; text-transform: uppercase; }
 .s-card .value { font-size: 2rem; font-weight: 900; }
 .blue { border-bottom: 6px solid #3b82f6; }
 .amber { border-bottom: 6px solid #f59e0b; }
 .emerald { border-bottom: 6px solid #10b981; }
 .indigo { border-bottom: 6px solid #6366f1; }
 .dashboard-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 25px; }
 .card { background: var(--card, white); border-radius: 24px; padding: 30px; border: 1px solid var(--border, #eee); }
 .section-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
 .queue-item { display: flex; align-items: center; gap: 20px; padding: 15px; background: rgba(0,0,0,0.02); border-radius: 18px; margin-bottom: 10px; }
 .time { font-weight: 900; color: #4f46e5; }
 .badge { font-size: 0.65rem; padding: 2px 8px; border-radius: 10px; font-weight: bold; }
 .badge.Pending { background: #fef3c7; color: #92400e; }
 .badge.Done { background: #dcfce7; color: #166534; }
 .finance-list { display: flex; flex-direction: column; gap: 15px; }
 .f-row { display: flex; justify-content: space-between; padding-bottom: 10px; border-bottom: 1px solid rgba(0,0,0,0.05); }
 .f-total { text-align: center; margin-top: 20px; }
 .btn-refresh { background: none; border: none; cursor: pointer; font-size: 1.2rem; }
 :global(.dark-mode) .card { background: #1e293b; border-color: #334155; }
</style>
<script lang="ts">
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 // ١. گۆڕاوێن داتایان
 let doctorId = $state(0);
 let docInfo = $state<any>(null);
 let isLoading = $state(true);

 let stats = $state({
  totalP: 0,
  todayInc: 0,
  totalInc: 0,
  totalExp: 0,
  profit: 0,
  todayVisits: 0
 });

 let reportData = $state({ monthP: 0, monthE: 0, monthInc: 0 });
 let recentVisits = $state<any[]>([]);

 onMount(async () => {
  const id = localStorage.getItem('doctor_id');
  if (id) {
   doctorId = Number(id);
   await loadAllDashboardData();
  }
 });

 async function loadAllDashboardData() {
  isLoading = true;
  const now = new Date();
  const todayStr = now.toDateString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // ئینانا زانیاریێن دکتۆری
  const { data: doc } = await supabase.from('doctors').select('*').eq('id', doctorId).single();
  docInfo = doc;

  // ئینانا هەمی ڕاپۆرتێن پزیشکی (داهات)
  const { data: recs } = await supabase.from('medical_records').select('fee, created_at, patients(name)').eq('doctor_id', doctorId);
  
  // ئینانا هەمی خەرجییان
  const { data: exps } = await supabase.from('expenses').select('amount, created_at').eq('doctor_id', doctorId);
  
  // ئینانا کۆما نەخۆشان
  const { count } = await supabase.from('patients').select('*', { count: 'exact', head: true }).eq('doctor_id', doctorId);

  if (recs) {
   let tInc = 0; let dInc = 0; let dVis = 0; let mInc = 0; let mVis = 0;
   recs.forEach(r => {
    const rFee = Number(r.fee) || 0;
    const rDate = new Date(r.created_at);
    tInc += rFee;
    if (rDate.toDateString() === todayStr) { dInc += rFee; dVis++; }
    if (rDate >= monthStart) { mInc += rFee; mVis++; }
   });
   stats.totalInc = tInc;
   stats.todayInc = dInc;
   stats.todayVisits = dVis;
   reportData.monthInc = mInc;
   reportData.monthP = mVis;
   recentVisits = recs.slice(-5).reverse();
  }

  if (exps) {
   let tExp = 0; let mExp = 0;
   exps.forEach(e => {
    const eAmt = Number(e.amount) || 0;
    const eDate = new Date(e.created_at);
    tExp += eAmt;
    if (eDate >= monthStart) mExp += eAmt;
   });
   stats.totalExp = tExp;
   reportData.monthE = mExp;
  }

  stats.totalP = count || 0;
  stats.profit = stats.totalInc - stats.totalExp;
  isLoading = false;
 }

 // 📱 فانکشنا واتساپێ (دگەل خەرجییان)
 function sendWhatsapp(type: 'daily' | 'monthly') {
  if (!docInfo?.whatsapp_number) return alert("ژمارا واتساپێ ل دەف ئەدمینی نەهاتییە تۆمارکرن!");
  
  const label = type === 'daily' ? "📋 ڕاپۆرتا ڕۆژانە" : "📊 ڕاپۆرتا مەهانە";
  const pCount = type === 'daily' ? stats.todayVisits : reportData.monthP;
  const income = type === 'daily' ? stats.todayInc : reportData.monthInc;
  const expenses = type === 'daily' ? (stats.totalExp / 30).toFixed(0) : reportData.monthE; // خەمڵاندن بۆ ڕۆژانە

  const msg = `${label}%0A----------%0A👨‍⚕️ دکتۆر: ${docInfo.doctor_name}%0A🏥 کلینیک: ${docInfo.clinic_name}%0A👥 نەخۆشێن تەمامبووی: ${pCount}%0A💰 داهات: $${income}%0A💸 خەرجی: $${expenses}%0A📅 ڕێکەفت: ${new Date().toLocaleDateString()}`;
  
  window.open(`https://wa.me/${docInfo.whatsapp_number}?text=${msg}`, '_blank');
 }
</script>

<div class="dashboard">
 <header class="dash-head">
  <h1>ناڤەندا کۆنترۆڵا کلینیکێ 🏥</h1>
  <button class="refresh-btn" onclick={loadAllDashboardData}>🔄 Update</button>
 </header>

 <!-- ١. کارتێن ئامارێن سەرەکی -->
 <div class="stats-grid">
  <div class="stat-card blue"><p>نەخۆشێن گشتی</p><h3>{stats.totalP}</h3></div>
  <div class="stat-card green"><p>داهاتێ ئەڤرۆ</p><h3>${stats.todayInc}</h3></div>
  <div class="stat-card indigo"><p>کۆما داهاتی</p><h3>${stats.totalInc}</h3></div>
  <div class="stat-card red"><p>کۆما خەرجییان</p><h3>${stats.totalExp}</h3></div>
 </div>

 <div class="main-grid">
  <!-- ٢. کورتیا قازانج و داهاتی -->
  <div class="card glass">
   <h3>📈 کورتیا قازانجا سافی</h3>
   <h2 class="profit-val" style="color: {stats.profit >= 0 ? '#10b981' : '#f43f5e'}">${stats.profit}</h2>
   <div class="mini-stats"><div class="m-row"><span>داهات (+)</span> <b style="color:#10b981">${stats.totalInc}</b></div>
    <div class="m-row"><span>خەرجی (-)</span> <b style="color:#f43f5e">${stats.totalExp}</b></div>
   </div>
   
   <!-- ڕاپۆرتێن واتساپێ لێرە زێدە بوون -->
   <div class="report-actions">
    <h4>فرێکرنا ڕاپۆرتێ بۆ واتساپێ:</h4>
    <div class="btn-group">
     <button class="wa-btn" onclick={() => sendWhatsapp('daily')}>📱 ڕۆژانە</button>
     <button class="wa-btn" onclick={() => sendWhatsapp('monthly')}>📊 مەهانە</button>
    </div>
   </div>
  </div>

  <!-- ٣. نویترین سەرەدانێن نەخۆشان -->
  <div class="card glass">
   <h3>🕒 نویترین چالاکی</h3>
   <div class="activity-list">
    {#each recentVisits as v}
     <div class="v-row">
      <span>👤 {v.patients?.name || 'Patient'}</span>
      <b style="color:#10b981">+${v.fee}</b>
     </div>
    {:else}
     <p class="empty">چو داتا نینن.</p>
    {/each}
   </div>
  </div>
 </div>
</div>

<style>
 .dashboard { color: var(--text); padding: 10px; font-family: sans-serif; }
 .dash-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
 .refresh-btn { background: #f3f4f6; border: 1px solid #ddd; padding: 8px 15px; border-radius: 10px; cursor: pointer; color: #333; font-weight: bold; }

 .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
 .stat-card { padding: 25px; border-radius: 20px; color: white; text-align: center; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
 .blue { background: #4f46e5; } .green { background: #10b981; } .indigo { background: #6366f1; } .red { background: #f43f5e; }
 .stat-card h3 { margin: 10px 0 0; font-size: 2rem; font-weight: 800; }
 .stat-card p { margin: 0; font-size: 0.8rem; font-weight: bold; opacity: 0.8; text-transform: uppercase; }

 .main-grid { display: grid; grid-template-columns: 1fr 1.5fr; gap: 25px; }
 @media (max-width: 900px) { .main-grid { grid-template-columns: 1fr; } }
 
 .card { background: var(--card, white); padding: 25px; border-radius: 25px; border: 1px solid var(--border, #eee); }
 .profit-val { font-size: 3rem; font-weight: 900; text-align: center; margin: 15px 0; }
 .m-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(0,0,0,0.05); }

 .report-actions { margin-top: 25px; padding-top: 20px; border-top: 2px dashed #eee; }
 .report-actions h4 { font-size: 0.9rem; margin-bottom: 15px; opacity: 0.7; }
 .btn-group { display: flex; gap: 10px; }
 .wa-btn { flex: 1; background: #25d366; color: white; border: none; padding: 12px; border-radius: 12px; cursor: pointer; font-weight: bold; transition: 0.3s; }
 .wa-btn:hover { transform: translateY(-2px); box-shadow: 0 5px 10px rgba(37, 211, 102, 0.3); }

 .v-row { display: flex; justify-content: space-between; padding: 12px; background: rgba(0,0,0,0.03); border-radius: 12px; margin-bottom: 10px; }
 
 :global(.dark-mode) .card, :global(.dark-mode) .v-row { background: #1e293b; border-color: #334155; color: white; }
</style>
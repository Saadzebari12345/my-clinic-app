<script lang="ts">
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 let stats = $state({ totalPatients: 0, todayPatients: 0, monthlyRevenue: 0, todayRevenue: 0 });
 let recentRecords = $state<any[]>([]);
 let doctorId = $state(0);

 onMount(async () => {
  doctorId = Number(localStorage.getItem('doctor_id'));
  if (doctorId) fetchDashboardData();
 });

 async function fetchDashboardData() {
  const today = new Date().toISOString().split('T')[0];

  // ١. ئامارێن گشتی یێن نەخۆشان
  const { count: totalP } = await supabase.from('patients').select('*', { count: 'exact', head: true }).eq('doctor_id', doctorId);
  
  // ٢. داهات و نەخۆشێن ئەڤرۆ
  const { data: records } = await supabase.from('medical_records')
   .select('fee, created_at, diagnosis, patients(name)')
   .eq('doctor_id', doctorId);

  if (records) {
   stats.totalPatients = totalP || 0;
   stats.todayPatients = records.filter(r => r.created_at.startsWith(today)).length;
   stats.todayRevenue = records.filter(r => r.created_at.startsWith(today)).reduce((sum, r) => sum + (r.fee || 0), 0);
   stats.monthlyRevenue = records.reduce((sum, r) => sum + (r.fee || 0), 0);
   recentRecords = records.slice(-5).reverse(); // دووماهی ٥ سەرەدان
  }
 }
</script>

<div class="dashboard">
 <h2 class="title">🚀 Clinic Performance Analytics</h2>

 <!-- کارتێن زیرەک یێن ئاماران -->
 <div class="stats-grid">
  <div class="stat-card purple">
   <div class="icon">👥</div>
   <div class="info">
    <p>Total Patients</p>
    <h3>{stats.totalPatients}</h3>
   </div>
  </div>
  <div class="stat-card green">
   <div class="icon">💰</div>
   <div class="info">
    <p>Today's Earnings</p>
    <h3>${stats.todayRevenue}</h3>
   </div>
  </div>
  <div class="stat-card blue">
   <div class="icon">📅</div>
   <div class="info">
    <p>Today's Visits</p>
    <h3>{stats.todayPatients}</h3>
   </div>
  </div>
  <div class="stat-card gold">
   <div class="icon">📈</div>
   <div class="info">
    <p>Total Revenue</p>
    <h3>${stats.monthlyRevenue}</h3>
   </div>
  </div>
 </div>

 <div class="charts-layout">
  <!-- لیستا نویترین سەرەدانان -->
  <div class="card recent-activity">
   <h3>🕒 Recent Consultations</h3>
   <div class="activity-list">
    {#each recentRecords as record}
     <div class="activity-item">
      <div class="user-avatar">{record.patients?.name[0]}</div>
      <div class="details">
       <p class="name">{record.patients?.name}</p>
       <p class="diag">{record.diagnosis}</p>
      </div>
      <div class="price">+${record.fee}</div>
     </div>
    {:else}
     <p class="empty">No recent activity.</p>
    {/each}
   </div>
  </div>

  <!-- گرافێ سادە یێ گەشەیێ -->
  <div class="card chart-box">
   <h3>📊 Weekly Activity</h3>
   <div class="bar-chart">
    <!-- ئەڤە نموونەیا گرافەکێ CSS یە -->
    <div class="bar" style="height: 40%;" title="Mon"></div>
    <div class="bar" style="height: 70%;" title="Tue"></div>
    <div class="bar" style="height: 50%;" title="Wed"></div>
    <div class="bar" style="height: 90%;" title="Thu"></div>
    <div class="bar" style="height: 60%;" title="Fri"></div>
   </div>
   <p class="chart-label">Patient visits over the last 5 days</p>
  </div>
 </div>
</div>

<style>
 .dashboard { animation: fadeIn 0.5s ease-out; }
 @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

 .title { margin-bottom: 30px; font-weight: 800; color: var(--text); letter-spacing: -0.5px; }

 .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
 
 .stat-card { padding: 25px; border-radius: 20px; display: flex; align-items: center; gap: 20px; color: white; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
 .purple { background: linear-gradient(135deg, #6366f1, #4338ca); }
 .green { background: linear-gradient(135deg, #10b981, #059669); }
 .blue { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
 .gold { background: linear-gradient(135deg, #f59e0b, #d97706); }

 .stat-card .icon { font-size: 2.5rem; opacity: 0.8; }
 .stat-card p { margin: 0; font-size: 0.85rem; font-weight: 600; opacity: 0.9; }
 .stat-card h3 { margin: 5px 0 0 0; font-size: 1.8rem; font-weight: 800; }

 .charts-layout { display: grid; grid-template-columns: 1.5fr 1fr; gap: 25px; }
 @media (max-width: 900px) { .charts-layout { grid-template-columns: 1fr; } }

 .card { background: var(--card, white); padding: 25px; border-radius: 20px; border: 1px solid var(--border, #eee); box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
 
 .activity-list { display: flex; flex-direction: column; gap: 15px; margin-top: 20px; }
 .activity-item { display: flex; align-items: center; gap: 15px; padding-bottom: 15px; border-bottom: 1px solid #f1f5f9; }
 .user-avatar { width: 40px; height: 40px; background: #e0e7ff; color: #4f46e5; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; }
 .details { flex: 1; }
 .details .name { margin: 0; font-weight: bold; font-size: 0.95rem; }
 .details .diag { margin: 0; font-size: 0.8rem; opacity: 0.6; }
 .price { font-weight: 800; color: #10b981; font-size: 0.9rem; }

 .bar-chart { display: flex; align-items: flex-end; justify-content: space-around; height: 150px; margin-top: 30px; gap: 10px; }
 .bar { width: 30px; background: #6366f1; border-radius: 5px 5px 0 0; transition: 0.3s; cursor: pointer; }
 .bar:hover { background: #4f46e5; transform: scaleY(1.05); }
 .chart-label { text-align: center; font-size: 0.75rem; opacity: 0.5; margin-top: 15px; }
</style>
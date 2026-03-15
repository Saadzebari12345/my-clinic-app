<script lang="ts">
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';
 import { goto } from '$app/navigation';

 // ١. گۆڕاوێن سەرەکی
 let doctorId = $state(0);
 let isLoading = $state(true);
 let searchTerm = $state("");
 
 let todayApps = $state<any[]>([]); // ژڤانێن ئەڤرۆ
 let recentRecords = $state<any[]>([]); // نویترین ڕاپۆرتێن پزیشکی
 let stats = $state({ totalP: 0, pending: 0, completed: 0 });

 onMount(async () => {
  const id = localStorage.getItem('doctor_id');
  if (id) {
   doctorId = Number(id);
   await loadLiveDashboard();
  }
 });

 async function loadLiveDashboard() {
  isLoading = true;
  const today = new Date().toLocaleDateString('en-CA');

  // ئینانا هەمی داتایان پێکڤە
  const [apps, patients, records] = await Promise.all([
   supabase.from('appointments').select('*').eq('doctor_id', doctorId).eq('date', today).order('date', {ascending: true}),
   supabase.from('patients').select('id', { count: 'exact', head: true }).eq('doctor_id', doctorId),
   supabase.from('medical_records').select('diagnosis, created_at, patients(name)').eq('doctor_id', doctorId).order('created_at', {ascending: false}).limit(5)
  ]);

  if (apps.data) {
   todayApps = apps.data;
   stats.pending = todayApps.filter(a => a.status === 'Pending').length;
   stats.completed = todayApps.filter(a => a.status === 'Done').length;
  }
  
  stats.totalP = patients.count || 0;
  if (records.data) recentRecords = records.data;
  
  isLoading = false;
 }

 // گەڕیانا ب لەز (Search)
 async function quickSearch() {
  if (searchTerm.length < 2) return;
  const { data } = await supabase.from('patients').select('id').ilike('name', `%${searchTerm}%`).limit(1).single();
  if (data) goto(`/patients/${data.id}`);
 }
</script>

<div class="pro-dashboard">
 <!-- 🌟 بەشێ پێشوازیێ و گەڕیانێ -->
 <header class="top-section">
  <div class="welcome">
   <h1>سڵاڤ دکتۆر! 👋</h1>
   <p>ئەڤرۆ <b>{todayApps.length}</b> نەخۆش یێن ل چاوەڕێی تە.</p>
  </div>
  <div class="search-pill">
   <input bind:value={searchTerm} oninput={quickSearch} placeholder="🔍 ناڤێ نەخۆشی لێرە بگەڕیێ..." />
  </div>
 </header>

 <!-- 📊 کارتێن زیرەک (Mini Stats) -->
 <div class="quick-stats">
  <div class="s-card">
   <span class="label">کۆما نەخۆشان</span>
   <span class="value">{stats.totalP}</span>
  </div>
  <div class="s-card highlight">
   <span class="label">چاوەڕێ دکەن</span>
   <span class="value">{stats.pending}</span>
  </div>
  <div class="s-card success">
   <span class="label">تەمام بووینە</span>
   <span class="value">{stats.completed}</span>
  </div>
 </div>

 <div class="dashboard-grid">
  <!-- 🗓️ لایێ چەپێ: لیستا زیندی یا ئەڤرۆ -->
  <section class="live-queue card">
   <div class="section-head">
    <h3>📅 سەرێ نەخۆشێن ئەڤرۆ</h3>
    <button class="btn-refresh" onclick={loadLiveDashboard}>🔄</button>
   </div>
   <div class="queue-list">
    {#each todayApps as app}
     <div class="queue-item {app.status === 'Done' ? 'done' : ''}">
      <div class="time">{new Date(app.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
      <div class="p-name">
       <b>{app.patient_name}</b>
       <span>{app.status}</span>
      </div>
      <button class="btn-go" onclick={() => goto('/appointments')}>➡️</button>
     </div>
    {:else}
     <div class="empty-state">چو ژڤان بۆ ئەڤرۆ نینن.</div>
    {/each}
   </div>
  </section>

  <!-- 📜 لایێ ڕاستێ: نویترین ڕاپۆرتێن پزیشکی -->
  <section class="recent-records card">
   <h3>📜 نویترین ڕاپۆرتێن پزیشکی</h3>
   <div class="record-feed">
    {#each recentRecords as rec}
     <div class="feed-item">
      <div class="feed-avatar">{rec.patients?.name[0]}</div>
      <div class="feed-info">
       <b>{rec.patients?.name}</b>
       <p>{rec.diagnosis}</p>
       <small>{new Date(rec.created_at).toLocaleDateString()}</small>
      </div>
     </div>
    {:else}
     <p>چو ڕاپۆرت نەهاتینە تۆمارکرن.</p>
    {/each}
   </div>
  </section>
 </div>
</div>

<style>
 .pro-dashboard { padding: 10px; color: var(--text); animation: fadeIn 0.4s ease; }@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

 /* Header & Search */
 .top-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; flex-wrap: wrap; gap: 20px; }
 .welcome h1 { font-size: 2rem; font-weight: 800; margin: 0; color: #4f46e5; }
 .search-pill { background: white; border-radius: 50px; padding: 5px 20px; border: 1px solid #e2e8f0; width: 350px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
 .search-pill input { border: none; width: 100%; padding: 10px; outline: none; font-size: 0.9rem; }

 /* Mini Cards */
 .quick-stats { display: flex; gap: 15px; margin-bottom: 30px; }
 .s-card { flex: 1; background: var(--card, white); padding: 20px; border-radius: 20px; border: 1px solid var(--border, #eee); display: flex; flex-direction: column; }
 .s-card .label { font-size: 0.75rem; font-weight: 600; opacity: 0.6; text-transform: uppercase; }
 .s-card .value { font-size: 1.8rem; font-weight: 800; }
 .highlight { border-left: 5px solid #f59e0b; }
 .success { border-left: 5px solid #10b981; }

 /* Grid Layout */
 .dashboard-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 25px; }
 @media (max-width: 900px) { .dashboard-grid { grid-template-columns: 1fr; } }

 .card { background: var(--card, white); border-radius: 24px; padding: 25px; border: 1px solid var(--border, #eee); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.02); }
 .section-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }

 /* Queue List */
 .queue-list { display: flex; flex-direction: column; gap: 10px; }
 .queue-item { display: flex; align-items: center; gap: 15px; padding: 15px; background: rgba(0,0,0,0.02); border-radius: 18px; transition: 0.3s; }
 .queue-item:hover { transform: scale(1.02); background: white; border: 1px solid #ddd; }
 .queue-item.done { opacity: 0.5; background: #f1f5f9; }
 .time { font-weight: 800; color: #4f46e5; width: 60px; font-size: 0.9rem; }
 .p-name { flex: 1; display: flex; flex-direction: column; }
 .p-name span { font-size: 0.7rem; opacity: 0.5; font-weight: bold; }
 .btn-go { background: none; border: none; cursor: pointer; font-size: 1.2rem; }

 /* Feed Section */
 .record-feed { display: flex; flex-direction: column; gap: 15px; }
 .feed-item { display: flex; align-items: center; gap: 12px; }
 .feed-avatar { width: 40px; height: 40px; background: #e0e7ff; color: #4f46e5; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; }
 .feed-info b { font-size: 0.9rem; }
 .feed-info p { margin: 2px 0; font-size: 0.8rem; opacity: 0.7; }
 .feed-info small { font-size: 0.7rem; opacity: 0.5; }

 .btn-refresh { background: none; border: none; cursor: pointer; font-size: 1.1rem; }

 :global(.dark-mode) .card, :global(.dark-mode) .search-pill { background: #1e293b; border-color: #334155; }
 :global(.dark-mode) .queue-item { background: #0f172a; }
</style>
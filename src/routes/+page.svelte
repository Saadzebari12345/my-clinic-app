<script lang="ts">
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';
 import { goto } from '$app/navigation';

 // ١. گۆڕاوێن سەرەکی
 let doctorId = $state(0);
 let isLoading = $state(true);
 
 // گۆڕاوێن گەڕیانێ
 let searchTerm = $state("");
 let searchResults = $state<any[]>([]);

 // داتایێن داشبۆردێ
 let todayApps = $state<any[]>([]);
 let recentRecords = $state<any[]>([]);
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
  
  // دیارکرنا دەسپێک و دووماهیا ئەڤرۆ ب شێوەیەکێ زانستی
  const start = new Date(); start.setHours(0,0,0,0);
  const end = new Date(); end.setHours(23,59,59,999);

  const [apps, patients, records] = await Promise.all([
   // ١. ئینانا ژڤانێن ئەڤرۆ
   supabase.from('appointments').select('*').eq('doctor_id', doctorId)
    .gte('date', start.toISOString()).lte('date', end.toISOString()).order('date', {ascending: true}),
   
   // ٢. کۆما گشتی یا نەخۆشان
   supabase.from('patients').select('id', { count: 'exact', head: true }).eq('doctor_id', doctorId),
   
   // ٣. نویترین ڕاپۆرتێن پزیشکی (بێ مەرجێ کاتی دا سفر نەبیت)
   supabase.from('medical_records').select('diagnosis, created_at, patients(name)').eq('doctor_id', doctorId).order('created_at', {ascending: false}).limit(5)
  ]);

  if (apps.data) {
   todayApps = apps.data;
   stats.pending = todayApps.filter(a => a.status === 'Pending' || a.status === 'Confirmed').length;
   stats.completed = todayApps.filter(a => a.status === 'Done').length;
  }
  
  stats.totalP = patients.count || 0;
  if (records.data) recentRecords = records.data;
  
  isLoading = false;
 }

 // 🔍 فانکشنا گەڕیانێ ب شێوازێ لیستە (Selection)
 async function handleSearch() {
  if (searchTerm.length < 2) {
   searchResults = [];
   return;
  }
  const { data } = await supabase.from('patients')
   .select('id, name, phone')
   .eq('doctor_id', doctorId)
   .ilike('name', `%${searchTerm}%`)
   .limit(5);
  
  searchResults = data || [];
 }
</script>

<div class="pro-dashboard">
 <!-- 🌟 سەرێ لاپەرەی و گەڕیان -->
 <header class="top-section">
  <div class="welcome">
   <h1>سڵاڤ دکتۆر! 👋</h1>
   <p>ئەڤرۆ {todayApps.length} نەخۆش ل هێڤییا تە نە.</p>
  </div>

  <div class="search-container">
   <div class="search-pill">
    <input bind:value={searchTerm} oninput={handleSearch} placeholder="🔍 بگەڕیێ ل دویڤ نەخۆشی..." />
   </div>
   <!-- لیستا ئەنجامێن گەڕیانێ -->
   {#if searchResults.length > 0}
    <div class="search-results card">
     {#each searchResults as result}
      <button onclick={() => { goto(`/patients/${result.id}`); searchResults = []; searchTerm = ""; }}>
       <b>{result.name}</b>
       <span>{result.phone}</span>
      </button>
     {/each}
    </div>
   {/if}
  </div>
 </header>

 <!-- 📊 کارتێن ئاماران -->
 <div class="quick-stats">
  <div class="s-card blue">
   <span class="label">کۆما نەخۆشان</span>
   <span class="value">{stats.totalP}</span>
  </div>
  <div class="s-card amber">
   <span class="label">ل چاوەڕێیێ</span>
   <span class="value">{stats.pending}</span>
  </div>
  <div class="s-card emerald">
   <span class="label">تەمام بووینە</span>
   <span class="value">{stats.completed}</span>
  </div>
 </div>

 <div class="dashboard-grid">
  <!-- 🗓️ لیستا ئەڤرۆ -->
  <section class="card main-box">
   <div class="section-head">
    <h3>📅 نەخۆشێن ئەڤرۆ (Queue)</h3>
    <button class="btn-refresh" onclick={loadLiveDashboard}>🔄</button>
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
     </div>{:else}
     <div class="empty-state">چو ژڤان بۆ ئەڤرۆ نەهاتینە تۆمارکرن.</div>
    {/each}
   </div>
  </section>

  <!-- 📜 نویترین ڕاپۆرت -->
  <section class="card main-box">
   <h3>📜 دووماهی ڕاپۆرتێن پزیشکی</h3>
   <div class="feed-list">
    {#each recentRecords as rec}
     <div class="feed-item">
      <div class="avatar">{rec.patients?.name[0]}</div>
      <div class="details">
       <b>{rec.patients?.name}</b>
       <p>{rec.diagnosis}</p>
       <small>{new Date(rec.created_at).toLocaleDateString()}</small>
      </div>
     </div>
    {:else}
     <p class="empty-state">چو ڕاپۆرت نەهاتینە تۆمارکرن.</p>
    {/each}
   </div>
  </section>
 </div>
</div>

<style>
 .pro-dashboard { padding: 15px; color: var(--text); animation: fadeIn 0.4s ease; }
 @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

 .top-section { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; flex-wrap: wrap; gap: 20px; }
 .welcome h1 { font-size: 1.8rem; font-weight: 900; color: #4f46e5; margin: 0; }

 /* 🔍 Search Styles */
 .search-container { position: relative; width: 350px; }
 .search-pill { background: white; border-radius: 50px; padding: 5px 20px; border: 1px solid #e2e8f0; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
 .search-pill input { border: none; width: 100%; padding: 10px; outline: none; font-size: 0.9rem; color: #333; }
 .search-results { position: absolute; top: 60px; width: 100%; z-index: 100; padding: 10px; display: flex; flex-direction: column; gap: 5px; box-shadow: 0 10px 25px rgba(0,0,0,0.15); }
 .search-results button { background: none; border: none; padding: 12px; text-align: left; cursor: pointer; border-radius: 10px; display: flex; flex-direction: column; transition: 0.2s; }
 .search-results button:hover { background: #f3f4f6; }
 .search-results b { color: #1e293b; font-size: 0.9rem; }
 .search-results span { font-size: 0.75rem; color: #64748b; }

 /* Stats */
 .quick-stats { display: flex; gap: 15px; margin-bottom: 30px; }
 .s-card { flex: 1; background: var(--card, white); padding: 25px; border-radius: 24px; border: 1px solid var(--border, #eee); box-shadow: 0 4px 6px rgba(0,0,0,0.02); text-align: center; }
 .s-card .label { display: block; font-size: 0.8rem; font-weight: bold; opacity: 0.5; text-transform: uppercase; margin-bottom: 5px; }
 .s-card .value { font-size: 2rem; font-weight: 900; }
 .blue { border-bottom: 6px solid #3b82f6; }
 .amber { border-bottom: 6px solid #f59e0b; }
 .emerald { border-bottom: 6px solid #10b981; }

 /* Grid */
 .dashboard-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 25px; }
 @media (max-width: 900px) { .dashboard-grid { grid-template-columns: 1fr; } }

 .card { background: var(--card, white); border-radius: 28px; padding: 30px; border: 1px solid var(--border, #eee); }
 .section-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }

 .queue-item { display: flex; align-items: center; gap: 20px; padding: 18px; background: rgba(0,0,0,0.02); border-radius: 20px; margin-bottom: 10px; }
 .queue-item.done { opacity: 0.5; background: #f1f5f9; }
 .time { font-weight: 900; color: #4f46e5; font-size: 1rem; }
 .p-info { flex: 1; }
 .badge { font-size: 0.7rem; padding: 2px 8px; border-radius: 10px; font-weight: bold; }
 .badge.Pending { background: #fef3c7; color: #92400e; }
 .badge.Done { background: #dcfce7; color: #166534; }

 .feed-item { display: flex; align-items: center; gap: 15px; margin-bottom: 20px; }
 .avatar { width: 45px; height: 45px; background: #e0e7ff; color: #4f46e5; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; }
 .details b { font-size: 0.95rem; }
 .details p { margin: 2px 0; font-size: 0.85rem; opacity: 0.7; }

 .btn-refresh { background: none; border: none; cursor: pointer; font-size: 1.2rem; }
 .btn-action { background: #eee; border: none; width: 35px; height: 35px; border-radius: 10px; cursor: pointer; }

 :global(.dark-mode) .card, :global(.dark-mode) .search-pill, :global(.dark-mode) .search-results { background: #1e293b; border-color: #334155; }
 :global(.dark-mode) .queue-item { background: #0f172a; }
 :global(.dark-mode) .search-results b { color: white; }
</style>
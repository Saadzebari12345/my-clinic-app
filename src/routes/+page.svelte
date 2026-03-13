<script lang="ts">
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 let stats = $state({ totalP: 0, income: 0, expenses: 0, profit: 0, todayV: 0 });
 let recentRecords = $state<any[]>([]);
 let doctorId = $state(0);

 onMount(async () => {
  doctorId = Number(localStorage.getItem('doctor_id'));
  if (doctorId) fetchData();
 });

 async function fetchData() {
  const today = new Date().toISOString().split('T')[0];

  // ١. ئینانا ژمارەیا نەخۆشان
  const { count } = await supabase.from('patients').select('*', { count: 'exact', head: true }).eq('doctor_id', doctorId);
  stats.totalP = count || 0;

  // ٢. ئینانا داهاتی (Income)
  const { data: records } = await supabase.from('medical_records').select('fee, created_at, diagnosis').eq('doctor_id', doctorId);
  if (records) {
   stats.income = records.reduce((s, r) => s + (r.fee || 0), 0);
   stats.todayV = records.filter(r => r.created_at.startsWith(today)).length;
   recentRecords = records.slice(-4).reverse();
  }

  // ٣. ئینانا خەرجییان (Expenses)
  const { data: exp } = await supabase.from('expenses').select('amount').eq('doctor_id', doctorId);
  if (exp) {
   stats.expenses = exp.reduce((s, e) => s + (e.amount || 0), 0);
  }

  stats.profit = stats.income - stats.expenses;
 }
</script>

<h2 style="margin-bottom: 25px;">🚀 Clinic Intelligence Dashboard</h2>

<div class="stats-grid">
 <div class="card blue">
  <p>Total Patients</p>
  <h3>{stats.totalP}</h3>
 </div>
 <div class="card green">
  <p>Total Income</p>
  <h3>${stats.income}</h3>
 </div>
 <div class="card red">
  <p>Total Expenses</p>
  <h3>${stats.expenses}</h3>
 </div>
 <div class="card gold">
  <p>Net Profit</p>
  <h3>${stats.profit}</h3>
 </div>
</div>

<div class="main-layout">
 <div class="recent-box">
  <h3>🕒 Recent Visits</h3>
  {#each recentRecords as r}
   <div class="item">
    <span>{r.diagnosis}</span>
    <span class="price">+${r.fee}</span>
   </div>
  {:else}
   <p>No recent activity.</p>
  {/each}
 </div>

 <div class="chart-dummy">
  <h3>📊 Daily Traffic</h3>
  <div class="bars">
   <div class="bar" style="height: 40%;"></div>
   <div class="bar" style="height: 80%;"></div>
   <div class="bar" style="height: 60%;"></div>
   <div class="bar" style="height: 95%;"></div>
  </div>
 </div>
</div>

<style>
 .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
 .card { padding: 25px; border-radius: 20px; color: white; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
 .blue { background: linear-gradient(135deg, #6366f1, #4338ca); }
 .green { background: linear-gradient(135deg, #10b981, #059669); }
 .red { background: linear-gradient(135deg, #ef4444, #b91c1c); }
 .gold { background: linear-gradient(135deg, #f59e0b, #d97706); }
 
 h3 { margin: 10px 0 0 0; font-size: 1.8rem; }
 p { margin: 0; font-size: 0.85rem; opacity: 0.9; font-weight: bold; }

 .main-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; }
 .recent-box, .chart-dummy { background: var(--card, white); padding: 25px; border-radius: 20px; border: 1px solid var(--border, #eee); }
 
 .item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: 500; }
 .price { color: #10b981; font-weight: bold; }

 .bars { display: flex; align-items: flex-end; gap: 15px; height: 150px; margin-top: 20px; padding-bottom: 10px; border-bottom: 2px solid #f1f5f9; }
 .bar { flex: 1; background: #6366f1; border-radius: 5px 5px 0 0; transition: 0.5s; }
</style>
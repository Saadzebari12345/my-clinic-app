<script lang="ts">
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 let stats = $state({ totalP: 0, todayInc: 0, totalInc: 0, totalExp: 0, profit: 0 });
 let doctorId = $state(0);
 let isLoading = $state(true);

 onMount(async () => {
  const storedId = localStorage.getItem('doctor_id');
  if (storedId) {
   doctorId = Number(storedId);
   await fetchData();
  }
 });

 async function fetchData() {
  isLoading = true;
  const today = new Date().toDateString();

  // ١. ژمارا پاتێنتان
  const { count } = await supabase.from('patients').select('*', { count: 'exact', head: true }).eq('doctor_id', doctorId);
  
  // ٢. هەمی ڕاپۆرتێن دارایی (Fee)
  const { data: records } = await supabase.from('medical_records').select('fee, created_at').eq('doctor_id', doctorId);
  
  // ٣. هەمی خەرجی (Expenses)
  const { data: exps } = await supabase.from('expenses').select('amount').eq('doctor_id', doctorId);

  let tInc = 0; let dInc = 0;
  if (records) {
   records.forEach(r => {
    const val = Number(r.fee) || 0;
    tInc += val;
    if (new Date(r.created_at).toDateString() === today) dInc += val;
   });
  }

  let tExp = 0;
  if (exps) exps.forEach(e => tExp += (Number(e.amount) || 0));

  stats.totalP = count || 0;
  stats.totalInc = tInc;
  stats.todayInc = dInc;
  stats.totalExp = tExp;
  stats.profit = tInc - tExp;
  isLoading = false;
 }
</script>

<div style="padding: 20px; color: var(--text);">
 <h2>🚀 داشبۆردێ پڕۆفیشناڵ</h2>
 <button onclick={fetchData} style="margin-bottom:20px; padding:10px; cursor:pointer;">🔄 Update Stats</button>
 
 <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
  <div style="background:#4f46e5; color:white; padding:20px; border-radius:15px;">
   <p>Total Patients</p><h3>{stats.totalP}</h3>
  </div>
  <div style="background:#10b981; color:white; padding:20px; border-radius:15px;">
   <p>Today's Income</p><h3>${stats.todayInc}</h3>
  </div>
  <div style="background:#6366f1; color:white; padding:20px; border-radius:15px;">
   <p>Total Income</p><h3>${stats.totalInc}</h3>
  </div>
  <div style="background:#ef4444; color:white; padding:20px; border-radius:15px;">
   <p>Total Expenses</p><h3>${stats.totalExp}</h3>
  </div>
 </div>

 <div style="margin-top:30px; padding:30px; background:var(--card); border:1px solid var(--border); border-radius:20px; text-align:center;">
  <p>Net Profit (قازانجا سافی)</p>
  <h1 style="font-size:3rem; color: #10b981;">${stats.profit}</h1>
 </div>
</div>
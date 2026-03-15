<script lang="ts">
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 let stats = $state({ totalP: 0, todayInc: 0, totalInc: 0, totalExp: 0, profit: 0 });
 let monthlyReport = $state({ patients: 0, income: 0, expenses: 0, profit: 0, show: false });
 let recentVisits = $state<any[]>([]);
 let doctorId = $state(0);
 let isLoading = $state(true);
 let debugMsg = $state(""); // بۆ پشکنینا خەلەتییان

 onMount(async () => {
  const storedId = localStorage.getItem('doctor_id');
  if (storedId) {
   doctorId = Number(storedId);
   await refreshData();
  }
 });

 async function refreshData() {
  isLoading = true;
  const now = new Date();
  const todayStr = now.toLocaleDateString('en-CA'); // "2026-03-16"
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // ١. ئینانا هەمی داتایان ژ داتابەیسێ
  const { count: pCount } = await supabase.from('patients').select('*', { count: 'exact', head: true }).eq('doctor_id', doctorId);
  const { data: records, error: rErr } = await supabase.from('medical_records').select('fee, created_at, patients(name)').eq('doctor_id', doctorId);
  const { data: exps } = await supabase.from('expenses').select('amount, created_at').eq('doctor_id', doctorId);

  if (rErr) debugMsg = "Database Error: " + rErr.message;

  if (records) {
   let tInc = 0; let dInc = 0; let mInc = 0; let mPat = 0;
   
   records.forEach(r => {
    const rFee = Number(r.fee) || 0;
    const rDate = new Date(r.created_at);
    const rDateStr = rDate.toLocaleDateString('en-CA');

    tInc += rFee;

    // پشکنینا "ئەڤرۆ" ب شێوازەکێ گونجای بۆ هەمی Timezone-ان
    if (rDateStr === todayStr) {
     dInc += rFee;
    }

    if (rDate.getMonth() === currentMonth && rDate.getFullYear() === currentYear) {
     mInc += rFee;
     mPat++;
    }
   });

   stats.totalInc = tInc;
   stats.todayInc = dInc;
   monthlyReport.income = mInc;
   monthlyReport.patients = mPat;
   recentVisits = records.slice(-5).reverse();
   
   if (records.length > 0 && dInc === 0) {
    debugMsg = "Data found, but none matches Today's Date: " + todayStr;
   }
  }

  if (exps) {
   let tExp = 0; let mExp = 0;
   exps.forEach(e => {
    const eAmt = Number(e.amount) || 0;
    const eDate = new Date(e.created_at);
    tExp += eAmt;
    if (eDate.getMonth() === currentMonth && eDate.getFullYear() === currentYear) mExp += eAmt;
   });
   stats.totalExp = tExp;
   monthlyReport.expenses = mExp;
  }

  stats.totalP = pCount || 0;
  stats.profit = stats.totalInc - stats.totalExp;
  monthlyReport.profit = monthlyReport.income - monthlyReport.expenses;
  isLoading = false;
 }
</script>

<div class="dashboard">
 <header class="header">
  <h1>ناڤەندا کۆنترۆڵا کلینیکێ 🏥</h1>
  <button class="btn-refresh" onclick={refreshData}>🔄 Update Status</button>
 </header>

 <div class="stats-grid">
  <div class="card blue"><p>نەخۆش</p><h3>{stats.totalP}</h3></div>
  <div class="card green"><p>داهاتێ ئەڤرۆ</p><h3>${stats.todayInc}</h3></div>
  <div class="card indigo"><p>داهاتێ گشتی</p><h3>${stats.totalInc}</h3></div>
  <div class="card red"><p>خەرجی</p><h3>${stats.totalExp}</h3></div>
 </div>

 <div class="main-grid">
  <div class="card glass">
   <h3>📈 قازانجا سافی</h3>
   <h2 style="color: {stats.profit >= 0 ? '#10b981' : '#f43f5e'}">${stats.profit}</h2>
  </div>
  <div class="card glass">
   <h3>🕒 نویترین چالاکی</h3>
   {#each recentVisits as v}
    <div class="row"><span>{v.patients?.name || 'Patient'}</span> <b>+${v.fee}</b></div>
   {:else}
    <p>چو داتا نەهاتینە دیتن.</p>
   {/each}
  </div>
 </div>

 <!-- 🛑 بەشێ پشکنینا خەلەتییان (بتنێ بۆ تە دیارە) -->
 {#if debugMsg}
  <div style="margin-top:20px; padding:15px; background:#fff7ed; border:1px solid #f97316; border-radius:10px; font-size:0.8rem;">
   <b>🛠️ Debug Info:</b> {debugMsg} <br>
   <b>Your ID:</b> {doctorId} | <b>System Date:</b> {new Date().toLocaleDateString('en-CA')}
  </div>
 {/if}
</div>

<style>
 .dashboard { color: var(--text); padding: 15px; font-family: sans-serif; }
 .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
 .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
 .card { padding: 25px; border-radius: 20px; color: white; text-align: center; }
 .blue { background: #4f46e5; } .green { background: #10b981; } .indigo { background: #6366f1; } .red { background: #f43f5e; }
 .main-grid { display: grid; grid-template-columns: 1fr 1.5fr; gap: 20px; }
 .glass { background: var(--card, white); color: var(--text); border: 1px solid var(--border); border-radius: 20px; padding: 25px; }
 .row { display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid rgba(0,0,0,0.05); }
 .btn-refresh { background: #4f46e5; color: white; border: none; padding: 10px 20px; border-radius: 10px; cursor: pointer; font-weight: bold; }
</style>
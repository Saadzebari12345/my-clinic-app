<script lang="ts">
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 let stats = $state({ totalPatients: 0, todayIncome: 0, totalIncome: 0, totalExpenses: 0, netProfit: 0 });
 let monthlyReport = $state({ patients: 0, income: 0, expenses: 0, profit: 0, show: false });
 let recentVisits = $state<any[]>([]);
 let doctorId = $state(0);
 let isLoading = $state(true);

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
  const todayStr = now.toDateString(); // مێژوویا ئەڤرۆ ب نڤیسین
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // ١. ئینانا هەمی داتایان ب ئێکجار
  const { count: pCount } = await supabase.from('patients').select('*', { count: 'exact', head: true }).eq('doctor_id', doctorId);
  const { data: records } = await supabase.from('medical_records').select('fee, created_at, patients(name)').eq('doctor_id', doctorId);
  const { data: exps } = await supabase.from('expenses').select('amount, created_at').eq('doctor_id', doctorId);

  // ٢. حسابکرنا داهاتی
  if (records) {
   let tIncome = 0; let dIncome = 0; let mIncome = 0; let mPatients = 0;
   
   records.forEach(r => {
    const rDate = new Date(r.created_at);
    const rFee = Number(r.fee) || 0;

    tIncome += rFee; // کۆما گشتی

    if (rDate.toDateString() === todayStr) {
     dIncome += rFee; // داهاتێ ئەڤرۆ
    }

    if (rDate.getMonth() === currentMonth && rDate.getFullYear() === currentYear) {
     mIncome += rFee; // داهاتێ هەیڤێ
     mPatients++;
    }
   });

   stats.totalIncome = tIncome;
   stats.todayIncome = dIncome;
   monthlyReport.income = mIncome;
   monthlyReport.patients = mPatients;
   recentVisits = records.slice(-6).reverse();
  }

  // ٣. حسابکرنا خەرجییان
  if (exps) {
   let tExp = 0; let mExp = 0;
   exps.forEach(e => {
    const eDate = new Date(e.created_at);
    const eAmt = Number(e.amount) || 0;
    tExp += eAmt;
    if (eDate.getMonth() === currentMonth && eDate.getFullYear() === currentYear) mExp += eAmt;
   });
   stats.totalExpenses = tExp;
   monthlyReport.expenses = mExp;
  }

  stats.totalPatients = pCount || 0;
  stats.netProfit = stats.totalIncome - stats.totalExpenses;
  monthlyReport.profit = monthlyReport.income - monthlyReport.expenses;
  isLoading = false;
 }
</script>

<div class="dash">
 <header class="head">
  <h1>ناڤەندا کۆنترۆڵا کلینیکێ 🏥</h1>
  <div class="btns">
   <button onclick={refreshData} class="btn-up">{isLoading ? '...' : '🔄 Update'}</button>
   <button onclick={() => monthlyReport.show = true} class="btn-rep">📊 Monthly Report</button>
  </div>
 </header>

 <div class="stats-grid">
  <div class="card blue"><p>نەخۆشێن گشتی</p><h3>{stats.totalPatients}</h3></div>
  <div class="card green"><p>داهاتێ ئەڤرۆ</p><h3>${stats.todayIncome}</h3></div>
  <div class="card indigo"><p>داهاتێ گشتی</p><h3>${stats.totalIncome}</h3></div>
  <div class="card red"><p>کۆما خەرجییان</p><h3>${stats.totalExpenses}</h3></div>
 </div>

 <div class="main-grid">
  <div class="card glass">
   <h3>📈 قازانجا سافی</h3>
   <h2 style="color: {stats.netProfit >= 0 ? '#10b981' : '#f43f5e'}">${stats.netProfit}</h2>
   <div class="mini">
    <p>داهات: <span style="color:#10b981">+${stats.totalIncome}</span></p>
    <p>خەرجی: <span style="color:#f43f5e">-${stats.totalExpenses}</span></p>
   </div>
  </div>
  <div class="card glass">
   <h3>🕒 نویترین چالاکی</h3>
   {#each recentVisits as v}
    <div class="row"><span>{v.patients?.name || 'Patient'}</span> <b>+${v.fee}</b></div>
   {:else}
    <p>چو داتا نینن.</p>
   {/each}
  </div>
 </div>
</div>

<!-- svelte-ignore a11y_click_events_have_key_events -->
{#if monthlyReport.show}
 <!-- svelte-ignore a11y_click_events_have_key_events -->
 <!-- svelte-ignore a11y_no_static_element_interactions -->
 <div class="modal" onclick={() => monthlyReport.show = false}>
  <div class="modal-card" onclick={e => e.stopPropagation()}>
   <h3>📊 ڕاپۆرتا هەیڤا {new Date().getMonth() + 1}</h3>
   <div class="m-row"><span>داهات:</span> <b style="color:green">+${monthlyReport.income}</b></div><div class="m-row"><span>خەرجی:</span> <b style="color:red">-${monthlyReport.expenses}</b></div>
   <div class="m-total"><span>قازانجا سافی:</span> <h2>${monthlyReport.profit}</h2></div>
   <button class="btn-close" onclick={() => monthlyReport.show = false}>Close</button>
  </div>
 </div>
{/if}

<style>
 .dash { color: var(--text); padding: 15px; font-family: sans-serif; }
 .head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
 .btns { display: flex; gap: 10px; }
 .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
 .card { padding: 25px; border-radius: 20px; color: white; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
 .blue { background: #4f46e5; } .green { background: #10b981; } .indigo { background: #6366f1; } .red { background: #f43f5e; }
 .main-grid { display: grid; grid-template-columns: 1fr 1.5fr; gap: 20px; }
 .glass { background: var(--card, white); color: var(--text); border: 1px solid var(--border); padding: 30px; }
 .row { display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid rgba(0,0,0,0.05); }
 .modal { position: fixed; top:0; left:0; width:100%; height:100%; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 1000; }
 .modal-card { background: white; width: 400px; padding: 30px; border-radius: 20px; color: #333; }
 .m-row { display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
 .btn-rep { background: #4f46e5; color: white; border: none; padding: 10px 20px; border-radius: 10px; cursor: pointer; font-weight: bold; }
 .btn-up { background: #eee; color: #333; border: 1px solid #ddd; padding: 10px 20px; border-radius: 10px; cursor: pointer; }
</style>
<script lang="ts">
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 let stats = $state({ income: 0, expenses: 0, profit: 0, totalP: 0 });
 let doctorId = $state(0);

 onMount(async () => {
  doctorId = Number(localStorage.getItem('doctor_id'));
  if (doctorId) {
   // ١. حسابکرنا داهاتی ژ ڕاپۆرتان
   const { data: recs } = await supabase.from('medical_records').select('fee').eq('doctor_id', doctorId);
   const income = recs?.reduce((a, b) => a + (b.fee || 0), 0) || 0;

   // ٢. حسابکرنا خەرجییان ژ خشتەیێ Expenses
   const { data: exps } = await supabase.from('expenses').select('amount').eq('doctor_id', doctorId);
   const expenses = exps?.reduce((a, b) => a + (b.amount || 0), 0) || 0;

   // ٣. وەرگرتنا ژمارەیا نەخۆشان
   const { count } = await supabase.from('patients').select('*', { count: 'exact', head: true }).eq('doctor_id', doctorId);

   stats.income = income;
   stats.expenses = expenses;
   stats.profit = income - expenses; // لێرە قازانج حساب دبیت
   stats.totalP = count || 0;
  }
 });
</script>

<div class="stats-grid">
 <div class="card blue"><h3>{stats.totalP}</h3><p>Total Patients</p></div>
 <div class="card green"><h3>${stats.income}</h3><p>Total Income</p></div>
 <div class="card red"><h3>${stats.expenses}</h3><p>Total Expenses</p></div>
 <div class="card gold"><h3>${stats.profit}</h3><p>Net Profit</p></div>
</div>

<style>
 .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
 .card { padding: 25px; border-radius: 20px; color: white; text-align: center; }
 .blue { background: #4f46e5; } .green { background: #10b981; } .red { background: #ef4444; } .gold { background: #f59e0b; }
 h3 { margin: 0; font-size: 2rem; }
 p { margin: 5px 0 0; opacity: 0.8; font-weight: bold; }
</style>
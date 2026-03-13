<script lang="ts">
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 interface Expense { id: number; amount: number; description: string; created_at: string; }
 
 let expenses = $state<Expense[]>([]);
 let amount = $state('');
 let description = $state('');
 let doctorId = $state(0);
 let isLoading = $state(true);

 // ١. فانکشنا هێنانەڤەیا داتایان ژ داتابەیسا ئۆنلاین (دا ون نەبن)
 async function fetchExpenses() {
  if (!doctorId) return;
  
  const { data, error } = await supabase
   .from('expenses')
   .select('*')
   .eq('doctor_id', doctorId)
   .order('created_at', { ascending: false });
  
  if (!error && data) {
   expenses = data;
  }
  isLoading = false;
 }

 onMount(() => {
  const storedId = localStorage.getItem('doctor_id');
  if (storedId) {
   doctorId = Number(storedId);
   fetchExpenses(); // هەر دەمێ لاپەرە ڤەببیت، داتایان دئینیت
  }
 });

 // ٢. سەیڤکرنا خەرجییا نوی بۆ هەتا هەتایێ
 async function addExpense() {
  if (!amount || !description) return alert("تکایە هەمی خانەیان پڕ بکە");
  
  const { data, error } = await supabase.from('expenses').insert([{
   amount: Number(amount),
   description: description,
   doctor_id: doctorId
  }]).select();

  if (!error && data) {
   expenses = [data[0], ...expenses]; // زێدەکرنا ڕاستەوخۆ بۆ سەر شاشێ
   amount = ''; description = '';
   alert("✅ ب سەرکەفتی هاتە سەیڤکرن");
  } else {
   alert("Error: " + error?.message);
  }
 }

 async function deleteExpense(id: number) {
  if (confirm('ئەرێ تو پشتراستی؟')) {
   const { error } = await supabase.from('expenses').delete().eq('id', id);
   if (!error) expenses = expenses.filter(e => e.id !== id);
  }
 }
</script>

<div class="page-container">
 <h2 style="color: var(--text);">💸 Clinic Expenses (Permanent Storage)</h2>

 <div class="card add-box">
  <div class="input-group">
   <label for="desc">Expense Description</label>
   <input id="desc" bind:value={description} placeholder="e.g. Water Bill, Rent..." />
  </div>
  <div class="input-group" style="width: 150px;">
   <label for="amt">Amount ($)</label>
   <input id="amt" type="number" bind:value={amount} placeholder="0" />
  </div>
  <button class="btn-add" onclick={addExpense}>💾 Save Expense</button>
 </div>

 <div class="card table-container">
  <h3>📜 Expense History</h3>
  <table>
   <thead>
    <tr><th>Description</th><th>Date</th><th>Amount</th><th>Action</th></tr>
   </thead>
   <tbody>
    {#each expenses as exp (exp.id)}
     <tr>
      <td><b>{exp.description}</b></td>
      <td>{new Date(exp.created_at).toLocaleDateString()}</td>
      <td style="color: #ef4444; font-weight: bold;">-${exp.amount}</td>
      <td><button class="btn-del" onclick={() => deleteExpense(exp.id)}>🗑️</button></td>
     </tr>
    {:else}
     <tr><td colspan="4" style="text-align: center; padding: 20px;">
      {isLoading ? 'Loading...' : 'No expenses found.'}
     </td></tr>
    {/each}
   </tbody>
  </table>
 </div>
</div>

<style>
 .page-container { max-width: 900px; color: var(--text); }
 .card { background: var(--card, white); padding: 25px; border-radius: 15px; border: 1px solid var(--border, #ddd); margin-bottom: 25px; }
 .add-box { display: flex; gap: 15px; align-items: flex-end; flex-wrap: wrap; }
 .input-group { flex: 1; display: flex; flex-direction: column; gap: 5px; }
 input { padding: 12px; border-radius: 10px; border: 1px solid var(--border); background: white; color: black; outline: none; }
 .btn-add { background: #10b981; color: white; border: none; padding: 13px 25px; border-radius: 10px; cursor: pointer; font-weight: bold; }
 .table-container { padding: 0; overflow: hidden; }
 table { width: 100%; border-collapse: collapse; }
 th, td { padding: 15px; text-align: left; border-bottom: 1px solid var(--border); }
 .btn-del { background: none; border: none; cursor: pointer; font-size: 1.1rem; }
 h3 { padding: 20px; margin: 0; border-bottom: 1px solid var(--border); font-size: 1.1rem; }
</style>
<script lang="ts">
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 interface Expense { id: number; amount: number; description: string; created_at: string; }
 
 let expenses = $state<Expense[]>([]);
 let amount = $state('');
 let description = $state('');
 let doctorId = $state(0);
 let isSaving = $state(false);

 async function fetchExpenses() {
  const { data } = await supabase.from('expenses').select('*').eq('doctor_id', doctorId).order('created_at', { ascending: false });
  if (data) expenses = data;
 }

 onMount(() => {
  doctorId = Number(localStorage.getItem('doctor_id'));
  if (doctorId) fetchExpenses();
 });

 async function addExpense() {
  if (!amount || !description) return alert("Please fill all fields");
  isSaving = true;

  const { data, error } = await supabase.from('expenses').insert([{
   amount: Number(amount),
   description,
   doctor_id: doctorId
  }]).select();

  if (!error && data) {
   expenses = [data[0], ...expenses];
   amount = ''; description = '';
  }
  isSaving = false;
 }

 async function deleteExpense(id: number) {
  if (confirm('Are you sure?')) {
   await supabase.from('expenses').delete().eq('id', id);
   expenses = expenses.filter(e => e.id !== id);
  }
 }
</script>

<h2 style="margin-bottom: 25px;">💸 Clinic Expenses Management</h2>

<!-- فۆرما زێدەکرنا مەسرەفان -->
<div class="card add-box">
 <div class="input-group">
  <label for="exp-desc">Description</label>
  <input id="exp-desc" bind:value={description} placeholder="e.g. Rent, Electricity, Supplies..." />
 </div>
 <div class="input-group" style="width: 150px;">
  <label for="exp-amt">Amount ($)</label>
  <input id="exp-amt" type="number" bind:value={amount} placeholder="0.00" />
 </div>
 <button onclick={addExpense} disabled={isSaving} class="btn-add">
  {isSaving ? '...' : '+ Add Expense'}
 </button>
</div>

<!-- لیستا خەرجییان -->
<div class="card table-container">
 <table>
  <thead>
   <tr>
    <th>Description</th>
    <th>Date</th>
    <th>Amount</th>
    <th style="text-align: center;">Action</th>
   </tr>
  </thead>
  <tbody>
   {#each expenses as exp}
    <tr>
     <td><b>{exp.description}</b></td>
     <td>{new Date(exp.created_at).toLocaleDateString()}</td>
     <td style="color: #ef4444; font-weight: bold;">-${exp.amount}</td>
     <td style="text-align: center;">
      <button class="btn-del" onclick={() => deleteExpense(exp.id)}>🗑️</button>
     </td>
    </tr>
   {:else}
    <tr><td colspan="4" style="text-align: center; padding: 30px; color: #999;">No expenses recorded yet.</td></tr>
   {/each}
  </tbody>
 </table>
</div>

<style>
 .add-box { display: flex; gap: 15px; padding: 25px; align-items: flex-end; flex-wrap: wrap; background: var(--card, white); border-radius: 15px; border: 1px solid var(--border, #ddd); margin-bottom: 30px; }
 .input-group { flex: 1; display: flex; flex-direction: column; gap: 5px; }
 label { font-size: 0.85rem; font-weight: bold; }
 input { padding: 12px; border-radius: 8px; border: 1px solid #ccc; background: white; color: black; }
 .btn-add { background: #ef4444; color: white; border: none; padding: 13px 25px; border-radius: 10px; cursor: pointer; font-weight: bold; }

 .table-container { background: var(--card, white); border-radius: 15px; border: 1px solid var(--border, #ddd); overflow: hidden; padding: 0; }
 table { width: 100%; border-collapse: collapse; }
 th, td { padding: 15px; text-align: left; border-bottom: 1px solid var(--border, #eee); }
 .btn-del { background: none; border: none; cursor: pointer; font-size: 1.1rem; }
</style>
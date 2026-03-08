<script lang="ts">
 import { onMount } from 'svelte';

 interface Medicine {
  id: number;
  name: string;
  qty: number;
  price: number;
 }

 // ب ڤی شێوازێ جێگیر بنڤیسە دا خەلەتی نەمینن
 let inventory: Medicine[] = $state([]);
 let name = $state('');
 let qty = $state('');
 let price = $state('');

 onMount(() => {
  const saved = localStorage.getItem('my_pharmacy');
  if (saved) {
   try {
    inventory = JSON.parse(saved);
   } catch (e) {
    console.error('Error', e);
   }
  }
 });

 function addMedicine() {
  if (name.trim() !== '' && qty !== '') {
   const newItem: Medicine = {
    id: Date.now(),
    name: name,
    qty: Number(qty),
    price: Number(price) || 0
   };
   inventory = [newItem, ...inventory];
   localStorage.setItem('my_pharmacy', JSON.stringify(inventory));
   name = ''; qty = ''; price = '';
  }
 }

 function deleteItem(id: number) {
  if (confirm('Delete this item?')) {
   inventory = inventory.filter((i) => i.id !== id);
   localStorage.setItem('my_pharmacy', JSON.stringify(inventory));
  }
 }
</script>

<div style="font-family: sans-serif; padding: 20px;">
 <h2>💊 Pharmacy Management</h2>

 <div style="background: white; padding: 20px; border-radius: 12px; border: 1px solid #ddd; display: flex; gap: 10px; margin-bottom: 20px; align-items: flex-end;">
  <input bind:value={name} placeholder="Medicine Name" style="padding: 10px; border-radius: 8px; border: 1px solid #ccc; flex: 2;" />
  <input bind:value={qty} type="number" placeholder="Qty" style="padding: 10px; border-radius: 8px; border: 1px solid #ccc; flex: 1;" />
  <button onclick={addMedicine} style="background: #4f46e5; color: white; padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer;">Add</button>
 </div>

 <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden;">
  <thead style="background: #f8fafc;">
   <tr>
    <th style="padding: 15px; text-align: left;">Name</th>
    <th style="padding: 15px; text-align: left;">Qty</th>
    <th style="padding: 15px; text-align: center;">Action</th>
   </tr>
  </thead>
  <tbody>
   {#each inventory as item}
    <tr style="border-top: 1px solid #eee;">
     <td style="padding: 15px;">{item.name}</td>
     <td style="padding: 15px;">{item.qty}</td>
     <td style="padding: 15px; text-align: center;">
      <button onclick={() => deleteItem(item.id)} style="color: red; background: none; border: none; cursor: pointer;">🗑️</button>
     </td>
    </tr>
   {/each}
  </tbody>
 </table>
</div>
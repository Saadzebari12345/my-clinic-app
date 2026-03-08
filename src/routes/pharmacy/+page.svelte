<script lang="ts">
  import { onMount } from 'svelte';
  let inventory = $state([]);
  let name = $state("");
  let qty = $state("");
  let price = $state("");

  onMount(() => {
    const saved = localStorage.getItem('my_pharmacy');
    if (saved) inventory = JSON.parse(saved);
  });

  function addMedicine() {
    if (name && qty) {
      const newItem = { id: Date.now(), name, qty, price };
      inventory = [newItem, ...inventory];
      localStorage.setItem('my_pharmacy', JSON.stringify(inventory));
      name = ""; qty = ""; price = "";
    }
  }

  function deleteItem(id) {
    inventory = inventory.filter(i => i.id !== id);
    localStorage.setItem('my_pharmacy', JSON.stringify(inventory));
  }
</script>

<h2>💊 Pharmacy Inventory</h2>

<div style="background: white; padding: 20px; border-radius: 12px; border: 1px solid #ddd; margin-bottom: 25px; display: flex; gap: 10px; flex-wrap: wrap; align-items: flex-end;">
  <div style="flex: 2;"><label style="display:block; font-size:0.8rem;">Medicine Name</label><input bind:value={name} style="width:100%; padding:10px; border-radius:8px; border:1px solid #ccc;"/></div>
  <div style="flex: 1;"><label style="display:block; font-size:0.8rem;">Quantity</label><input bind:value={qty} type="number" style="width:100%; padding:10px; border-radius:8px; border:1px solid #ccc;"/></div>
  <div style="flex: 1;"><label style="display:block; font-size:0.8rem;">Price ($)</label><input bind:value={price} type="number" style="width:100%; padding:10px; border-radius:8px; border:1px solid #ccc;"/></div>
  <button onclick={addMedicine} style="background: #6366f1; color: white; border: none; padding: 11px 25px; border-radius: 8px; cursor: pointer; font-weight: bold;">+ Add Stock</button>
</div>

<div style="background: white; border-radius: 12px; border: 1px solid #ddd; overflow: hidden;">
  <table style="width: 100%; border-collapse: collapse;">
    <thead style="background: #f8fafc;">
      <tr>
        <th style="padding: 15px; text-align: left;">Medicine Name</th>
        <th style="padding: 15px; text-align: left;">In Stock</th>
        <th style="padding: 15px; text-align: left;">Price</th>
        <th style="padding: 15px; text-align: center;">Action</th>
      </tr>
    </thead>
    <tbody>
      {#each inventory as item}
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 15px; font-weight: bold;">{item.name}</td>
          <td style="padding: 15px; color: {item.qty < 5 ? 'red' : 'inherit'};">
             {item.qty} {item.qty < 5 ? '(Low Stock!)' : ''}
          </td>
          <td style="padding: 15px;">${item.price}</td>
          <td style="padding: 15px; text-align: center;">
            <button onclick={() => deleteItem(item.id)} style="background: #fee2e2; color: #dc2626; border: none; padding: 5px 10px; border-radius: 6px; cursor: pointer;">🗑️</button>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
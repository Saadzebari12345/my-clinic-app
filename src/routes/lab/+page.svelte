<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabaseClient';

	let patients = $state<any[]>([]);
	let availableTests = $state<string[]>([]);
	let selectedPatient = $state<any>(null);
	let selectedTests = $state<string[]>([]);
	let doctorId = $state(0);
	let docInfo = $state<any>(null);

	onMount(async () => {
		const id = localStorage.getItem('doctor_id');
		if (id) {
			doctorId = Number(id);
			const { data: doc } = await supabase.from('doctors').select('*').eq('id', doctorId).single();
			if (doc) {
				docInfo = doc;
				availableTests = doc.allowed_tests ? doc.allowed_tests.split(',').map((t: string) => t.trim()) : [];
			}
			const { data: p } = await supabase.from('patients').select('*').eq('doctor_id', doctorId);
			if (p) patients = p;
		}
	});

	function toggle(t: string) {
		selectedTests = selectedTests.includes(t) ? selectedTests.filter(i => i !== t) : [...selectedTests, t];
	}

	function printOrder() {
		if (!selectedPatient || selectedTests.length === 0) return alert("Select patient and tests");
		const win = window.open('', '', 'width=900,height=1000');
		win?.document.write(`
			<div style="font-family:sans-serif; padding:50px; border:2px solid #10b981; border-radius:15px; position:relative; height:90vh;">
				<div style="display:flex; justify-content:space-between; border-bottom:3px solid #10b981; padding-bottom:15px; margin-bottom:20px;">
					<div><h1 style="margin:0; color:#10b981;">${docInfo.clinic_name}</h1><p>Dr. ${docInfo.doctor_name}</p></div>
					<div style="text-align:right;">${docInfo.clinic_address}<br>${docInfo.clinic_phone}</div>
				</div>
				<div style="background:#f8fafc; padding:15px; border-radius:10px; display:grid; grid-template-columns:1fr 1fr; margin-bottom:30px;">
					<div><b>Patient:</b> ${selectedPatient.name}</div>
					<div><b>Date:</b> ${new Date().toLocaleDateString('en-GB')}</div>
				</div>
				<h3>Required Lab Investigations:</h3>
				<ul style="font-size:1.3rem; line-height:2.5; list-style:none; padding:0;">
					${selectedTests.map(t => `<li>☐ ${t}</li>`).join('')}
				</ul>
				<div style="position:absolute; bottom:40px; right:40px; text-align:center; border-top:2px solid #333; width:200px; padding-top:10px;">Signature</div>
			</div>
		`);
		win?.document.close();
		win?.print();
	}
</script>

<div class="lab-page">
	<h2>🧪 Lab Request System</h2>
	<div style="display:grid; grid-template-columns: 2fr 1fr; gap:20px;">
		<div class="card">
			<h3>Select Tests</h3>
			<select bind:value={selectedPatient} style="width:100%; padding:12px; margin-bottom:20px;">
				<option value={null}>-- Choose Patient --</option>
				{#each patients as p}<option value={p}>{p.name}</option>{/each}
			</select>
			<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
				{#each availableTests as t}
					<button class="t-btn {selectedTests.includes(t) ? 'active' : ''}" onclick={() => toggle(t)}>{t}</button>
				{/each}
			</div>
		</div>
		<div class="card">
			<h3>Actions</h3>
			{#if selectedPatient}<p>Patient: <b>{selectedPatient.name}</b></p>{/if}
			<button class="p-btn" onclick={printOrder}>🖨️ Print A4 Request</button>
		</div>
	</div>
</div>

<style>
	.lab-page { max-width: 1000px; margin: 0 auto; color: var(--text); padding: 20px; }
	.card { background: var(--card, white); padding: 25px; border-radius: 15px; border: 1px solid var(--border); }
	.t-btn { padding: 12px; border: 1px solid #ddd; border-radius: 8px; cursor: pointer; text-align: left; background: white; }
	.t-btn.active { background: #10b981; color: white; font-weight: bold; }
	.p-btn { width: 100%; padding: 15px; background: #10b981; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; margin-top: 10px; }
</style>
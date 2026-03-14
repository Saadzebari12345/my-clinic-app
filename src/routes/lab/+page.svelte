<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabaseClient';

	let patients = $state<any[]>([]);
	let availableTests = $state<string[]>([]);
	let selectedPatient = $state<any>(null);
	let selectedTests = $state<string[]>([]);
	let doctorId = $state(0);
	let doctorName = $state('');

	onMount(async () => {
		const id = localStorage.getItem('doctor_id');
		doctorName = localStorage.getItem('doctor_username') || 'Doctor';
		if (id) {
			doctorId = Number(id);
			
			// ئینانا فەحسێن تایبەت ب ڤی دکتۆری
			const { data: doc } = await supabase.from('doctors').select('allowed_tests').eq('id', doctorId).single();
			if (doc && doc.allowed_tests) {
				// ڕاستکرنا خەلەتییا (t: string)
				availableTests = doc.allowed_tests.split(',').map((t: string) => t.trim());
			}

			const { data: p } = await supabase.from('patients').select('*').eq('doctor_id', doctorId);
			if (p) patients = p;
		}
	});

	function toggleTest(test: string) {
		// ڕاستکرنا خەلەتییا فلتەری (t: string)
		if (selectedTests.includes(test)) {
			selectedTests = selectedTests.filter((t: string) => t !== test);
		} else {
			selectedTests = [...selectedTests, test];
		}
	}

	function printOrder() {
		if (!selectedPatient || selectedTests.length === 0) return alert("Select patient and tests");
		const win = window.open('', '', 'width=800,height=900');
		win?.document.write(`
			<div style="font-family:sans-serif; padding:50px; border:5px solid #10b981; border-radius:20px;">
				<h1 style="text-align:center; color:#10b981;">LABORATORY REQUEST</h1>
				<p style="text-align:center;">Dr. ${doctorName}</p>
				<hr>
				<div style="background:#f0fdf4; padding:15px; border-radius:10px; display:grid; grid-template-columns:1fr 1fr;">
					<div><b>Patient:</b> ${selectedPatient.name}</div>
					<div><b>Date:</b> ${new Date().toLocaleDateString()}</div>
				</div>
				<h3 style="margin-top:30px;">Tests Required:</h3>
				<ul style="font-size:1.3rem; line-height:2;">
					${selectedTests.map(t => `<li>[ ] ${t}</li>`).join('')}
				</ul>
			</div>
		`);
		win?.document.close();
		win?.print();
	}
</script>

<div class="lab-page">
	<h2>🧪 Lab Investigation Request</h2>
	
	<div class="grid">
		<div class="card">
			<h3>1. Select Patient</h3>
			<select bind:value={selectedPatient} class="p-select">
				<option value={null}>-- Choose --</option>
				{#each patients as p}<option value={p}>{p.name}</option>{/each}
			</select>

			<h3 style="margin-top:20px;">2. Choose Tests</h3>
			<div class="tests">
				{#each availableTests as test}
					<button class="t-btn {selectedTests.includes(test) ? 'active' : ''}" onclick={() => toggleTest(test)}>{test}</button>
				{:else}
					<p style="color:red; font-size:0.8rem;">Admin has not assigned any tests to your account yet.</p>
				{/each}
			</div>
		</div>

		<div class="card">
			<h3>3. Summary & Print</h3>
			{#if selectedPatient}
				<p>Order for: <b>{selectedPatient.name}</b></p>
				<button class="btn-p" onclick={printOrder} disabled={selectedTests.length === 0}>🖨️ Print Order</button>
			{/if}
		</div>
	</div>
</div>

<style>
	.lab-page { max-width: 1000px; margin: 0 auto; color: var(--text); }
	.grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
	.card { background: var(--card, white); padding: 25px; border-radius: 15px; border: 1px solid var(--border); }
	.p-select { width: 100%; padding: 12px; border-radius: 8px; }
	.tests { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }
	.t-btn { padding: 10px; border-radius: 8px; border: 1px solid #ddd; cursor: pointer; text-align: left; }
	.t-btn.active { background: #10b981; color: white; border-color: #059669; font-weight: bold; }
	.btn-p { width: 100%; padding: 15px; background: #10b981; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; }
</style>
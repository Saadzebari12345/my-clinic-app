<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabaseClient';

	interface Patient { id: number; name: string; age: number; gender: string; }
	let patients = $state<Patient[]>([]);
	let selectedPatient = $state<Patient | null>(null);
	let doctorId = $state(0);
	let doctorName = $state('');

	// لیستا فەحسێن باو
	const labTests = [
		"CBC (Complete Blood Count)", "Blood Sugar (Fasting)", "HbA1c", 
		"Lipid Profile", "Liver Function Test", "Kidney Function Test",
		"TSH (Thyroid)", "Vitamin D3", "Vitamin B12", "Urine Analysis"
	];

	let selectedTests = $state<string[]>([]);

	onMount(async () => {
		const id = localStorage.getItem('doctor_id');
		doctorName = localStorage.getItem('doctor_username') || 'Doctor';
		if (id) {
			doctorId = Number(id);
			const { data } = await supabase.from('patients').select('*').eq('doctor_id', doctorId);
			if (data) patients = data;
		}
	});

	function toggleTest(test: string) {
		if (selectedTests.includes(test)) {
			selectedTests = selectedTests.filter(t => t !== test);
		} else {
			selectedTests = [...selectedTests, test];
		}
	}

	async function printLabOrder() {
		if (!selectedPatient || selectedTests.length === 0) return alert("Please select patient and tests");

		const win = window.open('', '', 'width=800,height=1000');
		const html = `
			<div style="font-family:sans-serif; padding:50px; border:4px solid #10b981; border-radius:15px;">
				<h1 style="text-align:center; color:#10b981;">LABORATORY REQUEST</h1>
				<p style="text-align:center;">Dr. ${doctorName}</p>
				<hr>
				<div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; background:#f0fdf4; padding:15px; border-radius:10px;">
					<div><b>Patient:</b> ${selectedPatient.name}</div>
					<div><b>Age/Gender:</b> ${selectedPatient.age} / ${selectedPatient.gender}</div>
					<div><b>Date:</b> ${new Date().toLocaleDateString('en-GB')}</div>
				</div>
				<div style="margin-top:30px;">
					<h3>Required Investigations:</h3>
					<ul style="font-size:1.2rem; line-height:2;">
						${selectedTests.map(t => `<li>[ ] ${t}</li>`).join('')}
					</ul>
				</div>
				<br><br><p style="text-align:right;">Doctor's Signature: _________________</p>
			</div>
		`;
		win?.document.write(html);
		win?.document.close();
		win?.print();
	}
</script>

<div class="lab-container">
	<h2>🧪 Laboratory Investigations</h2>

	<div class="main-grid">
		<!-- Step 1: Select Patient -->
		<div class="card">
			<h3>1. Select Patient</h3>
			<select bind:value={selectedPatient} class="p-select">
				<option value={null}>-- Choose Patient --</option>
				{#each patients as p}
					<option value={p}>{p.name}</option>
				{/each}
			</select>
		</div>

		<!-- Step 2: Choose Tests -->
		<div class="card">
			<h3>2. Select Required Tests</h3>
			<div class="tests-grid">
				{#each labTests as test}
					<button class="test-btn {selectedTests.includes(test) ? 'active' : ''}" onclick={() => toggleTest(test)}>
						{test}
					</button>
				{/each}
			</div>
		</div>

		<!-- Step 3: Preview & Print -->
		<div class="card preview-card">
			<h3>3. Order Summary</h3>
			{#if selectedPatient}
				<p><b>Order for:</b> {selectedPatient.name}</p>
				<div class="selected-tags">
					{#each selectedTests as t}
						<span class="tag">✓ {t}</span>
					{/each}
				</div>
				<button class="print-btn" onclick={printLabOrder} disabled={selectedTests.length === 0}>
					🖨️ Print Lab Request (A4)
				</button>
			{:else}
				<p style="color: #999;">Please select a patient to start.</p>
			{/if}
		</div>
	</div>
</div>

<style>
	.lab-container { max-width: 1100px; margin: 0 auto; color: var(--text); }
	.main-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
	
	.card { background: var(--card, white); padding: 25px; border-radius: 15px; border: 1px solid var(--border, #ddd); }
	.p-select { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #ccc; font-size: 1rem; }

	.tests-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-top: 15px; }
	.test-btn { padding: 12px; border: 1px solid #ddd; border-radius: 10px; background: #f9fafb; cursor: pointer; text-align: left; transition: 0.2s; font-size: 0.85rem; }
	.test-btn.active { background: #10b981; color: white; border-color: #059669; font-weight: bold; }

	.selected-tags { display: flex; flex-wrap: wrap; gap: 8px; margin: 20px 0; }
	.tag { background: #ecfdf5; color: #065f46; padding: 5px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: bold; border: 1px solid #10b981; }
	
	.print-btn { width: 100%; padding: 15px; background: #10b981; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; font-size: 1.1rem; }
	
	:global(.dark-mode) .test-btn { background: #1e293b; color: white; border-color: #334155; }
</style>
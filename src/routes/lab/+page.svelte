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
			// ١. ئینانا زانیاریێن دکتۆری و فەحسێن وی یێن ڕێپێدای ژ خشتەیێ doctors
			const { data: doc } = await supabase.from('doctors').select('*').eq('id', doctorId).single();
			if (doc) {
				docInfo = doc;
				if (doc.allowed_tests) {
					// لادانا ڤالاتییان و جوداکرنا فەحسان ب کۆمایێ
					availableTests = doc.allowed_tests.split(',').map((t: string) => t.trim()).filter((t: String) => t !== "")
				}
			}

			// ٢. ئینانا نەخۆشێن وی دکتۆری
			const { data: p } = await supabase.from('patients').select('*').eq('doctor_id', doctorId).order('name');
			if (p) patients = p;
		}
	});

	function toggleTest(t: string) {
		if (selectedTests.includes(t)) {
			selectedTests = selectedTests.filter(i => i !== t);
		} else {
			selectedTests = [...selectedTests, t];
		}
	}

	// ✅ ناڤێ فانکشنێ مە کرە printLabOrder دا وەک یا ناو HTML بیت
	function printLabOrder() {
		if (!selectedPatient || selectedTests.length === 0) return alert("Select patient and tests");
		
		const win = window.open('', '', 'width=900,height=1100');
		win?.document.write(`
			<div style="font-family:sans-serif; padding:50px; border:2px solid #10b981; border-radius:15px; position:relative; height:90vh;">
				<div style="display:flex; justify-content:space-between; border-bottom:3px solid #10b981; padding-bottom:15px; margin-bottom:20px;">
					<div>
						<h1 style="margin:0; color:#10b981; text-transform:uppercase;">${docInfo?.clinic_name || 'E-CLINIC'}</h1>
						<p style="font-size:18px; font-weight:bold; margin:5px 0;">Dr. ${docInfo?.doctor_name || 'Doctor'}</p>
					</div>
					<div style="text-align:right;">${docInfo?.clinic_address || ''}<br>Tel: ${docInfo?.clinic_phone || ''}</div>
				</div>
				<div style="background:#f8fafc; padding:15px; border-radius:10px; display:grid; grid-template-columns:1fr 1fr; margin-bottom:30px; border:1px solid #eee;">
					<div><b>Patient:</b> ${selectedPatient.name}</div>
					<div><b>Age:</b> ${selectedPatient.age}Y</div>
					<div><b>Date:</b> ${new Date().toLocaleDateString('en-GB')}</div>
				</div>
				<h3 style="color:#333;">Required Investigations:</h3>
				<ul style="font-size:1.3rem; line-height:2.5; list-style:none; padding:0;">
					${selectedTests.map(t => `<li>☐ ${t}</li>`).join('')}
				</ul>
				<div style="position:absolute; bottom:60px; right:60px; text-align:center; border-top:2px solid #333; width:200px; padding-top:10px; font-weight:bold;">
					Doctor's Signature
				</div>
			</div>
		`);
		win?.document.close();
		win?.print();
	}
</script>

<div class="lab-page">
	<h2 style="margin-bottom: 20px;">🧪 Laboratory Requests</h2>

	<div style="display:grid; grid-template-columns: 2fr 1fr; gap:20px;">
		<!-- لایێ چەپێ -->
		<div style="background:white; padding:25px; border-radius:15px; border:1px solid #ddd;">
			<h3>1. Select Patient</h3>
			<select bind:value={selectedPatient} style="width:100%; padding:12px; border-radius:10px; margin-bottom:20px; border:1px solid #ccc;">
				<option value={null}>-- Choose Patient --</option>
				{#each patients as p}<option value={p}>{p.name}</option>{/each}
			</select>

			<h3>2. Choose Tests</h3>
			<div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
				{#each availableTests as t}
					<button 
						style="padding:12px; border-radius:10px; border:1px solid #ddd; cursor:pointer; text-align:left; background:{selectedTests.includes(t) ? '#10b981' : 'white'}; color:{selectedTests.includes(t) ? 'white' : 'black'}"
						onclick={() => toggleTest(t)}
					>
						{t}
					</button>
				{:else}
					<p style="color:red; font-size:0.85rem; background:#fee2e2; padding:10px; border-radius:8px;">
						⚠️ No tests assigned. Admin must add tests in "Manage Doctors" section.
					</p>
				{/each}
			</div>
		</div>

		<!-- لایێ ڕاستێ -->
		<div style="background:white; padding:25px; border-radius:15px; border:1px solid #ddd; height: fit-content;">
			<h3 style="margin-top:0;">Summary</h3>
			{#if selectedPatient}
				<p>Patient: <b style="color:#4f46e5;">{selectedPatient.name}</b></p>
				<p>Selected: <b>{selectedTests.length} tests</b></p>
				<button 
					style="width:100%; padding:15px; background:#10b981; color:white; border:none; border-radius:10px; cursor:pointer; font-weight:bold; margin-top:15px;"
					onclick={printLabOrder}
					disabled={selectedTests.length === 0}
				>
					🖨️ Print Lab Order
				</button>
			{:else}
				<p style="color:#999;">Select a patient first.</p>
			{/if}
		</div>
	</div>
</div>

<style>
	.lab-page { max-width: 1100px; margin: 0 auto; color: #1e293b; padding: 10px; }
	:global(.dark-mode) .lab-page { color: white; }
	:global(.dark-mode) div[style*="background:white"] { background: #1e293b !important; border-color: #334155 !important; }
</style>
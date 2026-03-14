<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabaseClient';

	let doctors = $state<any[]>([]);
	let msg = $state(''), isError = $state(false), isLoading = $state(false);

	// متغیرێن بۆ دروستکرنا ئەکاونتەکێ نوی
	let user = $state(""), pass = $state(""), role = $state("doctor");
	let docName = $state(""), cName = $state(""), cAddr = $state(""), cPhone = $state("");
	let testsList = $state("");

	// متغیرێن بۆ دەستکاریکرنا فەحسێن دکتۆرێن هەین (Edit Mode)
	let editingDoctor = $state<any>(null);
	let editTests = $state("");

	async function fetchDoctors() {
		const { data } = await supabase.from('doctors').select('*').order('id', { ascending: false });
		if (data) doctors = data;
	}

	onMount(fetchDoctors);

	async function createAccount() {
		if (!user || !pass || !docName) return alert("Please fill all fields");
		isLoading = true;
		const { error } = await supabase.from('doctors').insert([{ 
			username: user, password: pass, role, 
			doctor_name: docName, clinic_name: cName, 
			clinic_address: cAddr, clinic_phone: cPhone,
			allowed_tests: testsList 
		}]);

		if (!error) {
			msg = "✅ Doctor Registered Successfully!";
			user = ""; pass = ""; docName = ""; testsList = "";
			fetchDoctors();
		} else {
			msg = "❌ Error: " + error.message;
			isError = true;
		}
		isLoading = false;
	}

	// 🛠️ فانکشنا نووژەنکرنا فەحسان بۆ دکتۆرێن کۆن
	async function updateDoctorTests() {
		if (!editingDoctor) return;
		const { error } = await supabase.from('doctors')
			.update({ allowed_tests: editTests })
			.eq('id', editingDoctor.id);

		if (!error) {
			alert("✅ Lab Tests Updated for Dr. " + editingDoctor.doctor_name);
			editingDoctor = null;
			fetchDoctors();
		}
	}
</script>

<div class="admin-container">
	<h2>🛠️ Admin: Doctor Management Center</h2>

	<div class="main-grid">
		<!-- 1. بەشێ زێدەکرنا دکتۆرێ نوی -->
		<div class="card">
			<h3>➕ Register New Doctor</h3>
			<div class="form">
				<input bind:value={user} placeholder="Username (Login)" />
				<input bind:value={pass} type="password" placeholder="Password" />
				<input bind:value={docName} placeholder="Doctor's Full Name" />
				<input bind:value={cName} placeholder="Clinic Name" />
				<textarea bind:value={testsList} placeholder="Lab Tests (split by comma: CBC, Sugar, Lipid...)"></textarea>
				<button class="btn-add" onclick={createAccount} disabled={isLoading}>Register Doctor</button>
			</div>
		</div>

		<!-- 2. لیستا هەمی دکتۆران و گۆهۆڕینا فەحسان -->
		<div class="card">
			<h3>📋 Existing Doctors & Lab Config</h3>
			<div class="doc-list">
				{#each doctors as doc}
					<div class="doc-item">
						<div class="info">
							<b>Dr. {doc.doctor_name}</b>
							<p>Tests: {doc.allowed_tests || 'None'}</p>
						</div>
						<button class="btn-edit" onclick={() => { editingDoctor = doc; editTests = doc.allowed_tests; }}>
							Edit Tests 🧪
						</button>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>

<!-- 📝 Modal بۆ دەستکاریکرنا ب لەز یا فەحسان -->
{#if editingDoctor}
	<div class="modal">
		<div class="modal-content card">
			<h3>Update Lab Tests for Dr. {editingDoctor.doctor_name}</h3>
			<p>Modify the test list below (comma separated):</p>
			<textarea bind:value={editTests} style="height: 150px; width: 100%;"></textarea>
			<div class="modal-btns">
				<button class="btn-save" onclick={updateDoctorTests}>Save Changes</button>
				<button class="btn-cancel" onclick={() => editingDoctor = null}>Cancel</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.admin-container { max-width: 1200px; margin: 0 auto; color: var(--text); padding: 20px; }
	.main-grid { display: grid; grid-template-columns: 1fr 1.2fr; gap: 25px; }
	@media (max-width: 900px) { .main-grid { grid-template-columns: 1fr; } }

	.card { background: var(--card, white); padding: 25px; border-radius: 20px; border: 1px solid var(--border, #ddd); box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
	.form { display: flex; flex-direction: column; gap: 10px; }
	input, textarea { padding: 12px; border-radius: 10px; border: 1px solid #ccc; background: white; color: black; }
	
	.btn-add { background: #4f46e5; color: white; border: none; padding: 12px; border-radius: 10px; cursor: pointer; font-weight: bold; }
	.doc-list { display: flex; flex-direction: column; gap: 15px; margin-top: 15px; }
	.doc-item { display: flex; justify-content: space-between; align-items: center; padding: 15px; background: #f8fafc; border-radius: 12px; border: 1px solid #eee; }
	.doc-item b { color: #4f46e5; }
	.doc-item p { margin: 5px 0 0; font-size: 0.75rem; color: #666; }
	.btn-edit { background: #10b981; color: white; border: none; padding: 8px 12px; border-radius: 8px; cursor: pointer; font-size: 0.8rem; font-weight: bold; }

	/* Modal Styling */
	.modal { position: fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); display:flex; justify-content:center; align-items:center; z-index: 1000; }
	.modal-content { width: 500px; max-width: 90%; }
	.modal-btns { display: flex; gap: 10px; margin-top: 20px; }
	.btn-save { flex: 2; background: #4f46e5; color: white; border: none; padding: 12px; border-radius: 10px; cursor: pointer; font-weight: bold; }
	.btn-cancel { flex: 1; background: #94a3b8; color: white; border: none; padding: 12px; border-radius: 10px; cursor: pointer; }

	:global(.dark-mode) .doc-item { background: #0f172a; border-color: #334155; }
</style>
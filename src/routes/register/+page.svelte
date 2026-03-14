<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabaseClient';
	import { goto } from '$app/navigation';

	let doctors = $state<any[]>([]);
	let doctorId = $state(''), role = $state('');

	// متغیرێن دروستكرنا حیسابا نوی
	let user = $state(''), pass = $state(''), docName = $state(''), cName = $state(''), cAddr = $state(''), cPhone = $state(''), tests = $state('');
	
	let editingDoc = $state<any>(null); // بۆ Edit كرنێ

	async function fetchDoctors() {
		const { data } = await supabase.from('doctors').select('*').order('id', { ascending: false });
		if (data) doctors = data;
	}

	onMount(() => {
		role = localStorage.getItem('doctor_role') || '';
		if (role !== 'admin') goto('/'); // ئه‌گه‌ر نه‌ ئه‌دمین بیت دێ هێته‌ده‌ر
		fetchDoctors();
	});

	async function handleSave() {
		if (!user || !pass || !docName) return alert("Please fill credentials");
		
		const docData = { 
			username: user, password: pass, role: 'doctor', 
			doctor_name: docName, clinic_name: cName, 
			clinic_address: cAddr, clinic_phone: cPhone, 
			allowed_tests: tests 
		};

		if (editingDoc) {
			await supabase.from('doctors').update(docData).eq('id', editingDoc.id);
			alert("✅ Doctor updated!");
		} else {
			await supabase.from('doctors').insert([docData]);
			alert("✅ New account created!");
		}
		cancelEdit();
		fetchDoctors();
	}

	function startEdit(doc: any) {
		editingDoc = doc;
		user = doc.username; pass = doc.password; docName = doc.doctor_name;
		cName = doc.clinic_name; cAddr = doc.clinic_address; cPhone = doc.clinic_phone;
		tests = doc.allowed_tests;
	}

	function cancelEdit() {
		editingDoc = null;
		user = ''; pass = ''; docName = ''; cName = ''; cAddr = ''; cPhone = ''; tests = '';
	}
</script>

<div class="admin-panel">
	<h2>🛠️ Admin: Doctor Management Center</h2>

	<div class="card form-box">
		<h3>{editingDoc ? '✏️ Edit Doctor Profile' : '➕ Register New Doctor'}</h3>
		<div class="grid-inputs">
			<input bind:value={user} placeholder="Login Username" />
			<input bind:value={pass} type="password" placeholder="Login Password" />
			<input bind:value={docName} placeholder="Doctor Full Name" />
			<input bind:value={cName} placeholder="Clinic Name" />
			<input bind:value={cAddr} placeholder="Address" />
			<input bind:value={cPhone} placeholder="Phone Number" />
			<textarea bind:value={tests} placeholder="Assigned Lab Tests (CBC, Sugar, Lipid...)" style="grid-column: span 2; height: 80px;"></textarea>
		</div>
		<div class="btns">
			<button class="btn-save" onclick={handleSave}>{editingDoc ? 'Update' : 'Create Account'}</button>
			{#if editingDoc}<button class="btn-cancel" onclick={cancelEdit}>Cancel</button>{/if}
		</div>
	</div>

	<div class="list-section">
		<h3>📋 Existing Accounts</h3>
		{#each doctors as doc}
			<div class="doc-card card">
				<div>
					<b>{doc.doctor_name}</b> <small>({doc.username})</small>
					<p style="font-size: 0.75rem; color: #666; margin: 5px 0;">{doc.allowed_tests || 'No tests assigned'}</p>
				</div>
				<button class="btn-edit" onclick={() => startEdit(doc)}>Edit ⚙️</button>
			</div>
		{/each}
	</div>
</div>

<style>
	.admin-panel { max-width: 1000px; margin: 0 auto; color: var(--text); padding: 20px; }
	.card { background: var(--card, white); padding: 25px; border-radius: 15px; border: 1px solid var(--border, #ddd); margin-bottom: 25px; }
	.grid-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
	input, textarea { padding: 12px; border-radius: 8px; border: 1px solid #ccc; background: white; color: black; }
	.btns { margin-top: 15px; display: flex; gap: 10px; }
	.btn-save { flex: 2; background: #4f46e5; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-weight: bold; }
	.btn-cancel { flex: 1; background: #94a3b8; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; }
	.doc-card { display: flex; justify-content: space-between; align-items: center; padding: 15px; }
	.btn-edit { background: #e0f2fe; color: #0369a1; border: none; padding: 8px 15px; border-radius: 8px; cursor: pointer; font-weight: bold; }
</style>
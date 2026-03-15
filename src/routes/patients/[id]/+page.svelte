<script lang="ts">
 import { page } from '$app/state';
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 interface Patient { id: number; name: string; age: number; phone: string; gender: string; }
 interface MedicalRecord { id: number; diagnosis: string; treatment: string; notes: string; bp: string; temp: string; weight: string; fee: number; created_at: string; }

 let patientId = $derived(Number(page.params.id)); 
 let doctorId = $state(0);
 let doctorName = $state('');
 let patientInfo = $state<Patient | null>(null);
 let records = $state<MedicalRecord[]>([]);
 
 let diagnosis = $state(''), treatment = $state(''), notes = $state(''), fee = $state('');
 let bp = $state(''), temp = $state(''), weight = $state('');
 let isSaving = $state(false);
 let editingId = $state<number | null>(null);

 async function loadAllData() {
  const storedId = localStorage.getItem('doctor_id');
  doctorName = localStorage.getItem('doctor_username') || 'Doctor';
  if (storedId) doctorId = Number(storedId);

  if (!patientId) return;

  const { data: p } = await supabase.from('patients').select('*').eq('id', patientId).single();
  if (p) patientInfo = p;

  const { data: r } = await supabase.from('medical_records').select('*').eq('patient_id', patientId).order('created_at', { ascending: false });
  if (r) records = r;
 }

 onMount(loadAllData);

 async function addRecord() {
    if (!diagnosis || !treatment) return alert("تکایە خانەیان پڕ بکە");
    isSaving = true;

    const { data, error } = await supabase.from('medical_records').insert([{
        patient_id: patientId,
        doctor_id: doctorId, // پشتڕاستبە ئەڤە یێ درستە
        diagnosis,
        treatment,
        notes,
        fee: Number(fee) || 0, // ڤەگۆهۆڕین بۆ ژمارە
        created_at: new Date().toISOString()
    }]).select();

    if (!error) {
        diagnosis = ''; treatment = ''; notes = ''; fee = '';
        records = [data[0], ...records];
        alert("✅ سەیڤ بوو");
    }
    isSaving = false;
}

 function startEdit(record: MedicalRecord) {
  editingId = record.id;
  diagnosis = record.diagnosis; treatment = record.treatment; notes = record.notes;
  bp = record.bp; temp = record.temp; weight = record.weight; fee = record.fee.toString();
  window.scrollTo({ top: 0, behavior: 'smooth' });
 }

 async function deleteRecord(id: number) {
  if (confirm('ئەرێ تو پشتراستی؟')) {
   await supabase.from('medical_records').delete().eq('id', id);
   await loadAllData();
  }
 }

// 🖨️ فانکشنا چاپکرنا A4 یا ڕاستکری (ب داتایێن ئۆتۆماتیکی)
 // 🖨️ فانکشنا چاپکرنا فەرمی یا A4 ب داتایێن ئۆتۆماتیکی
 // 🖨️ فانکشنا چاپکرنا فەرمی یا A4 ب داتایێن ئۆتۆماتیکی
			async function printRx(record: MedicalRecord) {
		// ١. هێنانەوەی زانیارییە نوێیەکانی دکتۆر لە داتابەیس
		const { data: doc } = await supabase
			.from('doctors')
			.select('doctor_name, clinic_name, clinic_address, clinic_phone')
			.eq('id', doctorId)
			.single();
		
		// ٢. دیاریکردنی ناوەکان (ئەگەر لە داتابەیس ناو هەبێت دەریدەخات)
		const dName = doc?.doctor_name || "Specialist Doctor";
		const cName = doc?.clinic_name || "E-CLINIC CENTER";

		const win = window.open('', '', 'width=900,height=1100');
		win?.document.write(`
			<html>
			<head>
				<style>
					@page { size: A4; margin: 15mm; }
					body { font-family: 'Segoe UI', sans-serif; padding: 0; margin: 0; color: #1a1a1a; }
					.page-border { border: 3px solid #4f46e5; padding: 40px; height: 93vh; border-radius: 20px; position: relative; box-sizing: border-box; }
					.header { display: flex; justify-content: space-between; border-bottom: 4px solid #4f46e5; padding-bottom: 15px; margin-bottom: 30px; }
					.clinic-title { font-size: 30px; font-weight: 900; color: #4f46e5; margin: 0; }
					.doctor-name { font-size: 22px; font-weight: bold; margin: 8px 0; color: #333; }
					.patient-info { background: #f8fafc; padding: 20px; border-radius: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 15px; border: 1px solid #e2e8f0; margin-bottom: 40px; }
					.content { min-height: 400px; font-size: 19px; line-height: 1.8; }
					.footer { position: absolute; bottom: 40px; left: 40px; right: 40px; border-top: 1px solid #eee; padding-top: 20px; display: flex; justify-content: space-between; font-size: 12px; color: #94a3b8; }
				</style>
			</head>
			<body>
				<div class="page-border">
					<div class="header">
						<div>
							<h1 class="clinic-title">${cName}</h1>
							<p class="doctor-name">Dr. ${dName}</p> <!-- لێرە ناوی دکتۆرەکە ڕاست دەبێت -->
						</div>
						<div style="text-align: right; font-size: 13px;">
							${doc?.clinic_address || ''}<br>Tel: ${doc?.clinic_phone || ''}
						</div>
					</div>
					<div class="patient-info">
						<div><b>Patient:</b> ${patientInfo?.name}</div>
						<div><b>Phone:</b> ${patientInfo?.phone}</div>
						<div><b>Age / Gender:</b> ${patientInfo?.age}Y / ${patientInfo?.gender}</div>
						<div><b>Date:</b> ${new Date(record.created_at).toLocaleDateString('en-GB')}</div>
					</div>
					<div class="content">
						<div style="font-size: 70px; color: #4f46e5; font-style: italic;">R𝓍</div>
						<p><b>Diagnosis:</b> ${record.diagnosis}</p>
						<p style="white-space: pre-line;"><b>Treatment:</b><br>${record.treatment}</p>
					</div>
					<div class="footer">
						<div>E-Clinic Digital System</div>
						<div style="text-align:center; width:200px; border-top:2px solid #333; padding-top:5px; font-weight:bold;">Signature</div>
					</div>
				</div>
				<script>window.print(); window.close();<\/script>
			</body>
			</html>
		`);
		win?.document.close();
	}
</script>

<div class="container">
 <header class="card patient-header">
  <div class="p-info">
   <h1>👤 {patientInfo?.name}</h1>
   <p>{patientInfo?.age} years | {patientInfo?.gender} | {patientInfo?.phone}</p>
  </div>
  <a href="/patients" class="back-link">⬅ Back</a>
 </header>

 <div class="main-grid">
  <!-- فۆرما نڤیسینێ -->
  <div class="card form-container">
   <h3>{editingId ? '✏️ Edit Consultation' : '📝 New Consultation'}</h3>
   <div class="vitals-grid">
    <input bind:value={bp} placeholder="BP (120/80)" />
    <input bind:value={temp} placeholder="Temp°C" />
    <input bind:value={weight} placeholder="Weight kg" />
   </div>
   <input bind:value={diagnosis} placeholder="Diagnosis (نەخۆشی)" class="diag-input" />
   <textarea bind:value={treatment} placeholder="Treatment Plan & Medications..."></textarea>
   <div class="action-row">
    <input bind:value={fee} type="number" placeholder="Fee $" style="flex:1;" />
    <button class="save-btn" onclick={addRecord} style="flex:2;">💾 {editingId ? 'Update Record' : 'Save Record'}</button>
   </div>
   {#if editingId}
    <button class="cancel-btn" onclick={() => { editingId = null; diagnosis = ''; treatment = ''; bp = ''; temp = ''; weight = ''; fee = ''; }}>Cancel Edit</button>
   {/if}
  </div>

  <!-- مێژوویا پزیشکی (History) -->
  <div class="history-column">
   <h3>📜 Medical History ({records.length})</h3>
   {#each records as record (record.id)}
    <div class="record card">
     <div class="record-head">
      <span>📅 {new Date(record.created_at).toLocaleString('en-GB')}</span>
      <div class="actions">
       <button class="btn-p" onclick={() => printRx(record)}>🖨️ Print A4</button>
       <button class="btn-e" onclick={() => startEdit(record)}>✏️</button>
       <button class="btn-d" onclick={() => deleteRecord(record.id)}>🗑️</button>
      </div>
     </div>
     <h4>{record.diagnosis}</h4>
     <p class="rx-text">{record.treatment}</p>
     {#if record.fee > 0}<span class="fee-tag">Paid: ${record.fee}</span>{/if}
    </div>
   {:else}
    <div class="empty-msg card">No consultation history for this patient.</div>
   {/each}
  </div>
 </div>
</div>

<style>
 .container { max-width: 1200px; margin: 0 auto; color: var(--text); padding: 15px; }
 .card { background: var(--card, white); padding: 25px; border-radius: 18px; border: 1px solid var(--border, #ddd); margin-bottom: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
 .patient-header { display: flex; justify-content: space-between; align-items: center; border-left: 8px solid #4f46e5; }
 
 .main-grid { display: grid; grid-template-columns: 420px 1fr; gap: 25px; }
 @media (max-width: 1000px) { .main-grid { grid-template-columns: 1fr; } }
 
 .vitals-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 12px; }
 input, textarea { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border, #ccc); background: white !important; color: black !important; box-sizing: border-box; }
 textarea { height: 150px; margin: 10px 0; resize: none; font-family: inherit; }
 .diag-input { font-weight: bold; margin-bottom: 5px; }
 
 .action-row { display: flex; gap: 10px; margin-top: 10px; }
 .save-btn { background: #4f46e5; color: white; border: none; padding: 12px; border-radius: 10px; cursor: pointer; font-weight: bold; }
 .cancel-btn { width: 100%; margin-top: 8px; background: #94a3b8; color: white; border: none; padding: 8px; border-radius: 8px; cursor: pointer; }

 .record { border-left: 6px solid #10b981; }
 .record-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 0.8rem; font-weight: bold; color: #10b981; }
 .actions button { border: none; padding: 6px 10px; border-radius: 8px; cursor: pointer; margin-left: 5px; font-weight: bold; }
 .btn-p { background: #f3f4f6; color: #1e293b; border: 1px solid #ddd !important; }
 .btn-e { background: #e0f2fe; color: #0369a1; }
 .btn-d { background: #fee2e2; color: #dc2626; }

 .rx-text { white-space: pre-line; font-size: 0.95rem; line-height: 1.5; margin: 10px 0; }
 .fee-tag { background: #dcfce7; color: #15803d; padding: 3px 10px; border-radius: 15px; font-size: 0.7rem; font-weight: bold; }
 .back-link { text-decoration: none; background: #f3f4f6; color: #1e293b; padding: 10px 20px; border-radius: 10px; font-weight: bold; font-size: 0.9rem; }
 .empty-msg { text-align: center; color: #94a3b8; padding: 40px; border: 2px dashed #e2e8f0; }
</style>
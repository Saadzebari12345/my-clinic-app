<script lang="ts">
 import { onMount } from 'svelte';
 import { supabase } from '$lib/supabaseClient';

 let doctorId = $state(0);
 let docInfo = $state<any>(null);
 let reportData = $state({ todayP: 0, todayE: 0, monthP: 0, monthE: 0 });
 let isLoading = $state(true);

 onMount(async () => {
  const storedId = localStorage.getItem('doctor_id');
  if (storedId) {
   doctorId = Number(storedId);
   await loadReportData();
  }
 });

 async function loadReportData() {
  isLoading = true;
  const now = new Date();
  const today = now.toLocaleDateString('en-CA');
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { data: doc } = await supabase.from('doctors').select('*').eq('id', doctorId).single();
  docInfo = doc;

  const { data: recs } = await supabase.from('medical_records').select('created_at').eq('doctor_id', doctorId);
  const { data: exps } = await supabase.from('expenses').select('amount, created_at').eq('doctor_id', doctorId);

  if (recs) {
   reportData.todayP = recs.filter(r => new Date(r.created_at).toLocaleDateString('en-CA') === today).length;
   reportData.monthP = recs.filter(r => new Date(r.created_at) >= new Date(monthStart)).length;
  }
  if (exps) {
   reportData.todayE = exps.filter(e => new Date(e.created_at).toLocaleDateString('en-CA') === today).reduce((s, e) => s + (Number(e.amount) || 0), 0);
   reportData.monthE = exps.filter(e => new Date(e.created_at) >= new Date(monthStart)).reduce((s, e) => s + (Number(e.amount) || 0), 0);
  }
  isLoading = false;
 }

 function sendToWhatsapp(type: 'daily' | 'monthly') {
  if (!docInfo?.whatsapp_number) return alert("ژمارا واتساپێ نەهاتییە داکەفتن!");
  
  const label = type === 'daily' ? "📋 ڕاپۆرتا ڕۆژانە" : "📊 ڕاپۆرتا مەهانە";
  const pCount = type === 'daily' ? reportData.todayP : reportData.monthP;
  const eSum = type === 'daily' ? reportData.todayE : reportData.monthE;

  // لێرە مە نیشانا Backtick ( ` ) بکارئینایە دا خەلەتی نەمینیت
  const msg = `${label}%0A----------%0A👨‍⚕️ دکتۆر: ${docInfo.doctor_name}%0A👥 نەخۆشێن تەمامبووی: ${pCount}%0A💸 خەرجییان: $${eSum}%0A📅 ڕێکەفت: ${new Date().toLocaleDateString()}`;
  
  window.open(`https://wa.me/${docInfo.whatsapp_number}?text=${msg}`, '_blank');
 }

 function printSummary(type: 'daily' | 'monthly') {
  const win = window.open('', '', 'width=800,height=600');
  const label = type === 'daily' ? "Daily Report" : "Monthly Report";
  const pCount = type === 'daily' ? reportData.todayP : reportData.monthP;
  const eSum = type === 'daily' ? reportData.todayE : reportData.monthE;

  win?.document.write(`
   <div style="font-family:sans-serif; padding:50px; border:2px solid #333; text-align:center;">
    <h2>${label}</h2>
    <p>Clinic: ${docInfo?.clinic_name} | Dr. ${docInfo?.doctor_name}</p>
    <hr>
    <h1 style="font-size:2.5rem;">Patients: ${pCount}</h1>
    <h1 style="font-size:2.5rem; color:red;">Expenses: $${eSum}</h1>
    <p>Date: ${new Date().toLocaleString()}</p>
   </div>
  `);
  win?.document.close();
  win?.print();
 }
</script>

<div style="padding: 20px; color: var(--text);">
 <header style="display:flex; justify-content:space-between; align-items:center; margin-bottom:30px;">
  <h1>Performance Reports 👋</h1>
  <button onclick={loadReportData} style="padding:10px; cursor:pointer; border-radius:8px; border:1px solid #ccc;">🔄 Refresh</button>
 </header>

 <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
  <div style="background:var(--card, white); padding:30px; border-radius:20px; border:1px solid var(--border);">
   <h3>📅 Daily Summary</h3>
   <p style="font-size:1.2rem;">Patients: <b>{reportData.todayP}</b></p>
   <p style="font-size:1.2rem;">Expenses: <b style="color:red;">${reportData.todayE}</b></p>
   <div style="display:flex; gap:10px; margin-top:20px;">
    <button onclick={() => sendToWhatsapp('daily')} style="background:#25d366; color:white; border:none; padding:12px; border-radius:10px; cursor:pointer; flex:1; font-weight:bold;">📱 WhatsApp</button><button onclick={() => printSummary('daily')} style="background:#333; color:white; border:none; padding:12px; border-radius:10px; cursor:pointer; flex:1; font-weight:bold;">🖨️ Print</button>
   </div>
  </div>

  <div style="background:var(--card, white); padding:30px; border-radius:20px; border:1px solid var(--border);">
   <h3>📊 Monthly Summary</h3>
   <p style="font-size:1.2rem;">Patients: <b>{reportData.monthP}</b></p>
   <p style="font-size:1.2rem;">Expenses: <b style="color:red;">${reportData.monthE}</b></p>
   <div style="display:flex; gap:10px; margin-top:20px;">
    <button onclick={() => sendToWhatsapp('monthly')} style="background:#25d366; color:white; border:none; padding:12px; border-radius:10px; cursor:pointer; flex:1; font-weight:bold;">📱 WhatsApp</button>
    <button onclick={() => printSummary('monthly')} style="background:#333; color:white; border:none; padding:12px; border-radius:10px; cursor:pointer; flex:1; font-weight:bold;">🖨️ Print</button>
   </div>
  </div>
 </div>
</div>
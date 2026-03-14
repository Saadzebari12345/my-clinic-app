<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabaseClient';

	// ١. پێناسەکرنا گۆڕاوان
	let doctorId = $state(0);
	let todayStats = $state({ patients: 0, tests: 0, consultIncome: 0, labIncome: 0 });
	let monthlyData = $state({ income: 0, expenses: 0, profit: 0 });
	let dailyLog = $state<any[]>([]); // لیستا نەخۆشێن ئەڤرۆ ب درێژاهی
	let monthlySummary = $state<any[]>([]); // لیستا مەهانە بۆ چاپکرنێ

	onMount(async () => {
		const id = localStorage.getItem('doctor_id');
		if (id) {
			doctorId = Number(id);
			await fetchDashboardData();
		}
	});

	async function fetchDashboardData() {
		const now = new Date();
		const startOfToday = new Date(now.setHours(0,0,0,0)).toISOString();
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

		// --- ئامارێن ئەڤرۆ (Today's Stats) ---
		const { data: recsToday } = await supabase.from('medical_records').select('fee, patients(name)').eq('doctor_id', doctorId).gte('created_at', startOfToday);
		const { data: labsToday } = await supabase.from('lab_orders').select('test_fee').eq('doctor_id', doctorId).gte('created_at', startOfToday);

		if (recsToday) {
			todayStats.patients = recsToday.length;
			todayStats.consultIncome = recsToday.reduce((s, r) => s + (r.fee || 0), 0);
			dailyLog = recsToday;
		}
		if (labsToday) {
			todayStats.tests = labsToday.length;
			todayStats.labIncome = labsToday.reduce((s, l) => s + (l.test_fee || 0), 0);
		}

		// --- ڕاپۆرتا مەهانە (Monthly Report) ---
		const { data: recsMonth } = await supabase.from('medical_records').select('fee').eq('doctor_id', doctorId).gte('created_at', startOfMonth);
		const { data: labsMonth } = await supabase.from('lab_orders').select('test_fee').eq('doctor_id', doctorId).gte('created_at', startOfMonth);
		const { data: expMonth } = await supabase.from('expenses').select('amount, description, created_at').eq('doctor_id', doctorId).gte('created_at', startOfMonth);

		const totalInc = (recsMonth?.reduce((s, r) => s + (r.fee || 0), 0) || 0) + (labsMonth?.reduce((s, l) => s + (l.test_fee || 0), 0) || 0);
		const totalExp = expMonth?.reduce((s, e) => s + (e.amount || 0), 0) || 0;

		monthlyData.income = totalInc;
		monthlyData.expenses = totalExp;
		monthlyData.profit = totalInc - totalExp;
		if (expMonth) monthlySummary = expMonth;
	}

	// 🖨️ چاپکرنا ڕاپۆرتا دارایی یا مەهانە
	function printMonthlyReport() {
		const win = window.open('', '', 'width=900,height=1000');
		win?.document.write(`
			<div style="font-family:sans-serif; padding:40px; border:2px solid #333;">
				<h1 style="text-align:center;">Monthly Financial Report</h1>
				<p style="text-align:center;">Month: ${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}</p>
				<hr>
				<div style="display:flex; justify-content:space-between; margin:20px 0;">
					<div><b>Total Income:</b> $${monthlyData.income}</div>
					<div><b>Total Expenses:</b> $${monthlyData.expenses}</div>
					<div style="color:green;"><b>Net Profit:</b> $${monthlyData.profit}</div>
				</div>
				<h3>Expense Breakdown:</h3>
				<table style="width:100%; border-collapse:collapse;">
					<tr style="background:#eee;"><th style="padding:10px; border:1px solid #ddd;">Description</th><th style="padding:10px; border:1px solid #ddd;">Amount</th><th style="padding:10px; border:1px solid #ddd;">Date</th></tr>
					${monthlySummary.map(e => `<tr><td style="padding:10px; border:1px solid #ddd;">${e.description}</td><td style="padding:10px; border:1px solid #ddd;">$${e.amount}</td><td style="padding:10px; border:1px solid #ddd;">${new Date(e.created_at).toLocaleDateString()}</td></tr>`).join('')}
				</table>
				<br><p style="text-align:right;">Authorized Signature: _________________</p>
			</div>
		`);
		win?.document.close();
		win?.print();
	}
</script>

<div class="dashboard-container">
	<h2 class="title">🚀 Clinic Intelligence Center</h2>

	<!-- ١. کارتێن ئامارێن ئەڤرۆ -->
	<div class="stats-grid">
		<div class="stat-card blue">
			<span class="icon">👥</span>
			<div class="info">
				<p>Today's Patients</p>
				<h3>{todayStats.patients}</h3>
			</div>
		</div>
		<div class="stat-card green">
			<span class="icon">🧪</span>
			<div class="info">
				<p>Today's Lab Tests</p>
				<h3>{todayStats.tests}</h3>
			</div>
		</div>
		<div class="stat-card purple">
			<span class="icon">💵</span>
			<div class="info">
				<p>Consultation Cash</p>
				<h3>${todayStats.consultIncome}</h3>
			</div>
		</div>
		<div class="stat-card gold">
			<span class="icon">🧬</span>
			<div class="info">
				<p>Lab Revenue</p>
				<h3>${todayStats.labIncome}</h3>
			</div>
		</div>
	</div>

	<div class="main-layout">
		<!-- ٢. بەشێ ڕاپۆرتا مەهانە و چاپکردن -->
		<div class="card financial-card">
			<div class="card-header">
				<h3>📊 Monthly Financial Summary</h3>
				<button class="btn-print" onclick={printMonthlyReport}>🖨️ Print Monthly Report</button>
			</div>
			<div class="profit-box">
				<div class="p-item"><span>Monthly Income:</span> <b style="color:#10b981;">+${monthlyData.income}</b></div>
				<div class="p-item"><span>Monthly Expenses:</span> <b style="color:#ef4444;">-${monthlyData.expenses}</b></div>
				<div class="p-item total"><span>Net Profit:</span> <b>${monthlyData.profit}</b></div>
			</div>
		</div>

		<!-- ٣. لیستا نەخۆشێن ئەڤرۆ ب درێژاهی -->
		<div class="card log-card">
			<h3>📅 Today's Patient Log</h3>
			<div class="log-list">
				{#each dailyLog as log}
					<div class="log-item">
						<div class="avatar">{log.patients?.name[0]}</div>
						<div class="det">
							<b>{log.patients?.name}</b>
							<p>Fee Paid: ${log.fee}</p>
						</div>
					</div>
				{:else}
					<p class="empty">No visits recorded today.</p>
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
	.dashboard-container { color: var(--text); animation: fadeIn 0.4s ease-out; }
	.title { margin-bottom: 25px; font-weight: 800; color: #4f46e5; }

	.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }
	.stat-card { padding: 20px; border-radius: 15px; display: flex; align-items: center; gap: 15px; color: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
	.blue { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
	.green { background: linear-gradient(135deg, #10b981, #059669); }
	.purple { background: linear-gradient(135deg, #8b5cf6, #6d28d9); }
	.gold { background: linear-gradient(135deg, #f59e0b, #b45309); }
	.icon { font-size: 2rem; opacity: 0.8; }
	.info h3 { margin: 0; font-size: 1.5rem; }
	.info p { margin: 0; font-size: 0.75rem; font-weight: bold; opacity: 0.9; }

	.main-layout { display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px; }
	@media (max-width: 900px) { .main-layout { grid-template-columns: 1fr; } }

	.card { background: var(--card, white); padding: 25px; border-radius: 20px; border: 1px solid var(--border, #eee); }
	.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
	
	.btn-print { background: #f3f4f6; color: #333; border: 1px solid #ddd; padding: 8px 15px; border-radius: 8px; cursor: pointer; font-weight: bold; }
	
	.profit-box { display: flex; flex-direction: column; gap: 15px; }
	.p-item { display: flex; justify-content: space-between; font-size: 1.1rem; padding-bottom: 10px; border-bottom: 1px solid #f1f5f9; }
	.total { border-bottom: none; font-size: 1.5rem; font-weight: 800; padding-top: 10px; color: #4f46e5; }

	.log-list { display: flex; flex-direction: column; gap: 12px; }
	.log-item { display: flex; align-items: center; gap: 12px; padding: 10px; background: #f9fafb; border-radius: 12px; }
	.avatar { width: 35px; height: 35px; background: #e0e7ff; color: #4f46e5; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; }
	.det b { font-size: 0.9rem; }
	.det p { margin: 0; font-size: 0.75rem; color: #666; }

	:global(.dark-mode) .log-item { background: #1e293b; }
	:global(.dark-mode) .p-item { border-color: #334155; }
</style>
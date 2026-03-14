<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabaseClient';

	// ١. پێناسەکرنا گۆڕاوان
	let stats = $state({
		todayPatients: 0,
		todayLabs: 0,
		todayCash: 0,
		todayLabMoney: 0,
		monthIncome: 0,
		monthExpenses: 0,
		monthProfit: 0
	});

	let recentPatients = $state<any[]>([]);
	let doctorId = $state(0);

	onMount(async () => {
		const id = localStorage.getItem('doctor_id');
		if (id) {
			doctorId = Number(id);
			await refreshDashboard();
		}
	});

	async function refreshDashboard() {
		if (!doctorId) return;

		// دیارکرنا دەسپێکا ئەڤرۆ و دەسپێکا ڤێ هەیڤێ
		const now = new Date();
		const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

		// --- ئینانا داتایێن ئەڤرۆ ---
		const { data: recsToday } = await supabase.from('medical_records').select('fee, patients(name)').eq('doctor_id', doctorId).gte('created_at', startOfToday);
		const { data: labsToday } = await supabase.from('lab_orders').select('test_fee').eq('doctor_id', doctorId).gte('created_at', startOfToday);

		if (recsToday) {
			stats.todayPatients = recsToday.length;
			stats.todayCash = recsToday.reduce((s, r) => s + (Number(r.fee) || 0), 0);
			recentPatients = recsToday.slice(-5).reverse(); // ٥ نەخۆشێن دووماهیێ
		}
		if (labsToday) {
			stats.todayLabs = labsToday.length;
			stats.todayLabMoney = labsToday.reduce((s, l) => s + (Number(l.test_fee) || 0), 0);
		}

		// --- ئینانا داتایێن مەهانە ---
		const { data: recsMonth } = await supabase.from('medical_records').select('fee').eq('doctor_id', doctorId).gte('created_at', startOfMonth);
		const { data: labsMonth } = await supabase.from('lab_orders').select('test_fee').eq('doctor_id', doctorId).gte('created_at', startOfMonth);
		const { data: expMonth } = await supabase.from('expenses').select('amount').eq('doctor_id', doctorId).gte('created_at', startOfMonth);

		const mIncome = (recsMonth?.reduce((s, r) => s + (Number(r.fee) || 0), 0) || 0) + 
						 (labsMonth?.reduce((s, l) => s + (Number(l.test_fee) || 0), 0) || 0);
		const mExp = expMonth?.reduce((s, e) => s + (Number(e.amount) || 0), 0) || 0;

		stats.monthIncome = mIncome;
		stats.monthExpenses = mExp;
		stats.monthProfit = mIncome - mExp;
	}

	function printMonthly() {
		window.print();
	}
</script>

<div class="dashboard">
	<div class="welcome-bar">
		<h2>👋 ب خێر بێی بۆ داشبۆردێ کلینیکێ</h2>
		<button onclick={refreshDashboard} class="refresh-btn">🔄 نووژەنکرن</button>
	</div>

	<!-- پشکا ئامارێن ئەڤرۆ -->
	<div class="top-stats">
		<div class="stat-card blue">
			<div class="icon">👥</div>
			<div class="val">
				<p>نەخۆشێن ئەڤرۆ</p>
				<h3>{stats.todayPatients}</h3>
			</div>
		</div>
		<div class="stat-card green">
			<div class="icon">🧪</div>
			<div class="val">
				<p>فەحسێن ئەڤرۆ</p>
				<h3>{stats.todayLabs}</h3>
			</div>
		</div>
		<div class="stat-card purple">
			<div class="icon">💵</div>
			<div class="val">
				<p>پارەیێ سەرەدانان</p>
				<h3>${stats.todayCash}</h3>
			</div>
		</div>
		<div class="stat-card orange">
			<div class="icon">🧬</div>
			<div class="val">
				<p>داهاتێ فەحسان</p>
				<h3>${stats.todayLabMoney}</h3>
			</div>
		</div>
	</div>

	<div class="main-grid">
		<!-- ڕاپۆرتا دارایی یا مەهانە -->
		<div class="card finance-card">
			<div class="card-head">
				<h3>📊 کورتیا دارایی (ڤێ هەیڤێ)</h3>
				<button onclick={printMonthly} class="btn-p">🖨️ چاپکرن</button>
			</div>
			<div class="fin-row"><span>کۆما داهاتی:</span> <b class="text-green">+${stats.monthIncome}</b></div>
			<div class="fin-row"><span>کۆما خەرجییان:</span> <b class="text-red">-${stats.monthExpenses}</b></div>
			<div class="profit-total">
				<p>قازانجا سافی (Net Profit)</p>
				<h1>${stats.monthProfit}</h1>
			</div>
		</div>

		<!-- لیستا نەخۆشێن ئەڤرۆ -->
		<div class="card logs-card">
			<h3>🕒 نویترین سەرەدانێن ئەڤرۆ</h3>
			<div class="log-list">
				{#each recentPatients as p}
					<div class="log-item">
						<span class="avatar">{p.patients?.name[0]}</span>
						<div class="details">
							<b>{p.patients?.name}</b>
							<small>پاشکەفت بوو ل: {new Date().toLocaleTimeString('en-GB', {hour:'2-digit', minute:'2-digit'})}</small>
						</div>
						<div class="fee">${p.fee}</div>
					</div>
				{:else}
					<p class="empty">چو سەرەدان نەهاتینە تۆمارکرن.</p>
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
	.dashboard { animation: fadeIn 0.4s ease; color: var(--text); }
	@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

	.welcome-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
	.refresh-btn { background: none; border: 1px solid #4f46e5; color: #4f46e5; padding: 5px 15px; border-radius: 20px; cursor: pointer; font-weight: bold; }

	.top-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }
	.stat-card { padding: 20px; border-radius: 15px; display: flex; align-items: center; gap: 15px; color: white; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
	
	.blue { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
	.green { background: linear-gradient(135deg, #10b981, #059669); }
	.purple { background: linear-gradient(135deg, #8b5cf6, #6d28d9); }
	.orange { background: linear-gradient(135deg, #f59e0b, #b45309); }

	.stat-card .icon { font-size: 2rem; opacity: 0.8; }
	.stat-card p { margin: 0; font-size: 0.8rem; font-weight: bold; opacity: 0.9; }
	.stat-card h3 { margin: 5px 0 0 0; font-size: 1.6rem; }

	.main-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 20px; }
	@media (max-width: 900px) { .main-grid { grid-template-columns: 1fr; } }

	.card { background: var(--card, white); padding: 25px; border-radius: 20px; border: 1px solid var(--border, #eee); }
	.card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
	.btn-p { background: #f3f4f6; border: 1px solid #ddd; padding: 7px 15px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 0.8rem; }

	.fin-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
	.text-green { color: #10b981; }
	.text-red { color: #ef4444; }

	.profit-total { text-align: center; margin-top: 25px; padding: 20px; background: #f8fafc; border-radius: 15px; }
	.profit-total h1 { margin: 0; color: #4f46e5; font-size: 2.5rem; }
	.profit-total p { margin: 0 0 5px 0; font-size: 0.8rem; font-weight: bold; color: #64748b; }

	.log-list { display: flex; flex-direction: column; gap: 10px; }
	.log-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: #f9fafb; border-radius: 12px; }
	.avatar { width: 35px; height: 35px; background: #e0e7ff; color: #4f46e5; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; }
	.details { flex: 1; }
	.details b { display: block; font-size: 0.9rem; }
	.details small { font-size: 0.7rem; color: #94a3b8; }
	.fee { font-weight: bold; color: #10b981; }

	:global(.dark-mode) .profit-total, :global(.dark-mode) .log-item { background: #1e293b; }
</style>
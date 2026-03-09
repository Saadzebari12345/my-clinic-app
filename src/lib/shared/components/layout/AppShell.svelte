<script lang="ts">
 import { page } from '$app/state';
 import { goto } from '$app/navigation';
 import { onMount } from 'svelte';
 let { children } = $props();

 let isDarkMode = $state(false);
 let doctorName = $state('');
 let role = $state('');

 onMount(() => {
  doctorName = localStorage.getItem('doctor_username') || 'Doctor';
  role = localStorage.getItem('doctor_role') || 'doctor';
  isDarkMode = localStorage.getItem('theme') === 'dark';
 });

 function toggleTheme() {
  isDarkMode = !isDarkMode;
  localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
 }

 function handleLogout() {
  localStorage.clear();
  goto('/login');
 }

 const isActive = (path: string) => page.url.pathname === path;
</script>

<div class="main-app {isDarkMode ? 'dark-mode' : ''}">
 <!-- Sidebar -->
 <aside class="sidebar">
  <div class="sidebar-header">
   <div class="logo-icon">🏥</div>
   <div class="logo-text">E-CLINIC</div>
   <div class="doctor-badge">Dr. {doctorName} <span>({role})</span></div>
  </div>

  <nav class="nav-menu">
   <a href="/" class="nav-item {isActive('/') ? 'active' : ''}">
    <span class="icon">📊</span> Dashboard
   </a>
   <a href="/patients" class="nav-item {isActive('/patients') ? 'active' : ''}">
    <span class="icon">👥</span> Patients
   </a>
   <a href="/appointments" class="nav-item {isActive('/appointments') ? 'active' : ''}">
    <span class="icon">📅</span> Appointments
   </a>
   <a href="/pharmacy" class="nav-item {isActive('/pharmacy') ? 'active' : ''}">
    <span class="icon">💊</span> Pharmacy
   </a>
   <a href="/settings" class="nav-item {isActive('/settings') ? 'active' : ''}">
    <span class="icon">⚙️</span> Settings
   </a>
  </nav>

  <div class="sidebar-footer">
   <button class="footer-btn theme" onclick={toggleTheme}>
    {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
   </button>
   <button class="footer-btn switch" onclick={() => goto('/login')}>
    🔄 Switch Account
   </button>
   <button class="footer-btn logout" onclick={handleLogout}>
    🚪 Logout
   </button>
  </div>
 </aside>

 <!-- Main Content Area -->
 <div class="main-content">
  <div class="content-padding">
   {@render children?.()}
  </div>
 </div>
</div>

<style>
 :global(body) { margin: 0; padding: 0; transition: 0.3s; font-family: 'Segoe UI', sans-serif; }
 
 .main-app { 
  display: flex; height: 100vh; 
  --sidebar-bg: #111827; --active-bg: #4f46e5;
  --bg: #f8fafc; --text: #1e293b; --card: #ffffff; --border: #e2e8f0;
 }

 .main-app.dark-mode { 
  --bg: #0f172a; --text: #f1f5f9; --card: #1e293b; --border: #334155;
 }

 /* Sidebar Design */
 .sidebar { 
  width: 260px; background: var(--sidebar-bg); color: white; 
  display: flex; flex-direction: column; padding: 25px 15px; 
  box-shadow: 4px 0 10px rgba(0,0,0,0.1);
 }

 .sidebar-header { text-align: center; margin-bottom: 35px; }
 .logo-icon { font-size: 2.5rem; margin-bottom: 5px; }
 .logo-text { font-size: 1.4rem; font-weight: 900; letter-spacing: 1px; color: #818cf8; }
 .doctor-badge { font-size: 0.8rem; color: #94a3b8; margin-top: 10px; background: #1f2937; padding: 5px; border-radius: 8px; }
 .doctor-badge span { color: #6366f1; font-weight: bold; }

 .nav-menu { flex: 1; display: flex; flex-direction: column; gap: 8px; }
 .nav-item { 
  color: #cbd5e1; text-decoration: none; padding: 14px 18px; 
  border-radius: 12px; display: flex; align-items: center; gap: 15px; 
  transition: 0.2s; font-weight: 500;
 }
 .nav-item:hover { background: #1f2937; color: white; transform: translateX(5px); }
 .nav-item.active { background: var(--active-bg); color: white; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4); }

 .sidebar-footer { display: flex; flex-direction: column; gap: 10px; margin-top: 30px; border-top: 1px solid #374151; padding-top: 20px; }
 
 .footer-btn { 
  padding: 12px; border-radius: 10px; border: none; cursor: pointer; 
  font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: 0.2s;
 }
 .theme { background: #374151; color: white; }
 .switch { background: #1e293b; color: #818cf8; border: 1px solid #374151; }
 .logout { background: #ef4444; color: white; }
 .footer-btn:hover { opacity: 0.9; transform: scale(1.02); }

 .main-content { flex: 1; background: var(--bg); overflow-y: auto; color: var(--text); }
 .content-padding { padding: 30px; max-width: 1200px; margin: 0 auto; }

 /* Dark Mode Global Text Fix */
 :global(.dark-mode h1, .dark-mode h2, .dark-mode h3, .dark-mode p, .dark-mode label, .dark-mode td, .dark-mode th) {
  color: var(--text) !important;
 }
</style>
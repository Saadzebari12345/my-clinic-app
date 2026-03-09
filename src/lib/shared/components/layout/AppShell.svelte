<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  let { children } = $props();

  let isDarkMode = $state(false);
  let doctorName = $state("");
  let role = $state("");

  onMount(() => {
    doctorName = localStorage.getItem("doctor_username") || "User";
    role = localStorage.getItem("doctor_role") || "doctor";
    isDarkMode = localStorage.getItem("theme") === "dark";
  });

  function toggleTheme() {
    isDarkMode = !isDarkMode;
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }

  function handleLogout() {
    localStorage.removeItem("isLoggedIn");
    goto("/login");
  }

  const isActive = (path: string) => page.url.pathname === path;
</script>

<div class="main-app {isDarkMode ? 'dark-mode' : ''}">
  <aside class="sidebar">
    <div class="logo">E-CLINIC 🏥</div>
    <div class="doc-info">Dr. {doctorName} <br> <small>({role})</small></div>
    
    <nav class="nav-menu">
      <a href="/" class="nav-item {isActive('/') ? 'active' : ''}">🏠 Dashboard</a>
      <a href="/patients" class="nav-item {isActive('/patients') ? 'active' : ''}">👥 Patients</a>
      <a href="/appointments" class="nav-item {isActive('/appointments') ? 'active' : ''}">📅 Appointments</a>
      <a href="/settings" class="nav-item {isActive('/settings') ? 'active' : ''}">⚙️ Settings</a>
      
      {#if role === 'admin'}
        <a href="/register" class="nav-item {isActive('/register') ? 'active' : ''}" style="background: #065f46; margin-top: 10px;">➕ Create Account</a>
      {/if}
    </nav>

    <div class="sidebar-footer">
      <button onclick={toggleTheme} class="btn-theme">{isDarkMode ? '☀️ Light' : '🌙 Dark'}</button>
      <button onclick={handleLogout} class="btn-switch">🔄 Switch Account</button>
      <button onclick={handleLogout} class="btn-logout">🚪 Logout</button>
    </div>
  </aside>

  <div class="content">
    {@render children?.()}
  </div>
</div>

<style>
  :global(body) { margin: 0; padding: 0; transition: 0.3s; }
  
  /* ستایلێ متغیران بۆ چارەسەرکرنا Dark Mode */
  .main-app { 
    display: flex; height: 100vh; 
    --bg: #f3f4f6; --text: #1e293b; --card: #ffffff; --border: #e2e8f0; --input-bg: #ffffff;
  }
  .main-app.dark-mode { 
    --bg: #0f172a; --text: #f8fafc; --card: #1e293b; --border: #334155; --input-bg: #334155;
  }

  .sidebar { width: 250px; background: #111827; color: white; padding: 20px; display: flex; flex-direction: column; }
  .logo { font-size: 1.5rem; font-weight: bold; color: #6366f1; text-align: center; margin-bottom: 5px; }
  .doc-info { text-align: center; font-size: 0.8rem; color: #94a3b8; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid #334155; }
  
  .nav-menu { flex: 1; display: flex; flex-direction: column; gap: 8px; }
  .nav-item { color: #cbd5e1; text-decoration: none; padding: 12px; border-radius: 8px; transition: 0.2s; display: flex; align-items: center; gap: 10px; }
  .nav-item.active { background: #4f46e5; color: white; }

  .content { flex: 1; background: var(--bg); color: var(--text); padding: 25px; overflow-y: auto; }

  .sidebar-footer { display: flex; flex-direction: column; gap: 8px; }
  .btn-theme, .btn-logout, .btn-switch { padding: 10px; border-radius: 8px; border: none; cursor: pointer; font-weight: bold; }
  .btn-switch { background: #374151; color: white; }
  .btn-logout { background: #ef4444; color: white; }

  /* چارەسەرکرنا هەمی نڤیسین و فۆرمان د Dark Mode دا */
  :global(h2, h3, h1, label, p, span, td, th) { color: var(--text) !important; }
  :global(input, select, textarea) { 
    background-color: var(--input-bg) !important; 
    color: var(--text) !important; 
    border: 1px solid var(--border) !important;
    padding: 10px; border-radius: 8px;
  }
  :global(.card, .table-container) { background-color: var(--card) !important; border: 1px solid var(--border) !important; }
</style>
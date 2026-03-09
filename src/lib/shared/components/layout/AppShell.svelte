<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  let { children } = $props();

  let isDarkMode = $state(false);
  let doctorName = $state("");

  onMount(() => {
    doctorName = localStorage.getItem("doctor_username") || "Doctor";
    isDarkMode = localStorage.getItem("theme") === "dark";
  });

  function toggleTheme() {
    isDarkMode = !isDarkMode;
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }

  function handleLogout() {
    localStorage.clear();
    goto("/login");
  }

  const isActive = (path: string) => page.url.pathname === path;
</script>

<div class="main-app {isDarkMode ? 'dark-mode' : ''}">
  <aside class="sidebar">
    <div class="logo">E-CLINIC 🏥</div>
    <div class="doc-info">Dr. {doctorName}</div>
    <nav class="nav-menu">
      <a href="/" class="nav-item {isActive('/') ? 'active' : ''}">🏠 Dashboard</a>
      <a href="/patients" class="nav-item {isActive('/patients') ? 'active' : ''}">👥 Patients</a>
      <a href="/appointments" class="nav-item {isActive('/appointments') ? 'active' : ''}">📅 Appointments</a>
      <a href="/settings" class="nav-item {isActive('/settings') ? 'active' : ''}">⚙️ Settings</a>
    </nav>
    <button onclick={toggleTheme} class="btn-theme">{isDarkMode ? '☀️ Light' : '🌙 Dark'}</button>
    <button onclick={handleLogout} class="btn-logout">🚪 Logout</button>
  </aside>

  <div class="content">
    {@render children?.()}
  </div>
</div>

<style>
  :global(body) { margin: 0; padding: 0; transition: 0.3s; }
  .main-app { 
    display: flex; height: 100vh; 
    --bg: #f3f4f6; --text: #1e293b; --card: #ffffff; --border: #ddd;
  }
  .main-app.dark-mode { 
    --bg: #0f172a; --text: #f8fafc; --card: #1e293b; --border: #334155;
  }
  .sidebar { width: 250px; background: #111827; color: white; padding: 20px; display: flex; flex-direction: column; }
  .logo { font-size: 1.5rem; font-weight: bold; color: #6366f1; text-align: center; margin-bottom: 5px; }
  .doc-info { text-align: center; font-size: 0.8rem; color: #94a3b8; margin-bottom: 20px; border-bottom: 1px solid #334155; padding-bottom: 10px; }
  .nav-menu { flex: 1; display: flex; flex-direction: column; gap: 8px; }
  .nav-item { color: #cbd5e1; text-decoration: none; padding: 12px; border-radius: 8px; transition: 0.2s; }
  .nav-item.active { background: #4f46e5; color: white; }
  .content { flex: 1; background: var(--bg); color: var(--text); padding: 25px; overflow-y: auto; }
  .btn-theme, .btn-logout { margin-top: 10px; padding: 10px; border-radius: 8px; border: none; cursor: pointer; font-weight: bold; }
  .btn-logout { background: #ef4444; color: white; }
  
  /* گۆهۆڕینا ڕەنگێ نڤیسینێ د ناڤ هەمی لاپەران دا */
  :global(h2, h3, p, td, th, label) { color: var(--text) !important; }
  :global(input, select) { background: var(--card) !important; color: var(--text) !important; border: 1px solid var(--border) !important; }
</style>
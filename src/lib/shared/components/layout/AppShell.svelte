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
      {#if role === 'admin'}
  <a href="/register" class="nav-item">➕ Create Account</a>
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
  .main-app { 
    display: flex; height: 100vh; 
    --bg: #f3f4f6; --text: #1e293b; --card: #ffffff; --border: #ddd;
  }
  .main-app.dark-mode { 
    --bg: #0f172a; --text: #f8fafc; --card: #1e293b; --border: #334155;
  }

  /* گرنگترین پشک بۆ دیارکرنا نڤیسینێ */
  :global(.dark-mode h1, .dark-mode h2, .dark-mode h3, .dark-mode p, 
          .dark-mode td, .dark-mode th, .dark-mode label, .dark-mode span) {
    color: #f8fafc !important;
  }

  .content { flex: 1; background: var(--bg); padding: 25px; overflow-y: auto; }
  
  /* ستایلێ مێنویێ لایێ چەپێ */
  .sidebar { width: 250px; background: #111827; color: white; padding: 20px; display: flex; flex-direction: column; }
  .nav-item { color: #cbd5e1; text-decoration: none; padding: 12px; border-radius: 8px; margin-bottom: 5px; display: block; }
  .nav-item.active { background: #4f46e5; color: white; }
</style>
<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  let { children } = $props();

  let isDarkMode = $state(false);
  const isActive = (path: string) => page.url.pathname === path;

  function handleLogout() {
    localStorage.removeItem("isLoggedIn");
    goto("/login");
  }
</script>

<div class="main-app {isDarkMode ? 'dark-mode' : ''}">
  <!-- Sidebar -->
  <aside class="sidebar">
    <div class="logo">E-CLINIC 🏥</div>
    
    <nav class="nav-menu">
      <a href="/" class="nav-item {isActive('/') ? 'active' : ''}">
        <span class="icon">🏠</span> <span class="text">Dashboard</span>
      </a>
      <a href="/patients" class="nav-item {isActive('/patients') ? 'active' : ''}">
        <span class="icon">👥</span> <span class="text">Patients</span>
      </a>
      <a href="/appointments" class="nav-item {isActive('/appointments') ? 'active' : ''}">
        <span class="icon">📅</span> <span class="text">Appointments</span>
      </a>
      <a href="/pharmacy" class="nav-item {isActive('/pharmacy') ? 'active' : ''}">
        <span class="icon">💊</span> <span class="text">Pharmacy</span>
      </a>
      <a href="/settings" class="nav-item {isActive('/settings') ? 'active' : ''}">
       <span class="icon">⚙️</span> Settings
       </a>
    </nav>

    <div class="sidebar-footer">
      <button onclick={() => isDarkMode = !isDarkMode} class="btn-theme">
        {isDarkMode ? '☀️ Light' : '🌙 Dark'}
      </button>
      <button onclick={handleLogout} class="btn-logout">🚪 Logout</button>
    </div>
  </aside>

  <!-- Main Content -->
  <div class="content">
    <main class="page-body">
        {@render children?.()}
    </main>
  </div>
</div>

<style>
  .main-app { display: flex; height: 100vh; font-family: 'Segoe UI', sans-serif; background: #f3f4f6; }
  .sidebar { width: 260px; background: #111827; color: white; display: flex; flex-direction: column; padding: 20px; transition: 0.3s; }
  .logo { font-size: 1.5rem; font-weight: bold; color: #6366f1; text-align: center; margin-bottom: 30px; border-bottom: 1px solid #374151; padding-bottom: 20px; }
  
  .nav-menu { display: flex; flex-direction: column; gap: 10px; flex: 1; }
  .nav-item { color: #d1d5db; text-decoration: none; padding: 12px 15px; border-radius: 10px; display: flex; align-items: center; gap: 12px; transition: 0.2s; }
  .nav-item:hover { background: #1f2937; color: white; }
  .nav-item.active { background: #4f46e5; color: white; font-weight: bold; }

  .sidebar-footer { display: flex; flex-direction: column; gap: 10px; margin-top: auto; }
  .btn-theme, .btn-logout { padding: 10px; border-radius: 8px; border: none; cursor: pointer; font-weight: bold; }
  .btn-theme { background: #374151; color: white; }
  .btn-logout { background: #ef4444; color: white; }

  .content { flex: 1; overflow-y: auto; padding: 25px; }

  /* Dark Mode Support */
  .dark-mode { background: #0f172a; color: white; }
  .dark-mode .sidebar { background: #020617; }
  
  @media (max-width: 768px) {
    .sidebar { width: 80px; padding: 10px; }
    .text { display: none; }
    .logo { font-size: 1rem; }
  }
</style>
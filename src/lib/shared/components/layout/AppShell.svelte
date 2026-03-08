<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  let { children } = $props();

  let isDarkMode = $state(false);
  let isMenuOpen = $state(false); // بۆ ڤەکرنا مێنویێ ل سەر مۆبایلێ

  function toggleMenu() { isMenuOpen = !isMenuOpen; }
  function closeMenu() { isMenuOpen = false; }
</script>

<div class="main-layout {isDarkMode ? 'dark-mode' : ''}">
  
  <!-- دوگمێ مێنویێ (بتنێ ل سەر مۆبایلێ دیار دبیت) -->
  <button class="mobile-toggle" onclick={toggleMenu}>
    {isMenuOpen ? '✕' : '☰'}
  </button>

  <!-- Sidebar (دگەل گۆهۆڕینا مۆبایلێ) -->
  <aside class="sidebar {isMenuOpen ? 'open' : ''}">
    <div class="logo">E-CLINIC</div>
    <nav class="nav-links">
      <a href="/" onclick={closeMenu} class="nav-item">🏠 Dashboard</a>
      <a href="/patients" onclick={closeMenu} class="nav-item">👥 Patients</a>
      <a href="/appointments" onclick={closeMenu} class="nav-item">📅 Appointments</a>
      <a href="/pharmacy" onclick={closeMenu} class="nav-item">💊 Pharmacy</a>
    </nav>
    <div class="footer">
        <button onclick={() => isDarkMode = !isDarkMode} class="theme-btn">Theme</button>
    </div>
  </aside>

  <!-- بانسەرێ (Overlay) بۆ مۆبایلێ -->
  {#if isMenuOpen}
    <div class="overlay" onclick={closeMenu}></div>
  {/if}

  <div class="content-wrapper">
    <main class="page-content">
      {@render children?.()}
    </main>
  </div>
</div>

<style>
  /* ستایلێ لابتۆپێ (وەکی مە بەرێ چێکری) */
  .main-layout { display: flex; height: 100vh; overflow: hidden; }
  .sidebar { width: 260px; background: #111827; color: white; display: flex; flex-direction: column; padding: 20px; transition: 0.3s; z-index: 100; }
  .content-wrapper { flex: 1; background: #f3f4f6; overflow-y: auto; }
  .mobile-toggle { display: none; } /* ل سەر لابتۆپێ ڤەشارتییە */

  /* ستایلێ مۆبایلێ (Responsive) */
  @media (max-width: 768px) {
    .mobile-toggle { 
        display: block; position: fixed; top: 15px; left: 15px; 
        z-index: 200; background: #4f46e5; color: white; border: none; 
        padding: 10px 15px; border-radius: 8px; font-size: 1.2rem;
    }
    .sidebar { 
        position: fixed; left: -260px; height: 100%; width: 260px; 
    }
    .sidebar.open { left: 0; } /* نیشاندانا مێنویێ دەما کلیک لێ دکەی */
    .overlay { 
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        background: rgba(0,0,0,0.5); z-index: 50; 
    }
  }

  /* ... ستایلێن دی یێن تە یێن بەرێ ... */
</style>
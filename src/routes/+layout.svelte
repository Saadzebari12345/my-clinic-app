<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import AppShell from '$lib/shared/components/layout/AppShell.svelte';

  let { children } = $props();
  let isLoading = $state(true);

  onMount(() => {
    const loggedIn = localStorage.getItem("isLoggedIn");
    
    // ئەگەر یێ چوونەژوورێ نەببیت و نەیێ ل لاپەرێ Login بیت
    if (loggedIn !== "true" && page.url.pathname !== "/login") {
      goto("/login");
    } else {
      isLoading = false;
    }
  });
</script>

{#if isLoading && page.url.pathname !== "/login"}
  <div style="height: 100vh; display: flex; justify-content: center; align-items: center;">
    <p>Loading System...</p>
  </div>
{:else if page.url.pathname === "/login"}
  {@render children()}
{:else}
  <AppShell>
    {@render children()}
  </AppShell>
{/if}

<style>
  :global(body) { margin: 0; padding: 0; }
</style>
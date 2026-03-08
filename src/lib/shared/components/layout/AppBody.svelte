<script lang="ts">
  let { children } = $props();
</script>

<div class="main-body" style="background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
  {@render children?.()}
</div>
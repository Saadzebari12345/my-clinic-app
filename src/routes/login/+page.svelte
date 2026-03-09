<script lang="ts">
  import { goto } from '$app/navigation';

  let username = $state("");
  let password = $state("");
  let errorMessage = $state("");

  function handleLogin() {
    const savedUser = localStorage.getItem("admin_user") || "admin";
    const savedPass = localStorage.getItem("admin_pass") || "12345";

    if (username === savedUser && password === savedPass) {
      localStorage.setItem("isLoggedIn", "true");
      goto("/");
    } else {
      errorMessage = "❌ ناڤ یان پاسوۆرد خه‌له‌ته‌!";
    }
  }
</script>

<div style="height: 100vh; display: flex; justify-content: center; align-items: center; background: #f3f4f6;">
  <div style="background: white; padding: 40px; border-radius: 15px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); width: 350px;">
    <h2 style="text-align: center; color: #4f46e5; margin-bottom: 30px;">E-Clinic Login</h2>
    
    <div style="margin-bottom: 20px;">
      <!-- لێره‌ 'for' و 'id' هه‌مان ناڤن دا پێكڤه‌ گرێبده‌ن -->
      <label for="login-user" style="display: block; font-size: 0.9rem; margin-bottom: 5px; color: #64748b;">Username</label>
      <input id="login-user" bind:value={username} type="text" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ddd; box-sizing: border-box;" />
    </div>

    <div style="margin-bottom: 25px;">
      <label for="login-pass" style="display: block; font-size: 0.9rem; margin-bottom: 5px; color: #64748b;">Password</label>
      <input id="login-pass" bind:value={password} type="password" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ddd; box-sizing: border-box;" />
    </div>

    {#if errorMessage}
      <p style="color: #ef4444; font-size: 0.8rem; text-align: center; margin-bottom: 15px;">{errorMessage}</p>
    {/if}

    <button onclick={handleLogin} style="width: 100%; background: #4f46e5; color: white; border: none; padding: 13px; border-radius: 8px; cursor: pointer; font-weight: bold;">
      Log In
    </button>
  </div>
</div>
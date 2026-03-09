<script lang="ts">
  let currentPasswordInput = $state(""); // ئەو پاسوۆردێ نوکە دڤێت بنڤیسیت
  let newUsername = $state("");
  let newPassword = $state("");
  let message = $state("");
  let isError = $state(false);

  function saveSettings() {
    // ١. وەرگرتنا پاسوۆردێ ڕاستەقینە یێ د سیستەمی دا (ئەگەر نینە، یێ دەسپێکێ ١٢٣٤٥)
    const savedPass = localStorage.getItem("admin_pass") || "12345";
    const savedUser = localStorage.getItem("admin_user") || "admin";

    // ٢. پشکنین: ئەرێ پاسوۆردێ کۆن یێ درسته؟
    if (currentPasswordInput !== savedPass) {
      message = "❌ پاسوۆردێ نوکە (Current Password) خەلەتە! تو نەشێی گۆهۆڕینان بکەی.";
      isError = true;
      return;
    }

    // ٣. ئەگەر درست بوو، نوکە گۆهۆڕینان پاشکەفت بکە
    if (newUsername && newPassword) {
      localStorage.setItem("admin_user", newUsername);
      localStorage.setItem("admin_pass", newPassword);
      
      message = "✅ ناڤ و پاسوۆرد ب سەرکەفتی هاتنە گۆهۆڕین!";
      isError = false;

      // ڤالاکرنا خانەیان بۆ پاراستنێ
      currentPasswordInput = "";
      newUsername = "";
      newPassword = "";
    } else {
      message = "❌ تکایە ناڤ و پاسوۆردێ نوی بنڤیسە.";
      isError = true;
    }
  }
</script>

<h2 style="margin-bottom: 25px;">⚙️ Security Settings</h2>

<div style="background: white; padding: 30px; border-radius: 15px; border: 1px solid #ddd; max-width: 450px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
  <h3 style="margin-top: 0; color: #1e293b; border-bottom: 1px solid #eee; padding-bottom: 10px;">Update Credentials</h3>
  
  <!-- بەشێ پاسوۆردێ کۆن (مەرجێ سەرەکی) -->
  <div style="margin-bottom: 25px; background: #fff7ed; padding: 15px; border-radius: 10px; border: 1px solid #ffedd5;">
    <label for="current-pass" style="display:block; font-size:0.85rem; margin-bottom:5px; color:#9a3412; font-weight: bold;">Current Password (REQUIRED)</label>
    <input id="current-pass" type="password" bind:value={currentPasswordInput} placeholder="Enter your current password" style="width:100%; padding:12px; border-radius:8px; border:1px solid #fdba74; box-sizing: border-box; outline: none;"/>
    <small style="color: #c2410c; font-size: 0.75rem;">دڤێت پاسوۆردێ نوکە بنڤیسی دا بشێی گۆهۆڕینان بکەی.</small>
  </div>

  <hr style="border: 0; border-top: 1px solid #eee; margin-bottom: 20px;" />

  <!-- بەشێ داتایێن نوی -->
  <div style="margin-bottom: 15px;">
    <label for="new-user" style="display:block; font-size:0.85rem; margin-bottom:5px; color:#64748b;">New Admin Username</label>
    <input id="new-user" bind:value={newUsername} placeholder="e.g. Dr_Azad" style="width:100%; padding:12px; border-radius:10px; border:1px solid #ccc; box-sizing: border-box; outline: none;"/>
  </div>

  <div style="margin-bottom: 20px;">
    <label for="new-pass" style="display:block; font-size:0.85rem; margin-bottom:5px; color:#64748b;">New Admin Password</label>
    <input id="new-pass" type="password" placeholder="••••••••" bind:value={newPassword} style="width:100%; padding:12px; border-radius:10px; border:1px solid #ccc; box-sizing: border-box; outline: none;"/>
  </div>

  {#if message}
    <p style="font-size: 0.85rem; color: {isError ? '#ef4444' : '#10b981'}; margin-bottom: 15px; font-weight: bold; text-align: center;">
      {message}
    </p>
  {/if}

  <button onclick={saveSettings} style="width:100%; background: #4f46e5; color: white; border: none; padding: 14px; border-radius: 10px; cursor: pointer; font-weight: bold; transition: 0.3s;">
    Update Security Info
  </button>
</div>
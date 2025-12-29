import { signIn, signUp } from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const authMessage = document.getElementById("authMessage");
  const yearSpan = document.getElementById("year");
  const tabs = document.querySelectorAll(".auth-tab");
  const forms = document.querySelectorAll(".auth-form");

  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  // Tab switching
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const targetTab = tab.dataset.tab;

      // Update tabs
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      // Update forms
      forms.forEach((form) => form.classList.remove("active"));
      if (targetTab === "login") {
        loginForm?.classList.add("active");
      } else {
        registerForm?.classList.add("active");
      }

      // Clear message
      authMessage.style.display = "none";
    });
  });

  // Login
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("loginEmail").value;
      const password = document.getElementById("loginPassword").value;

      const submitBtn = loginForm.querySelector("button[type='submit']");
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = "Signing in...";

      const { data, error } = await signIn(email, password);

      if (error) {
        showMessage(error.message, "error");
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      } else {
        showMessage("Login successful! Redirecting...", "success");
        setTimeout(() => {
          window.location.href = "index.html";
        }, 1000);
      }
    });
  }

  // Register
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("registerEmail").value;
      const password = document.getElementById("registerPassword").value;

      if (password.length < 6) {
        showMessage("Password must be at least 6 characters", "error");
        return;
      }

      const submitBtn = registerForm.querySelector("button[type='submit']");
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = "Creating account...";

      const { data, error } = await signUp(email, password);

      if (error) {
        showMessage(error.message, "error");
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      } else {
        showMessage("Registration successful! Please check your email to verify your account.", "success");
        registerForm.reset();
        setTimeout(() => {
          // Switch to login tab
          tabs[0].click();
        }, 3000);
      }
    });
  }

  function showMessage(message, type) {
    authMessage.textContent = message;
    authMessage.className = `auth-message ${type}`;
    authMessage.style.display = "block";
    setTimeout(() => {
      authMessage.style.display = "none";
    }, 5000);
  }
});


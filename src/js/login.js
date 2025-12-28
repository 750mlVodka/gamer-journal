import { signIn, signUp } from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const authMessage = document.getElementById("authMessage");
  const yearSpan = document.getElementById("year");

  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  // Login
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("loginEmail").value;
      const password = document.getElementById("loginPassword").value;

      const { data, error } = await signIn(email, password);

      if (error) {
        showMessage(error.message, "error");
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

      const { data, error } = await signUp(email, password);

      if (error) {
        showMessage(error.message, "error");
      } else {
        showMessage("Registration successful! Please check your email.", "success");
      }
    });
  }

  function showMessage(message, type) {
    authMessage.textContent = message;
    authMessage.className = type;
    authMessage.style.display = "block";
    setTimeout(() => {
      authMessage.style.display = "none";
    }, 5000);
  }
});


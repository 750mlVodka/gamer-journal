import { getCurrentUser, signOut } from "./auth.js";
import { supabase } from "./supabase.js";
import { updateNavAuthState } from "./main.js";
import { createGameCard } from "./ui.js";

document.addEventListener("DOMContentLoaded", async () => {
  const yearSpan = document.getElementById("year");
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  // Get user ID from URL or current user
  const urlParams = new URLSearchParams(window.location.search);
  const profileUserId = urlParams.get("id");
  const { data: { user: currentUser } } = await getCurrentUser();
  
  const isOwnProfile = !profileUserId || profileUserId === currentUser?.id;

  if (!currentUser && !profileUserId) {
    window.location.href = "login.html";
    return;
  }

  // Setup nav
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await signOut();
      window.location.href = "index.html";
    });
  }

  await updateNavAuthState();

  // Load profile (own or other user's)
  const targetUserId = profileUserId || currentUser?.id;
  await loadProfile(targetUserId, isOwnProfile);

  // Edit button
  const editBtn = document.getElementById("editProfileBtn");
  const cancelBtn = document.getElementById("cancelEditBtn");
  if (editBtn && isOwnProfile) {
    editBtn.style.display = "block";
    editBtn.addEventListener("click", () => {
      document.getElementById("profileView").style.display = "none";
      document.getElementById("profileEdit").style.display = "block";
      loadProfileForEdit(targetUserId);
    });
  }
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      document.getElementById("profileView").style.display = "block";
      document.getElementById("profileEdit").style.display = "none";
    });
  }

  // Save profile
  const profileForm = document.getElementById("profileForm");
  if (profileForm) {
    profileForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await saveProfile(targetUserId);
    });
  }
});

async function loadProfile(userId, isOwnProfile) {
  try {
    if (!supabase) return;

    // Load profile
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error loading profile:", error);
      return;
    }

    // Load user email
    const { data: { user } } = await getCurrentUser();
    const userEmail = user?.email || "";

    // Display profile
    const nickname = profile?.nickname || userEmail.split("@")[0];
    const username = profile?.username || "";
    const bio = profile?.bio || "";
    
    document.getElementById("profileNickname").textContent = nickname;
    document.getElementById("profileUsername").textContent = username ? `@${username}` : "";
    document.getElementById("profileBio").textContent = bio || "No bio yet.";

    // Load stats
    const wishlistCount = await getWishlistCount(userId);
    document.getElementById("wishlistCount").textContent = wishlistCount;

    if (profile?.created_at) {
      const date = new Date(profile.created_at);
      document.getElementById("memberSince").textContent = date.getFullYear();
    }

    // Load public wishlist
    if (profile?.is_public !== false || isOwnProfile) {
      await loadPublicWishlist(userId);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

async function loadProfileForEdit(userId) {
  try {
    if (!supabase) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (profile) {
      document.getElementById("nickname").value = profile.nickname || "";
      document.getElementById("username").value = profile.username || "";
      document.getElementById("bio").value = profile.bio || "";
      document.getElementById("isPublic").checked = profile.is_public !== false;
    }
  } catch (error) {
    console.error("Error loading profile for edit:", error);
  }
}

async function getWishlistCount(userId) {
  try {
    if (!supabase) return 0;
    const { count } = await supabase
      .from("wishlists")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);
    return count || 0;
  } catch (error) {
    return 0;
  }
}

async function loadPublicWishlist(userId) {
  try {
    if (!supabase) return;

    const { data: wishlist } = await supabase
      .from("wishlists")
      .select("game_data")
      .eq("user_id", userId)
      .limit(12);

    const container = document.getElementById("publicWishlist");
    if (!container) return;

    if (!wishlist || wishlist.length === 0) {
      container.innerHTML = "<p>No games in wishlist yet.</p>";
      return;
    }

    container.innerHTML = wishlist
      .map((item) => createGameCard(item.game_data, false))
      .join("");

    // Add click handlers
    wishlist.forEach((item) => {
      const viewBtn = container.querySelector(`[data-game-id="${item.game_data.id}"]`);
      if (viewBtn) {
        viewBtn.addEventListener("click", async () => {
          const m = await import("./main.js");
          m.loadGameDetails(item.game_data.id);
        });
      }
    });
  } catch (error) {
    console.error("Error loading wishlist:", error);
  }
}

async function saveProfile(userId) {
  try {
    if (!supabase) {
      showMessage("Supabase not configured", "error");
      return;
    }

    const submitBtn = document.querySelector("#profileForm button[type='submit']");
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Saving...";

    const nickname = document.getElementById("nickname").value.trim();
    const username = document.getElementById("username").value.trim().toLowerCase();
    const bio = document.getElementById("bio").value.trim();
    const isPublic = document.getElementById("isPublic").checked;

    const { error } = await supabase
      .from("profiles")
      .upsert({
        user_id: userId,
        nickname: nickname || null,
        username: username || null,
        bio: bio || null,
        is_public: isPublic,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      showMessage(error.message, "error");
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    } else {
      showMessage("Profile updated successfully!", "success");
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      
      // Switch back to view
      document.getElementById("profileView").style.display = "block";
      document.getElementById("profileEdit").style.display = "none";
      
      // Reload profile
      await loadProfile(userId, true);
      setTimeout(() => updateNavAuthState(), 500);
    }
  } catch (error) {
    showMessage("Error saving profile", "error");
  }
}

function showMessage(message, type) {
  const msgEl = document.getElementById("profileMessage");
  if (msgEl) {
    msgEl.textContent = message;
    msgEl.className = `auth-message ${type}`;
    msgEl.style.display = "block";
    setTimeout(() => {
      msgEl.style.display = "none";
    }, 5000);
  }
}


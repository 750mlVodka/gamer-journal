import { supabase } from "./supabase.js";
import { getPublicProfileByUsername, getPublicWishlist } from './api.js';
import { createGameCard } from './ui.js';
import { updateNavAuthState } from './main.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Init nav (main.js handles most, but we handle logout locally too)
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await supabase.auth.signOut();
      window.location.href = "/index.html";
    });
  }

  const loadingState = document.getElementById('loadingState');
  const errorState = document.getElementById('errorState');
  const profileContent = document.getElementById('profileContent');

  // Check URL for username: /profile/yamsir or /profile.html?u=yamsir
  let username = window.location.pathname.split('/').pop();
  if (username === 'profile.html' || username === 'profile') username = null;
  if (!username) username = new URLSearchParams(window.location.search).get('u');

  const { data: { user } } = await supabase.auth.getUser();

  let profile = null;
  let isOwner = false;

  try {
    if (username) {
      // Viewing someone's profile (or own via /profile/my_user)
      profile = await getPublicProfileByUsername(username);
      // Wait, what if it's our own profile but it's private? getPublicProfileByUsername filters by is_public=true.
      // If we are the owner, we should be able to see it even if private.
      // Let's do a direct fetch if getPublicProfileByUsername fails but we are logged in.
      if (!profile && user) {
        const { data } = await supabase.from('profiles').select('*').eq('username', username).single();
        if (data && data.user_id === user.id) profile = data;
      }
    } else {
      // Accessed /profile.html directly
      if (!user) {
        window.location.href = '/login.html';
        return;
      }
      // Fetch our own profile
      const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
      profile = data;
      
      // If we have a username, ideally we want the URL to look pretty, but avoiding redirect.
      // We can use history.replaceState to change URL without reloading!
      if (profile && profile.username) {
        window.history.replaceState({}, '', `/profile/${profile.username}`);
      }
    }

    if (!profile) {
      // No profile found
      if (user && !username) {
        // We are logged in but have NO profile/username setup yet. Show edit form immediately.
        loadingState.style.display = 'none';
        document.getElementById('profileEdit').style.display = 'block';
        const cancelBtn = document.getElementById('cancelEditBtn');
        if (cancelBtn) cancelBtn.style.display = 'none'; // Force setup
        setupEditForm(null, user);
        return;
      } else {
        // Someone else's profile not found or private
        loadingState.style.display = 'none';
        errorState.style.display = 'block';
        return;
      }
    }

    // We have a profile to display!
    isOwner = user && user.id === profile.user_id;

    // Populate profile UI
    document.title = `${profile.nickname} (@${profile.username}) | Gamer Journal`;
    document.getElementById('profileNickname').textContent = profile.nickname || 'Gamer';
    document.getElementById('profileUsername').textContent = `@${profile.username}`;
    document.getElementById('profileBio').textContent = profile.bio || "This gamer hasn't added a bio yet.";
    
    if (profile.avatar_url) {
      document.getElementById('profileAvatar').innerHTML = `<img src="${profile.avatar_url}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
    }
    if (profile.banner_url) {
      document.querySelector('.banner').style.background = `url("${profile.banner_url}") center/cover no-repeat`;
    }
    
    // Update Meta Tags for sharing
    document.getElementById('ogTitle').content = `${profile.nickname}'s Gamer Profile`;
    document.getElementById('ogDesc').content = profile.bio || "Check out my gaming wishlist on Gamer Journal!";

    // Fetch Wishlist
    // If it's our own profile, we can fetch all. If public, getPublicWishlist.
    let wishlist = [];
    if (isOwner) {
       const { data } = await supabase.from('wishlists').select('*').eq('user_id', profile.user_id);
       wishlist = data || [];
    } else {
       wishlist = await getPublicWishlist(profile.user_id);
    }
    
    document.getElementById('statGames').textContent = wishlist.length;

    const wishlistContainer = document.getElementById('publicWishlist');
    if (wishlist && wishlist.length > 0) {
      wishlistContainer.innerHTML = wishlist
        .map(item => createGameCard(item.game_data, false))
        .join("");

      // Add click handlers for games
      wishlist.forEach((item) => {
        const viewBtn = wishlistContainer.querySelector(`[data-game-id="${item.game_data.id}"]`);
        if (viewBtn) {
          viewBtn.addEventListener("click", async () => {
            const m = await import("./main.js");
            m.loadGameDetails(item.game_data.id);
          });
        }
      });
    } else {
      wishlistContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">No games in wishlist yet.</p>';
    }

    loadingState.style.display = 'none';
    profileContent.style.display = 'block';

    // Setup Share Button
    const shareBtn = document.getElementById('shareBtn');
    if (shareBtn) {
      shareBtn.addEventListener('click', async () => {
        const url = window.location.href;
        try {
          if (navigator.share) {
            await navigator.share({ title: document.title, url: url });
          } else {
            await navigator.clipboard.writeText(url);
            alert('Profile link copied to clipboard!');
          }
        } catch (err) {
          console.error("Share failed", err);
        }
      });
    }

    // Setup Edit Logic if Owner
    if (isOwner) {
      const editBtn = document.getElementById('editProfileBtn');
      editBtn.style.display = 'block';
      editBtn.addEventListener('click', () => {
        profileContent.style.display = 'none';
        document.getElementById('profileEdit').style.display = 'block';
      });
      setupEditForm(profile, user);
    }

  } catch (err) {
    console.error("Error loading profile:", err);
    loadingState.style.display = 'none';
    errorState.style.display = 'block';
  }
});

function setupEditForm(profile, user) {
  const cancelBtn = document.getElementById('cancelEditBtn');
  const profileForm = document.getElementById('profileForm');

  if (profile) {
    document.getElementById("nickname").value = profile.nickname || "";
    document.getElementById("username").value = profile.username || "";
    document.getElementById("avatarUrl").value = profile.avatar_url || "";
    document.getElementById("bannerUrl").value = profile.banner_url || "";
    document.getElementById("bio").value = profile.bio || "";
    document.getElementById("isPublic").checked = profile.is_public !== false;
  }

  if (cancelBtn && profile) {
    cancelBtn.addEventListener('click', () => {
      document.getElementById('profileContent').style.display = 'block';
      document.getElementById('profileEdit').style.display = 'none';
    });
  }

  // Remove existing listeners by cloning node if necessary, but we only setup once per page load
  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = profileForm.querySelector("button[type='submit']");
    submitBtn.disabled = true;

    const updates = {
      nickname: document.getElementById("nickname").value.trim() || null,
      username: document.getElementById("username").value.trim().toLowerCase() || null,
      avatar_url: document.getElementById("avatarUrl").value.trim() || null,
      banner_url: document.getElementById("bannerUrl").value.trim() || null,
      bio: document.getElementById("bio").value.trim() || null,
      is_public: document.getElementById("isPublic").checked,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("profiles").update(updates).eq("user_id", user.id);
    
    if (error) {
      alert("Error: " + error.message);
      submitBtn.disabled = false;
    } else {
      if (updates.username && (!profile || updates.username !== profile.username)) {
        window.location.href = `/profile/${updates.username}`;
      } else {
        window.location.reload();
      }
    }
  });
}

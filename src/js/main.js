import { createGameCard, openModal, closeModal, loadGameDetails } from './ui.js';
import { addToWishlist, removeFromWishlist, isInWishlist, getWishlistIds } from './wishlist.js';
import { searchGames, getGameDetails, getTrending } from './api.js';
import { supabase } from './supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
    setupEventListeners();

    // Auth check no block app
    try {
        await checkAuth();
        await updateNavAuthState();
    } catch (error) {
        console.warn('Auth check failed, continuing without auth:', error);
    }

    if (document.getElementById('trendingGrid')) {
        loadTrending();
    }
});

function setupEventListeners() {
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', handleSearch);
    }

    const modal = document.getElementById('modal');
    const closeBtn = modal?.querySelector('.modal-close');

    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    const menuBtn = document.getElementById('menuBtn');
    const nav = document.getElementById('primaryNav');

    if (menuBtn && nav) {
        menuBtn.addEventListener('click', () => {
            const isOpen = nav.classList.toggle('open');
            menuBtn.setAttribute('aria-expanded', isOpen);
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth >= 768) {
                nav.classList.remove('open');
                menuBtn.setAttribute('aria-expanded', false);
            }
        });
    }
}

// Search games
async function handleSearch(e) {
    e.preventDefault();
    const query = document.getElementById('q').value.trim();

    if (!query) return;

    const resultsContainer = document.getElementById('results');
    resultsContainer.innerHTML = '<p>Searching...</p>';

    try {
        const data = await searchGames(query, 15);
        displayGames(data.results, resultsContainer);

    } catch (error) {
        console.error('Search error:', error);
        resultsContainer.innerHTML = '<p>Error loading games. Please try again.</p>';
    }
}

// Load trending games
async function loadTrending() {
    const container = document.getElementById('trendingGrid');
    container.innerHTML = '<p>Loading trending games...</p>';

    try {
        const data = await getTrending(15);
        displayGames(data.results, container);

    } catch (error) {
        console.error('Trending error:', error);
        container.innerHTML = '<p>Error loading trending games.</p>';
    }
}

// Display games in grid
async function displayGames(games, container) {
    if (!games || games.length === 0) {
        container.innerHTML = '<p>No games found.</p>';
        return;
    }

    // Fetch all wishlist IDs for current user once to prevent N+1 queries
    let userWishlistIds = new Set();
    try {
        userWishlistIds = await getWishlistIds();
    } catch (error) {
        console.warn('Could not fetch wishlist ids:', error);
    }

    const wishlistStatus = games.map(game => userWishlistIds.has(game.id));

    container.innerHTML = games.map((game, index) =>
        createGameCard(game, wishlistStatus[index])
    ).join('');

    games.forEach(game => {
        const viewBtn = container.querySelector(`[data-game-id="${game.id}"]`);
        const wishlistBtn = container.querySelector(`[data-wishlist-id="${game.id}"]`);

        if (viewBtn) {
            viewBtn.addEventListener('click', () => loadGameDetails(game.id));
        }

        if (wishlistBtn) {
            wishlistBtn.addEventListener('click', () => toggleWishlist(game, wishlistBtn));
        }
    });
}


// Toggle wishlist
async function toggleWishlist(game, button) {
    const inWishlist = await isInWishlist(game.id);

    if (inWishlist) {
        await removeFromWishlist(game.id);
        button.innerHTML = '<i class="fa-regular fa-heart"></i>';
        button.classList.remove('btn--primary');
        button.classList.add('btn--ghost');
    } else {
        await addToWishlist(game);
        button.innerHTML = '<i class="fa-solid fa-heart"></i>';
        button.classList.remove('btn--ghost');
        button.classList.add('btn--primary');
    }
}


// Update footer year
function updateFooter() {
    const yearSpan = document.getElementById('year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
}

// Check authentication
async function checkAuth() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user && window.location.pathname.includes('wishlist.html')) {
            window.location.href = 'login.html';
        }
    } catch (error) {
        // Si no hay Supabase, acceso sin auth
        console.warn('Auth not available:', error);
    }
}

let navListenersAdded = false;

// Update navigation with auth state
async function updateNavAuthState() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        const userMenu = document.getElementById('userMenu');
        const loginLink = document.getElementById('loginLink');
        const logoutBtn = document.getElementById('logoutBtn');
        const avatarBtn = document.getElementById('avatarBtn');

        if (user) {
            // Show user menu, hide login link
            if (userMenu) userMenu.style.display = 'block';
            if (loginLink) loginLink.style.display = 'none';

            // Load user profile (nickname)
            const nickname = await getUserNickname(user.id);
            const nicknameEl = document.getElementById('userNickname');
            const emailEl = document.getElementById('userEmail');
            
            if (nicknameEl) nicknameEl.textContent = nickname || user.email.split('@')[0];
            if (emailEl) emailEl.textContent = user.email;

            // Only add event listeners once
            if (!navListenersAdded) {
                // No JS needed for dropdown toggle, <details> handles it natively

                // Logout
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', async (e) => {
                        e.preventDefault();
                        await supabase.auth.signOut();
                        window.location.href = 'index.html';
                    });
                }
                navListenersAdded = true;
            }
        } else {
            // Hide user menu, show login link
            if (userMenu) userMenu.style.display = 'none';
            if (loginLink) loginLink.style.display = 'block';
        }
    } catch (error) {
        console.warn('Auth state update failed:', error);
    }
}

// Get user nickname from profile
async function getUserNickname(userId) {
    try {
        const { supabase } = await import('./supabase.js');
        if (!supabase) return null;

        const { data, error } = await supabase
            .from('profiles')
            .select('nickname')
            .eq('user_id', userId)
            .single();

        return data?.nickname || null;
    } catch (error) {
        return null;
    }
}

export { toggleWishlist, updateNavAuthState, getUserNickname };
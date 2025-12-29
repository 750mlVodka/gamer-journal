import { createGameCard, openModal, closeModal } from './ui.js';
import { addToWishlist, removeFromWishlist, isInWishlist } from './wishlist.js';
import { getCurrentUser, signOut, onAuthStateChange } from './auth.js';
import { searchGames, getGameDetails, getTrending } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
    setupEventListeners();
    updateFooter();

    // Auth check no bloquea el resto de la app
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

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeModal();
        });
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

    // Check wishlist status for all games (con manejo de errores)
    let wishlistStatus = [];
    try {
        wishlistStatus = await Promise.all(
            games.map(game => isInWishlist(game.id).catch(() => false))
        );
    } catch (error) {
        // Si falla, asumir que ningún juego está en wishlist
        wishlistStatus = games.map(() => false);
    }

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

// details modal
async function loadGameDetails(gameId) {
    try {
        const game = await getGameDetails(gameId);

        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = `
            <img src="${game.background_image}" alt="${game.name}">
            <h2>${game.name}</h2>
            <p class="released"><strong>Released:</strong> ${game.released || 'N/A'}</p>
            <p class="rating"><strong>Rating:</strong> ${game.rating || 'N/A'} / 5</p>
            <p class="genres"><strong>Genres:</strong> ${game.genres?.map(g => g.name).join(', ') || 'N/A'}</p>
            <p class="platfomrs"><strong>Platforms:</strong> ${game.platforms?.map(p => p.platform.name).join(', ') || 'N/A'}</p>
            <p class="desc">${game.description_raw?.substring(0, 1000) || 'No description available.'}...</p>
        `;

        openModal();

    } catch (error) {
        console.error('Details error:', error);
        alert('Error loading game details');
    }
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
        const { data: { user } } = await getCurrentUser();
        if (!user && window.location.pathname.includes('wishlist.html')) {
            window.location.href = 'login.html';
        }
    } catch (error) {
        // Si no hay Supabase configurado, permitir acceso sin auth
        console.warn('Auth not available:', error);
    }
}

// Update navigation with auth state
async function updateNavAuthState() {
    try {
        const { data: { user } } = await getCurrentUser();
        const nav = document.getElementById('primaryNav');
        if (!nav) return;

        // Remove existing auth buttons
        const existingAuthBtn = nav.querySelector('.auth-btn');
        if (existingAuthBtn) existingAuthBtn.remove();

        const li = document.createElement('li');
        if (user) {
            li.innerHTML = `<a href="#" class="auth-btn" id="logoutBtn">Logout (${user.email})</a>`;
            li.querySelector('#logoutBtn').addEventListener('click', async (e) => {
                e.preventDefault();
                await signOut();
                window.location.href = 'index.html';
            });
        } else {
            li.innerHTML = '<a href="login.html" class="auth-btn">Login</a>';
        }
        nav.appendChild(li);
    } catch (error) {
        // Si no hay Supabase, no mostrar botón de auth
        console.warn('Auth state update failed:', error);
    }
}

export { loadGameDetails, toggleWishlist };
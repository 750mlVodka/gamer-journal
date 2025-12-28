import { createGameCard, openModal, closeModal } from './ui.js';
import { addToWishlist, removeFromWishlist, isInWishlist } from './wishlist.js';
import { getCurrentUser, signOut, onAuthStateChange } from './auth.js';

const API_KEY = 'fa15ac885d114a8a891fcb203c0b9e9b';
const BASE_URL = 'https://api.rawg.io/api';

document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    setupEventListeners();
    updateFooter();
    updateNavAuthState();

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
        const response = await fetch(`${BASE_URL}/games?key=${API_KEY}&search=${encodeURIComponent(query)}&page_size=15`);

        if (!response.ok) {
            throw new Error('Failed to fetch games');
        }

        const data = await response.json();
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

    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());

    const dates = `${formatDate(lastMonth)},${formatDate(today)}`;

    try {
        const response = await fetch(`${BASE_URL}/games?key=${API_KEY}&dates=${dates}&ordering=-added&page_size=15`);

        if (!response.ok) {
            throw new Error('Failed to fetch trending games');
        }

        const data = await response.json();
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

    // Check wishlist status for all games
    const wishlistStatus = await Promise.all(
        games.map(game => isInWishlist(game.id))
    );

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
        const response = await fetch(`${BASE_URL}/games/${gameId}?key=${API_KEY}`);

        if (!response.ok) {
            throw new Error('Failed to fetch game details');
        }

        const game = await response.json();

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

function formatDate(date) {
    return date.toISOString().split('T')[0];
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
    const { data: { user } } = await getCurrentUser();
    if (!user && window.location.pathname.includes('wishlist.html')) {
        window.location.href = 'login.html';
    }
}

// Update navigation with auth state
async function updateNavAuthState() {
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
}

export { loadGameDetails, toggleWishlist };
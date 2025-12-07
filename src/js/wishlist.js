import { createGameCard } from './ui.js';

const STORAGE_KEY = 'videogame_wishlist';

document.addEventListener('DOMContentLoaded', () => {
    const wishlistGrid = document.getElementById('wishListGrid');
    if (wishlistGrid) {
        displayWishlist();
    }
});

// Get wishlist from localStorage
export function getWishlist() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error reading wishlist:', error);
        return [];
    }
}

// Save wishlist to localStorage
function saveWishlist(wishlist) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlist));
    } catch (error) {
        console.error('Error saving wishlist:', error);
    }
}

// Add game to wishlist
export function addToWishlist(game) {
    const wishlist = getWishlist();

    if (!wishlist.some(item => item.id === game.id)) {
        wishlist.push({
            id: game.id,
            name: game.name,
            background_image: game.background_image,
            released: game.released,
            rating: game.rating,
            genres: game.genres
        });
        saveWishlist(wishlist);
    }
}

// Remove game from wishlist
export function removeFromWishlist(gameId) {
    const wishlist = getWishlist();
    const filtered = wishlist.filter(game => game.id !== gameId);
    saveWishlist(filtered);

    const wishlistGrid = document.getElementById('wishListGrid');
    if (wishlistGrid) {
        displayWishlist();
    }
}

// Check if game is in wishlist
export function isInWishlist(gameId) {
    const wishlist = getWishlist();
    return wishlist.some(game => game.id === gameId);
}

// Display wishlist page
function displayWishlist() {
    const container = document.getElementById('wishListGrid');
    if (!container) return;

    const wishlist = getWishlist();

    if (wishlist.length === 0) {
        container.innerHTML = '<p style="color: var(--muted); text-align: center; padding: 2rem;">Your wishlist is empty. Start adding games!</p>';
        return;
    }

    container.innerHTML = wishlist.map(game => createGameCard(game)).join('');

    wishlist.forEach(game => {
        const viewBtn = container.querySelector(`[data-game-id="${game.id}"]`);
        const removeBtn = container.querySelector(`[data-wishlist-id="${game.id}"]`);

        if (viewBtn) {
            // import dynamic
            viewBtn.addEventListener('click', async () => {
                const m = await import('./main.js');
                m.loadGameDetails(game.id);
            });
        }

        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                removeFromWishlist(game.id);
            });
        }
    });
}
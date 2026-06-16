import { getGameDetails } from './api.js';

export function createGameCard(game, inWishlist = false) {
    const wishlistBtnClass = inWishlist ? 'btn btn--primary' : 'btn btn--ghost';
    const wishlistBtnText = inWishlist
        ? '<i class="fa-solid fa-heart"></i>'
        : '<i class="fa-regular fa-heart"></i>';

    return `
        <article class="card">
            <figure>
                <img src="${game.background_image || 'images/placeholder.jpg'}" 
                    alt="${game.name}" 
                    loading="lazy">
            </figure>
            <div class="meta">
                <h2>${game.name}</h2>
                <p><strong>Released:</strong> ${game.released || 'N/A'}</p>
                <p><strong>Rating:</strong> ${game.rating || 'N/A'} / 5</p>
                <p><strong>Genres:</strong> ${game.genres?.map(g => g.name).join(', ') || 'N/A'}</p>
                <div class="actions">
                    <button class="btn btn--ghost" data-game-id="${game.id}"> Details</button>
                    <button class="${wishlistBtnClass}" data-wishlist-id="${game.id}">${wishlistBtnText}</button>
                </div>
            </div>
        </article>
    `;
}

// Open modal
export function openModal() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.setAttribute('aria-hidden', 'false');
        modal.querySelector('.modal-content')?.focus();
        document.body.style.overflow = 'hidden';
    }
}

// Close modal
export function closeModal() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }
}

// Load game details into modal
export async function loadGameDetails(gameId) {
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
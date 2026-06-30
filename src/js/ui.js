import { getGameDetails } from './api.js';

function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str ?? '';
    return div.innerHTML;
}

export function getHeartIcon(isFilled) {
    const fill = isFilled ? 'currentColor' : 'none';
    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="${fill}" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle;">
<path fill-rule="evenodd" clip-rule="evenodd" d="M12 6.00019C10.2006 3.90317 7.19377 3.2551 4.93923 5.17534C2.68468 7.09558 2.36727 10.3061 4.13778 12.5772C5.60984 14.4654 10.0648 18.4479 11.5249 19.7369C11.6882 19.8811 11.7699 19.9532 11.8652 19.9815C11.9483 20.0062 12.0393 20.0062 12.1225 19.9815C12.2178 19.9532 12.2994 19.8811 12.4628 19.7369C13.9229 18.4479 18.3778 14.4654 19.8499 12.5772C21.6204 10.3061 21.3417 7.07538 19.0484 5.17534C16.7551 3.2753 13.7994 3.90317 12 6.00019Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
}

export function createGameCard(game, inWishlist = false) {
    const wishlistBtnClass = inWishlist ? 'btn btn--primary' : 'btn btn--ghost';
    const wishlistBtnText = getHeartIcon(inWishlist);

    const name = escapeHTML(game.name);
    const released = escapeHTML(game.released || 'N/A');
    const rating = escapeHTML(String(game.rating || 'N/A'));
    const genres = escapeHTML(game.genres?.map(g => g.name).join(', ') || 'N/A');
    const imgSrc = encodeURI(game.background_image || 'images/placeholder.jpg');

    return `
        <article class="card">
            <figure>
                <img src="${imgSrc}" 
                    alt="${name}" 
                    width="400" height="220"
                    loading="lazy">
            </figure>
            <div class="meta">
                <h2>${name}</h2>
                <p><strong>Released:</strong> ${released}</p>
                <p><strong>Rating:</strong> ${rating} / 5</p>
                <p><strong>Genres:</strong> ${genres}</p>
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
        modal.showModal();
        document.body.style.overflow = 'hidden';
    }
}

// Close modal
export function closeModal() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.close();
        document.body.style.overflow = '';
    }
}

// Load game details into modal
export async function loadGameDetails(gameId) {
    try {
        const game = await getGameDetails(gameId);

        const modalBody = document.getElementById('modalBody');
        const name = escapeHTML(game.name);
        const imgSrc = encodeURI(game.background_image || '');
        const released = escapeHTML(game.released || 'N/A');
        const rating = escapeHTML(String(game.rating || 'N/A'));
        const genres = escapeHTML(game.genres?.map(g => g.name).join(', ') || 'N/A');
        const platforms = escapeHTML(game.platforms?.map(p => p.platform.name).join(', ') || 'N/A');
        const desc = escapeHTML(game.description_raw?.substring(0, 1000) || 'No description available.');

        modalBody.innerHTML = `
            <img src="${imgSrc}" alt="${name}">
            <h2>${name}</h2>
            <p class="released"><strong>Released:</strong> ${released}</p>
            <p class="rating"><strong>Rating:</strong> ${rating} / 5</p>
            <p class="genres"><strong>Genres:</strong> ${genres}</p>
            <p class="platforms"><strong>Platforms:</strong> ${platforms}</p>
            <p class="desc">${desc}...</p>
        `;

        openModal();

    } catch (error) {
        console.error('Details error:', error);
        alert('Error loading game details');
    }
}
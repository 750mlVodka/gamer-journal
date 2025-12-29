import { createGameCard } from './ui.js';
import { supabase } from './supabase.js';
import { getCurrentUser } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    const wishlistGrid = document.getElementById('wishListGrid');
    if (wishlistGrid) {
        await displayWishlist();
    }
});

// Get wishlist from Supabase
export async function getWishlist() {
    try {
        if (!supabase) return [];

        const { data: { user } } = await getCurrentUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('wishlists')
            .select('*')
            .eq('user_id', user.id);

        if (error) {
            console.error('Error fetching wishlist:', error);
            return [];
        }

        return data.map(item => item.game_data);
    } catch (error) {
        console.error('Error getting wishlist:', error);
        return [];
    }
}

// Add game to wishlist
export async function addToWishlist(game) {
    try {
        if (!supabase) {
            alert('Supabase not configured. Please configure your .env file.');
            return;
        }

        const { data: { user }, error: userError } = await getCurrentUser();
        if (userError || !user) {
            alert('Please login to add games to wishlist');
            window.location.href = 'login.html';
            return;
        }

        const { error } = await supabase
            .from('wishlists')
            .insert({
                user_id: user.id,
                game_id: game.id,
                game_data: {
                    id: game.id,
                    name: game.name,
                    background_image: game.background_image,
                    released: game.released,
                    rating: game.rating,
                    genres: game.genres
                }
            });

        if (error) {
            console.error('Error adding to wishlist:', error);
            alert('Error adding game to wishlist');
        }
    } catch (error) {
        console.error('Error in addToWishlist:', error);
    }
}

// Remove game from wishlist
export async function removeFromWishlist(gameId) {
    try {
        if (!supabase) return;

        const { data: { user } } = await getCurrentUser();
        if (!user) return;

        const { error } = await supabase
            .from('wishlists')
            .delete()
            .eq('user_id', user.id)
            .eq('game_id', gameId);

        if (error) {
            console.error('Error removing from wishlist:', error);
        }

        const wishlistGrid = document.getElementById('wishListGrid');
        if (wishlistGrid) {
            await displayWishlist();
        }
    } catch (error) {
        console.error('Error in removeFromWishlist:', error);
    }
}

// Check if game is in wishlist
export async function isInWishlist(gameId) {
    try {
        if (!supabase) return false;

        const { data: { user }, error: userError } = await getCurrentUser();
        if (userError || !user) return false;

        const { data, error: queryError } = await supabase
            .from('wishlists')
            .select('id')
            .eq('user_id', user.id)
            .eq('game_id', gameId)
            .single();

        return !queryError && data !== null;
    } catch (error) {
        return false;
    }
}

// Display wishlist page
async function displayWishlist() {
    const container = document.getElementById('wishListGrid');
    if (!container) return;

    const wishlist = await getWishlist();

    if (wishlist.length === 0) {
        container.innerHTML = '<p style="color: var(--muted); text-align: center; padding: 2rem;">Your wishlist is empty. Start adding games!</p>';
        return;
    }

    container.innerHTML = wishlist.map(game => createGameCard(game, true)).join('');

    wishlist.forEach(game => {
        const viewBtn = container.querySelector(`[data-game-id="${game.id}"]`);
        const removeBtn = container.querySelector(`[data-wishlist-id="${game.id}"]`);

        if (viewBtn) {
            viewBtn.addEventListener('click', async () => {
                const m = await import('./main.js');
                m.loadGameDetails(game.id);
            });
        }

        if (removeBtn) {
            removeBtn.addEventListener('click', async () => {
                await removeFromWishlist(game.id);
            });
        }
    });
}
const API_KEY = import.meta.env.VITE_RAWG_API_KEY;
const BASE = 'https://api.rawg.io/api';

if (!API_KEY) {
    console.error('VITE_RAWG_API_KEY is not defined. Please create a .env file with your RAWG API key.');
}

async function safeFetch(url) {
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error('API fetch error:', err);
        throw err;
    }
}

export async function searchGames(query, page_size = 12) {
    const q = encodeURIComponent(query);
    const url = `${BASE}/games?key=${API_KEY}&search=${q}&page_size=${page_size}`;
    return await safeFetch(url);
}

export async function getGameDetails(id) {
    const url = `${BASE}/games/${id}?key=${API_KEY}`;
    return await safeFetch(url);
}

export async function getTrending(page_size = 12) {
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    const dates = `${lastMonth.toISOString().split('T')[0]},${today.toISOString().split('T')[0]}`;
    const url = `${BASE}/games?key=${API_KEY}&dates=${dates}&ordering=-added&page_size=${page_size}`;
    return await safeFetch(url);
}

export async function fetchPlaceholder() {
    const res = await fetch('data/placeholder.json');
    return await res.json();
}

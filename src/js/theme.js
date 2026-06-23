let currentTheme = localStorage.getItem('theme') || 'dark';
document.documentElement.setAttribute('data-theme', currentTheme);

document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    
    if (themeToggleBtn) {
        updateToggleIcon(themeToggleBtn, currentTheme);

        themeToggleBtn.addEventListener('click', () => {
            currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            localStorage.setItem('theme', currentTheme);
            document.documentElement.setAttribute('data-theme', currentTheme);
            updateToggleIcon(themeToggleBtn, currentTheme);
        });
    }
});

function updateToggleIcon(btn, theme) {
    if (theme === 'dark') {
        btn.innerHTML = '🌙';
    } else {
        btn.innerHTML = '☀️';
    }
}

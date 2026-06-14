// Dark mode toggle. Pairs with the inline anti-flash snippet in each
// page's <head> that applies the saved theme before first paint:
//   <script>(function(){try{if(localStorage.getItem('theme')==='dark')
//   document.documentElement.setAttribute('data-theme','dark');}catch(e){}})();</script>

function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';
    if (isDark) {
        html.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
    } else {
        html.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    }
    updateThemeToggleIcons();
}

function updateThemeToggleIcons() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.querySelectorAll('.theme-toggle').forEach(btn => {
        btn.textContent = isDark ? '☀' : '☾';
        btn.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
    });
}

document.addEventListener('DOMContentLoaded', updateThemeToggleIcons);

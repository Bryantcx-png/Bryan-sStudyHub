// Scroll-triggered fade-up animation for elements with the `.fade-up` class.
// Pairs with the `.fade-up` / `.fade-up.in-view` rules in shared/apple-theme.css.
document.addEventListener('DOMContentLoaded', () => {
    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in-view'); });
    }, { threshold: 0.15 });
    document.querySelectorAll('.fade-up').forEach(el => obs.observe(el));
});

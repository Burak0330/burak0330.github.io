// Current year in footer
const yearEl = document.getElementById("year");
if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
}

// Highlight the current section in the navigation
// (smooth scrolling is handled by CSS: html { scroll-behavior: smooth })
const navLinks = document.querySelectorAll(".nav-links a");
const sections = document.querySelectorAll("main section[id]");

function setActive(id) {
    navLinks.forEach(link => {
        link.classList.toggle("active", link.getAttribute("href") === "#" + id);
    });
}

if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                setActive(entry.target.id);
            }
        });
    }, { rootMargin: "-40% 0px -55% 0px" });

    sections.forEach(section => observer.observe(section));
}

// When scrolled to the very bottom, highlight the last link (Contact)
window.addEventListener("scroll", () => {
    const atBottom =
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 2;

    if (atBottom && sections.length) {
        setActive(sections[sections.length - 1].id);
    }
}, { passive: true });

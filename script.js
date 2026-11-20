// ---------- Footer year ----------
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ---------- Stagger index for skill chips ----------
document.querySelectorAll(".skill").forEach((el, i) => {
    el.style.setProperty("--i", i);
});

// ---------- Scroll reveal ----------
const revealEls = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("in");
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    revealEls.forEach(el => revealObserver.observe(el));
} else {
    revealEls.forEach(el => el.classList.add("in"));
}

// ---------- Active nav link ----------
const navLinks = document.querySelectorAll(".nav-links a");
const sections = document.querySelectorAll("main section[id]");

function setActive(id) {
    navLinks.forEach(link => {
        link.classList.toggle("active", link.getAttribute("href") === "#" + id);
    });
}

if ("IntersectionObserver" in window) {
    const navObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) setActive(entry.target.id);
        });
    }, { rootMargin: "-40% 0px -55% 0px" });

    sections.forEach(section => navObserver.observe(section));
}

// ---------- Scroll progress bar + bottom-of-page nav highlight ----------
const progress = document.getElementById("progress");

window.addEventListener("scroll", () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;

    if (progress && max > 0) {
        progress.style.width = (window.scrollY / max) * 100 + "%";
    }

    if (max > 0 && window.scrollY >= max - 2 && sections.length) {
        setActive(sections[sections.length - 1].id);
    }
}, { passive: true });

// ---------- Minigame: Candle Catcher ----------
(function () {
    const canvas = document.getElementById("canvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const W = 640, H = 360;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const scoreEl = document.getElementById("score");
    const livesEl = document.getElementById("lives");
    const bestEl = document.getElementById("best");
    const overlay = document.getElementById("overlay");
    const overlayText = document.getElementById("overlayText");
    const startBtn = document.getElementById("startBtn");

    const GREEN = "#3fb950", RED = "#f85149";

    let best = 0;
    try { best = parseInt(localStorage.getItem("candleBest"), 10) || 0; } catch (e) {}
    bestEl.textContent = best;

    const player = { x: W / 2 - 45, y: H - 26, w: 90, h: 12 };
    let items, particles, score, lives, elapsed, spawn, last, running, flash;
    const keys = { left: false, right: false };

    function reset() {
        items = []; particles = [];
        score = 0; lives = 3; elapsed = 0; spawn = 0.4; flash = 0;
        player.x = W / 2 - player.w / 2;
        scoreEl.textContent = 0;
        livesEl.textContent = 3;
    }

    function newItem() {
        const good = Math.random() > 0.35;
        const w = 14, h = 26 + Math.random() * 14;
        return {
            x: 20 + Math.random() * (W - 40 - w),
            y: -h, w: w, h: h, good: good,
            vy: 130 + elapsed * 5 + Math.random() * 50
        };
    }

    function burst(x, y, color) {
        for (let i = 0; i < 10; i++) {
            const a = Math.random() * Math.PI * 2;
            const s = 40 + Math.random() * 120;
            particles.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, life: 0.5, color: color });
        }
    }

    function start() {
        reset();
        running = true;
        overlay.classList.add("hidden");
        canvas.style.touchAction = "none";
        last = performance.now();
        requestAnimationFrame(frame);
    }

    function end() {
        running = false;
        canvas.style.touchAction = "auto";
        if (score > best) {
            best = score;
            bestEl.textContent = best;
            try { localStorage.setItem("candleBest", best); } catch (e) {}
        }
        overlayText.textContent = "Game over. You scored " + score + ".";
        startBtn.textContent = "Play again";
        overlay.classList.remove("hidden");
        startBtn.focus({ preventScroll: true });
    }

    function frame(now) {
        if (!running) return;
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        elapsed += dt;

        // keyboard movement
        if (keys.left) player.x -= 440 * dt;
        if (keys.right) player.x += 440 * dt;
        player.x = Math.max(0, Math.min(W - player.w, player.x));

        // spawn
        spawn -= dt;
        if (spawn <= 0) {
            items.push(newItem());
            spawn = Math.max(0.3, 0.85 - elapsed * 0.01);
        }

        // update items
        for (let i = items.length - 1; i >= 0; i--) {
            const it = items[i];
            it.y += it.vy * dt;

            const hit = it.y + it.h >= player.y && it.y <= player.y + player.h &&
                        it.x + it.w >= player.x && it.x <= player.x + player.w;

            if (hit) {
                if (it.good) {
                    score++;
                    scoreEl.textContent = score;
                    burst(it.x + it.w / 2, player.y, GREEN);
                } else {
                    lives--;
                    livesEl.textContent = lives;
                    flash = 0.25;
                    burst(it.x + it.w / 2, player.y, RED);
                }
                items.splice(i, 1);
                if (lives <= 0) { draw(); end(); return; }
            } else if (it.y > H) {
                items.splice(i, 1);
            }
        }

        // update particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.life -= dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 300 * dt;
            if (p.life <= 0) particles.splice(i, 1);
        }
        if (flash > 0) flash -= dt;

        draw();
        requestAnimationFrame(frame);
    }

    function draw() {
        ctx.clearRect(0, 0, W, H);

        // faint grid
        ctx.strokeStyle = "rgba(139,148,158,0.08)";
        ctx.lineWidth = 1;
        for (let x = 0; x <= W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
        for (let y = 0; y <= H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

        // candles
        (items || []).forEach(it => {
            const c = it.good ? GREEN : RED;
            ctx.strokeStyle = c;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(it.x + it.w / 2, it.y - 8);
            ctx.lineTo(it.x + it.w / 2, it.y + it.h + 8);
            ctx.stroke();
            ctx.fillStyle = c;
            ctx.fillRect(it.x, it.y, it.w, it.h);
        });

        // particles
        (particles || []).forEach(p => {
            ctx.globalAlpha = Math.max(p.life * 2, 0);
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, 3, 3);
        });
        ctx.globalAlpha = 1;

        // player
        ctx.fillStyle = "#58a6ff";
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(player.x, player.y, player.w, player.h, 6);
        else ctx.rect(player.x, player.y, player.w, player.h);
        ctx.fill();

        // red flash when hit
        if (flash > 0) {
            ctx.fillStyle = "rgba(248,81,73," + flash + ")";
            ctx.fillRect(0, 0, W, H);
        }
    }

    // pointer / touch control
    function movePointer(e) {
        if (!running) return;
        const rect = canvas.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * W;
        player.x = Math.max(0, Math.min(W - player.w, x - player.w / 2));
    }
    canvas.addEventListener("pointermove", movePointer);
    canvas.addEventListener("pointerdown", movePointer);

    // keyboard control
    window.addEventListener("keydown", e => {
        if (!running) return;
        if (e.key === "ArrowLeft") { keys.left = true; e.preventDefault(); }
        if (e.key === "ArrowRight") { keys.right = true; e.preventDefault(); }
    });
    window.addEventListener("keyup", e => {
        if (e.key === "ArrowLeft") keys.left = false;
        if (e.key === "ArrowRight") keys.right = false;
    });

    startBtn.addEventListener("click", start);

    // initial static frame
    reset();
    draw();
})();

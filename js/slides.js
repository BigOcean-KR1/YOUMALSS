// ===== SLIDE NAVIGATION =====
const TOTAL = 12;
let current = 1;

function goTo(n, dir) {
  if (n < 1 || n > TOTAL) return;
  const prev = document.getElementById(`slide-${current}`);
  const next = document.getElementById(`slide-${n}`);
  prev.classList.remove('active');
  prev.classList.add(dir === 1 ? 'exit-left' : 'exit-right');
  setTimeout(() => prev.classList.remove('exit-left', 'exit-right'), 500);
  next.classList.add('active');
  current = n;
  updateNav();
}

function nextSlide() { goTo(current + 1, 1); }
function prevSlide() { goTo(current - 1, -1); }

function updateNav() {
  document.getElementById('nav-count').textContent = `${current} / ${TOTAL}`;
  document.querySelectorAll('.nav-dot').forEach((d, i) => {
    d.classList.toggle('active', i + 1 === current);
  });
}

// Build dots
const dotsEl = document.getElementById('nav-dots');
for (let i = 1; i <= TOTAL; i++) {
  const d = document.createElement('div');
  d.className = 'nav-dot' + (i === 1 ? ' active' : '');
  d.onclick = () => goTo(i, i > current ? 1 : -1);
  dotsEl.appendChild(d);
}

// Init first slide
document.getElementById('slide-1').classList.add('active');
updateNav();

// Keyboard
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') nextSlide();
  if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   prevSlide();
});

// Swipe
let tsx = 0;
document.addEventListener('touchstart', e => tsx = e.touches[0].clientX);
document.addEventListener('touchend',   e => {
  const dx = e.changedTouches[0].clientX - tsx;
  if (Math.abs(dx) > 50) dx < 0 ? nextSlide() : prevSlide();
});

window.nextSlide = nextSlide;
window.prevSlide = prevSlide;

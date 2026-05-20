const TOTAL = 12;
let cur = 1;

function goTo(n, dir) {
  if (n < 1 || n > TOTAL) return;
  const prev = document.getElementById(`s${cur}`);
  const next = document.getElementById(`s${n}`);
  prev.classList.remove('active');
  prev.classList.add(dir > 0 ? 'exit-l' : 'exit-r');
  setTimeout(() => prev.classList.remove('exit-l','exit-r'), 560);
  next.classList.add('active');
  cur = n;
  updateNav();
}
function next() { goTo(cur+1, 1); }
function prev() { goTo(cur-1,-1); }

function updateNav() {
  document.querySelectorAll('.nb-dot').forEach((d,i) => d.classList.toggle('on', i+1===cur));
}

// Build dots
const dotsEl = document.getElementById('nb-dots');
for (let i=1;i<=TOTAL;i++) {
  const d = document.createElement('div');
  d.className = 'nb-dot'+(i===1?' on':'');
  d.onclick = () => goTo(i, i>cur?1:-1);
  dotsEl.appendChild(d);
}
document.getElementById('s1').classList.add('active');

// Keyboard
document.addEventListener('keydown', e => {
  if (e.key==='ArrowRight'||e.key==='ArrowDown') next();
  if (e.key==='ArrowLeft' ||e.key==='ArrowUp')   prev();
});

// Swipe
let tx=0;
document.addEventListener('touchstart', e=>tx=e.touches[0].clientX);
document.addEventListener('touchend',   e=>{ const dx=e.changedTouches[0].clientX-tx; if(Math.abs(dx)>50) dx<0?next():prev(); });

window.next=next; window.prev=prev;

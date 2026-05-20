// ===== COVER SLIDE PARTICLES =====
(function () {
  const canvas = document.getElementById('cover-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  function resize() {
    const parent = canvas.parentElement;
    W = canvas.width  = parent.offsetWidth  || window.innerWidth;
    H = canvas.height = parent.offsetHeight || window.innerHeight;
  }

  class Dot {
    constructor() { this.reset(true); }
    reset(init) {
      this.x = Math.random() * W;
      this.y = init ? Math.random() * H : H + 10;
      this.r = Math.random() * 1.8 + 0.3;
      this.vy = -(Math.random() * 0.35 + 0.08);
      this.vx = (Math.random() - 0.5) * 0.15;
      this.alpha = Math.random() * 0.5 + 0.05;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.y < -10) this.reset(false);
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(116,198,157,${this.alpha})`;
      ctx.fill();
    }
  }

  resize();
  window.addEventListener('resize', resize);
  for (let i = 0; i < 60; i++) particles.push(new Dot());

  function loop() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(loop);
  }
  loop();
})();

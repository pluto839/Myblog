(function() {
  if (typeof window === 'undefined') return;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.id = 'pluto-cursor-fx';
  canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;';
  document.body.appendChild(canvas);

  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);

  const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark';

  const particles = [];
  const maxParticles = 40;
  let mouseX = -100, mouseY = -100;
  let lastSpawn = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    const now = performance.now();
    if (now - lastSpawn > 25) {
      lastSpawn = now;
      spawnParticle(mouseX, mouseY);
    }
  });

  function spawnParticle(x, y) {
    if (particles.length >= maxParticles) particles.shift();
    const dark = isDark();
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 1.4,
      vy: (Math.random() - 0.5) * 1.4 - 0.6,
      life: 1,
      decay: 0.018 + Math.random() * 0.015,
      size: 1.8 + Math.random() * 2.2,
      hue: dark ? 200 + Math.random() * 60 : 30 + Math.random() * 30,
      dark
    });
  }

  function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy -= 0.01;
      p.life -= p.decay;

      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      const dark = isDark();
      const base = dark ? `hsla(${p.hue}, 90%, 70%` : `hsla(${p.hue}, 85%, 55%`;

      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
      glow.addColorStop(0, base + `, ${p.life * 0.8})`);
      glow.addColorStop(0.4, base + `, ${p.life * 0.3})`);
      glow.addColorStop(1, base + ', 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = dark
        ? `rgba(220, 240, 255, ${p.life * 0.9})`
        : `rgba(255, 230, 180, ${p.life * 0.9})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(update);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', update);
  } else {
    update();
  }

  document.addEventListener('click', (e) => {
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 / 12) * i + Math.random() * 0.3;
      const speed = 2 + Math.random() * 2;
      if (particles.length >= maxParticles + 20) break;
      const dark = isDark();
      particles.push({
        x: e.clientX,
        y: e.clientY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.025 + Math.random() * 0.015,
        size: 2 + Math.random() * 1.5,
        hue: dark ? 220 + Math.random() * 80 : 20 + Math.random() * 40,
        dark
      });
    }
  });
})();

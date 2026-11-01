(function () {
  if (typeof window === 'undefined') return;

  // 触屏设备没有鼠标指针，跑 canvas 只是白烧电
  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!finePointer) return;

  // 尊重系统的「减少动态效果」设置
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('2d');
  canvas.id = 'pluto-cursor-fx';
  canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;';
  document.body.appendChild(canvas);
  document.documentElement.classList.add('pluto-cursor');

  function resize() {
    var dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  var isDark = function () {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  };

  // 白天：琥珀金日光；夜晚：青蓝色月光
  var THEME = {
    light: {
      inner: [255, 226, 148],
      outer: [255, 168, 38],
      core: [255, 253, 240],
      ring: [255, 196, 87],
      spark: [255, 214, 130]
    },
    dark: {
      inner: [150, 224, 255],
      outer: [70, 140, 255],
      core: [234, 248, 255],
      ring: [126, 214, 255],
      spark: [170, 232, 255]
    }
  };

  var mouseX = -9999;
  var mouseY = -9999;
  var prevX = -9999;
  var prevY = -9999;
  var hoverX = -9999;
  var hoverY = -9999;
  var speed = 0;
  var hoverPower = 0;
  var ringSpin = 0;
  var lastSpawn = 0;
  var visible = true;

  var sparks = [];
  var MAX_SPARKS = 46;

  function rgba(c, a) {
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
  }

  document.addEventListener('mousemove', function (e) {
    prevX = mouseX;
    prevY = mouseY;
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (prevX < -9000) {
      prevX = mouseX;
      prevY = mouseY;
    }
  });

  document.addEventListener('mouseleave', function () { visible = false; });
  document.addEventListener('mouseenter', function () { visible = true; });

  function spawnSpark(x, y, power) {
    if (sparks.length >= MAX_SPARKS) sparks.shift();
    var angle = Math.random() * Math.PI * 2;
    var speedOut = (0.35 + Math.random() * 1.1) * power;
    sparks.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speedOut,
      vy: Math.sin(angle) * speedOut,
      life: 1,
      decay: 0.014 + Math.random() * 0.02,
      size: 1 + Math.random() * 1.6,
      dark: isDark()
    });
  }

  document.addEventListener('click', function (e) {
    for (var i = 0; i < 14; i++) {
      var angle = (Math.PI * 2 / 14) * i + Math.random() * 0.25;
      var sp = 1.6 + Math.random() * 2.4;
      if (sparks.length >= MAX_SPARKS + 16) break;
      sparks.push({
        x: e.clientX,
        y: e.clientY,
        vx: Math.cos(angle) * sp,
        vy: Math.sin(angle) * sp,
        life: 1,
        decay: 0.02 + Math.random() * 0.02,
        size: 1.4 + Math.random() * 1.8,
        dark: isDark()
      });
    }
  });

  function drawHalo(x, y, radius, palette, alpha, spin) {
    var halo = ctx.createRadialGradient(x, y, 0, x, y, radius);
    halo.addColorStop(0, rgba(palette.inner, 0.42 * alpha));
    halo.addColorStop(0.35, rgba(palette.outer, 0.16 * alpha));
    halo.addColorStop(0.7, rgba(palette.outer, 0.05 * alpha));
    halo.addColorStop(1, rgba(palette.outer, 0));
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // 主光圈：带缺口的弧，缓慢自转
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(spin);
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = rgba(palette.ring, 0.75 * alpha);
    ctx.shadowBlur = 16;
    ctx.shadowColor = rgba(palette.ring, 0.85 * alpha);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.52, 0.15, Math.PI * 1.25);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.52, Math.PI * 1.45, Math.PI * 1.95);
    ctx.stroke();

    // 内圈细环
    ctx.shadowBlur = 8;
    ctx.lineWidth = 1;
    ctx.strokeStyle = rgba(palette.inner, 0.55 * alpha);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.3, -Math.PI * 0.9, Math.PI * 0.35);
    ctx.stroke();
    ctx.restore();

    // 光核
    var core = ctx.createRadialGradient(x, y, 0, x, y, radius * 0.22);
    core.addColorStop(0, rgba(palette.core, 0.95 * alpha));
    core.addColorStop(0.5, rgba(palette.inner, 0.55 * alpha));
    core.addColorStop(1, rgba(palette.inner, 0));
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.22, 0, Math.PI * 2);
    ctx.fill();
  }

  function frame() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    if (visible) {
      var dark = isDark();
      var palette = dark ? THEME.dark : THEME.light;

      var dx = mouseX - prevX;
      var dy = mouseY - prevY;
      var dist = Math.sqrt(dx * dx + dy * dy);
      speed += (Math.min(dist, 60) - speed) * 0.18;
      prevX = mouseX;
      prevY = mouseY;

      // 鼠标静止时光圈慢慢收敛回原位，移动时追随
      hoverX += (mouseX - hoverX) * 0.22;
      hoverY += (mouseY - hoverY) * 0.22;

      var target = Math.min(speed / 60, 1);
      hoverPower += (target - hoverPower) * 0.12;
      ringSpin += dark ? 0.008 : 0.014;

      var baseRadius = dark ? 46 : 40;
      var radius = baseRadius + hoverPower * 26;
      var alpha = dark ? 0.95 : 0.85;

      drawHalo(hoverX, hoverY, radius, palette, alpha, ringSpin);

      // 快移时喷出光点
      var now = performance.now();
      if (speed > 8 && now - lastSpawn > 26) {
        lastSpawn = now;
        spawnSpark(hoverX, hoverY, 0.6 + hoverPower);
      }
    }

    for (var i = sparks.length - 1; i >= 0; i--) {
      var s = sparks[i];
      s.x += s.vx;
      s.y += s.vy;
      s.vx *= 0.96;
      s.vy *= 0.96;
      s.life -= s.decay;
      if (s.life <= 0) {
        sparks.splice(i, 1);
        continue;
      }
      var p = s.dark ? THEME.dark : THEME.light;
      var g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size * 5);
      g.addColorStop(0, rgba(p.spark, s.life * 0.85));
      g.addColorStop(0.45, rgba(p.outer, s.life * 0.28));
      g.addColorStop(1, rgba(p.outer, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size * 5, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', frame);
  } else {
    frame();
  }
})();

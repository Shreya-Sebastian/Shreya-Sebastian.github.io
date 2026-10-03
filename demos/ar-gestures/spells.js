function glowCircle(ctx, x, y, r, innerColor, outerColor, shadowColor, shadowBlur) {
  ctx.save();
  ctx.shadowColor = shadowColor;
  ctx.shadowBlur  = shadowBlur;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, innerColor);
  g.addColorStop(1, outerColor);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

class FireSpell {
  constructor() {
    this.particles = [];
    this.time = 0;
  }

  update(dt, cx, cy, ps) {
    this.time += dt;
    const count = Math.max(1, Math.round(10 * dt * 60));
    for (let i = 0; i < count; i++) {
      const speed = ps * (2.5 + Math.random() * 3);
      this.particles.push({
        x: cx + (Math.random() - 0.5) * ps * 0.45,
        y: cy,
        vx: (Math.random() - 0.5) * ps * 0.8,
        vy: -speed,
        size: ps * (0.07 + Math.random() * 0.1),
        maxLife: 0.5 + Math.random() * 0.65,
        life: 1,
        hue: 8 + Math.random() * 38,
      });
    }
    this.particles = this.particles.filter(p => {
      p.life -= dt / p.maxLife;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy *= 0.975;
      return p.life > 0;
    });
  }

  draw(ctx, cx, cy, ps) {
    const pulse = 1 + 0.18 * Math.sin(this.time * 10);
    glowCircle(ctx, cx, cy, ps * 0.55 * pulse,
      'rgba(255,220,140,0.95)', 'rgba(255,50,0,0)', '#FF4400', 40);

    this.particles.forEach(p => {
      const l = Math.floor(38 + p.life * 52);
      ctx.save();
      ctx.globalAlpha = Math.pow(p.life, 0.6) * 0.9;
      ctx.shadowColor = `hsl(${p.hue},100%,${l}%)`;
      ctx.shadowBlur = 14;
      ctx.fillStyle = `hsl(${p.hue},100%,${l}%)`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.5, p.size * p.life), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }
}

class WindSpell {
  constructor() {
    this.time = 0;
    this.orbiters = Array.from({ length: 18 }, (_, i) => ({
      phase: (i / 18) * Math.PI * 2,
      speed: 2.2 + Math.random() * 1.0,
      layer: i % 3,
      size: 2 + Math.random() * 4,
      alpha: 0.5 + Math.random() * 0.5,
      radVar: 0.08 + Math.random() * 0.1,
      radFreq: 1.2 + Math.random() * 0.8,
      radPhase: Math.random() * Math.PI * 2,
    }));
  }

  update(dt, cx, cy, ps) {
    this.time += dt;
    this.orbiters.forEach(o => { o.phase += o.speed * dt; });
  }

  draw(ctx, cx, cy, ps) {
    const pulse = 1 + 0.1 * Math.sin(this.time * 4);
    glowCircle(ctx, cx, cy, ps * 0.32 * pulse,
      'rgba(200,255,255,0.9)', 'rgba(0,210,255,0)', '#00FFFF', 28);

    const radii = [1.15, 1.75, 2.35];
    this.orbiters.forEach(o => {
      const baseR = ps * radii[o.layer];
      const r = baseR * (1 + o.radVar * Math.sin(this.time * o.radFreq + o.radPhase));
      const x = cx + Math.cos(o.phase) * r;
      const y = cy + Math.sin(o.phase) * r * 0.52;
      const alpha = o.alpha * (0.6 + 0.4 * Math.sin(o.phase + this.time * 2));
      const colors = ['#FFFFFF', '#AAFFFF', '#00DDFF'];

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowColor = '#00FFFF';
      ctx.shadowBlur = 10;
      ctx.fillStyle = colors[o.layer];
      ctx.beginPath();
      ctx.arc(x, y, o.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    radii.forEach((rf, li) => {
      ctx.save();
      ctx.strokeStyle = `rgba(0,200,255,${0.07 + li * 0.03})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(cx, cy, ps * rf, ps * rf * 0.52, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });
  }
}

class LightningSpell {
  constructor() {
    this.particles = [];
    this.time = 0;
    this.boltTimer = 0;
    this.bolt = null;
    this.boltLife = 0;
  }

  _makeBolt(x1, y1, x2, y2, depth) {
    if (depth === 0) return [{ x: x1, y: y1 }, { x: x2, y: y2 }];
    const spread = Math.hypot(x2 - x1, y2 - y1) * 0.55;
    const mx = (x1 + x2) / 2 + (Math.random() - 0.5) * spread;
    const my = (y1 + y2) / 2 + (Math.random() - 0.5) * spread;
    return [
      ...this._makeBolt(x1, y1, mx, my, depth - 1),
      ...this._makeBolt(mx, my, x2, y2, depth - 1).slice(1),
    ];
  }

  update(dt, cx, cy, ps) {
    this.time += dt;
    this.boltTimer -= dt;
    this.boltLife -= dt;

    if (this.boltTimer <= 0) {
      this.boltTimer = 0.07 + Math.random() * 0.11;
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
      const len = ps * (2.8 + Math.random() * 2);
      this.bolt = this._makeBolt(
        cx, cy,
        cx + Math.cos(angle) * len,
        cy + Math.sin(angle) * len,
        4
      );
      this.boltLife = 0.07;

      for (let i = 0; i < 6; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = ps * (3.5 + Math.random() * 5);
        this.particles.push({
          x: cx, y: cy,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          size: 2 + Math.random() * 3,
          life: 1,
          maxLife: 0.12 + Math.random() * 0.18,
        });
      }
    }

    this.particles = this.particles.filter(p => {
      p.life -= dt / p.maxLife;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.90;
      p.vy *= 0.90;
      return p.life > 0;
    });
  }

  draw(ctx, cx, cy, ps) {
    const pulse = 0.65 + 0.35 * Math.abs(Math.sin(this.time * 22));
    glowCircle(ctx, cx, cy, ps * 0.28 * pulse,
      'rgba(255,255,255,1)', 'rgba(255,255,80,0)', '#FFFF00', 50 * pulse);

    if (this.bolt && this.boltLife > 0) {
      ctx.save();
      ctx.shadowColor = '#FFFFFF';
      ctx.shadowBlur = 22;
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(255,220,0,0.35)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      this.bolt.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      ctx.stroke();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      this.bolt.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      ctx.stroke();
      ctx.restore();
    }

    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.shadowColor = '#FFFF00';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.5, p.size * p.life), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }
}

class EarthSpell {
  constructor() {
    this.time = 0;
    this.chunks = Array.from({ length: 6 }, (_, i) => ({
      angle: (i / 6) * Math.PI * 2,
      angSpeed: 0.38 + Math.random() * 0.22,
      radiusFact: 1.0 + Math.random() * 0.9,
      size: 9 + Math.random() * 11,
      rot: Math.random() * Math.PI,
      rotSpeed: (Math.random() - 0.5) * 1.8,
      color: `hsl(${22 + Math.random() * 18},${38 + Math.random() * 18}%,${28 + Math.random() * 14}%)`,
    }));
    this.dust = [];
  }

  update(dt, cx, cy, ps) {
    this.time += dt;
    this.chunks.forEach(c => {
      c.angle += c.angSpeed * dt;
      c.rot += c.rotSpeed * dt;
    });
    if (Math.random() < 0.35) {
      this.dust.push({
        x: cx + (Math.random() - 0.5) * ps * 0.5,
        y: cy + (Math.random() - 0.5) * ps * 0.3,
        vx: (Math.random() - 0.5) * ps * 0.5,
        vy: -ps * 0.25 * Math.random(),
        size: 2 + Math.random() * 4,
        life: 1,
        maxLife: 0.7 + Math.random() * 0.6,
      });
    }
    this.dust = this.dust.filter(d => {
      d.life -= dt / d.maxLife;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.vy += ps * 0.28 * dt;
      return d.life > 0;
    });
  }

  draw(ctx, cx, cy, ps) {
    glowCircle(ctx, cx, cy, ps * 0.38,
      'rgba(110,80,45,0.85)', 'rgba(70,45,15,0)', '#7A5520', 22);

    this.chunks.forEach(c => {
      const r = ps * c.radiusFact;
      const x = cx + Math.cos(c.angle) * r;
      const y = cy + Math.sin(c.angle) * r * 0.65;
      const s = c.size * (ps / 80);

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(c.rot);
      ctx.shadowColor = '#3C2208';
      ctx.shadowBlur = 8;
      ctx.fillStyle = c.color;
      ctx.beginPath();
      ctx.moveTo(-s, -s * 0.55);
      ctx.lineTo(s * 0.6, -s);
      ctx.lineTo(s, s * 0.45);
      ctx.lineTo(-s * 0.35, s);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });

    this.dust.forEach(d => {
      ctx.save();
      ctx.globalAlpha = d.life * 0.55;
      ctx.fillStyle = '#C8A878';
      ctx.beginPath();
      ctx.arc(d.x, d.y, Math.max(0.5, d.size * d.life), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }
}

class IceSpell {
  constructor() {
    this.time = 0;
    this.ripplePhase = 0;
    this.flakes = Array.from({ length: 10 }, (_, i) => ({
      angle: (i / 10) * Math.PI * 2,
      angSpeed: 0.25 + Math.random() * 0.2,
      radiusFact: 0.65 + (i % 3) * 0.55,
      size: 7 + Math.random() * 10,
      rot: Math.random() * Math.PI,
      rotSpeed: (Math.random() - 0.5) * 0.9,
    }));
  }

  _drawFlake(ctx, x, y, size, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.strokeStyle = 'rgba(180,225,255,0.92)';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#00AAFF';
    ctx.shadowBlur = 12;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const ex = Math.cos(a) * size;
      const ey = Math.sin(a) * size;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      for (const ba of [a + Math.PI / 3, a - Math.PI / 3]) {
        ctx.beginPath();
        ctx.moveTo(ex * 0.5, ey * 0.5);
        ctx.lineTo(ex * 0.5 + Math.cos(ba) * size * 0.28, ey * 0.5 + Math.sin(ba) * size * 0.28);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  update(dt, cx, cy, ps) {
    this.time += dt;
    this.ripplePhase += dt * 1.4;
    this.flakes.forEach(f => {
      f.angle += f.angSpeed * dt;
      f.rot += f.rotSpeed * dt;
    });
  }

  draw(ctx, cx, cy, ps) {
    const pulse = 1 + 0.08 * Math.sin(this.time * 3);
    glowCircle(ctx, cx, cy, ps * 0.38 * pulse,
      'rgba(195,235,255,0.92)', 'rgba(0,110,255,0)', '#0088FF', 32);

    for (let i = 0; i < 2; i++) {
      const phase = (this.ripplePhase + i * Math.PI) % (Math.PI * 2);
      const progress = phase / (Math.PI * 2);
      ctx.save();
      ctx.globalAlpha = (1 - progress) * 0.5;
      ctx.strokeStyle = '#88CCFF';
      ctx.shadowColor = '#0066FF';
      ctx.shadowBlur = 12;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, ps * progress * 3.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    this.flakes.forEach(f => {
      const r = ps * f.radiusFact;
      const x = cx + Math.cos(f.angle) * r;
      const y = cy + Math.sin(f.angle) * r * 0.72;
      ctx.save();
      ctx.globalAlpha = 0.82;
      this._drawFlake(ctx, x, y, f.size * (ps / 80), f.rot);
      ctx.restore();
    });
  }
}

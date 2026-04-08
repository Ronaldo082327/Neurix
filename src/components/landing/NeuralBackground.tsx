import { useEffect, useRef, useCallback } from "react";

interface Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
  depth: number;
  hue: number;
  saturation: number;
  lightness: number;
  alpha: number;
  baseAlpha: number;
  pulseSpeed: number;
  pulsePhase: number;
  vx: number;
  vy: number;
}

const PARTICLE_COUNT = 80;
const CONNECTION_DISTANCE = 140;
const MOUSE_RADIUS = 200;
const MOUSE_ATTRACTION = 0.02;

export function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);
  const timeRef = useRef(0);

  const createParticles = useCallback((width: number, height: number) => {
    const particles: Particle[] = [];
    const colorPalette = [
      { hue: 168, sat: 64, light: 40 },  // bioluminescent teal
      { hue: 192, sat: 91, light: 36 },  // deep cyan
      { hue: 38, sat: 92, light: 50 },   // synaptic amber
      { hue: 160, sat: 72, light: 42 },  // neural emerald
    ];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const depth = Math.random() * 0.8 + 0.2; // 0.2 to 1.0
      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      const baseAlpha = depth * 0.5 + 0.1;

      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        baseX: Math.random() * width,
        baseY: Math.random() * height,
        size: depth * 3 + 0.5,
        depth,
        hue: color.hue + (Math.random() - 0.5) * 20,
        saturation: color.sat,
        lightness: color.light,
        alpha: baseAlpha,
        baseAlpha,
        pulseSpeed: Math.random() * 0.02 + 0.005,
        pulsePhase: Math.random() * Math.PI * 2,
        vx: (Math.random() - 0.5) * 0.3 * depth,
        vy: (Math.random() - 0.5) * 0.3 * depth,
      });
    }

    return particles;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = parent.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.scale(dpr, dpr);
      particlesRef.current = createParticles(rect.width, rect.height);
    };

    resizeCanvas();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };

    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    const drawMeshGradient = (time: number, w: number, h: number) => {
      const shift1 = Math.sin(time * 0.0003) * 30;
      const shift2 = Math.cos(time * 0.0002) * 20;
      const shift3 = Math.sin(time * 0.00015) * 25;

      // Large soft blobs that drift
      const blobs = [
        {
          x: w * 0.3 + Math.sin(time * 0.0002) * w * 0.1,
          y: h * 0.3 + Math.cos(time * 0.00015) * h * 0.1,
          r: Math.max(w, h) * 0.5,
          color: `hsla(${168 + shift1}, 50%, 12%, 0.3)`,
        },
        {
          x: w * 0.7 + Math.cos(time * 0.00018) * w * 0.12,
          y: h * 0.6 + Math.sin(time * 0.00025) * h * 0.08,
          r: Math.max(w, h) * 0.45,
          color: `hsla(${192 + shift2}, 70%, 10%, 0.25)`,
        },
        {
          x: w * 0.5 + Math.sin(time * 0.00012) * w * 0.15,
          y: h * 0.8 + Math.cos(time * 0.0002) * h * 0.1,
          r: Math.max(w, h) * 0.4,
          color: `hsla(${38 + shift3}, 50%, 12%, 0.15)`,
        },
      ];

      for (const blob of blobs) {
        const grad = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.r);
        grad.addColorStop(0, blob.color);
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }
    };

    const drawAuroraWaves = (time: number, w: number, h: number) => {
      ctx.save();
      ctx.globalCompositeOperation = "screen";

      for (let wave = 0; wave < 3; wave++) {
        const baseY = h * (0.3 + wave * 0.15);
        const hues = [168, 192, 38];
        const hue = hues[wave];

        ctx.beginPath();
        ctx.moveTo(0, baseY);

        for (let x = 0; x <= w; x += 4) {
          const y =
            baseY +
            Math.sin(x * 0.003 + time * 0.0004 + wave * 2) * 40 +
            Math.sin(x * 0.007 + time * 0.0003) * 20 +
            Math.cos(x * 0.001 + time * 0.0002 + wave) * 30;
          ctx.lineTo(x, y);
        }

        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, baseY - 60, 0, baseY + 120);
        grad.addColorStop(0, "transparent");
        grad.addColorStop(0.3, `hsla(${hue}, 80%, 50%, 0.04)`);
        grad.addColorStop(0.5, `hsla(${hue}, 90%, 45%, 0.06)`);
        grad.addColorStop(0.7, `hsla(${hue}, 80%, 50%, 0.03)`);
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.fill();
      }

      ctx.restore();
    };

    const animate = (timestamp: number) => {
      timeRef.current = timestamp;
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);

      // Mesh gradient layer
      drawMeshGradient(timestamp, w, h);

      // Aurora waves
      drawAuroraWaves(timestamp, w, h);

      const particles = particlesRef.current;
      const mouse = mouseRef.current;

      // Update particles
      for (const p of particles) {
        // Gentle drift
        p.x += p.vx;
        p.y += p.vy;

        // Soft boundary wrap
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;

        // Mouse interaction
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < MOUSE_RADIUS) {
          const force = (1 - dist / MOUSE_RADIUS) * MOUSE_ATTRACTION * p.depth;
          p.x += dx * force;
          p.y += dy * force;
          // Brighten near cursor
          p.alpha = p.baseAlpha + (1 - dist / MOUSE_RADIUS) * 0.5;
        } else {
          p.alpha += (p.baseAlpha - p.alpha) * 0.05;
        }

        // Pulse
        const pulse = Math.sin(timestamp * p.pulseSpeed + p.pulsePhase);
        p.alpha += pulse * 0.08;
      }

      // Draw connections
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONNECTION_DISTANCE) {
            const opacity = (1 - dist / CONNECTION_DISTANCE) * 0.15 * Math.min(a.depth, b.depth);
            const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
            grad.addColorStop(0, `hsla(${a.hue}, ${a.saturation}%, ${a.lightness}%, ${opacity})`);
            grad.addColorStop(1, `hsla(${b.hue}, ${b.saturation}%, ${b.lightness}%, ${opacity})`);
            ctx.strokeStyle = grad;
            ctx.lineWidth = Math.min(a.depth, b.depth) * 0.8;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      ctx.restore();

      // Draw particles
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      for (const p of particles) {
        // Outer glow
        const glowSize = p.size * (3 + p.depth * 2);
        const glowGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize);
        glowGrad.addColorStop(0, `hsla(${p.hue}, ${p.saturation}%, ${p.lightness + 10}%, ${p.alpha * 0.4})`);
        glowGrad.addColorStop(0.5, `hsla(${p.hue}, ${p.saturation}%, ${p.lightness}%, ${p.alpha * 0.15})`);
        glowGrad.addColorStop(1, "transparent");
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = `hsla(${p.hue}, ${p.saturation}%, ${p.lightness + 20}%, ${Math.min(p.alpha + 0.2, 1)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [createParticles]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0" />
      {/* Radial gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, transparent 0%, hsla(200, 25%, 3.5%, 0.4) 50%, hsla(200, 25%, 3.5%, 0.85) 100%)",
        }}
      />
    </div>
  );
}

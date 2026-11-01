"use client";
import { useEffect, useRef, useState } from "react";

const CELL = 24; // matches the nb-blueprint-sm grid
const AUTO_STEP_MS = 150;
const PLAY_STEP_MS = 120;
const START_LENGTH = 3;
const AUTO_MAX_LENGTH = 14;
const PLAY_MAX_LENGTH = 40;
const PARTS = ["gear", "chip", "bolt", "battery"];
// Each run randomly either collects robot parts or spells the lab's name, letter by letter
const WORD = "NEWTONBOTICS";
const DIRS = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
];
const ARROWS = { ArrowRight: [1, 0], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowUp: [0, -1] };
const SIGNAL = "#FF5A1F";

// Tiny canvas icons, each drawn centred on (cx, cy) inside one grid cell
function drawPart(ctx, type, cx, cy, color, font) {
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  if (type.startsWith("letter:")) {
    ctx.beginPath();
    ctx.roundRect(cx - 8, cy - 8, 16, 16, 3);
    ctx.fill();
    ctx.fillStyle = "#0E1013";
    ctx.font = `700 11px ${font}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(type.slice(7), cx, cy + 0.5);
  } else if (type === "gear") {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.save();
      ctx.translate(cx + Math.cos(a) * 5.5, cy + Math.sin(a) * 5.5);
      ctx.rotate(a);
      ctx.fillRect(-1.6, -1.6, 3.2, 3.2);
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.beginPath();
    ctx.arc(cx, cy, 1.8, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === "chip") {
    ctx.fillRect(cx - 4.5, cy - 4.5, 9, 9);
    for (let i = -1; i <= 1; i++) {
      ctx.fillRect(cx + i * 3 - 0.6, cy - 7.5, 1.2, 2.5);
      ctx.fillRect(cx + i * 3 - 0.6, cy + 5, 1.2, 2.5);
      ctx.fillRect(cx - 7.5, cy + i * 3 - 0.6, 2.5, 1.2);
      ctx.fillRect(cx + 5, cy + i * 3 - 0.6, 2.5, 1.2);
    }
  } else if (type === "bolt") {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
      ctx[i ? "lineTo" : "moveTo"](cx + Math.cos(a) * 5.5, cy + Math.sin(a) * 5.5);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.beginPath();
    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === "battery") {
    ctx.beginPath();
    ctx.roundRect(cx - 4, cy - 6, 8, 12, 1.5);
    ctx.fill();
    ctx.fillRect(cx - 2, cy - 7.5, 4, 1.5);
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(cx - 2.5, cy - 0.6, 5, 1.2);
  } else {
    // chassis block
    ctx.beginPath();
    ctx.roundRect(cx - 6, cy - 6, 12, 12, 3);
    ctx.fill();
  }
}

// The rover: orange body, an antenna, and eyes that look where it is heading
function drawRobot(ctx, cx, cy, [dx, dy], t, blinkOn) {
  ctx.strokeStyle = SIGNAL;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 7);
  ctx.lineTo(cx + Math.sin(t / 180) * 1.5, cy - 11);
  ctx.stroke();
  ctx.fillStyle = SIGNAL;
  ctx.beginPath();
  ctx.arc(cx + Math.sin(t / 180) * 1.5, cy - 11.5, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(cx - 8, cy - 7, 16, 14, 4);
  ctx.fill();
  ctx.fillStyle = "#0E1013";
  ctx.beginPath();
  ctx.roundRect(cx - 6, cy - 4.5, 12, 7, 2.5);
  ctx.fill();
  if (blinkOn) {
    ctx.fillStyle = "#FFE3D4";
    const ex = dx * 1.6;
    const ey = dy * 1.2;
    ctx.beginPath();
    ctx.arc(cx - 2.6 + ex, cy - 1 + ey, 1.4, 0, Math.PI * 2);
    ctx.arc(cx + 2.6 + ex, cy - 1 + ey, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Blueprint-grid stand-in for media that has no photo yet. A little rover drives the grid picking up
 * robot parts (gears, chips, bolts, batteries); each part snaps onto its back as a module. It drives
 * itself, and on large pointer devices visitors can click it and steer with the arrow keys.
 * Pauses off-screen; draws a single still frame for reduced-motion users.
 * `onStatus` moves the status line (play hint, score) out of the frame: the frame stays clear and the
 * text is handed to the caller to print elsewhere; `label` is then only read to screen readers.
 */
export default function BlueprintPlaceholder({ label = "Photo pending", className = "", onStatus }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const [canPlay, setCanPlay] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [parts, setParts] = useState(0);
  const [mode, setMode] = useState("parts"); // "parts" | "word"
  const playingRef = useRef(false);
  const gameRef = useRef(null);

  useEffect(() => {
    // Playable only on large pointer devices, and only for big frames (not small card thumbnails)
    const wrap = wrapRef.current;
    setCanPlay(
      window.matchMedia("(min-width: 1024px) and (pointer: fine)").matches &&
        Boolean(wrap) &&
        wrap.clientWidth >= 360 &&
        wrap.clientHeight >= 200,
    );
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let cols = 0;
    let rows = 0;
    let body = []; // [{ x, y, type }], head first
    let target = null; // { x, y, type }
    let dir = [1, 0];
    let queuedDir = null;
    let awaitingKey = true; // in play mode the robot waits for the first arrow key (and after a crash)
    let visible = true;
    let raf = 0;
    let last = 0;
    let crashAt = -1e9;
    let runMode = "parts";
    let celebrateUntil = 0; // word complete: hold the finished name on screen for a moment
    let collected = 0;
    // Module colour follows the theme (the muted text colour is remapped on dark pages)
    const toneEl = wrap.querySelector("[data-tone]");
    const moduleColor = getComputedStyle(toneEl).color;
    const font = getComputedStyle(toneEl).fontFamily;

    const key = (x, y) => `${x},${y}`;
    const inside = (x, y) => x >= 0 && y >= 0 && x < cols && y < rows;

    const placeTarget = () => {
      const taken = new Set(body.map((s) => key(s.x, s.y)));
      const free = [];
      for (let x = 0; x < cols; x++) for (let y = 0; y < rows; y++) if (!taken.has(key(x, y))) free.push([x, y]);
      const spot = free[Math.floor(Math.random() * free.length)];
      const type = runMode === "word" ? `letter:${WORD[collected]}` : PARTS[Math.floor(Math.random() * PARTS.length)];
      target = spot ? { x: spot[0], y: spot[1], type } : null;
    };

    const reset = () => {
      const x = Math.max(0, Math.floor(cols / 3));
      const y = Math.floor(rows / 2);
      runMode = Math.random() < 0.5 ? "word" : "parts";
      collected = 0;
      setMode(runMode);
      // Spelling runs start with the bare robot so the train reads cleanly as the word
      const length = runMode === "word" ? 1 : Math.min(START_LENGTH, x + 1);
      body = Array.from({ length }, (_, i) => ({ x: x - i, y, type: i ? "chassis" : "robot" }));
      dir = [1, 0];
      queuedDir = null;
      awaitingKey = true;
      placeTarget();
      setParts(0);
    };

    // Autopilot: shortest path to the part around its own modules (BFS); otherwise any safe step
    const autoStep = () => {
      const head = body[0];
      const blocked = new Set(body.slice(0, -1).map((s) => key(s.x, s.y)));
      const prev = new Map([[key(head.x, head.y), null]]);
      const queue = [[head.x, head.y]];
      let found = null;
      while (queue.length && target) {
        const [cx, cy] = queue.shift();
        if (cx === target.x && cy === target.y) {
          found = [cx, cy];
          break;
        }
        for (const [dx, dy] of DIRS) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (!inside(nx, ny) || blocked.has(key(nx, ny)) || prev.has(key(nx, ny))) continue;
          prev.set(key(nx, ny), [cx, cy]);
          queue.push([nx, ny]);
        }
      }
      if (found) {
        let cell = found;
        while (prev.get(key(...cell)) && key(...prev.get(key(...cell))) !== key(head.x, head.y)) cell = prev.get(key(...cell));
        return cell;
      }
      const safe = DIRS.map(([dx, dy]) => [head.x + dx, head.y + dy]).filter(([x, y]) => inside(x, y) && !blocked.has(key(x, y)));
      return safe.length ? safe[Math.floor(Math.random() * safe.length)] : null;
    };

    const advance = (t) => {
      if (cols < 3 || rows < 3) return;
      if (celebrateUntil) {
        if (t < celebrateUntil) return;
        celebrateUntil = 0;
        return reset();
      }
      const head = body[0];
      let next;
      if (playingRef.current) {
        if (awaitingKey) return;
        if (queuedDir) dir = queuedDir;
        queuedDir = null;
        next = [head.x + dir[0], head.y + dir[1]];
        const hitsBody = body.slice(0, -1).some((s) => s.x === next[0] && s.y === next[1]);
        if (!inside(...next) || hitsBody) {
          crashAt = t;
          return reset();
        }
      } else {
        next = autoStep();
        if (!next) return reset();
        dir = [next[0] - head.x, next[1] - head.y];
      }
      // Move every module into the slot ahead of it; the head takes the new cell
      const ate = target && next[0] === target.x && next[1] === target.y;
      const moved = body.map((s, i) => (i === 0 ? { ...s, x: next[0], y: next[1] } : { ...s, x: body[i - 1].x, y: body[i - 1].y }));
      if (ate && runMode === "word") {
        // Letters join at the tail, so reading back from the robot spells the word in order
        const tail = body[body.length - 1];
        body = [...moved, { x: tail.x, y: tail.y, type: target.type }];
        collected += 1;
        setParts(collected);
        if (collected >= WORD.length) {
          celebrateUntil = t + 1600;
          target = null;
          return;
        }
        placeTarget();
      } else if (ate) {
        // The new part snaps on right behind the robot; everything else shifts back one slot
        const tail = body[body.length - 1];
        moved.splice(1, 0, { x: head.x, y: head.y, type: target.type });
        for (let i = 2; i < moved.length; i++) {
          const src = i === moved.length - 1 ? tail : body[i - 1];
          moved[i] = { ...moved[i], x: src.x, y: src.y };
        }
        body = moved;
        collected += 1;
        setParts(collected);
        const max = playingRef.current ? PLAY_MAX_LENGTH : AUTO_MAX_LENGTH;
        if (body.length >= max) return reset();
        placeTarget();
      } else {
        body = moved;
      }
    };

    const draw = (t) => {
      const dpr = window.devicePixelRatio || 1;
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      if (target) {
        const tx = target.x * CELL + CELL / 2;
        const ty = target.y * CELL + CELL / 2;
        const pulse = reduceMotion ? 0 : Math.sin(t / 220) * 1.5;
        ctx.fillStyle = "rgba(255, 90, 31, 0.16)";
        ctx.beginPath();
        ctx.arc(tx, ty, 10 + pulse, 0, Math.PI * 2);
        ctx.fill();
        drawPart(ctx, target.type, tx, ty, SIGNAL, font);
      }
      for (let i = body.length - 1; i >= 1; i--) {
        const s = body[i];
        const isLetter = s.type.startsWith("letter:");
        // Letters stay fully legible; a finished name flashes orange
        ctx.globalAlpha = isLetter ? 1 : Math.max(0.35, 1 - i / (body.length + 4));
        const flash = celebrateUntil && Math.floor(t / 200) % 2 === 0;
        drawPart(ctx, s.type, s.x * CELL + CELL / 2, s.y * CELL + CELL / 2, flash ? SIGNAL : moduleColor, font);
      }
      ctx.globalAlpha = 1;
      if (body[0]) {
        const crashed = t - crashAt < 400;
        drawRobot(ctx, body[0].x * CELL + CELL / 2, body[0].y * CELL + CELL / 2, dir, t, !crashed && Math.sin(t / 900) > -0.97);
      }
    };

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = wrap;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const nextCols = Math.floor(w / CELL);
      const nextRows = Math.floor(h / CELL);
      if (nextCols !== cols || nextRows !== rows) {
        cols = nextCols;
        rows = nextRows;
        reset();
      }
      draw(performance.now());
    };

    const loop = (t) => {
      raf = requestAnimationFrame(loop);
      if (!visible) return;
      if (t - last >= (playingRef.current ? PLAY_STEP_MS : AUTO_STEP_MS)) {
        last = t;
        advance(t);
      }
      draw(t);
    };

    gameRef.current = {
      steer: (d) => {
        // No reversing straight into the module behind the robot
        if (d[0] === -dir[0] && d[1] === -dir[1] && body.length > 1) return;
        queuedDir = d;
        awaitingKey = false;
      },
      restart: reset,
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
    io.observe(wrap);
    if (!reduceMotion) raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  const setPlayMode = (on) => {
    playingRef.current = on;
    setPlaying(on);
    gameRef.current?.restart();
  };

  const onKeyDown = (e) => {
    if (!canPlay) return;
    if (e.key === "Escape") {
      setPlayMode(false);
      e.currentTarget.blur();
      return;
    }
    const d = ARROWS[e.key];
    if (!d) return;
    e.preventDefault();
    if (!playingRef.current) setPlayMode(true);
    gameRef.current?.steer(d);
  };

  const status = playing
    ? `${
        mode === "word" ? `Spelling: ${WORD.slice(0, parts)}${"_".repeat(WORD.length - parts)}` : `Parts collected: ${parts}`
      } · arrow keys to steer · Esc to exit`
    : canPlay
      ? onStatus
        ? "Click to drive the bot"
        : `${label} · click to drive the bot`
      : onStatus
        ? ""
        : label;

  useEffect(() => {
    onStatus?.(status);
  }, [onStatus, status]);

  return (
    <div
      ref={wrapRef}
      className={`nb-blueprint-sm relative flex flex-col items-center justify-end overflow-hidden ${
        canPlay ? "cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-signal/60" : ""
      } ${className}`}
      role="img"
      aria-label={canPlay ? `${label}. Mini game: click, then use the arrow keys to drive the robot.` : label}
      tabIndex={canPlay ? 0 : undefined}
      onClick={canPlay ? (e) => e.currentTarget.focus() : undefined}
      onFocus={canPlay ? () => !playingRef.current && setPlayMode(true) : undefined}
      onBlur={canPlay ? () => setPlayMode(false) : undefined}
      onKeyDown={onKeyDown}
    >
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />
      <span
        data-tone
        className={`relative mb-3 rounded px-2 py-1 font-mono text-[11px] uppercase tracking-[0.06em] text-ink-muted ${onStatus ? "hidden" : ""}`}
        style={{ backgroundColor: "inherit" }}
      >
        {!onStatus && status}
      </span>
    </div>
  );
}

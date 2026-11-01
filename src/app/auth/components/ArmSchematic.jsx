"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Blueprint of the NewtonBotics two-link arm running a pick-and-place loop.
 * Joint angles come from two-link inverse kinematics each frame. Decorative.
 */

const BASE = { x: 140, y: 250 };
const L1 = 170;
const L2 = 150;
// The work surface, and pads where the payload (14px block) rests flush on it.
const SURFACE_Y = 246;
const BLOCK_HALF = 7;
// Distance from the wrist joint down to the centre of a gripped block.
const GRIP_REACH = 26;
const PICK = { x: 300, y: SURFACE_Y - BLOCK_HALF };
const PLACE = { x: 430, y: SURFACE_Y - BLOCK_HALF };
const HOME = { x: 360, y: 130 };
const CYCLE_MS = 7000;

// Night palette — the auth pages use the dark theme
const line = "#3A3F47";
const ink = "#E9EAE6";
const muted = "#9AA0A8";
const signal = "#FF5A1F";
// Orange text uses the lighter shade to stay readable on the dark sheet.
const signalText = "#FF7A45";
const paper = "#16191E";

const smooth = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
const lerpPt = (a, b, t) => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) });

/** Waypoints for one pass; the block travels `from` → `to`. */
function pathFor(from, to) {
  // IK targets the wrist, so stop it a gripper-length above the block.
  const grab = (p) => ({ x: p.x, y: p.y - GRIP_REACH });
  const above = (p) => ({ x: p.x, y: p.y - GRIP_REACH - 46 });
  // [time fraction, target, grip closed?]
  return [
    [0.0, HOME, false],
    [0.18, above(from), false],
    [0.28, grab(from), false],
    [0.34, grab(from), true],
    [0.44, above(from), true],
    [0.62, above(to), true],
    [0.72, grab(to), true],
    [0.78, grab(to), false],
    [0.88, above(to), false],
    [1.0, HOME, false],
  ];
}

function sample(path, t) {
  for (let i = 0; i < path.length - 1; i += 1) {
    const [t0, p0] = path[i];
    const [t1, p1, grip1] = path[i + 1];
    if (t >= t0 && t <= t1) {
      const k = smooth((t - t0) / (t1 - t0 || 1));
      return {
        target: lerpPt(p0, p1, k),
        grip: path[i][2] && grip1 ? true : k > 0.5 ? grip1 : path[i][2],
      };
    }
  }
  const last = path[path.length - 1];
  return { target: last[1], grip: last[2] };
}

/** Elbow-up two-link IK in SVG coordinates (y grows downward). */
function solveIK(target) {
  const dx = target.x - BASE.x;
  const dy = target.y - BASE.y;
  const d = Math.min(
    Math.max(Math.hypot(dx, dy), Math.abs(L1 - L2) + 1),
    L1 + L2 - 1,
  );
  const cosQ2 = (d * d - L1 * L1 - L2 * L2) / (2 * L1 * L2);
  const q2abs = Math.acos(Math.max(-1, Math.min(1, cosQ2)));
  const toTarget = Math.atan2(dy, dx);
  const options = [q2abs, -q2abs].map((q2) => {
    const q1 = toTarget - Math.atan2(L2 * Math.sin(q2), L1 + L2 * Math.cos(q2));
    const elbow = {
      x: BASE.x + L1 * Math.cos(q1),
      y: BASE.y + L1 * Math.sin(q1),
    };
    return { q1, q2, elbow };
  });
  const best =
    options[0].elbow.y < options[1].elbow.y ? options[0] : options[1];
  const wrist = {
    x: best.elbow.x + L2 * Math.cos(best.q1 + best.q2),
    y: best.elbow.y + L2 * Math.sin(best.q1 + best.q2),
  };
  return { ...best, wrist };
}

function frameAt(elapsed) {
  const pass = Math.floor(elapsed / CYCLE_MS);
  const t = (elapsed % CYCLE_MS) / CYCLE_MS;
  const forward = pass % 2 === 0;
  const from = forward ? PICK : PLACE;
  const to = forward ? PLACE : PICK;
  const { target, grip } = sample(pathFor(from, to), t);
  const pose = solveIK(target);
  // The block rides with the gripper between pick-up and release.
  const carried = t >= 0.34 && t < 0.78;
  const block = carried
    ? { x: pose.wrist.x, y: pose.wrist.y + GRIP_REACH }
    : t < 0.34
      ? from
      : to;
  return { pose, grip, block, carried };
}

const deg = (r) => (r * 180) / Math.PI;

function Link({ from, angle, length }) {
  return (
    <g transform={`translate(${from.x} ${from.y}) rotate(${deg(angle)})`}>
      <path
        d={`M0 -7 H${length} M0 7 H${length}`}
        stroke={ink}
        strokeWidth="1.5"
      />
      <path
        d={`M0 0 H${length}`}
        stroke={muted}
        strokeWidth="0.75"
        strokeDasharray="10 4 2 4"
      />
    </g>
  );
}

export default function ArmSchematic({ className = "" }) {
  const [elapsed, setElapsed] = useState(CYCLE_MS * 0.3);
  const startRef = useRef(null);
  // Trig output can differ by a few ULPs between Node and the browser, so the
  // moving parts render only on the client to keep hydration exact.
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (reduce?.matches) return undefined;
    let raf;
    const tick = (now) => {
      if (startRef.current === null) startRef.current = now - CYCLE_MS * 0.3;
      setElapsed(now - startRef.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const { pose, grip, block } = frameAt(elapsed);
  const { q1, q2, elbow, wrist } = pose;
  const theta1 = -deg(q1);
  const theta2 = deg(Math.abs(q2));
  const fingerSpread = grip ? 9 : 16;

  return (
    <svg
      viewBox="0 0 560 360"
      fill="none"
      aria-hidden="true"
      className={className}
      style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}
    >
      {/* Sheet frame and title block */}
      <defs>
        <clipPath id="nb-arm-sheet">
          <rect x="8" y="8" width="544" height="304" />
        </clipPath>
      </defs>
      <rect x="8" y="8" width="544" height="344" stroke={line} fill={paper} />
      <path d="M8 312h544M372 312v40" stroke={line} />
      <text x="20" y="336" fill={muted} fontSize="11" letterSpacing="1.2">
        NB-ARM-02 · PICK &amp; PLACE
      </text>
      {mounted && (
        <text x="386" y="336" fill={muted} fontSize="11" letterSpacing="1">
          x{" "}
          {Math.round(wrist.x - BASE.x)
            .toString()
            .padStart(3, " ")}{" "}
          · y{" "}
          {Math.round(BASE.y - wrist.y)
            .toString()
            .padStart(3, " ")}
        </text>
      )}
      <path d="M40 40h16M48 32v16M504 40h16M512 32v16" stroke={line} />

      {mounted && (
        <>
          {/* Reach envelope */}
          <path
            d={`M${BASE.x - (L1 + L2)} ${BASE.y} A${L1 + L2} ${L1 + L2} 0 0 1 ${BASE.x + (L1 + L2)} ${BASE.y}`}
            stroke={line}
            strokeDasharray="4 6"
            clipPath="url(#nb-arm-sheet)"
          />

          {/* Work surface with pick/place pads */}
          <path d={`M232 ${SURFACE_Y}H520`} stroke={ink} strokeWidth="1.25" />
          {[PICK, PLACE].map((p, i) => (
            <g key={i}>
              <path
                d={`M${p.x - 20} ${SURFACE_Y}v6M${p.x + 20} ${SURFACE_Y}v6`}
                stroke={muted}
              />
              <text
                x={p.x}
                y={SURFACE_Y + 22}
                fill={muted}
                fontSize="10"
                letterSpacing="1"
                textAnchor="middle"
              >
                {i === 0 ? "PAD A" : "PAD B"}
              </text>
            </g>
          ))}

          {/* Base */}
          <rect
            x={BASE.x - 40}
            y={BASE.y + 12}
            width="80"
            height="20"
            rx="3"
            stroke={ink}
            strokeWidth="1.5"
          />
          <path
            d={`M${BASE.x - 48} ${BASE.y + 32}h96`}
            stroke={ink}
            strokeWidth="1.5"
          />
          <path
            d={Array.from(
              { length: 7 },
              (_, i) => `M${BASE.x - 42 + i * 14} ${BASE.y + 32}l-8 10`,
            ).join("")}
            stroke={line}
          />

          {/* Angle readouts */}
          <path d={`M${BASE.x} ${BASE.y}H${BASE.x + 64}`} stroke={line} />
          <path
            d={`M${BASE.x + 44} ${BASE.y} A44 44 0 0 0 ${BASE.x + 44 * Math.cos(q1)} ${BASE.y + 44 * Math.sin(q1)}`}
            stroke={signal}
          />
          <text x={BASE.x + 52} y={BASE.y - 14} fill={signalText} fontSize="12">
            θ₁ {theta1.toFixed(1)}°
          </text>
          <text x={elbow.x + 18} y={elbow.y - 22} fill={signalText} fontSize="12">
            θ₂ {theta2.toFixed(1)}°
          </text>

          {/* Links and joints */}
          <Link from={BASE} angle={q1} length={L1} />
          <Link from={elbow} angle={q1 + q2} length={L2} />
          <circle
            cx={BASE.x}
            cy={BASE.y}
            r="13"
            stroke={ink}
            strokeWidth="1.5"
            fill={paper}
          />
          <circle cx={BASE.x} cy={BASE.y} r="4" fill={ink} />
          <circle
            cx={elbow.x}
            cy={elbow.y}
            r="16"
            stroke={signal}
            strokeWidth="2"
            fill={paper}
          />
          <circle cx={elbow.x} cy={elbow.y} r="6" fill={signal} />
          <circle
            cx={wrist.x}
            cy={wrist.y}
            r="8"
            stroke={ink}
            strokeWidth="1.5"
            fill={paper}
          />

          {/* Gripper (always points down) */}
          <path
            d={`M${wrist.x} ${wrist.y + 8}v8M${wrist.x - fingerSpread} ${wrist.y + 16}h${fingerSpread * 2}M${wrist.x - fingerSpread} ${wrist.y + 16}v14M${wrist.x + fingerSpread} ${wrist.y + 16}v14`}
            stroke={ink}
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Payload */}
          <rect
            x={block.x - 7}
            y={block.y - 7}
            width="14"
            height="14"
            rx="2"
            fill={signal}
          />

          {/* Callouts that follow the joints */}
          <text
            x={BASE.x - 118}
            y={BASE.y - 20}
            fill={ink}
            fontSize="11"
            letterSpacing="1"
          >
            J1 · BASE
          </text>
          <path
            d={`M${BASE.x - 118} ${BASE.y - 12}H${BASE.x - 52}L${BASE.x - 12} ${BASE.y - 4}`}
            stroke={line}
          />
          <text
            x={elbow.x - 96}
            y={elbow.y - 40}
            fill={ink}
            fontSize="11"
            letterSpacing="1"
          >
            J2 · ELBOW
          </text>
          <path
            d={`M${elbow.x - 96} ${elbow.y - 32}H${elbow.x - 30}L${elbow.x - 12} ${elbow.y - 12}`}
            stroke={line}
          />
          <text
            x={BASE.x - 118}
            y={BASE.y - 44}
            fill={grip ? signalText : muted}
            fontSize="10"
            letterSpacing="1.2"
          >
            GRIP {grip ? "CLOSED" : "OPEN"}
          </text>
        </>
      )}
    </svg>
  );
}

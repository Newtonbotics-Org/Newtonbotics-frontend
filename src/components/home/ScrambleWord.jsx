"use client";
import { useEffect, useState } from "react";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ01#%&*";

/**
 * Cycles through `words`, "decoding" each new one: letters scramble and lock in left to right.
 * Screen readers get nothing from this element; give them the full sentence separately.
 */
export default function ScrambleWord({ words, hold = 2200, className = "" }) {
  const [text, setText] = useState(words[0]);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let index = 0;
    let frame = 0;
    let timer = 0;

    const decode = (target) => {
      const start = performance.now();
      const step = () => {
        const progress = (performance.now() - start) / 600;
        const locked = Math.floor(progress * target.length);
        setText(
          [...target]
            .map((ch, i) => (i < locked || ch === "." ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
            .join(""),
        );
        if (locked < target.length) frame = requestAnimationFrame(step);
        else timer = setTimeout(next, hold);
      };
      step();
    };
    const next = () => {
      index = (index + 1) % words.length;
      if (reduceMotion) {
        setText(words[index]);
        timer = setTimeout(next, hold);
      } else {
        decode(words[index]);
      }
    };

    timer = setTimeout(next, hold);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [words, hold]);

  return (
    <span aria-hidden="true" className={className}>
      {text}
    </span>
  );
}

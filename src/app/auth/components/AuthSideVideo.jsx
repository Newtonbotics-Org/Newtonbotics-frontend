"use client";

import { motion } from "framer-motion";

export const FORGOT_PASSWORD_VIDEO = "/forgetpasswords01.mp4";

export default function AuthSideVideo({ src = "/authentication.mp4" }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="hidden lg:block w-full max-w-xs xl:max-w-sm shrink-0 overflow-hidden rounded-3xl border border-white/15 bg-black/30"
    >
      <video
        src={src}
        autoPlay
        muted
        loop
        playsInline
        className="block w-full h-auto opacity-90"
      />
    </motion.div>
  );
}

'use client';

import { motion, type Variants } from 'framer-motion';

export type AuraState = 'idle' | 'listening' | 'speaking' | 'thinking' | 'typing';

interface AuraDoodleProps {
  state: AuraState;
}

const containerVariants: Variants = {
  idle: { scale: 1, rotate: 0, y: 0 },
  listening: { scale: 1.02, rotate: -6, y: -6 },
  speaking: { scale: 1.05, rotate: 4, y: -8 },
  thinking: { scale: 1.04, rotate: 0, y: -12 },
  typing: { scale: 1.06, rotate: 6, y: -10 },
};

const outerGlowVariants: Variants = {
  idle: {
    opacity: [0.35, 0.55, 0.35],
    scale: [1, 1.05, 1],
    transition: { duration: 4.8, repeat: Infinity, ease: 'easeInOut' },
  },
  listening: {
    opacity: [0.45, 0.85, 0.45],
    scale: [1.05, 1.15, 1.05],
    transition: { duration: 2.6, repeat: Infinity, ease: 'easeInOut' },
  },
  speaking: {
    opacity: [0.6, 0.95, 0.6],
    scale: [1.08, 1.2, 1.08],
    transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' },
  },
  thinking: {
    opacity: [0.42, 0.78, 0.42],
    scale: [1.04, 1.12, 1.04],
    transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
  },
  typing: {
    opacity: [0.52, 0.88, 0.52],
    scale: [1.06, 1.18, 1.06],
    transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' },
  },
};

const innerCoreVariants: Variants = {
  idle: { scale: [0.98, 1.02, 0.98], transition: { duration: 3.4, repeat: Infinity } },
  listening: { scale: [0.96, 1.05, 0.96], transition: { duration: 2.3, repeat: Infinity } },
  speaking: { scale: [0.94, 1.08, 0.94], transition: { duration: 1.5, repeat: Infinity } },
  thinking: { scale: [0.95, 1.04, 0.95], transition: { duration: 2.6, repeat: Infinity } },
  typing: { scale: [0.92, 1.07, 0.92], transition: { duration: 1.7, repeat: Infinity } },
};

const haloVariants: Variants = {
  idle: { rotate: 0, transition: { duration: 18, repeat: Infinity, ease: 'linear' } },
  listening: { rotate: 360, transition: { duration: 14, repeat: Infinity, ease: 'linear' } },
  speaking: { rotate: 360, transition: { duration: 11, repeat: Infinity, ease: 'linear' } },
  thinking: { rotate: -360, transition: { duration: 13, repeat: Infinity, ease: 'linear' } },
  typing: { rotate: 360, transition: { duration: 12, repeat: Infinity, ease: 'linear' } },
};

const ringPulseVariants: Variants = {
  idle: { opacity: [0.25, 0.5, 0.25], transition: { duration: 3.4, repeat: Infinity } },
  listening: { opacity: [0.3, 0.7, 0.3], transition: { duration: 2.4, repeat: Infinity } },
  speaking: { opacity: [0.4, 0.9, 0.4], transition: { duration: 1.6, repeat: Infinity } },
  thinking: { opacity: [0.28, 0.64, 0.28], transition: { duration: 2.8, repeat: Infinity } },
  typing: { opacity: [0.32, 0.75, 0.32], transition: { duration: 2, repeat: Infinity } },
};

const particleVariants: Variants = {
  idle: {
    y: [0, -18],
    opacity: [0, 0.5, 0],
    transition: { duration: 4, repeat: Infinity, ease: 'easeOut' },
  },
  listening: {
    y: [0, -22],
    opacity: [0, 0.65, 0],
    transition: { duration: 3.1, repeat: Infinity, ease: 'easeOut' },
  },
  speaking: {
    y: [0, -26],
    opacity: [0, 0.85, 0],
    transition: { duration: 2.2, repeat: Infinity, ease: 'easeOut' },
  },
  thinking: {
    y: [0, -24],
    opacity: [0, 0.7, 0],
    transition: { duration: 2.8, repeat: Infinity, ease: 'easeOut' },
  },
  typing: {
    y: [0, -24],
    opacity: [0, 0.75, 0],
    transition: { duration: 2.4, repeat: Infinity, ease: 'easeOut' },
  },
};

const colorPalette: Record<AuraState, { glow: string; core: string; spark: string }> = {
  idle: { glow: '#6d77ff', core: 'from-indigo-300 via-sky-300 to-cyan-200', spark: '#a8c4ff' },
  listening: { glow: '#36f1e2', core: 'from-sky-300 via-cyan-200 to-emerald-200', spark: '#b2fdf9' },
  speaking: { glow: '#ff8b5e', core: 'from-amber-200 via-orange-300 to-rose-300', spark: '#ffd2a1' },
  thinking: { glow: '#b794ff', core: 'from-violet-300 via-indigo-300 to-slate-200', spark: '#d5caff' },
  typing: { glow: '#2dd4bf', core: 'from-teal-300 via-emerald-200 to-cyan-200', spark: '#9fffe7' },
};

export default function AuraDoodle({ state }: AuraDoodleProps) {
  const palette = colorPalette[state];

  return (
    <motion.div className="relative h-48 w-48" variants={containerVariants} animate={state}>
      <motion.div
        className="absolute inset-0 rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, ${palette.glow}50 0%, transparent 65%)` }}
        variants={outerGlowVariants}
        animate={state}
      />

      <motion.div className="absolute inset-1 rounded-full border border-white/10" variants={ringPulseVariants} animate={state} />

      <motion.div
        className="absolute inset-4 rounded-full border border-white/15"
        style={{ boxShadow: `0 18px 48px ${palette.glow}38` }}
        variants={haloVariants}
        animate={state}
      />

      <motion.div
        className={`absolute inset-6 rounded-full bg-linear-to-br ${palette.core} shadow-[0_20px_50px_rgba(10,16,40,0.5)]`}
        variants={innerCoreVariants}
        animate={state}
      >
        <motion.div
          className="absolute inset-6 rounded-full bg-slate-950/85 backdrop-blur-xl border border-white/10"
          variants={innerCoreVariants}
          animate={state}
        />
        <motion.div
          className="absolute inset-x-8 top-10 h-1 rounded-full bg-white/25"
          variants={ringPulseVariants}
          animate={state}
        />
      </motion.div>

      <motion.div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="h-16 w-16 rounded-full border border-white/15 bg-white/5"
          animate={{ scale: state === 'speaking' ? [1, 1.08, 1] : 1 }}
          transition={{ duration: state === 'speaking' ? 1.4 : 0.8, repeat: state === 'speaking' ? Infinity : 0 }}
        >
          <motion.div
            className="absolute inset-3 rounded-full bg-slate-950/90"
            animate={{ scale: state === 'typing' ? [1, 1.1, 1] : 1 }}
            transition={{ duration: state === 'typing' ? 1.2 : 0.7, repeat: state === 'typing' ? Infinity : 0 }}
          />
          <motion.div
            className="absolute inset-x-5 bottom-6 h-1 rounded-full bg-white/40"
            animate={{ opacity: state === 'listening' ? [0.4, 0.9, 0.4] : 0.6 }}
            transition={{ duration: state === 'listening' ? 1.8 : 0.9, repeat: state === 'listening' ? Infinity : 0 }}
          />
        </motion.div>
      </motion.div>

      <motion.div className="absolute inset-0" variants={particleVariants} animate={state}>
        {[0, 1, 2, 3].map((index) => (
          <motion.span
            key={index}
            className="absolute h-1.5 w-1.5 rounded-full"
            style={{
              background: palette.spark,
              left: `${22 + index * 18}%`,
              bottom: '20%',
            }}
            variants={particleVariants}
            animate={state}
            transition={{ delay: index * 0.15 }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}

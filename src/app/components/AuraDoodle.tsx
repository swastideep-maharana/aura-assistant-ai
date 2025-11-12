'use client';

import { useMemo } from 'react';
import { motion, type Variants } from 'framer-motion';

export type AuraState = 'idle' | 'listening' | 'speaking' | 'thinking' | 'typing';

export type AuraAccessory = 'basketball' | 'clipboard' | 'datapad' | 'none';

interface AuraDoodleProps {
  state: AuraState;
  accessory?: AuraAccessory;
  showTrail?: boolean;
}

const containerVariants: Variants = {
  idle: { scale: 1, rotate: 0, y: 0 },
  listening: { scale: 1.04, rotate: -4, y: -6 },
  speaking: { scale: 1.06, rotate: 3, y: -6 },
  thinking: { scale: 1.05, rotate: 0, y: -10 },
  typing: { scale: 1.08, rotate: 6, y: -12 },
};

const hoverVariants: Variants = {
  idle: { scale: [1, 1.03, 1], opacity: [0.45, 0.6, 0.45], transition: { duration: 4, repeat: Infinity } },
  listening: { scale: [1.05, 1.12, 1.05], opacity: [0.55, 0.85, 0.55], transition: { duration: 2.6, repeat: Infinity } },
  speaking: { scale: [1.07, 1.15, 1.07], opacity: [0.6, 0.95, 0.6], transition: { duration: 1.6, repeat: Infinity } },
  thinking: { scale: [1.04, 1.1, 1.04], opacity: [0.4, 0.75, 0.4], transition: { duration: 2.8, repeat: Infinity } },
  typing: { scale: [1.08, 1.16, 1.08], opacity: [0.55, 0.85, 0.55], transition: { duration: 1.8, repeat: Infinity } },
};

const bounceVariants: Variants = {
  idle: { y: [0, -4, 0], transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' } },
  listening: { y: [0, -10, 0], transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' } },
  speaking: { y: [0, -12, 0], transition: { duration: 1.4, repeat: Infinity, ease: 'easeInOut' } },
  thinking: { y: [0, -8, 0], transition: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } },
  typing: { y: [0, -14, 0], transition: { duration: 1.1, repeat: Infinity, ease: 'easeInOut' } },
};

const headTiltVariants: Variants = {
  idle: { rotate: 0 },
  listening: { rotate: -8 },
  speaking: { rotate: 8 },
  thinking: { rotate: [-5, 5, -5], transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } },
  typing: { rotate: 12 },
};

const eyeVariants: Variants = {
  idle: {
    scaleY: [1, 0.6, 1],
    transition: { duration: 4, repeat: Infinity, repeatDelay: 3 },
  },
  listening: {
    scaleY: [1, 0.5, 1],
    transition: { duration: 2.8, repeat: Infinity, repeatDelay: 2 },
  },
  speaking: {
    scaleY: [1, 0.4, 1],
    transition: { duration: 1.8, repeat: Infinity, repeatDelay: 1.1 },
  },
  thinking: {
    y: [0, 2, 0],
    scaleX: [1, 0.85, 1],
    transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' },
  },
  typing: { y: 3, scaleY: 0.8 },
};

const antennaVariants: Variants = {
  idle: { y: [0, -1, 0], transition: { duration: 2.6, repeat: Infinity } },
  listening: { y: [-4, 4, -4], transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } },
  speaking: { y: [-6, 6, -6], transition: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } },
  thinking: { y: [-3, 3, -3], transition: { duration: 2.1, repeat: Infinity, ease: 'easeInOut' } },
  typing: { y: [-5, 5, -5], transition: { duration: 1.4, repeat: Infinity, ease: 'easeInOut' } },
};

const earVariants: Variants = {
  idle: { rotate: 0 },
  listening: { rotate: -10 },
  speaking: { rotate: [0, 12, 0], transition: { duration: 1.4, repeat: Infinity } },
  thinking: { rotate: [-8, 8, -8], transition: { duration: 1.8, repeat: Infinity } },
  typing: { rotate: 10 },
};

const limbSwingVariants: Variants = {
  idle: { rotate: [6, -6, 6], transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' } },
  listening: { rotate: [-10, 6, -10], transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' } },
  speaking: { rotate: [-16, 16, -16], transition: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } },
  thinking: { rotate: [-8, 8, -8], transition: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } },
  typing: { rotate: [-18, 18, -18], transition: { duration: 1, repeat: Infinity, ease: 'easeInOut' } },
};

const treadVariants: Variants = {
  idle: { x: 0 },
  listening: { x: [0, 4, 0], transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } },
  speaking: { x: [0, 6, 0], transition: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } },
  thinking: { x: [0, 3, 0], transition: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' } },
  typing: { x: [0, 5, 0], transition: { duration: 1.4, repeat: Infinity, ease: 'easeInOut' } },
};

const trailVariants: Variants = {
  idle: { opacity: 0 },
  listening: {
    opacity: 0.35,
    y: [0, -10],
    transition: { duration: 2.8, repeat: Infinity, ease: 'easeOut' },
  },
  speaking: {
    opacity: 0.55,
    y: [0, -14],
    transition: { duration: 1.6, repeat: Infinity, ease: 'easeOut' },
  },
  thinking: {
    opacity: 0.45,
    y: [0, -12],
    transition: { duration: 2.2, repeat: Infinity, ease: 'easeOut' },
  },
  typing: {
    opacity: 0.5,
    y: [0, -16],
    transition: { duration: 1.8, repeat: Infinity, ease: 'easeOut' },
  },
};

const accessoryOffsets: Record<AuraAccessory, { x: number; y: number }> = {
  basketball: { x: 190, y: 164 },
  clipboard: { x: 184, y: 158 },
  datapad: { x: 188, y: 158 },
  none: { x: 0, y: 0 },
};

export default function AuraDoodle({ state, accessory = 'none', showTrail = false }: AuraDoodleProps) {
  const accessoryElement = useMemo(() => {
    switch (accessory) {
      case 'basketball':
        return (
          <g>
            <circle cx="0" cy="0" r="14" fill="#FF7B3A" stroke="#FDB56C" strokeWidth="2" />
            <path d="M-14 0 H14" stroke="#D34A2F" strokeWidth="2" />
            <path d="M0 -14 V14" stroke="#D34A2F" strokeWidth="2" />
            <path d="M-10 -10 C0 0 0 0 10 10" stroke="#EA6136" strokeWidth="1.6" fill="none" />
            <path d="M10 -10 C0 0 0 0 -10 10" stroke="#EA6136" strokeWidth="1.6" fill="none" />
          </g>
        );
      case 'clipboard':
        return (
          <g>
            <rect x="-12" y="-18" width="24" height="32" rx="4" fill="#FFE5B3" stroke="#FFAF4C" strokeWidth="2" />
            <rect x="-8" y="-16" width="16" height="4" rx="2" fill="#FF8A4A" />
            <rect x="-10" y="-6" width="20" height="2" rx="1" fill="#FF9F68" opacity="0.7" />
            <rect x="-10" y="0" width="20" height="2" rx="1" fill="#FF9F68" opacity="0.55" />
            <rect x="-10" y="6" width="20" height="2" rx="1" fill="#5AC8FA" opacity="0.7" />
          </g>
        );
      case 'datapad':
        return (
          <g>
            <rect x="-14" y="-20" width="28" height="32" rx="6" fill="#16203C" stroke="#5AC8FA" strokeWidth="2" />
            <rect x="-10" y="-16" width="20" height="8" rx="3" fill="#5AC8FA" opacity="0.6" />
            <rect x="-10" y="-4" width="20" height="4" rx="2" fill="#FF9F68" opacity="0.8" />
            <rect x="-10" y="4" width="20" height="4" rx="2" fill="#FFD966" opacity="0.8" />
            <circle cx="8" cy="-14" r="3" fill="#FF6B6B" />
          </g>
        );
      default:
        return null;
    }
  }, [accessory]);

  const accessoryPosition = accessoryOffsets[accessory];

  return (
    <motion.div className="relative h-56 w-56" variants={containerVariants} animate={state}>
      <motion.div
        className="absolute inset-0 rounded-[40px] bg-linear-to-br from-sky-400/25 via-indigo-500/18 to-orange-400/20 blur-3xl"
        variants={hoverVariants}
        animate={state}
      />
      <motion.svg
        viewBox="0 0 220 220"
        className="relative overflow-visible"
        variants={bounceVariants}
        animate={state}
      >
        <defs>
          <linearGradient id="robot-body" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFB347" />
            <stop offset="50%" stopColor="#FF6B6B" />
            <stop offset="100%" stopColor="#FFB347" />
          </linearGradient>
          <linearGradient id="robot-shadow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(0,0,0,0.4)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.1)" />
          </linearGradient>
          <linearGradient id="robot-limb" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5AC8FA" />
            <stop offset="100%" stopColor="#007AFF" />
          </linearGradient>
          <linearGradient id="robot-eye" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9AF2FF" />
            <stop offset="100%" stopColor="#31C6FF" />
          </linearGradient>
        </defs>

        <motion.ellipse
          cx="110"
          cy="198"
          rx="58"
          ry="16"
          fill="url(#robot-shadow)"
          opacity={0.35}
          animate={{ scaleX: state === 'typing' ? 1.1 : 1 }}
          transition={{ duration: 0.6 }}
        />

        <motion.g variants={limbSwingVariants} animate={state} transformOrigin="38 124">
          <motion.rect x="26" y="118" width="24" height="56" rx="12" fill="url(#robot-limb)" />
          <motion.circle cx="38" cy="176" r="12" fill="#1F2C4C" />
          <motion.rect
            x="22"
            y="168"
            width="32"
            height="12"
            rx="6"
            fill="#FF6B6B"
            animate={{ y: state === 'typing' ? [168, 162, 168] : 168 }}
            transition={{ duration: 1, repeat: state === 'typing' ? Infinity : 0, ease: 'easeInOut' }}
          />
        </motion.g>

        <motion.g variants={limbSwingVariants} animate={state} transformOrigin="182 124">
          <motion.rect x="170" y="118" width="24" height="56" rx="12" fill="url(#robot-limb)" />
          <motion.circle cx="182" cy="176" r="12" fill="#1F2C4C" />
          <motion.path
            d="M170 170h28c8 0 12 5 12 10s-4 10-12 10h-34c-8 0-12-5-12-10s4-10 12-10z"
            fill="#FF9F68"
            opacity={0.85}
            transform="translate(-6 -2)"
            animate={{ rotate: state === 'speaking' ? [0, 6, -6, 0] : 0 }}
            transform-origin="182 182"
            transition={{ duration: 1.1, repeat: state === 'speaking' ? Infinity : 0, ease: 'easeInOut' }}
          />
          {accessory !== 'none' && (
            <motion.g
              transform={`translate(${accessoryPosition.x} ${accessoryPosition.y})`}
              animate={{
                rotate: state === 'speaking' ? [0, 4, -4, 0] : 0,
              }}
              transition={{ duration: 1.4, repeat: state === 'speaking' ? Infinity : 0, ease: 'easeInOut' }}
            >
              {accessoryElement}
            </motion.g>
          )}
        </motion.g>

        <motion.g variants={limbSwingVariants} animate={state} transformOrigin="70 182">
          <motion.rect x="60" y="152" width="20" height="42" rx="12" fill="#323555" />
          <motion.rect x="52" y="190" width="36" height="12" rx="6" fill="#FF6B6B" />
          <motion.circle cx="70" cy="200" r="11" fill="#121528" />
        </motion.g>

        <motion.g variants={limbSwingVariants} animate={state} transformOrigin="150 182">
          <motion.rect x="140" y="152" width="20" height="42" rx="12" fill="#323555" />
          <motion.rect x="132" y="190" width="36" height="12" rx="6" fill="#FF6B6B" />
          <motion.circle cx="150" cy="200" r="11" fill="#121528" />
        </motion.g>

        <motion.g>
          <motion.rect
            x="58"
            y="102"
            width="104"
            height="66"
            rx="20"
            fill="url(#robot-body)"
            stroke="#FFE1A8"
            strokeWidth="3"
            animate={{ y: state === 'typing' ? -4 : 0 }}
            transition={{ duration: 0.4 }}
          />

          <motion.rect x="82" y="112" width="60" height="44" rx="12" fill="#11132E" stroke="#FFECD2" strokeWidth="2" />
          <motion.rect x="78" y="120" width="68" height="12" rx="6" fill="#FFEDD2" opacity="0.4" />
          <motion.rect x="74" y="140" width="76" height="12" rx="6" fill="#FF9F68" opacity="0.35" />

          {[0, 1, 2].map((idx) => (
            <motion.circle
              key={idx}
              cx={96 + idx * 20}
              cy={156}
              r="6"
              fill={idx % 2 === 0 ? '#5AC8FA' : '#FF6B6B'}
              animate={{ opacity: state === 'speaking' ? [0.4, 1, 0.4] : 0.7 }}
              transition={{ duration: 0.8, repeat: state === 'speaking' ? Infinity : 0 }}
            />
          ))}
        </motion.g>

        <motion.g variants={headTiltVariants} animate={state} transformOrigin="110 96">
          <motion.rect
            x="64"
            y="44"
            width="92"
            height="64"
            rx="20"
            fill="#FFD47E"
            stroke="#FFE7B3"
            strokeWidth="3"
          />
          <motion.rect x="74" y="52" width="72" height="40" rx="14" fill="#11132E" stroke="#FFD6A4" strokeWidth="2" />
          <motion.rect x="80" y="56" width="60" height="32" rx="12" fill="#1A1540" />
          <motion.g variants={eyeVariants} animate={state}>
            <motion.circle cx="96" cy="70" r="12" fill="url(#robot-eye)" />
            <motion.circle cx="130" cy="70" r="12" fill="url(#robot-eye)" />
            <motion.circle cx="96" cy="70" r="8" fill="#0B1227" />
            <motion.circle cx="130" cy="70" r="8" fill="#0B1227" />
          </motion.g>
          <motion.path
            d="M96 86 Q110 98 124 86"
            stroke="#FFECD2"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
            animate={{
              d:
                state === 'speaking'
                  ? ['M96 86 Q110 104 124 86', 'M96 84 Q110 94 124 84', 'M96 90 Q110 108 124 90']
                  : 'M96 86 Q110 98 124 86',
            }}
            transition={{ duration: 1.2, repeat: state === 'speaking' ? Infinity : 0, ease: 'easeInOut' }}
          />
          <motion.path
            d="M94 60 h-16 c-5 0-9-4-9-9"
            stroke="#FF845E"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
            variants={earVariants}
            animate={state}
            transformOrigin="73 52"
          />
          <motion.path
            d="M126 60 h18 c5 0 9-4 9-9"
            stroke="#5AC8FA"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
            variants={earVariants}
            animate={state}
            transformOrigin="144 52"
          />
          <motion.g variants={antennaVariants} animate={state} transform="translate(104 26)">
            <motion.rect x="0" y="0" width="12" height="20" rx="6" fill="#FF6B6B" />
            <motion.circle cx="6" cy="-6" r="6" fill="#5AC8FA" stroke="#fff" strokeWidth="2" />
            <motion.circle cx="-6" cy="4" r="4" fill="#FFD966" stroke="#fff" strokeWidth="1" />
            <motion.circle cx="18" cy="4" r="4" fill="#FFD966" stroke="#fff" strokeWidth="1" />
          </motion.g>
        </motion.g>

        <motion.g variants={treadVariants} animate={state}>
          <motion.rect x="82" y="174" width="56" height="10" rx="5" fill="#2B2F4A" />
          <motion.rect x="86" y="176" width="48" height="6" rx="3" fill="#5AC8FA" opacity="0.35" />
        </motion.g>

        {showTrail && (
          <g transform="translate(110 60)">
            {[0, 1, 2].map((index) => (
              <motion.circle
                key={index}
                cx={-36 + index * 36}
                cy={24}
                r={3}
                fill={index % 2 === 0 ? '#5AC8FA' : '#FF9F68'}
                variants={trailVariants}
                animate={state}
                initial="idle"
                transition={{ delay: index * 0.2 }}
              />
            ))}
          </g>
        )}
      </motion.svg>
    </motion.div>
  );
}
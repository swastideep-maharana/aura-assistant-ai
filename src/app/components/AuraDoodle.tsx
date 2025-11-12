'use client';

// Import the 'Easing' type
import { motion, type Variants, type Easing } from 'framer-motion';

// Define the animation states
export type AuraState = 'idle' | 'listening' | 'speaking' | 'thinking' | 'typing';

interface AuraDoodleProps {
  state: AuraState;
}

// --- Animation Variants (Scaled Up) ---

// Main container: handles leaning in
const containerVariants: Variants = {
  idle: { scale: 1, x: 0, y: 0 },
  listening: { scale: 1.05, y: -10 },
  speaking: { scale: 1, y: 0 },
  thinking: { scale: 1, y: 0 },
  typing: {
    scale: 1.1,
    y: -20,
    x: 40, // Moves toward the input
    transition: { type: 'spring', stiffness: 300, damping: 20 },
  },
};

// Head: handles tilting
const headVariants: Variants = {
  idle: { rotate: 0 },
  listening: { rotate: -10, transition: { type: 'spring', stiffness: 500 } },
  speaking: { rotate: 0 },
  thinking: {
    rotate: [0, 10, -10, 0],
    transition: { repeat: Infinity, duration: 1.5, ease: 'easeInOut' as Easing },
  },
  typing: {
    rotate: 15, // Tilts head to "look"
    transition: { type: 'spring', stiffness: 300, damping: 20 },
  },
};

// Eyes: handles blinking and looking
const eyeVariants: Variants = {
  idle: {
    scaleY: [1, 0.1, 1], // Blink
    transition: { duration: 0.3, repeat: Infinity, repeatDelay: 5 },
  },
  listening: { scaleY: 1, scaleX: 1.1 }, // Widen
  speaking: { scaleY: 1 },
  thinking: { scaleX: 0.8, scaleY: 0.8 }, // Squint
  typing: {
    scaleY: 0.9,
    y: 2, // Look down slightly
    transition: { duration: 0.3 },
  },
};

// Mouth: handles speaking
const mouthVariants: Variants = {
  idle: { scaleY: 0.2, y: 0 },
  listening: { scaleY: 0.2, y: 0 },
  speaking: {
    scaleY: [0.8, 1.2, 0.7, 1], // Talking animation
    y: [0, -2, 0, 2, 0],
    transition: { repeat: Infinity, duration: 0.3, ease: 'easeInOut' as Easing },
  },
  thinking: { scaleY: 0.2, y: 0 },
  typing: { scaleY: 0.2, y: 0 },
};

// Chest EQ bars
const eqBarVariants = (delay: number): Variants => ({
  speaking: {
    scaleY: [1, 1.8, 1.2, 2, 1],
    transition: {
      delay,
      duration: 0.5,
      repeat: Infinity,
      ease: 'circOut' as Easing,
    },
  },
  idle: { scaleY: 1 },
  listening: { scaleY: [1, 1.5, 1], transition: { duration: 0.8, repeat: Infinity } },
  thinking: { scaleY: [1, 1.2, 1], transition: { duration: 1, repeat: Infinity } },
  typing: { scaleY: [1, 1.1, 1], transition: { duration: 0.5, repeat: Infinity } },
});

// --- The Component (Light Theme) ---
export default function AuraDoodle({ state }: AuraDoodleProps) {
  return (
    // Main container for position and "leaning"
    <motion.div
      className="relative w-48 h-48" // Container size (doubled)
      variants={containerVariants}
      animate={state}
    >
      {/* Body */}
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-gray-300 border-2 border-gray-400/50 rounded-t-3xl rounded-b-lg shadow-lg">
        {/* Chest Screen (like your doodle) */}
        <div className="absolute inset-x-4 top-6 h-16 bg-white rounded-md flex items-center justify-center space-x-2 p-2 border-2 border-gray-200">
          <motion.div className="w-3 h-full bg-indigo-500 rounded" variants={eqBarVariants(0)} animate={state} />
          <motion.div className="w-3 h-full bg-indigo-500 rounded" variants={eqBarVariants(0.2)} animate={state} />
          <motion.div className="w-3 h-full bg-indigo-500 rounded" variants={eqBarVariants(0.1)} animate={state} />
          <motion.div className="w-3 h-full bg-indigo-500 rounded" variants={eqBarVariants(0.3)} animate={state} />
        </div>
      </div>

      {/* Head */}
      <motion.div
        className="absolute -top-20 left-10 w-32 h-32 bg-gray-300 rounded-full border-2 border-gray-400/50 shadow-xl"
        variants={headVariants}
        style={{ transformOrigin: 'bottom center' }}
        animate={state}
      >
        {/* Face Screen */}
        <div className="absolute inset-3 bg-gray-800 rounded-full flex flex-col items-center justify-center gap-3 p-4">
          {/* Eyes */}
          <div className="flex w-full justify-center gap-5">
            <motion.div
              className="w-6 h-6 bg-indigo-400 rounded-full"
              variants={eyeVariants}
              animate={state}
            />
            <motion.div
              className="w-6 h-6 bg-indigo-400 rounded-full"
              variants={eyeVariants}
              animate={state}
            />
          </div>
          {/* Mouth */}
          <motion.div
            className="w-12 h-3 bg-indigo-400 rounded-full"
            variants={mouthVariants}
            style={{ transformOrigin: 'center' }}
            animate={state}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
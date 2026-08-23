'use client';

import { motion, useReducedMotion } from 'motion/react';
import { MOTION_PRESET } from '@/lib/motion-config';

type RevealVariant = 'content' | 'heading' | 'card';

const refinedVariants = {
    content: {
        initial: { opacity: 0, y: 18 },
        visible: { opacity: 1, y: 0 },
    },
    heading: {
        initial: { opacity: 0, y: 22, clipPath: 'inset(0 0 22% 0)' },
        visible: { opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)' },
    },
    card: {
        initial: { opacity: 0, y: 14, scale: 0.988 },
        visible: { opacity: 1, y: 0, scale: 1 },
    },
} as const;

export function Reveal({
    children,
    className = '',
    delay = 0,
    variant = 'content',
}: {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    variant?: RevealVariant;
}) {
    const reduceMotion = useReducedMotion();
    const selected =
        MOTION_PRESET === 'legacy'
            ? { initial: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0 } }
            : refinedVariants[variant];

    return (
        <motion.div
            className={className}
            initial={reduceMotion ? false : selected.initial}
            whileInView={reduceMotion ? undefined : selected.visible}
            viewport={{ once: true, amount: variant === 'heading' ? 0.45 : 0.22 }}
            transition={{ duration: variant === 'heading' ? 0.78 : 0.62, delay, ease: [0.22, 1, 0.36, 1] }}
        >
            {children}
        </motion.div>
    );
}

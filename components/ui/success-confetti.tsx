import type { CSSProperties } from 'react';

const pieces = [
    [-172, -96, 410, 0, '#2468f0'],
    [-140, -142, -330, 35, '#00c896'],
    [-106, -78, 280, 90, '#78a3ff'],
    [-72, -156, -420, 20, '#f5b544'],
    [-38, -112, 360, 120, '#2468f0'],
    [-12, -168, -260, 60, '#00c896'],
    [24, -136, 390, 110, '#78a3ff'],
    [58, -174, -370, 10, '#f5b544'],
    [92, -104, 320, 80, '#2468f0'],
    [126, -152, -400, 130, '#00c896'],
    [164, -88, 350, 45, '#78a3ff'],
    [-154, -34, -300, 125, '#f5b544'],
    [-92, -42, 380, 55, '#2468f0'],
    [-48, -56, -340, 145, '#00c896'],
    [42, -48, 420, 70, '#78a3ff'],
    [86, -36, -280, 155, '#f5b544'],
    [146, -50, 360, 100, '#2468f0'],
] as const;

type ConfettiStyle = CSSProperties & {
    '--confetti-x': string;
    '--confetti-y': string;
    '--confetti-rotate': string;
    '--confetti-delay': string;
    '--confetti-color': string;
};

export function SuccessConfetti() {
    return (
        <span className="success-confetti" aria-hidden="true">
            {pieces.map(([x, y, rotate, delay, color], index) => (
                <i
                    key={`${x}-${y}-${index}`}
                    style={
                        {
                            '--confetti-x': `${x}px`,
                            '--confetti-y': `${y}px`,
                            '--confetti-rotate': `${rotate}deg`,
                            '--confetti-delay': `${delay}ms`,
                            '--confetti-color': color,
                        } as ConfettiStyle
                    }
                />
            ))}
        </span>
    );
}

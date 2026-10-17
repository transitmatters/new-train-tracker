import { CSSProperties, useEffect, useRef, useState } from 'react';

import './FlapBoard.css';

// Time between flaps on one tile (the CSS animation takes half of it to fall, half to land), and
// the stagger between neighbouring tiles.
const FLAP_MS = 90;
const STAGGER_MS = 45;
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

type TileFace = { prev: string; curr: string; flips: number };

const prefersReducedMotion = () =>
    typeof window !== 'undefined' &&
    !!window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const randomLetters = (count: number) =>
    Array.from({ length: count }, () => LETTERS[Math.floor(Math.random() * LETTERS.length)]);

const Half: React.FC<{ char: string; side: 'top' | 'bottom'; flap?: boolean }> = ({
    char,
    side,
    flap,
}) => (
    <span className={`flap-half flap-${side}${flap ? ' flap-moving' : ''}`}>
        <span className="flap-glyph">{char}</span>
    </span>
);

const Tile: React.FC<{ target: string; delay: number }> = ({ target, delay }) => {
    const [face, setFace] = useState<TileFace>({ prev: target, curr: target, flips: 0 });
    const currRef = useRef(target);

    useEffect(() => {
        if (target === currRef.current) {
            return;
        }
        if (prefersReducedMotion()) {
            currRef.current = target;
            setFace({ prev: target, curr: target, flips: 0 });
            return;
        }
        // A few random letters on the way, like the real thing, then the target.
        const sequence = target === ' ' ? [target] : [...randomLetters(3), target];
        const timers = sequence.map((char, i) =>
            window.setTimeout(
                () => {
                    setFace((f) => ({ prev: f.curr, curr: char, flips: f.flips + 1 }));
                    currRef.current = char;
                },
                delay + i * FLAP_MS
            )
        );
        return () => timers.forEach(window.clearTimeout);
    }, [target, delay]);

    return (
        <span className="flap-tile">
            <Half char={face.curr} side="top" />
            <Half char={face.prev} side="bottom" />
            {face.flips > 0 && (
                <>
                    <Half key={`t${face.flips}`} char={face.prev} side="top" flap />
                    <Half key={`b${face.flips}`} char={face.curr} side="bottom" flap />
                </>
            )}
        </span>
    );
};

interface FlapBoardProps {
    /** Shown in order, one flip to the next each `holdMs`; the board rests on the last. */
    phrases: string[];
    /** Number of tiles. Shorter phrases are padded with blanks. */
    width: number;
    holdMs?: number;
    className?: string;
}

/** A departure-board style row of flip tiles. Purely visual: hide it from screen readers. */
export const FlapBoard: React.FC<FlapBoardProps> = ({
    phrases,
    width,
    holdMs = 2400,
    className,
}) => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (index >= phrases.length - 1) {
            return;
        }
        const timer = window.setTimeout(() => setIndex(index + 1), holdMs);
        return () => window.clearTimeout(timer);
    }, [index, phrases.length, holdMs]);

    const text = phrases[index].padEnd(width).slice(0, width);

    return (
        <span
            className={`flap-board${className ? ` ${className}` : ''}`}
            style={{ '--flap-half-ms': `${FLAP_MS / 2}ms` } as CSSProperties}
            aria-hidden="true"
        >
            {Array.from(text).map((char, i) => (
                // Tiles are positional: the same slot flips from one letter to the next.
                // eslint-disable-next-line react/no-array-index-key
                <Tile key={i} target={char} delay={i * STAGGER_MS} />
            ))}
        </span>
    );
};
FlapBoard.displayName = 'FlapBoard';

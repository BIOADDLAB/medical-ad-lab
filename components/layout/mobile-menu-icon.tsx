import type { MobileMenuVariant } from '@/lib/ui-config';

const line = 'absolute left-1/2 h-[1.5px] -translate-x-1/2 rounded-full bg-current';

function ClosedGlyph({ variant }: { variant: MobileMenuVariant }) {
    if (variant === 1) {
        return (
            <span className="relative block h-10 w-10">
                <span className="absolute left-[9px] top-[13px] h-[6px] w-[6px] rounded-full border border-current/60" />
                <span className={`${line} top-[14px] ml-[3px] w-[17px]`} />
                <span className={`${line} top-[24px] w-[23px]`} />
            </span>
        );
    }

    if (variant === 2) {
        return (
            <span className="relative block h-10 w-10">
                <span className={`${line} top-[14px] w-[22px]`} />
                <span className={`${line} top-[24px] ml-[3px] w-[16px]`} />
            </span>
        );
    }

    if (variant === 3) {
        return (
            <span className="relative block h-10 w-10 rounded-full border border-current/25">
                <span className={`${line} top-[14px] w-[18px]`} />
                <span className={`${line} top-[24px] w-[18px]`} />
            </span>
        );
    }

    if (variant === 4) {
        return (
            <span className="relative block h-10 w-10">
                <span className={`${line} top-[13px] ml-[-3px] w-[16px]`} />
                <span className={`${line} top-[20px] w-[22px]`} />
                <span className={`${line} top-[27px] ml-[3px] w-[16px]`} />
            </span>
        );
    }

    return (
        <span className="grid h-10 min-w-[58px] place-items-center">
            <span className="text-[10px] font-black tracking-[.16em]">MENU</span>
        </span>
    );
}

export function MobileMenuIcon({
    open,
    variant,
    className = '',
}: {
    open: boolean;
    variant: MobileMenuVariant;
    className?: string;
}) {
    return (
        <span
            className={`relative block h-10 ${variant === 5 ? 'w-[58px]' : 'w-10'} ${className}`}
            aria-hidden
        >
            <span
                className={`absolute inset-0 transition-[opacity,transform] duration-300 ease-[cubic-bezier(.22,1,.36,1)] ${
                    open ? 'scale-75 opacity-0' : 'scale-100 opacity-100'
                }`}
            >
                <ClosedGlyph variant={variant} />
            </span>
            <span
                className={`absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 transition-[opacity,transform] duration-300 ease-[cubic-bezier(.22,1,.36,1)] ${
                    open ? 'scale-100 rotate-0 opacity-100' : 'scale-75 -rotate-45 opacity-0'
                }`}
            >
                <span className={`${line} top-1/2 w-5 -translate-y-1/2 rotate-45`} />
                <span className={`${line} top-1/2 w-5 -translate-y-1/2 -rotate-45`} />
            </span>
        </span>
    );
}

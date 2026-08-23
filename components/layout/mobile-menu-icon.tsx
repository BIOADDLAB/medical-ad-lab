import type { MobileMenuVariant } from '@/lib/ui-config';

export function MobileMenuIcon({
    open,
    variant,
    className = '',
}: {
    open: boolean;
    variant: MobileMenuVariant;
    className?: string;
}) {
    const line =
        'absolute left-1/2 h-[1.5px] -translate-x-1/2 rounded-full bg-current transition-[top,width,transform] duration-300 ease-[cubic-bezier(.22,1,.36,1)]';

    if (variant === 5) {
        return (
            <span className={`relative grid h-10 min-w-14 place-items-center ${className}`} aria-hidden>
                <span className="text-[10px] font-black tracking-[.14em]">{open ? 'CLOSE' : 'MENU'}</span>
            </span>
        );
    }

    return (
        <span
            className={`relative block h-10 w-10 ${variant === 3 ? 'rounded-full border border-current/20' : ''} ${className}`}
            aria-hidden
        >
            {variant === 1 && !open && (
                <span className="absolute left-[9px] top-[13px] h-1.5 w-1.5 rounded-full border border-current opacity-65" />
            )}
            <span
                className={`${line} ${open ? 'top-[19px] w-[20px] rotate-45' : `${variant === 1 ? 'top-[14px] ml-1 w-[17px]' : 'top-[14px] w-[22px]'}`}`}
            />
            <span
                className={`${line} ${open ? 'top-[19px] w-[20px] -rotate-45' : `${variant === 4 ? 'top-[19px] w-[22px]' : 'top-[23px] w-[22px]'}`}`}
            />
            {variant === 4 && !open && <span className={`${line} top-[24px] w-[14px]`} />}
        </span>
    );
}

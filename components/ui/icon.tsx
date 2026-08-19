type IconProps = {
    name: string;
    className?: string;
};

export function Icon({ name, className = '' }: IconProps) {
    const common = {
        fill: 'none',
        stroke: 'currentColor',
        strokeLinecap: 'round' as const,
        strokeLinejoin: 'round' as const,
        strokeWidth: 1.8,
    };

    const paths: Record<string, React.ReactNode> = {
        subway: (
            <>
                <rect x="3" y="4" width="18" height="15" rx="4" />
                <path d="M7 8h10M7 13h10M8 22l2-3M16 19l2 3" />
            </>
        ),
        bus: (
            <>
                <rect x="3" y="4" width="18" height="15" rx="3" />
                <path d="M6 8h12M7 19v2M17 19v2M7 15h.01M17 15h.01" />
            </>
        ),
        shelter: (
            <>
                <path d="M4 21V7l3-3h12l1 3v14M4 9h16M8 13h8M9 21v-5h6v5" />
            </>
        ),
        apartment: (
            <>
                <path d="M5 21V4h14v17M9 8h2M14 8h2M9 12h2M14 12h2M9 16h2M14 16h2M3 21h18" />
            </>
        ),
        banner: (
            <>
                <path d="M5 22V3M19 22V3M5 5h14v11H5zM8 9h8M8 12h5" />
            </>
        ),
        billboard: (
            <>
                <rect x="3" y="4" width="18" height="12" rx="2" />
                <path d="M9 20h6M12 16v4M7 8h10M7 12h6" />
            </>
        ),
        chart: (
            <>
                <path d="M4 19V5M4 19h16M8 16v-4M12 16V8M16 16v-7M20 16V5" />
            </>
        ),
        route: (
            <>
                <circle cx="6" cy="18" r="2" />
                <circle cx="18" cy="6" r="2" />
                <path d="M8 18h3a3 3 0 0 0 3-3v-6a3 3 0 0 1 3-3" />
            </>
        ),
        compare: (
            <>
                <path d="M8 4H4v16h4M16 4h4v16h-4M9 9l3-3 3 3M12 6v12M9 15l3 3 3-3" />
            </>
        ),
        pin: (
            <>
                <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
                <circle cx="12" cy="10" r="2.5" />
            </>
        ),
        report: (
            <>
                <path d="M6 3h9l3 3v15H6zM15 3v4h4M9 11h6M9 15h6" />
            </>
        ),
        arrow: (
            <>
                <path d="M5 12h14M14 7l5 5-5 5" />
            </>
        ),
        menu: (
            <>
                <path d="M4 7h16M4 12h16M4 17h16" />
            </>
        ),
        close: (
            <>
                <path d="m6 6 12 12M18 6 6 18" />
            </>
        ),
        check: (
            <>
                <path d="m5 12 4 4L19 6" />
            </>
        ),
        search: (
            <>
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
            </>
        ),
        pen: (
            <>
                <path d="m4 20 4.2-1 10.6-10.6a2 2 0 0 0-2.8-2.8L5.4 16.2 4 20Z" />
                <path d="m14.7 6.9 2.8 2.8M8.2 19l-2.8-2.8" />
            </>
        ),
    };

    return (
        <svg aria-hidden viewBox="0 0 24 24" className={className} {...common}>
            {paths[name] ?? paths.chart}
        </svg>
    );
}

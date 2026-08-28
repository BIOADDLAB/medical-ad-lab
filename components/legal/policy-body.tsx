import type { PolicyBlock } from '@/lib/privacy-policy';

/** 개인정보 안내 본문. 상세 페이지와 모달이 같은 블록 구조를 나눠 쓴다 */
export function PolicyBody({ blocks, compact = false }: { blocks: readonly PolicyBlock[]; compact?: boolean }) {
    const text = compact ? 'text-sm leading-7' : 'text-sm leading-8';

    return (
        <>
            {blocks.map((block, index) => {
                if (typeof block === 'string') {
                    return (
                        <p className={`m-0 mt-3 first:mt-0 ${text} text-muted`} key={index}>
                            {block}
                        </p>
                    );
                }
                if (Array.isArray(block)) {
                    return (
                        <ul className="m-0 mt-3 grid list-disc gap-1 pl-5 text-sm leading-7 text-muted" key={index}>
                            {block.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    );
                }
                return (
                    <p className="m-0 mt-5 text-sm font-extrabold text-ink" key={index}>
                        {(block as { sub: string }).sub}
                    </p>
                );
            })}
        </>
    );
}

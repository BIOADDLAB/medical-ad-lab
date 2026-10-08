'use client';

import { useId, useState, type FormEvent } from 'react';
import { SITE_URL } from '@/lib/site';
import { isHttpUrl, naverBlogUrl } from '@/lib/traffic';

const channels = [
    { id: 'naver_blog', label: '네이버 블로그', medium: 'blog' },
    { id: 'naver_cafe', label: '네이버 카페', medium: 'cafe' },
    { id: 'instagram', label: '인스타그램', medium: 'social' },
    { id: 'kakaotalk', label: '카카오톡', medium: 'social' },
    { id: 'email', label: '이메일', medium: 'email' },
    { id: 'partner', label: '기타 외부 사이트', medium: 'referral' },
] as const;

export function TrafficLinkBuilder() {
    const id = useId();
    const [channel, setChannel] = useState<string>('naver_blog');
    const [result, setResult] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const field = 'field-input w-full';

    const generate = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        setMessage('');
        setResult('');
        const form = new FormData(event.currentTarget);
        const read = (key: string) => String(form.get(key) || '').trim();
        try {
            const destination = read('destination');
            if (!isHttpUrl(destination)) throw new Error('이동할 홈페이지 주소를 https://부터 입력해 주세요.');
            const url = new URL(destination);
            const hosts = [new URL(SITE_URL).hostname, window.location.hostname].map((host) =>
                host.replace(/^www\./, ''),
            );
            if (!hosts.includes(url.hostname.replace(/^www\./, '')))
                throw new Error('이 홈페이지 또는 현재 미리보기 사이트 주소를 입력해 주세요.');
            if (/^\/(admin|api)(\/|$)|^\/blog\/admin(\/|$)/.test(url.pathname))
                throw new Error('고객이 볼 수 있는 공개 페이지를 입력해 주세요.');
            const source = channels.find((item) => item.id === channel)!;
            const rawPost = read('post');
            const post = channel === 'naver_blog' ? naverBlogUrl(rawPost) : rawPost;
            if (channel === 'naver_blog' && !/^https:\/\/blog\.naver\.com\/[\w-]+\/\d+$/.test(post)) {
                throw new Error(
                    '네이버 블로그의 개별 글 주소를 입력해 주세요. 블로그 홈 주소로는 글을 구분할 수 없습니다.',
                );
            }
            if (post && !isHttpUrl(post)) throw new Error('게시글 주소를 https://부터 입력해 주세요.');
            const title = read('title');
            if (!title) throw new Error('어떤 콘텐츠인지 알아볼 수 있는 제목을 입력해 주세요.');
            const parts = post ? new URL(post).pathname.split('/').filter(Boolean) : [];
            const content = read('content') || (channel === 'naver_blog' ? parts.join('-') : '');
            if (!content) throw new Error('링크 식별자를 입력해 주세요. 예: instagram-profile-202610');
            for (const key of [...url.searchParams.keys()]) {
                if (
                    /^(utm_|n_)/.test(key) ||
                    [
                        'ref_url',
                        'ref_title',
                        'gclid',
                        'gbraid',
                        'wbraid',
                        'msclkid',
                        'fbclid',
                        'ttclid',
                        'NaPm',
                    ].includes(key)
                ) {
                    url.searchParams.delete(key);
                }
            }
            url.searchParams.set('utm_source', source.id);
            url.searchParams.set('utm_medium', source.medium);
            url.searchParams.set('utm_campaign', read('campaign') || 'always_on');
            url.searchParams.set('utm_content', content.slice(0, 200));
            url.searchParams.set('ref_title', title);
            if (post) url.searchParams.set('ref_url', post);
            if (read('term')) url.searchParams.set('utm_term', read('term'));
            setResult(url.href);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : '입력한 주소를 확인해 주세요.');
        }
    };

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(result);
            setMessage('링크를 복사했습니다. 게시글의 링크 주소에 붙여 넣으세요.');
        } catch {
            setMessage('자동 복사가 되지 않았습니다. 아래 주소 전체를 선택해 복사해 주세요.');
        }
    };

    return (
        <details className="mb-6 rounded-xl border border-line bg-white p-5">
            <summary className="cursor-pointer text-sm font-bold text-ink focus-visible:outline-2 focus-visible:outline-brand">
                게시글별 추적 링크 만들기
            </summary>
            <p className="mb-5 mt-3 max-w-3xl text-xs leading-relaxed text-muted">
                글마다 만든 주소를 링크에 넣으면 문의에서 글 제목과 링크 식별자를 확인할 수 있습니다. 제목은 여기 입력한
                값이며, 방문자의 실제 검색어와는 다릅니다.
            </p>
            <form
                onSubmit={generate}
                onChange={() => {
                    setResult('');
                    setMessage('');
                    setError('');
                }}
                className="grid gap-4 sm:grid-cols-2"
            >
                <label className="field-label">
                    게시 채널
                    <select className={field} value={channel} onChange={(event) => setChannel(event.target.value)}>
                        {channels.map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.label}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="field-label">
                    이동할 홈페이지 주소
                    <input
                        className={field}
                        name="destination"
                        type="url"
                        defaultValue={`${SITE_URL}/`}
                        required
                        maxLength={1000}
                    />
                </label>
                <label className="field-label">
                    {channel === 'naver_blog' ? '네이버 블로그 글 주소' : '게시글 주소 (선택)'}
                    <input
                        className={field}
                        name="post"
                        type="url"
                        placeholder="https://blog.naver.com/블로그ID/글번호"
                        required={channel === 'naver_blog'}
                        maxLength={1000}
                    />
                </label>
                <label className="field-label">
                    글 또는 콘텐츠 제목
                    <input
                        className={field}
                        name="title"
                        placeholder="예: 병원 지하철 광고 비용 안내"
                        required
                        maxLength={200}
                    />
                </label>
                <label className="field-label">
                    캠페인명
                    <input className={field} name="campaign" defaultValue="always_on" maxLength={200} />
                </label>
                <label className="field-label">
                    링크 식별자 {channel === 'naver_blog' ? '(비우면 글 주소에서 자동 생성)' : ''}
                    <input
                        className={field}
                        name="content"
                        placeholder="예: post-001-bottom"
                        required={channel !== 'naver_blog'}
                        maxLength={200}
                    />
                </label>
                <label className="field-label sm:col-span-2">
                    운영 태그 (선택·검색어 아님)
                    <input
                        className={field}
                        name="term"
                        placeholder="예: 지하철광고 — 실제 검색어로 저장되지 않습니다"
                        maxLength={200}
                    />
                </label>
                <div className="sm:col-span-2">
                    <button className="btn-primary" type="submit">
                        추적 링크 만들기
                    </button>
                    <p role="alert" className="mb-0 mt-2 text-xs text-red-700">
                        {error}
                    </p>
                </div>
            </form>
            {result && (
                <div className="mt-4 border-t border-line pt-4">
                    <label htmlFor={`${id}-result`} className="mb-2 block text-xs font-bold">
                        복사할 링크
                    </label>
                    <textarea
                        id={`${id}-result`}
                        className={`${field} min-h-28 break-all text-xs`}
                        value={result}
                        readOnly
                        onFocus={(event) => event.currentTarget.select()}
                    />
                    <button className="btn-outline mt-3" type="button" onClick={copy}>
                        링크 복사
                    </button>
                    <p className="mb-0 mt-3 text-xs leading-relaxed text-muted">
                        이 주소 전체를 게시글의 텍스트·이미지·버튼 링크에 넣으세요. 홈페이지 내부 링크에는 붙이지
                        않습니다. 같은 주소가 공유되면 원래 붙인 출처가 유지됩니다.
                    </p>
                </div>
            )}
            <p role="status" className="mb-0 mt-2 text-xs text-muted">
                {message}
            </p>
        </details>
    );
}

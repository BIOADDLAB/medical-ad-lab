'use client';

import Link from 'next/link';
import { FormEvent, useId, useState } from 'react';
import { Icon } from '@/components/ui/icon';

type FieldName = 'hospital' | 'area' | 'phone' | 'email' | 'privacy';
type Errors = Partial<Record<FieldName, string>>;

const messages: Record<FieldName, string> = {
    hospital: '병원명을 입력해 주세요.',
    area: '지역을 선택해 주세요.',
    phone: '휴대폰 번호를 확인해 주세요.',
    email: '이메일 주소를 확인해 주세요.',
    privacy: '개인정보 수집 및 이용 동의가 필요합니다.',
};

const areas = ['서울', '경기', '인천', '부산', '대구', '대전', '광주', '기타'];

export function LeadForm({
    compact = false,
    onDirty,
    onComplete,
}: {
    compact?: boolean;
    onDirty?: () => void;
    onComplete?: () => void;
}) {
    const id = useId().replaceAll(':', '');
    const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
    const [errors, setErrors] = useState<Errors>({});

    /** 유입경로: utm 파라미터 우선, 없으면 referrer */
    const readSource = () => {
        const params = new URLSearchParams(window.location.search);
        const utm = ['utm_source', 'utm_medium', 'utm_campaign']
            .map((key) => params.get(key))
            .filter(Boolean)
            .join(' / ');
        return utm || (document.referrer ? new URL(document.referrer).hostname : '직접 유입');
    };

    const validate = (name: FieldName, value: string | boolean) => {
        let invalid = !value;
        if (name === 'phone' && typeof value === 'string')
            invalid = !/^01[016789]-?\d{3,4}-?\d{4}$/.test(value.replaceAll(' ', ''));
        if (name === 'email' && typeof value === 'string') invalid = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        setErrors((current) => ({ ...current, [name]: invalid ? messages[name] : undefined }));
        return !invalid;
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        const validity = {
            hospital: validate('hospital', String(data.get('hospital') || '').trim()),
            area: validate('area', String(data.get('area') || '')),
            phone: validate('phone', String(data.get('phone') || '')),
            email: validate('email', String(data.get('email') || '')),
            privacy: validate('privacy', data.get('privacy') === 'on'),
        };
        if (Object.values(validity).some((valid) => !valid)) {
            form.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
            return;
        }

        setStatus('loading');
        try {
            const response = await fetch('/api/inquiries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...Object.fromEntries(data.entries()), source: readSource() }),
            });
            if (!response.ok) throw new Error('submit failed');
            setStatus('done');
            onComplete?.();
        } catch {
            setStatus('error');
        }
    };

    if (status === 'done') {
        return (
            <div className="grid justify-items-center gap-3 py-8 text-center" role="status" tabIndex={-1}>
                <span className="grid h-14 w-14 place-items-center rounded-full bg-success-pale text-success">
                    <Icon name="check" className="w-6" />
                </span>
                <strong className="text-h5">무료진단 신청이 접수되었습니다.</strong>
                <p className="m-0 text-sm text-muted">
                    담당자가 확인 후 24시간 이내 입력하신 연락처로 안내드리겠습니다.
                </p>
                <button type="button" onClick={() => setStatus('idle')} className="mt-2 text-xs font-bold text-brand">
                    다시 작성하기
                </button>
            </div>
        );
    }

    const errorId = (name: FieldName) => (errors[name] ? `${id}-${name}-error` : undefined);

    return (
        <form className="grid gap-5" onSubmit={handleSubmit} onChange={onDirty} noValidate>
            <input
                type="text"
                name="company"
                className="honeypot"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden
                defaultValue=""
            />

            <div className="grid gap-5 sm:grid-cols-2 sm:gap-[18px]">
                <label className="field-label" htmlFor={`${id}-hospital`}>
                    <span className="">병원명</span>
                    <input
                        id={`${id}-hospital`}
                        className="field-input"
                        required
                        name="hospital"
                        placeholder="예: 강남OO의원"
                        autoComplete="organization"
                        aria-invalid={Boolean(errors.hospital)}
                        aria-describedby={errorId('hospital')}
                        onBlur={(event) => validate('hospital', event.target.value.trim())}
                    />
                    {errors.hospital && (
                        <small className="text-[12px] text-red-600" id={errorId('hospital')}>
                            {errors.hospital}
                        </small>
                    )}
                </label>
                <label className="field-label" htmlFor={`${id}-area`}>
                    <span>지역</span>
                    <select
                        id={`${id}-area`}
                        className="field-input"
                        required
                        name="area"
                        defaultValue=""
                        aria-invalid={Boolean(errors.area)}
                        aria-describedby={errorId('area')}
                        onBlur={(event) => validate('area', event.target.value)}
                    >
                        <option value="" disabled>
                            시·구 선택
                        </option>
                        {areas.map((area) => (
                            <option key={area}>{area}</option>
                        ))}
                    </select>
                    {errors.area && (
                        <small className="text-[12px] text-red-600" id={errorId('area')}>
                            {errors.area}
                        </small>
                    )}
                </label>
            </div>

            <label className="field-label" htmlFor={`${id}-phone`}>
                <span>휴대폰 번호 · 진단 결과 안내</span>
                <input
                    id={`${id}-phone`}
                    className="field-input"
                    required
                    type="tel"
                    name="phone"
                    placeholder="010-0000-0000"
                    autoComplete="tel"
                    inputMode="tel"
                    aria-invalid={Boolean(errors.phone)}
                    aria-describedby={errorId('phone')}
                    onBlur={(event) => validate('phone', event.target.value)}
                />
                {errors.phone && (
                    <small className="text-[12px] text-red-600" id={errorId('phone')}>
                        {errors.phone}
                    </small>
                )}
            </label>

            <label className="field-label" htmlFor={`${id}-email`}>
                <span>이메일 · 실무자료 발송</span>
                <input
                    id={`${id}-email`}
                    className="field-input"
                    required
                    type="email"
                    name="email"
                    placeholder="name@hospital.com"
                    autoComplete="email"
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errorId('email')}
                    onBlur={(event) => validate('email', event.target.value)}
                />
                {errors.email && (
                    <small className="text-[12px] text-red-600" id={errorId('email')}>
                        {errors.email}
                    </small>
                )}
            </label>

            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <label className="flex flex-1 items-center gap-2.5" htmlFor={`${id}-privacy`}>
                    <input
                        id={`${id}-privacy`}
                        type="checkbox"
                        required
                        name="privacy"
                        className="h-[18px] w-[18px] shrink-0 accent-brand"
                        aria-invalid={Boolean(errors.privacy)}
                        aria-describedby={errorId('privacy')}
                        onBlur={(event) => validate('privacy', event.target.checked)}
                    />
                    <span className="text-sm font-medium text-slate">개인정보 수집 및 이용에 동의합니다.</span>
                </label>
                <Link href="/privacy" className="ml-auto text-xs font-medium text-brand underline lg:text-muted">
                    자세히 보기
                </Link>
            </div>
            {errors.privacy && (
                <small className="-mt-3 text-[12px] text-red-600" id={errorId('privacy')}>
                    {errors.privacy}
                </small>
            )}

            {status === 'error' && (
                <p className="m-0 rounded-[9px] bg-red-50 px-3.5 py-3 text-xs text-red-700" role="alert">
                    접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.
                </p>
            )}

            <button
                className="btn-primary mt-2 min-h-[58px] w-full text-h5 lg:min-h-[62px] font-extrabold"
                type="submit"
                disabled={status === 'loading'}
            >
                {status === 'loading' ? (
                    <span className="inline-flex items-center gap-2.5">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        접수 중...
                    </span>
                ) : (
                    '내 광고비 무료로 확인하기'
                )}
            </button>

            {!compact && (
                <p className="m-0 text-center text-[12px] text-subtle lg:hidden">
                    1분이면 신청 완료 · 비용 없음 · 계약 의무 없음
                </p>
            )}
            {compact && (
                <p className="m-0 text-center text-[12px] text-subtle">
                    1분이면 신청 완료 · 비용 없음 · 계약 의무 없음
                </p>
            )}
        </form>
    );
}

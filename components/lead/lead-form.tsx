'use client';

import { FormEvent, useEffect, useId, useState } from 'react';
import { PrivacyModal } from '@/components/lead/privacy-modal';
import { Icon } from '@/components/ui/icon';
import { SuccessConfetti } from '@/components/ui/success-confetti';

type FieldName = 'hospital' | 'area' | 'phone' | 'email' | 'privacy';
type Errors = Partial<Record<FieldName, string>>;

const SOURCE_KEY = 'medical-ad-lab-source';

const messages: Record<FieldName, string> = {
    hospital: '병원명을 입력해 주세요.',
    area: '지역을 선택해 주세요.',
    phone: '휴대폰 번호를 확인해 주세요.',
    email: '이메일 주소를 확인해 주세요.',
    privacy: '개인정보 수집 및 이용 동의가 필요합니다.',
};

const areas = ['서울', '경기', '인천', '부산', '대구', '대전', '광주', '기타'];

const detectSource = () => {
    const params = new URLSearchParams(window.location.search);
    const utm = ['utm_source', 'utm_medium', 'utm_campaign']
        .map((key) => params.get(key)?.trim())
        .filter(Boolean)
        .join(' / ');

    if (utm) return utm;
    if (params.has('fbclid')) return 'meta / paid_social';
    if (params.has('gclid')) return 'google / cpc';

    if (document.referrer) {
        try {
            return new URL(document.referrer).hostname;
        } catch {
            return document.referrer;
        }
    }

    return '직접 유입';
};

const saveSource = () => {
    if (!sessionStorage.getItem(SOURCE_KEY)) {
        sessionStorage.setItem(SOURCE_KEY, detectSource());
    }
};

const readSource = () => sessionStorage.getItem(SOURCE_KEY) ?? detectSource();

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
    const [privacyOpen, setPrivacyOpen] = useState(false);

    useEffect(() => {
        saveSource();
    }, []);

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
            form.reset();
            setErrors({});
            setStatus('done');
            onComplete?.();
        } catch {
            setStatus('error');
        }
    };

    const isDone = status === 'done';
    const errorId = (name: FieldName) => (errors[name] ? `${id}-${name}-error` : undefined);

    return (
        <div className="lead-form-shell relative">
            <form
                className={`lead-form grid gap-5 ${isDone ? 'pointer-events-none invisible' : ''}`}
                onSubmit={handleSubmit}
                onChange={onDirty}
                aria-hidden={isDone}
                noValidate
            >
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
                            <small className="field-error" id={errorId('hospital')}>
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
                                지역 선택
                            </option>
                            {areas.map((area) => (
                                <option key={area}>{area}</option>
                            ))}
                        </select>
                        {errors.area && (
                            <small className="field-error" id={errorId('area')}>
                                {errors.area}
                            </small>
                        )}
                    </label>
                </div>

                <div className="grid gap-5 sm:grid-cols-2 sm:gap-[18px]">
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
                            <small className="field-error" id={errorId('phone')}>
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
                            <small className="field-error" id={errorId('email')}>
                                {errors.email}
                            </small>
                        )}
                    </label>
                </div>

                <label className="field-label" htmlFor={`${id}-message`}>
                    <span>
                        문의내용 <b className="font-medium text-muted">(선택)</b>
                    </span>
                    <textarea
                        id={`${id}-message`}
                        className="field-input lead-message resize-none py-3"
                        name="message"
                        rows={2}
                        maxLength={300}
                        placeholder="예: 강남역 인근 지하철 광고 비용과 집행 기간이 궁금합니다."
                    />
                </label>

                <div className="relative flex flex-wrap items-center gap-x-2.5 gap-y-1">
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
                    <button
                        type="button"
                        onClick={() => setPrivacyOpen(true)}
                        className="ml-auto text-xs font-medium text-brand underline underline-offset-2 lg:text-muted"
                    >
                        자세히 보기
                    </button>
                    {errors.privacy && (
                        <small className="field-error" id={errorId('privacy')}>
                            {errors.privacy}
                        </small>
                    )}
                </div>

                <button
                    className="btn-primary mt-2 min-h-[58px] w-full text-h5 font-extrabold lg:min-h-[62px]"
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

                <p
                    className={`m-0 min-h-[20px] text-center text-[12px] ${
                        status === 'error' ? 'text-red-600' : `text-subtle ${compact ? '' : 'lg:invisible'}`
                    }`}
                    role={status === 'error' ? 'alert' : undefined}
                >
                    {status === 'error'
                        ? '접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
                        : '1분이면 신청 완료 · 비용 없음 · 계약 의무 없음'}
                </p>
            </form>

            {isDone && (
                <div
                    className="absolute inset-0 grid content-center justify-items-center gap-3 overflow-hidden px-4 text-center"
                    role="status"
                    tabIndex={-1}
                >
                    <SuccessConfetti />
                    <span className="relative z-10 grid h-14 w-14 place-items-center rounded-full bg-success-pale text-success">
                        <Icon name="check" className="w-6" />
                    </span>
                    <strong className="relative z-10 text-h5">무료진단 신청이 접수되었습니다.</strong>
                    <p className="relative z-10 m-0 max-w-[360px] text-sm text-muted">
                        담당자가 확인 후 24시간 이내 입력하신 연락처로 안내드리겠습니다.
                    </p>
                    <button
                        type="button"
                        onClick={() => setStatus('idle')}
                        className="relative z-10 mt-2 text-xs font-bold text-brand"
                    >
                        다시 작성하기
                    </button>
                </div>
            )}
            <PrivacyModal open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
        </div>
    );
}

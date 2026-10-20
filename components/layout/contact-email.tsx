/** 대표 이메일(관리자 설정, 서버에서 읽어 넘김). 없으면 아무것도 그리지 않는다 */
export function ContactEmail({ email }: { email: string }) {
    if (!email) return null;
    return (
        <a href={`mailto:${email}`} className="mt-2 block text-sm text-muted">
            {email}
        </a>
    );
}

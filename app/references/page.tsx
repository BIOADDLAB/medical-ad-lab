import { permanentRedirect } from 'next/navigation';

/** 예전 주소다. 색인이 남아 있으므로 임시(307)가 아니라 영구(308)로 보낸다 */
export default function ReferencesRedirect() {
    permanentRedirect('/insight');
}

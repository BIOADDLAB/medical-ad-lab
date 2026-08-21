import { Hero } from '@/components/home/hero';
import { PainPoints } from '@/components/home/pain-points';
import { WhyOoh } from '@/components/home/why-ooh';
import { Results } from '@/components/home/results';
import { Media } from '@/components/home/media';
import { Metrics } from '@/components/home/metrics';
import { Lab } from '@/components/home/lab';
import { Process } from '@/components/home/process';
import { Faq } from '@/components/home/faq';
import { BottomCta } from '@/components/home/bottom-cta';

export default function Home() {
    return (
        <main>
            <Hero />
            <PainPoints />
            <WhyOoh />
            <Results />
            <Media />
            <Metrics />
            <Lab />
            <Process />
            <Faq />
            <BottomCta />
        </main>
    );
}

import { Hero } from '@/components/home/hero';
import { PainPoints } from '@/components/home/pain-points';
import { WhyOoh } from '@/components/home/why-ooh';
import { Results } from '@/components/home/results';
import { Media } from '@/components/home/media';
import { Metrics } from '@/components/home/metrics';

export default function Home() {
    return (
        <main>
            <Hero />
            <PainPoints />
            <WhyOoh />
            <Results />
            <Media />
            <Metrics />
        </main>
    );
}

import { Hero } from '@/components/home/hero';
import { PainPoints } from '@/components/home/pain-points';
import { WhyOoh } from '@/components/home/why-ooh';
import { Results } from '@/components/home/results';

export default function Home() {
    return (
        <main>
            <Hero />
            <PainPoints />
            <WhyOoh />
            <Results />
        </main>
    );
}

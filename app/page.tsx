import { Hero } from '@/components/home/hero';
import { PainPoints } from '@/components/home/pain-points';
import { WhyOoh } from '@/components/home/why-ooh';

export default function Home() {
    return (
        <main>
            <Hero />
            <PainPoints />
            <WhyOoh />
        </main>
    );
}

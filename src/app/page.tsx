'use client';

import Background from '@/components/Background';
import CursorGlow from '@/components/CursorGlow';
import Avatar from '@/components/Avatar';
import SocialGrid from '@/components/SocialGrid';
import BadApple from '@/components/BadApple';
import KonamiEgg from '@/components/KonamiEgg';
import Footer from '@/components/Footer';
import RedirectModal from '@/components/RedirectModal';

export default function Home() {
  return (
    <>
      <Background />
      <CursorGlow />
      <KonamiEgg />
      <RedirectModal />

      <main className="main-container">
        <Avatar />
        <SocialGrid />
        <BadApple />
        <Footer />
      </main>
    </>
  );
}

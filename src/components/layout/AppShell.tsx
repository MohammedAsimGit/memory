'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence, PanInfo, animate, useMotionValue } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import BottomNav from './BottomNav';
import CloudBackground from './CloudBackground';
import AppTopBar from './AppTopBar';
import CreateBottomSheet from './CreateBottomSheet';

type SwipePage = 'chat' | 'home' | 'timeline';
const SWIPE_PAGES: SwipePage[] = ['chat', 'home', 'timeline'];
const PAGE_ROUTES: Record<SwipePage, string> = {
  chat: '/chat',
  home: '/home',
  timeline: '/timeline',
};
const SWIPE_THRESHOLD = 50;
const VELOCITY_THRESHOLD = 300;

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [fabOpen, setFabOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const x = useMotionValue(0);
  const isDragging = useRef(false);

  const currentSegment = (pathname?.split('/')[1] || 'home') as SwipePage;
  const isSwipePage = SWIPE_PAGES.includes(currentSegment);
  const currentIndex = SWIPE_PAGES.indexOf(currentSegment);

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      isDragging.current = false;
      if (!isSwipePage) return;

      const swipeDistance = info.offset.x;
      const swipeVelocity = info.velocity.x;

      let targetIndex = currentIndex;

      if (Math.abs(swipeDistance) > SWIPE_THRESHOLD || Math.abs(swipeVelocity) > VELOCITY_THRESHOLD) {
        if (swipeDistance > 0 && currentIndex > 0) {
          targetIndex = currentIndex - 1;
        } else if (swipeDistance < 0 && currentIndex < SWIPE_PAGES.length - 1) {
          targetIndex = currentIndex + 1;
        }
      }

      const targetPage = SWIPE_PAGES[targetIndex];
      if (targetPage !== currentSegment) {
        router.push(PAGE_ROUTES[targetPage]);
      } else {
        animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 });
      }
    },
    [currentIndex, currentSegment, isSwipePage, router, x]
  );

  const handleDragStart = useCallback(() => {
    isDragging.current = true;
  }, []);

  const content = isSwipePage ? (
    <motion.div
      style={{ x }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.15}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className="touch-pan-y cursor-grab active:cursor-grabbing"
    >
      {children}
    </motion.div>
  ) : (
    children
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EAF6FF] dark:from-slate-900 via-[#EAF6FF]/70 dark:via-slate-900/70 to-white dark:to-slate-950 relative">
      <CloudBackground />
      <AppTopBar />
      <AnimatePresence mode="wait">
        <motion.main
          key="content"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="pb-28 pt-[5rem] xs:pt-[5.5rem] sm:pt-24 px-5 sm:px-6 max-w-2xl mx-auto relative z-10"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 4.5rem)' }}
        >
          {content}
        </motion.main>
      </AnimatePresence>

      {isSwipePage && (
        <div className="fixed bottom-20 left-0 right-0 flex justify-center gap-1.5 z-30 pointer-events-none">
          {SWIPE_PAGES.map((page, i) => (
            <motion.div
              key={page}
              animate={{
                scale: i === currentIndex ? 1 : 0.6,
                opacity: i === currentIndex ? 1 : 0.3,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className={`w-1.5 h-1.5 rounded-full ${
                i === currentIndex ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {fabOpen && <CreateBottomSheet isOpen={fabOpen} onClose={() => setFabOpen(false)} />}
      </AnimatePresence>

      <BottomNav fabOpen={fabOpen} onFabToggle={() => setFabOpen(!fabOpen)} />
    </div>
  );
}

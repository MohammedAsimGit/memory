'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence, PanInfo, animate, useMotionValue } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import BottomNav from './BottomNav';
import CloudBackground from './CloudBackground';
import AppTopBar from './AppTopBar';
import CreateBottomSheet from './CreateBottomSheet';

const SWIPE_THRESHOLD = 50;
const VELOCITY_THRESHOLD = 300;

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [fabOpen, setFabOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const x = useMotionValue(0);
  const isDragging = useRef(false);

  const currentSegment = pathname?.split('/')[1] || 'home';
  const isHome = currentSegment === 'home';
  const isChat = currentSegment === 'chat';

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      isDragging.current = false;

      const swipeDistance = info.offset.x;
      const swipeVelocity = info.velocity.x;

      const isHorizontalSwipe =
        Math.abs(swipeDistance) > SWIPE_THRESHOLD || Math.abs(swipeVelocity) > VELOCITY_THRESHOLD;

      if (!isHorizontalSwipe) {
        animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 });
        return;
      }

      if (isHome && swipeDistance > 0) {
        router.push('/chat');
      } else if (isChat && swipeDistance < 0) {
        router.push('/home');
      } else {
        animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 });
      }
    },
    [isHome, isChat, router, x]
  );

  const handleDragStart = useCallback(() => {
    isDragging.current = true;
  }, []);

  const isSwipeEnabled = isHome || isChat;

  const content = isSwipeEnabled ? (
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

  if (isChat) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        {content}
      </div>
    );
  }

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

      <AnimatePresence>
        {fabOpen && <CreateBottomSheet isOpen={fabOpen} onClose={() => setFabOpen(false)} />}
      </AnimatePresence>

      <BottomNav fabOpen={fabOpen} onFabToggle={() => setFabOpen(!fabOpen)} />
    </div>
  );
}

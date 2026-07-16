/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Bell, Clock, RefreshCw, XCircle } from 'lucide-react';
import { startAlarmLoop, stopActiveSound } from '../utils/audioSynth';
import { snoozeAlarm, dismissAlarm } from '../utils/alarmScheduler';

interface RingingOverlayProps {
  alarm: {
    id: string;
    note: string;
    toneId: string;
    vibration: boolean;
    isSnooze: boolean;
  };
  onDismiss: () => void;
  onSnooze: () => void;
}

export default function RingingOverlay({ alarm, onDismiss, onSnooze }: RingingOverlayProps) {
  const [currentTime, setCurrentTime] = useState<string>('');

  // Clock tick in overlay
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setCurrentTime(d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle active audio loop play
  useEffect(() => {
    // Start continuous alarm loop
    startAlarmLoop(alarm.toneId, alarm.vibration);
    
    return () => {
      // Always stop sound on unmount
      stopActiveSound();
    };
  }, [alarm]);

  const handleSnoozeAction = (minutes: number) => {
    stopActiveSound();
    snoozeAlarm(alarm.id, minutes);
    onSnooze();
  };

  const handleDismissAction = () => {
    stopActiveSound();
    dismissAlarm(alarm.id);
    onDismiss();
  };

  return (
    <div className="fixed inset-0 z-100 flex flex-col items-center justify-between p-6 bg-neutral-900/95 dark:bg-black/95 text-white backdrop-blur-md animate-fade-in">
      
      {/* Background Pulse Animation */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-0">
        <motion.div
          animate={{
            scale: [1, 1.8, 1],
            opacity: [0.15, 0.4, 0.15],
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="w-72 h-72 rounded-full bg-amber-500/20 blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 2.5,
            delay: 1,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="w-96 h-96 rounded-full bg-neutral-500/10 blur-3xl"
        />
      </div>

      {/* Header Info */}
      <div className="w-full flex flex-col items-center mt-12 z-10 text-center space-y-3">
        <div className="inline-flex p-4.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-bounce">
          <Bell className="w-10 h-10" />
        </div>
        <span className="text-xs font-mono uppercase tracking-widest text-neutral-400">
          {alarm.isSnooze ? 'Snoozed Alarm Ringing' : 'Calendar Alarm Triggered'}
        </span>
        <h2 className="text-2xl font-bold tracking-tight px-4 max-w-sm line-clamp-2">
          {alarm.note || 'Alarm is ringing!'}
        </h2>
      </div>

      {/* Big Digital Wall Clock */}
      <div className="z-10 text-center space-y-1">
        <div className="text-5xl font-extrabold tracking-tight font-sans">
          {currentTime.split(' ')[0]}
        </div>
        <div className="text-sm font-mono text-neutral-400">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
        </div>
      </div>

      {/* Snooze & Dismiss Action Console */}
      <div className="w-full max-w-sm space-y-4 mb-8 z-10">
        {/* Quick Snooze options */}
        <div className="space-y-2">
          <span className="block text-center text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
            Snooze Interval
          </span>
          <div className="grid grid-cols-3 gap-2">
            {[5, 10, 15].map((mins) => (
              <button
                key={mins}
                onClick={() => handleSnoozeAction(mins)}
                className="py-3 px-3 rounded-2xl bg-neutral-800/80 hover:bg-neutral-700/80 active:bg-neutral-700 text-neutral-100 border border-neutral-700/30 font-medium text-xs transition-all flex flex-col items-center justify-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{mins} Min</span>
              </button>
            ))}
          </div>
        </div>

        {/* Large Dismiss Button */}
        <button
          onClick={handleDismissAction}
          className="w-full py-4 px-6 rounded-2xl bg-white text-neutral-950 font-bold text-base hover:opacity-90 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          <XCircle className="w-5 h-5 text-neutral-900" />
          <span>Dismiss Alarm</span>
        </button>
      </div>
    </div>
  );
}

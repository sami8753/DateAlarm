/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Calendar, Trash2, Clock, Check, AlarmClock, RefreshCw } from 'lucide-react';
import { AlarmHistoryItem } from '../types';
import { format12Hour } from '../utils/alarmScheduler';

interface HistoryListProps {
  history: AlarmHistoryItem[];
  onClear: () => void;
}

export default function HistoryList({ history, onClear }: HistoryListProps) {
  const formatDateTime = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return 'Unknown time';
      
      const datePart = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const timePart = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
      return `${datePart} at ${timePart}`;
    } catch (e) {
      return 'Unknown time';
    }
  };

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 px-6 space-y-4">
        <div className="p-4 rounded-full bg-neutral-100 dark:bg-neutral-900 text-neutral-400 dark:text-neutral-600">
          <Clock className="w-8 h-8" />
        </div>
        <div>
          <h3 className="font-semibold text-neutral-800 dark:text-neutral-200">No alarm history</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-xs mx-auto">
            Past triggered alarms, snooze records, and dismissals will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      <div className="flex justify-between items-center px-1">
        <span className="text-xs font-mono uppercase tracking-wider text-neutral-500">
          Log ({history.length} items)
        </span>
        <button
          onClick={onClear}
          className="flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:opacity-80 transition-opacity cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear History</span>
        </button>
      </div>

      <div className="space-y-2.5">
        {history.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.04, 0.4) }}
            className="p-3.5 rounded-2xl border border-neutral-200/40 dark:border-neutral-800/40 bg-white/40 dark:bg-neutral-900/20 backdrop-blur-xs flex items-center justify-between gap-3 text-neutral-800 dark:text-neutral-100"
          >
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm font-sans">
                  {format12Hour(item.time)}
                </span>
                <span className="text-[10px] font-mono text-neutral-400">
                  {item.date}
                </span>
              </div>
              
              {item.note && (
                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate italic">
                  "{item.note}"
                </p>
              )}

              <p className="text-[10px] text-neutral-400 dark:text-neutral-500">
                Triggered: {formatDateTime(item.triggeredAt)}
              </p>
            </div>

            {/* Status Badge */}
            <div>
              {item.status === 'dismissed' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20">
                  <Check className="w-3 h-3" />
                  Dismissed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/20">
                  <RefreshCw className="w-2.5 h-2.5 animate-spin-slow" />
                  Snoozed
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

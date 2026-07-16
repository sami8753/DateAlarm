/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';

interface DeleteConfirmationDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
  alarmNote?: string;
  alarmTime?: string;
}

export default function DeleteConfirmationDialog({
  onConfirm,
  onCancel,
  alarmNote,
  alarmTime,
}: DeleteConfirmationDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-sm p-6 bg-white dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800/50 rounded-3xl shadow-xl space-y-5 animate-scale-up text-neutral-800 dark:text-neutral-100">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg tracking-tight">Delete Alarm?</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">This action cannot be undone.</p>
          </div>
        </div>

        {(alarmNote || alarmTime) && (
          <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-805 border border-neutral-200/40 dark:border-neutral-800/40 space-y-1">
            {alarmTime && <p className="font-mono text-sm font-semibold">{alarmTime}</p>}
            {alarmNote && <p className="text-xs text-neutral-500 dark:text-neutral-400 italic truncate">"{alarmNote}"</p>}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 font-medium text-sm transition-all text-neutral-600 dark:text-neutral-300 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-sm transition-all cursor-pointer shadow-sm shadow-rose-500/10"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, AlignLeft, Volume2, Music, Check, X } from 'lucide-react';
import { ALARM_TONES } from '../types';
import { playTonePreview, stopActiveSound } from '../utils/audioSynth';

interface AddAlarmFormProps {
  onAdd: (date: string, time: string, note: string, toneId: string, vibration: boolean) => void;
  onCancel: () => void;
  initialDate?: string; // YYYY-MM-DD format
  defaultToneId?: string;
  defaultVibration?: boolean;
}

export default function AddAlarmForm({
  onAdd,
  onCancel,
  initialDate,
  defaultToneId = 'zen_chime',
  defaultVibration = true,
}: AddAlarmFormProps) {
  // Get today's date in local format YYYY-MM-DD
  const getTodayString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Get current time + 10 minutes in format HH:mm
  const getDefaultTimeString = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 10);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const [date, setDate] = useState<string>(initialDate || getTodayString());
  const [time, setTime] = useState<string>(getDefaultTimeString());
  const [note, setNote] = useState<string>('');
  const [toneId, setToneId] = useState<string>(defaultToneId);
  const [vibration, setVibration] = useState<boolean>(defaultVibration);
  const [previewingToneId, setPreviewingToneId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Quick preset handlers
  const setPreset = (type: 'tomorrow' | 'tonight' | '1hr') => {
    const now = new Date();
    if (type === 'tomorrow') {
      const tomorrow = new Date();
      tomorrow.setDate(now.getDate() + 1);
      const yyyy = tomorrow.getFullYear();
      const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const dd = String(tomorrow.getDate()).padStart(2, '0');
      setDate(`${yyyy}-${mm}-${dd}`);
      setTime('07:00'); // Standard 7:00 AM tomorrow
    } else if (type === 'tonight') {
      setDate(getTodayString());
      setTime('22:00'); // Standard 10:00 PM tonight
    } else if (type === '1hr') {
      const later = new Date();
      later.setHours(now.getHours() + 1);
      const yyyy = later.getFullYear();
      const mm = String(later.getMonth() + 1).padStart(2, '0');
      const dd = String(later.getDate()).padStart(2, '0');
      setDate(`${yyyy}-${mm}-${dd}`);
      const hh = String(later.getHours()).padStart(2, '0');
      const min = String(later.getMinutes()).padStart(2, '0');
      setTime(`${hh}:${min}`);
    }
  };

  const handlePreviewTone = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewingToneId === id) {
      stopActiveSound();
      setPreviewingToneId(null);
    } else {
      setPreviewingToneId(id);
      playTonePreview(id, 3.0, vibration);
      setTimeout(() => {
        setPreviewingToneId((curr) => (curr === id ? null : curr));
      }, 3000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate if past date & time
    const selectedDateTime = new Date(`${date}T${time}:00`);
    if (isNaN(selectedDateTime.getTime())) {
      setError('Invalid date or time.');
      return;
    }

    if (selectedDateTime.getTime() <= Date.now()) {
      setError('Please select a time in the future.');
      return;
    }

    stopActiveSound();
    onAdd(date, time, note, toneId, vibration);
  };

  return (
    <div className="w-full max-w-md mx-auto p-5 bg-white dark:bg-neutral-900 rounded-3xl shadow-lg border border-neutral-200/40 dark:border-neutral-800/40 text-neutral-800 dark:text-neutral-100 transition-colors duration-300">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold tracking-tight">Add Calendar Alarm</h2>
        <button
          onClick={() => {
            stopActiveSound();
            onCancel();
          }}
          className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5 text-neutral-500" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Presets */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setPreset('1hr')}
            className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
          >
            In 1 Hour
          </button>
          <button
            type="button"
            onClick={() => setPreset('tonight')}
            className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
          >
            Tonight (10 PM)
          </button>
          <button
            type="button"
            onClick={() => setPreset('tomorrow')}
            className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
          >
            Tomorrow Morning
          </button>
        </div>

        {/* Date Selector */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            <CalendarIcon className="w-4 h-4 text-neutral-400" />
            <span>Select Date</span>
          </label>
          <div className="relative">
            <input
              type="date"
              value={date}
              min={getTodayString()}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-2xl bg-neutral-50 dark:bg-neutral-805 border border-neutral-200/60 dark:border-neutral-800/60 text-sm focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-950 dark:focus:border-neutral-100 outline-none transition-all cursor-pointer"
            />
          </div>
        </div>

        {/* Time Selector */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            <Clock className="w-4 h-4 text-neutral-400" />
            <span>Select Time</span>
          </label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-2xl bg-neutral-50 dark:bg-neutral-805 border border-neutral-200/60 dark:border-neutral-800/60 text-sm focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-950 dark:focus:border-neutral-100 outline-none transition-all cursor-pointer"
          />
        </div>

        {/* Note / Description */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            <AlignLeft className="w-4 h-4 text-neutral-400" />
            <span>Optional Note / Name</span>
          </label>
          <input
            type="text"
            placeholder="Wake up, Gym, Flight..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={40}
            className="w-full px-4 py-3 rounded-2xl bg-neutral-50 dark:bg-neutral-805 border border-neutral-200/60 dark:border-neutral-800/60 text-sm placeholder-neutral-400 focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-950 dark:focus:border-neutral-100 outline-none transition-all"
          />
        </div>

        {/* Tones List Selector */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            <Music className="w-4 h-4 text-neutral-400" />
            <span>Select Tone</span>
          </label>
          <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1">
            {ALARM_TONES.map((tone) => (
              <div
                key={tone.id}
                onClick={() => setToneId(tone.id)}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                  toneId === tone.id
                    ? 'bg-neutral-900 text-white border-neutral-950 dark:bg-white dark:text-neutral-900 dark:border-white shadow-sm'
                    : 'bg-neutral-50 dark:bg-neutral-805 border-neutral-200/50 dark:border-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <div className="flex-1 min-w-0 pr-2">
                  <div className="text-sm font-semibold truncate">{tone.name}</div>
                  <div
                    className={`text-xs truncate mt-0.5 ${
                      toneId === tone.id ? 'opacity-80' : 'text-neutral-500 dark:text-neutral-400'
                    }`}
                  >
                    {tone.description}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => handlePreviewTone(tone.id, e)}
                  className={`p-2 rounded-full transition-colors flex-shrink-0 cursor-pointer ${
                    toneId === tone.id
                      ? 'bg-white/10 dark:bg-neutral-900/10 hover:bg-white/25 dark:hover:bg-neutral-900/20 text-current'
                      : 'bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  <Volume2
                    className={`w-4 h-4 ${
                      previewingToneId === tone.id ? 'animate-bounce text-emerald-500' : ''
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Vibration Setting */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-805 border border-neutral-200/50 dark:border-neutral-800/50">
          <div>
            <div className="text-sm font-semibold">Device Vibration</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">Vibrate when ringing</div>
          </div>
          <button
            type="button"
            onClick={() => setVibration(!vibration)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              vibration ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-200 dark:bg-neutral-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-neutral-50 dark:bg-neutral-950 shadow ring-0 transition duration-200 ease-in-out ${
                vibration ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3 text-xs text-center font-medium rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              stopActiveSound();
              onCancel();
            }}
            className="flex-1 py-3.5 px-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 font-medium text-sm transition-all text-neutral-600 dark:text-neutral-300 cursor-pointer text-center"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-3.5 px-4 rounded-2xl bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-100 font-semibold text-sm text-white dark:text-neutral-950 transition-all shadow-sm cursor-pointer text-center"
          >
            Schedule Alarm
          </button>
        </div>
      </form>
    </div>
  );
}

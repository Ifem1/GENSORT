"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface TimerState {
  seconds: number;
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  formatted: string;
}

export function useTimer(autoStart = false): TimerState {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(autoStart);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else {
      stop();
    }
    return stop;
  }, [isRunning, stop]);

  const start = useCallback(() => {
    setSeconds(0);
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => setIsRunning(false), []);

  const resume = useCallback(() => setIsRunning(true), []);

  const reset = useCallback(() => {
    stop();
    setSeconds(0);
    setIsRunning(false);
  }, [stop]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const formatted = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  return { seconds, isRunning, start, pause, resume, reset, formatted };
}

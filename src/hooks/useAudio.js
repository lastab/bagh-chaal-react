import { useCallback, useEffect, useRef, useState } from 'react';

const SOUNDS = {
  bgm:     '/audio/bgm.wav',
  place:   '/audio/place.wav',
  move:    '/audio/move.wav',
  capture: '/audio/capture.wav',
  win:     '/audio/win.wav',
};

export function useAudio() {
  const [muted, setMuted] = useState(() => {
    try { return localStorage.getItem('audio-muted') === 'true'; } catch { return false; }
  });

  const bgmRef    = useRef(null);
  const mutedRef  = useRef(muted);
  mutedRef.current = muted;

  useEffect(() => {
    const audio = new Audio(SOUNDS.bgm);
    audio.loop   = true;
    audio.volume = 0.35;
    audio.muted  = mutedRef.current;
    bgmRef.current = audio;
    return () => { audio.pause(); audio.src = ''; };
  }, []);

  useEffect(() => {
    try { localStorage.setItem('audio-muted', muted); } catch { /* ignore */ }
    if (bgmRef.current) bgmRef.current.muted = muted;
  }, [muted]);

  const startBgm = useCallback(() => {
    const a = bgmRef.current;
    if (!a || a.readyState === 0) return;
    a.currentTime = 0;
    a.play().catch(() => {});
  }, []);

  const resumeBgm = useCallback(() => {
    bgmRef.current?.play().catch(() => {});
  }, []);

  const stopBgm = useCallback(() => {
    const a = bgmRef.current;
    if (!a) return;
    a.pause();
    a.currentTime = 0;
  }, []);

  const playSound = useCallback((name) => {
    if (mutedRef.current) return;
    const src = SOUNDS[name];
    if (!src) return;
    const a = new Audio(src);
    a.volume = 0.65;
    a.play().catch(() => {});
  }, []);

  const toggleMute = useCallback(() => setMuted(m => !m), []);

  return { muted, toggleMute, startBgm, resumeBgm, stopBgm, playSound };
}

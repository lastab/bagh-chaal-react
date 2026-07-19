import { useCallback, useEffect, useRef, useState } from 'react';

const SOUNDS = {
  bgm:     '/audio/bgm.wav',
  place:   '/audio/place.wav',
  move:    '/audio/move.wav',
  capture: '/audio/capture.wav',
  win:     '/audio/win.wav',
};

export function useAudio() {
  const [musicMuted, setMusicMuted] = useState(() => {
    try { return localStorage.getItem('audio-music-muted') === 'true'; } catch { return false; }
  });
  const [soundMuted, setSoundMuted] = useState(() => {
    try { return localStorage.getItem('audio-sound-muted') === 'true'; } catch { return false; }
  });

  const bgmRef        = useRef(null);
  const soundMutedRef = useRef(soundMuted);
  soundMutedRef.current = soundMuted;

  useEffect(() => {
    const audio = new Audio(SOUNDS.bgm);
    audio.loop   = true;
    audio.volume = 0.35;
    audio.muted  = musicMuted;
    bgmRef.current = audio;
    return () => { audio.pause(); audio.src = ''; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try { localStorage.setItem('audio-music-muted', musicMuted); } catch { /* ignore */ }
    if (bgmRef.current) bgmRef.current.muted = musicMuted;
  }, [musicMuted]);

  useEffect(() => {
    try { localStorage.setItem('audio-sound-muted', soundMuted); } catch { /* ignore */ }
  }, [soundMuted]);

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
    if (soundMutedRef.current) return;
    const src = SOUNDS[name];
    if (!src) return;
    const a = new Audio(src);
    a.volume = 0.65;
    a.play().catch(() => {});
  }, []);

  const toggleMusic = useCallback(() => setMusicMuted(m => !m), []);
  const toggleSound = useCallback(() => setSoundMuted(m => !m), []);

  return { musicMuted, soundMuted, toggleMusic, toggleSound, startBgm, resumeBgm, stopBgm, playSound };
}

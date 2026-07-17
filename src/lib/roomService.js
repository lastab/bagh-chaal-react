import { ref, set, get, update, onValue } from 'firebase/database';
import { db } from './firebase';
import { createInitialBoard } from '../utils/gameLogic';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O, 1/I

function generateCode() {
  return Array.from({ length: 6 }, () =>
    CHARS[Math.floor(Math.random() * CHARS.length)]
  ).join('');
}

const freshGameState = () => ({
  board: createInitialBoard().map(r => r.map(v => v ?? null)),
  turn: 'goat',
  phase: 'placement',
  goatsToPlace: 20,
  goatsCaptured: 0,
  winner: null,
  lastCapture: null,
});

export async function createRoom(hostSide) {
  const code = generateCode();
  await set(ref(db, `rooms/${code}`), {
    hostSide,
    guestSide: hostSide === 'goat' ? 'tiger' : 'goat',
    guestJoined: false,
    createdAt: Date.now(),
    gameState: freshGameState(),
  });
  return code;
}

export async function joinRoom(code) {
  const snap = await get(ref(db, `rooms/${code.toUpperCase()}`));
  if (!snap.exists()) throw new Error('Room not found — check the code.');
  const room = snap.val();
  if (room.guestJoined) throw new Error('Room is full.');
  await update(ref(db, `rooms/${code.toUpperCase()}`), { guestJoined: true });
  return { guestSide: room.guestSide };
}

export function watchRoom(code, onData) {
  return onValue(ref(db, `rooms/${code}`), snap => {
    if (snap.exists()) onData(snap.val());
  });
}

export async function pushGameState(code, gameState) {
  await set(ref(db, `rooms/${code}/gameState`), gameState);
}

export async function resetGame(code) {
  await set(ref(db, `rooms/${code}/gameState`), freshGameState());
}

import { ref, set, get, update, remove, onValue } from 'firebase/database';
import { db } from './firebase';
import { createInitialBoard } from '../utils/gameLogic';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const QUEUE_TTL = 90_000;

function genId()   { return Math.random().toString(36).slice(2, 10); }
function genCode() { return Array.from({ length: 6 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join(''); }

function freshGameState() {
  return {
    board: createInitialBoard().map(r => r.map(v => v ?? null)),
    turn: 'goat',
    phase: 'placement',
    goatsToPlace: 20,
    goatsCaptured: 0,
    winner: null,
    lastCapture: null,
  };
}

// Resolve sides for a match. Either player may be 'random'.
function resolveSides(mySide, oppSide) {
  if (mySide === 'random' && oppSide === 'random') {
    const a = Math.random() < 0.5 ? 'goat' : 'tiger';
    return { mine: a, theirs: a === 'goat' ? 'tiger' : 'goat' };
  }
  if (mySide === 'random') {
    return { mine: oppSide === 'goat' ? 'tiger' : 'goat', theirs: oppSide };
  }
  if (oppSide === 'random') {
    return { mine: mySide, theirs: mySide === 'goat' ? 'tiger' : 'goat' };
  }
  return { mine: mySide, theirs: oppSide };
}

// Returns { myId, roomCode, resolvedSide }
// resolvedSide is null while waiting in queue (for 'random' players)
export async function searchForMatch(mySide) {
  const myId = genId();
  const now  = Date.now();

  const snap = await get(ref(db, 'quickmatch'));
  let opponentKey   = null;
  let opponentSide  = null;

  if (snap.exists()) {
    snap.forEach(child => {
      if (opponentKey) return;
      const v = child.val();
      if (v.status !== 'searching' || now - v.createdAt >= QUEUE_TTL) return;

      // Can we pair with this entry?
      const canMatch =
        mySide   === 'random' ||
        v.side   === 'random' ||
        (mySide === 'goat'  && v.side === 'tiger') ||
        (mySide === 'tiger' && v.side === 'goat');

      if (canMatch) { opponentKey = child.key; opponentSide = v.side; }
    });
  }

  if (opponentKey) {
    const { mine, theirs } = resolveSides(mySide, opponentSide);
    const code = genCode();

    await set(ref(db, `rooms/${code}`), {
      hostSide: theirs,
      guestSide: mine,
      guestJoined: true,
      createdAt: now,
      gameState: freshGameState(),
    });

    // Tell the waiter their resolved side + room code
    await update(ref(db, `quickmatch/${opponentKey}`), {
      status: 'matched',
      roomCode: code,
      resolvedSide: theirs,
    });

    return { myId, roomCode: code, resolvedSide: mine };
  }

  // No match — join queue without a resolved side yet
  await set(ref(db, `quickmatch/${myId}`), {
    side: mySide,
    status: 'searching',
    roomCode: null,
    resolvedSide: null,
    createdAt: now,
  });
  return { myId, roomCode: null, resolvedSide: null };
}

export function watchQueueEntry(myId, onChange) {
  return onValue(ref(db, `quickmatch/${myId}`), snap => {
    if (snap.exists()) onChange(snap.val());
  });
}

export async function cancelSearch(myId) {
  await remove(ref(db, `quickmatch/${myId}`));
}

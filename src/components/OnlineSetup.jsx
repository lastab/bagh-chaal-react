import { useEffect, useState } from 'react';
import { createRoom, joinRoom, watchRoom } from '../lib/roomService';
import { isFirebaseConfigured } from '../lib/firebase';
import styles from './OnlineSetup.module.css';

// ── Top-level: choose Create or Join ─────────────────────────────────────────
export function OnlineSetup({ onSession, onBack }) {
  const [view, setView] = useState('choice'); // 'choice' | 'create' | 'join'

  if (!isFirebaseConfigured) {
    return (
      <div className={styles.overlay}>
        <div className={styles.panel}>
          <p className={styles.panelTitle}>Firebase not configured</p>
          <p className={styles.error}>
            Copy <code>.env.example</code> to <code>.env</code> and fill in your Firebase Realtime Database credentials to enable online play.
          </p>
          <button className={styles.backBtn} onClick={onBack}>← Back</button>
        </div>
      </div>
    );
  }

  if (view === 'create') return <CreateGame onSession={onSession} onBack={() => setView('choice')} />;
  if (view === 'join')   return <JoinGame   onSession={onSession} onBack={() => setView('choice')} />;

  return (
    <div className={styles.overlay}>
      <div className={styles.heading}>
        <h2 className={styles.title}>Play Online</h2>
        <p className={styles.sub}>Share a code with your friend</p>
      </div>

      <div className={styles.cards}>
        <button className={styles.card} onClick={() => setView('create')}>
          <span className={styles.cardIcon}>🏠</span>
          <span className={styles.cardLabel}>Create Game</span>
          <span className={styles.cardDesc}>Get a room code and wait for a friend</span>
        </button>
        <button className={styles.card} onClick={() => setView('join')}>
          <span className={styles.cardIcon}>🔗</span>
          <span className={styles.cardLabel}>Join Game</span>
          <span className={styles.cardDesc}>Enter a friend's room code</span>
        </button>
      </div>

      <button className={styles.backBtn} onClick={onBack}>← Back to mode select</button>
    </div>
  );
}

// ── Create flow ───────────────────────────────────────────────────────────────
function CreateGame({ onSession, onBack }) {
  const [side, setSide]         = useState('goat');
  const [status, setStatus]     = useState('idle'); // idle | creating | waiting
  const [roomCode, setRoomCode] = useState('');
  const [copied, setCopied]     = useState(false);
  const [error, setError]       = useState('');

  async function handleCreate() {
    setStatus('creating');
    setError('');
    try {
      const code = await createRoom(side);
      setRoomCode(code);
      setStatus('waiting');
    } catch (e) {
      setError(e.message);
      setStatus('idle');
    }
  }

  // Watch for guest joining
  useEffect(() => {
    if (status !== 'waiting' || !roomCode) return;
    const unsub = watchRoom(roomCode, room => {
      if (room.guestJoined) onSession(roomCode, side);
    });
    return unsub;
  }, [status, roomCode, side, onSession]);

  function copyCode() {
    navigator.clipboard.writeText(roomCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (status === 'waiting') {
    return (
      <div className={styles.overlay}>
        <div className={styles.waiting}>
          <p className={styles.waitingLabel}>Your room code</p>
          <div className={styles.roomCode} onClick={copyCode} title="Click to copy">
            {copied && <span className={styles.copied}>Copied!</span>}
            {roomCode}
          </div>
          <p className={styles.copyHint}>Click code to copy · Share it with your friend</p>
          <div className={styles.spinner} />
          <p className={styles.waitingText}>Waiting for opponent to join…</p>
          <p className={styles.waitingText} style={{ fontSize: '0.8rem', opacity: 0.6 }}>
            You play as <strong>{side === 'goat' ? '🐐 Goat' : '🐯 Tiger'}</strong>
          </p>
          <button className={styles.backBtn} onClick={onBack}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <p className={styles.panelTitle}>Create a Game</p>

        <p style={{ fontSize: '0.82rem', color: '#c8a96e', textAlign: 'center' }}>Choose your side</p>
        <div className={styles.sideRow}>
          <button
            className={`${styles.sideBtn} ${side === 'goat' ? styles.sideBtnActive : ''}`}
            onClick={() => setSide('goat')}
          >🐐 Goat</button>
          <button
            className={`${styles.sideBtn} ${side === 'tiger' ? styles.sideBtnActive : ''}`}
            onClick={() => setSide('tiger')}
          >🐯 Tiger</button>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button
          className={styles.actionBtn}
          onClick={handleCreate}
          disabled={status === 'creating'}
        >
          {status === 'creating' ? 'Creating…' : 'Create Room'}
        </button>
        <button className={styles.backBtn} onClick={onBack}>← Back</button>
      </div>
    </div>
  );
}

// ── Join flow ─────────────────────────────────────────────────────────────────
function JoinGame({ onSession, onBack }) {
  const [code, setCode]       = useState('');
  const [status, setStatus]   = useState('idle'); // idle | joining
  const [error, setError]     = useState('');

  async function handleJoin() {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 6) { setError('Room code must be 6 characters.'); return; }
    setStatus('joining');
    setError('');
    try {
      const { guestSide } = await joinRoom(trimmed);
      onSession(trimmed, guestSide);
    } catch (e) {
      setError(e.message);
      setStatus('idle');
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <p className={styles.panelTitle}>Join a Game</p>

        <input
          className={styles.codeInput}
          placeholder="Enter code"
          maxLength={6}
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && handleJoin()}
          autoFocus
          spellCheck={false}
        />

        {error && <p className={styles.error}>{error}</p>}

        <button
          className={styles.actionBtn}
          onClick={handleJoin}
          disabled={status === 'joining'}
        >
          {status === 'joining' ? 'Joining…' : 'Join Game'}
        </button>
        <button className={styles.backBtn} onClick={onBack}>← Back</button>
      </div>
    </div>
  );
}

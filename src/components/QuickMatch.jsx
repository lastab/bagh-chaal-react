import { useEffect, useRef, useState } from 'react';
import { searchForMatch, watchQueueEntry, cancelSearch } from '../lib/matchmaking';
import { isFirebaseConfigured } from '../lib/firebase';
import styles from './OnlineSetup.module.css';

export function QuickMatch({ onSession, onBack }) {
  const [stage, setStage] = useState('choose'); // 'choose' | 'searching'
  const [pick, setPick]   = useState('random'); // 'goat' | 'tiger' | 'random'
  const [error, setError] = useState('');
  const myIdRef  = useRef(null);
  const unsubRef = useRef(null);

  function cleanup() {
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
    if (myIdRef.current)  { cancelSearch(myIdRef.current); myIdRef.current = null; }
  }
  useEffect(() => cleanup, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function startSearch() {
    setStage('searching');
    setError('');

    try {
      const { myId, roomCode, resolvedSide } = await searchForMatch(pick);
      myIdRef.current = myId;

      if (roomCode) {
        // Matched immediately — side already resolved
        myIdRef.current = null;
        onSession(roomCode, resolvedSide);
        return;
      }

      // In queue — wait; side will be resolved when opponent joins
      unsubRef.current = watchQueueEntry(myId, (entry) => {
        if (entry.status === 'matched' && entry.roomCode && entry.resolvedSide) {
          cleanup();
          onSession(entry.roomCode, entry.resolvedSide);
        }
      });
    } catch (e) {
      setError(e.message || 'Failed to connect. Check your connection.');
      setStage('choose');
    }
  }

  async function handleCancel() {
    cleanup();
    onBack();
  }

  if (!isFirebaseConfigured) {
    return (
      <div className={styles.overlay}>
        <div className={styles.panel}>
          <p className={styles.panelTitle}>Firebase not configured</p>
          <p className={styles.error}>Set up your <code>.env</code> to enable online play.</p>
          <button className={styles.backBtn} onClick={onBack}>← Back</button>
        </div>
      </div>
    );
  }

  if (stage === 'searching') {
    return (
      <div className={styles.overlay}>
        <div className={styles.waiting}>
          <p className={styles.waitingLabel}>Quick Match</p>
          <div className={styles.spinner} />
          <p className={styles.waitingText}>
            {pick === 'random'
              ? 'Searching for any available player…'
              : `Looking for a ${pick === 'goat' ? '🐯 Tiger' : '🐐 Goat'} player…`}
          </p>
          {pick !== 'random' && (
            <p style={{ fontSize: '0.8rem', color: '#c8a96e' }}>
              You will play as <strong>{pick === 'goat' ? '🐐 Goat' : '🐯 Tiger'}</strong>
            </p>
          )}
          {pick === 'random' && (
            <p style={{ fontSize: '0.8rem', color: '#c8a96e' }}>
              Your side will be assigned when a match is found
            </p>
          )}
          {error && <p className={styles.error}>{error}</p>}
          <button className={styles.backBtn} onClick={handleCancel}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <p className={styles.panelTitle}>⚡ Quick Match</p>
        <p style={{ fontSize: '0.82rem', color: '#c8a96e', textAlign: 'center' }}>
          Pick your side — we'll find an opponent for you
        </p>

        <div className={styles.sideRow}>
          <button
            className={`${styles.sideBtn} ${pick === 'goat' ? styles.sideBtnActive : ''}`}
            onClick={() => setPick('goat')}
          >🐐 Goat</button>
          <button
            className={`${styles.sideBtn} ${pick === 'random' ? styles.sideBtnActive : ''}`}
            onClick={() => setPick('random')}
          >🎲 Random</button>
          <button
            className={`${styles.sideBtn} ${pick === 'tiger' ? styles.sideBtnActive : ''}`}
            onClick={() => setPick('tiger')}
          >🐯 Tiger</button>
        </div>

        {pick === 'random' && (
          <p style={{ fontSize: '0.75rem', color: '#c8a96e', textAlign: 'center', marginTop: -4 }}>
            Side assigned after finding a match — pairs with anyone
          </p>
        )}

        {error && <p className={styles.error}>{error}</p>}

        <button className={styles.actionBtn} onClick={startSearch}>
          Find Match
        </button>
        <button className={styles.backBtn} onClick={onBack}>← Back</button>
      </div>
    </div>
  );
}

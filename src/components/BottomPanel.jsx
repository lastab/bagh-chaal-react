import styles from './BottomPanel.module.css';

const TOTAL_GOATS = 20;

export function BottomPanel({ turn, phase, goatsToPlace, goatsCaptured, winner, onReset }) {
  const onBoard  = TOTAL_GOATS - goatsToPlace - goatsCaptured; // placed on board
  const inHand   = goatsToPlace;                               // not yet placed

  const statusText = () => {
    if (winner === 'tiger') return '🐯 Tigers win! 5 goats captured.';
    if (winner === 'goat')  return '🐐 Goats win! All tigers are trapped.';
    if (turn === 'goat' && phase === 'placement')
      return `🐐 Place a goat — ${goatsToPlace} remaining`;
    if (turn === 'goat') return '🐐 Move a goat';
    return '🐯 Tiger moves';
  };

  return (
    <footer className={styles.panel}>
      {/* Status row */}
      <div className={styles.topRow}>
        <span className={`${styles.status} ${winner ? styles.winStatus : ''}`}>
          {statusText()}
        </span>
        <button className={styles.resetBtn} onClick={onReset}>New Game</button>
      </div>

      {/* Goat icons row */}
      <div className={styles.goatRow}>
        {Array.from({ length: TOTAL_GOATS }, (_, i) => {
          let cls = styles.goatChip;
          if (i < goatsCaptured)                         cls += ` ${styles.captured}`;
          else if (i < goatsCaptured + onBoard)          cls += ` ${styles.onBoard}`;
          else                                            cls += ` ${styles.inHand}`;
          return (
            <span key={i} className={cls} title={
              i < goatsCaptured ? 'Captured' :
              i < goatsCaptured + onBoard ? 'On board' : 'In reserve'
            }>
              🐐
            </span>
          );
        })}
      </div>

      {/* Capture tracker */}
      <div className={styles.captureRow}>
        <span className={styles.captureLabel}>Captured:</span>
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={`${styles.capDot} ${i < goatsCaptured ? styles.capFilled : ''}`} />
        ))}
        <span className={styles.captureCount}>{goatsCaptured} / 5</span>
      </div>
    </footer>
  );
}

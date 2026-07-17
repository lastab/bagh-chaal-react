import styles from './GameInfo.module.css';

export function GameInfo({ turn, phase, goatsToPlace, goatsCaptured, winner, onReset }) {
  const statusMsg = () => {
    if (winner === 'tiger') return '🐯 Tigers win! 5 goats captured.';
    if (winner === 'goat')  return '🐐 Goats win! All tigers are trapped.';
    if (turn === 'goat' && phase === 'placement')
      return `🐐 Goat's turn — place a goat (${goatsToPlace} left)`;
    if (turn === 'goat') return '🐐 Goat\'s turn — move a goat';
    return '🐯 Tiger\'s turn — move or capture';
  };

  return (
    <div className={styles.panel}>
      <h1 className={styles.title}>Bāgh Chāl</h1>
      <p className={styles.subtitle}>Tigers &amp; Goats</p>

      <div className={styles.status + (winner ? ` ${styles.winner}` : '')}>
        {statusMsg()}
      </div>

      <div className={styles.scoreboard}>
        <div className={styles.scoreItem}>
          <span className={styles.scoreIcon}>🐐</span>
          <span className={styles.scoreLabel}>Captured</span>
          <span className={styles.scoreValue}>{goatsCaptured} / 5</span>
        </div>
        <div className={styles.divider} />
        <div className={styles.scoreItem}>
          <span className={styles.scoreIcon}>🐐</span>
          <span className={styles.scoreLabel}>To place</span>
          <span className={styles.scoreValue}>{goatsToPlace}</span>
        </div>
      </div>

      <button className={styles.resetBtn} onClick={onReset}>
        New Game
      </button>

      <details className={styles.rules}>
        <summary>How to play</summary>
        <div className={styles.rulesBody}>
          <p><strong>Goats</strong> place one goat per turn until all 20 are placed, then move along lines.</p>
          <p><strong>Tigers</strong> move along lines or jump over an adjacent goat to capture it.</p>
          <p><strong>Goats win</strong> by trapping all four tigers so they cannot move.</p>
          <p><strong>Tigers win</strong> by capturing 5 goats.</p>
          <p>Tap/click a piece to select it, then tap a green highlight to move.</p>
        </div>
      </details>
    </div>
  );
}

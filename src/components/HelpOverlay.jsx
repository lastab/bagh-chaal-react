import styles from './HelpOverlay.module.css';

export function HelpOverlay({ onClose }) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>How to Play</h2>
          <button className={styles.close} onClick={onClose}>✕</button>
        </div>
        <div className={styles.body}>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>🐐🐯 Overview</h3>
            <p>Bāgh Chāl is a traditional Nepali strategy game. <strong>4 tigers</strong> hunt goats while <strong>20 goats</strong> try to trap all tigers. Goats always move first.</p>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>🐐 Playing as Goat</h3>
            <p><strong>Phase 1 — Placement:</strong> Place one goat per turn on any empty intersection. Green dots show valid spots. All 20 goats must be placed before movement begins.</p>
            <p><strong>Phase 2 — Movement:</strong> Move one goat along a line to an adjacent empty intersection. Blue pulsing rings show which goats can move.</p>
            <p><strong>Win condition:</strong> Trap all 4 tigers so none of them can move.</p>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>🐯 Playing as Tiger</h3>
            <p><strong>Movement:</strong> Move along a line to an adjacent empty intersection.</p>
            <p><strong>Capture:</strong> Jump over an adjacent goat to the vacant spot beyond it — the goat is removed from the board.</p>
            <p><strong>Win condition:</strong> Capture 5 goats.</p>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>📐 The Board</h3>
            <p>5×5 grid with 25 intersections. Pieces move along the drawn lines. Diagonal moves are only available on intersections where both the row and column index are even (marked with diagonal lines).</p>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>🎮 Game Modes</h3>
            <ul className={styles.list}>
              <li><strong>2 Players</strong> — Pass the device between two players.</li>
              <li><strong>Play as Goat</strong> — You play goats; bot plays tigers. Choose Easy, Medium, or Hard.</li>
              <li><strong>Play as Tiger</strong> — You play tigers; bot plays goats. Choose Easy, Medium, or Hard.</li>
              <li><strong>Quick Match</strong> — Online matchmaking. Pick Goat, Tiger, or Random.</li>
              <li><strong>Private Match</strong> — Share a room code to play online with a friend.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

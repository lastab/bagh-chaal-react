import { useGameState } from './hooks/useGameState';
import { Board } from './components/Board';
import { BottomPanel } from './components/BottomPanel';
import styles from './App.module.css';

export default function App() {
  const {
    board, selected, validMoves, lastCapture,
    turn, phase, goatsToPlace, goatsCaptured, winner,
    handleClick, reset,
  } = useGameState();

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>Bāgh Chāl</h1>
        <span className={styles.subtitle}>Tigers &amp; Goats</span>
      </header>

      {/* gameArea switches between column (portrait) and row (landscape) */}
      <div className={styles.gameArea}>
        <main className={styles.boardArea}>
          <Board
            board={board}
            selected={selected}
            validMoves={validMoves}
            lastCapture={lastCapture}
            onPointClick={handleClick}
          />
        </main>

        <BottomPanel
          turn={turn}
          phase={phase}
          goatsToPlace={goatsToPlace}
          goatsCaptured={goatsCaptured}
          winner={winner}
          onReset={reset}
        />
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useGameState } from './hooks/useGameState';
import { Board } from './components/Board';
import { BottomPanel } from './components/BottomPanel';
import { ModeSelect } from './components/ModeSelect';
import { getBestTigerMove, getBestGoatPlacement, getBestGoatMove } from './utils/botLogic';
import styles from './App.module.css';

export default function App() {
  const {
    board, selected, validMoves, lastCapture,
    turn, phase, goatsToPlace, goatsCaptured, winner,
    handleClick, reset, botMove,
  } = useGameState();

  // null = show mode picker; one of '2player' | 'bot-tiger' | 'bot-goat'
  const [gameMode, setGameMode] = useState(null);

  const handleModeSelect = (mode) => {
    setGameMode(mode);
    reset();
  };

  const isBotTurn =
    (gameMode === 'bot-tiger' && turn === 'tiger') ||
    (gameMode === 'bot-goat'  && turn === 'goat');

  // Trigger bot move 480ms after each turn change
  useEffect(() => {
    if (!gameMode || gameMode === '2player' || winner || !isBotTurn) return;

    const timer = setTimeout(() => {
      if (turn === 'tiger') {
        const move = getBestTigerMove(board, goatsCaptured);
        if (move) botMove({ side: 'tiger', from: move.from, to: move.to });
      } else {
        if (phase === 'placement') {
          const pos = getBestGoatPlacement(board);
          if (pos) botMove({ side: 'goat', placement: pos });
        } else {
          const move = getBestGoatMove(board);
          if (move) botMove({ side: 'goat', from: move.from, to: move.to });
        }
      }
    }, 480);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn, phase, winner, gameMode]);

  const winnerInfo = winner === 'tiger'
    ? { emoji: '🐯', title: 'Tigers Win!', sub: '5 goats have been captured.' }
    : winner === 'goat'
    ? { emoji: '🐐', title: 'Goats Win!', sub: 'All tigers are trapped.' }
    : null;

  if (gameMode === null) {
    return <ModeSelect onSelect={handleModeSelect} />;
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>Bāgh Chāl</h1>
        <span className={styles.subtitle}>Tigers &amp; Goats</span>
      </header>

      <div className={styles.gameArea}>
        <main className={styles.boardArea}>
          <Board
            board={board}
            selected={selected}
            validMoves={validMoves}
            lastCapture={lastCapture}
            onPointClick={handleClick}
            isBotTurn={isBotTurn}
          />
        </main>

        <BottomPanel
          turn={turn}
          phase={phase}
          goatsToPlace={goatsToPlace}
          goatsCaptured={goatsCaptured}
          winner={winner}
          onReset={reset}
          onChangeMode={() => setGameMode(null)}
          isBotTurn={isBotTurn}
        />
      </div>

      {winnerInfo && (
        <div className={styles.winOverlay}>
          <div className={styles.winBanner}>
            <span className={styles.winEmoji}>{winnerInfo.emoji}</span>
            <h2 className={styles.winTitle}>{winnerInfo.title}</h2>
            <p className={styles.winSub}>{winnerInfo.sub}</p>
            <div className={styles.winActions}>
              <button className={styles.winPlayAgain} onClick={reset}>Play Again</button>
              <button className={styles.winChangeMode} onClick={() => setGameMode(null)}>Change Mode</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

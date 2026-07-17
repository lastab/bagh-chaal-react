import { useEffect, useState } from 'react';
import { useGameState } from './hooks/useGameState';
import { useOnlineGame } from './hooks/useOnlineGame';
import { Board } from './components/Board';
import { BottomPanel } from './components/BottomPanel';
import { ModeSelect } from './components/ModeSelect';
import { OnlineSetup } from './components/OnlineSetup';
import { getBestTigerMove, getBestGoatPlacement, getBestGoatMove } from './utils/botLogic';
import styles from './App.module.css';

export default function App() {
  // null = show mode picker; one of '2player' | 'bot-tiger' | 'bot-goat' | 'online'
  const [gameMode, setGameMode]         = useState(null);
  // { roomCode, mySide } when online mode is active
  const [onlineSession, setOnlineSession] = useState(null);

  const localGame  = useGameState();
  const onlineGame = useOnlineGame(onlineSession?.roomCode, onlineSession?.mySide);

  // Use the right game hook depending on mode
  const game = gameMode === 'online' ? onlineGame : localGame;
  const { board, selected, validMoves, lastCapture, turn, phase,
          goatsToPlace, goatsCaptured, winner, handleClick, reset, botMove } = game;

  const handleModeSelect = (mode) => {
    setGameMode(mode);
    setOnlineSession(null);
    localGame.reset();
  };

  const handleOnlineSession = (roomCode, mySide) => {
    setOnlineSession({ roomCode, mySide });
  };

  const isBotTurn =
    (gameMode === 'bot-tiger' && turn === 'tiger') ||
    (gameMode === 'bot-goat'  && turn === 'goat');

  // Trigger bot move 480ms after each turn change
  useEffect(() => {
    if (!gameMode || gameMode === '2player' || gameMode === 'online' || winner || !isBotTurn) return;

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

  // ── Routing ──────────────────────────────────────────────────────────────────
  if (gameMode === null) {
    return <ModeSelect onSelect={handleModeSelect} />;
  }

  if (gameMode === 'online' && !onlineSession) {
    return (
      <OnlineSetup
        onSession={handleOnlineSession}
        onBack={() => setGameMode(null)}
      />
    );
  }

  // Online: wait for opponent connection
  const isOnlineWaiting = gameMode === 'online' && !onlineGame.opponentConnected;

  // Online: block interaction when it's not my turn
  const isMyTurn = gameMode !== 'online' || turn === onlineSession?.mySide;

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>Bāgh Chāl</h1>
        <span className={styles.subtitle}>
          {gameMode === 'online'
            ? `You: ${onlineSession?.mySide === 'goat' ? '🐐 Goat' : '🐯 Tiger'} · Room: ${onlineSession?.roomCode}`
            : 'Tigers & Goats'}
        </span>
      </header>

      <div className={styles.gameArea}>
        <main className={styles.boardArea}>
          <Board
            board={board}
            selected={selected}
            validMoves={validMoves}
            lastCapture={lastCapture}
            onPointClick={handleClick}
            isBotTurn={isBotTurn || !isMyTurn || isOnlineWaiting}
          />
        </main>

        <BottomPanel
          turn={turn}
          phase={phase}
          goatsToPlace={goatsToPlace}
          goatsCaptured={goatsCaptured}
          winner={winner}
          onReset={reset}
          onChangeMode={() => { setGameMode(null); setOnlineSession(null); }}
          isBotTurn={isBotTurn}
          isOnlineWaiting={isOnlineWaiting}
          isMyTurn={isMyTurn}
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
              <button className={styles.winChangeMode} onClick={() => { setGameMode(null); setOnlineSession(null); }}>Change Mode</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

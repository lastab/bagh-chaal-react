import { useEffect, useState } from 'react';
import { useGameState } from './hooks/useGameState';
import { useOnlineGame } from './hooks/useOnlineGame';
import { Board } from './components/Board';
import { BottomPanel } from './components/BottomPanel';
import { ModeSelect } from './components/ModeSelect';
import { OnlineSetup } from './components/OnlineSetup';
import { QuickMatch } from './components/QuickMatch';
import { getBestTigerMove, getBestGoatPlacement, getBestGoatMove } from './utils/botLogic';
import { forfeitGame } from './lib/roomService';
import styles from './App.module.css';

export default function App() {
  // null = show mode picker; one of '2player' | 'bot-tiger' | 'bot-goat' | 'online'
  const [gameMode, setGameMode]             = useState(null);
  const [onlineSession, setOnlineSession]   = useState(null);
  const [showSideBanner, setShowSideBanner] = useState(false);
  const [showTurnBanner, setShowTurnBanner] = useState(false);
  const [quitTarget, setQuitTarget]         = useState(null); // 'reset' | 'mode' | null

  const isOnlineMode = gameMode === 'quick-match' || gameMode === 'private-match';

  const localGame  = useGameState();
  const onlineGame = useOnlineGame(onlineSession?.roomCode, onlineSession?.mySide);

  // Use the right game hook depending on mode
  const game = isOnlineMode ? onlineGame : localGame;
  const { board, selected, validMoves, lastCapture, turn, phase,
          goatsToPlace, goatsCaptured, winner, forfeitedBy, handleClick, reset, botMove } = game;

  const handleModeSelect = (mode) => {
    setGameMode(mode);
    setOnlineSession(null);
    localGame.reset();
    // Show banner for local modes immediately (no setup screen)
    if (mode === '2player' || mode === 'bot-tiger' || mode === 'bot-goat') {
      setShowSideBanner(true);
    }
  };

  const handleOnlineSession = (roomCode, mySide) => {
    setOnlineSession({ roomCode, mySide });
    setShowSideBanner(true);
  };

  const isBotTurn =
    (gameMode === 'bot-tiger' && turn === 'tiger') ||
    (gameMode === 'bot-goat'  && turn === 'goat');

  // Show "Your Turn" banner when it becomes local player's turn online
  useEffect(() => {
    if (!isOnlineMode || !onlineSession || winner) return;
    if (turn === onlineSession.mySide) {
      setShowTurnBanner(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn, winner]);

  // Trigger bot move 480ms after each turn change
  useEffect(() => {
    if (!gameMode || gameMode === '2player' || isOnlineMode || winner || !isBotTurn) return;

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

  // Auto-redirect to Quick Match when opponent leaves
  useEffect(() => {
    const opponentLeft = forfeitedBy && forfeitedBy !== onlineSession?.mySide;
    if (!opponentLeft || gameMode !== 'quick-match') return;
    const timer = setTimeout(() => setOnlineSession(null), 2500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forfeitedBy]);

  // Game is in progress when at least one move has been made and not yet won
  const gameInProgress = !winner && goatsToPlace < 20;

  function requestQuit(target) {
    if (gameInProgress) {
      setQuitTarget(target);
    } else {
      confirmQuit(target);
    }
  }

  async function confirmQuit(target) {
    setQuitTarget(null);
    if (isOnlineMode && onlineSession) {
      await forfeitGame(onlineSession.roomCode, onlineSession.mySide);
    }
    if (target === 'reset' && gameMode === 'quick-match') {
      setOnlineSession(null); // go back to matchmaking
    } else if (target === 'reset') {
      reset();
    } else {
      setGameMode(null);
      setOnlineSession(null);
    }
  }

  const sideBannerInfo = (() => {
    if (gameMode === 'quick-match' || gameMode === 'private-match') {
      const s = onlineSession?.mySide;
      return s === 'goat'
        ? { emoji: '🐐', title: 'You are Goat', sub: 'Place goats and trap all 4 tigers to win' }
        : s === 'tiger'
        ? { emoji: '🐯', title: 'You are Tiger', sub: 'Capture 5 goats to win' }
        : null;
    }
    if (gameMode === 'bot-tiger') return { emoji: '🐐', title: 'You are Goat', sub: 'Trap all tigers to win · Bot plays Tiger' };
    if (gameMode === 'bot-goat')  return { emoji: '🐯', title: 'You are Tiger', sub: 'Capture 5 goats to win · Bot plays Goat' };
    if (gameMode === '2player')   return { emoji: '🐐🐯', title: 'Pass & Play', sub: 'Goats go first — place your pieces' };
    return null;
  })();

  const winnerInfo = (() => {
    if (!winner) return null;
    const opponentLeft = forfeitedBy && forfeitedBy !== onlineSession?.mySide;
    const iWon = !isOnlineMode || winner === onlineSession?.mySide;
    const redirectNote = opponentLeft && iWon && gameMode === 'quick-match' ? ' Returning to matchmaking…' : '';
    if (winner === 'tiger') return {
      emoji: '🐯',
      title: opponentLeft ? (iWon ? 'Opponent Left' : 'You Left') : 'Tigers Win!',
      sub: opponentLeft
        ? (iWon ? `Your opponent left. Tigers win by default.${redirectNote}` : 'You forfeited. Goats win by default.')
        : '5 goats have been captured.',
    };
    return {
      emoji: '🐐',
      title: opponentLeft ? (iWon ? 'Opponent Left' : 'You Left') : 'Goats Win!',
      sub: opponentLeft
        ? (iWon ? `Your opponent left. Goats win by default.${redirectNote}` : 'You forfeited. Tigers win by default.')
        : 'All tigers are trapped.',
    };
  })();

  // ── Routing ──────────────────────────────────────────────────────────────────
  if (gameMode === null) {
    return <ModeSelect onSelect={handleModeSelect} />;
  }

  if (gameMode === 'quick-match' && !onlineSession) {
    return <QuickMatch onSession={handleOnlineSession} onBack={() => setGameMode(null)} />;
  }

  if (gameMode === 'private-match' && !onlineSession) {
    return <OnlineSetup onSession={handleOnlineSession} onBack={() => setGameMode(null)} />;
  }

  // Online: wait for opponent connection
  const isOnlineWaiting = isOnlineMode && !onlineGame.opponentConnected;

  // Online: block interaction when it's not my turn
  const isMyTurn = !isOnlineMode || turn === onlineSession?.mySide;

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>Bāgh Chāl</h1>
        <span className={styles.subtitle}>
          {isOnlineMode
            ? `${onlineSession?.mySide === 'goat' ? '🐐 Goat' : '🐯 Tiger'} · ${gameMode === 'quick-match' ? '⚡ Quick Match' : `🔒 ${onlineSession?.roomCode}`}`
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
          onReset={() => requestQuit('reset')}
          onChangeMode={() => requestQuit('mode')}
          isBotTurn={isBotTurn}
          isOnlineWaiting={isOnlineWaiting}
          isMyTurn={isMyTurn}
        />
      </div>

      {showSideBanner && sideBannerInfo && (
        <div className={styles.sideBannerOverlay} onClick={() => setShowSideBanner(false)}>
          <div className={styles.sideBannerCard} onAnimationEnd={() => setShowSideBanner(false)}>
            <span className={styles.sideBannerEmoji}>{sideBannerInfo.emoji}</span>
            <span className={styles.sideBannerTitle}>{sideBannerInfo.title}</span>
            <span className={styles.sideBannerSub}>{sideBannerInfo.sub}</span>
            <span className={styles.sideBannerHint}>Tap to dismiss</span>
          </div>
        </div>
      )}

      {quitTarget && (
        <div className={styles.quitOverlay}>
          <div className={styles.quitDialog}>
            <span className={styles.quitEmoji}>⚠️</span>
            <p className={styles.quitTitle}>
              {quitTarget === 'reset' ? 'Start a new game?' : 'Leave this game?'}
            </p>
            <p className={styles.quitSub}>
              {isOnlineMode
                ? 'Your opponent will be notified and wins by default.'
                : 'Your current game progress will be lost.'}
            </p>
            <div className={styles.quitActions}>
              <button className={styles.quitConfirm} onClick={() => confirmQuit(quitTarget)}>
                {quitTarget === 'reset'
                  ? (gameMode === 'quick-match' ? 'Find New Match' : 'New Game')
                  : 'Leave'}
              </button>
              <button className={styles.quitCancel} onClick={() => setQuitTarget(null)}>
                Stay
              </button>
            </div>
          </div>
        </div>
      )}

      {showTurnBanner && isOnlineMode && !winner && (
        <div className={styles.turnBannerWrap} onClick={() => setShowTurnBanner(false)}>
          <div className={styles.turnBanner} onAnimationEnd={() => setShowTurnBanner(false)}>
            {onlineSession?.mySide === 'goat' ? '🐐' : '🐯'} Your Turn
          </div>
        </div>
      )}

      {winnerInfo && (
        <div className={styles.winOverlay}>
          <div className={styles.winBanner}>
            <span className={styles.winEmoji}>{winnerInfo.emoji}</span>
            <h2 className={styles.winTitle}>{winnerInfo.title}</h2>
            <p className={styles.winSub}>{winnerInfo.sub}</p>
            <div className={styles.winActions}>
              <button className={styles.winPlayAgain} onClick={() => {
                if (gameMode === 'quick-match') setOnlineSession(null);
                else reset();
              }}>
                {gameMode === 'quick-match' ? 'Find New Match' : 'Play Again'}
              </button>
              <button className={styles.winChangeMode} onClick={() => { setGameMode(null); setOnlineSession(null); }}>Change Mode</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

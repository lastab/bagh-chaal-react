import { useCallback, useEffect, useRef, useState } from 'react';
import { createInitialBoard, getTigerMoves, getGoatMoves, areTigersBlocked } from '../utils/gameLogic';
import { watchRoom, pushGameState } from '../lib/roomService';

// Firebase can return board rows as objects instead of arrays; normalize back.
function normalizeBoard(raw) {
  return Array.from({ length: 5 }, (_, r) =>
    Array.from({ length: 5 }, (_, c) => (raw?.[r]?.[c] ?? null))
  );
}

const INITIAL_SYNCED = {
  board: createInitialBoard(),
  turn: 'goat',
  phase: 'placement',
  goatsToPlace: 20,
  goatsCaptured: 0,
  winner: null,
  lastCapture: null,
};

export function useOnlineGame(roomCode, mySide) {
  const [synced, setSynced]       = useState(INITIAL_SYNCED);
  const [selected, setSelected]   = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [opponentConnected, setOpponentConnected] = useState(false);

  // Keep a ref to the latest synced state so async callbacks don't close over stale values
  const syncedRef = useRef(synced);
  useEffect(() => { syncedRef.current = synced; }, [synced]);

  // Subscribe to Firebase room
  useEffect(() => {
    if (!roomCode || !mySide) return;
    const unsub = watchRoom(roomCode, room => {
      setOpponentConnected(room.guestJoined ?? false);
      if (room.gameState) {
        const board = normalizeBoard(room.gameState.board);
        setSynced({ ...room.gameState, board });
        setSelected(null);
        setValidMoves([]);
      }
    });
    return unsub;
  }, [roomCode, mySide]);

  const push = useCallback(async (newState) => {
    await pushGameState(roomCode, {
      ...newState,
      board: newState.board.map(r => r.map(v => v ?? null)),
    });
  }, [roomCode]);

  const handleClick = useCallback(async (row, col) => {
    const state = syncedRef.current;
    if (state.winner) return;
    if (state.turn !== mySide) return; // not my turn

    const { board, phase, turn } = state;

    // ── GOAT TURN ──────────────────────────────────────────────────────
    if (turn === 'goat') {
      if (phase === 'placement') {
        if (board[row][col] !== null) return;
        const nb = board.map(r => [...r]);
        nb[row][col] = 'goat';
        const goatsToPlace = state.goatsToPlace - 1;
        const winner = areTigersBlocked(nb) ? 'goat' : null;
        await push({ board: nb, turn: winner ? 'goat' : 'tiger', phase: goatsToPlace === 0 ? 'movement' : 'placement', goatsToPlace, goatsCaptured: state.goatsCaptured, winner, lastCapture: null });
        return;
      }

      if (selected) {
        const move = validMoves.find(m => m.row === row && m.col === col);
        if (move) {
          const nb = board.map(r => [...r]);
          nb[selected.row][selected.col] = null;
          nb[row][col] = 'goat';
          const winner = areTigersBlocked(nb) ? 'goat' : null;
          setSelected(null); setValidMoves([]);
          await push({ board: nb, turn: winner ? 'goat' : 'tiger', phase, goatsToPlace: state.goatsToPlace, goatsCaptured: state.goatsCaptured, winner, lastCapture: null });
          return;
        }
        if (board[row][col] === 'goat') {
          setSelected({ row, col });
          setValidMoves(getGoatMoves(board, row, col));
          return;
        }
        setSelected(null); setValidMoves([]);
        return;
      }

      if (board[row][col] === 'goat') {
        setSelected({ row, col });
        setValidMoves(getGoatMoves(board, row, col));
      }
      return;
    }

    // ── TIGER TURN ─────────────────────────────────────────────────────
    if (selected) {
      const move = validMoves.find(m => m.row === row && m.col === col);
      if (move) {
        const nb = board.map(r => [...r]);
        nb[selected.row][selected.col] = null;
        nb[row][col] = 'tiger';
        let goatsCaptured = state.goatsCaptured;
        let lastCapture = null;
        if (move.capture) {
          nb[move.capture.row][move.capture.col] = null;
          goatsCaptured++;
          lastCapture = move.capture;
        }
        const winner = goatsCaptured >= 5 ? 'tiger' : null;
        setSelected(null); setValidMoves([]);
        await push({ board: nb, turn: winner ? 'tiger' : 'goat', phase, goatsToPlace: state.goatsToPlace, goatsCaptured, winner, lastCapture });
        return;
      }
      if (board[row][col] === 'tiger') {
        setSelected({ row, col });
        setValidMoves(getTigerMoves(board, row, col));
        return;
      }
      setSelected(null); setValidMoves([]);
      return;
    }

    if (board[row][col] === 'tiger') {
      setSelected({ row, col });
      setValidMoves(getTigerMoves(board, row, col));
    }
  }, [mySide, selected, validMoves, push]);

  const reset = useCallback(async () => {
    const nb = createInitialBoard();
    await push({ board: nb, turn: 'goat', phase: 'placement', goatsToPlace: 20, goatsCaptured: 0, winner: null, lastCapture: null });
  }, [push]);

  return {
    ...synced,
    selected,
    validMoves,
    handleClick,
    reset,
    botMove: () => {},
    opponentConnected,
    mySide,
  };
}

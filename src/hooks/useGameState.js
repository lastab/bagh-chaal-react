import { useCallback, useReducer } from 'react';
import {
  createInitialBoard,
  getTigerMoves,
  getGoatMoves,
  areTigersBlocked,
} from '../utils/gameLogic';

const INITIAL_STATE = {
  board: createInitialBoard(),
  turn: 'goat',
  phase: 'placement', // 'placement' | 'movement'
  goatsToPlace: 20,
  goatsCaptured: 0,
  selected: null,      // { row, col }
  validMoves: [],
  winner: null,        // 'tiger' | 'goat' | null
  lastCapture: null,   // { row, col } – briefly flash captured goat
};

function reducer(state, action) {
  switch (action.type) {
    case 'RESET':
      return { ...INITIAL_STATE, board: createInitialBoard() };

    case 'CLICK': {
      const { row, col } = action;
      if (state.winner) return state;

      // ── GOAT TURN ────────────────────────────────────────────────────
      if (state.turn === 'goat') {
        // Phase 1: place a new goat
        if (state.phase === 'placement') {
          if (state.board[row][col] !== null) return state;
          const board = state.board.map(r => [...r]);
          board[row][col] = 'goat';
          const goatsToPlace = state.goatsToPlace - 1;
          const phase = goatsToPlace === 0 ? 'movement' : 'placement';
          const winner = areTigersBlocked(board) ? 'goat' : null;
          return { ...state, board, goatsToPlace, phase, winner, turn: winner ? 'goat' : 'tiger', selected: null, validMoves: [], lastCapture: null };
        }

        // Phase 2: move an existing goat
        if (state.selected) {
          const move = state.validMoves.find(m => m.row === row && m.col === col);
          if (move) {
            const board = state.board.map(r => [...r]);
            board[state.selected.row][state.selected.col] = null;
            board[row][col] = 'goat';
            const winner = areTigersBlocked(board) ? 'goat' : null;
            return { ...state, board, winner, turn: winner ? 'goat' : 'tiger', selected: null, validMoves: [], lastCapture: null };
          }
          if (state.board[row][col] === 'goat') {
            const validMoves = getGoatMoves(state.board, row, col);
            return { ...state, selected: { row, col }, validMoves };
          }
          return { ...state, selected: null, validMoves: [] };
        }

        if (state.board[row][col] === 'goat') {
          const validMoves = getGoatMoves(state.board, row, col);
          return { ...state, selected: { row, col }, validMoves };
        }
        return state;
      }

      // ── TIGER TURN ───────────────────────────────────────────────────
      if (state.selected) {
        const move = state.validMoves.find(m => m.row === row && m.col === col);
        if (move) {
          const board = state.board.map(r => [...r]);
          board[state.selected.row][state.selected.col] = null;
          board[row][col] = 'tiger';
          let goatsCaptured = state.goatsCaptured;
          let lastCapture = null;
          if (move.capture) {
            board[move.capture.row][move.capture.col] = null;
            goatsCaptured++;
            lastCapture = move.capture;
          }
          const winner = goatsCaptured >= 5 ? 'tiger' : null;
          return { ...state, board, goatsCaptured, winner, turn: winner ? 'tiger' : 'goat', selected: null, validMoves: [], lastCapture };
        }
        if (state.board[row][col] === 'tiger') {
          const validMoves = getTigerMoves(state.board, row, col);
          return { ...state, selected: { row, col }, validMoves };
        }
        return { ...state, selected: null, validMoves: [] };
      }

      if (state.board[row][col] === 'tiger') {
        const validMoves = getTigerMoves(state.board, row, col);
        return { ...state, selected: { row, col }, validMoves };
      }
      return state;
    }

    default:
      return state;
  }
}

export function useGameState() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  const handleClick = useCallback((row, col) => {
    dispatch({ type: 'CLICK', row, col });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return { ...state, handleClick, reset };
}

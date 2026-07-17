import { getTigerMoves, getGoatMoves, isValid } from './gameLogic';

const clone = board => board.map(row => [...row]);

// ── Shared helpers ────────────────────────────────────────────────────────────

function tigerMobility(board) {
  let moves = 0, captures = 0;
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (board[r][c] === 'tiger') {
        const ms = getTigerMoves(board, r, c);
        moves += ms.length;
        captures += ms.filter(m => m.capture).length;
      }
    }
  }
  return { moves, captures };
}

function isGoatThreatened(board, gr, gc) {
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (board[r][c] === 'tiger') {
        if (getTigerMoves(board, r, c).some(
          m => m.capture && m.capture.row === gr && m.capture.col === gc
        )) return true;
      }
    }
  }
  return false;
}

function pickTopN(scored, n, tolerance) {
  const best = scored[0].score;
  const topN = scored.filter(s => s.score >= best - tolerance).slice(0, n);
  return topN[Math.floor(Math.random() * topN.length)];
}

// ── Tiger bot ─────────────────────────────────────────────────────────────────

function scoreTigerMove(board, from, to) {
  const b = clone(board);
  b[from.r][from.c] = null;
  b[to.row][to.col] = 'tiger';
  if (to.capture) b[to.capture.row][to.capture.col] = null;

  const { moves, captures } = tigerMobility(b);
  let score = 0;

  if (to.capture) score += 10000;
  score += captures * 600;
  score += moves * 8;

  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (b[r][c] === 'goat') {
        const dist = Math.abs(to.row - r) + Math.abs(to.col - c);
        score += Math.max(0, 5 - dist) * 15;
      }
    }
  }

  return score;
}

export function getBestTigerMove(board, goatsCaptured) {
  const allMoves = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (board[r][c] === 'tiger') {
        getTigerMoves(board, r, c).forEach(to =>
          allMoves.push({ from: { r, c }, to })
        );
      }
    }
  }
  if (!allMoves.length) return null;

  const scored = allMoves
    .map(m => ({ m, score: scoreTigerMove(board, m.from, m.to) }))
    .sort((a, b) => b.score - a.score);

  return pickTopN(scored, 3, 80).m;
}

// ── Goat bot ──────────────────────────────────────────────────────────────────

function scoreGoatPlacement(board, pos) {
  const b = clone(board);
  b[pos.r][pos.c] = 'goat';

  let score = 0;

  if (isGoatThreatened(b, pos.r, pos.c)) score -= 1200;

  score += (4 - (Math.abs(pos.r - 2) + Math.abs(pos.c - 2))) * 12;

  const dirs8 = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
  for (const [dr, dc] of dirs8) {
    const nr = pos.r + dr, nc = pos.c + dc;
    if (isValid(nr, nc)) {
      if (board[nr][nc] === 'goat')  score += 18;
      if (board[nr][nc] === 'tiger') score -= 12;
    }
  }

  const { moves, captures } = tigerMobility(b);
  score -= captures * 35;
  score -= moves * 3;

  return score;
}

export function getBestGoatPlacement(board) {
  const candidates = [];
  for (let r = 0; r < 5; r++)
    for (let c = 0; c < 5; c++)
      if (board[r][c] === null) candidates.push({ r, c });

  if (!candidates.length) return null;

  const scored = candidates
    .map(pos => ({ pos, score: scoreGoatPlacement(board, pos) }))
    .sort((a, b) => b.score - a.score);

  return pickTopN(scored, 3, 50).pos;
}

function scoreGoatMove(board, from, to) {
  const b = clone(board);
  b[from.r][from.c] = null;
  b[to.row][to.col] = 'goat';

  let score = 0;

  if (isGoatThreatened(board, from.r, from.c)) score += 600;
  if (isGoatThreatened(b, to.row, to.col)) score -= 900;

  const { moves, captures } = tigerMobility(b);
  score -= captures * 50;
  score -= moves * 6;

  score += (4 - (Math.abs(to.row - 2) + Math.abs(to.col - 2))) * 5;

  return score;
}

export function getBestGoatMove(board) {
  const allMoves = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (board[r][c] === 'goat') {
        getGoatMoves(board, r, c).forEach(to =>
          allMoves.push({ from: { r, c }, to })
        );
      }
    }
  }
  if (!allMoves.length) return null;

  const scored = allMoves
    .map(m => ({ m, score: scoreGoatMove(board, m.from, m.to) }))
    .sort((a, b) => b.score - a.score);

  return pickTopN(scored, 3, 80).m;
}

// Bāgh Chāl movement rule:
// - Every point moves orthogonally (4 directions)
// - ONLY points where (row+col) is EVEN also move diagonally (4 more directions)
// This means each cell of the grid has exactly ONE diagonal line, alternating direction.

const ORTHOGONAL = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const DIAGONAL   = [[-1,-1], [-1, 1], [1, -1], [1,  1]];

const getDirs = (r, c) =>
  (r + c) % 2 === 0 ? [...ORTHOGONAL, ...DIAGONAL] : ORTHOGONAL;

export const isValid = (r, c) => r >= 0 && r < 5 && c >= 0 && c < 5;

export const createInitialBoard = () => {
  const b = Array.from({ length: 5 }, () => Array(5).fill(null));
  b[0][0] = 'tiger';
  b[0][4] = 'tiger';
  b[4][0] = 'tiger';
  b[4][4] = 'tiger';
  return b;
};

export const getTigerMoves = (board, r, c) => {
  const moves = [];
  for (const [dr, dc] of getDirs(r, c)) {
    const nr = r + dr;
    const nc = c + dc;
    if (!isValid(nr, nc)) continue;
    if (board[nr][nc] === null) {
      moves.push({ row: nr, col: nc, capture: null });
    } else if (board[nr][nc] === 'goat') {
      const jr = nr + dr;
      const jc = nc + dc;
      if (isValid(jr, jc) && board[jr][jc] === null) {
        moves.push({ row: jr, col: jc, capture: { row: nr, col: nc } });
      }
    }
  }
  return moves;
};

export const getGoatMoves = (board, r, c) => {
  const moves = [];
  for (const [dr, dc] of getDirs(r, c)) {
    const nr = r + dr;
    const nc = c + dc;
    if (isValid(nr, nc) && board[nr][nc] === null) {
      moves.push({ row: nr, col: nc });
    }
  }
  return moves;
};

export const areTigersBlocked = (board) => {
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (board[r][c] === 'tiger' && getTigerMoves(board, r, c).length > 0) return false;
    }
  }
  return true;
};

// All unique edges — automatically correct because getDirs respects parity.
export const getBoardEdges = () => {
  const edges = [];
  const seen = new Set();
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      for (const [dr, dc] of getDirs(r, c)) {
        const nr = r + dr;
        const nc = c + dc;
        if (!isValid(nr, nc)) continue;
        const a = r * 5 + c;
        const b = nr * 5 + nc;
        const key = `${Math.min(a, b)}-${Math.max(a, b)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        edges.push({ r1: r, c1: c, r2: nr, c2: nc });
      }
    }
  }
  return edges;
};

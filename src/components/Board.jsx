import { useEffect, useMemo, useRef, useState } from 'react';
import { getBoardEdges } from '../utils/gameLogic';

const CELL = 84;
const PAD  = 52;
const SIZE = 4 * CELL + 2 * PAD; // 440
const EDGES = getBoardEdges();

const xy = (r, c) => ({ x: PAD + c * CELL, y: PAD + r * CELL });

// Assign stable IDs to pieces across frames.
// Strategy: exact-position matches first (stationary pieces), then greedy distance for movers.
// This prevents a nearby stationary piece from stealing the identity of an actual mover.
function diffPieces(prev, board, counter) {
  const next = [];
  board.forEach((row, r) => row.forEach((cell, c) => {
    if (cell) next.push({ type: cell, row: r, col: c });
  }));

  const usedPrevIdx = new Set();
  const usedNextIdx = new Set();
  const live = new Array(next.length).fill(null);
  const isNew = new Set();

  // Pass 1: lock in pieces that haven't moved (distance = 0)
  for (let ni = 0; ni < next.length; ni++) {
    const pos = next[ni];
    for (let pi = 0; pi < prev.length; pi++) {
      if (usedPrevIdx.has(pi)) continue;
      if (prev[pi].type === pos.type && prev[pi].row === pos.row && prev[pi].col === pos.col) {
        live[ni] = { ...prev[pi] };
        usedPrevIdx.add(pi);
        usedNextIdx.add(ni);
        break;
      }
    }
  }

  // Pass 2: match remaining next positions (move destinations) to remaining prev pieces (move sources)
  for (let ni = 0; ni < next.length; ni++) {
    if (usedNextIdx.has(ni)) continue;
    const pos = next[ni];
    let bestPi = -1, bestDist = Infinity;
    for (let pi = 0; pi < prev.length; pi++) {
      if (usedPrevIdx.has(pi) || prev[pi].type !== pos.type) continue;
      const d = Math.abs(prev[pi].row - pos.row) + Math.abs(prev[pi].col - pos.col);
      if (d < bestDist) { bestPi = pi; bestDist = d; }
    }
    if (bestPi >= 0) {
      live[ni] = { ...prev[bestPi], row: pos.row, col: pos.col };
      usedPrevIdx.add(bestPi);
    } else {
      const id = ++counter.current;
      live[ni] = { id, type: pos.type, row: pos.row, col: pos.col };
      isNew.add(id);
    }
  }

  return { live: live.filter(Boolean), isNew };
}

export function Board({
  board, selected, validMoves, lastCapture,
  movablePieces = [], placementMode = false,
  onPointClick, isBotTurn,
}) {
  const validSet = useMemo(
    () => new Set(validMoves.map(m => `${m.row},${m.col}`)),
    [validMoves],
  );
  const movableSet = useMemo(
    () => new Set((movablePieces || []).map(m => `${m.row},${m.col}`)),
    [movablePieces],
  );

  // ── Piece identity tracking ────────────────────────────────────────────────
  const idCounter    = useRef(0);
  const prevPieces   = useRef([]);
  const boardRef     = useRef(null);
  const diffCache    = useRef({ live: [], isNew: new Set() });
  const captorIdRef  = useRef(null);

  // Run diff only when board reference changes (avoids StrictMode double-run issues)
  if (boardRef.current !== board) {
    const oldPieces = prevPieces.current;
    boardRef.current = board;
    const result = diffPieces(oldPieces, board, idCounter);
    prevPieces.current = result.live;
    diffCache.current  = result;

    // Track which tiger moved — compare old vs new positions by stable ID
    captorIdRef.current = null;
    for (const piece of result.live) {
      if (piece.type !== 'tiger') continue;
      const prev = oldPieces.find(p => p.id === piece.id);
      if (prev && (prev.row !== piece.row || prev.col !== piece.col)) {
        captorIdRef.current = piece.id;
        break;
      }
    }
  }
  const { live: pieces, isNew } = diffCache.current;

  // ── Captured-goat animation ────────────────────────────────────────────────
  const [dyingAt, setDyingAt] = useState(null);
  const [pouncingId, setPouncingId] = useState(null);
  const prevCapture = useRef(null);

  useEffect(() => {
    if (!lastCapture) return;
    if (
      prevCapture.current?.row === lastCapture.row &&
      prevCapture.current?.col === lastCapture.col
    ) return;
    prevCapture.current = lastCapture;
    setDyingAt({ ...lastCapture });
    const dt = setTimeout(() => setDyingAt(null), 420);

    if (captorIdRef.current !== null) {
      setPouncingId(captorIdRef.current);
      const pt = setTimeout(() => setPouncingId(null), 500);
      return () => { clearTimeout(dt); clearTimeout(pt); };
    }

    return () => clearTimeout(dt);
  }, [lastCapture]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      style={{
        display: 'block',
        cursor: isBotTurn ? 'wait' : 'default',
        pointerEvents: isBotTurn ? 'none' : 'auto',
      }}
      aria-label="Bāgh Chāl game board"
    >
      <defs>
        <radialGradient id="tigerGrad" cx="38%" cy="35%" r="60%">
          <stop offset="0%"   stopColor="#ff7744" />
          <stop offset="100%" stopColor="#cc2200" />
        </radialGradient>
        <radialGradient id="goatGrad" cx="38%" cy="35%" r="60%">
          <stop offset="0%"   stopColor="#ffffff" />
          <stop offset="100%" stopColor="#d0ccc4" />
        </radialGradient>
        <filter id="pieceShadow">
          <feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.35" />
        </filter>
        <style>{`
          /* Placement pop-in */
          @keyframes placeIn {
            0%   { transform: scale(0);    opacity: 0; }
            65%  { transform: scale(1.22); opacity: 1; }
            100% { transform: scale(1);    opacity: 1; }
          }
          /* Capture shrink-out */
          @keyframes eatOut {
            0%   { transform: scale(1);    opacity: 1; }
            25%  { transform: scale(1.18); opacity: 0.9; }
            100% { transform: scale(0);    opacity: 0; }
          }
          /* Movable-piece pulse ring */
          @keyframes movablePulse {
            0%, 100% { opacity: 0.3; r: 29; }
            50%       { opacity: 0.85; r: 32; }
          }
          .movable-ring { animation: movablePulse 1.2s ease-in-out infinite; }
          /* Inner group: scale animations use centre as origin */
          .piece-inner  { transform-box: fill-box; transform-origin: center; }
          .piece-new    { animation: placeIn 0.32s cubic-bezier(0.34,1.56,0.64,1) forwards; }
          .piece-dying  { animation: eatOut 0.42s ease-in forwards; pointer-events: none; }
          /* Tiger pounce on capture */
          @keyframes tigerPounce {
            0%   { transform: scale(1); }
            45%  { transform: scale(1.55); }
            100% { transform: scale(1); }
          }
          .piece-pounce { animation: tigerPounce 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        `}</style>
      </defs>

      {/* Board background */}
      <rect width={SIZE} height={SIZE} fill="#f0ece4" rx={10} />
      <rect
        x={PAD - 16} y={PAD - 16}
        width={4 * CELL + 32} height={4 * CELL + 32}
        fill="#e8e2d6" rx={6} stroke="#c8b898" strokeWidth={1.5}
      />

      {/* Board lines */}
      {EDGES.map(({ r1, c1, r2, c2 }, i) => {
        const p1 = xy(r1, c1), p2 = xy(r2, c2);
        return (
          <line
            key={i}
            x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
            stroke="#1a1a1a" strokeWidth={2} strokeLinecap="round"
          />
        );
      })}

      {/* Valid-move target highlights */}
      {validMoves.map((m, i) => {
        const { x, y } = xy(m.row, m.col);
        return (
          <circle
            key={`h${i}`}
            cx={x} cy={y} r={22}
            fill="rgba(40,180,40,0.25)" stroke="#22bb22" strokeWidth={2.5}
            style={{ cursor: 'pointer' }}
            onClick={() => onPointClick(m.row, m.col)}
          />
        );
      })}

      {/* Empty intersections (dots + invisible click-target) */}
      {board.map((row, r) =>
        row.map((cell, c) => {
          if (cell) return null;
          const { x, y } = xy(r, c);
          const isHint   = validSet.has(`${r},${c}`);
          const canPlace = placementMode;
          return (
            <g
              key={`e${r}${c}`}
              onClick={() => onPointClick(r, c)}
              style={{ cursor: isHint || canPlace ? 'pointer' : 'default' }}
            >
              <circle
                cx={x} cy={y} r={canPlace ? 11 : 9}
                fill={canPlace ? 'rgba(50,190,90,0.35)' : '#c8c0b4'}
                stroke={canPlace ? '#22cc55' : '#a09080'}
                strokeWidth={canPlace ? 2 : 1.5}
              />
              <circle cx={x} cy={y} r={20} fill="transparent" />
            </g>
          );
        })
      )}

      {/* Captured goat — animates out at its last position */}
      {dyingAt && (() => {
        const { x, y } = xy(dyingAt.row, dyingAt.col);
        return (
          <g
            key="dying-goat"
            style={{ transform: `translate(${x}px, ${y}px)` }}
            filter="url(#pieceShadow)"
          >
            <g className="piece-inner piece-dying">
              <circle cx={0} cy={0} r={24} fill="url(#goatGrad)" stroke="#998877" strokeWidth={2} />
              <text
                x={0} y={1}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={22} style={{ userSelect: 'none', pointerEvents: 'none' }}
              >🐐</text>
            </g>
          </g>
        );
      })()}

      {/* Live pieces — outer <g> translates (CSS transition), inner <g> scales (animation).
          Sort by stable ID so DOM order never changes; React won't move nodes and transitions fire correctly. */}
      {[...pieces].sort((a, b) => a.id - b.id).map(piece => {
        const { x, y } = xy(piece.row, piece.col);
        const isTiger    = piece.type === 'tiger';
        const isSel      = selected?.row === piece.row && selected?.col === piece.col;
        const isMovable  = !isSel && movableSet.has(`${piece.row},${piece.col}`);
        const isNewPiece = isNew.has(piece.id);
        const isPouncing = piece.id === pouncingId;

        return (
          <g
            key={`piece-${piece.id}`}
            style={{
              transform: `translate(${x}px, ${y}px)`,
              transition: isNewPiece ? undefined : 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
              cursor: 'pointer',
            }}
            onClick={() => onPointClick(piece.row, piece.col)}
          >
            {/* Selection ring (outside scale group so it doesn't animate in) */}
            {isSel && (
              <circle cx={0} cy={0} r={30} fill="none" stroke="#ffcc00" strokeWidth={4} opacity={0.9} />
            )}
            {/* Movable hint ring */}
            {isMovable && (
              <circle
                className="movable-ring"
                cx={0} cy={0} r={29}
                fill="none"
                stroke={isTiger ? '#ff9944' : '#44aaff'}
                strokeWidth={3}
              />
            )}
            {/* Inner group: handles placement pop-in scale */}
            <g
              className={`piece-inner${isNewPiece ? ' piece-new' : isPouncing ? ' piece-pounce' : ''}`}
              filter="url(#pieceShadow)"
            >
              <circle
                cx={0} cy={0} r={24}
                fill={isTiger ? 'url(#tigerGrad)' : 'url(#goatGrad)'}
                stroke={isTiger ? '#991100' : '#998877'}
                strokeWidth={2}
              />
              <text
                x={0} y={1}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={22}
                style={{ userSelect: 'none', pointerEvents: 'none' }}
              >
                {isTiger ? '🐯' : '🐐'}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
}

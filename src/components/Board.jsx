import { useMemo } from 'react';
import { getBoardEdges } from '../utils/gameLogic';

const CELL = 84;
const PAD  = 52;
const SIZE = 4 * CELL + 2 * PAD; // 440

const xy = (r, c) => ({ x: PAD + c * CELL, y: PAD + r * CELL });
const EDGES = getBoardEdges();

export function Board({ board, selected, validMoves, lastCapture, onPointClick }) {
  const validSet = useMemo(
    () => new Set(validMoves.map(m => `${m.row},${m.col}`)),
    [validMoves],
  );

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      style={{ display: 'block' }}
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
      </defs>

      {/* Board background */}
      <rect width={SIZE} height={SIZE} fill="#f0ece4" rx={10} />
      {/* Play surface */}
      <rect
        x={PAD - 16} y={PAD - 16}
        width={4 * CELL + 32} height={4 * CELL + 32}
        fill="#e8e2d6" rx={6}
        stroke="#c8b898" strokeWidth={1.5}
      />

      {/* Board lines */}
      {EDGES.map(({ r1, c1, r2, c2 }, i) => {
        const p1 = xy(r1, c1);
        const p2 = xy(r2, c2);
        return (
          <line
            key={i}
            x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
            stroke="#1a1a1a"
            strokeWidth={2}
            strokeLinecap="round"
          />
        );
      })}

      {/* Valid move highlights */}
      {validMoves.map((m, i) => {
        const { x, y } = xy(m.row, m.col);
        return (
          <circle
            key={`h${i}`}
            cx={x} cy={y} r={22}
            fill="rgba(40,180,40,0.25)"
            stroke="#22bb22"
            strokeWidth={2.5}
            style={{ cursor: 'pointer' }}
            onClick={() => onPointClick(m.row, m.col)}
          />
        );
      })}

      {/* Last-capture flash */}
      {lastCapture && (() => {
        const { x, y } = xy(lastCapture.row, lastCapture.col);
        return <circle cx={x} cy={y} r={24} fill="rgba(255,40,40,0.2)" stroke="#ff2222" strokeWidth={2} />;
      })()}

      {/* Empty intersection dots + click targets */}
      {board.map((row, r) =>
        row.map((cell, c) => {
          const { x, y } = xy(r, c);
          if (cell) return null;
          const isHint = validSet.has(`${r},${c}`);
          return (
            <g key={`e${r}${c}`} onClick={() => onPointClick(r, c)} style={{ cursor: isHint ? 'pointer' : 'default' }}>
              <circle cx={x} cy={y} r={9} fill="#c8c0b4" stroke="#a09080" strokeWidth={1.5} />
              {/* Larger invisible hit area */}
              <circle cx={x} cy={y} r={20} fill="transparent" />
            </g>
          );
        })
      )}

      {/* Pieces */}
      {board.map((row, r) =>
        row.map((cell, c) => {
          if (!cell) return null;
          const { x, y } = xy(r, c);
          const isTiger = cell === 'tiger';
          const isSel   = selected?.row === r && selected?.col === c;

          return (
            <g
              key={`p${r}${c}`}
              onClick={() => onPointClick(r, c)}
              style={{ cursor: 'pointer' }}
              filter="url(#pieceShadow)"
            >
              {/* Selection ring */}
              {isSel && (
                <circle cx={x} cy={y} r={30} fill="none" stroke="#ffcc00" strokeWidth={4} opacity={0.9} />
              )}
              {/* Piece body */}
              <circle
                cx={x} cy={y} r={24}
                fill={isTiger ? 'url(#tigerGrad)' : 'url(#goatGrad)'}
                stroke={isTiger ? '#991100' : '#998877'}
                strokeWidth={2}
              />
              {/* Piece icon */}
              <text
                x={x} y={y + 1}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={22}
                style={{ userSelect: 'none', pointerEvents: 'none' }}
              >
                {isTiger ? '🐯' : '🐐'}
              </text>
            </g>
          );
        })
      )}
    </svg>
  );
}

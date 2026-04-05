const SHAPES = [
  { cells: [[0,0]], name: '1x1' },
  { cells: [[0,0],[0,1]], name: '1x2' },
  { cells: [[0,0],[1,0]], name: '2x1' },
  { cells: [[0,0],[0,1],[0,2]], name: '1x3' },
  { cells: [[0,0],[1,0],[2,0]], name: '3x1' },
  { cells: [[0,0],[0,1],[1,0]], name: 'L-tr' },
  { cells: [[0,0],[0,1],[1,1]], name: 'L-tl' },
  { cells: [[0,0],[1,0],[1,1]], name: 'L-br' },
  { cells: [[0,1],[1,0],[1,1]], name: 'L-bl' },
  { cells: [[0,0],[0,1],[0,2],[0,3]], name: '1x4' },
  { cells: [[0,0],[1,0],[2,0],[3,0]], name: '4x1' },
  { cells: [[0,0],[0,1],[1,0],[1,1]], name: '2x2' },
  { cells: [[0,0],[0,1],[0,2],[1,0]], name: 'L4-a' },
  { cells: [[0,0],[0,1],[0,2],[1,2]], name: 'L4-b' },
  { cells: [[0,0],[1,0],[1,1],[1,2]], name: 'L4-c' },
  { cells: [[0,2],[1,0],[1,1],[1,2]], name: 'L4-d' },
  { cells: [[0,0],[1,0],[2,0],[2,1]], name: 'L4-e' },
  { cells: [[0,0],[0,1],[1,0],[2,0]], name: 'L4-f' },
  { cells: [[0,0],[0,1],[2,0],[1,0]], name: 'L4-g' },
  { cells: [[0,1],[1,1],[2,0],[2,1]], name: 'L4-h' },
  { cells: [[0,0],[0,1],[0,2],[1,1]], name: 'T-d' },
  { cells: [[0,0],[1,0],[1,1],[2,0]], name: 'T-r' },
  { cells: [[1,0],[1,1],[1,2],[0,1]], name: 'T-u' },
  { cells: [[0,0],[0,1],[1,0],[2,0]], name: 'T-l' },
  { cells: [[0,0],[0,1],[1,1],[1,2]], name: 'S' },
  { cells: [[0,1],[0,2],[1,0],[1,1]], name: 'Z' },
  { cells: [[0,0],[1,0],[1,1],[2,1]], name: 'Sv' },
  { cells: [[0,1],[1,0],[1,1],[2,0]], name: 'Zv' },
  { cells: [[0,0],[0,1],[0,2],[0,3],[0,4]], name: '1x5' },
  { cells: [[0,0],[1,0],[2,0],[3,0],[4,0]], name: '5x1' },
  { cells: [[0,0],[1,0],[2,0],[2,1],[2,2]], name: 'bigL-a' },
  { cells: [[0,0],[0,1],[0,2],[1,0],[2,0]], name: 'bigL-b' },
  { cells: [[0,0],[0,1],[0,2],[1,2],[2,2]], name: 'bigL-c' },
  { cells: [[0,2],[1,2],[2,0],[2,1],[2,2]], name: 'bigL-d' },
  { cells: [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2]], name: '2x3' },
  { cells: [[0,0],[0,1],[1,0],[1,1],[2,0],[2,1]], name: '3x2' },
  { cells: [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2]], name: '3x3' },
];

// Precompute bounds and cell lookup sets for each shape
SHAPES.forEach(s => {
  s.rows = Math.max(...s.cells.map(c => c[0])) + 1;
  s.cols = Math.max(...s.cells.map(c => c[1])) + 1;
  s.cellSet = new Set(s.cells.map(([r, c]) => r * 100 + c));
});

const COLORS = 7;
const GRID = 8;

let grid = [];
let pieces = [];
let score = 0;
let highScore = parseInt(localStorage.getItem('bb-high') || '0');
let combo = 0;
let dragging = null;

const boardEl = document.getElementById('board');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('high-score');
const pieceTray = document.getElementById('pieces-tray');
const overlay = document.getElementById('game-over-overlay');
const finalScoreEl = document.getElementById('final-score');
const clearFlash = document.getElementById('clear-flash');
const boardContainer = document.getElementById('board-container');
const restartBtn = document.getElementById('restart-btn');
const pieceSlots = pieceTray.querySelectorAll('.piece-slot');

// Weighted shape selection — 2x3, 3x2, 3x3 appear twice as often
const BOOSTED = new Set(['2x3', '3x2', '3x3']);
const WEIGHTED_SHAPES = [];
SHAPES.forEach(s => {
  const count = BOOSTED.has(s.name) ? 2 : 1;
  for (let i = 0; i < count; i++) WEIGHTED_SHAPES.push(s);
});

function randomShape() {
  return WEIGHTED_SHAPES[Math.floor(Math.random() * WEIGHTED_SHAPES.length)];
}

function randomColor() {
  return 1 + Math.floor(Math.random() * COLORS);
}

function cellIdx(r, c) {
  return r * GRID + c;
}

// Build a grid of piece-cell divs for tray or ghost
function buildShapeGrid(shape, color, container, ghostMode) {
  container.style.gridTemplateColumns = `repeat(${shape.cols}, ${ghostMode ? 'var(--cell-size)' : 'calc(var(--cell-size) * 0.48)'})`;
  container.innerHTML = '';
  for (let r = 0; r < shape.rows; r++) {
    for (let c = 0; c < shape.cols; c++) {
      const div = document.createElement('div');
      const filled = shape.cellSet.has(r * 100 + c);
      div.className = `piece-cell ${filled ? `filled color-${color}` : 'empty'}`;
      if (ghostMode && !filled) div.style.background = 'transparent';
      container.appendChild(div);
    }
  }
}

// Find full rows and columns in a grid
function findFullLines(g) {
  const rows = [], cols = [];
  for (let r = 0; r < GRID; r++) {
    if (g[r].every(v => v !== 0)) rows.push(r);
  }
  for (let c = 0; c < GRID; c++) {
    if (g.every(row => row[c] !== 0)) cols.push(c);
  }
  return { rows, cols };
}

function init() {
  grid = Array.from({ length: GRID }, () => Array(GRID).fill(0));
  score = 0;
  combo = 0;
  updateScore();
  highScoreEl.textContent = highScore;
  overlay.classList.remove('visible');
  buildBoard();
  seedBoard();
  renderBoard();
  spawnPieces();
}

function seedBoard() {
  const numPieces = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < numPieces; i++) {
    const shape = randomShape();
    const color = randomColor();
    for (let attempt = 0; attempt < 50; attempt++) {
      const r = Math.floor(Math.random() * GRID);
      const c = Math.floor(Math.random() * GRID);
      if (canPlace(shape, r, c)) {
        place(shape, color, r, c);
        break;
      }
    }
  }
}

function buildBoard() {
  boardEl.innerHTML = '';
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      boardEl.appendChild(cell);
    }
  }
}

function renderBoard() {
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      const v = grid[r][c];
      const cell = boardEl.children[cellIdx(r, c)];
      cell.className = v ? `cell filled color-${v}` : 'cell';
    }
  }
}

function spawnPieces() {
  pieces = [0, 1, 2].map(() => ({
    shape: randomShape(),
    color: randomColor(),
    used: false,
  }));
  renderPieces();
}

function renderPieces() {
  pieceSlots.forEach((slot, i) => {
    const p = pieces[i];
    if (!p || p.used) {
      slot.innerHTML = '';
      slot.classList.add('used');
      slot.style.gridTemplateColumns = '';
      return;
    }
    slot.classList.remove('used');
    buildShapeGrid(p.shape, p.color, slot, false);
  });
}

function canPlace(shape, gridR, gridC) {
  return shape.cells.every(([dr, dc]) => {
    const r = gridR + dr;
    const c = gridC + dc;
    return r >= 0 && r < GRID && c >= 0 && c < GRID && grid[r][c] === 0;
  });
}

function place(shape, color, gridR, gridC) {
  shape.cells.forEach(([dr, dc]) => {
    grid[gridR + dr][gridC + dc] = color;
  });
}

function canPlaceAnywhere(shape) {
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      if (canPlace(shape, r, c)) return true;
    }
  }
  return false;
}

function clearLines() {
  const { rows: rowsToClear, cols: colsToClear } = findFullLines(grid);
  const totalLines = rowsToClear.length + colsToClear.length;
  if (totalLines === 0) {
    combo = 0;
    return 0;
  }

  combo++;

  const toClear = new Set();
  rowsToClear.forEach(r => {
    for (let c = 0; c < GRID; c++) toClear.add(cellIdx(r, c));
  });
  colsToClear.forEach(c => {
    for (let r = 0; r < GRID; r++) toClear.add(cellIdx(r, c));
  });

  toClear.forEach(idx => {
    boardEl.children[idx].classList.add('clearing');
  });

  clearFlash.classList.remove('flash');
  void clearFlash.offsetWidth;
  clearFlash.classList.add('flash');

  setTimeout(() => {
    rowsToClear.forEach(r => { grid[r] = Array(GRID).fill(0); });
    colsToClear.forEach(c => { grid.forEach(row => { row[c] = 0; }); });
    renderBoard();
  }, 400);

  // Quadratic bonus for multi-line clears, capped combo multiplier
  const lineScore = totalLines * 10 * totalLines;
  const points = lineScore * Math.min(combo, 10);

  if (combo >= 2) showStreak(combo);
  showScorePop(points);

  return points;
}

function showScorePop(points) {
  const pop = document.createElement('div');
  pop.className = 'score-pop';
  pop.textContent = `+${points}`;
  pop.style.top = '40%';
  pop.style.left = '50%';
  pop.style.transform = 'translate(-50%, -50%)';
  boardContainer.appendChild(pop);
  setTimeout(() => pop.remove(), 1000);
}

function showStreak(n) {
  const label = document.createElement('div');
  label.className = 'streak-label';
  label.textContent = `${n}x COMBO`;
  boardContainer.appendChild(label);
  setTimeout(() => label.remove(), 1100);
}

function updateScore() {
  scoreEl.textContent = score;
  if (score > highScore) {
    highScore = score;
    highScoreEl.textContent = highScore;
    localStorage.setItem('bb-high', String(highScore));
  }
}

function checkGameOver() {
  const remaining = pieces.filter(p => !p.used);
  if (remaining.length > 0 && remaining.every(p => !canPlaceAnywhere(p.shape))) {
    setTimeout(() => {
      finalScoreEl.textContent = score;
      overlay.classList.add('visible');
    }, 500);
  }
}

// ── Drag & Drop ──
let ghostEl = null;
let currentPreview = null;
let previewCells = []; // track cells with preview classes for fast cleanup

function getGridCellFromPoint(x, y) {
  const boardRect = boardEl.getBoundingClientRect();
  const cellTotal = boardRect.width / GRID;
  const margin = cellTotal * 1.5;
  if (x < boardRect.left - margin || x > boardRect.right + margin ||
      y < boardRect.top - margin || y > boardRect.bottom + margin) {
    return null;
  }
  const c = Math.min(GRID - 1, Math.max(0, Math.floor((x - boardRect.left) / cellTotal)));
  const r = Math.min(GRID - 1, Math.max(0, Math.floor((y - boardRect.top) / cellTotal)));
  return { r, c };
}

function startDrag(slotIdx, clientX, clientY) {
  const p = pieces[slotIdx];
  if (!p || p.used) return;

  const offsetR = Math.floor(p.shape.rows / 2);
  const offsetC = Math.floor(p.shape.cols / 2);

  dragging = { slotIdx, shape: p.shape, color: p.color, offsetR, offsetC };

  ghostEl = document.createElement('div');
  ghostEl.id = 'drag-ghost';
  buildShapeGrid(p.shape, p.color, ghostEl, true);
  document.body.appendChild(ghostEl);
  moveGhost(clientX, clientY);

  pieceSlots[slotIdx].style.opacity = '0.3';
}

function moveGhost(x, y, snappedToGrid) {
  if (!ghostEl) return;
  if (snappedToGrid) {
    const boardRect = boardEl.getBoundingClientRect();
    const cellTotal = boardRect.width / GRID;
    ghostEl.style.left = `${boardRect.left + snappedToGrid.anchorC * cellTotal}px`;
    ghostEl.style.top = `${boardRect.top + snappedToGrid.anchorR * cellTotal}px`;
    ghostEl.style.opacity = '0.9';
  } else {
    const rect = ghostEl.getBoundingClientRect();
    ghostEl.style.left = `${x - rect.width / 2}px`;
    ghostEl.style.top = `${y - rect.height / 2 - 50}px`;
    ghostEl.style.opacity = '0.6';
  }
}

function updatePreview(x, y) {
  clearPreview();
  if (!dragging) return;

  const adjustedY = y - 50;
  const pos = getGridCellFromPoint(x, adjustedY);
  if (!pos) {
    moveGhost(x, y, null);
    return;
  }

  const anchorR = pos.r - dragging.offsetR;
  const anchorC = pos.c - dragging.offsetC;
  const valid = canPlace(dragging.shape, anchorR, anchorC);

  currentPreview = { anchorR, anchorC, valid };
  moveGhost(x, y, { anchorR, anchorC });

  if (valid) {
    dragging.shape.cells.forEach(([dr, dc]) => {
      const r = anchorR + dr;
      const c = anchorC + dc;
      if (r >= 0 && r < GRID && c >= 0 && c < GRID) {
        const el = boardEl.children[cellIdx(r, c)];
        el.classList.add('preview');
        previewCells.push(el);
      }
    });

    // Highlight lines that would complete
    const tempGrid = grid.map(row => [...row]);
    dragging.shape.cells.forEach(([dr, dc]) => {
      tempGrid[anchorR + dr][anchorC + dc] = dragging.color;
    });
    const { rows, cols } = findFullLines(tempGrid);
    rows.forEach(r => {
      for (let c = 0; c < GRID; c++) {
        const el = boardEl.children[cellIdx(r, c)];
        el.classList.add('preview-line');
        previewCells.push(el);
      }
    });
    cols.forEach(c => {
      for (let r = 0; r < GRID; r++) {
        const el = boardEl.children[cellIdx(r, c)];
        el.classList.add('preview-line');
        previewCells.push(el);
      }
    });
  } else {
    dragging.shape.cells.forEach(([dr, dc]) => {
      const r = anchorR + dr;
      const c = anchorC + dc;
      if (r >= 0 && r < GRID && c >= 0 && c < GRID) {
        const el = boardEl.children[cellIdx(r, c)];
        el.classList.add(grid[r][c] !== 0 ? 'preview-clash' : 'preview-invalid');
        previewCells.push(el);
      }
    });
  }
}

function clearPreview() {
  previewCells.forEach(el => {
    el.classList.remove('preview', 'preview-invalid', 'preview-clash', 'preview-line');
  });
  previewCells = [];
  currentPreview = null;
}

function endDrag() {
  if (!dragging) return;

  const slotIdx = dragging.slotIdx;
  pieceSlots[slotIdx].style.opacity = '';

  if (currentPreview && currentPreview.valid) {
    place(dragging.shape, dragging.color, currentPreview.anchorR, currentPreview.anchorC);
    pieces[slotIdx].used = true;
    renderBoard();
    renderPieces();

    score += dragging.shape.cells.length;
    const clearPoints = clearLines();
    score += clearPoints;
    updateScore();

    if (pieces.every(p => p.used)) {
      setTimeout(() => { spawnPieces(); checkGameOver(); }, 450);
    } else {
      setTimeout(checkGameOver, 450);
    }
  }

  clearPreview();
  if (ghostEl) {
    ghostEl.remove();
    ghostEl = null;
  }
  dragging = null;
}

// Mouse
pieceTray.addEventListener('mousedown', e => {
  const slot = e.target.closest('.piece-slot');
  if (!slot) return;
  startDrag(+slot.dataset.slot, e.clientX, e.clientY);
});

document.addEventListener('mousemove', e => {
  if (!dragging) return;
  e.preventDefault();
  moveGhost(e.clientX, e.clientY);
  updatePreview(e.clientX, e.clientY);
});

document.addEventListener('mouseup', endDrag);

// Touch
pieceTray.addEventListener('touchstart', e => {
  const slot = e.target.closest('.piece-slot');
  if (!slot) return;
  const t = e.touches[0];
  startDrag(+slot.dataset.slot, t.clientX, t.clientY);
}, { passive: true });

document.addEventListener('touchmove', e => {
  if (!dragging) return;
  e.preventDefault();
  const t = e.touches[0];
  moveGhost(t.clientX, t.clientY);
  updatePreview(t.clientX, t.clientY);
}, { passive: false });

document.addEventListener('touchend', endDrag);

restartBtn.addEventListener('click', init);

init();

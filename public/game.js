// ── Shape definitions ──
const SHAPES = [
  // Single
  { cells: [[0,0]], name: '1x1' },
  // Dominos
  { cells: [[0,0],[0,1]], name: '1x2' },
  { cells: [[0,0],[1,0]], name: '2x1' },
  // Triominoes
  { cells: [[0,0],[0,1],[0,2]], name: '1x3' },
  { cells: [[0,0],[1,0],[2,0]], name: '3x1' },
  { cells: [[0,0],[0,1],[1,0]], name: 'L-tr' },
  { cells: [[0,0],[0,1],[1,1]], name: 'L-tl' },
  { cells: [[0,0],[1,0],[1,1]], name: 'L-br' },
  { cells: [[0,1],[1,0],[1,1]], name: 'L-bl' },
  // Tetrominoes
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
  // T shapes
  { cells: [[0,0],[0,1],[0,2],[1,1]], name: 'T-d' },
  { cells: [[0,0],[1,0],[1,1],[2,0]], name: 'T-r' },
  { cells: [[1,0],[1,1],[1,2],[0,1]], name: 'T-u' },
  { cells: [[0,0],[0,1],[1,0],[2,0]], name: 'T-l' },
  // S/Z
  { cells: [[0,0],[0,1],[1,1],[1,2]], name: 'S' },
  { cells: [[0,1],[0,2],[1,0],[1,1]], name: 'Z' },
  { cells: [[0,0],[1,0],[1,1],[2,1]], name: 'Sv' },
  { cells: [[0,1],[1,0],[1,1],[2,0]], name: 'Zv' },
  // Pentominoes (select)
  { cells: [[0,0],[0,1],[0,2],[0,3],[0,4]], name: '1x5' },
  { cells: [[0,0],[1,0],[2,0],[3,0],[4,0]], name: '5x1' },
  // Big L
  { cells: [[0,0],[1,0],[2,0],[2,1],[2,2]], name: 'bigL-a' },
  { cells: [[0,0],[0,1],[0,2],[1,0],[2,0]], name: 'bigL-b' },
  { cells: [[0,0],[0,1],[0,2],[1,2],[2,2]], name: 'bigL-c' },
  { cells: [[0,2],[1,2],[2,0],[2,1],[2,2]], name: 'bigL-d' },
  // 3x3 square
  { cells: [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2]], name: '3x3' },
];

const COLORS = 7;
const GRID = 8;

// ── State ──
let grid = [];        // 8x8, 0 = empty, 1-7 = color
let pieces = [];      // current 3 pieces [{shape, color, used}]
let score = 0;
let highScore = parseInt(localStorage.getItem('bb-high') || '0');
let combo = 0;        // consecutive turns with line clears
let dragging = null;  // {slotIdx, shape, color, offsetR, offsetC}

const boardEl = document.getElementById('board');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('high-score');
const pieceTray = document.getElementById('pieces-tray');
const overlay = document.getElementById('game-over-overlay');
const finalScoreEl = document.getElementById('final-score');
const clearFlash = document.getElementById('clear-flash');
const restartBtn = document.getElementById('restart-btn');

// ── Init ──
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

// Place some random blocks on the board at start to make it interesting
function seedBoard() {
  const numPieces = 3 + Math.floor(Math.random() * 3); // 3-5 pieces
  for (let i = 0; i < numPieces; i++) {
    const shape = randomShape();
    const color = randomColor();
    // Try random positions until one fits
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
      cell.dataset.r = r;
      cell.dataset.c = c;
      boardEl.appendChild(cell);
    }
  }
}

function renderBoard() {
  const cells = boardEl.querySelectorAll('.cell');
  cells.forEach(cell => {
    const r = +cell.dataset.r;
    const c = +cell.dataset.c;
    const v = grid[r][c];
    cell.className = 'cell';
    if (v) {
      cell.classList.add('filled', `color-${v}`);
    }
  });
}

// ── Pieces ──
function randomShape() {
  return SHAPES[Math.floor(Math.random() * SHAPES.length)];
}

function randomColor() {
  return 1 + Math.floor(Math.random() * COLORS);
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
  const slots = pieceTray.querySelectorAll('.piece-slot');
  slots.forEach((slot, i) => {
    const p = pieces[i];
    if (!p || p.used) {
      slot.innerHTML = '';
      slot.classList.add('used');
      slot.style.gridTemplateColumns = '';
      return;
    }
    slot.classList.remove('used');
    const { cells } = p.shape;
    const maxR = Math.max(...cells.map(c => c[0])) + 1;
    const maxC = Math.max(...cells.map(c => c[1])) + 1;
    slot.style.gridTemplateColumns = `repeat(${maxC}, calc(var(--cell-size) * 0.48))`;
    slot.innerHTML = '';
    for (let r = 0; r < maxR; r++) {
      for (let c = 0; c < maxC; c++) {
        const div = document.createElement('div');
        const isFilled = cells.some(([cr, cc]) => cr === r && cc === c);
        div.className = `piece-cell ${isFilled ? `filled color-${p.color}` : 'empty'}`;
        slot.appendChild(div);
      }
    }
  });
}

// ── Placement logic ──
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

// ── Line clearing ──
function clearLines() {
  const rowsToClear = [];
  const colsToClear = [];

  for (let r = 0; r < GRID; r++) {
    if (grid[r].every(v => v !== 0)) rowsToClear.push(r);
  }
  for (let c = 0; c < GRID; c++) {
    if (grid.every(row => row[c] !== 0)) colsToClear.push(c);
  }

  const totalLines = rowsToClear.length + colsToClear.length;
  if (totalLines === 0) {
    combo = 0;
    return 0;
  }

  combo++;

  // Animate clearing cells
  const cellEls = boardEl.querySelectorAll('.cell');
  const toClear = new Set();

  rowsToClear.forEach(r => {
    for (let c = 0; c < GRID; c++) toClear.add(r * GRID + c);
  });
  colsToClear.forEach(c => {
    for (let r = 0; r < GRID; r++) toClear.add(r * GRID + c);
  });

  toClear.forEach(idx => {
    cellEls[idx].classList.add('clearing');
  });

  // Flash
  clearFlash.classList.remove('flash');
  void clearFlash.offsetWidth;
  clearFlash.classList.add('flash');

  // Actually clear after animation
  setTimeout(() => {
    rowsToClear.forEach(r => { grid[r] = Array(GRID).fill(0); });
    colsToClear.forEach(c => { grid.forEach(row => { row[c] = 0; }); });
    renderBoard();
  }, 400);

  // Score: 10 per line, multiplied by lines count and combo
  const lineScore = totalLines * 10 * totalLines; // quadratic bonus for multi-line
  const comboMultiplier = Math.min(combo, 10);
  const points = lineScore * comboMultiplier;

  // Show streak
  if (combo >= 2) {
    showStreak(combo);
  }

  // Show score pop on board
  showScorePop(points);

  return points;
}

function showScorePop(points) {
  const pop = document.createElement('div');
  pop.className = 'score-pop';
  pop.textContent = `+${points}`;
  const container = document.getElementById('board-container');
  pop.style.top = '40%';
  pop.style.left = '50%';
  pop.style.transform = 'translate(-50%, -50%)';
  container.appendChild(pop);
  setTimeout(() => pop.remove(), 1000);
}

function showStreak(n) {
  const label = document.createElement('div');
  label.className = 'streak-label';
  label.textContent = `${n}x COMBO`;
  document.getElementById('board-container').appendChild(label);
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

// ── Game over ──
function checkGameOver() {
  const remaining = pieces.filter(p => !p.used);
  const gameOver = remaining.some(p => !canPlaceAnywhere(p.shape))
    && remaining.every(p => !canPlaceAnywhere(p.shape));

  // Actually: game is over when NONE of the remaining pieces can be placed
  const isOver = remaining.length > 0 && remaining.every(p => !canPlaceAnywhere(p.shape));

  if (isOver) {
    setTimeout(() => {
      finalScoreEl.textContent = score;
      overlay.classList.add('visible');
    }, 500);
  }
}

// ── Drag & Drop (mouse + touch) ──
let ghostEl = null;
let currentPreview = null;

function getGridCellFromPoint(x, y) {
  const boardRect = boardEl.getBoundingClientRect();
  const cellTotal = boardRect.width / GRID;
  // Expand hit zone by 1.5 cells around the board edges
  const margin = cellTotal * 1.5;
  if (x < boardRect.left - margin || x > boardRect.right + margin ||
      y < boardRect.top - margin || y > boardRect.bottom + margin) {
    return null;
  }
  // Clamp to grid bounds so dragging near edges still snaps
  const c = Math.min(GRID - 1, Math.max(0, Math.floor((x - boardRect.left) / cellTotal)));
  const r = Math.min(GRID - 1, Math.max(0, Math.floor((y - boardRect.top) / cellTotal)));
  return { r, c };
}

function startDrag(slotIdx, clientX, clientY) {
  const p = pieces[slotIdx];
  if (!p || p.used) return;

  // Calculate shape center for offset
  const cells = p.shape.cells;
  const maxR = Math.max(...cells.map(c => c[0]));
  const maxC = Math.max(...cells.map(c => c[1]));
  const offsetR = Math.floor((maxR + 1) / 2);
  const offsetC = Math.floor((maxC + 1) / 2);

  dragging = { slotIdx, shape: p.shape, color: p.color, offsetR, offsetC };

  // Create ghost
  ghostEl = document.createElement('div');
  ghostEl.id = 'drag-ghost';
  ghostEl.style.gridTemplateColumns = `repeat(${maxC + 1}, var(--cell-size))`;
  for (let r = 0; r <= maxR; r++) {
    for (let c = 0; c <= maxC; c++) {
      const div = document.createElement('div');
      const isFilled = cells.some(([cr, cc]) => cr === r && cc === c);
      div.className = `piece-cell ${isFilled ? `filled color-${p.color}` : 'empty'}`;
      if (!isFilled) div.style.background = 'transparent';
      ghostEl.appendChild(div);
    }
  }
  document.body.appendChild(ghostEl);
  moveGhost(clientX, clientY);

  // Hide the slot piece
  const slot = pieceTray.querySelectorAll('.piece-slot')[slotIdx];
  slot.style.opacity = '0.3';
}

function moveGhost(x, y, snappedToGrid) {
  if (!ghostEl) return;
  if (snappedToGrid) {
    // Snap ghost directly onto the grid cells
    const boardRect = boardEl.getBoundingClientRect();
    const cellTotal = boardRect.width / GRID;
    const anchorR = snappedToGrid.anchorR;
    const anchorC = snappedToGrid.anchorC;
    ghostEl.style.left = `${boardRect.left + anchorC * cellTotal}px`;
    ghostEl.style.top = `${boardRect.top + anchorR * cellTotal}px`;
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

  // Adjust point to be where the ghost center is (above touch)
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

  // Snap ghost to grid
  moveGhost(x, y, { anchorR, anchorC });

  dragging.shape.cells.forEach(([dr, dc]) => {
    const r = anchorR + dr;
    const c = anchorC + dc;
    if (r >= 0 && r < GRID && c >= 0 && c < GRID) {
      const cellEl = boardEl.children[r * GRID + c];
      cellEl.classList.add(valid ? 'preview' : 'preview-invalid');
    }
  });
}

function clearPreview() {
  boardEl.querySelectorAll('.preview, .preview-invalid').forEach(el => {
    el.classList.remove('preview', 'preview-invalid');
  });
  currentPreview = null;
}

function endDrag() {
  if (!dragging) return;

  const slotIdx = dragging.slotIdx;
  const slot = pieceTray.querySelectorAll('.piece-slot')[slotIdx];
  slot.style.opacity = '';

  if (currentPreview && currentPreview.valid) {
    // Place piece
    place(dragging.shape, dragging.color, currentPreview.anchorR, currentPreview.anchorC);
    pieces[slotIdx].used = true;
    renderBoard();
    renderPieces();

    // Add base points for blocks placed
    score += dragging.shape.cells.length;

    // Clear lines
    const clearPoints = clearLines();
    score += clearPoints;
    updateScore();

    // Check if all 3 used → spawn new set
    if (pieces.every(p => p.used)) {
      setTimeout(() => {
        spawnPieces();
        checkGameOver();
      }, 450);
    } else {
      setTimeout(() => checkGameOver(), 450);
    }
  }

  // Cleanup
  clearPreview();
  if (ghostEl) {
    ghostEl.remove();
    ghostEl = null;
  }
  dragging = null;
}

// ── Event listeners ──

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

document.addEventListener('mouseup', () => {
  endDrag();
});

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

document.addEventListener('touchend', () => {
  endDrag();
});

restartBtn.addEventListener('click', init);

// ── Start ──
init();

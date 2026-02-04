// =======================
// Gomoku (15x15) - PvP / Vs AI (Easy/Normal/Hard)
// =======================

const size = 15;
const P1 = "●";          // 사람(또는 플레이어1)
const P2 = "○";          // 플레이어2(2인 모드)
const AI = "○";          // AI도 ○ 사용

let board = [];
let cells = [];
let gameOver = false;
let current = P1;

let gameMode = "ai";     // "ai" | "pvp"
let lastMoveCell = null; // 최근 돌 DOM

// DOM
const boardDiv = document.getElementById("board");
const statusDiv = document.getElementById("status");
const timerDiv = document.getElementById("timer");

// ✅ 타이머 설정
let TURN_LIMIT = 60; // 60초
let timeLeft = TURN_LIMIT;
let timerId = null;

const resetBtn = document.getElementById("resetBtn");
const modeBtn = document.getElementById("modeBtn");
const timeLimitSel = document.getElementById("timeLimit");

// 오버레이 UI
const startOverlay = document.getElementById("startOverlay");
const startBtn = document.getElementById("startBtn");
const difficultySel = document.getElementById("difficulty");
const difficultyRow = document.getElementById("difficultyRow");
const modeRadios = [...document.querySelectorAll('input[name="mode"]')];

// ===== 시작: 처음엔 오버레이 보이기 =====
showStartOverlay(true);
statusDiv.textContent = "모드를 선택해 주세요";

// 시작하기
startBtn.addEventListener("click", () => {
  gameMode = getSelectedMode();

  // ⏱ 타이머 값 반영
  TURN_LIMIT = parseInt(timeLimitSel.value);

  showStartOverlay(false);
  initBoard();
});

// 모드 선택 화면 다시 열기
modeBtn.addEventListener("click", () => {
  showStartOverlay(true);
  statusDiv.textContent = "모드를 선택해 주세요";
  boardDiv.innerHTML = ""; // 보드 비우기
});

// 리셋(현재 모드로 재시작)
resetBtn.addEventListener("click", () => {
  if (startOverlay.style.display !== "none") return;
  initBoard();
});

// 모드 변경 시 난이도 표시 on/off
modeRadios.forEach(r => {
  r.addEventListener("change", () => {
    const m = getSelectedMode();
    difficultyRow.style.display = (m === "ai") ? "flex" : "none";
  });
});

// 초기 표시
difficultyRow.style.display = "flex";

// ========================
// 보드 초기화
// ========================
function initBoard() {
  board = Array.from({ length: size }, () => Array(size).fill(""));
  cells = [];
  gameOver = false;
  current = P1;

  boardDiv.innerHTML = "";

  if (gameMode === "ai") statusDiv.textContent = "당신(●) 차례";
  else statusDiv.textContent = "플레이어1(●) 차례";

  for (let y = 0; y < size; y++) {
    cells[y] = [];
    for (let x = 0; x < size; x++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.addEventListener("click", () => onCellClick(x, y));
      boardDiv.appendChild(cell);
      cells[y][x] = cell;
     

    }
  }
}

// ========================
// 클릭 처리 (사람/2인)
// ========================
function onCellClick(x, y) {
  if (gameMode === "ai" && current === AI) return; // ✅ AI 턴엔 클릭 금지
  if (gameOver) return;
  if (board[y][x] !== "") return;

  placeStone(x, y, current);

  if (checkWin(x, y, current)) {
    if (gameMode === "ai") {
      endGame(current === P1 ? "당신(●) 승리!" : "AI(○) 승리!");
    } else {
      endGame(current === P1 ? "플레이어1(●) 승리!" : "플레이어2(○) 승리!");
    }
    return;
  }

  // 2인 모드
  if (gameMode === "pvp") {
  current = (current === P1) ? P2 : P1;
  statusDiv.textContent = (current === P1) ? "플레이어1(●) 차례" : "플레이어2(○) 차례";
  startTurnTimer(); // ✅ 다음 턴 타이머 시작
  return;
}

  // AI 모드
  current = AI;
  statusDiv.textContent = "AI(○) 생각 중...";
  startTurnTimer(); // ✅ AI 턴 타이머 시작
  setTimeout(aiMove, 120);

}

// ========================
// AI 차례
// ========================
function aiMove() {
  if (gameOver) return;

  try {
    const d = difficultySel ? difficultySel.value : "normal";
    let move = null;

    if (d === "easy") move = findMoveEasy();
    else if (d === "hard") move = findMoveHard();
    else move = findMoveNormal();

    // 혹시라도 move가 null이면 안전하게 랜덤
    if (!move) move = fallbackRandomMove();
    if (!move) {
      endGame("무승부!");
      return;
    }

    const [x, y] = move;
    placeStone(x, y, AI);

    if (checkWin(x, y, AI)) {
      endGame("AI(○) 승리!");
      return;
    }

    current = P1;
    statusDiv.textContent = "당신(●) 차례";
    startTurnTimer(); // ✅ 사람 턴 타이머 시작
  } catch (e) {
    console.error("AI move error:", e);

    // 에러가 나도 최소한 랜덤 한 수
    const move = fallbackRandomMove();
    if (move) {
      const [x, y] = move;
      placeStone(x, y, AI);
      current = P1;
      statusDiv.textContent = "당신(●) 차례";
    } else {
      endGame("무승부!");
    }
  }
}

function fallbackRandomMove() {
  const empties = listEmpties();
  if (empties.length === 0) return null;

  const candidates = empties.filter(([x, y]) => hasNeighbor(x, y, 2));
  const pool = candidates.length ? candidates : empties;

  return pool[Math.floor(Math.random() * pool.length)];
}

// ========================
// 렌더 / 게임종료
// ========================
function placeStone(x, y, stone) {
  board[y][x] = stone;
  const cell = cells[y][x];

  const stoneDiv = document.createElement("div");
  stoneDiv.className = stone === "●" ? "stone black" : "stone white";
  cell.appendChild(stoneDiv);

  // 최근 돌 효과
  if (lastMoveCell) lastMoveCell.classList.remove("last-move");
  cell.classList.add("last-move");
  lastMoveCell = cell;
}

function endGame(msg) {
  gameOver = true;
  stopTurnTimer();
  statusDiv.textContent = msg;

  // 사람 승리
  if (msg.includes("당신") || msg.includes("플레이어1")) {
    showWinEffect();
    launchConfetti();
  }

  // AI 승리
  if (msg.includes("AI")) {
    showLoseEffect();
  }
}

function showWinEffect() {
  const win = document.createElement("div");
  win.id = "winEffect";
  win.textContent = "YOU WIN";

  document.body.appendChild(win);

  setTimeout(() => {
    win.remove();
  }, 2000);
}


function showLoseEffect() {
  const lose = document.createElement("div");
  lose.id = "loseEffect";
  lose.textContent = "YOU LOSE";

  document.body.appendChild(lose);

  setTimeout(() => {
    lose.remove();
  }, 2000);
}


function showStartOverlay(show) {
  startOverlay.style.display = show ? "flex" : "none";
}

function getSelectedMode() {
  const checked = modeRadios.find(r => r.checked);
  return checked ? checked.value : "ai";
}

// ========================
// 승리 판정 (5목)
// ========================
function checkWin(x, y, stone) {
  return (
    countLine(x, y, 1, 0, stone) + countLine(x, y, -1, 0, stone) >= 4 ||
    countLine(x, y, 0, 1, stone) + countLine(x, y, 0, -1, stone) >= 4 ||
    countLine(x, y, 1, 1, stone) + countLine(x, y, -1, -1, stone) >= 4 ||
    countLine(x, y, 1, -1, stone) + countLine(x, y, -1, 1, stone) >= 4
  );
}

function countLine(x, y, dx, dy, stone) {
  let c = 0;
  for (let i = 1; i < 5; i++) {
    const nx = x + dx * i;
    const ny = y + dy * i;
    if (board[ny]?.[nx] === stone) c++;
    else break;
  }
  return c;
}

function startTurnTimer() {
  stopTurnTimer();
  timeLeft = TURN_LIMIT;
  renderTimer();

  timerId = setInterval(() => {
    timeLeft--;
    renderTimer();

    if (timeLeft <= 0) {
      stopTurnTimer();
      onTimeOut();
    }
  }, 1000);
}

function stopTurnTimer() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
}

function renderTimer() {
  if (!timerDiv) return;
  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");
  timerDiv.textContent = `${mm}:${ss}`;
}

function onTimeOut() {
  if (gameOver) return;

  // 현재 턴의 플레이어가 시간초과 패배
  if (gameMode === "ai") {
    if (current === P1) endGame("시간초과! AI(○) 승리!");
    else endGame("AI 시간초과! 당신(●) 승리!");
  } else {
    // pvp
    if (current === P1) endGame("플레이어1(●) 시간초과! 플레이어2(○) 승리!");
    else endGame("플레이어2(○) 시간초과! 플레이어1(●) 승리!");
  }
}

// ========================
// 공통 유틸
// ========================
function listEmpties() {
  const empties = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (board[y][x] === "") empties.push([x, y]);
    }
  }
  return empties;
}

function hasNeighbor(x, y, dist) {
  for (let dy = -dist; dy <= dist; dy++) {
    for (let dx = -dist; dx <= dist; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (board[ny]?.[nx] && board[ny][nx] !== "") return true;
    }
  }
  return false;
}

function findImmediateWinOrBlock() {
  const empties = listEmpties();
  if (empties.length === 0) return null;

  // 1) AI 즉시 승리
  for (const [x, y] of empties) {
    board[y][x] = AI;
    const win = checkWin(x, y, AI);
    board[y][x] = "";
    if (win) return [x, y];
  }

  // 2) 사람(P1) 즉시 승리 막기
  for (const [x, y] of empties) {
    board[y][x] = P1;
    const win = checkWin(x, y, P1);
    board[y][x] = "";
    if (win) return [x, y];
  }

  return null;
}

// ========================
// 난이도: 쉬움
// - 즉시 이기기/막기만
// - 그 외엔 근처 랜덤
// ========================
function findMoveEasy() {
  const forced = findImmediateWinOrBlock();
  if (forced) return forced;

  const empties = listEmpties();
  if (empties.length === size * size) return [Math.floor(size / 2), Math.floor(size / 2)];

  const candidates = empties.filter(([x, y]) => hasNeighbor(x, y, 2));
  const pool = candidates.length ? candidates : empties;

  return pool[Math.floor(Math.random() * pool.length)];
}

// ========================
// 난이도: 보통
// - 휴리스틱 점수 기반
// ========================
function findMoveNormal() {
  const empties = listEmpties();
  if (empties.length === 0) return null;

  if (empties.length === size * size) return [Math.floor(size / 2), Math.floor(size / 2)];

  const forced = findImmediateWinOrBlock();
  if (forced) return forced;

  let best = null;
  let bestScore = -Infinity;

  for (const [x, y] of empties) {
    const score =
      evaluatePoint(x, y, AI) * 1.2 +
      evaluatePoint(x, y, P1) * 1.0; // ✅ HUMAN -> P1

    if (score > bestScore) {
      bestScore = score;
      best = [x, y];
    }
  }
  return best;
}

// ========================
// 난이도: 어려움
// - 후보 줄이고 미니맥스 depth=2 + 알파베타
// ========================
function findMoveHard() {
  const empties = listEmpties();
  if (empties.length === 0) return null;

  if (empties.length === size * size) return [Math.floor(size / 2), Math.floor(size / 2)];

  const forced = findImmediateWinOrBlock();
  if (forced) return forced;

  const candidates = empties
    .filter(([x, y]) => hasNeighbor(x, y, 2))
    .map(([x, y]) => ({
      x, y,
      s: evaluatePoint(x, y, AI) * 1.2 + evaluatePoint(x, y, P1) * 1.0
    }))
    .sort((a, b) => b.s - a.s)
    .slice(0, 12);

  let bestMove = null;
  let bestVal = -Infinity;
  let alpha = -Infinity;
  let beta = Infinity;

  for (const m of candidates) {
    board[m.y][m.x] = AI;

    if (checkWin(m.x, m.y, AI)) {
      board[m.y][m.x] = "";
      return [m.x, m.y];
    }

    const val = minimax(2, false, alpha, beta);
    board[m.y][m.x] = "";

    if (val > bestVal) {
      bestVal = val;
      bestMove = [m.x, m.y];
    }
    alpha = Math.max(alpha, bestVal);
  }

  return bestMove ?? findMoveNormal();
}

function minimax(depth, isMax, alpha, beta) {
  if (depth === 0) return evaluateBoard();

  const empties = listEmpties();
  if (empties.length === 0) return evaluateBoard();

  let moves = empties.filter(([x, y]) => hasNeighbor(x, y, 2));
  if (moves.length === 0) moves = empties;

  moves = moves
    .map(([x, y]) => ({
      x, y,
      s: evaluatePoint(x, y, AI) * 1.2 + evaluatePoint(x, y, P1) * 1.0
    }))
    .sort((a, b) => b.s - a.s)
    .slice(0, 10);

  if (isMax) {
    let best = -Infinity;
    for (const m of moves) {
      board[m.y][m.x] = AI;

      let val;
      if (checkWin(m.x, m.y, AI)) val = 1e9;
      else val = minimax(depth - 1, false, alpha, beta);

      board[m.y][m.x] = "";

      best = Math.max(best, val);
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const m of moves) {
      board[m.y][m.x] = P1; // ✅ HUMAN -> P1

      let val;
      if (checkWin(m.x, m.y, P1)) val = -1e9;
      else val = minimax(depth - 1, true, alpha, beta);

      board[m.y][m.x] = "";

      best = Math.min(best, val);
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}

function evaluateBoard() {
  let aiSum = 0;
  let huSum = 0;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (board[y][x] !== "") continue;
      if (!hasNeighbor(x, y, 2)) continue;
      aiSum += evaluatePoint(x, y, AI);
      huSum += evaluatePoint(x, y, P1); // ✅ HUMAN -> P1
    }
  }
  return aiSum * 1.2 - huSum * 1.0;
}

// ========================
// 휴리스틱 평가
// ========================
function evaluatePoint(x, y, stone) {
  if (!hasNeighbor(x, y, 2)) return 0;

  const dirs = [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, -1],
  ];

  let total = 0;
  for (const [dx, dy] of dirs) {
    total += scoreLine(x, y, dx, dy, stone);
  }
  return total;
}

function scoreLine(x, y, dx, dy, stone) {
  let count = 1;
  count += countContiguous(x, y, dx, dy, stone);
  count += countContiguous(x, y, -dx, -dy, stone);

  const openEnds = getOpenEnds(x, y, dx, dy, stone);

  if (count >= 5) return 1000000;

  if (count === 4 && openEnds === 2) return 50000;
  if (count === 4 && openEnds === 1) return 20000;

  if (count === 3 && openEnds === 2) return 6000;
  if (count === 3 && openEnds === 1) return 1500;

  if (count === 2 && openEnds === 2) return 400;
  if (count === 2 && openEnds === 1) return 120;

  if (count === 1 && openEnds === 2) return 20;

  return 0;
}

function countContiguous(x, y, dx, dy, stone) {
  let c = 0;
  for (let i = 1; i < 5; i++) {
    const nx = x + dx * i;
    const ny = y + dy * i;
    if (board[ny]?.[nx] === stone) c++;
    else break;
  }
  return c;
}

function getOpenEnds(x, y, dx, dy, stone) {
  const forwardEnd = endPoint(x, y, dx, dy, stone);
  const backwardEnd = endPoint(x, y, -dx, -dy, stone);

  let open = 0;
  if (forwardEnd && board[forwardEnd[1]]?.[forwardEnd[0]] === "") open++;
  if (backwardEnd && board[backwardEnd[1]]?.[backwardEnd[0]] === "") open++;
  return open;
}

function endPoint(x, y, dx, dy, stone) {
  let nx = x;
  let ny = y;

  for (let i = 1; i < 5; i++) {
    const tx = x + dx * i;
    const ty = y + dy * i;
    if (board[ty]?.[tx] === stone) {
      nx = tx;
      ny = ty;
    } else break;
  }

  const ex = nx + dx;
  const ey = ny + dy;

  if (ex < 0 || ex >= size || ey < 0 || ey >= size) return null;
  return [ex, ey];
}

function launchConfetti() {
  const count = 60;

  for (let i = 0; i < count; i++) {
    const c = document.createElement("div");
    c.className = "confetti";

    // 시작 위치: 화면 중앙 아래
    c.style.left = 40 + Math.random() * 20 + "vw";

    // 발사 방향 (사선)
    const x = (Math.random() - 0.5) * 600; // 좌우 퍼짐
    const y = -400 - Math.random() * 300; // 위로 쏘기

    c.style.setProperty("--x", `${x}px`);
    c.style.setProperty("--y", `${y}px`);

    c.style.backgroundColor = randomColor();
    c.style.animationDuration = 1.5 + Math.random() * 0.5 + "s";
    c.style.left = i % 2 === 0 ? "10vw" : "90vw";

    document.body.appendChild(c);
    setTimeout(() => c.remove(), 2500);
  }
}

function randomColor() {
  const colors = ["#ff4d4d", "#ffd93d", "#4dff4d", "#4dd2ff", "#b84dff"];
  return colors[Math.floor(Math.random() * colors.length)];
}

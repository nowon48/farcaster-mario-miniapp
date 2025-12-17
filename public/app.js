import { sdk } from 'https://esm.sh/@farcaster/miniapp-sdk';

const envPill = document.getElementById('envPill');
const userPill = document.getElementById('userPill');
const addBtn = document.getElementById('addBtn');
const castBtn = document.getElementById('castBtn');
const submitScoreBtn = document.getElementById('submitScoreBtn');
const leaderboardBtn = document.getElementById('leaderboardBtn');
const apiOut = document.getElementById('apiOut');

const scoreEl = document.getElementById('scoreEl');
const bestEl = document.getElementById('bestEl');

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const jumpBtn = document.getElementById('jumpBtn');

let context = null;
let best = Number(localStorage.getItem('bestScore') || 0);
bestEl.textContent = String(best);

// ---- Mini App init ----
(async () => {
  try {
    const inMiniApp = await sdk.isInMiniApp();
    envPill.textContent = `Environment: ${inMiniApp ? 'miniapp' : 'web'}`;

    if (inMiniApp) {
      context = await sdk.context;
      const u = context?.user;
      if (u?.fid) {
        const name = u.username ? `@${u.username}` : `FID ${u.fid}`;
        userPill.textContent = `User: ${name}`;
      } else {
        userPill.textContent = 'User: unknown';
      }

      // IMPORTANT: hide splash screen
      await sdk.actions.ready();
    } else {
      // Normal web: no context
      userPill.textContent = 'User: open inside Farcaster for FID';
    }
  } catch (e) {
    console.error(e);
    userPill.textContent = 'User: sdk error (see console)';
  }
})();

addBtn?.addEventListener('click', async () => {
  try {
    await sdk.actions.addMiniApp();
    apiOut.textContent = '✅ Added mini app!';
  } catch (e) {
    apiOut.textContent = `❌ addMiniApp error: ${e?.name || e}`;
  }
});

castBtn?.addEventListener('click', async () => {
  try {
    const score = Number(scoreEl.textContent || 0);
    await sdk.actions.composeCast({
      text: `I scored ${score} in Farcaster Mario! 🟡🎮`,
      embeds: [window.location.origin]
    });
  } catch (e) {
    apiOut.textContent = `❌ composeCast error: ${e?.name || e}`;
  }
});

// ---- Backend APIs (optional) ----
submitScoreBtn?.addEventListener('click', async () => {
  try {
    const score = Number(scoreEl.textContent || 0);
    const fid = context?.user?.fid ?? null;
    const username = context?.user?.username ?? null;

    const res = await fetch('/api/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score, fid, username })
    });
    const data = await res.json();
    apiOut.textContent = JSON.stringify(data, null, 2);
  } catch (e) {
    apiOut.textContent = `❌ submit score error: ${String(e)}`;
  }
});

leaderboardBtn?.addEventListener('click', async () => {
  try {
    const res = await fetch('/api/leaderboard');
    const data = await res.json();
    apiOut.textContent = JSON.stringify(data, null, 2);
  } catch (e) {
    apiOut.textContent = `❌ leaderboard error: ${String(e)}`;
  }
});

// ---- Game (simple Mario-style platformer) ----
const GRAVITY = 0.6;
const MOVE_SPEED = 3.0;
const JUMP_FORCE = -12;

const player = { x: 50, y: 0, w: 32, h: 48, vx: 0, vy: 0, onGround: false };
let score = 0;

const keys = { left: false, right: false, jump: false };

const platforms = [
  { x: 0, y: 400, w: 800, h: 50 },
  { x: 150, y: 320, w: 120, h: 20 },
  { x: 350, y: 260, w: 120, h: 20 },
  { x: 550, y: 200, w: 120, h: 20 },
];

let coins = [
  { x: 190, y: 280, r: 8, collected: false },
  { x: 390, y: 220, r: 8, collected: false },
  { x: 590, y: 160, r: 8, collected: false },
];

function rectRect(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}
function circleRect(cx, cy, r, rx, ry, rw, rh) {
  const closestX = Math.max(rx, Math.min(cx, rx + rw));
  const closestY = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy < r * r;
}

function setKey(dir, down) { keys[dir] = down; }

window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a') setKey('left', true);
  if (e.key === 'ArrowRight' || e.key === 'd') setKey('right', true);
  if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') setKey('jump', true);
});
window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a') setKey('left', false);
  if (e.key === 'ArrowRight' || e.key === 'd') setKey('right', false);
  if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') setKey('jump', false);
});

// Mobile buttons
function bindHold(btn, dir){
  if (!btn) return;
  btn.addEventListener('pointerdown', () => setKey(dir, true));
  btn.addEventListener('pointerup', () => setKey(dir, false));
  btn.addEventListener('pointercancel', () => setKey(dir, false));
  btn.addEventListener('pointerleave', () => setKey(dir, false));
}
bindHold(leftBtn, 'left');
bindHold(rightBtn, 'right');
jumpBtn?.addEventListener('pointerdown', () => setKey('jump', true));
jumpBtn?.addEventListener('pointerup', () => setKey('jump', false));

function resetLevel() {
  player.x = 50; player.y = 0; player.vx = 0; player.vy = 0; player.onGround = false;
  coins = coins.map(c => ({ ...c, collected:false }));
  score = 0;
  scoreEl.textContent = String(score);
}

function update() {
  // Input -> velocity
  player.vx = 0;
  if (keys.left) player.vx = -MOVE_SPEED;
  if (keys.right) player.vx = MOVE_SPEED;

  // Jump
  if (keys.jump && player.onGround) {
    player.vy = JUMP_FORCE;
    player.onGround = false;
  }

  // Physics
  player.vy += GRAVITY;
  player.x += player.vx;
  player.y += player.vy;

  // Bounds
  if (player.x < 0) player.x = 0;
  if (player.x + player.w > canvas.width) player.x = canvas.width - player.w;

  // Collisions
  player.onGround = false;
  for (const p of platforms) {
    if (rectRect(player.x, player.y, player.w, player.h, p.x, p.y, p.w, p.h)) {
      if (player.vy > 0 && player.y + player.h - player.vy <= p.y) {
        player.y = p.y - player.h;
        player.vy = 0;
        player.onGround = true;
      }
    }
  }

  // Coins
  for (const c of coins) {
    if (c.collected) continue;
    if (circleRect(c.x, c.y, c.r, player.x, player.y, player.w, player.h)) {
      c.collected = true;
      score += 10;
      scoreEl.textContent = String(score);
      if (score > best) {
        best = score;
        localStorage.setItem('bestScore', String(best));
        bestEl.textContent = String(best);
      }
    }
  }

  // Win: all coins collected -> keep playing, but show a hint in apiOut
  if (coins.every(c => c.collected)) {
    apiOut.textContent = `🎉 Level cleared! You can submit your score (${score}) or share it.`;
  }

  if (player.y > canvas.height + 50) resetLevel();

  draw();
  requestAnimationFrame(update);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // background
  ctx.fillStyle = '#151520';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // platforms
  ctx.fillStyle = '#54546a';
  for (const p of platforms) ctx.fillRect(p.x, p.y, p.w, p.h);

  // player
  ctx.fillStyle = '#ffd000';
  ctx.fillRect(player.x, player.y, player.w, player.h);

  // coins
  for (const c of coins) {
    if (c.collected) continue;
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    ctx.fillStyle = '#f2c94c';
    ctx.fill();
    ctx.closePath();
  }
}

resetLevel();
update();

/**
 * 高考结束了 · 十个仪式 v2
 * 沉浸式叙事：打字机、昵称、音效、亲手交互
 */

(function () {
  'use strict';

  if (window.__INAPP_BLOCKED__) return;

  const RITUAL_COUNT = 10;
  let current = 0;
  let userName = '';
  let soundOn = true;
  const AUDIO = window.GAOKAO_AUDIO;
  let rainAnimId = null;
  let tearAnimId = null;
  let ambientAnimId = null;
  let thanksSent = new Set();

  const POOLS = window.GAOKAO_POOLS;
  const rituals = document.querySelectorAll('.ritual');
  const progressDots = document.getElementById('progressDots');
  const progressLabel = document.getElementById('progressLabel');
  const heartbeatPulse = document.getElementById('heartbeatPulse');

  let memoryCards = [];
  let memoryIndex = 0;
  let releasePhrases = [];
  let selectedWish = '';
  let weightTotal = 5;
  let currentWeights = [];
  let lastReleasePhraseAt = 0;

  /* ===== Audio ===== */
  function ensureAudio() {
    AUDIO.init();
    return AUDIO.resume();
  }

  function updateSoundToggleUI() {
    const btn = document.getElementById('soundToggle');
    btn.textContent = soundOn ? '🔊' : '🔇';
    btn.classList.toggle('on', soundOn);
  }

  function playTypeTick() { if (soundOn) AUDIO.playTypeTick(); }
  function playClimax() { if (soundOn) AUDIO.playClimax(); }
  function playDrop() { if (soundOn) AUDIO.playDrop(); }
  function playHeartbeat() { if (soundOn) AUDIO.playHeartbeat(); }

  function blockModalBackdropClose(overlay) {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) e.stopPropagation();
    });
  }

  async function initIntroPrompt() {
    const prompt = document.getElementById('introPrompt');
    const okBtn = document.getElementById('introPromptOk');
    const guard = window.INTRO_GUARD;
    if (guard) {
      guard.mountPrivacy(document.getElementById('introPrivacyBody'));
      await guard.mountProtected(document.getElementById('introProtectedMount'));
    }
    if (!prompt || !okBtn) {
      showSoundPrompt();
      return;
    }

    blockModalBackdropClose(prompt);
    let left = 3;
    okBtn.textContent = `我知道了（${left}）`;
    const timer = setInterval(() => {
      left -= 1;
      if (left > 0) {
        okBtn.textContent = `我知道了（${left}）`;
      } else {
        clearInterval(timer);
        okBtn.disabled = false;
        okBtn.textContent = '我知道了';
      }
    }, 1000);

    okBtn.onclick = () => {
      if (okBtn.disabled) return;
      prompt.classList.add('hidden');
      showSoundPrompt();
    };
  }

  function setupSoundPrompt() {
    const prompt = document.getElementById('soundPrompt');
    const enableBtn = document.getElementById('soundPromptEnable');
    const skipBtn = document.getElementById('soundPromptSkip');
    const sub = prompt.querySelector('.sound-prompt-sub');

    blockModalBackdropClose(prompt);

    enableBtn.onclick = async () => {
      await ensureAudio();
      soundOn = true;
      AUDIO.setEnabled(true);
      updateSoundToggleUI();
      prompt.classList.add('hidden');
      AUDIO.playTypeTick();
    };

    skipBtn.onclick = () => {
      soundOn = false;
      AUDIO.setEnabled(false);
      updateSoundToggleUI();
      prompt.classList.add('hidden');
    };

    if (!AUDIO.supported()) {
      sub.textContent = '您的浏览器不支持动态音效，不影响文字与动画体验。';
      enableBtn.textContent = '知道了';
      skipBtn.classList.add('hidden');
      soundOn = false;
      AUDIO.setEnabled(false);
      enableBtn.onclick = () => prompt.classList.add('hidden');
      updateSoundToggleUI();
    } else {
      soundOn = true;
      AUDIO.setEnabled(true);
      AUDIO.init();
      updateSoundToggleUI();
    }
  }

  function showSoundPrompt() {
    const prompt = document.getElementById('soundPrompt');
    if (!prompt) return;
    prompt.classList.remove('hidden');
  }

  document.getElementById('soundToggle').addEventListener('click', async () => {
    if (!soundOn) {
      await ensureAudio();
      soundOn = true;
      AUDIO.setEnabled(true);
      AUDIO.setScene(current);
    } else {
      soundOn = false;
      AUDIO.setEnabled(false);
    }
    updateSoundToggleUI();
    if (soundOn) AUDIO.playTypeTick();
  });

  /* ===== Ambient particles ===== */
  function startAmbient() {
    const canvas = document.getElementById('ambientCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const particles = [];

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.5,
        vx: (Math.random() - 0.5) * 0.15,
        vy: -0.1 - Math.random() * 0.2,
        a: Math.random() * 0.4 + 0.1
      });
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 220, 180, ${p.a})`;
        ctx.fill();
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -5) { p.y = canvas.height + 5; p.x = Math.random() * canvas.width; }
      });
      ambientAnimId = requestAnimationFrame(draw);
    }
    draw();
  }

  /* ===== Typewriter engine ===== */
  function typewrite(el, lines, opts = {}) {
    if (!el) return Promise.resolve();
    const speed = opts.speed || 55;
    const emphasis = opts.emphasis || false;
    el.innerHTML = '';
    el.classList.toggle('emphasis', emphasis);

    return new Promise(resolve => {
      let lineIdx = 0;
      let charIdx = 0;

      function typeLine() {
        if (lineIdx >= lines.length) {
          el.innerHTML = lines.map(l => `<span class="type-line">${l}</span>`).join('');
          resolve();
          return;
        }

        const line = lines[lineIdx];
        if (charIdx === 0) {
          const span = document.createElement('span');
          span.className = 'type-line';
          el.appendChild(span);
        }

        const span = el.querySelectorAll('.type-line')[lineIdx];
        if (charIdx < line.length) {
          span.textContent = line.slice(0, charIdx + 1);
          if (soundOn && charIdx % 3 === 0) playTypeTick();
          charIdx++;
          setTimeout(typeLine, speed + Math.random() * 30);
        } else {
          const cursor = document.createElement('span');
          cursor.className = 'type-cursor';
          span.appendChild(cursor);
          lineIdx++;
          charIdx = 0;
          setTimeout(() => {
            cursor.remove();
            typeLine();
          }, opts.linePause || 600);
        }
      }
      typeLine();
    });
  }

  /* ===== Effects ===== */
  function climaxFlash() {
    const flash = document.createElement('div');
    flash.className = 'climax-flash';
    document.body.appendChild(flash);
    flash.addEventListener('animationend', () => flash.remove());
    if (soundOn) playClimax();
    if (navigator.vibrate) navigator.vibrate(40);
  }

  function screenShake() {
    document.body.classList.add('screen-shake');
    setTimeout(() => document.body.classList.remove('screen-shake'), 500);
  }

  function initProgress() {
    progressDots.innerHTML = '';
    for (let i = 0; i <= RITUAL_COUNT; i++) {
      const dot = document.createElement('span');
      progressDots.appendChild(dot);
    }
    updateProgress();
  }

  function updateProgress() {
    const dots = progressDots.querySelectorAll('span');
    dots.forEach((dot, i) => {
      dot.classList.remove('active', 'done');
      if (i < current) dot.classList.add('done');
      if (i === current) dot.classList.add('active');
    });
    progressLabel.textContent = current === 0 ? '封面' : `仪式 ${current} / ${RITUAL_COUNT}`;
  }

  function goTo(index) {
    if (index < 0 || index > RITUAL_COUNT) return;
    const prev = rituals[current];
    const next = rituals[index];

    if (current === 9 && index !== 9) {
      document.getElementById('skyStage').innerHTML = '';
      rituals[9]?.classList.remove('launched');
    }

    if (prev && prev !== next) {
      prev.classList.add('exit');
      prev.classList.remove('active');
      setTimeout(() => prev.classList.remove('exit'), 900);
    }

    const fromIndex = current;
    current = index;
    next.classList.add('active');
    updateProgress();
    document.body.classList.toggle('show-progress', current > 0);
    onRitualEnter(current, fromIndex);
  }

  function nextRitual() {
    if (current < RITUAL_COUNT) goTo(current + 1);
  }

  /* ===== Ritual enter handlers ===== */
  async function onRitualEnter(index, fromIndex = -1) {
    stopRain();
    stopTears();
    heartbeatPulse.classList.remove('active');
    if (soundOn) {
      const longFade = fromIndex === 4 && index === 5;
      AUDIO.setScene(index, { duration: longFade ? 3.8 : 2.2 });
    }

    switch (index) {
      case 0: runCover(); break;
      case 1: runDoor(); break;
      case 2: runPen(); break;
      case 3: runWeight(); break;
      case 4: runCry(); break;
      case 5: runMemory(); break;
      case 6: runLetter(); break;
      case 7: runThanks(); break;
      case 8: runRelease(); break;
      case 9: runWish(); break;
      case 10: runFinal(); break;
    }
  }

  async function runCover() {
    await typewrite(document.getElementById('coverType'), POOLS.getNarrative('cover', userName), { speed: 65 });
  }

  /* --- Ritual 1: Push door --- */
  let doorOpen = false;
  let doorProgress = 0;
  let doorInterval = null;

  function resetDoorVisual() {
    doorOpen = false;
    doorProgress = 0;
    if (doorInterval) {
      clearInterval(doorInterval);
      doorInterval = null;
    }
    const doorScene = document.getElementById('doorScene');
    const examHall = document.getElementById('examHall');
    const btnNext = document.getElementById('btnDoorNext');
    const hint = document.getElementById('doorHint');
    const left = doorScene?.querySelector('.door--left');
    const right = doorScene?.querySelector('.door--right');

    doorScene?.classList.remove('open', 'opening');
    examHall?.classList.remove('faded');
    btnNext?.classList.add('hidden');
    hint?.classList.add('hidden');
    hint?.classList.remove('door-handle-hint--ready');
    if (left) left.style.transform = '';
    if (right) right.style.transform = '';
    const fill = document.getElementById('doorPushFill');
    if (fill) fill.style.width = '0%';
    document.querySelectorAll('.door-push-bar').forEach(e => e.remove());
  }

  async function runDoor() {
    resetDoorVisual();
    const doorScene = document.getElementById('doorScene');
    const examHall = document.getElementById('examHall');
    const btnNext = document.getElementById('btnDoorNext');
    const hint = document.getElementById('doorHint');

    const bar = document.createElement('div');
    bar.className = 'door-push-bar';
    bar.id = 'doorPushBar';
    bar.innerHTML = '<div class="door-push-fill" id="doorPushFill"></div>';
    doorScene.appendChild(bar);

    await typewrite(document.getElementById('doorType'), POOLS.getNarrative('door', userName), { speed: 50, emphasis: true });

    hint.classList.remove('hidden');
    hint.classList.add('door-handle-hint--ready');
    bar.classList.add('door-push-bar--ready');
    setupDoorPush(doorScene, examHall, btnNext, hint);
  }

  function setupDoorPush(doorScene, examHall, btnNext, hint) {
    const left = doorScene.querySelector('.door--left');
    const right = doorScene.querySelector('.door--right');
    let fill = document.getElementById('doorPushFill');
    let lastPushSoundAt = 0;

    function pushTick() {
      doorProgress += 1.2;
      const deg = (doorProgress / 100) * 78;
      left.style.transform = `rotateY(${deg}deg)`;
      right.style.transform = `rotateY(-${deg}deg)`;
      if (fill) fill.style.width = `${doorProgress}%`;
      if (doorProgress > 20) doorScene.classList.add('opening');
      if (doorProgress - lastPushSoundAt >= 10) {
        lastPushSoundAt = doorProgress;
        if (soundOn) AUDIO.playDoorPush();
      }
      if (doorProgress >= 100 && !doorOpen) finishDoor();
    }

    function startPush(e) {
      if (e) e.preventDefault();
      if (doorOpen) return;
      doorInterval = setInterval(pushTick, 30);
    }

    function stopPush() {
      clearInterval(doorInterval);
      if (!doorOpen && doorProgress < 100) {
        doorProgress = Math.max(0, doorProgress - 2);
        const deg = (doorProgress / 100) * 78;
        left.style.transform = `rotateY(${deg}deg)`;
        right.style.transform = `rotateY(-${deg}deg)`;
        if (fill) fill.style.width = `${doorProgress}%`;
      }
    }

    function finishDoor() {
      clearInterval(doorInterval);
      doorOpen = true;
      doorScene.classList.add('open');
      examHall.classList.add('faded');
      hint.classList.add('hidden');
      screenShake();
      climaxFlash();
      if (soundOn) AUDIO.playDoorOpen();

      typewrite(document.getElementById('doorType'), [
        '光涌进来。',
        '蝉鸣。热风。自由的味道。',
        `${userName}，你出来了。`
      ], { speed: 60, emphasis: true }).then(() => {
        btnNext.classList.remove('hidden');
      });
    }

    const newHint = hint.cloneNode(true);
    hint.parentNode.replaceChild(newHint, hint);
    newHint.addEventListener('mousedown', startPush);
    newHint.addEventListener('mouseup', stopPush);
    newHint.addEventListener('mouseleave', stopPush);
    newHint.addEventListener('touchstart', startPush, { passive: false });
    newHint.addEventListener('touchend', stopPush);
  }

  document.getElementById('btnDoorNext').addEventListener('click', nextRitual);

  /* --- Ritual 2: Pen --- */
  let penReady = false;

  async function runPen() {
    penReady = false;
    const examPaper = document.getElementById('examPaper');
    const btnDrop = document.getElementById('btnDropPen');
    const writing = document.getElementById('paperWriting');
    document.getElementById('penMoment').classList.remove('dropped');
    document.getElementById('paperCursor')?.classList.remove('hidden');
    document.getElementById('penSpirit')?.classList.remove('visible');
    btnDrop.textContent = '让它休息';
    btnDrop.classList.add('hidden');
    writing.textContent = '';

    document.getElementById('penSpirit')?.classList.add('visible');

    await typewrite(document.getElementById('penType'), POOLS.getNarrative('pen', userName), { speed: 55 });

    const finalText = POOLS.getPenFinalLine(userName);
    let i = 0;
    const writeInterval = setInterval(() => {
      writing.textContent = finalText.slice(0, ++i);
      if (soundOn && i % 2 === 0) AUDIO.playPenScratch();
      if (i >= finalText.length) {
        clearInterval(writeInterval);
        document.getElementById('paperCursor')?.classList.add('hidden');
        setTimeout(() => btnDrop.classList.remove('hidden'), 600);
      }
    }, 120);
  }

  document.getElementById('btnDropPen').addEventListener('click', () => {
    if (penReady) { nextRitual(); return; }
    document.getElementById('penMoment').classList.add('dropped');
    playDrop();
    screenShake();
    climaxFlash();
    document.getElementById('btnDropPen').textContent = '它休息了……';
    setTimeout(() => {
      document.getElementById('btnDropPen').textContent = '继续 →';
      document.getElementById('btnDropPen').classList.replace('btn-primary', 'btn-ghost');
      penReady = true;
    }, 2000);
  });

  /* --- Ritual 3: Weights (random pool) --- */
  let weightsFallen = 0;

  async function runWeight() {
    weightsFallen = 0;
    const scene = document.getElementById('weightScene');
    const stack = document.getElementById('weightStack');
    const storyEl = document.getElementById('weightStory');
    const btnNext = document.getElementById('btnWeightNext');
    currentWeights = POOLS.getWeights(5);
    weightTotal = currentWeights.length;

    scene.classList.remove('lighter');
    storyEl.classList.add('hidden');
    btnNext.classList.add('hidden');
    document.getElementById('weightPerson').textContent = '你';

    stack.innerHTML = currentWeights.map((w, i) => `
      <button class="weight-item" type="button" data-idx="${i}">${escapeHtml(w.label)}</button>
    `).join('');

    await typewrite(document.getElementById('weightType'), POOLS.getWeightIntro(userName), { speed: 52 });
  }

  document.getElementById('weightStack').addEventListener('click', e => {
    const btn = e.target.closest('.weight-item');
    if (!btn || btn.classList.contains('fallen') || btn.classList.contains('falling')) return;
    btn.classList.add('falling');
    playDrop();

    const storyEl = document.getElementById('weightStory');
    storyEl.textContent = currentWeights[+btn.dataset.idx]?.story || '';
    storyEl.classList.remove('hidden');

    setTimeout(() => {
      btn.classList.add('fallen');
      weightsFallen++;
      document.getElementById('weightPerson').textContent =
        weightsFallen >= weightTotal ? '轻了' : `还有 ${weightTotal - weightsFallen} 件`;

      if (weightsFallen >= weightTotal) {
        document.getElementById('weightScene').classList.add('lighter');
        climaxFlash();
        screenShake();
        typewrite(document.getElementById('weightType'), [
          `${userName}，`,
          '今晚这些，不用背了。',
          '真的。'
        ], { speed: 60, emphasis: true }).then(() => {
          document.getElementById('btnWeightNext').classList.remove('hidden');
        });
      }
    }, 900);
  });

  document.getElementById('btnWeightNext').addEventListener('click', nextRitual);

  /* --- Ritual 4: Cry --- */
  let cried = false;

  async function runCry() {
    cried = false;
    document.getElementById('btnAllowCry').classList.add('hidden');
    document.getElementById('btnCryNext').classList.add('hidden');
    document.getElementById('cryWhisper').classList.add('hidden');
    startRain();

    await typewrite(document.getElementById('cryType'), POOLS.getNarrative('cry', userName), { speed: 58, emphasis: true });
    document.getElementById('btnAllowCry').classList.remove('hidden');
  }

  document.getElementById('btnAllowCry').addEventListener('click', async () => {
    if (cried) return;
    cried = true;
    heartbeatPulse.classList.add('active');
    startTears();
    document.getElementById('btnAllowCry').classList.add('hidden');
    climaxFlash();

    const whispers = [...POOLS.getCryWhispers(), `${userName}，真的辛苦了。`];
    const whisperEl = document.getElementById('cryWhisper');
    whisperEl.classList.remove('hidden');

    for (let i = 0; i < whispers.length; i++) {
      if (soundOn) playHeartbeat();
      whisperEl.textContent = whispers[i];
      await new Promise(r => setTimeout(r, 2200));
    }

    heartbeatPulse.classList.remove('active');
    document.getElementById('btnCryNext').classList.remove('hidden');
  });

  document.getElementById('btnCryNext').addEventListener('click', nextRitual);

  function startRain() {
    const canvas = document.getElementById('rainCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const drops = [];

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();

    for (let i = 0; i < 150; i++) {
      drops.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: 3 + Math.random() * 5,
        len: 12 + Math.random() * 22,
        opacity: 0.15 + Math.random() * 0.35
      });
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drops.forEach(d => {
        ctx.globalAlpha = d.opacity;
        ctx.strokeStyle = 'rgba(160, 190, 230, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + 1, d.y + d.len);
        ctx.stroke();
        d.y += d.speed;
        if (d.y > canvas.height) {
          d.y = -d.len;
          d.x = Math.random() * canvas.width;
        }
      });
      rainAnimId = requestAnimationFrame(draw);
    }
    draw();
  }

  function stopRain() {
    if (rainAnimId) cancelAnimationFrame(rainAnimId);
    rainAnimId = null;
  }

  function startTears() {
    const canvas = document.getElementById('tearCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const tears = [];

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    for (let i = 0; i < 20; i++) {
      tears.push({
        x: Math.random() * canvas.width,
        y: -10 - Math.random() * 100,
        speed: 1 + Math.random() * 2,
        size: 2 + Math.random() * 3
      });
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      tears.forEach(t => {
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = 'rgba(140, 180, 220, 0.6)';
        ctx.beginPath();
        ctx.ellipse(t.x, t.y, t.size * 0.6, t.size, 0, 0, Math.PI * 2);
        ctx.fill();
        t.y += t.speed;
        if (t.y > canvas.height) {
          t.y = -10;
          t.x = Math.random() * canvas.width;
        }
      });
      tearAnimId = requestAnimationFrame(draw);
    }
    draw();
  }

  function stopTears() {
    if (tearAnimId) cancelAnimationFrame(tearAnimId);
    tearAnimId = null;
    const canvas = document.getElementById('tearCanvas');
    if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  }

  /* --- Ritual 5: Memory — 手动点一张过一张 --- */
  async function runMemory() {
    memoryIndex = 0;
    memoryCards = POOLS.getMemories(5);
    const reel = document.getElementById('memoryReel');
    const progress = document.getElementById('memoryProgress');
    const btnNext = document.getElementById('btnMemoryNext');

    reel.innerHTML = memoryCards.map((m, i) => `
      <div class="memory-frame${i === 0 ? ' active' : ''}" data-index="${i}">
        <div class="polaroid">
          <span class="memory-year">${escapeHtml(m.year)}</span>
          <p>${escapeHtml(m.text)}</p>
        </div>
      </div>
    `).join('');

    progress.textContent = `1 / ${memoryCards.length}`;
    btnNext.classList.remove('hidden');
    btnNext.textContent = '下一张 →';
    btnNext.onclick = advanceMemory;
  }

  function advanceMemory() {
    const frames = document.querySelectorAll('#memoryReel .memory-frame');
    const progress = document.getElementById('memoryProgress');
    const btnNext = document.getElementById('btnMemoryNext');

    if (memoryIndex >= memoryCards.length - 1) {
      climaxFlash();
      btnNext.textContent = '看完了，继续 →';
      btnNext.onclick = nextRitual;
      return;
    }

    frames[memoryIndex].classList.add('exit-left');
    frames[memoryIndex].classList.remove('active');
    memoryIndex++;
    frames[memoryIndex].classList.add('active');
    progress.textContent = `${memoryIndex + 1} / ${memoryCards.length}`;
    if (soundOn) AUDIO.playUIClick(440 + memoryIndex * 40);

    if (memoryIndex === memoryCards.length - 1) {
      btnNext.textContent = '看完了，继续 →';
    }
  }

  /* --- Ritual 6: Letter --- */
  let letterDone = false;

  async function runLetter() {
    letterDone = false;
    document.getElementById('btnLetterNext').classList.add('hidden');
    document.getElementById('letterInput').value = '';
    document.getElementById('letterInput').disabled = false;
    document.getElementById('letterCount').textContent = '0';
    document.getElementById('btnSendLetter').disabled = true;
    document.getElementById('btnSendLetter').textContent = '让它飘走';
    document.getElementById('floatingLetters').innerHTML = '';

    const promptsEl = document.getElementById('letterPrompts');
    promptsEl.innerHTML = POOLS.getLetterPrompts(3).map(t =>
      `<button type="button" class="prompt-chip">${escapeHtml(t)}</button>`
    ).join('');

    await typewrite(document.getElementById('letterType'), POOLS.getLetterIntro(userName), { speed: 55 });
  }

  document.getElementById('letterPrompts').addEventListener('click', e => {
    const chip = e.target.closest('.prompt-chip');
    if (!chip) return;
    const input = document.getElementById('letterInput');
    input.value = chip.textContent;
    document.getElementById('letterCount').textContent = input.value.length;
    document.getElementById('btnSendLetter').disabled = false;
    input.focus();
  });

  document.getElementById('letterInput').addEventListener('input', e => {
    document.getElementById('letterCount').textContent = e.target.value.length;
    document.getElementById('btnSendLetter').disabled = !e.target.value.trim();
  });

  document.getElementById('btnSendLetter').addEventListener('click', () => {
    const text = document.getElementById('letterInput').value.trim();
    if (!text || letterDone) return;
    letterDone = true;

    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const el = document.createElement('div');
        el.className = 'float-letter';
        el.textContent = text;
        el.style.left = `${10 + Math.random() * 70}%`;
        el.style.top = `${40 + Math.random() * 30}%`;
        document.getElementById('floatingLetters').appendChild(el);
      }, i * 400);
    }

    document.getElementById('letterInput').disabled = true;
    document.getElementById('btnSendLetter').disabled = true;
    climaxFlash();
    setTimeout(() => document.getElementById('btnLetterNext').classList.remove('hidden'), 3500);
  });

  document.getElementById('btnLetterNext').addEventListener('click', nextRitual);

  /* --- Ritual 7: Thanks --- */
  async function runThanks() {
    thanksSent.clear();
    document.getElementById('btnThanksDone').classList.add('hidden');
    document.querySelectorAll('.thanks-card').forEach(c => {
      c.classList.remove('open', 'sent');
      const full = c.querySelector('.thanks-full');
      if (full) full.textContent = POOLS.getThanks(c.dataset.thanks);
    });
    await typewrite(document.getElementById('thanksType'), POOLS.getThanksIntro(userName), { speed: 52 });
  }

  document.querySelectorAll('.thanks-card').forEach(card => {
    card.addEventListener('click', () => {
      if (card.classList.contains('sent')) return;
      card.classList.add('open', 'sent');
      thanksSent.add(card.dataset.thanks);
      if (soundOn) AUDIO.playUIClick(480);
      climaxFlash();
      if (thanksSent.size >= 1) {
        document.getElementById('btnThanksDone').classList.remove('hidden');
      }
    });
  });

  document.getElementById('btnThanksDone').addEventListener('click', nextRitual);

  /* --- Ritual 8: Release (慢速沉浸) --- */
  let releaseProgress = 0;
  let releaseInterval = null;
  let released = false;
  let releaseReady = false;
  let burstCtx = null;
  let burstParticles = [];

  async function runRelease() {
    released = false;
    releaseReady = false;
    releaseProgress = 0;
    document.getElementById('releaseMeter').style.height = '0%';
    document.getElementById('releaseResult').classList.add('hidden');
    document.getElementById('btnReleaseNext').classList.add('hidden');
    document.getElementById('releaseWords').textContent = '';
    document.getElementById('btnRelease').style.opacity = '1';
    releasePhrases = POOLS.getReleasePhrases(12);
    phraseIdx = 0;
    lastReleasePhraseAt = 0;
    initBurstCanvas();

    await typewrite(document.getElementById('releaseType'), POOLS.getReleaseIntro(userName), { speed: 50 });
  }

  function initBurstCanvas() {
    const canvas = document.getElementById('burstCanvas');
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    burstCtx = canvas.getContext('2d');
  }

  let phraseIdx = 0;

  function startRelease() {
    if (released) return;
    document.getElementById('btnRelease').classList.add('holding');
    releaseInterval = setInterval(() => {
      releaseProgress += 0.55;
      document.getElementById('releaseMeter').style.height = `${releaseProgress}%`;

      if (releaseProgress - lastReleasePhraseAt >= 10) {
        lastReleasePhraseAt = releaseProgress;
        const words = document.getElementById('releaseWords');
        words.textContent = releasePhrases[phraseIdx % releasePhrases.length];
        words.style.animation = 'none';
        words.offsetHeight;
        words.style.animation = 'fadeIn 0.5s';
        phraseIdx++;
        if (soundOn) AUDIO.tone(80 + phraseIdx * 20, 0.12, 'sine', 0.05);
      }

      if (releaseProgress >= 100) finishRelease();
    }, 45);
  }

  function stopRelease() {
    document.getElementById('btnRelease').classList.remove('holding');
    clearInterval(releaseInterval);
    if (!released) {
      releaseProgress = Math.max(0, releaseProgress - 0.8);
      document.getElementById('releaseMeter').style.height = `${releaseProgress}%`;
    }
  }

  function finishRelease() {
    clearInterval(releaseInterval);
    released = true;
    document.getElementById('btnRelease').classList.remove('holding');
    document.getElementById('btnRelease').style.opacity = '0.25';
    document.getElementById('releaseWords').textContent = '';

    const result = document.getElementById('releaseResult');
    result.textContent = `${userName}，好了。可以喘口气了。`;
    result.classList.remove('hidden');

    spawnBurst();
    screenShake();
    climaxFlash();
    if (soundOn) AUDIO.playReleaseBurst();

    setTimeout(() => document.getElementById('btnReleaseNext').classList.remove('hidden'), 1800);
  }

  function spawnBurst() {
    const canvas = document.getElementById('burstCanvas');
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    for (let i = 0; i < 100; i++) {
      const angle = (Math.PI * 2 * i) / 100 + Math.random() * 0.3;
      const speed = 4 + Math.random() * 10;
      burstParticles.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color: `hsl(${15 + Math.random() * 35}, 85%, ${50 + Math.random() * 25}%)`
      });
    }
    animateBurst();
  }

  function animateBurst() {
    const canvas = document.getElementById('burstCanvas');
    if (!burstCtx) return;
    burstCtx.clearRect(0, 0, canvas.width, canvas.height);
    burstParticles = burstParticles.filter(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.04; p.life -= 0.01;
      if (p.life <= 0) return false;
      burstCtx.globalAlpha = p.life;
      burstCtx.fillStyle = p.color;
      burstCtx.beginPath();
      burstCtx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
      burstCtx.fill();
      return true;
    });
    if (burstParticles.length) requestAnimationFrame(animateBurst);
  }

  const btnRelease = document.getElementById('btnRelease');
  btnRelease.addEventListener('mousedown', startRelease);
  btnRelease.addEventListener('mouseup', stopRelease);
  btnRelease.addEventListener('mouseleave', stopRelease);
  btnRelease.addEventListener('touchstart', e => { e.preventDefault(); startRelease(); });
  btnRelease.addEventListener('touchend', stopRelease);
  document.getElementById('btnReleaseNext').addEventListener('click', nextRitual);

  /* --- Ritual 9: Wish bubbles + 宏伟放飞 --- */
  let launched = false;

  let currentWishBubbles = [];

  function renderWishBubbles() {
    const container = document.getElementById('wishBubbles');
    const chosen = document.getElementById('wishChosen');
    currentWishBubbles = POOLS.getWishBubbles(5);
    selectedWish = '';
    chosen?.classList.add('hidden');
    chosen.textContent = '';
    container.innerHTML = currentWishBubbles.map((w, i) =>
      `<button type="button" class="wish-bubble" data-idx="${i}" style="--delay:${i * 0.3}s">${escapeHtml(w)}</button>`
    ).join('');
  }

  document.getElementById('wishBubbles').addEventListener('click', e => {
    const bubble = e.target.closest('.wish-bubble');
    if (!bubble || launched) return;
    document.querySelectorAll('.wish-bubble').forEach(b => b.classList.remove('selected'));
    bubble.classList.add('selected');
    selectedWish = currentWishBubbles[+bubble.dataset.idx] || '';
    const chosen = document.getElementById('wishChosen');
    if (chosen && selectedWish) {
      chosen.textContent = `✦ 已选：${selectedWish}`;
      chosen.classList.remove('hidden');
    }
    if (soundOn) AUDIO.playUIClick(520);
  });

  async function runWish() {
    launched = false;
    selectedWish = '';
    document.getElementById('wishInput').value = '';
    document.getElementById('wishInput').disabled = false;
    document.querySelector('.wish-custom')?.removeAttribute('open');
    document.getElementById('btnLaunch').disabled = false;
    document.getElementById('btnLaunch').textContent = '放飞万千愿望';
    document.getElementById('btnWishNext').classList.add('hidden');
    document.getElementById('skyStage').innerHTML = '';
    document.querySelector('[data-ritual="9"]')?.classList.remove('launched');
    renderWishBubbles();
    await typewrite(document.getElementById('wishType'), POOLS.getWishIntro(userName), { speed: 55 });
  }

  function balloonSizeClass(wish) {
    const len = wish.length;
    if (len <= 6) return 'balloon--sm';
    if (len <= 10) return '';
    if (len <= 14) return 'balloon--md';
    return 'balloon--lg';
  }

  function launchLantern(wish, leftPct, delay) {
    const skyStage = document.getElementById('skyStage');
    if (!skyStage) return;
    const balloon = document.createElement('div');
    balloon.className = `balloon ${balloonSizeClass(wish)}`;
    balloon.style.left = `${leftPct}%`;
    balloon.style.setProperty('--drift', `${(Math.random() - 0.5) * 90}px`);
    balloon.style.setProperty('--rise-dur', `${9 + Math.random() * 6}s`);
    balloon.style.setProperty('--rise-delay', `${delay}ms`);
    balloon.innerHTML = `
      <div class="balloon-body"><span class="balloon-text">${escapeHtml(wish)}</span></div>
      <div class="balloon-knot"></div>
      <div class="balloon-string"></div>`;
    balloon.addEventListener('animationend', () => balloon.remove(), { once: true });
    skyStage.appendChild(balloon);
  }

  document.getElementById('btnLaunch').addEventListener('click', () => {
    if (launched) return;
    launched = true;
    document.querySelector('[data-ritual="9"]')?.classList.add('launched');

    const custom = document.getElementById('wishInput').value.trim();
    const batch = POOLS.getWishBatch(56);
    if (selectedWish && !batch.includes(selectedWish)) batch[0] = selectedWish;
    if (custom) batch[1] = custom;

    const count = 56;
    for (let n = 0; n < count; n++) {
      const wish = batch[n % batch.length];
      const left = 5 + Math.random() * 90;
      const delay = n * 45 + Math.random() * 100;
      launchLantern(wish, left, delay);
      if (soundOn && n % 6 === 0) AUDIO.playLanternWhoosh();
    }

    document.getElementById('wishInput').disabled = true;
    document.getElementById('btnLaunch').disabled = true;
    document.querySelectorAll('.wish-bubble').forEach(b => { b.disabled = true; });
    climaxFlash();
    if (soundOn) {
      for (let i = 0; i < 5; i++) setTimeout(() => AUDIO.tone(300 + i * 80, 0.3, 'sine', 0.05), i * 200);
    }
    setTimeout(() => document.getElementById('btnWishNext').classList.remove('hidden'), 12000);
  });

  document.getElementById('btnWishNext').addEventListener('click', nextRitual);

  /* --- Ritual 10: Final --- */
  async function runFinal() {
    document.getElementById('finalTitle').textContent = `${userName}，欢迎回来`;
    document.getElementById('finalBadgeText').textContent = `${userName}，十个仪式全部走完了`;
    await typewrite(document.getElementById('finalType'), POOLS.getNarrative('final', userName), { speed: 58, emphasis: true });
    climaxFlash();
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  /* ===== Cover: name + start (memory only, no storage) ===== */
  const nameInput = document.getElementById('nameInput');
  const btnStart = document.getElementById('btnStart');

  function syncStartBtn() {
    const hasName = !!nameInput.value.trim();
    btnStart.disabled = !hasName;
    btnStart.setAttribute('aria-disabled', String(!hasName));
  }

  ['input', 'change', 'keyup', 'paste', 'compositionend'].forEach(evt => {
    nameInput.addEventListener(evt, syncStartBtn);
  });

  nameInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && nameInput.value.trim()) startJourney();
  });

  function startJourney() {
    const name = nameInput.value.trim();
    if (!name) {
      nameInput.focus();
      nameInput.classList.add('shake');
      setTimeout(() => nameInput.classList.remove('shake'), 400);
      return;
    }
    userName = name;
    POOLS.resetSessionPools?.();
    ensureAudio();
    goTo(1);
  }

  btnStart.addEventListener('click', startJourney);
  syncStartBtn();

  document.getElementById('btnReplay').addEventListener('click', () => {
    thanksSent.clear();
    POOLS.resetSessionPools?.();
    memoryIndex = 0;
    launched = false;
    resetDoorVisual();
    goTo(0);
    typewrite(document.getElementById('coverType'), POOLS.getNarrative('cover', userName), { speed: 65 });
  });

  /* ===== Init ===== */
  initProgress();
  setupSoundPrompt();
  initIntroPrompt();
  startAmbient();
  typewrite(document.getElementById('coverType'), POOLS.getNarrative('cover', userName), { speed: 65 });
})();

/* Mente Confusa — telas, progressão e regras do jogo. */
(function () {
  'use strict';

  const {
    Store, Sfx, Music, Fx, Modal, toast, vibrate, dateKey, dayDiff, shuffle,
    mulberry32, hashString, clamp, el, esc, nf, playerLevel,
  } = window.MC;
  const D = window.MC_DATA;
  const S = () => Store.data;

  const TOTAL_LEVELS = D.WORLDS.length * D.FASES.length;
  const LETTERS = ['A', 'B', 'C', 'D'];

  let run = null;
  let result = null;
  let navStack = [];
  let currentScreen = 'home';
  let onboardAvatar = null;

  /* =========================================================
     Helpers de progressão
     ========================================================= */
  const levelKey = (w, f) => `${w}:${f}`;

  function orderedLevels() {
    const list = [];
    D.WORLDS.forEach((w, wi) => D.FASES.forEach((f, fi) => {
      list.push({ world: w, worldIndex: wi, fase: f, faseIndex: fi, key: levelKey(w.id, fi) });
    }));
    return list;
  }

  function isUnlocked(worldIndex, faseIndex) {
    const idx = worldIndex * D.FASES.length + faseIndex;
    if (idx === 0) return true;
    const prev = orderedLevels()[idx - 1];
    return (S().stars[prev.key] || 0) > 0;
  }

  function levelStars(worldIndex, faseIndex) {
    return S().stars[levelKey(D.WORLDS[worldIndex].id, faseIndex)] || 0;
  }

  function totalStars() {
    return Object.values(S().stars).reduce((a, b) => a + (Number(b) || 0), 0);
  }
  function completedLevels() {
    return Object.values(S().stars).filter((v) => (Number(v) || 0) > 0).length;
  }
  function nextLevel() {
    const levels = orderedLevels();
    for (const lv of levels) {
      if ((S().stars[lv.key] || 0) === 0 && isUnlocked(lv.worldIndex, lv.faseIndex)) return lv;
    }
    return levels[levels.length - 1];
  }
  function nextAfter(worldIndex, faseIndex) {
    if (faseIndex < D.FASES.length - 1) return { worldIndex, faseIndex: faseIndex + 1 };
    if (worldIndex < D.WORLDS.length - 1) return { worldIndex: worldIndex + 1, faseIndex: 0 };
    return null;
  }

  function starsMarkup(n, size) {
    let out = '';
    for (let i = 0; i < 3; i++) {
      out += `<span class="star ${i < n ? 'on' : ''} ${size || ''}">${i < n ? '★' : '☆'}</span>`;
    }
    return out;
  }

  /* =========================================================
     Navegação
     ========================================================= */
  const renderers = {
    home: renderHome,
    trail: renderTrail,
    'multi-setup': renderMultiSetup,
    online: renderOnline,
    ranking: renderRanking,
    shop: renderShop,
    settings: renderSettings,
  };

  function setScreen(name) {
    currentScreen = name;
    document.querySelectorAll('.screen').forEach((s) => {
      s.classList.toggle('active', s.dataset.screen === name);
    });
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }

  function go(name, opts) {
    if (['trail', 'ranking', 'shop', 'settings', 'home'].includes(name) && currentScreen !== name) {
      if (currentScreen !== 'game') navStack.push(currentScreen);
    }
    if (name !== 'game') Music.stop(0.12);
    setScreen(name);
    if (renderers[name]) renderers[name]();
    if (opts && opts.anchor) {
      const node = el(opts.anchor);
      if (node) node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function back() {
    const prev = navStack.pop() || 'home';
    setScreen(prev);
    if (renderers[prev]) renderers[prev]();
  }

  /* =========================================================
     HOME
     ========================================================= */
  function renderHome() {
    const s = S();
    const pl = playerLevel(s.xp);
    el('home-avatar').textContent = s.avatar;
    el('home-name').textContent = s.name || 'Jogador';
    el('home-level').textContent = `Nível ${pl.level}`;
    el('home-xp').textContent = `${nf.format(pl.into)} / ${pl.needed} XP`;
    el('home-xp-bar').style.width = `${(pl.into / pl.needed) * 100}%`;
    document.querySelectorAll('.coins-out').forEach((n) => (n.textContent = nf.format(s.coins)));
    el('home-coins').textContent = nf.format(s.coins);

    const streak = s.streak.count || 0;
    el('home-strip').innerHTML = `
      <div class="stat"><span>🔥</span><b>${streak}</b><small>${streak === 1 ? 'dia seguido' : 'dias seguidos'}</small></div>
      <div class="stat"><span>⭐</span><b>${totalStars()}</b><small>de ${TOTAL_LEVELS * 3} estrelas</small></div>
      <div class="stat"><span>🏅</span><b>${s.bestScore ? nf.format(s.bestScore) : '—'}</b><small>recorde</small></div>`;

    const next = nextLevel();
    const done = completedLevels();
    const allDone = done >= TOTAL_LEVELS;
    el('play-label').textContent = allDone ? 'JOGAR DE NOVO' : done === 0 ? 'JOGAR AGORA' : 'CONTINUAR';
    el('play-sub').textContent = allDone
      ? 'Todas as fases concluídas'
      : `${next.world.name} • ${next.fase.name}`;

    el('trail-progress').textContent = `${done} / ${TOTAL_LEVELS} fases`;
    el('rank-best').textContent = s.bestScore ? `${nf.format(s.bestScore)} pts` : 'Sem recorde';
    const items = Object.values(s.powerups).reduce((a, b) => a + (Number(b) || 0), 0);
    el('shop-count').textContent = `${items} ${items === 1 ? 'ajuda' : 'ajudas'}`;

    const today = dateKey();
    const dailyDone = s.daily.date === today && s.daily.done;
    el('daily-status').textContent = dailyDone ? 'Feito hoje ✓' : 'Disponível';
    el('daily-status').classList.toggle('done', dailyDone);

    el('btn-sound').textContent = s.settings.sound ? '🔊' : '🔇';
    el('btn-sound').setAttribute('aria-pressed', String(!!s.settings.sound));
  }

  /* =========================================================
     TRILHA
     ========================================================= */
  function renderTrail() {
    const done = completedLevels();
    el('trail-sub').textContent = `${done} de ${TOTAL_LEVELS} fases concluídas • ${totalStars()} ⭐`;
    const box = el('trail-list');
    box.innerHTML = '';

    D.WORLDS.forEach((world, wi) => {
      const card = document.createElement('section');
      card.className = 'world-card';
      card.style.setProperty('--world', world.color);

      const wStars = D.FASES.reduce((a, _f, fi) => a + levelStars(wi, fi), 0);
      const head = document.createElement('div');
      head.className = 'world-head';
      head.innerHTML = `
        <div class="world-emoji">${world.emoji}</div>
        <div class="world-info">
          <h3>${esc(world.name)}</h3>
          <p>${esc(world.desc)}</p>
        </div>
        <div class="world-stars">${wStars}<small>/9 ★</small></div>`;
      card.appendChild(head);

      const phases = document.createElement('div');
      phases.className = 'world-phases';
      D.FASES.forEach((fase, fi) => {
        const unlocked = isUnlocked(wi, fi);
        const stars = levelStars(wi, fi);
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'phase-btn' + (unlocked ? '' : ' locked') + (stars > 0 ? ' done' : '');
        b.setAttribute('aria-label', `${world.name}, fase ${fi + 1} ${fase.name}${unlocked ? '' : ' (bloqueada)'}`);
        b.innerHTML = `
          <span class="phase-num">${unlocked ? (stars > 0 ? '✓' : fi + 1) : '🔒'}</span>
          <span class="phase-text"><b>${fase.name}</b><small>${fase.seconds}s • ${fase.count} perguntas</small></span>
          <span class="phase-stars">${starsMarkup(stars, 'sm')}</span>`;
        b.addEventListener('click', () => {
          if (!unlocked) {
            Sfx.play('wrong');
            toast('Conclua a fase anterior para desbloquear.');
            return;
          }
          Sfx.play('click');
          startLevel(wi, fi);
        });
        phases.appendChild(b);
      });
      card.appendChild(phases);
      box.appendChild(card);
    });
  }

  /* =========================================================
     PARTIDA
     ========================================================= */
  function prepareQuestion(q) {
    const order = shuffle(q.a.map((_, i) => i));
    return { q: q.q, a: order.map((i) => q.a[i]), c: order.indexOf(q.c), e: q.e, w: q.w, d: q.d };
  }

  function dailyQuestions() {
    const rng = mulberry32(hashString('mc-daily-' + dateKey()));
    const seeded = (arr) => {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };
    const pick = (d, n) => seeded(D.QUESTIONS.filter((q) => q.d === d)).slice(0, n);
    return seeded(pick(1, 3).concat(pick(2, 4), pick(3, 3))).map(prepareQuestion);
  }

  function startLevel(worldIndex, faseIndex) {
    if (!ensureProfile()) return;
    const world = D.WORLDS[worldIndex];
    const fase = D.FASES[faseIndex];
    const pool = D.QUESTIONS.filter((q) => q.w === world.id && q.d === fase.difficulty);
    const questions = shuffle(pool).slice(0, fase.count).map(prepareQuestion);
    beginRun({
      mode: 'level',
      worldIndex,
      faseIndex,
      worldName: world.name,
      faseName: `Fase ${faseIndex + 1} • ${fase.name}`,
      seconds: fase.seconds,
      questions,
    });
  }

  function startDaily() {
    if (!ensureProfile()) return;
    const s = S();
    const today = dateKey();
    if (s.daily.date === today && s.daily.done) {
      Modal.open({
        title: 'Desafio de hoje concluído',
        body: `<p>Você fez <b>${nf.format(s.daily.best || 0)} pontos</b> hoje. Volte amanhã para um novo desafio com perguntas diferentes.</p>
               <p class="hint">O desafio usa perguntas dos seis mundos e vale moedas em dobro.</p>`,
        actions: [
          { label: 'VER RANKING', onClick: () => { go('ranking'); } },
          { label: 'FECHAR', primary: true },
        ],
      });
      return;
    }
    beginRun({
      mode: 'daily',
      worldName: 'Desafio diário',
      faseName: '10 perguntas • 12s cada',
      seconds: D.DAILY.seconds,
      questions: dailyQuestions(),
    });
  }

  function beginRun(opts) {
    multi = null;
    el('handoff').hidden = true;
    el('multi-strip').hidden = true;
    run = {
      mode: opts.mode,
      worldIndex: opts.worldIndex,
      faseIndex: opts.faseIndex,
      worldName: opts.worldName,
      faseName: opts.faseName,
      questions: opts.questions,
      seconds: opts.seconds || 13,
      index: 0,
      lives: 3,
      livesMax: 3,
      score: 0,
      combo: 0,
      maxCombo: 0,
      correct: 0,
      answered: false,
      answeredCount: 0,
      selected: null,
      locked: false,
      used: {},
      raf: 0,
      deadline: 0,
      totalTime: opts.seconds || 13,
      lastWhole: null,
      hiddenAt: 0,
      finished: false,
      startedAt: Date.now(),
    };
    result = null;
    Sfx.play('click');
    setScreen('game');
    Music.start();
    el('game-world').textContent = run.worldName;
    el('game-fase').textContent = run.faseName;
    loadQuestion();
  }

  function loadQuestion() {
    if (!run) return;
    run.answered = false;
    run.selected = null;
    run.locked = false;
    run.used = {};
    run.totalTime = run.seconds;
    run.lastWhole = null;
    run.deadline = performance.now() + run.seconds * 1000;
    renderHud();
    paintTimer(run.totalTime, run.totalTime);
    renderQuestion();
    renderPowerbar();
    el('game-feedback').hidden = true;
    el('btn-next').hidden = true;
    startLoop();
  }

  function renderHud() {
    if (!run) return;
    const versus = (run.mode === 'multi' || run.mode === 'online') && multi;
    el('game-qnum').textContent = versus
      ? `R${multi.round + 1}`
      : `${run.index + 1}/${run.questions.length}`;
    el('game-score').textContent = nf.format(run.score);
    el('game-progress').style.width = versus
      ? `${((multi.round + 1) / multi.rounds) * 100}%`
      : `${((run.index + 1) / run.questions.length) * 100}%`;

    let hearts = '';
    if (run.mode === 'online') {
      hearts = `<span class="online-hud">✓ ${run.correct} ${run.correct === 1 ? 'acerto' : 'acertos'}</span>`;
    } else {
      for (let i = 0; i < run.livesMax; i++) hearts += `<span class="${i < run.lives ? 'on' : 'off'}">${i < run.lives ? '❤️' : '🤍'}</span>`;
    }
    el('game-hearts').innerHTML = hearts;
    el('game-hearts').setAttribute('aria-label', run.mode === 'online' ? `${run.correct} acertos` : `${run.lives} de ${run.livesMax} vidas`);

    const mult = 1 + Math.min(Math.floor(run.combo / 2), 4) * 0.5;
    const combo = el('game-combo');
    combo.textContent = `COMBO ×${mult % 1 === 0 ? mult.toFixed(0) : mult.toFixed(1)}`;
    combo.classList.toggle('active', run.combo >= 2);
    combo.classList.toggle('hot', run.combo >= 6);
    if (run.combo >= 2) combo.textContent += ` • ${run.combo} seguidas`;
  }

  function renderQuestion() {
    const q = run.questions[run.index];
    const world = D.WORLDS.find((w) => w.id === q.w);
    el('game-cat').textContent = (world ? world.name : 'Desafio').toUpperCase();
    el('game-cat').style.color = world ? world.color : 'var(--cyan)';
    el('game-question').textContent = q.q;

    const box = el('game-answers');
    box.innerHTML = '';
    q.a.forEach((text, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'answer';
      b.dataset.i = String(i);
      b.innerHTML = `<span class="letter">${LETTERS[i]}</span><span class="answer-text">${esc(text)}</span><span class="mark" aria-hidden="true"></span>`;
      b.addEventListener('click', () => choose(i));
      box.appendChild(b);
    });

    const card = el('question-card');
    card.classList.remove('shake');
    // reinicia a animação de entrada
    card.style.animation = 'none';
    void card.offsetWidth;
    card.style.animation = '';
  }

  function startLoop() {
    cancelAnimationFrame(run.raf);
    run.raf = requestAnimationFrame(tick);
  }

  function tick() {
    if (!run || run.finished || run.answered) return;
    const left = Math.max(0, (run.deadline - performance.now()) / 1000);
    paintTimer(left, run.totalTime);
    if (left <= 3.05 && left > 0) {
      const whole = Math.ceil(left);
      if (run.lastWhole !== whole) { run.lastWhole = whole; Sfx.play('tick'); }
    }
    if (left <= 0) { handleTimeout(); return; }
    run.raf = requestAnimationFrame(tick);
  }

  function paintTimer(left, total) {
    const ratio = clamp(total > 0 ? left / total : 0, 0, 1);
    const ring = el('timer-ring');
    ring.style.setProperty('--p', (ratio * 100).toFixed(1));
    ring.classList.toggle('low', ratio <= 0.35);
    el('timer-num').textContent = String(Math.ceil(left));
  }

  function choose(i) {
    if (!run || run.finished || run.answered || run.locked || run.awaitingReady) return;
    if (run.mode === 'online') { onlineChoose(i); return; }
    const q = run.questions[run.index];
    const left = Math.max(0, (run.deadline - performance.now()) / 1000);
    run.answered = true;
    run.answeredCount += 1;
    run.selected = i;
    run.locked = true;
    cancelAnimationFrame(run.raf);
    paintTimer(left, run.totalTime);

    const buttons = Array.from(el('game-answers').children);
    buttons.forEach((b) => { b.disabled = true; });

    const ok = i === q.c;
    if (ok) {
      const mult = 1 + Math.min(Math.floor(run.combo / 2), 4) * 0.5;
      const base = 100 + Math.round(left) * 10;
      const points = Math.round(base * mult);
      run.score += points;
      run.correct += 1;
      run.combo += 1;
      run.maxCombo = Math.max(run.maxCombo, run.combo);
      buttons[i].classList.add('picked', 'correct');
      const mark = buttons[i].querySelector('.mark');
      if (mark) mark.textContent = '✓';
      if (mult > 1) {
        const chip = document.createElement('span');
        chip.className = 'points-chip';
        chip.textContent = `+${nf.format(points)} ×${mult % 1 === 0 ? mult : mult.toFixed(1)}`;
        buttons[i].appendChild(chip);
      }
      Sfx.play('correct');
      vibrate(35);
      const rect = buttons[i].getBoundingClientRect();
      Fx.burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 26);
      flashScore();
      showFeedback(true, points, q);
    } else {
      run.lives -= 1;
      run.combo = 0;
      buttons[i].classList.add('picked', 'wrong');
      const mark = buttons[i].querySelector('.mark');
      if (mark) mark.textContent = '✕';
      buttons[q.c].classList.add('correct');
      el('question-card').classList.add('shake');
      Sfx.play('wrong');
      vibrate([45, 60, 45]);
      showFeedback(false, 0, q);
    }
    if (run.mode === 'multi') syncMultiPlayer();
    renderHud();
    renderPowerbar();
  }

  function handleTimeout() {
    if (!run || run.finished || run.answered || run.awaitingReady) return;
    const q = run.questions[run.index];
    run.answered = true;
    run.answeredCount += 1;
    run.selected = null;
    run.locked = true;
    run.lives -= 1;
    run.combo = 0;
    cancelAnimationFrame(run.raf);
    paintTimer(0, run.totalTime);

    const buttons = Array.from(el('game-answers').children);
    buttons.forEach((b) => { b.disabled = true; });
    buttons[q.c].classList.add('correct');
    Sfx.play('wrong');
    vibrate([60, 80, 60]);
    el('question-card').classList.add('shake');
    showFeedback(false, 0, q, true);
    if (run.mode === 'multi') syncMultiPlayer();
    renderHud();
    renderPowerbar();
  }

  function showFeedback(ok, points, q, timeout) {
    const fb = el('game-feedback');
    const head = el('feedback-head');
    const text = el('feedback-text');
    const lastQuestion = run.index >= run.questions.length - 1;
    const dead = run.lives <= 0;

    if (ok) {
      head.innerHTML = `<span class="fb-icon">🎉</span><b>ACERTOU!</b><span class="fb-points">+${nf.format(points)}</span>`;
      fb.className = 'feedback ok';
    } else if (timeout) {
      head.innerHTML = `<span class="fb-icon">⏱️</span><b>TEMPO ESGOTADO</b>`;
      fb.className = 'feedback bad';
    } else {
      head.innerHTML = `<span class="fb-icon">💥</span><b>OPS, ERROU</b>`;
      fb.className = 'feedback bad';
    }
    text.textContent = q.e || '';
    fb.hidden = false;

    const next = el('btn-next');
    next.hidden = false;
    if (run.mode === 'multi') {
      const done = isLastMultiTurn();
      next.textContent = done ? 'VER RESULTADO' : 'PRÓXIMO JOGADOR';
      next.classList.toggle('danger', done && run.lives <= 0);
    } else {
      next.textContent = dead || lastQuestion ? 'VER RESULTADO' : 'PRÓXIMA PERGUNTA';
      next.classList.toggle('danger', dead);
    }
    next.focus({ preventScroll: true });
  }

  function flashScore() {
    const node = el('game-score');
    node.classList.remove('bump');
    void node.offsetWidth;
    node.classList.add('bump');
  }

  function nextQuestion() {
    if (!run || run.finished) return;
    if (run.mode === 'online') { onlineNextPressed(); return; }
    if (run.mode === 'multi') { advanceMulti(); return; }
    if (run.lives <= 0 || run.index >= run.questions.length - 1) { finishRun(); return; }
    Sfx.play('click');
    run.index += 1;
    loadQuestion();
  }

  /* ---------- ajudas ---------- */
  function renderPowerbar() {
    if (!run) return;
    const box = el('game-powerbar');
    if (run.mode === 'multi' || run.mode === 'online') { box.hidden = true; box.innerHTML = ''; return; }
    box.hidden = !!run.answered;
    box.innerHTML = '';
    Object.values(D.POWERUPS).forEach((p) => {
      const count = S().powerups[p.id] || 0;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'power' + (count <= 0 ? ' empty' : '');
      b.dataset.power = p.id;
      b.disabled = run.answered;
      b.innerHTML = `<span class="p-emoji">${p.emoji}</span><span class="p-name">${p.name}</span><span class="p-count">${count}</span>`;
      b.setAttribute('aria-label', `${p.name}, ${count} disponível(is)`);
      b.addEventListener('click', () => usePower(p.id));
      box.appendChild(b);
    });
  }

  function usePower(id) {
    if (!run || run.finished || run.answered) return;
    if (run.used[id]) { toast('Você já usou essa ajuda nesta pergunta.'); return; }
    const count = S().powerups[id] || 0;
    if (count <= 0) {
      Sfx.play('wrong');
      toast('Sem unidades. Compre mais na loja.');
      return;
    }
    const q = run.questions[run.index];
    if (id === 'fifty') {
      const wrongs = q.a.map((_, i) => i).filter((i) => i !== q.c && !run.used['fifty-' + i]);
      const kill = shuffle(wrongs).slice(0, 2);
      const buttons = Array.from(el('game-answers').children);
      kill.forEach((i) => { buttons[i].classList.add('eliminated'); buttons[i].disabled = true; });
    } else if (id === 'time') {
      run.deadline += 10000;
      run.totalTime += 10;
      paintTimer((run.deadline - performance.now()) / 1000, run.totalTime);
      toast('+10 segundos!');
    } else if (id === 'skip') {
      consumePower(id);
      cancelAnimationFrame(run.raf);
      toast('Pergunta pulada.');
      if (run.index >= run.questions.length - 1) { finishRun(); return; }
      run.index += 1;
      loadQuestion();
      return;
    }
    consumePower(id);
    run.used[id] = true;
    renderPowerbar();
  }

  function consumePower(id) {
    const p = S().powerups;
    p[id] = Math.max(0, (p[id] || 0) - 1);
    Store.save();
    Sfx.play('power');
  }

  /* ---------- fim de partida ---------- */
  function finishRun() {
    if (!run || run.finished) return;
    run.finished = true;
    Music.stop(0.16);
    cancelAnimationFrame(run.raf);

    const s = S();
    const total = run.questions.length;
    const completed = run.lives > 0 && run.index >= total - 1;
    const isDaily = run.mode === 'daily';
    const stars = completed ? clamp(run.lives, 1, 3) : 0;

    const xpGain = isDaily
      ? 35 + run.correct * 12 + (completed ? 20 : 0)
      : completed
        ? 25 + run.correct * 12 + stars * 20
        : 5 + run.correct * 5;
    const coinGain = isDaily
      ? (completed ? 30 : 8) + run.correct * 8
      : completed
        ? 10 + run.correct * 5 + stars * 10
        : 3 + run.correct * 3;

    const levelBefore = playerLevel(s.xp).level;
    s.xp += xpGain;
    s.coins += coinGain;
    const levelAfter = playerLevel(s.xp).level;

    if (completed && !isDaily) {
      const key = levelKey(D.WORLDS[run.worldIndex].id, run.faseIndex);
      const previous = s.stars[key] || 0;
      if (stars > previous) s.stars[key] = stars;
    }

    s.bestScore = Math.max(s.bestScore, run.score);
    s.stats.runs += 1;
    s.stats.answered += run.answeredCount;
    s.stats.correct += run.correct;
    s.stats.bestCombo = Math.max(s.stats.bestCombo, run.maxCombo);

    // sequência de dias
    const today = dateKey();
    if (s.streak.last !== today) {
      if (s.streak.last && dayDiff(s.streak.last, today) === 1) s.streak.count += 1;
      else s.streak.count = 1;
      s.streak.last = today;
    }

    if (isDaily) {
      if (s.daily.date !== today) { s.daily.date = today; s.daily.done = false; s.daily.best = 0; }
      s.daily.done = true;
      s.daily.best = Math.max(s.daily.best || 0, run.score);
    }

    // ranking local
    const label = isDaily
      ? `Diário • ${run.correct}/${total}`
      : `${run.worldName} • Fase ${run.faseIndex + 1}`;
    s.ranking.push({
      name: s.name || 'Jogador',
      avatar: s.avatar,
      score: run.score,
      when: Date.now(),
      label,
    });
    s.ranking.sort((a, b) => b.score - a.score);
    s.ranking = s.ranking.slice(0, 25);

    Store.save();

    result = {
      mode: run.mode,
      completed,
      stars,
      score: run.score,
      correct: run.correct,
      total,
      maxCombo: run.maxCombo,
      xpGain,
      coinGain,
      levelUp: levelAfter > levelBefore,
      level: levelAfter,
      worldIndex: run.worldIndex,
      faseIndex: run.faseIndex,
      worldName: run.worldName,
      faseName: run.faseName,
      seconds: run.seconds,
      daily: isDaily,
    };

    renderResult();
    setScreen('result');
    if (completed) {
      Sfx.play('level');
      if (stars > 0) Fx.rain(stars * 40);
      vibrate([30, 40, 30, 40, 60]);
    } else {
      Sfx.play('gameover');
      vibrate(90);
    }
  }

  function renderResult() {
    const r = result;
    if (!r) return;
    el('res-kicker').textContent = r.daily ? 'DESAFIO DIÁRIO' : r.completed ? 'FASE CONCLUÍDA' : 'FASE NÃO CONCLUÍDA';
    el('res-kicker').classList.toggle('bad', !r.completed);
    el('res-stars').innerHTML = r.daily
      ? `<span class="star on big">${r.completed ? '🏅' : '📅'}</span>`
      : starsMarkup(r.stars, 'big');
    el('res-title').textContent = r.daily
      ? (r.completed ? 'Desafio do dia feito!' : 'Tente de novo amanhã')
      : !r.completed ? 'Acabaram as vidas'
        : r.stars === 3 ? 'Mente afiada!' : r.stars === 2 ? 'Muito bem!' : 'Passou raspando!';

    animateNumber(el('res-score'), r.score);

    el('res-stats').innerHTML = `
      <div class="res-stat"><b>${r.correct}/${r.total}</b><small>acertos</small></div>
      <div class="res-stat"><b>×${1 + Math.min(Math.floor(r.maxCombo / 2), 4) * 0.5}</b><small>melhor combo</small></div>
      <div class="res-stat"><b>${r.stars}/3</b><small>estrelas</small></div>`;

    el('res-rewards').innerHTML = `
      <span class="reward">+${r.xpGain} XP</span>
      <span class="reward">+${r.coinGain} <i class="coin-ico sm"></i></span>
      ${r.levelUp ? `<span class="reward levelup">NÍVEL ${r.level}! 🚀</span>` : ''}`;

    const primary = el('btn-result-primary');
    const secondary = el('btn-result-secondary');
    primary.onclick = null;
    secondary.onclick = null;

    if (r.daily) {
      primary.textContent = 'VOLTAR AO INÍCIO';
      primary.onclick = () => { Sfx.play('click'); go('home'); };
      secondary.textContent = 'COMPARTILHAR';
      secondary.onclick = () => shareResult();
    } else if (r.completed) {
      const nxt = nextAfter(r.worldIndex, r.faseIndex);
      if (nxt) {
        primary.textContent = 'PRÓXIMA FASE';
        primary.onclick = () => { Sfx.play('click'); startLevel(nxt.worldIndex, nxt.faseIndex); };
      } else {
        primary.textContent = 'VOLTAR À TRILHA';
        primary.onclick = () => { Sfx.play('click'); go('trail'); };
      }
      secondary.textContent = 'REPETIR FASE';
      secondary.onclick = () => { Sfx.play('click'); startLevel(r.worldIndex, r.faseIndex); };
    } else {
      primary.textContent = 'TENTAR DE NOVO';
      primary.onclick = () => { Sfx.play('click'); startLevel(r.worldIndex, r.faseIndex); };
      secondary.textContent = 'COMPARTILHAR';
      secondary.onclick = () => shareResult();
    }
  }

  function animateNumber(node, target) {
    if (S().settings.reducedMotion) { node.textContent = nf.format(target); return; }
    const start = performance.now();
    const dur = 750;
    const from = 0;
    const step = (now) => {
      const t = clamp((now - start) / dur, 0, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      node.textContent = nf.format(Math.round(from + (target - from) * eased));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function shareResult() {
    if (!result) return;
    const stars = result.daily ? '' : ' ' + '★'.repeat(result.stars) + '☆'.repeat(3 - result.stars);
    const text = `Fiz ${nf.format(result.score)} pontos no Mente Confusa${stars} (${result.correct}/${result.total} acertos). Será que você pensa melhor que eu?`;
    if (navigator.share) {
      navigator.share({ title: 'Mente Confusa', text }).catch(() => {});
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => toast('Resultado copiado!')).catch(() => fallbackShare(text));
      return;
    }
    fallbackShare(text);
  }
  function fallbackShare(text) {
    Modal.open({ title: 'Compartilhar', body: `<p class="share-text">${esc(text)}</p>`, actions: [{ label: 'FECHAR', primary: true }] });
  }

  /* =========================================================
     RANKING
     ========================================================= */
  function renderRanking() {
    const s = S();
    const stars = totalStars();
    const accuracy = s.stats.answered ? Math.round((s.stats.correct / s.stats.answered) * 100) : 0;
    el('stats-panel').innerHTML = `
      <div class="panel-title">SUAS ESTATÍSTICAS</div>
      <div class="stats-grid">
        <div class="mini-stat"><b>${s.bestScore ? nf.format(s.bestScore) : '—'}</b><small>recorde</small></div>
        <div class="mini-stat"><b>${stars}</b><small>estrelas</small></div>
        <div class="mini-stat"><b>${accuracy}%</b><small>precisão</small></div>
        <div class="mini-stat"><b>${s.stats.runs}</b><small>partidas</small></div>
        <div class="mini-stat"><b>×${1 + Math.min(Math.floor(s.stats.bestCombo / 2), 4) * 0.5}</b><small>melhor combo</small></div>
        <div class="mini-stat"><b>${s.streak.count || 0}</b><small>dias seguidos</small></div>
      </div>`;

    const box = el('ranking-list');
    const list = s.ranking.slice(0, 10);
    if (!list.length) {
      box.innerHTML = `<div class="empty"><span>🏆</span><p>Ainda não há partidas registradas.<br>Jogue uma fase para estrear o ranking!</p></div>`;
      return;
    }
    const medals = ['🥇', '🥈', '🥉'];
    box.innerHTML = list.map((row, i) => `
      <div class="rank-row ${i < 3 ? 'top' : ''}">
        <div class="rank-pos">${medals[i] || (i + 1) + 'º'}</div>
        <div class="rank-avatar">${row.avatar || '🦊'}</div>
        <div class="rank-info">
          <b>${esc(row.name || 'Jogador')}</b>
          <small>${esc(row.label || 'Partida')} • ${new Date(row.when).toLocaleDateString('pt-BR')}</small>
        </div>
        <div class="rank-score">${nf.format(row.score)}<small>pts</small></div>
      </div>`).join('');
  }

  /* =========================================================
     LOJA
     ========================================================= */
  function renderShop() {
    const s = S();
    const box = el('shop-list');
    box.innerHTML = '';

    Object.values(D.POWERUPS).forEach((p) => {
      const owned = s.powerups[p.id] || 0;
      const card = document.createElement('div');
      card.className = 'shop-card';
      card.innerHTML = `
        <div class="shop-emoji">${p.emoji}</div>
        <div class="shop-info">
          <b>${p.name}</b>
          <small>${p.desc}</small>
          <span class="owned">Você tem: ${owned}</span>
        </div>
        <button type="button" class="buy-btn ${s.coins < p.price ? 'disabled' : ''}" ${s.coins < p.price ? 'aria-disabled="true"' : ''}>
          <i class="coin-ico"></i> ${p.price}
        </button>`;
      const buy = card.querySelector('.buy-btn');
      buy.addEventListener('click', () => {
        if (S().coins < p.price) {
          Sfx.play('wrong');
          toast('Moedas insuficientes. Jogue uma fase para ganhar mais.');
          return;
        }
        S().coins -= p.price;
        S().powerups[p.id] = (S().powerups[p.id] || 0) + 1;
        Store.save();
        Sfx.play('coin');
        toast(`${p.name} comprado!`);
        renderShop();
        renderHome();
      });
      box.appendChild(card);
    });
  }

  /* =========================================================
     MULTIJOGADOR LOCAL (2 a 4)
     ========================================================= */
  const MULTI_COLORS = ['#39d9ff', '#ff5ca8', '#ffd166', '#5cffb1'];
  const MULTI_ROUNDS = 5;
  const MULTI_SECONDS = [15, 15, 13, 13, 11];
  let multi = null;
  let multiDraft = [];

  function multiDefaultDraft() {
    const saved = S().multiPlayers;
    if (Array.isArray(saved) && saved.length >= 2) {
      return saved.slice(0, 4).map((p, i) => ({
        name: p && p.name ? String(p.name).slice(0, 18) : `Jogador ${i + 1}`,
        avatar: (p && p.avatar) || D.AVATARS[i % D.AVATARS.length],
      }));
    }
    return [
      { name: S().name || 'Jogador 1', avatar: S().avatar || '🦊' },
      { name: 'Jogador 2', avatar: '🐼' },
    ];
  }

  function openFriendsMenu() {
    Modal.open({
      title: 'Jogar com amigos',
      body: `<div class="mode-choice">
        <button type="button" class="mode-card" data-mode="local">
          <span class="mode-emoji">📱</span>
          <b>Neste celular</b>
          <small>2 a 4 pessoas passando o aparelho</small>
        </button>
        <button type="button" class="mode-card" data-mode="online">
          <span class="mode-emoji">🌐</span>
          <b>Cada um no seu</b>
          <small>Entre na mesma sala pelo código</small>
        </button>
      </div>`,
      actions: [{ label: 'CANCELAR', primary: true }],
    });
    document.querySelectorAll('.mode-card').forEach((b) => {
      b.addEventListener('click', () => {
        const mode = b.dataset.mode;
        Modal.close();
        Sfx.play('click');
        if (mode === 'local') openMultiSetup();
        else openOnline();
      });
    });
  }

  function openMultiSetup() {
    multiDraft = multiDefaultDraft();
    navStack = [];
    go('multi-setup');
  }

  function renderMultiSetup() {
    if (!multiDraft.length) multiDraft = multiDefaultDraft();
    const box = el('multi-players');
    box.innerHTML = '';
    multiDraft.forEach((p, i) => {
      const row = document.createElement('div');
      row.className = 'mplayer';
      row.style.setProperty('--pcolor', MULTI_COLORS[i]);
      row.innerHTML = `
        <button type="button" class="mplayer-avatar" aria-label="Trocar avatar de ${esc(p.name || 'jogador ' + (i + 1))}">${p.avatar}</button>
        <input type="text" maxlength="18" value="${esc(p.name || '')}" aria-label="Nome do jogador ${i + 1}" autocomplete="off">
        ${multiDraft.length > 2 ? `<button type="button" class="mplayer-remove" aria-label="Remover jogador ${i + 1}">✕</button>` : ''}`;
      row.querySelector('.mplayer-avatar').addEventListener('click', () => pickMultiAvatar(i));
      const input = row.querySelector('input');
      input.addEventListener('input', () => { multiDraft[i].name = input.value; });
      const rm = row.querySelector('.mplayer-remove');
      if (rm) rm.addEventListener('click', () => {
        multiDraft.splice(i, 1);
        Sfx.play('click');
        renderMultiSetup();
      });
      box.appendChild(row);
    });
    const add = el('btn-add-player');
    add.disabled = multiDraft.length >= 4;
    add.textContent = multiDraft.length >= 4 ? 'LIMITE DE 4 JOGADORES' : '+ ADICIONAR JOGADOR';
  }

  function pickMultiAvatar(index) {
    const current = multiDraft[index].avatar;
    const body = `<div class="avatar-grid" id="pick-grid">${D.AVATARS.map((a) =>
      `<button type="button" class="avatar-option ${a === current ? 'selected' : ''}" data-avatar="${a}" aria-label="Avatar ${a}">${a}</button>`).join('')}</div>`;
    Modal.open({ title: 'Escolha um avatar', body, actions: [{ label: 'FECHAR', primary: true }] });
    const grid = el('pick-grid');
    if (!grid) return;
    grid.addEventListener('click', (e) => {
      const b = e.target.closest('[data-avatar]');
      if (!b) return;
      multiDraft[index].avatar = b.dataset.avatar;
      Sfx.play('click');
      Modal.close();
      renderMultiSetup();
    });
  }

  function addMultiPlayer() {
    if (multiDraft.length >= 4) return;
    const used = new Set(multiDraft.map((p) => p.avatar));
    const avatar = D.AVATARS.find((a) => !used.has(a)) || D.AVATARS[multiDraft.length];
    multiDraft.push({ name: `Jogador ${multiDraft.length + 1}`, avatar });
    Sfx.play('click');
    renderMultiSetup();
  }

  function buildMultiQuestions(count) {
    const pools = { 1: [], 2: [], 3: [] };
    D.QUESTIONS.forEach((q) => { if (pools[q.d]) pools[q.d].push(q); });
    Object.keys(pools).forEach((k) => { pools[k] = shuffle(pools[k]); });
    const used = new Set();
    const rounds = [];
    for (let r = 0; r < MULTI_ROUNDS; r++) {
      const diff = r < 2 ? 1 : r < 4 ? 2 : 3;
      const row = [];
      for (let p = 0; p < count; p++) {
        let q = null;
        while (!q && pools[diff].length) {
          const cand = pools[diff].pop();
          if (!used.has(cand.q)) { q = cand; used.add(cand.q); }
        }
        row.push(prepareQuestion(q || shuffle(D.QUESTIONS)[0]));
      }
      rounds.push(row);
    }
    return rounds;
  }

  function startMultiMatch() {
    if (!multiDraft.length) multiDraft = multiDefaultDraft();
    const names = multiDraft.map((p, i) => (p.name || '').trim().slice(0, 18) || `Jogador ${i + 1}`);
    const lower = names.map((n) => n.toLowerCase());
    if (new Set(lower).size !== lower.length) {
      Sfx.play('wrong');
      toast('Use um nome diferente para cada jogador.');
      return;
    }
    S().multiPlayers = multiDraft.map((p, i) => ({ name: names[i], avatar: p.avatar }));
    Store.save();

    multi = {
      players: names.map((name, i) => ({
        id: i, name, avatar: multiDraft[i].avatar, color: MULTI_COLORS[i],
        score: 0, lives: 3, combo: 0, maxCombo: 0, correct: 0, answered: 0,
      })),
      rounds: MULTI_ROUNDS,
      round: 0,
      turn: 0,
      questions: buildMultiQuestions(names.length),
      finished: false,
    };
    run = null;
    result = null;
    Sfx.play('click');
    navStack = [];
    setScreen('game');
    prepareMultiTurn();
  }

  function prepareMultiTurn() {
    if (!multi || multi.finished) return;
    const player = multi.players[multi.turn];
    if (!player || player.lives <= 0) { advanceMulti(true); return; }
    const seconds = MULTI_SECONDS[multi.round] || 13;
    run = {
      mode: 'multi',
      worldIndex: 0,
      faseIndex: 0,
      worldName: 'Multijogador',
      faseName: `Rodada ${multi.round + 1}/${multi.rounds} • ${player.name}`,
      questions: [multi.questions[multi.round][multi.turn]],
      seconds,
      index: 0,
      lives: player.lives,
      livesMax: 3,
      score: player.score,
      combo: player.combo,
      maxCombo: player.maxCombo,
      correct: player.correct,
      answered: false,
      answeredCount: 0,
      selected: null,
      locked: false,
      awaitingReady: true,
      used: {},
      raf: 0,
      deadline: 0,
      totalTime: seconds,
      lastWhole: null,
      hiddenAt: 0,
      finished: false,
      startedAt: Date.now(),
    };

    el('game-world').textContent = 'Multijogador';
    el('game-fase').textContent = `Rodada ${multi.round + 1}/${multi.rounds}`;
    el('game-question').textContent = '';
    el('game-answers').innerHTML = '';
    el('game-cat').textContent = '';
    el('game-feedback').hidden = true;
    el('btn-next').hidden = true;
    el('game-powerbar').hidden = true;
    renderMultiStrip();
    renderHud();
    paintTimer(seconds, seconds);
    showHandoff(player);
  }

  function showHandoff(player) {
    const box = el('handoff');
    const card = el('handoff-card');
    card.style.setProperty('--pcolor', player.color);
    el('handoff-avatar').textContent = player.avatar;
    el('handoff-name').textContent = player.name;
    el('handoff-kicker').textContent = `VEZ DE • ${player.lives} ${player.lives === 1 ? 'VIDA' : 'VIDAS'}`;
    el('handoff-hint').textContent = multi.round === 0 && multi.turn === 0
      ? 'Toque em "Estou pronto" quando estiver com o celular.'
      : 'Passe o celular e não espie. Boa sorte!';
    el('btn-handoff').hidden = false;
    el('btn-handoff-cancel').hidden = false;
    box.hidden = false;
    el('btn-handoff').focus({ preventScroll: true });
  }

  function confirmHandoff() {
    if (!run || run.mode !== 'multi' || !run.awaitingReady) return;
    el('handoff').hidden = true;
    run.awaitingReady = false;
    Sfx.play('click');
    Music.start();
    loadQuestion();
  }

  function renderMultiStrip() {
    const strip = el('multi-strip');
    if (!strip) return;
    if (!(run && (run.mode === 'multi' || run.mode === 'online') && multi)) { strip.hidden = true; strip.innerHTML = ''; return; }
    strip.hidden = false;
    const versusOnline = multi.mode === 'online';
    strip.innerHTML = multi.players.map((p) => {
      const active = !versusOnline && p === multi.players[multi.turn];
      const hearts = '♥'.repeat(Math.max(0, p.lives)) || '—';
      return `<div class="multi-chip ${active ? 'active' : ''} ${p.lives <= 0 ? 'out' : ''}" style="--pcolor:${p.color}">
        <span class="mc-avatar" aria-hidden="true">${p.avatar}</span>
        <span class="mc-info">
          <span class="mc-name">${esc(p.name)}</span>
          <span class="mc-score">${nf.format(p.score)}</span>
          <span class="mc-life">${versusOnline ? `${p.correct || 0} acertos` : hearts}</span>
        </span>
      </div>`;
    }).join('');
  }

  function syncMultiPlayer() {
    if (!multi || !run || run.mode !== 'multi') return;
    const p = multi.players[multi.turn];
    if (!p) return;
    p.lives = run.lives;
    p.score = run.score;
    p.combo = run.combo;
    p.maxCombo = Math.max(p.maxCombo, run.maxCombo);
    p.correct = run.correct;
    p.answered += 1;
    renderMultiStrip();
  }

  function multiAliveCount() {
    return multi ? multi.players.filter((p) => p.lives > 0).length : 0;
  }

  function isLastMultiTurn() {
    if (!multi) return true;
    const n = multi.players.length;
    let r = multi.round;
    let t = multi.turn;
    for (let guard = 0; guard < n * multi.rounds + 1; guard++) {
      t += 1;
      if (t >= n) { t = 0; r += 1; }
      if (r >= multi.rounds) return true;
      if (multi.players[t].lives > 0 && multiAliveCount() > 1) return false;
    }
    return true;
  }

  function advanceMulti(silent) {
    if (!multi || multi.finished) return;
    const n = multi.players.length;
    let r = multi.round;
    let t = multi.turn;
    do {
      t += 1;
      if (t >= n) { t = 0; r += 1; }
      if (r >= multi.rounds) break;
    } while (multi.players[t].lives <= 0);

    if (r >= multi.rounds || multiAliveCount() <= 1) { finishMulti(); return; }
    multi.round = r;
    multi.turn = t;
    if (!silent) Sfx.play('click');
    prepareMultiTurn();
  }

  function finishMulti() {
    if (!multi || multi.finished) return;
    multi.finished = true;
    if (run) cancelAnimationFrame(run.raf);
    run = null;
    Music.stop(0.18);
    el('handoff').hidden = true;
    el('multi-strip').hidden = true;
    el('game-feedback').hidden = true;
    el('btn-next').hidden = true;

    const ranked = multi.players.slice().sort((a, b) =>
      b.score - a.score || b.lives - a.lives || b.correct - a.correct);
    const top = ranked[0];
    const tie = ranked.filter((p) => p.score === top.score).length > 1;

    el('multi-crown').textContent = tie ? '🤝' : '🏆';
    el('multi-winner').textContent = tie ? 'Empate no topo!' : `${top.name} venceu!`;
    el('multi-podium').innerHTML = ranked.map((p, i) => {
      const medal = ['🥇', '🥈', '🥉'][i] || `${i + 1}º`;
      return `<div class="podium-row ${i === 0 ? 'first' : ''}" style="--pcolor:${p.color}">
        <span class="podium-pos">${medal}</span>
        <span class="podium-avatar" aria-hidden="true">${p.avatar}</span>
        <span class="podium-info">
          <b>${esc(p.name)}</b>
          <small>${p.correct} ${p.correct === 1 ? 'acerto' : 'acertos'} • ${Math.max(0, p.lives)} ${p.lives === 1 ? 'vida' : 'vidas'}</small>
        </span>
        <span class="podium-score">${nf.format(p.score)}<small>pts</small></span>
      </div>`;
    }).join('');

    const today = dateKey();
    if (S().streak.last !== today) {
      S().streak.last = today;
      S().streak.count = 1;
      Store.save();
    }

    setScreen('multi-result');
    Sfx.play('level');
    Fx.rain(tie ? 50 : 80);
    vibrate([30, 40, 60]);
  }

  function rematchMulti() {
    if (!multi) { openMultiSetup(); return; }
    multiDraft = multi.players.map((p) => ({ name: p.name, avatar: p.avatar }));
    startMultiMatch();
  }

  /* =========================================================
     MULTIJOGADOR ONLINE (salas por código)
     ========================================================= */
  const ONLINE_BROKER = 'wss://broker.emqx.io:8084/mqtt';
  const ONLINE_PREFIX = 'menteconfusa/v1/sala/';
  const ONLINE_MAX = 4;
  const ONLINE_ROUNDS = 5;
  const ONLINE_TOTAL = 10;
  const ONLINE_SECONDS = [15, 15, 14, 14, 13, 13, 12, 12, 11, 11];
  const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  let online = null;
  let onlineName = '';
  let onlineAvatar = '';
  let mqttLoading = null;

  function loadMqtt() {
    if (window.mqtt) return Promise.resolve(window.mqtt);
    if (!mqttLoading) {
      mqttLoading = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'vendor/mqtt.min.js';
        s.onload = () => (window.mqtt ? resolve(window.mqtt) : reject(new Error('mqtt')));
        s.onerror = () => reject(new Error('mqtt'));
        document.head.appendChild(s);
      });
      mqttLoading.catch(() => { mqttLoading = null; });
    }
    return mqttLoading;
  }

  function randomCode(n) {
    let out = '';
    for (let i = 0; i < n; i++) out += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    return out;
  }

  function randomPid() {
    return 'p' + Math.random().toString(36).slice(2, 10);
  }

  function openOnline() {
    if (!online) {
      onlineName = (S().name || '').slice(0, 14);
      onlineAvatar = S().avatar || '🦊';
    }
    navStack = [];
    go('online');
    renderOnline();
  }

  function renderOnline() {
    document.querySelectorAll('.coins-out').forEach((n) => (n.textContent = nf.format(S().coins)));
    if (!onlineAvatar) onlineAvatar = S().avatar || '🦊';
    el('online-avatar').textContent = onlineAvatar;
    if (document.activeElement !== el('online-name')) el('online-name').value = onlineName;
    const inRoom = !!(online && online.code);
    el('online-entry').hidden = inRoom;
    el('online-room').hidden = !inRoom;
    if (inRoom) renderOnlineRoom();
  }

  function renderOnlineRoom() {
    if (!online) return;
    el('room-code').textContent = online.code;
    el('online-count').textContent = `${online.players.length}/${ONLINE_MAX}`;
    const status = el('online-status');
    const label = status.querySelector('span');
    const good = online.connected && !online.closed;
    status.classList.toggle('bad', !good);
    label.textContent = online.closed ? 'Anfitrião saiu' : online.connected ? 'Conectado' : 'Conectando…';

    el('online-players').innerHTML = online.players.map((p) => `
      <div class="mplayer" style="--pcolor:${p.color}">
        <span class="mplayer-avatar" style="cursor:default">${p.avatar}</span>
        <span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:1px">
          <b style="font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(p.name)}</b>
          <small style="font-size:10px;color:var(--muted)">${p.pid === online.hostPid ? 'Anfitrião' : 'Jogador'}</small>
        </span>
        ${p.pid === online.pid ? '<span class="online-tag">VOCÊ</span>' : ''}
      </div>`).join('');

    const isHost = online.role === 'host';
    const start = el('btn-online-start');
    start.hidden = !isHost;
    start.disabled = online.players.length < 2 || online.phase !== 'lobby';
    el('online-start-sub').textContent = online.players.length < 2
      ? 'Chame pelo menos mais 1 jogador'
      : `Partida com ${online.players.length} jogadores`;
    el('online-wait-hint').hidden = isHost || online.phase !== 'lobby';
    el('btn-copy-code').hidden = false;
  }

  function joinOnlineRoom() {
    const code = (el('input-room-code').value || '').trim().toUpperCase().slice(0, 5);
    if (code.length !== 5) { Sfx.play('wrong'); toast('O código da sala tem 5 caracteres.'); return; }
    if (!(onlineName || '').trim()) { Sfx.play('wrong'); toast('Digite seu nome primeiro.'); el('online-name').focus(); return; }
    Sfx.play('click');
    enterOnlineRoom(code, 'guest');
  }

  async function enterOnlineRoom(code, role) {
    const name = (onlineName || '').trim().slice(0, 14) || 'Jogador';
    await loadMqtt().catch(() => null);
    if (!window.mqtt) {
      toast('Sem conexão para o modo online. Verifique a internet.');
      return;
    }
    const pid = randomPid();
    const me = {
      pid, name, avatar: onlineAvatar, color: MULTI_COLORS[0],
      isHost: role === 'host', lives: 3, score: 0, combo: 0, maxCombo: 0, correct: 0, answered: 0,
    };
    online = {
      role, code, pid, topic: ONLINE_PREFIX + code,
      hostPid: role === 'host' ? pid : null,
      players: role === 'host' ? [me] : [],
      me,
      phase: role === 'host' ? 'lobby' : 'joining',
      client: null, connected: false, closed: false,
      round: 0, turnIdx: 0, questions: null, current: null, lastResult: null,
      turnTimer: null, autoTimer: null, hbTimer: null, watchTimer: null, joinTimer: null,
      lastSeen: Date.now(),
    };
    S().name = name;
    S().avatar = onlineAvatar;
    Store.save();
    multi = null;
    connectOnline();
  }

  function connectOnline() {
    const client = window.mqtt.connect(ONLINE_BROKER, {
      clientId: 'mc_' + online.pid + '_' + Math.random().toString(16).slice(2, 6),
      clean: true,
      connectTimeout: 9000,
      reconnectPeriod: 2500,
      keepalive: 30,
    });
    online.client = client;

    client.on('connect', () => {
      online.connected = true;
      online.closed = false;
      client.subscribe(online.topic, { qos: 0 });
      if (online.role === 'host') {
        broadcastLobby();
        clearInterval(online.hbTimer);
        online.hbTimer = setInterval(() => sendOnline({ t: 'hb' }), 5000);
        el('online-status') && renderOnlineRoom();
      } else {
        sendOnline({ t: 'join', pid: online.pid, name: online.me.name, avatar: online.me.avatar });
        clearInterval(online.hbTimer);
        online.hbTimer = setInterval(() => sendOnline({ t: 'hb' }), 5000);
        clearTimeout(online.joinTimer);
        online.joinTimer = setTimeout(() => {
          if (online && online.phase === 'joining') {
            toast('Sala não encontrada. Confira o código.');
            onlineLeave(true);
            go('online');
            renderOnline();
          }
        }, 9000);
        clearInterval(online.watchTimer);
        online.watchTimer = setInterval(() => {
          if (!online || online.role !== 'guest') return;
          if (Date.now() - online.lastSeen > 20000) {
            clearInterval(online.watchTimer);
            Modal.open({
              title: 'Conexão perdida',
              body: '<p>O anfitrião saiu da sala ou a internet caiu.</p>',
              actions: [{ label: 'VOLTAR', primary: true, onClick: () => { onlineLeave(true); go('online'); renderOnline(); } }],
            });
          }
        }, 4000);
      }
      renderOnlineRoom();
    });
    client.on('reconnect', () => { online.connected = false; renderOnlineRoom(); });
    client.on('close', () => { online.connected = false; renderOnlineRoom(); });
    client.on('error', () => { online.connected = false; renderOnlineRoom(); });
    client.on('message', (topic, payload) => onOnlineMessage(topic, payload));

    setScreen('online');
    renderOnline();
  }

  function sendOnline(obj) {
    if (!online || !online.client) return;
    try {
      online.client.publish(online.topic, JSON.stringify(Object.assign({ from: online.pid, ts: Date.now() }, obj)), { qos: 0 });
    } catch (_) {}
  }

  function sendOnlineTo(pid, obj) {
    if (!online || !online.client) return;
    try {
      online.client.publish(online.topic, JSON.stringify(Object.assign({ from: online.pid, to: pid, ts: Date.now() }, obj)), { qos: 0 });
    } catch (_) {}
  }

  function onOnlineMessage(topic, payload) {
    if (!online || online.topic !== topic) return;
    let msg = null;
    try { msg = JSON.parse(payload.toString()); } catch (_) { return; }
    if (!msg || !msg.t || msg.from === online.pid) return;
    if (msg.to && msg.to !== online.pid) return;
    if (online.role === 'host') handleHostMessage(msg);
    else handleGuestMessage(msg);
  }

  function onlinePublicPlayers() {
    if (!online) return [];
    return online.players.map((p) => ({
      pid: p.pid, name: p.name, avatar: p.avatar, color: p.color,
      score: p.score, lives: p.lives, combo: p.combo, correct: p.correct,
      isHost: p.pid === online.hostPid,
    }));
  }

  function syncOnlineRoster(list) {
    if (!online || !Array.isArray(list)) return;
    list.forEach((np) => {
      const p = online.players.find((x) => x.pid === np.pid);
      if (p) Object.assign(p, np);
      else online.players.push(Object.assign({ combo: 0, maxCombo: 0, answered: 0 }, np));
    });
    if (multi) multi.players = online.players;
  }

  function broadcastLobby() {
    if (!online || online.role !== 'host') return;
    sendOnline({ t: 'lobby', hostPid: online.pid, phase: online.phase, players: onlinePublicPlayers() });
  }

  function handleHostMessage(msg) {
    const sender = online.players.find((p) => p.pid === msg.from || p.pid === msg.pid);
    if (sender) sender.seen = Date.now();
    switch (msg.t) {
      case 'join': {
        if (online.phase === 'playing') {
          const known = online.players.find((p) => p.pid === msg.pid);
          if (!known) { sendOnlineTo(msg.pid, { t: 'busy' }); return; }
          sendOnlineTo(msg.pid, { t: 'welcome', hostPid: online.pid, players: onlinePublicPlayers(), phase: online.phase });
          if (online.current) {
            const p = online.players.find((x) => x.pid === msg.pid);
            if (!online.current.resolved) {
              sendOnlineTo(msg.pid, { t: 'question', index: online.qIndex, total: ONLINE_TOTAL, seconds: online.current.seconds, q: { q: online.current.q.q, a: online.current.q.a, w: online.current.q.w }, players: onlinePublicPlayers() });
            } else if (online.lastResolve) {
              sendOnlineTo(msg.pid, online.lastResolve);
            }
          }
          return;
        }
        const existing = online.players.find((p) => p.pid === msg.pid);
        if (existing) {
          if (msg.name) existing.name = String(msg.name).slice(0, 14);
          if (msg.avatar) existing.avatar = msg.avatar;
        } else {
          if (online.players.length >= ONLINE_MAX) { sendOnlineTo(msg.pid, { t: 'full' }); return; }
          online.players.push({
            pid: msg.pid,
            name: String(msg.name || 'Jogador').slice(0, 14),
            avatar: msg.avatar || '🐼',
            color: MULTI_COLORS[online.players.length % MULTI_COLORS.length],
            isHost: false, lives: 3, score: 0, combo: 0, maxCombo: 0, correct: 0, answered: 0, seen: Date.now(),
          });
        }
        sendOnlineTo(msg.pid, { t: 'welcome', hostPid: online.pid, players: onlinePublicPlayers(), phase: online.phase });
        broadcastLobby();
        Sfx.play('click');
        renderOnlineRoom();
        break;
      }
      case 'answer':
        hostRecordAnswer(msg.pid, typeof msg.choice === 'number' ? msg.choice : -1, Number(msg.ms) || 0);
        break;
      case 'again':
        if (online.phase === 'over') hostStartMatch();
        break;
      case 'bye': {
        const i = online.players.findIndex((p) => p.pid === msg.pid);
        if (i > 0) {
          online.players.splice(i, 1);
          if (online.phase === 'lobby') broadcastLobby();
          renderOnlineRoom();
        }
        break;
      }
      default: break;
    }
  }

  function handleGuestMessage(msg) {
    online.lastSeen = Date.now();
    switch (msg.t) {
      case 'welcome':
        clearTimeout(online.joinTimer);
        online.hostPid = msg.hostPid;
        online.phase = msg.phase || 'lobby';
        online.players = (msg.players || []).map((p) => Object.assign({ combo: 0, maxCombo: 0, answered: 0 }, p));
        renderOnlineRoom();
        break;
      case 'lobby':
        online.hostPid = msg.hostPid;
        online.phase = msg.phase || 'lobby';
        online.players = (msg.players || []).map((p) => Object.assign({ combo: 0, maxCombo: 0, answered: 0 }, p));
        if (online.phase === 'over') { /* permanece no pódio */ }
        else renderOnlineRoom();
        break;
      case 'full':
        toast('A sala já está cheia (4 jogadores).');
        onlineLeave(true);
        go('online');
        renderOnline();
        break;
      case 'busy':
        toast('A partida já começou nessa sala.');
        onlineLeave(true);
        go('online');
        renderOnline();
        break;
      case 'start': {
        online.phase = 'playing';
        online.players = (msg.players || []).map((p) => Object.assign({ combo: 0, maxCombo: 0, answered: 0, seen: Date.now() }, p));
        online.qIndex = -1;
        online.current = null;
        online.lastResolve = null;
        multi = { mode: 'online', players: online.players, rounds: msg.total || ONLINE_TOTAL, round: 0, turn: 0, finished: false };
        setScreen('game');
        el('multi-strip').hidden = false;
        onlineShowOverlay('PARTIDA ONLINE', '🎮', 'Prepare-se!', 'A primeira pergunta chega em instantes.');
        break;
      }
      case 'question': {
        online.phase = 'playing';
        online.qIndex = msg.index;
        syncOnlineRoster(msg.players);
        multi = multi || { mode: 'online', players: online.players, rounds: msg.total || ONLINE_TOTAL, round: msg.index, turn: 0, finished: false };
        multi.round = msg.index;
        online.current = { q: msg.q, seconds: msg.seconds, answers: {}, resolved: false };
        onlineBeginQuestion(msg.q, msg.seconds, msg.index);
        break;
      }
      case 'resolve':
        onlineApplyResolve(msg);
        break;
      case 'over':
        onlineShowPodium(msg.ranked || []);
        break;
      case 'again':
        onlineShowOverlay('NOVA PARTIDA', '🎮', 'Já vai começar', 'O anfitrião iniciou outra rodada.');
        break;
      case 'closed':
        online.closed = true;
        Modal.open({
          title: 'Sala encerrada',
          body: '<p>O anfitrião saiu da sala.</p>',
          actions: [{ label: 'VOLTAR', primary: true, onClick: () => { onlineLeave(true); go('online'); renderOnline(); } }],
        });
        break;
      default: break;
    }
  }

  /* ---------- partida: perguntas simultâneas ---------- */
  function buildOnlineQuestions(total) {
    const pools = { 1: [], 2: [], 3: [] };
    D.QUESTIONS.forEach((q) => { if (pools[q.d]) pools[q.d].push(q); });
    Object.keys(pools).forEach((k) => { pools[k] = shuffle(pools[k]); });
    const used = new Set();
    const out = [];
    for (let i = 0; i < total; i++) {
      const diff = i < 4 ? 1 : i < 8 ? 2 : 3;
      let q = null;
      while (!q && pools[diff].length) {
        const cand = pools[diff].pop();
        if (!used.has(cand.q)) { q = cand; used.add(cand.q); }
      }
      out.push(prepareQuestion(q || shuffle(D.QUESTIONS)[0]));
    }
    return out;
  }

  function hostStartMatch() {
    if (!online || online.role !== 'host') return;
    if (online.players.length < 2) { toast('Chame pelo menos mais 1 jogador.'); return; }
    online.players.forEach((p, i) => {
      p.color = MULTI_COLORS[i % MULTI_COLORS.length];
      p.score = 0; p.combo = 0; p.maxCombo = 0; p.correct = 0; p.answered = 0; p.lives = 3;
    });
    online.phase = 'playing';
    online.qIndex = -1;
    online.questions = buildOnlineQuestions(ONLINE_TOTAL);
    online.current = null;
    online.lastResolve = null;
    multi = { mode: 'online', players: online.players, rounds: ONLINE_TOTAL, round: 0, turn: 0, finished: false };
    sendOnline({ t: 'start', players: onlinePublicPlayers(), total: ONLINE_TOTAL });
    clearTimeout(online.autoTimer);
    clearTimeout(online.turnTimer);
    setScreen('game');
    Sfx.play('click');
    setTimeout(() => hostNextQuestion(), 700);
  }

  function hostNextQuestion() {
    if (!online || online.role !== 'host' || online.phase !== 'playing') return;
    online.qIndex += 1;
    if (online.qIndex >= ONLINE_TOTAL) { hostFinish(); return; }
    const q = online.questions[online.qIndex];
    const seconds = ONLINE_SECONDS[online.qIndex] || 12;
    online.current = { q, seconds, answers: {}, startedAt: Date.now(), resolved: false };
    multi.round = online.qIndex;
    sendOnline({
      t: 'question', index: online.qIndex, total: ONLINE_TOTAL, seconds,
      q: { q: q.q, a: q.a, w: q.w }, players: onlinePublicPlayers(),
    });
    onlineBeginQuestion(q, seconds, online.qIndex);
    clearTimeout(online.turnTimer);
    online.turnTimer = setTimeout(() => hostResolve(), seconds * 1000 + 1400);
  }

  function hostRecordAnswer(pid, choice, ms) {
    if (!online || online.role !== 'host') return;
    const cur = online.current;
    if (!cur || cur.resolved || cur.answers[pid]) return;
    cur.answers[pid] = { choice, ms };
    const pending = online.players.filter((p) => p.pid !== pid && !cur.answers[p.pid] && Date.now() - (p.seen || 0) < 16000);
    if (!pending.length) {
      clearTimeout(online.turnTimer);
      online.turnTimer = setTimeout(() => hostResolve(), 450);
    }
  }

  function hostResolve() {
    if (!online || online.role !== 'host') return;
    const cur = online.current;
    if (!cur || cur.resolved) return;
    cur.resolved = true;
    clearTimeout(online.turnTimer);
    const results = online.players.map((p) => {
      const a = cur.answers[p.pid] || { choice: -1, ms: cur.seconds * 1000 + 9999 };
      const late = a.ms > cur.seconds * 1000 + 900 || a.choice < 0;
      const left = late ? 0 : Math.max(0, cur.seconds - a.ms / 1000);
      const ok = !late && a.choice === cur.q.c;
      let points = 0;
      if (ok) {
        p.combo = (p.combo || 0) + 1;
        p.maxCombo = Math.max(p.maxCombo || 0, p.combo);
        const mult = 1 + Math.min(Math.floor((p.combo - 1) / 2), 4) * 0.5;
        points = Math.round((100 + Math.round(left) * 10) * mult);
        p.score += points;
        p.correct += 1;
      } else {
        p.combo = 0;
      }
      p.answered += 1;
      return { pid: p.pid, choice: a.choice, ok, points, late, score: p.score, combo: p.combo, correct: p.correct };
    });
    const payload = {
      t: 'resolve', index: online.qIndex, correct: cur.q.c, q: cur.q, seconds: cur.seconds,
      results, players: onlinePublicPlayers(),
    };
    online.lastResolve = payload;
    sendOnline(payload);
    onlineApplyResolve(payload);
    clearTimeout(online.autoTimer);
    online.autoTimer = setTimeout(() => { if (online && online.phase === 'playing') hostNextQuestion(); }, 5200);
  }

  function hostFinish() {
    if (!online || online.phase === 'over') return;
    online.phase = 'over';
    clearTimeout(online.turnTimer);
    clearTimeout(online.autoTimer);
    const ranked = online.players.slice().sort((a, b) => b.score - a.score || b.correct - a.correct);
    sendOnline({
      t: 'over',
      ranked: ranked.map((p) => ({ pid: p.pid, name: p.name, avatar: p.avatar, color: p.color, score: p.score, correct: p.correct, answered: p.answered })),
    });
    onlineShowPodium(ranked);
  }

  /* ---------- exibição compartilhada ---------- */
  function onlineShowOverlay(kicker, avatar, name, hint) {
    el('handoff-card').style.setProperty('--pcolor', '#9b5cff');
    el('handoff-kicker').textContent = kicker;
    el('handoff-avatar').textContent = avatar;
    el('handoff-name').textContent = name;
    el('handoff-hint').textContent = hint;
    el('btn-handoff').hidden = true;
    el('btn-handoff-cancel').hidden = true;
    el('handoff').hidden = false;
  }

  function onlineMakeRun(q, seconds, p) {
    const pl = p || { lives: 3, score: 0, combo: 0, maxCombo: 0, correct: 0 };
    return {
      mode: 'online', worldIndex: 0, faseIndex: 0, worldName: 'Online',
      faseName: `Pergunta ${(online ? online.qIndex : 0) + 1}/${ONLINE_TOTAL}`,
      questions: [q], seconds, index: 0, lives: pl.lives || 3, livesMax: 3, score: pl.score,
      combo: pl.combo, maxCombo: pl.maxCombo || 0, correct: pl.correct, answered: false,
      answeredCount: 0, selected: null, locked: false, awaitingReady: false, used: {},
      raf: 0, deadline: performance.now() + seconds * 1000, totalTime: seconds,
      lastWhole: null, hiddenAt: 0, finished: false, startedAt: Date.now(),
    };
  }

  function startOnlineLoop() {
    if (!run) return;
    cancelAnimationFrame(run.raf);
    run.raf = requestAnimationFrame(onlineTick);
  }

  function onlineTick() {
    if (!run || run.finished || run.answered) return;
    const left = Math.max(0, (run.deadline - performance.now()) / 1000);
    paintTimer(left, run.totalTime);
    if (left <= 3.05 && left > 0) {
      const whole = Math.ceil(left);
      if (run.lastWhole !== whole) { run.lastWhole = whole; Sfx.play('tick'); }
    }
    if (left <= 0) { onlineLocalTimeUp(); return; }
    run.raf = requestAnimationFrame(onlineTick);
  }

  function onlineBeginQuestion(q, seconds, index) {
    if (!online) return;
    const me = online.players.find((p) => p.pid === online.pid) || { score: 0, combo: 0, correct: 0 };
    run = onlineMakeRun(q, seconds, me);
    run.deadline = performance.now() + seconds * 1000;
    multi.round = index;
    el('handoff').hidden = true;
    el('game-world').textContent = 'Online';
    el('game-fase').textContent = `Pergunta ${index + 1}/${ONLINE_TOTAL}`;
    el('game-feedback').hidden = true;
    el('btn-next').hidden = true;
    renderQuestion();
    renderHud();
    renderMultiStrip();
    renderPowerbar();
    paintTimer(seconds, seconds);
    startOnlineLoop();
    Sfx.play('turn');
    vibrate(20);
  }

  function onlineChoose(i) {
    if (!online || !run) return;
    const left = Math.max(0, (run.deadline - performance.now()) / 1000);
    const ms = Math.round(run.totalTime * 1000 - left * 1000);
    run.answered = true;
    run.selected = i;
    run.locked = true;
    cancelAnimationFrame(run.raf);
    paintTimer(left, run.totalTime);
    const buttons = [...el('game-answers').children];
    buttons.forEach((b) => { b.disabled = true; });
    if (buttons[i]) buttons[i].classList.add('picked');
    Sfx.play('click');
    toast('Resposta enviada!');
    if (online.role === 'host') hostRecordAnswer(online.pid, i, ms);
    else sendOnline({ t: 'answer', pid: online.pid, choice: i, ms });
  }

  function onlineLocalTimeUp() {
    if (!online || !run) return;
    run.answered = true;
    cancelAnimationFrame(run.raf);
    paintTimer(0, run.totalTime);
    [...el('game-answers').children].forEach((b) => { b.disabled = true; });
    if (online.role === 'host') hostRecordAnswer(online.pid, -1, run.totalTime * 1000 + 9999);
    else sendOnline({ t: 'answer', pid: online.pid, choice: -1, ms: run.totalTime * 1000 + 9999 });
  }

  function onlineNextPressed() {
    el('btn-next').hidden = true;
  }

  function onlineApplyResolve(res) {
    if (!online || !res || !res.q) return;
    syncOnlineRoster(res.players);
    const my = (res.results || []).find((r) => r.pid === online.pid);
    online.qIndex = typeof res.index === 'number' ? res.index : online.qIndex;
    if (!multi) multi = { mode: 'online', players: online.players, rounds: ONLINE_TOTAL, round: online.qIndex, turn: 0, finished: false };
    multi.round = online.qIndex;
    const p = online.players.find((x) => x.pid === online.pid);

    run = onlineMakeRun(res.q, res.seconds || 12, p);
    run.answered = true;
    run.answeredCount = 1;
    run.selected = my && my.choice >= 0 ? my.choice : null;
    el('handoff').hidden = true;
    el('game-world').textContent = 'Online';
    el('game-fase').textContent = `Pergunta ${online.qIndex + 1}/${ONLINE_TOTAL}`;
    renderQuestion();
    const buttons = [...el('game-answers').children];
    buttons.forEach((b) => { b.disabled = true; });
    if (buttons[res.correct]) buttons[res.correct].classList.add('correct');
    if (my && my.choice >= 0 && !my.ok && buttons[my.choice]) {
      buttons[my.choice].classList.add('picked', 'wrong');
      const mk = buttons[my.choice].querySelector('.mark');
      if (mk) mk.textContent = '✕';
    }
    if (my && my.ok && buttons[res.correct]) {
      const mk = buttons[res.correct].querySelector('.mark');
      if (mk) mk.textContent = '✓';
    }
    renderHud();
    renderMultiStrip();
    el('game-powerbar').hidden = true;
    el('btn-next').hidden = true;
    showFeedback(!!(my && my.ok), my ? my.points : 0, res.q, !my || my.late);
  }
  function onlineShowPodium(ranked) {
    if (!online) return;
    online.phase = 'over';
    cancelAnimationFrame(run && run.raf);
    run = null;
    if (multi) multi.finished = true;
    el('handoff').hidden = true;
    el('multi-strip').hidden = true;
    const list = ranked.length ? ranked : online.players.slice().sort((a, b) => b.score - a.score);
    const top = list[0];
    const tie = list.filter((p) => p.score === top.score).length > 1;
    el('multi-crown').textContent = tie ? '🤝' : '🏆';
    el('multi-winner').textContent = tie ? 'Empate no topo!' : `${top.name} venceu!`;
    el('multi-podium').innerHTML = list.map((p, i) => {
      const medal = ['🥇', '🥈', '🥉'][i] || `${i + 1}º`;
      return `<div class="podium-row ${i === 0 ? 'first' : ''}" style="--pcolor:${p.color || '#9b5cff'}">
        <span class="podium-pos">${medal}</span>
        <span class="podium-avatar" aria-hidden="true">${p.avatar || '🙂'}</span>
        <span class="podium-info">
          <b>${esc(p.name || 'Jogador')}</b>
          <small>${p.correct || 0} de ${ONLINE_TOTAL} acertos</small>
        </span>
        <span class="podium-score">${nf.format(p.score || 0)}<small>pts</small></span>
      </div>`;
    }).join('');
    el('btn-multi-again').hidden = false;
    el('btn-multi-new').hidden = false;
    el('btn-multi-new').textContent = online.role === 'host' ? 'VOLTAR À SALA' : 'SAIR DA SALA';
    setScreen('multi-result');
    Music.stop(0.2);
    Sfx.play('level');
    Fx.rain(tie ? 50 : 80);
    vibrate([30, 40, 60]);
  }

  function onlineAgain() {
    if (!online) return;
    if (online.role === 'host') { hostStartMatch(); return; }
    sendOnline({ t: 'again', pid: online.pid });
    toast('Pedido enviado ao anfitrião.');
  }

  function onlineNewMatch() {
    if (!online) { openOnline(); return; }
    if (online.role === 'host') {
      online.phase = 'lobby';
      cancelAnimationFrame(run && run.raf);
      run = null;
      multi = null;
      el('handoff').hidden = true;
      broadcastLobby();
      go('online');
      renderOnline();
    } else {
      onlineLeave();
    }
  }

  function onlineLeave(quiet) {
    if (!online) return;
    const wasHost = online.role === 'host';
    try {
      if (online.client) {
        if (wasHost) sendOnline({ t: 'closed' });
        sendOnline({ t: 'bye', pid: online.pid });
      }
    } catch (_) {}
    clearTimeout(online.turnTimer);
    clearTimeout(online.autoTimer);
    clearTimeout(online.joinTimer);
    clearInterval(online.hbTimer);
    clearInterval(online.watchTimer);
    try { online.client && online.client.end(true); } catch (_) {}
    cancelAnimationFrame(run && run.raf);
    online = null;
    run = null;
    multi = null;
    el('handoff').hidden = true;
    el('multi-strip').hidden = true;
    el('btn-handoff').hidden = false;
    el('btn-handoff-cancel').hidden = false;
    Music.stop(0.12);
    if (!quiet) {
      Sfx.play('click');
      go('online');
      renderOnline();
    }
  }

  /* =========================================================
     PERFIL / AJUSTES
     ========================================================= */
  function renderSettings() {
    const s = S();
    el('input-name').value = s.name || '';
    renderAvatarPicker();

    const t = (id, value) => el(id).classList.toggle('on', !!value);
    t('toggle-sound', s.settings.sound);
    t('toggle-music', s.settings.music !== false);
    t('toggle-motion', s.settings.reducedMotion);
    t('toggle-vibe', s.settings.vibrate);
  }

  function renderAvatarPicker() {
    const s = S();
    const grid = el('avatar-grid');
    grid.innerHTML = '';
    D.AVATARS.forEach((a) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'avatar-option' + (a === s.avatar ? ' selected' : '');
      b.textContent = a;
      b.setAttribute('aria-label', `Avatar ${a}`);
      b.setAttribute('aria-pressed', String(a === s.avatar));
      b.addEventListener('click', () => {
        S().avatar = a;
        Store.save();
        Sfx.play('click');
        renderAvatarPicker();
        renderHome();
      });
      grid.appendChild(b);
    });
  }

  function saveName() {
    const input = el('input-name');
    const name = input.value.trim().replace(/\s+/g, ' ');
    if (name.length < 1) { toast('Digite um apelido.'); input.focus(); return; }
    if (name.length > 18) { toast('Use no máximo 18 caracteres.'); return; }
    S().name = name;
    Store.save();
    Sfx.play('correct');
    toast('Apelido salvo!');
    renderHome();
  }

  function ensureProfile() {
    if (S().name) return true;
    openOnboarding();
    return false;
  }

  function openOnboarding() {
    onboardAvatar = S().avatar || D.AVATARS[0];
    const body = `
      <p>Antes de começar, escolha um apelido e um avatar. Você pode mudar depois em <b>Perfil</b>.</p>
      <label class="field-label" for="onboard-name">APELIDO</label>
      <input class="text-input" id="onboard-name" maxlength="18" autocomplete="nickname" placeholder="Até 18 caracteres" value="${esc(S().name || '')}">
      <div class="avatar-grid" id="onboard-avatars"></div>
      <p class="hint">Regras rápidas: 3 vidas, 5 perguntas por fase e combo que multiplica os pontos. Errar ou deixar o tempo acabar custa uma vida.</p>`;
    Modal.open({
      title: 'Bem-vindo à Mente Confusa',
      body,
      actions: [{
        label: 'COMEÇAR',
        primary: true,
        onClick: () => {
          const input = el('onboard-name');
          const name = (input ? input.value : '').trim().replace(/\s+/g, ' ');
          if (name.length < 1) { toast('Escolha um apelido para continuar.'); if (input) input.focus(); return true; }
          S().name = name.slice(0, 18);
          S().avatar = onboardAvatar || S().avatar;
          Store.save();
          Sfx.play('correct');
          renderHome();
          renderSettings();
          return false;
        },
      }],
    });
    const grid = el('onboard-avatars');
    if (grid) {
      D.AVATARS.forEach((a) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'avatar-option' + (a === onboardAvatar ? ' selected' : '');
        b.textContent = a;
        b.addEventListener('click', () => {
          onboardAvatar = a;
          Array.from(grid.children).forEach((c) => c.classList.toggle('selected', c === b));
        });
        grid.appendChild(b);
      });
    }
    const input = el('onboard-name');
    if (input) input.focus({ preventScroll: true });
  }

  function confirmReset() {
    Modal.open({
      title: 'Zerar progresso?',
      body: '<p>Isso apaga <b>apelido, fases, estrelas, moedas e ranking</b> deste aparelho. Não tem como desfazer.</p>',
      actions: [
        { label: 'CANCELAR', onClick: () => {} },
        {
          label: 'APAGAR TUDO',
          primary: true,
          onClick: () => {
            Store.reset();
            navStack = [];
            renderSettings();
            go('home');
            toast('Progresso apagado. Bora recomeçar!');
          },
        },
      ],
    });
  }

  function confirmQuit() {
    if (!run || run.finished) { go('home'); return; }
    if (run.mode === 'multi') {
      Modal.open({
        title: 'Encerrar a partida?',
        body: '<p>O placar dos jogadores será perdido.</p>',
        actions: [
          { label: 'CONTINUAR JOGANDO', primary: true, onClick: () => {} },
          {
            label: 'ENCERRAR',
            onClick: () => {
              cancelAnimationFrame(run.raf);
              Music.stop(0.12);
              el('handoff').hidden = true;
              el('multi-strip').hidden = true;
              run = null;
              multi = null;
              navStack = [];
              go('home');
            },
          },
        ],
      });
      return;
    }
    Modal.open({
      title: 'Sair da partida?',
      body: '<p>O progresso desta fase será perdido.</p>',
      actions: [
        { label: 'CANCELAR', primary: true, onClick: () => {} },
        {
          label: 'SAIR',
          onClick: () => {
            cancelAnimationFrame(run.raf);
            Music.stop(0.12);
            run = null;
            navStack = [];
            go('home');
          },
        },
      ],
    });
  }

  function openHowTo() {
    Modal.open({
      title: 'Como jogar',
      body: `
        <ul class="rules">
          <li><b>Trilha:</b> 6 mundos, 3 fases cada. Conclua uma fase para liberar a próxima.</li>
          <li><b>Vidas:</b> você começa com 3 corações. Errar ou deixar o tempo acabar custa um.</li>
          <li><b>Pontos:</b> acerto vale 100 + 10 por segundo restante. Acertos seguidos aumentam o combo até ×3.</li>
          <li><b>Estrelas:</b> 3 estrelas se terminar com as 3 vidas, 2 com duas, 1 com uma.</li>
          <li><b>Ajudas:</b> eliminar duas alternativas, ganhar 10 segundos ou pular a pergunta. Compre com moedas na loja.</li>
          <li><b>Desafio diário:</b> 10 perguntas novas por dia, com recompensa extra.</li>
        </ul>`,
      actions: [{ label: 'ENTENDI', primary: true }],
    });
  }

  /* =========================================================
     Eventos
     ========================================================= */
  function bind() {
    el('btn-play').addEventListener('click', () => {
      Sfx.unlock();
      if (!ensureProfile()) return;
      const next = nextLevel();
      startLevel(next.worldIndex, next.faseIndex);
    });

    el('btn-sound').addEventListener('click', () => {
      S().settings.sound = !S().settings.sound;
      Store.save();
      if (!S().settings.sound) Music.stop(0.1);
      el('btn-sound').textContent = S().settings.sound ? '🔊' : '🔇';
      if (S().settings.sound) Sfx.play('click');
      toast(S().settings.sound ? 'Som ativado' : 'Som desativado');
    });

    el('btn-profile').addEventListener('click', () => { Sfx.play('click'); go('settings'); });
    el('btn-howto').addEventListener('click', () => { Sfx.play('click'); openHowTo(); });

    el('btn-multi').addEventListener('click', () => { Sfx.play('click'); openFriendsMenu(); });
    el('btn-add-player').addEventListener('click', () => addMultiPlayer());
    el('btn-start-multi').addEventListener('click', () => startMultiMatch());
    el('btn-handoff').addEventListener('click', () => confirmHandoff());
    el('btn-handoff-cancel').addEventListener('click', () => {
      Sfx.play('click');
      if (run) cancelAnimationFrame(run.raf);
      el('handoff').hidden = true;
      Music.stop(0.12);
      run = null;
      multi = null;
      navStack = [];
      go('home');
    });
    el('btn-multi-again').addEventListener('click', () => {
      Sfx.play('click');
      if (online && online.phase === 'over') onlineAgain();
      else rematchMulti();
    });
    el('btn-multi-new').addEventListener('click', () => {
      Sfx.play('click');
      if (online && online.phase === 'over') onlineNewMatch();
      else openMultiSetup();
    });

    el('online-avatar').addEventListener('click', () => {
      const body = `<div class="avatar-grid" id="pick-grid">${D.AVATARS.map((a) =>
        `<button type="button" class="avatar-option ${a === onlineAvatar ? 'selected' : ''}" data-avatar="${a}" aria-label="Avatar ${a}">${a}</button>`).join('')}</div>`;
      Modal.open({ title: 'Escolha um avatar', body, actions: [{ label: 'FECHAR', primary: true }] });
      const grid = el('pick-grid');
      if (!grid) return;
      grid.addEventListener('click', (e) => {
        const b = e.target.closest('[data-avatar]');
        if (!b) return;
        onlineAvatar = b.dataset.avatar;
        el('online-avatar').textContent = onlineAvatar;
        Sfx.play('click');
        Modal.close();
      });
    });
    el('online-name').addEventListener('input', (e) => {
      onlineName = e.target.value.slice(0, 14);
    });
    el('btn-create-room').addEventListener('click', () => {
      Sfx.play('click');
      if (!(onlineName || '').trim()) { toast('Digite seu nome primeiro.'); el('online-name').focus(); return; }
      enterOnlineRoom(randomCode(5), 'host');
    });
    el('btn-join-room').addEventListener('click', () => joinOnlineRoom());
    el('input-room-code').addEventListener('input', (e) => {
      e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
    });
    el('input-room-code').addEventListener('keydown', (e) => { if (e.key === 'Enter') joinOnlineRoom(); });
    el('btn-copy-code').addEventListener('click', () => {
      if (!online) return;
      const text = online.code;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => toast(`Código ${text} copiado!`)).catch(() => toast(`Código: ${text}`));
      } else {
        toast(`Código: ${text}`);
      }
      Sfx.play('click');
    });
    el('btn-online-start').addEventListener('click', () => { Sfx.play('click'); hostStartMatch(); });
    el('btn-online-leave').addEventListener('click', () => { Sfx.play('click'); onlineLeave(); });

    document.addEventListener('click', (e) => {
      const goBtn = e.target.closest('[data-go]');
      if (goBtn) {
        const dest = goBtn.dataset.go;
        Sfx.play('click');
        if (currentScreen === 'result' || currentScreen === 'game') navStack = [];
        if (dest === 'daily') startDaily();
        else {
          if (dest === 'home' && online) onlineLeave(true);
          go(dest);
        }
        return;
      }
      const backBtn = e.target.closest('[data-back]');
      if (backBtn) { Sfx.play('click'); back(); }
    });

    el('btn-quit').addEventListener('click', () => { Sfx.play('click'); confirmQuit(); });
    el('btn-next').addEventListener('click', () => { Sfx.play('click'); nextQuestion(); });
    el('btn-save-name').addEventListener('click', saveName);
    el('input-name').addEventListener('keydown', (e) => { if (e.key === 'Enter') saveName(); });

    el('toggle-sound').addEventListener('click', () => {
      S().settings.sound = !S().settings.sound;
      Store.save();
      if (!S().settings.sound) Music.stop(0.1);
      renderSettings();
      renderHome();
      if (S().settings.sound) Sfx.play('click');
    });
    el('toggle-music').addEventListener('click', () => {
      S().settings.music = !S().settings.music;
      Store.save();
      if (!S().settings.music) Music.stop(0.15);
      renderSettings();
      Sfx.play('click');
      toast(S().settings.music ? 'Música ativada nas perguntas' : 'Música desativada');
    });
    el('toggle-motion').addEventListener('click', () => {
      S().settings.reducedMotion = !S().settings.reducedMotion;
      Store.save();
      document.body.classList.toggle('reduce-motion', S().settings.reducedMotion);
      renderSettings();
    });
    el('toggle-vibe').addEventListener('click', () => {
      S().settings.vibrate = !S().settings.vibrate;
      Store.save();
      renderSettings();
      vibrate(20);
    });

    el('btn-reset').addEventListener('click', () => { Sfx.play('click'); confirmReset(); });

    document.addEventListener('keydown', (e) => {
      if (currentScreen !== 'game' || !run || run.finished) return;
      if (run.awaitingReady) return;
      if (e.target && e.target.closest && e.target.closest('button') && (e.key === ' ' || e.key === 'Enter')) return;
      if (run.answered && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); nextQuestion(); return; }
      if (run.answered) return;
      const map = { '1': 0, '2': 1, '3': 2, '4': 3, a: 0, b: 1, c: 2, d: 3 };
      const key = e.key.toLowerCase();
      if (key in map) choose(map[key]);
    });

    document.addEventListener('visibilitychange', () => {
      if (!run || run.finished) return;
      if (document.hidden) {
        run.hiddenAt = performance.now();
        Music.stop(0.1);
      } else if (run.hiddenAt) {
        run.deadline += performance.now() - run.hiddenAt;
        run.hiddenAt = 0;
        if (currentScreen === 'game') Music.start();
      }
    });
  }

  /* =========================================================
     Inicialização
     ========================================================= */
  function init() {
    Store.load();
    Sfx.unlock();
    Fx.init();

    const s = S();
    if (!s.powerups || typeof s.powerups !== 'object') s.powerups = { fifty: 1, time: 1, skip: 1 };
    Object.keys(D.POWERUPS).forEach((k) => { if (typeof s.powerups[k] !== 'number') s.powerups[k] = 0; });
    if (!s.settings) s.settings = { sound: true, reducedMotion: false, vibrate: true, music: true };
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      s.settings.reducedMotion = true;
    }
    Store.save();
    document.body.classList.toggle('reduce-motion', !!s.settings.reducedMotion);

    bind();
    navStack = [];
    setScreen('home');
    renderHome();

    if (!s.name) setTimeout(openOnboarding, 450);

    // PWA (só funciona quando servido por http/https)
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => {});
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

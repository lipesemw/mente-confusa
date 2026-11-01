/* Mente Confusa — abertura em vídeo (toca ao abrir o app). */
(function () {
  'use strict';

  var root = document.getElementById('intro');
  var video = document.getElementById('intro-video');
  if (!root || !video) return;

  var skip = document.getElementById('intro-skip');
  var sound = document.getElementById('intro-sound');
  var tap = document.getElementById('intro-tap');
  var closed = false;
  var guard;

  /* O app espera a abertura terminar antes de pedir o apelido do jogador. */
  window.MC_INTRO_ACTIVE = true;

  function close() {
    if (closed) return;
    closed = true;
    clearTimeout(guard);
    root.classList.add('is-out');
    try { video.pause(); } catch (e) {}
    setTimeout(function () {
      root.hidden = true;
      video.removeAttribute('src');
      try { video.load(); } catch (e) {}
      window.MC_INTRO_ACTIVE = false;
      document.dispatchEvent(new CustomEvent('mc:introend'));
    }, 420);
  }

  function syncSound() {
    var on = !video.muted;
    if (sound) {
      sound.setAttribute('aria-pressed', on ? 'true' : 'false');
      sound.textContent = on ? 'SOM ON' : 'SOM';
    }
  }

  function play() {
    var p = video.play();
    if (p && p.catch) {
      p.catch(function () {
        if (!closed && tap) tap.hidden = false;
      });
    }
  }

  /* Se o vídeo falhar (arquivo ausente, codec, bloqueio), o app abre normalmente. */
  video.addEventListener('error', close);
  video.addEventListener('ended', function () { setTimeout(close, 260); });
  video.addEventListener('playing', function () {
    if (tap) tap.hidden = true;
  });

  /* Rede de segurança: nunca prender o app na abertura. */
  guard = setTimeout(close, 20000);

  if (skip) skip.addEventListener('click', close);

  if (tap) {
    tap.addEventListener('click', function () {
      tap.hidden = true;
      video.muted = false;
      syncSound();
      play();
    });
  }

  if (sound) {
    sound.addEventListener('click', function () {
      video.muted = !video.muted;
      syncSound();
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') close();
  });

  video.muted = true;
  syncSound();
  play();
})();

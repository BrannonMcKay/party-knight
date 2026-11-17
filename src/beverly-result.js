import {createWrathStage} from './wrath-stage.js';
import {createYouTubeClock} from './youtube-clock.js';
import {createCastWaveStage} from './cast-wave-stage.js';
import {createTheatreStage} from './theatre-stage.js';
import {THEATRE_ATTACKS, THEATRE_CREDITS, THEATRE_SIGN, THEATRE_STICKER, THEATRE_NOW_PLAYING} from './theatre-beats.js';

const victoryPortrait = new URL('../assets/victory-christel-pool.webp', import.meta.url).href;

const busPortrait = new URL('../assets/party-bus-victory.webp', import.meta.url).href;

export const RESULT_LINKS = {
  tickets: 'https://www.billyknightmovie.com/',
  trailer: {title: 'Billy Knight teaser trailer', id: 'eBc9lMilNRM', cast: true},
  stickman: {
    // Part I is a double feature: the film and its reenactment, over the audience.
    1: {title: 'Wrath of Stickman Part I', id: '90P0FJjmYjM', reenacted: true, theatre: 1},
    2: {title: 'Wrath of Stickman Part II', id: 'u9wnmH14ijU', theatre: 2},
    3: {title: 'Wrath of Stickman Part III', id: 'apFiHUVCc-0', theatre: 3}
  }
};

const watchUrl = id => 'https://www.youtube.com/watch?v=' + id;
// The privacy-enhanced player sets no cookies until the video is played.
// enablejsapi lets the reenactment follow the player's clock.
const embedUrl = id => 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&controls=0&iv_load_policy=3&rel=0&playsinline=1&enablejsapi=1&origin=' + encodeURIComponent(location.origin);

// The sign over the basement screen, lettered by an unsteady hand: every
// letter gets its own tilt, drop and size.
const crudeSign = text => {
  let i = 0;
  // Words stay whole when the sign wraps onto a second line.
  return text.split(' ').map(word => '<span class="word">' + [...word].map(letter => {
    const at = i++, wobble = n => Math.sin(at * 12.9898 + n * 78.233) * 43758.5453 % 1;
    return `<span style="transform:translateY(${(wobble(1) * 5).toFixed(1)}px) rotate(${(wobble(2) * 11).toFixed(1)}deg) scale(${(1 + wobble(3) * .14).toFixed(2)})">${letter}</span>`;
  }).join('') + '</span>').join(' ');
};

// `media.pause()` / `media.resume()` silence the game's own soundtrack while a
// video is on screen; `media.cheer()` plays one stickman vocalization.
export function createBeverlyResult({retry, leave, standalone = false, media = null}) {
  const dialog = document.createElement('dialog');
  dialog.id = 'estate-result';
  dialog.className = 'estate-result';
  dialog.setAttribute('aria-labelledby', 'estate-result-title');
  document.body.append(dialog);
  let screening = null, reenactment = null, menuDone = null;
  function closeScreening() {
    if (!screening) return false;
    reenactment?.clock?.dispose();
    reenactment?.stage.dispose();
    reenactment?.audience?.dispose();
    reenactment = null;
    // Removing the frame is what stops the video's sound.
    screening.remove();
    screening = null;
    dialog.classList.remove('screening', 'reenacting', 'theatre');
    media?.resume();
    dialog.querySelector('#again')?.focus();
    return true;
  }
  function screen(video, {christel = false} = {}) {
    if (!video || screening) return;
    media?.pause();
    screening = document.createElement('section');
    screening.className = 'result-screening';
    screening.setAttribute('aria-label', video.title);
    const frame = `<div class="result-video"><iframe src="${embedUrl(video.id)}" title="${video.title}" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`;
    // A double feature shows the film and its reenactment side by side above the seats.
    const double = !!(video.theatre && video.reenacted);
    const theatre = video.theatre ? `<div class="theatre-room${double ? ' double' : ''}">
        <div class="theatre-heading">
          <p class="theatre-sign" aria-label="${THEATRE_SIGN}">${crudeSign(THEATRE_SIGN)}</p>
          ${double ? `<span class="theatre-sticker">${THEATRE_STICKER}</span>` : ''}
        </div>
        ${double ? `<div class="theatre-features">${frame}<div class="result-stage"></div></div>` : frame}
        <div class="result-stage theatre-audience"></div>
      </div>` : '';
    screening.innerHTML = theatre + `
      <div class="result-pair"${theatre ? ' hidden' : ''}>${theatre ? '' : frame + (video.reenacted || video.cast ? '<div class="result-stage"></div>' : '')}</div>
      <div class="modal-buttons">
        <button type="button" id="screening-close" class="primary">${menuDone ? 'Back to the film menu' : 'Back to the results'}</button>
        <a class="secondary" href="${watchUrl(video.id)}" target="_blank" rel="noopener">Open on YouTube</a>
      </div>`;
    dialog.prepend(screening);
    // The films carry their own on-screen text; switch off YouTube's automatic
    // "[Music]" captions. The player ignores commands until it has started, so ask a few times.
    {
      const frame = screening.querySelector('iframe');
      let tries = 0;
      const quiet = setInterval(() => {
        if (!frame.isConnected || ++tries > 16) return clearInterval(quiet);
        try { frame.contentWindow?.postMessage(JSON.stringify({event: 'command', func: 'unloadModule', args: ['captions']}), '*'); } catch {}
      }, 500);
    }
    dialog.classList.add('screening');
    dialog.classList.toggle('reenacting', !!(video.reenacted || video.cast));
    dialog.classList.toggle('theatre', !!video.theatre);
    // One clock, read from the player, drives the audience and the reenactment.
    let clock = null;
    const videoClock = () => clock ??= createYouTubeClock(screening.querySelector('iframe'));
    let audience = null;
    if (video.theatre) {
      // Stickmen, Al Pacino and Alex watch from the seats and cheer every attack.
      try {
        audience = createTheatreStage(screening.querySelector('.theatre-audience'), {attacks: THEATRE_ATTACKS[video.theatre], tiny: double, christel, credits: THEATRE_CREDITS[video.theatre], onCheer: () => media?.cheer?.()});
        audience.follow(videoClock());
        if (!double) reenactment = {clock, stage: audience};
      } catch (error) {
        console.warn('Theatre audience unavailable', error);
        audience = null;
        screening.querySelector('.theatre-audience').remove();
      }
    }
    if (video.cast) {
      // Alex, Al Pacino and Emily wave from a red carpet beside the trailer.
      try {
        const stage = createCastWaveStage(screening.querySelector('.result-stage'));
        stage.start();
        reenactment = {clock: null, stage};
      } catch (error) {
        console.warn('Cast stage unavailable', error);
        screening.querySelector('.result-stage').remove();
        dialog.classList.remove('reenacting');
      }
    }
    if (video.reenacted) {
      // Christel and a stickman act the film out beside it, on the video's clock.
      try {
        const stage = createWrathStage(screening.querySelector('.result-stage:not(.theatre-audience)'));
        stage.follow(videoClock());
        reenactment = {clock, stage, audience};
      } catch (error) {
        console.warn('Reenactment unavailable', error);
        screening.querySelector('.result-stage:not(.theatre-audience)').remove();
        dialog.classList.remove('reenacting');
        if (audience) reenactment = {clock, stage: audience};
      }
    }
    dialog.scrollTop = 0;
    screening.querySelector('#screening-close').addEventListener('click', closeScreening);
    screening.querySelector('#screening-close').focus();
  }
  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    // Escape leaves the video first, then the results (or the theatre menu).
    if (closeScreening()) return;
    if (menuDone) finishMenu(); else leave();
  });
  function finishMenu() {
    closeScreening();
    dialog.close();
    const done = menuDone;
    menuDone = null;
    done?.();
  }

  return {
    show(result, elapsed) {
      if (dialog.open) return;
      closeScreening();
      const bus = result === 'bus-escaped';
      const escaped = bus || result === 'escaped';
      dialog.innerHTML = `
        ${bus ? `<figure class="victory-portrait"><img src="${busPortrait}" alt="Christel, the band, Al, Emily the flying squirrel and Alex the loon celebrating inside the party bus"></figure>` : escaped ? `<figure class="victory-portrait"><img src="${victoryPortrait}" alt="Christel smiling cheek-to-cheek with Stubby beside the estate pool, the lit mansion behind them and angry stickmen from the actors' union picketing on the deck"><figcaption>A PURR-FECT ESCAPE</figcaption></figure>` : ''}
        ${escaped ? '<span class="modal-eyebrow">EXIT FOUND · BEAUTIFULLY DONE</span>' : ''}
        <h2 class="modal-title" id="estate-result-title">${bus ? 'Wow! That might\'ve been better than the actual movie!' : escaped ? 'You completed the party scene!' : 'Still stuck inside a dream...'}</h2>
        <p class="modal-lede">${bus ? "... but you won't know for sure unless you buy tickets and go see it yourself!" : escaped
          ? '... something the production team could not do!'
          : "<strong>Try again!</strong> Only you can defeat the actors’ union and avoid having your lifeless body desecrated by stick figures while your soul is sucked into hell with Alex, where you will watch Billy Knight on repeat for eternity."}</p>
        ${escaped && !bus ? `<p>Play again and find the second exit with an alternate ending!</p>
          <p class="result-note">${Math.round(elapsed)} seconds at the estate</p>` : ''}
        <div class="modal-buttons">
          <button id="again" class="primary" autofocus>Back to the Party!</button>
          <button id="result-home" class="secondary">${standalone ? 'Back to title' : 'Back to estate'}</button>
        </div>
        ${escaped ? `<div class="result-extras">
          <a href="${RESULT_LINKS.tickets}" target="_blank" rel="noopener">Buy Billy Knight tickets!</a>
          <button type="button" data-trailer>Watch the trailer!</button>
          ${bus ? '' : `<button type="button" data-stickman="1">Watch ${RESULT_LINKS.stickman[1].title}</button>`}
        </div>${bus ? `
        <p class="theatre-sign theatre-now" aria-label="${THEATRE_NOW_PLAYING}">${crudeSign(THEATRE_NOW_PLAYING)}</p>
        <div class="result-extras theatre-bill">
          ${[2, 3].map(part => `<button type="button" data-stickman="${part}">${RESULT_LINKS.stickman[part].title}</button>`).join('')}
        </div>` : ''}` : ''}`;
      for (const button of dialog.querySelectorAll('[data-stickman]')) button.addEventListener('click', () => screen(RESULT_LINKS.stickman[+button.dataset.stickman]));
      dialog.querySelector('[data-trailer]')?.addEventListener('click', () => screen(RESULT_LINKS.trailer));
      dialog.querySelector('#again').addEventListener('click', retry);
      dialog.querySelector('#result-home').addEventListener('click', leave);
      dialog.showModal();
    },
    // The churro tent's invitation during play: choose a film to watch with the
    // basement audience, or decline and carry on. `done` runs when Christel leaves.
    theatreMenu({done} = {}) {
      if (dialog.open) return;
      closeScreening();
      menuDone = done ?? (() => {});
      dialog.innerHTML = `
        <span class="modal-eyebrow">AL PACINO'S SECRET BASEMENT THEATER</span>
        <h2 class="modal-title" id="estate-result-title">What are we watching?</h2>
        <p class="modal-lede">Bring your churro. The seats are taken, so you'll have to stand at the back.</p>
        <div class="result-extras theatre-menu">
          ${[1, 2, 3].map(part => `<button type="button" data-stickman="${part}">Watch ${RESULT_LINKS.stickman[part].title}${part === 1 ? ' (double feature)' : ''}</button>`).join('')}
          <button type="button" id="theatre-decline">No thanks! I need to go find Emily!</button>
        </div>`;
      for (const button of dialog.querySelectorAll('[data-stickman]')) button.addEventListener('click', () => screen(RESULT_LINKS.stickman[+button.dataset.stickman], {christel: true}));
      dialog.querySelector('#theatre-decline').addEventListener('click', finishMenu);
      dialog.showModal();
      dialog.querySelector('[data-stickman]').focus();
    },
    reset() { closeScreening(); menuDone = null; dialog.close(); },
    get open() { return dialog.open; },
    get reenactment() { return reenactment; }
  };
}

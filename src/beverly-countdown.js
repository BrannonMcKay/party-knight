import {ESCAPE_RULES} from './beverly-escape.js';

export function createMazeCountdown(parent) {
  const overlay = document.createElement('div');
  overlay.className = 'maze-countdown';
  overlay.hidden = true;
  overlay.setAttribute('role', 'timer');
  overlay.innerHTML = '<span>ESCAPE THRU THE MAZE!</span><strong></strong>';
  const number = overlay.querySelector('strong');
  parent.append(overlay);
  let previous = null;

  return function showDigit(digit) {
    if (digit === previous) return;
    previous = digit;
    overlay.hidden = digit === null;
    if (digit === null) return;
    const progress = 1 - digit / ESCAPE_RULES.headStartSeconds;
    number.textContent = String(digit);
    number.style.transform = `scale(${1 + .75 * progress})`;
    number.style.color = `rgb(255, ${Math.round(230 - 191 * progress)}, ${Math.round(186 - 139 * progress)})`;
  };
}

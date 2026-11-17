// One eight-bar Moog Sub 37 phrase from the Logic event list. Positions are
// one-based [bar within phrase, beat, 32nd-note division] in 4/4 at 110 BPM.
const beatSeconds = 60 / 110;
const phrase = [
  [1,1,1], [2,1,1], [3,1,1],
  [4,2,5], [4,3,1], [4,3,5], [4,4,1], [4,4,5],
  [5,1,1], [6,1,1], [7,1,1], [8,4,1],
];
const returnSeconds = 3;

function passage(driveway, bars) {
  const hits = bars.flatMap(start => phrase.map(([bar, beat, division]) =>
    ((start + bar - 2) * 4 + beat - 1 + (division - 1) / 8) * beatSeconds));
  const lastFade = hits.at(-1) + beatSeconds;
  return {driveway, start: driveway ? 0 : hits[0], hits, lastFade};
}

const passages = [
  passage(true, [5]),
  passage(false, [29, 37]),
  passage(false, [61, 69, 77]),
];

export function partyLampCueAt(time) {
  const section = passages.find(p => time >= p.start && time < p.lastFade + returnSeconds);
  if (!section) return null;
  const index = section.hits.findLastIndex(t => t <= time);
  let pulse = 0;
  if (index >= 0) {
    const hit = section.hits[index], next = section.hits[index + 1];
    const gap = next === undefined ? beatSeconds : next - hit;
    // Leave a brief pink trough before the next note and cap every lamp fade at two seconds.
    const fade = next === undefined ? beatSeconds : Math.min(2, gap - Math.min(.04, gap * .05));
    const release = 1 - Math.min(1, Math.max(0, time - hit - .04) / (fade - .04));
    pulse = release * release * (3 - 2 * release);
  }
  // Ease the ordinary light back in after the final pulse has faded to pink.
  const t = Math.max(0, (time - section.lastFade) / returnSeconds);
  const cueMix = 1 - t * t * (3 - 2 * t);
  const flicker = .5 + .31 * Math.sin(time * 12.7) + .19 * Math.sin(time * 22.3 + .7);
  return {driveway: section.driveway, pulse, flicker, cueMix};
}

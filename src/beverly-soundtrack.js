import {GameAudio} from './audio.js';
import {partyLampCueAt} from './beverly-lamp-cues.js';
import {renderRecordScratch,RECORD_SCRATCH} from './record-scratch.js';

export const PARTY_KNIGHT_TRACK=Object.freeze({
 file:new URL('../assets/party-knight-2026.mp3',import.meta.url).href,
 name:'Party Knight',credit:'Mimesis · Party Knight',version:'2026 mix',
 source:'Party Knight 2026_2d2.mp3'
});

const knightFalls = {
  file: new URL('../assets/knight-falls-instrumental.mp3', import.meta.url).href,
  name: 'Knight Falls', credit: 'Mimesis · Knight Falls (Instrumental)'
};
const dreamLight = {
  file: new URL('../assets/dream-light-2025.mp3', import.meta.url).href,
  name: 'Dream Light', credit: 'Mimesis · Dream Light'
};
const celloInterlude = {
  file: new URL('../assets/party-knight-cello-interlude.mp3', import.meta.url).href,
  name: 'Cello Interlude', credit: 'Mimesis · Cello Interlude'
};
// What follows each recording when it runs out. Nothing follows the interlude.
const NEXT_TRACK = new Map([[PARTY_KNIGHT_TRACK, knightFalls], [knightFalls, dreamLight], [dreamLight, celloInterlude]]);

export class PartyKnightAudio extends GameAudio {
  constructor(options) {
    super(options);
    this.defaultMusic = this.track = PARTY_KNIGHT_TRACK;
    this.musicLabel = this.track.credit;
    this.trackLoads = new Map();
    this.trackBuffers = new Map();
    this.paletteAtSwitch = 0;
  }

  prepareTrack(track) {
    if (!this.trackLoads.has(track)) {
      const pending = this.readMusicBuffer(track).then(buffer => {
        this.trackBuffers.set(track, buffer);
        return buffer;
      }).catch(error => {
        this.trackLoads.delete(track);
        throw error;
      });
      this.trackLoads.set(track, pending);
    }
    return this.trackLoads.get(track);
  }

  async loadMusic() {
    const track = this.track;
    const buffer = await this.prepareTrack(track);
    if (track !== this.track) return;
    this.musicBuffer = buffer;
    this.musicStatus = 'Ready · original Mimesis recording';
    if (track === PARTY_KNIGHT_TRACK) {
      this.musicRoundDuration = buffer.duration;
      for (const next of [knightFalls, dreamLight, celloInterlude]) {
        this.prepareTrack(next).catch(error => console.warn(next.name+' could not preload.', error));
      }
    }
    this.onChange();
  }

  async switchTrack(track) {
    if (this.track === track) return;
    this.paletteAtSwitch = this.encoreLightMix;
    this.stopMusic();
    // Follow-up recordings have their own timeline from their first sample.
    this.clockRound = null;
    this.track = track;
    this.musicLabel = track.credit;
    this.musicOffset = 0;
    this.musicBuffer = this.trackBuffers.get(track) ?? null;
    try {
      if (!this.musicBuffer && this.enabled.music && this.context) await this.loadMusic();
      if (this.track === track) this.syncMusic();
    } catch (error) {
      if (this.track === track) this.musicStatus = track.name+' could not load.';
      console.warn(track.name+' could not load.', error);
    }
    this.onChange();
  }

  onMusicEnded() {
    // Once the escape has begun, Party Knight hands over to Dream Light, not Knight Falls.
    const next = this.escapeBegun && this.track === PARTY_KNIGHT_TRACK ? dreamLight : NEXT_TRACK.get(this.track);
    if (next && this.view !== 'home') return this.switchTrack(next);
  }

  // Knight Falls is ripped off the turntable: a needle-drag scratch as it
  // stops, then Dream Light starts once the scratch is over.
  playRecordScratch() {
    const c = this.context;
    if (!this.musicSource || !c || typeof c.createBuffer !== 'function') return null;
    if (!this.scratchBuffer) {
      const samples = renderRecordScratch(c.sampleRate);
      this.scratchBuffer = c.createBuffer(1, samples.length, c.sampleRate);
      this.scratchBuffer.copyToChannel(samples, 0);
    }
    return this.playBuffer(this.scratchBuffer, {kind: 'record-scratch', gain: .8});
  }

  startEscapeMusic() {
    // Dream Light may already be playing because Knight Falls ran out: leave it be.
    if (this.track === dreamLight) return Promise.resolve();
    // Party Knight is never cut short: it plays out, and Dream Light follows it.
    this.escapeBegun = true;
    if (this.track === PARTY_KNIGHT_TRACK) return Promise.resolve();
    if (this.playRecordScratch()) {
      this.scratchUntil = this.context.currentTime + RECORD_SCRATCH.seconds;
      globalThis.setTimeout?.(() => this.syncMusic(), RECORD_SCRATCH.seconds * 1000 + 20);
    }
    return this.switchTrack(dreamLight);
  }

  syncMusic() {
    // Nothing plays over the scratch.
    if (this.scratchUntil && this.context && this.context.currentTime < this.scratchUntil) { this.stopMusic(); return; }
    this.scratchUntil = 0;
    super.syncMusic();
  }

  startRound() {
    this.scratchUntil = 0;
    this.escapeBegun = false;
    super.startRound();
    if (this.track !== PARTY_KNIGHT_TRACK) this.musicBuffer = this.trackBuffers.get(PARTY_KNIGHT_TRACK) ?? null;
    this.track = PARTY_KNIGHT_TRACK;
    this.musicLabel = this.track.credit;
    this.paletteAtSwitch = 0;
  }

  get encoreLightMix() {
    if (this.track === PARTY_KNIGHT_TRACK || this.view === 'home') return 0;
    return Math.min(1, this.paletteAtSwitch + this.musicPosition / 4);
  }

  get lampCue() {
    if (this.track !== PARTY_KNIGHT_TRACK || !this.enabled.music) return null;
    return partyLampCueAt(this.view === 'home' ? 0 : this.musicPosition);
  }
}

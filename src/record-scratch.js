// A record scratch: the needle dragged straight across the grooves. One long
// mid-pitched rasp with a thump as it lands, regular bumps as the record
// wobbles under it, and an abrupt stop. Pure maths, so it can be tested
// without an audio device; the same seed always gives the same sound.
export const RECORD_SCRATCH=Object.freeze({
 seconds:.70,
 pitch:660,          // Hz, centre of the rasp
 wander:95,          // Hz it drifts either side
 bumpEvery:.128,     // seconds between wobble thumps
 bumpPitch:95,       // Hz
 level:.9
});

export function renderRecordScratch(sampleRate,rule=RECORD_SCRATCH){
 const length=Math.round(rule.seconds*sampleRate),out=new Float32Array(length);
 let seed=90210,phase=0,drift=0,low=0,band=0,grit=0,peak=0;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2147483648-1;};
 // One-pole filter coefficients for the noise bed (roughly 300 Hz to 1.1 kHz).
 const lowpass=1-Math.exp(-2*Math.PI*1100/sampleRate),highpass=1-Math.exp(-2*Math.PI*300/sampleRate),slow=1-Math.exp(-2*Math.PI*45/sampleRate);
 const harmonics=Math.max(1,Math.min(14,Math.floor(sampleRate/2/(rule.pitch+rule.wander)/1.1)));
 for(let i=0;i<length;i++){
  const t=i/sampleRate,white=random();
  // The groove rate wanders as the hand drags unevenly.
  drift+=(random()-drift)*.0009;
  const hz=rule.pitch+rule.wander*(Math.sin(t*2*Math.PI*1.9+.6)*.6+drift*6);
  phase+=2*Math.PI*hz/sampleRate;
  let buzz=0;for(let k=1;k<=harmonics;k++)buzz+=Math.sin(phase*k+k*.7)/k**2.15;
  // Grit: the buzz is roughened by slow random loudness changes and a noise bed.
  grit+=(white-grit)*slow;
  band+=(white-band)*lowpass;low+=(band-low)*highpass;
  let value=buzz*.5*(.62+2.6*Math.abs(grit))+(band-low)*1.1;
  // The landing thump, then a bump each time the wobbling record lifts the needle.
  const since=t<rule.bumpEvery*.5?t:(t+rule.bumpEvery*.5)%rule.bumpEvery,first=t<rule.bumpEvery*.5;
  value+=Math.sin(2*Math.PI*rule.bumpPitch*since)*Math.exp(-since*38)*(first?1.5:.75);
  // Full level at once, sagging a little, then cut dead.
  const body=Math.min(1,t/.003)*(1-.22*t/rule.seconds)*Math.min(1,Math.max(0,(rule.seconds-.012-t)/.012));
  const tail=Math.sin(2*Math.PI*70*t)*.12*Math.min(1,Math.max(0,(t-(rule.seconds-.06))/.02))*Math.min(1,(rule.seconds-t)/.03);
  out[i]=value*body+tail;
  peak=Math.max(peak,Math.abs(out[i]));
 }
 if(peak>0){const gain=rule.level/peak;for(let i=0;i<length;i++)out[i]*=gain;}
 return out;
}

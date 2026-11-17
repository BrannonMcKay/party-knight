// Requested outcome recordings; synths remain available if a file cannot load.
export const STORY_CUE_ASSETS=Object.freeze({
 correct:new URL('../assets/party-heaven.wav',import.meta.url).href,
 wrong:new URL('../assets/party-hell.wav',import.meta.url).href,
 'audience-aww':new URL('../assets/party-audience-aww.wav',import.meta.url).href,
 'audience-cheer':new URL('../assets/party-audience-cheer.wav',import.meta.url).href
});
const preloads=new WeakMap();
export function preloadStoryCues(audio,load=async url=>{const response=await fetch(url);if(!response.ok)throw new Error('Story sound unavailable');return response.arrayBuffer();}){
 if(!audio.context)return Promise.resolve();
 if(!preloads.has(audio))preloads.set(audio,Promise.allSettled(Object.entries(STORY_CUE_ASSETS).map(async([kind,url])=>{
  const buffer=await audio.context.decodeAudioData(await load(url));audio.buffers.set('estate-story-'+kind,buffer);
 })).then(results=>{for(const result of results)if(result.status==='rejected')console.warn('Story recording unavailable.',result.reason);}));
 return preloads.get(audio);
}

export function synthesizeStoryCue(kind,sampleRate){
 const duration=({'drown':.65,'wrong':.4,'maze-tick':.57,'cash-register':.86})[kind]??1.35;
 const samples=new Float32Array(Math.ceil(duration*sampleRate));
 let seed=4271,last=0;
 const noise=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2147483648-1;};
 for(let i=0;i<samples.length;i++){
  const t=i/sampleRate;let value=0;
  if(kind==='maze-tick'){
   // Struck low bell with a beating minor second and a falling bass note.
   const phase=2*Math.PI*(89*t-23*t*t);
   const strike=Math.exp(-t*13)*Math.sin(phase*4.24)*.23;
   const toll=Math.exp(-t*5.7)*(.37*Math.sin(phase)+.26*Math.sin(phase*1.062));
   value=(strike+toll)*Math.min(1,t/.008,(duration-t)/.04);
  }else if(kind==='cash-register'){
   // Drawer ratchet and latch, followed by a high brass double-ring.
   const n=noise(),click=n-last;last=n;
   const ratchet=(.35+.65*Math.cos(t*2*Math.PI*34)**4)*Math.exp(-t*20);
   value=click*.34*ratchet+Math.sin(2*Math.PI*151*t)*Math.exp(-t*28)*.15;
   for(const [start,hz,gain] of [[.12,1480,.30],[.18,2220,.26]]){
    const age=t-start;if(age<0)continue;
    value+=gain*(Math.sin(2*Math.PI*hz*age)+.36*Math.sin(2*Math.PI*hz*2.63*age))*Math.exp(-age*7)*Math.min(1,age/.003);
   }
   value*=Math.min(1,t/.002,(duration-t)/.025);
  }else if(kind==='drown'){
   // A quick rubbery "bloop-bwoop": comic punctuation, not a human distress cry.
   for(const [start,hz,span] of [[0,620,.25],[.16,410,.47]]){
    const age=t-start;if(age<0||age>span)continue;
    const phase=2*Math.PI*hz*(age-.72*age*age/(2*span));
    const envelope=Math.sin(Math.PI*age/span)**.65*Math.exp(-age*4);
    value+=(Math.sin(phase)+.25*Math.sin(phase*2))*.48*envelope;
   }
  }else if(kind==='wrong'){
   const envelope=Math.min(1,t/.018)*Math.max(0,1-t/duration)**1.2;
   value=(Math.sin(t*2*Math.PI*108)+.35*Math.sin(t*2*Math.PI*117)+.2*Math.sin(t*2*Math.PI*324))*.32*envelope;
  }else{
   for(const [start,hz] of [[0,659.25],[.09,830.61],[.18,987.77]]){
    const age=t-start;if(age>=0)value+=Math.sin(age*2*Math.PI*hz)*Math.min(1,age/.008)*Math.exp(-age*4)*.30;
   }
   // Staggered, filtered noise bursts resemble a short small-crowd applause.
   const n=noise(),high=n-last;last=n;
   for(let clap=0;clap<10;clap++){
    const age=t-(.30+clap*.065+(clap%3)*.016);
    if(age>=0&&age<.13)value+=high*Math.exp(-age*38)*.095*(1-clap/28);
   }
  }
  samples[i]=Math.max(-.9,Math.min(.9,value));
 }
 return samples;
}
export function playStoryCue(audio,kind){
 if(!audio.context||!audio.enabled.effects)return;
 const key='estate-story-'+kind;
 if(!audio.buffers.has(key)){
  if(kind==='audience-aww'||kind==='audience-cheer')return;
  const samples=synthesizeStoryCue(kind,audio.context.sampleRate),buffer=audio.context.createBuffer(1,samples.length,audio.context.sampleRate);
  buffer.copyToChannel(samples,0);audio.buffers.set(key,buffer);
 }
 const gain=kind==='audience-aww'||kind==='audience-cheer'?.90:kind==='drown'?.32:.50;
 return audio.playBuffer(audio.buffers.get(key),{kind:key,gain,rate:kind==='drown'?.94+(audio.random?.()??.5)*.12:1});
}

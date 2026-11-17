import {spatialMix} from './audio-cues.js';

export const BALCONY_HEY=new URL('../assets/party-balcony-hey.wav',import.meta.url).href;
const clips={
 'balcony-hey':{url:BALCONY_HEY,gain:.85},
 'ghost-boo':{url:new URL('../assets/party-ghost-boo.wav',import.meta.url).href,gain:.76},
 buschemi:{url:new URL('../assets/party-pan-buschemi.wav',import.meta.url).href,gain:.90},
 'flying-squirrel':{url:new URL('../assets/party-emily-flying-squirrel.wav',import.meta.url).href,gain:1.15},
 // Alex talks a lot: each line picks one of three different calls.
 loon:{url:new URL('../assets/party-alex-loon.wav',import.meta.url).href,gain:.56,variants:[new URL('../assets/party-alex-loon-2.wav',import.meta.url).href,new URL('../assets/party-alex-loon-3.wav',import.meta.url).href]},
};

// Follow visible speech events, not animation frames. Leaving the shot or
// advancing a caption stops its voice; returning to it never repeats the cue.
export function createBeverlySpeechAudio(audio,{stickmen,token,blocked,loadClip=async url=>{
 const response=await fetch(url);if(!response.ok)throw new Error('Speech clip unavailable: '+url);
 return response.arrayBuffer();
}}){
 const cast=new Set(stickmen),seen=new WeakMap(),active=new Map();
 const buffers=new Map(),loads=new Map();
 let clipStatus='ready to load',lastCue='',plays=0,nearToken=false;const cueCounts={},takes=new Map(),lastTake=new Map();
 const enabled=()=>audio.enabled.effects&&!audio.hidden&&audio.context?.state==='running'&&audio.view==='playing';
 function load(kind){
  if(!loads.has(kind)){
   const decode=url=>loadClip(url).then(data=>audio.context.decodeAudioData(data));
   // Alternate takes are optional: a missing one only narrows the choice.
   const extra=(clips[kind].variants??[]).map(url=>decode(url).catch(error=>{console.warn(error.message);return null;}));
   const loading=decode(clips[kind].url).then(async buffer=>{takes.set(kind,[buffer,...(await Promise.all(extra)).filter(Boolean)]);buffers.set(kind,buffer);})
    .catch(error=>{loads.delete(kind);console.warn(error.message);});
   loads.set(kind,loading);
  }
  return loads.get(kind);
 }
 async function preload(){
  if(!audio.context)return;
  const kinds=Object.keys(clips);
  clipStatus='loading';await Promise.all(kinds.map(load));clipStatus=kinds.every(kind=>buffers.has(kind))?'ready':'fallback';
 }
 function stop(entry){if(entry.voice)audio.stopVoice(entry.voice);}
 function play(entry){
  if(active.get(entry.actor)!==entry||!enabled())return;
  const {actor,position,listener}=entry,source={x:position.x,z:position.z,miniature:!!actor.tiny||actor.scale<.5};
  if(clips[entry.kind]){
   const mix=spatialMix(listener,source,38);
   // With several takes, choose at random but never the same one twice running.
   const pool=takes.get(entry.kind)??[];let buffer=buffers.get(entry.kind);
   if(pool.length>1){
    const last=lastTake.get(entry.kind)??-1;let pick=Math.floor((audio.random?.()??Math.random())*(pool.length-(last<0?0:1)));
    if(last>=0&&pick>=last)pick++;
    pick=Math.min(pool.length-1,pick);lastTake.set(entry.kind,pick);buffer=pool[pick];
   }
   if(buffer)entry.voice=audio.playBuffer(buffer,{kind:entry.kind,gain:clips[entry.kind].gain*mix.gain,pan:mix.pan});
   else if(entry.kind==='balcony-hey')entry.voice=audio.effect('greeting',source,listener);
  }else entry.voice=audio.taunt({player:listener},'taunt',source);
  if(entry.voice){plays++;lastCue=entry.kind;cueCounts[entry.kind]=(cueCounts[entry.kind]??0)+1;}
 }
 function update(visible,listener){
  const visibleActors=new Set(visible.map(item=>item.actor));
  for(const [actor,entry] of active){
   if(!enabled()||!visibleActors.has(actor)||actor.speech!==entry.speech||actor.speech?.text!==entry.text){stop(entry);active.delete(actor);}
  }
  for(const {actor,position} of visible){
   const speech=actor.speech,prior=seen.get(actor);
   if(!speech||(prior?.speech===speech&&prior.text===speech.text))continue;
   seen.set(actor,{speech,text:speech.text});
   const kind=actor.voiceCue??(cast.has(actor)?'taunt':null);
   if(!kind||!enabled())continue;
   const entry={actor,speech,text:speech.text,position:{...position},listener:{...listener},kind,voice:null};active.set(actor,entry);
   if(clips[kind]&&!buffers.has(kind))load(kind).then(()=>play(entry));else play(entry);
  }
 }
 function updateToken(position,angle){
  if(!position || !token?.actor.group.visible || token.state==='dead' || token.state==='skeleton'){nearToken=false;return;}
  const guest=token.actor.group.position,distance=guest.distanceTo(position);
  if(distance>5){nearToken=false;return;}
  if(nearToken || distance>3.3 || blocked?.(guest,position))return;
  nearToken=true;
  if(enabled() && audio.effect('grunt',guest,{x:position.x,z:position.z,angle})){
   plays++;lastCue='grunt';cueCounts.grunt=(cueCounts.grunt??0)+1;
  }
 }
 return {preload,update,updateToken,dispose(){for(const entry of active.values())stop(entry);active.clear();},snapshot(){return {plays,lastCue,clipStatus,cueCounts:{...cueCounts}};}};
}

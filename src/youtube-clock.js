// Reads the playback position of an embedded YouTube player without loading
// YouTube's script: the player reports its state by postMessage once it has
// been told someone is listening (the embed URL needs enablejsapi=1).
const ORIGINS=new Set(['https://www.youtube-nocookie.com','https://www.youtube.com']);

// Pure tracker, kept separate so it can be tested without a browser.
export function createPlaybackTracker(){
 let time=0,at=0,rate=1,playing=false,known=false,shown=0,shownAt=0;
 return {
  // `info` is the player's infoDelivery payload; `now` is in milliseconds.
  report(info,now){
   if(typeof info.playbackRate==='number')rate=info.playbackRate;
   if(typeof info.playerState==='number'){
    const next=info.playerState===1;
    // Freeze at the position reached so far when the player stops.
    if(playing&&!next&&typeof info.currentTime!=='number'){time+=(now-at)/1000*rate;at=now;}
    playing=next;
   }
   if(typeof info.currentTime==='number'){time=info.currentTime;at=now;known=true;}
  },
  // Position in video seconds, advanced between reports and eased so a late
  // report nudges the scene instead of jerking it.
  now(now){
   const target=time+(playing?(now-at)/1000*rate:0);
   const predicted=shown+(playing?(now-shownAt)/1000*rate:0),error=target-predicted;
   shown=Math.abs(error)>.35||!playing?target:predicted+error*.15;shownAt=now;
   return shown;
  },
  get playing(){return playing;},get known(){return known;}
 };
}

export function createYouTubeClock(iframe,{now=()=>performance.now()}={}){
 const tracker=createPlaybackTracker();
 let heard=false;
 const listen=()=>{
  try{iframe.contentWindow?.postMessage(JSON.stringify({event:'listening',id:'wrath',channel:'widget'}),'*');}catch{}
 };
 function onMessage(event){
  if(event.source!==iframe.contentWindow||!ORIGINS.has(event.origin))return;
  let data=event.data;
  if(typeof data==='string'){try{data=JSON.parse(data);}catch{return;}}
  if(!data||typeof data.info!=='object'||!data.info)return;
  heard=true;tracker.report(data.info,now());
 }
 addEventListener('message',onMessage);
 iframe.addEventListener('load',listen);
 // The player ignores the greeting until it has finished starting up. Keep
 // greeting it now and then afterwards too: if the player restarts itself it
 // forgets who was listening, and the scene would otherwise freeze.
 let knocks=0;
 const knock=setInterval(()=>{if(!(heard&&tracker.known)||++knocks%5===0)listen();},400);
 return {
  now:()=>tracker.now(now()),
  get playing(){return tracker.playing;},get connected(){return tracker.known;},
  dispose(){clearInterval(knock);removeEventListener('message',onMessage);iframe.removeEventListener('load',listen);}
 };
}

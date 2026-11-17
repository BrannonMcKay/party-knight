// When Stickman goes for Christel in each Wrath of Stickman film, in
// video seconds. The basement audience celebrates through each window and for
// a moment afterwards. Timed from half-second stills of the two films. A
// window marked 'rapture' gets a wilder, louder celebration.
export const THEATRE_ATTACKS=Object.freeze({
 // Part I, from the reenactment's own timing sheet (src/wrath-beats.js).
 1:[[43.6,47.4],   // holds her up at knife point
    [67.4,71],     // stabs her in the side
    [98.9,102.4],  // lunges at her eye
    [108.4,115.5]],// burrows under her clothes
 2:[[59.8,62.5],   // jumps on her in bed
    [75.3,79],     // the Tooth Fairy collects
    [84,101.2],    // strangles her with the cord
    [110,113.5],   // shoots her with the dart gun
    [129.5,136],   // comes at her with the iron
    [178.5,183,'rapture']], // his arm reaches in and grabs her: the house goes wild
 3:[[15.5,20.5],   // chloroform in the kitchen
    [69.3,71],[81.3,83],[93.8,95.5],[155.3,157.5], // slaps
    [162,172.5]]   // drags her back onto the bed and slaps her twice more
});
// When each film's closing credits begin (the picture cuts to lettering on
// black), in video seconds. Christel, when she is in the room, dances from here on.
export const THEATRE_CREDITS=Object.freeze({1:169.4,2:183,3:260});
export const THEATRE_RULE=Object.freeze({linger:1.6,rise:7,fall:2.2,cheerEvery:[.22,.55]});
export const THEATRE_SIGN="Al Pacino's basement theatre";
// Sticker beside the sign when the film plays alongside its reenactment (Part I).
export const THEATRE_STICKER="Double Feature";
// Heading over the Part II and Part III buttons on the Exit 2 result screen.
export const THEATRE_NOW_PLAYING="Movies now playing in Al Pacino's basement theatre:";

// True while an attack is on screen, or within `linger` seconds after one.
export function attackAt(windows,time,linger=THEATRE_RULE.linger){
 if(!windows||!Number.isFinite(time))return false;
 return windows.some(([from,to])=>time>=from&&time<=to+linger);
}

// Tracks the audience's mood from the video clock. `step` returns how many
// vocalizations to play this frame; `level` eases between 0 (watching) and 1.
export function createCrowdMood(windows,{rule=THEATRE_RULE,random=Math.random}={}){
 let level=0,next=0,celebrating=false,rapture=false;
 return {
  step(dt,time,playing){
   const now=!!playing&&attackAt(windows,time,rule.linger);
   rapture=now&&windows.some(([from,to,kind])=>kind==='rapture'&&time>=from&&time<=to+rule.linger);
   let cheers=0;
   if(now&&!celebrating){cheers=2;next=rule.cheerEvery[0];}
   celebrating=now;
   if(now){next-=dt;if(next<=0){cheers++;next=(rule.cheerEvery[0]+random()*(rule.cheerEvery[1]-rule.cheerEvery[0]))*(rapture?.5:1);}}
   level+=((now?1:0)-level)*(1-Math.exp(-dt*(now?rule.rise:rule.fall)));
   return cheers;
  },
  get level(){return level;},get celebrating(){return celebrating;},get rapture(){return rapture;}
 };
}

// Notices sustained slow rendering so the game can suggest a fix. Pure: feed it
// the seconds between frames while the game is being played.
export const LAG_HINT=Object.freeze({slowFps:40,slowSeconds:4,recoverFps:50,recoverSeconds:3,quietSeconds:60,maxHints:3,graceSeconds:8,stall:.5,largeWindow:1000*640});

export function createLagMonitor(options={}){
 const rule={...LAG_HINT,...options};
 let time=0,frames=0,slowRun=0,fastRun=0,showing=false,quiet=0,hints=0,fps=null,grace=rule.graceSeconds;
 const clear=()=>{time=frames=slowRun=fastRun=0;};
 return {
  // Returns 'show' when play has been slow for a few seconds running, 'hide'
  // once it has recovered, otherwise null.
  frame(seconds){
   // A long gap is a stall (tab switch, loading), not a frame rate.
   if(!(seconds>0)||seconds>rule.stall)return null;
   // The first seconds of play (and after a pause) hitch while things load; that is not lag.
   if(grace>0){grace-=seconds;return null;}
   time+=seconds;frames++;quiet=Math.max(0,quiet-seconds);
   if(time<1)return null;
   fps=frames/time;time=frames=0;
   if(fps<rule.slowFps){slowRun++;fastRun=0;}else{slowRun=0;fastRun=fps>=rule.recoverFps?fastRun+1:0;}
   if(!showing&&slowRun>=rule.slowSeconds&&quiet===0&&hints<rule.maxHints){showing=true;hints++;return 'show';}
   if(showing&&fastRun>=rule.recoverSeconds){showing=false;quiet=rule.quietSeconds;return 'hide';}
   return null;
  },
  // The player closed the hint, or acted on it; stay quiet for a while.
  dismiss(quietSeconds=rule.quietSeconds){showing=false;quiet=quietSeconds;clear();},
  // Play stopped or restarted: start measuring afresh.
  reset(){clear();grace=rule.graceSeconds;},
  get showing(){return showing;},get fps(){return fps;},get hints(){return hints;}
 };
}

// Render resolution steps taken when play is slow, as a share of full sharpness.
export const RESOLUTION_STEPS=Object.freeze([1,.75,.55]);

// The most pixels the game draws at full sharpness (about 2400 x 1350). A
// window on a 5K display is several times that, which starts play at a crawl.
export const PIXEL_BUDGET=3.2e6;

// The tallest picture the game draws. On this project's test laptop (Qualcomm
// Adreno X1-45) a picture 2068 pixels tall punches sky-coloured holes in
// Christel whenever the coach's headlights reach her; 1908 tall is clean. Only
// a full-height portrait window on a 2160-line display gets that tall.
export const MAX_PICTURE_HEIGHT=1900;

// Full-sharpness pixel ratio for a canvas of this CSS size: the device's own
// ratio, unless that would draw more than the budget or too tall a picture.
export function fullPixelRatio(width,height,deviceRatio,budget=PIXEL_BUDGET){
 if(!(width>0&&height>0))return deviceRatio;
 return Math.min(deviceRatio,Math.sqrt(budget/(width*height)),MAX_PICTURE_HEIGHT/height);
}

// Shown for a few seconds after the game lowers the resolution by itself.
export const LAG_NOTE=Object.freeze({text:'Picture resolution lowered for smoother play.',seconds:7});

// What to suggest once the resolution cannot (or may not) go any lower:
// shrinking the window only helps when the picture is large.
export function lagAdvice(width,height){
 return width*height>LAG_HINT.largeWindow
  ? 'Running slowly? Make this browser window smaller for smoother play.'
  : 'Running slowly? Closing other tabs and programs may help.';
}

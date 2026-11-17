// Shot-by-shot timing sheet for "The Wrath of Stickman Part 1" by Christel
// Vinot, used to stage the in-game reenactment beside the video. Times are
// seconds of video. Every pose is a pure function of the video time, so the
// scene follows a seek or a pause exactly.
//
// A beat holds until the next one starts. Positions are metres inside the
// named set. `c` is Christel, `s` is the stickman:
//   c: {p: pose, p2: pose to blend into, at/at2, yaw/yaw2, face, gait}
//   s: {m: mode, at | on (anchor on Christel), to | toOn, yaw, hop, knife}
const PI=Math.PI;
export const WRATH_VIDEO_ID='90P0FJjmYjM';
export const WRATH_DURATION=192.6;

// Opening and closing title cards.
export const WRATH_CARDS=[
 [0,4,'Christel Vinot Presents'],
 [4,9,'The Wrath of|Stickman'],
 [169.4,174,'The End'],
 // The film's card here credits its own film and animation; ours credits the reenactment.
 [174,178,'Reenactment by|Mimesis'],
 [178,182,'Music Composed by|Christel Vinot']
];

// [from, to, speaker, line], as lettered on screen in the film.
export const WRATH_LINES=[
 [44.9,47.4,'stickman',"Don't move!"],
 [47.4,50.4,'stickman','Give me your cell phone, NOW!'],
 [50.4,53,'christel','Okay!'],
 [53,54.4,'christel','Here!'],
 [59.9,62.4,'stickman','What the hell is this?'],
 [62.4,64.9,'christel',"That's my phone!"],
 [64.9,67.4,'stickman',"Well it's a piece of SHIT!"],
 [68.4,71,'christel','AAHH!'],
 [73.1,76,'stickman','Give me all your money!'],
 [76,79,'christel',"It's in my room..."],
 [79,81.6,'stickman','Well, come on!'],
 [94.1,97.1,'stickman',"Damn it! You don't have SHIT!"],
 [100.1,102.4,'christel','AAAHH!!!'],
 [104.6,108.3,'stickman',"Well, I'm going to get something out of this!"],
 [117.4,120.4,'christel','Hey now, wait a minute!'],
 [120.4,124.1,'christel','I will not be violated by a tiny stick man!'],
 [134.9,138,'stickman','Please, no!'],
 [138,141,'christel','GOOD RIDDANCE!']
];

// Moments that change the scene for good (or for a few seconds).
export const WRATH_EVENTS={
 frontDoorOpens:[12.6,13.8],
 sideStab:67.7,
 eyeStab:100.1,
 flush:[143.9,145.3],
 bathroomDoorCloses:[152.4,153.9],
 bow:182
};

// Christel on the landing: three-quarters to camera, laptop in front of her.
const CY=-1.0,F=[Math.sin(CY),0,Math.cos(CY)];
const sit={at:[0,0,0],yaw:CY};
const backFloor=[-F[0]*.3,0,-F[2]*.3],phoneSpot=[-.25,0,1.0],phoneFar=[-1.15,0,1.25];
const wide=[[-.7,.78,3.1],[-.15,.5,0]];
const side=[[2.2,.6,1.5],[.15,.5,0]];
const high=[[1.6,1.3,1.7],[.05,.7,0]];
const behind=[[1.35,1.05,.95],[.1,.85,.1]];
const close=[[-.75,.98,1.15],[.05,.8,.03]];
const knee=[[-1.0,.14,1.9],[-.15,.16,.85]];
const medium=[[-1.5,.9,1.6],[.05,.62,0]];
// Bedroom: bed along x, pillows at -x. Christel sits near the pillows facing the foot.
const bedY=.56,onBed={at:[-.35,bedY,-.6],yaw:PI/2},lying={at:[.75,bedY,-.6],yaw:PI/2};
const bedWide=[[.25,1.15,1.9],[.05,.72,-.6]],bedClose=[[1.25,1.05,.45],[-.25,.92,-.6]],bedFoot=[[1.35,.78,.25],[.35,.68,-.55]];
// Bathroom: toilet against the back wall, door in the -x wall.
const kneel={at:[.12,0,-.62],yaw:PI/2},bowl=[.62,.33,-.56];
const bathDoor=[[1.0,.3,.55],[-1.5,1.0,-.05]],bathToilet=[[-.55,.5,1.0],[.6,.42,-.7]];

export const WRATH_BEATS=[
 {t:0,set:'card'},
 // The front door swings open on its own.
 {t:9,set:'entry',cam:[[0,1.0,2.4],[0,1.05,-2]],fov:42},
 {t:13.9,set:'entry',cam:[[.95,.14,-.45],[.2,.42,-2]],fov:50},
 {t:14.9,set:'entry',cam:[[.95,.14,-.45],[.2,.42,-2]],fov:50,s:{m:'walk',at:[.18,0,-2.5],to:[.3,0,-1.55]}},
 {t:16.1,set:'entry',cam:[[.95,.14,-.45],[.2,.42,-2]],fov:50,s:{m:'stand',at:[.3,0,-1.55],yaw:'cam'}},
 // Across the living room and up the stairs.
 {t:18.65,set:'living',cam:[[0,.12,1.5],[0,.32,-1.5]],fov:50,s:{m:'walk',at:[-1.0,0,-.3],to:[1.0,0,-.3]}},
 {t:21.9,set:'stairs',cam:[[.15,.25,2.7],[0,.5,-1]],s:{m:'walk',at:[-.1,0,1.3],to:[-.1,0,.3]}},
 {t:24.4,set:'stairs',cam:[[.55,.13,.45],[-.1,.15,-.2],[.55,.13,-.2],[-.1,.15,-.8]],s:{m:'walk',at:[-.1,0,.3],to:[-.1,0,-.78]}},
 {t:27.1,set:'stairs',cam:[[0,.28,.1],[0,1.0,-2.6]],fov:50,s:{m:'steps'}},
 // Christel is typing; he sneaks up, climbs her back and pulls a knife.
 {t:30.4,set:'landing',cam:wide,c:{...sit,p:'sitType'}},
 {t:33.9,set:'landing',cam:wide,c:{...sit,p:'sitType'},s:{m:'walk',at:[2.3,0,.95],to:[1.15,0,.55]}},
 {t:36.6,set:'landing',cam:side,fov:40,c:{...sit,p:'sitType'},s:{m:'walk',at:[1.15,0,.55],to:backFloor}},
 {t:39.6,set:'landing',cam:side,fov:40,c:{...sit,p:'sitType'},s:{m:'climb',at:backFloor,toOn:'back'}},
 {t:41.4,set:'landing',cam:high,c:{...sit,p:'sitType'},s:{m:'climb',on:'back',toOn:'shoulderL'}},
 {t:43.6,set:'landing',cam:behind,fov:38,c:{...sit,p:'sitType',p2:'sitHandsUp'},s:{m:'aim',on:'shoulderL',yaw:'head',knife:true}},
 {t:44.9,set:'landing',cam:close,fov:40,c:{...sit,p:'sitHandsUp',face:'horrified'},s:{m:'aim',on:'shoulderL',yaw:'head',knife:true}},
 {t:50.4,set:'landing',cam:[[-.95,.95,1.0],[.03,.82,0]],fov:34,c:{...sit,p:'sitHandsUp',face:'horrified'},s:{m:'aim',on:'shoulderL',yaw:'head',knife:true}},
 {t:53,set:'landing',cam:[[-.95,.95,1.0],[.03,.82,0]],fov:34,c:{...sit,p:'sitHandsUp',p2:'sitGive',face:'horrified'},s:{m:'aim',on:'shoulderL',yaw:'head',knife:true},phone:{on:'handL'}},
 // He takes the phone down to the carpet and is not impressed.
 {t:54.4,set:'landing',cam:knee,c:{...sit,p:'sitRest'},s:{m:'stand',on:'shoulderL',yaw:'cam'},phone:{on:'handL'}},
 {t:55.1,set:'landing',cam:knee,c:{...sit,p:'sitRest'},s:{m:'hop',on:'shoulderL',to:[phoneSpot[0]+.2,0,phoneSpot[2]],hop:.25},phone:{at:phoneSpot}},
 {t:58.1,set:'landing',cam:[[-.75,.1,1.75],[-.2,.1,1.0]],c:{...sit,p:'sitRest'},s:{m:'bend',at:[phoneSpot[0]+.2,0,phoneSpot[2]],yaw:-PI/2},phone:{at:phoneSpot,open:true}},
 {t:59.9,set:'landing',cam:[[-.85,.12,2.1],[-.1,.3,.6]],c:{...sit,p:'sitRest'},s:{m:'shrug',at:[phoneSpot[0]+.2,0,phoneSpot[2]],yaw:'c'},phone:{at:phoneSpot,open:true}},
 {t:62.4,set:'landing',cam:medium,c:{...sit,p:'sitRest',face:'runner'},s:{m:'stand',at:[phoneSpot[0]+.2,0,phoneSpot[2]],yaw:'c'},phone:{at:phoneSpot,open:true}},
 {t:64.9,set:'landing',cam:[[-.85,.12,2.1],[-.2,.25,.7]],c:{...sit,p:'sitRest'},s:{m:'kick',at:[phoneSpot[0]+.2,0,phoneSpot[2]],yaw:-PI/2},phone:{at:phoneSpot,to:phoneFar,open:true}},
 // The first stab.
 {t:67.4,set:'landing',cam:[[-1.4,.5,1.5],[.05,.5,.05]],c:{...sit,p:'sitRest',p2:'sitShot'},s:{m:'hop',at:[phoneSpot[0]+.2,0,phoneSpot[2]],toOn:'sideL',hop:.3,knife:true},phone:{at:phoneFar,open:true}},
 {t:68.4,set:'landing',cam:[[-1.9,1.25,2.0],[0,.5,0]],c:{...sit,p:'sitShot',face:'horrified'},s:{m:'aim',on:'sideL',yaw:'head',knife:true},phone:{at:phoneFar,open:true}},
 {t:71,set:'landing',cam:[[-1.9,1.0,1.9],[0,.5,0]],c:{...sit,p:'sitShot',p2:'slump',face:'pout'},s:{m:'climb',on:'sideL',toOn:'shoulderL'},phone:{at:phoneFar,open:true}},
 {t:73.1,set:'landing',cam:close,fov:40,c:{...sit,p:'slump',face:'pout'},s:{m:'aim',on:'shoulderL',yaw:'head',knife:true}},
 // She crawls to her room with him riding along.
 {t:81.6,set:'landing',cam:[[.3,.95,3.4],[.5,.4,.75],[1.4,.95,3.4],[1.6,.4,.75]],c:{p:'crawl',at:[-.9,0,.75],at2:[.2,0,.75],yaw:PI/2,gait:'crawl',face:'pout'},s:{m:'ride',on:'neck',knife:true}},
 {t:83.9,set:'landing',cam:[[-1.6,.9,.8],[3,.25,.75]],c:{p:'crawl',at:[.2,0,.75],at2:[1.3,0,.75],yaw:PI/2,gait:'crawl',face:'pout'},s:{m:'ride',on:'neck',knife:true}},
 {t:86.1,set:'landing',cam:[[4.9,.3,1.1],[3.2,.4,.75]],c:{p:'crawl',at:[1.3,0,.75],at2:[2.4,0,.75],yaw:PI/2,gait:'crawl',face:'pout'},s:{m:'ride',on:'neck',knife:true}},
 // The purse holds one dollar.
 {t:88.4,set:'bedroom',cam:[[-.9,1.35,2.5],[.1,.6,-.2]],c:{p:'kneelLean',at:[.35,0,.62],yaw:PI},s:{m:'ride',on:'neck',knife:true}},
 {t:90.6,set:'bedroom',cam:bedWide,c:{...onBed,p:'sitOffer',face:'pout'},s:{m:'walk',at:[.9,bedY,-.35],to:[.42,bedY,-.5]},dollar:true},
 {t:91.9,set:'bedroom',cam:bedWide,c:{...onBed,p:'sitOffer',face:'pout'},s:{m:'stand',at:[.42,bedY,-.5],yaw:'c'},dollar:true},
 {t:94.1,set:'bedroom',cam:bedFoot,c:{...onBed,p:'sitOffer',face:'pout'},s:{m:'rage',at:[.42,bedY,-.5],yaw:'cam'},dollar:true},
 {t:97.1,set:'bedroom',cam:bedWide,c:{...onBed,p:'sitOffer',p2:'sitHandsUp',face:'horrified'},s:{m:'aim',at:[.42,bedY,-.5],yaw:'head',knife:true}},
 // The second stab: he leaps at her face.
 {t:98.9,set:'bedroom',cam:bedClose,fov:40,c:{...onBed,p:'sitHandsUp',face:'horrified'},s:{m:'aim',at:[.25,bedY,-.5],yaw:'head',knife:true}},
 {t:99.75,set:'bedroom',cam:bedClose,fov:40,c:{...onBed,p:'sitHandsUp',face:'horrified'},s:{m:'lunge',at:[.25,bedY,-.5],toOn:'face',hop:.12,yaw:'head',knife:true}},
 {t:100.1,set:'bedroom',cam:bedClose,fov:40,c:{...onBed,p:'sitHandsUp',face:'horrified'},s:{m:'aim',on:'face',yaw:'head',knife:true}},
 {t:102.4,set:'bedroom',cam:[[.1,1.5,1.6],[-.3,.7,-.6]],c:{...lying,p:'lieHurt'}},
 // "I'm going to get something out of this!": he struts up the bed and
 // crawls in under the hem of her shirt. A lump works its way up to the collar.
 {t:104.6,set:'bedroom',cam:bedWide,c:{...lying,p:'lieHurt'},s:{m:'strut',at:[1.15,bedY,-.22],to:[.3,bedY,-.26]}},
 {t:108.4,set:'bedroom',cam:bedWide,c:{...lying,p:'lieHurt',p2:'lieRest'},s:{m:'burrow',at:[.3,bedY,-.26],toOn:'hem',hop:.14}},
 {t:111.1,set:'bedroom',cam:[[.35,1.45,.75],[-.2,.78,-.6]],fov:40,c:{...lying,p:'lieRest',p2:'lieLook'},lump:[.72,1.1]},
 // She has had enough, and snatches him out through the collar.
 {t:117.4,set:'bedroom',cam:bedClose,fov:40,c:{...onBed,p:'sitReach',p2:'sitGrab',face:'pout'},s:{m:'held',on:'collar',toOn:'handR'}},
 {t:118.4,set:'bedroom',cam:bedClose,fov:40,c:{...onBed,p:'sitGrab',face:'pout'},s:{m:'held',on:'handR'}},
 {t:124.1,set:'bedroom',cam:[[2.4,.3,1.9],[.3,.35,.75]],c:{p:'crawlHold',at:[-1.1,0,.85],at2:[-.1,0,.85],yaw:PI/2,gait:'crawl',face:'pout'},s:{m:'held',on:'handR'}},
 {t:126.6,set:'bedroom',cam:[[1.6,2.6,2.4],[1.3,0,.9]],c:{p:'crawlHold',at:[-.1,0,.85],at2:[1.0,0,.85],yaw:PI/2,gait:'crawl',face:'pout'},s:{m:'held',on:'handR'}},
 // To the bathroom.
 {t:128.4,set:'bathroom',cam:[[-.1,2.0,1.6],[-.4,0,-.1]],c:{p:'crawlHold',at:[-2.6,0,-.05],at2:[-1.7,0,-.1],yaw:PI/2,gait:'crawl',face:'pout'},s:{m:'held',on:'handR'}},
 {t:130.4,set:'bathroom',cam:[[.75,.22,.75],[-.25,.36,-.12]],c:{p:'prone',at:[-1.7,0,-.1],yaw:PI/2,face:'pout'},s:{m:'held',on:'handR'}},
 {t:132.1,set:'bathroom',cam:[[-1.0,.22,1.15],[.2,.42,-.4]],c:{p:'prone',p2:'proneLook',at:[-1.7,0,-.1],yaw:PI/2,face:'pout'},s:{m:'held',on:'handR'}},
 {t:134.9,set:'bathroom',cam:[[1.22,.95,.3],[.3,.7,-.6]],fov:42,c:{...kneel,p:'kneelDangle',face:'pout'},s:{m:'dangle',on:'handR'}},
 {t:141,set:'bathroom',cam:[[1.22,.95,.3],[.3,.7,-.6]],fov:42,c:{...kneel,p:'kneelDangle',p2:'kneelOpen',face:'pout'},s:{m:'fall',on:'handR',to:bowl}},
 {t:142,set:'bathroom',cam:[[1.22,.95,.3],[.3,.7,-.6]],fov:42,c:{...kneel,p:'kneelOpen',face:'pout'}},
 {t:143.1,set:'bathroom',cam:[[1.0,1.0,.15],[.38,.74,-.9]],fov:36,c:{at:[-.02,0,-1.0],yaw:PI/2,p:'kneelOpen',p2:'kneelFlush',face:'pout'}},
 {t:146.1,set:'bathroom',cam:[[.1,.62,1.25],[-.2,.6,-.85]],c:{at:[-.2,0,-.85],yaw:0,p:'sitRelief',face:'happy'}},
 {t:148.9,set:'bathroom',cam:bathDoor,c:{at:[-.2,0,-.5],at2:[-1.35,0,-.05],yaw:-PI/2,p:'stand',gait:'walk'}},
 {t:150.6,set:'bathroom',cam:bathDoor,c:{at:[-1.35,0,-.05],at2:[-2.3,0,-.05],yaw:-PI/2,p:'stand',gait:'walk'}},
 {t:152.4,set:'bathroom',cam:bathDoor},
 // ...but the toilet has not had the last word.
 {t:157.1,set:'bathroom',cam:bathToilet},
 {t:160.9,set:'bathroom',cam:[[.05,.5,.35],[.6,.42,-.5],[.2,.47,.1],[.6,.42,-.5]]},
 {t:163.8,set:'bathroom',cam:[[.2,.47,.1],[.6,.42,-.5]],s:{m:'peek',at:[.6,.02,-.43],to:[.6,.2,-.43],yaw:0}},
 {t:165.2,set:'bathroom',cam:[[.2,.47,.1],[.6,.42,-.5]],s:{m:'peek',at:[.6,.2,-.43],yaw:0}},
 {t:169.4,set:'card'},
 // In the film this is a photograph of the film-maker; here the cast take a bow.
 {t:182,set:'landing',cam:[[.1,1.0,2.9],[.1,.85,0]],fov:40,bow:true,c:{at:[-.2,0,0],yaw:0,p:'wave',face:'happy'},s:{m:'wave',at:[.95,0,.45],yaw:'cam'}},
 {t:191.2,set:'card'}
];

const find=(list,time)=>list.find(([from,to])=>time>=from&&time<to)||null;
export function wrathLineAt(time){const line=find(WRATH_LINES,time);return line?{speaker:line[2],text:line[3]}:null;}
export function wrathCardAt(time){const card=find(WRATH_CARDS,time);return card?card[2]:null;}
// The beat on screen at `time`, with its progress `u` from 0 to 1.
export function wrathBeatAt(time){
 let index=0;
 for(let i=0;i<WRATH_BEATS.length;i++){if(WRATH_BEATS[i].t<=time)index=i;else break;}
 const beat=WRATH_BEATS[index],end=WRATH_BEATS[index+1]?.t??WRATH_DURATION,length=Math.max(.001,end-beat.t);
 return {beat,index,u:Math.min(1,Math.max(0,(time-beat.t)/length)),local:Math.max(0,time-beat.t),length};
}

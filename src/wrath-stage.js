// A small stage that re-enacts "The Wrath of Stickman Part 1" with the game's
// Christel and a tiny stickman, driven by the video's own clock. It owns its
// renderer, sets and overlays; wrath-beats.js says who is where and when.
import * as T from '../vendor/three.module.js';
import {makeRunner,makeStickman,faceTexture} from './world.js';
import {createPartyKnife} from './beverly-escape-visuals.js';
import {WRATH_EVENTS,WRATH_DURATION,wrathBeatAt,wrathLineAt,wrathCardAt} from './wrath-beats.js';

const SET_X={entry:0,living:20,stairs:40,landing:60,bedroom:80,bathroom:100};
const LOOK={
 entry:{sky:0xffffff,ground:0x6d5a48,fill:.85,sun:0xf4f8ff,power:1.5,from:[.6,2.2,-3],back:0x1c1d22},
 living:{sky:0xf2f4ff,ground:0x77706a,fill:1.0,sun:0xffffff,power:1.0,from:[-2,3,2.5],back:0xcfcac2},
 stairs:{sky:0xf2f4ff,ground:0x77706a,fill:1.0,sun:0xffffff,power:.9,from:[1,3,2.5],back:0xcfcac2},
 landing:{sky:0xf2f4ff,ground:0x77706a,fill:1.0,sun:0xffffff,power:1.0,from:[-2,3,2.5],back:0xd6d1c8},
 bedroom:{sky:0xfff0c0,ground:0x6b5a30,fill:.9,sun:0xffe2a0,power:1.0,from:[-2,3,2.5],back:0xcdbb8a},
 bathroom:{sky:0xf6f0a8,ground:0x5d5a2a,fill:.95,sun:0xf5ec9a,power:.9,from:[1.5,3,2.5],back:0xcfc68c}
};
const STICK_SCALE=.14,PI=Math.PI;
export const WRATH_ANCHORS=['shoulderL','shoulderR','back','sideL','neck','handR','handL','face','hem','collar'];
export const WRATH_SETS=Object.keys(SET_X);
const ease=u=>u*u*(3-2*u),clamp01=v=>Math.min(1,Math.max(0,v)),mix=(a,b,u)=>a+(b-a)*u;

const P=(o={})=>({y:0,rx:0,rz:0,legs:[0,0,0,0],arms:[0,0,0,0],el:[.12,.12],head:[0,0,0],...o});
const SEAT=[-1.45,-.5,-1.45,.5],KNEEL=[.9,0,.9,0];
// arms/legs are [right x, right z, left x, left z]; el is [right, left] elbow bend.
export const WRATH_POSES={
 stand:P(),
 wave:P({arms:[0,-.12,0,2.6],el:[.12,-.5]}),
 sitType:P({y:-.56,rx:.12,legs:SEAT,arms:[-.75,0,-.75,0],el:[-.7,-.7],head:[.35,0,0]}),
 sitRest:P({y:-.56,rx:.05,legs:SEAT,arms:[-.9,-.15,-.9,.15],el:[-.35,-.35],head:[.1,0,0]}),
 sitHandsUp:P({y:-.56,rx:-.05,legs:SEAT,arms:[-.5,-.75,-.5,.75],el:[-1.3,-1.3],head:[-.1,0,0]}),
 sitGive:P({y:-.56,legs:SEAT,arms:[-.9,-.15,-2.2,.5],el:[-.35,-1.5],head:[.1,.3,0]}),
 sitShot:P({y:-.56,rx:-.15,rz:.2,legs:SEAT,arms:[-.6,-2.2,-.4,.3],el:[-.3,-.6],head:[-.3,0,0]}),
 slump:P({y:-.56,rx:-.22,rz:-.2,legs:SEAT,arms:[.25,-.35,.25,.35],el:[0,0],head:[.2,0,.25]}),
 sitOffer:P({y:-.56,rx:.05,legs:SEAT,arms:[-1.25,0,-.5,.1],el:[-.25,-.4],head:[.15,0,0]}),
 sitReach:P({y:-.56,rx:.02,legs:SEAT,arms:[-.75,.6,-.4,.1],el:[-2.0,-.3],head:[.3,0,0]}),
 sitGrab:P({y:-.56,rx:-.03,legs:SEAT,arms:[-1.15,.2,-.4,.1],el:[-.8,-.3],head:[.2,0,0]}),
 sitRelief:P({y:-.56,rx:-.2,legs:[-1.5,-.15,-1.5,.15],arms:[.15,-.2,.15,.2],el:[0,0],head:[-.35,0,0]}),
 crawl:P({y:.3,rx:1.4,legs:[-1.05,0,-1.05,0],arms:[-1.4,0,-1.4,0],el:[0,0],head:[-1.1,0,0]}),
 crawlHold:P({y:.3,rx:1.4,legs:[-1.05,0,-1.05,0],arms:[-2.3,-.2,-1.4,0],el:[-.5,0],head:[-1.1,0,0]}),
 prone:P({y:.14,rx:1.5,legs:[0,-.15,0,.15],arms:[-2.5,-.25,-2.2,.2],el:[-1.0,-1.3],head:[-1.2,0,0]}),
 proneLook:P({y:.14,rx:1.5,legs:[0,-.15,0,.15],arms:[-2.5,-.25,-2.2,.2],el:[-1.0,-1.3],head:[-1.35,-.6,0]}),
 kneelLean:P({y:-.36,rx:.55,legs:KNEEL,arms:[-1.9,0,-1.9,0],el:[-.2,-.2],head:[-.2,0,0]}),
 kneelDangle:P({y:-.36,rx:.1,legs:KNEEL,arms:[-1.95,0,-.3,0],el:[-.1,-.2],head:[.2,0,0]}),
 kneelOpen:P({y:-.36,rx:.1,legs:KNEEL,arms:[-1.7,-.25,-.3,0],el:[0,-.2],head:[.25,0,0]}),
 kneelFlush:P({y:-.36,rx:.15,legs:KNEEL,arms:[-1.5,0,-.3,0],el:[-.1,-.2],head:[.1,0,0]}),
 lieHurt:P({y:.14,rx:-1.5,legs:[0,-.12,0,.12],arms:[0,-.4,-2.5,0],el:[0,-2.0]}),
 lieRest:P({y:.14,rx:-1.5,legs:[0,-.12,0,.12],arms:[0,-.4,0,.4],el:[0,0]}),
 lieLook:P({y:.14,rx:-1.5,legs:[0,-.12,0,.12],arms:[-.3,-.4,-.3,.4],el:[-.3,-.3],head:[.7,0,0]})
};
const blendPose=(a,b,u)=>{const o={y:mix(a.y,b.y,u),rx:mix(a.rx,b.rx,u),rz:mix(a.rz,b.rz,u)};for(const k of ['legs','arms','el','head'])o[k]=a[k].map((v,i)=>mix(v,b[k][i],u));return o;};

function buildSets(scene){
 const cache=new Map();
 const mat=(color,extra={})=>{const key=color+JSON.stringify(extra);if(!cache.has(key))cache.set(key,new T.MeshStandardMaterial({color,roughness:.9,...extra}));return cache.get(key);};
 const glow=color=>mat(color,{emissive:color,emissiveIntensity:1});
 const unit=new T.BoxGeometry(1,1,1);
 const sets={};
 const stage=name=>{const g=new T.Group();g.name='Wrath set: '+name;g.position.x=SET_X[name];g.visible=false;scene.add(g);sets[name]=g;return g;};
 const box=(g,pos,size,color,extra)=>{const m=new T.Mesh(unit,typeof color==='number'?mat(color,extra):color);m.position.set(...pos);m.scale.set(...size);m.castShadow=m.receiveShadow=true;g.add(m);return m;};
 const floor=(g,color,size=[12,10],at=[0,0])=>{const m=box(g,[at[0],-.05,at[1]],[size[0],.1,size[1]],color);m.castShadow=false;return m;};
 const plant=(g,x,z)=>{box(g,[x,.2,z],[.34,.4,.34],0x8a5b3c);const leaf=new T.Mesh(new T.SphereGeometry(.42,10,8),mat(0x3f6b3a));leaf.position.set(x,.85,z);leaf.scale.y=1.3;leaf.castShadow=true;g.add(leaf);};

 // Front hall: the door that opens by itself.
 const entry=stage('entry'),wall=0xd9d6cf;
 floor(entry,0x8a5a3a);
 for(const s of [-1,1]){box(entry,[s*2.0,1.4,-2],[2.1,2.8,.1],wall);box(entry,[s*.75,1.05,-2],[.4,2.1,.05],glow(0xffffff));box(entry,[s*.5,1.05,-2],[.1,2.1,.12],wall);box(entry,[s*3.0,1.4,.5],[.1,2.8,6],wall);}
 box(entry,[0,2.45,-2],[2.1,.7,.1],wall);box(entry,[0,1.4,-3.3],[6,3.4,.05],glow(0xffffff)).castShadow=false;
 box(entry,[0,.012,-1.25],[1.0,.024,.6],0x4a4338);plant(entry,2.3,-1.4);
 const frontDoor=new T.Group();frontDoor.position.set(-.45,0,-1.97);entry.add(frontDoor);
 box(frontDoor,[.45,1.025,0],[.9,2.05,.05],0xdedcd6);box(frontDoor,[.8,1.0,.05],[.05,.05,.06],0xb59a52);
 for(const y of [.55,1.5])box(frontDoor,[.45,y,.03],[.6,.7,.012],0xcfcdc6);

 // Living room.
 const living=stage('living');
 floor(living,0xb9b2a6);box(living,[0,1.4,-3],[8,2.8,.1],0xd8d4cc);box(living,[2.7,1.4,-1],[.1,2.8,5],0xd0ccc4);
 box(living,[-.3,.32,-2.25],[1.15,.64,.95],0x2b2a30);box(living,[-.3,.85,-2.6],[1.15,.75,.28],0x2b2a30);
 for(const s of [-1,1])box(living,[-.3+s*.52,.62,-2.2],[.16,.3,.85],0x25242a);
 plant(living,-1.75,-2.4);box(living,[1.65,.95,-2.8],[.9,1.9,.34],0x4b3526);
 for(const y of [.5,1.0,1.5])box(living,[1.65,y,-2.62],[.8,.3,.02],0x241a14);

 // Staircase.
 const stairs=stage('stairs');
 floor(stairs,0xb3ada2);
 for(let i=0;i<9;i++)box(stairs,[0,(i+1)*.09,-(1+i*.28)-.14*(8-i)],[1.24,(i+1)*.18,.28*(9-i)],0xa9a59c);
 for(const s of [-1,1])box(stairs,[s*.66,1.6,-2.35],[.08,3.2,3.3],0xdcd8cf);
 box(stairs,[0,1.6,-4.0],[1.4,3.2,.08],0xcfcbc2);box(stairs,[0,2.3,-3.95],[.7,1.3,.04],0x7d6248);

 // Upstairs landing where Christel is working, with the door to her room.
 const landing=stage('landing');
 floor(landing,0xbdb6aa,[14,10],[1,0]);
 box(landing,[-.85,1.4,-1.7],[6.3,2.8,.1],0xe1ddd3);box(landing,[1.2,1.02,-1.64],[.8,2.04,.03],0xd3cfc5);
 box(landing,[2.3,1.4,-.75],[.1,2.8,1.9],0xe1ddd3);box(landing,[2.3,1.4,3.15],[.1,2.8,3.7],0xe1ddd3);box(landing,[2.3,2.45,.75],[.1,.7,1.1],0xe1ddd3);
 box(landing,[5.5,1.4,-1.7],[6.4,2.8,.1],0xd8cfae);box(landing,[3.7,.28,-.9],[.7,.56,.5],0xa9845a);box(landing,[3.75,.7,-.92],[.5,.28,.4],0x9c7a52);
 for(let z=-1.5;z<=2.6;z+=.16)box(landing,[-2.7,.48,z],[.04,.96,.04],0xf1eee8);
 box(landing,[-2.7,.98,.55],[.07,.06,4.3],0xf1eee8);
 const laptop=new T.Group();laptop.position.set(Math.sin(-1.0)*.6,0,Math.cos(-1.0)*.6);laptop.rotation.y=-1.0;landing.add(laptop);
 box(laptop,[0,.012,0],[.36,.024,.25],0x2a2c31);const lid=box(laptop,[0,.13,.16],[.36,.25,.014],0x2a2c31);lid.rotation.x=.3;
 const screen=box(laptop,[0,.13,.151],[.31,.2,.006],glow(0x9fc4e8));screen.rotation.x=.3;screen.castShadow=false;

 // Bedroom.
 const bedroom=stage('bedroom');
 floor(bedroom,0xb0a184);box(bedroom,[0,1.4,-1.5],[6,2.8,.1],0xd9c9a0);box(bedroom,[-2.3,1.4,.5],[.1,2.8,5],0xd2c298);
 box(bedroom,[0,.2,-.6],[2.3,.4,1.5],0x3a2a22);box(bedroom,[0,.48,-.6],[2.2,.16,1.45],0x8fae6f);box(bedroom,[-1.17,.55,-.6],[.08,1.1,1.55],0x33241d);
 for(const z of [-.95,-.28])box(bedroom,[-.85,.62,z],[.42,.12,.55],0xd8cf7a);
 box(bedroom,[.55,.66,-1.08],[.3,.2,.16],0x2d2a2e);box(bedroom,[.55,.79,-1.08],[.2,.06,.03],0x2d2a2e);
 box(bedroom,[-1.75,.3,-1.2],[.45,.6,.4],0x4b3526);box(bedroom,[-1.75,.82,-1.2],[.2,.3,.2],glow(0xffe9a8)).castShadow=false;
 for(const x of [.3,1.1])box(bedroom,[x,1.7,-1.44],[.4,.3,.03],0x2c2622);

 // Bathroom.
 const bathroom=stage('bathroom'),tile=0xd8cf9a;
 floor(bathroom,0xd9d2a8,[8,8],[-.5,0]);box(bathroom,[-.1,1.4,-1.2],[2.9,2.8,.1],tile);box(bathroom,[1.3,1.4,.5],[.1,2.8,3.5],tile);
 box(bathroom,[-1.5,1.4,-.85],[.1,2.8,.7],tile);box(bathroom,[-1.5,1.4,1.3],[.1,2.8,1.8],tile);box(bathroom,[-1.5,2.45,-.05],[.1,.7,.9],tile);
 box(bathroom,[-3.2,1.4,-1.2],[3.4,2.8,.1],0xcdbb8a);
 box(bathroom,[-1.44,1.25,1.0],[.05,.75,.42],0x2f4a33);box(bathroom,[-1.46,1.55,1.75],[.03,.34,.3],0x8a8f93);
 const bathDoor=new T.Group();bathDoor.position.set(-1.5,0,-.5);bathroom.add(bathDoor);
 box(bathDoor,[0,1.025,.45],[.05,2.05,.9],0xe4e0d2);box(bathDoor,[.04,1.0,.8],[.06,.05,.05],0xb59a52);
 const toilet=new T.Group();toilet.position.set(.6,0,-.75);bathroom.add(toilet);
 const china=mat(0xeee8cf,{roughness:.35,side:T.DoubleSide});
 const bowl=new T.Mesh(new T.CylinderGeometry(.2,.13,.4,20,1,true),china);bowl.position.set(0,.2,.15);bowl.scale.z=1.25;bowl.castShadow=bowl.receiveShadow=true;toilet.add(bowl);
 const seat=new T.Mesh(new T.TorusGeometry(.2,.03,8,24),china);seat.rotation.x=PI/2;seat.position.set(0,.41,.15);seat.scale.y=1.25;seat.castShadow=true;toilet.add(seat);
 const water=new T.Mesh(new T.CircleGeometry(.175,20),mat(0x9fb6a6,{roughness:.15}));water.rotation.x=-PI/2;water.position.set(0,.27,.15);water.scale.y=1.25;toilet.add(water);
 box(toilet,[0,.62,-.22],[.44,.4,.18],china);box(toilet,[0,.83,-.22],[.47,.03,.2],china);box(toilet,[0,.25,-.12],[.22,.5,.2],china);
 const toiletLid=new T.Mesh(new T.CylinderGeometry(.21,.21,.025,20),china);toiletLid.position.set(0,.64,-.1);toiletLid.rotation.x=PI/2-.12;toiletLid.scale.x=1;toiletLid.castShadow=true;toilet.add(toiletLid);
 const lever=new T.Group();lever.position.set(-.225,.74,-.2);toilet.add(lever);box(lever,[0,0,.05],[.02,.025,.11],0xb9bcc0,{metalness:.6,roughness:.35});

 return {sets,frontDoor,bathDoor,laptop,lever};
}

export function createWrathStage(container,{pixelRatio=Math.min(2,globalThis.devicePixelRatio||1)}={}){
 const canvas=document.createElement('canvas');canvas.className='wrath-canvas';canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Christel and a tiny stickman acting out the film');
 const card=document.createElement('div');card.className='wrath-card';card.hidden=true;
 const line=document.createElement('p');line.className='wrath-line';line.hidden=true;line.setAttribute('aria-hidden','true');
 const tag=document.createElement('span');tag.className='wrath-tag';tag.textContent='Live reenactment';
 const credit=document.createElement('p');credit.className='wrath-credit';credit.hidden=true;
 container.append(canvas,card,line,tag,credit);

 const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'low-power'});
 renderer.setPixelRatio(pixelRatio);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(45,16/9,.03,60);
 const hemi=new T.HemisphereLight(0xffffff,0x777777,1),sun=new T.DirectionalLight(0xffffff,1);
 sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-4.5,right:4.5,top:4.5,bottom:-4.5,near:.5,far:16});sun.shadow.bias=-.0012;sun.shadow.normalBias=.015;
 scene.add(hemi,sun,sun.target);
 const {sets,frontDoor,bathDoor,laptop,lever}=buildSets(scene);

 // Cast.
 const christel=makeRunner(),stick=makeStickman();
 // He is lit from one side in a small room: keep his face reading white, as drawn.
 stick.head.traverse(o=>{if(o.isMesh&&o.material.isMeshStandardMaterial){o.material.emissive.set(0xffffff);o.material.emissiveIntensity=.45;}});
 christel.root.name='Wrath reenactment Christel';stick.root.name='Wrath reenactment stickman';stick.root.scale.setScalar(STICK_SCALE);
 scene.add(christel.root,stick.root);
 // Wardrobe from the film: the blue crab-shack tee.
 const jacket=christel.limbs[1].children[0].material;jacket.color.set(0x3d86c8);
 const slogan=document.createElement('canvas');slogan.width=512;slogan.height=256;
 const ink=slogan.getContext('2d');ink.fillStyle='#f4f8ff';ink.textAlign='center';ink.textBaseline='middle';
 ink.translate(256,128);ink.rotate(-.07);
 ink.font='italic 900 41px "Arial Narrow",Arial,sans-serif';ink.fillText('COME FOR THE TAIL',0,-58);ink.fillText('LEAVE WITH THE CRABS',0,-8);
 ink.font='900 24px Arial,sans-serif';ink.fillText("JOE'S CRAB SHACK",0,44);
 const print=new T.CanvasTexture(slogan);print.colorSpace=T.SRGBColorSpace;print.anisotropy=4;
 const tee=new T.Mesh(new T.CylinderGeometry(.203,.181,.27,20,1,true,-.7,1.4),new T.MeshStandardMaterial({map:print,transparent:true,roughness:.9,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));
 tee.name='Crab shack slogan';tee.position.set(0,1.0,0);christel.body.add(tee);
 const faces={runner:christel.expression.material.map,happy:faceTexture('happy'),horrified:faceTexture('horrified'),pout:faceTexture('pout')};
 const anchors={};
 const anchor=(name,parent,x,y,z)=>{const o=new T.Object3D();o.position.set(x,y,z);parent.add(o);anchors[name]=o;};
 anchor('shoulderL',christel.body,.38,1.2,.1);anchor('shoulderR',christel.body,-.34,1.2,0);anchor('back',christel.body,.12,.95,-.42);
 anchor('sideL',christel.body,.23,.86,.08);anchor('neck',christel.body,0,1.28,-.2);
 anchor('face',christel.head,.2,.2,.4);anchor('hem',christel.body,.02,.7,.2);anchor('collar',christel.body,.02,1.2,.17);
 anchor('handR',christel.elbows[0],0,-.24,.05);anchor('handL',christel.elbows[1],0,-.24,.05);
 const red=new T.MeshStandardMaterial({color:0xd3141c,roughness:.5});
 const blob=(parent,pos,scale)=>{const m=new T.Mesh(new T.SphereGeometry(1,10,8),red);m.position.set(...pos);m.scale.set(...scale);parent.add(m);return m;};
 const sideWound=blob(christel.body,[.2,.88,.13],[.05,.07,.03]),eyeWound=new T.Group();christel.head.add(eyeWound);
 blob(eyeWound,[.13,.37,.335],[.05,.055,.02]);blob(eyeWound,[.14,.27,.335],[.018,.08,.014]);
 // Props.
 const dark=new T.MeshStandardMaterial({color:0x17151c,roughness:.6}),silver=new T.MeshStandardMaterial({color:0xb9bcc2,roughness:.4,metalness:.5});
 const part=(parent,material,pos,size)=>{const m=new T.Mesh(new T.BoxGeometry(...size),material);m.position.set(...pos);m.castShadow=true;parent.add(m);return m;};
 // His knife, the one the party guests carry, held out in front of him.
 const knife=createPartyKnife(T);knife.name='Reenactment knife';knife.scale.setScalar(2.6);knife.position.set(.42,1.3,.3);knife.rotation.x=PI/2;stick.body.add(knife);
 knife.traverse(o=>{if(o.isMesh)o.castShadow=true;});
 // The bump he makes crawling about under her shirt.
 const lump=new T.Mesh(new T.SphereGeometry(1,14,10),christel.limbs[1].children[0].material);lump.name='Lump under the shirt';lump.scale.set(.075,.07,.06);lump.visible=false;christel.body.add(lump);
 const phone=new T.Group();scene.add(phone);part(phone,silver,[0,.01,0],[.11,.02,.05]);
 const flip=new T.Group();flip.position.set(.055,.02,0);phone.add(flip);part(flip,silver,[-.05,.008,0],[.1,.016,.05]);
 const dollar=new T.Mesh(new T.BoxGeometry(.15,.07,.004),new T.MeshStandardMaterial({color:0x7fa56d,roughness:.9}));dollar.position.set(0,-.05,.06);anchors.handR.add(dollar);

 const v=new T.Vector3(),w=new T.Vector3(),from=new T.Vector3(),to=new T.Vector3(),origin=new T.Vector3(),headAt=new T.Vector3();
 const local=(a,out)=>out.set(a[0],a[1],a[2]).add(origin);
 let activeSet=null,shownCard=null,shownLine=null,lastTime=-1,width=0,height=0;

 function show(name){
  if(activeSet===name)return;activeSet=name;
  for(const [key,group] of Object.entries(sets))group.visible=key===name;
  const look=LOOK[name];origin.set(SET_X[name],0,0);
  hemi.color.set(look.sky);hemi.groundColor.set(look.ground);hemi.intensity=look.fill;
  sun.color.set(look.sun);sun.intensity=look.power;sun.position.set(...look.from).multiplyScalar(2.5).add(origin);sun.target.position.copy(origin);sun.target.updateMatrixWorld();
  scene.background=new T.Color(look.back);
 }
 function poseChristel(spec,u,span,time){
  const {root,body,head,limbs,elbows,expression}=christel;
  root.visible=!!spec;if(!spec)return;
  local(spec.at,v);if(spec.at2)v.lerp(local(spec.at2,w),u);root.position.copy(v);
  root.rotation.set(0,mix(spec.yaw,spec.yaw2??spec.yaw,ease(u)),0);
  let pose=WRATH_POSES[spec.p];
  if(spec.p2)pose=blendPose(pose,WRATH_POSES[spec.p2],ease(clamp01(span.local/Math.min(span.length,.8))));
  const swing=spec.gait==='crawl'?Math.sin(time*7)*.3:spec.gait==='walk'?Math.sin(time*9)*.5:0;
  body.position.set(0,pose.y+(spec.gait==='walk'?Math.abs(Math.sin(time*9))*.03:0),0);body.rotation.set(pose.rx,0,pose.rz+(spec.gait==='crawl'?Math.sin(time*7)*.04:0));
  limbs[0].rotation.set(pose.legs[0]+swing,0,pose.legs[1]);limbs[2].rotation.set(pose.legs[2]-swing,0,pose.legs[3]);
  limbs[1].rotation.set(pose.arms[0]-swing,0,pose.arms[1]);limbs[3].rotation.set(pose.arms[2]+swing,0,pose.arms[3]);
  elbows[0].rotation.set(pose.el[0],0,0);elbows[1].rotation.set(pose.el[1],0,0);
  head.rotation.set(pose.head[0],pose.head[1],pose.head[2]);
  if(spec.p==='wave')limbs[3].rotation.z+=Math.sin(time*6)*.3;
  if(spec.p==='sitType'&&!spec.p2){elbows[0].rotation.x+=Math.sin(time*17)*.06;elbows[1].rotation.x+=Math.cos(time*15)*.06;}
  if(spec.face==='horrified')body.rotation.z+=Math.sin(time*31)*.012;
  expression.material.map=faces[spec.face]||faces.runner;
  root.updateMatrixWorld(true);
 }
 const spot=(at,on,out)=>on?anchors[on].getWorldPosition(out):local(at,out);
 function poseStick(spec,u,span,time){
  const {root,body,limbs}=stick;
  root.visible=!!spec;knife.visible=false;root.scale.setScalar(STICK_SCALE);if(!spec)return;
  const mode=spec.m;
  root.rotation.set(0,0,0);
  if(mode==='steps'){
   // Hop up the staircase a step at a time.
   const f=u*7.999,i=Math.floor(f),k=f-i,h=n=>n<0?0:(n+1)*.18,z=n=>n<0?-.72:-(1+n*.28)-.1;
   root.position.set(-.1,mix(h(i-1),h(i),ease(clamp01(k*1.6)))+Math.sin(PI*clamp01(k*1.25))*.12,mix(z(i-1),z(i),ease(clamp01(k*1.25)))).add(origin);
   stick.animate(time,true,false);root.rotation.y=PI;
  }else{
   spot(spec.at,spec.on,from);
   const moves=spec.to||spec.toOn;
   if(moves){spot(spec.to,spec.toOn,to);const k=mode==='fall'||mode==='lunge'?u*u:mode==='walk'||mode==='strut'?u:ease(u);root.position.lerpVectors(from,to,k);if(spec.hop)root.position.y+=Math.sin(PI*u)*spec.hop;}
   else root.position.copy(from);
   let yaw=spec.yaw;
   if(yaw===undefined)yaw=mode==='climb'||mode==='ride'||mode==='held'?christel.root.rotation.y:moves&&Math.hypot(to.x-from.x,to.z-from.z)>.01?Math.atan2(to.x-from.x,to.z-from.z):'cam';
   if(typeof yaw==='string'){
    const aim=yaw==='cam'?camera.position:yaw==='head'?christel.head.getWorldPosition(headAt):christel.root.position;
    yaw=Math.atan2(aim.x-root.position.x,aim.z-root.position.z);
   }
   root.rotation.y=yaw;
   if(mode==='walk')stick.animate(time,true,false);
   else if(mode==='strut')stick.animate(time*.55,true,false);
   else if(mode==='climb'||mode==='peek'){stick.hang(time);if(mode==='climb')root.position.y+=Math.abs(Math.sin(time*9))*.012;}
   else if(mode==='held'||mode==='dangle'||mode==='fall'){
    stick.animate(time,true,false,{kind:'scream'});
    if(mode==='held')root.position.y-=1.0*STICK_SCALE;else{root.rotation.z=PI;root.position.y-=.02;root.rotation.y+=Math.sin(time*5)*.5;}
   }else{
    const upset=mode==='rage'||mode==='shrug'||mode==='kick';
    stick.animate(time,false,upset);
    if(mode==='rage')root.position.y+=Math.abs(Math.sin(time*11))*.035;
    if(mode==='bend')body.rotation.x=.85;
    if(mode==='kick')limbs[0].rotation.x=-1.4*Math.sin(PI*clamp01(u*2.2));
    if(mode==='shrug'){limbs[1].rotation.z=-1.2;limbs[3].rotation.z=1.2;}
    if(mode==='wave')limbs[3].rotation.z=1.7+Math.sin(time*7)*.35;
    if(mode==='hop'){limbs[1].rotation.z=-1.1;limbs[3].rotation.z=1.1;}
    // Head first under the hem, shrinking out of sight as he goes in.
    if(mode==='burrow'){stick.animate(time,true,false);body.rotation.x=1.2*ease(u);root.scale.setScalar(STICK_SCALE*(1-.75*ease(clamp01((u-.55)/.45))));}
   }
   if(spec.knife&&mode!=='hop'&&mode!=='climb'){
    // Held ready, and driven forward for a moment at each stab.
    const stab=Math.max(0,1-Math.min(Math.abs(time-WRATH_EVENTS.sideStab),Math.abs(time-WRATH_EVENTS.eyeStab))/.22);
    knife.visible=true;limbs[3].rotation.x=-1.0-.5*stab;limbs[3].rotation.z=-.15;knife.position.z=.3+.35*stab;
    if(stab>0&&mode!=='lunge'){w.set(Math.sin(root.rotation.y),0,Math.cos(root.rotation.y));root.position.addScaledVector(w,.05*stab);}
   }
  }
  root.updateMatrixWorld(true);
  stick.lookAtCamera(camera,false);
 }
 function poseProps(beat,u,time){
  const p=beat.phone;phone.visible=!!p;
  if(p){
   if(p.on){anchors[p.on].getWorldPosition(phone.position);anchors[p.on].getWorldQuaternion(phone.quaternion);}
   else{local(p.at,v);if(p.to)v.lerp(local(p.to,w),ease(clamp01((u-.25)/.5)));phone.position.copy(v);phone.position.y+=.004;phone.rotation.set(0,.5+(p.to?u*5:0),0);}
   flip.rotation.z=p.open?-1.9:0;
  }
  dollar.visible=!!beat.dollar;
  const hurt=!beat.bow;
  sideWound.visible=hurt&&time>=WRATH_EVENTS.sideStab;eyeWound.visible=hurt&&time>=WRATH_EVENTS.eyeStab;
  // The lump travels from the hem to the collar, wriggling as it goes.
  lump.visible=!!beat.lump;
  if(beat.lump)lump.position.set(.03+Math.sin(time*9)*.035,mix(beat.lump[0],beat.lump[1],ease(u))+Math.sin(time*13)*.012,.165);
  laptop.visible=!beat.bow;
  frontDoor.rotation.y=-1.2*ease(clamp01((time-WRATH_EVENTS.frontDoorOpens[0])/(WRATH_EVENTS.frontDoorOpens[1]-WRATH_EVENTS.frontDoorOpens[0])));
  const closing=WRATH_EVENTS.bathroomDoorCloses;bathDoor.rotation.y=2.45*(1-ease(clamp01((time-closing[0])/(closing[1]-closing[0]))));
  const flush=WRATH_EVENTS.flush;lever.rotation.x=.7*Math.sin(PI*clamp01((time-flush[0])/(flush[1]-flush[0])));
 }
 function overlays(time){
  const text=wrathCardAt(time),said=wrathLineAt(time);
  if(text!==shownCard){
   shownCard=text;card.replaceChildren();
   if(text)text.split('|').forEach((row,i)=>{const el=document.createElement(i&&text.includes('Stickman')?'strong':'span');el.textContent=row;card.append(el);});
  }
  const key=said?said.speaker+said.text:null;
  if(key!==shownLine){shownLine=key;line.hidden=!said;if(said){line.textContent=said.text;line.dataset.speaker=said.speaker;}}
 }
 function resize(){
  const w=container.clientWidth,h=container.clientHeight;
  if(!w||!h||(w===width&&h===height))return false;
  width=w;height=h;renderer.setSize(w,h,false);camera.aspect=w/h;return true;
 }
 // Pose and draw the scene for one moment of the video.
 function setTime(time){
  time=Math.min(WRATH_DURATION,Math.max(0,time));
  const resized=resize();if(time===lastTime&&!resized)return;lastTime=time;
  const span=wrathBeatAt(time),{beat,u}=span;
  overlays(time);
  const dark=beat.set==='card';card.hidden=!dark;tag.hidden=dark;
  credit.hidden=!beat.credit;if(beat.credit&&credit.textContent!==beat.credit)credit.textContent=beat.credit;
  if(dark)return;
  show(beat.set);
  const c=beat.cam,k=ease(u);
  local(c[0],v);if(c[2])v.lerp(local(c[2],w),k);camera.position.copy(v);
  local(c[1],v);if(c[3])v.lerp(local(c[3],w),k);camera.lookAt(v);
  camera.fov=beat.fov||45;camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
  poseChristel(beat.c||null,u,span,time);
  poseStick(beat.s||null,u,span,time);
  poseProps(beat,u,time);
  renderer.render(scene,camera);
 }
 let frame=0;
 // Follow a clock (anything with now() in video seconds) until disposed.
 function follow(clock){
  cancelAnimationFrame(frame);
  const tick=()=>{frame=requestAnimationFrame(tick);setTime(clock.now());};
  tick();
 }
 function dispose(){
  cancelAnimationFrame(frame);
  scene.traverse(o=>{if(!o.isMesh)return;o.geometry.dispose();for(const m of [].concat(o.material)){m.map?.dispose();m.dispose();}});
  renderer.dispose();renderer.forceContextLoss?.();
  canvas.remove();card.remove();line.remove();tag.remove();credit.remove();
 }
 return {setTime,follow,dispose,canvas,get time(){return lastTime;},get set(){return activeSet;},christel,stick,camera,scene,renderer};
}

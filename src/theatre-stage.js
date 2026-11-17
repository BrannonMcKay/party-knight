// Al Pacino's basement theatre: the audience shown under the video while a
// Wrath of Stickman film plays. Stickmen fill two rows of seats with Al
// Pacino and Alex among them, all facing the screen above (so we see them from
// behind). They fidget while they watch and leap about, arms up and shouting,
// whenever Stickman attacks Christel in the film (src/theatre-beats.js).
import * as T from '../vendor/three.module.js';
import {makeStickman,makeRunner} from './world.js';
import {buildBeverlyGuests} from './beverly-guests.js';
import {createCrowdMood} from './theatre-beats.js';

export const THEATRE=Object.freeze({
 // Row 0 is nearer the screen; row 1 is behind it, nearer to us.
 rows:[{z:-.55,seats:8},{z:.75,seats:7}],pitch:.74,
 guests:{alPacino:[1,2],alex:[1,4]},guestDrop:{alPacino:.22,alex:.5},
 stickScale:.6,stickDrop:.1,
 // Part I's own tiny stickman: stood on his seat cushion he is hidden by the
 // seat back, and only shows when he leaps for joy.
 tiny:{seat:[1,5],scale:.19,stand:.35,leap:1},
 // Christel watches from behind the back row with a churro when she comes as a
 // guest: long stops to watch and nibble, and a short stroll across between them.
 christel:{z:1.4,span:1.2,speed:.7,pause:13},
 eye:[0,2.2,4.3],aim:[0,1.08,-.2],fov:24
});

export function createTheatreStage(container,{attacks=[],onCheer=null,tiny=false,christel=false,credits=Infinity,pixelRatio=Math.min(2,globalThis.devicePixelRatio||1)}={}){
 const canvas=document.createElement('canvas');canvas.className='wrath-canvas';canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Stickmen, Al Pacino and Alex watching from theatre seats');
 container.append(canvas);
 const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'low-power'});renderer.setPixelRatio(pixelRatio);
 const scene=new T.Scene();scene.background=new T.Color(0x0b0810);scene.fog=new T.Fog(0x0b0810,7,14);
 const camera=new T.PerspectiveCamera(THEATRE.fov,16/5,.05,40);camera.position.set(...THEATRE.eye);camera.lookAt(...THEATRE.aim);
 // House lights are down: a dim fill so the backs of heads read, and the
 // screen's own flickering light from the front.
 const fill=new T.HemisphereLight(0xb9a8d8,0x241a2c,.75),back=new T.DirectionalLight(0xffd9b0,.55);back.position.set(1.5,4,6);
 const glow=new T.PointLight(0xcfe0ff,26,12,1.6);glow.position.set(0,3.1,-3.2);
 scene.add(fill,back,back.target,glow);
 const solid=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.85,...extra});
 const box=(pos,size,material)=>{const m=new T.Mesh(new T.BoxGeometry(...size),material);m.position.set(...pos);scene.add(m);return m;};
 const concrete=solid(0x2a2530),velvet=solid(0x8a1626,{roughness:.7}),trim=solid(0x3a1118);
 box([0,-.05,0],[16,.1,12],concrete);box([0,1.5,-3.6],[16,4,.2],solid(0x1c1822));
 // A bare basement: one pipe along the far wall.
 const pipe=new T.Mesh(new T.CylinderGeometry(.06,.06,16,10),solid(0x4a4650,{metalness:.5,roughness:.5}));pipe.rotation.z=Math.PI/2;pipe.position.set(0,.55,-3.45);scene.add(pipe);
 const seats=[];
 THEATRE.rows.forEach((row,r)=>{
  for(let i=0;i<row.seats;i++){
   const x=(i-(row.seats-1)/2)*THEATRE.pitch;
   box([x,.48,row.z+.34],[.62,.96,.1],velvet);box([x,.99,row.z+.34],[.5,.08,.1],velvet);
   box([x,.3,row.z+.06],[.6,.1,.5],trim);
   for(const side of [-1,1])box([x+side*.34,.52,row.z+.1],[.06,.08,.5],trim);
   seats.push({row:r,index:i,x,z:row.z});
  }
 });
 const guestSeats=new Map(Object.entries(THEATRE.guests).map(([name,[r,i]])=>[r+':'+i,name]));
 const cast=buildBeverlyGuests(T,scene,{},{});
 for(const name of ['emily','panMan','hotChick'])if(cast[name])cast[name].group.visible=false;
 const audience=seats.map((seat,n)=>{
  const phase=n*2.399,name=guestSeats.get(seat.row+':'+seat.index);
  if(name){
   const guest=cast[name];
   Object.assign(guest,{scripted:true,wandering:false,moving:false,running:false,waving:false,speech:null,expression:'happy'});
   guest.group.visible=true;
   return {kind:'guest',name,guest,seat,phase};
  }
  const small=tiny&&seat.row===THEATRE.tiny.seat[0]&&seat.index===THEATRE.tiny.seat[1];
  const rig=makeStickman();rig.root.scale.setScalar(small?THEATRE.tiny.scale:THEATRE.stickScale);rig.root.rotation.y=Math.PI;scene.add(rig.root);
  // makeStickman adds its raised-arms group two places after the head.
  const flail=rig.body.children[rig.body.children.indexOf(rig.head)+2]??null;
  return {kind:'stickman',rig,seat,phase,flail,tiny:small};
 });
 const mood=createCrowdMood(attacks);
 // Christel wanders back and forth behind the seats, stopping at each end to
 // take a bite of her churro while she watches.
 let stroller=null;
 if(christel){
  const runner=makeRunner();scene.add(runner.root);
  const churro=new T.Mesh(new T.CylinderGeometry(.028,.028,.36,8),solid(0xd99639,{roughness:.95}));
  churro.position.set(0,-.2,.2);churro.rotation.x=Math.PI/2;runner.elbows[1].add(churro);
  stroller={runner};
 }
 // She stands watching the screen, angled a little so her churro shows. During
 // each celebration she faces the screen and leaps about with the stickmen,
 // arms (and churro) in the air; once the credits roll she dances for us.
 let walk=0,cheer=0,dancing=0,shown=null;
 function stroll(dt){
  const {z,span,speed,pause}=THEATRE.christel,leg=2*span/speed,{runner}=stroller,{root,limbs,elbows,body}=runner;
  const cheering=mood.level>.3,dance=!cheering&&time>=credits;
  cheer+=((cheering?1:0)-cheer)*Math.min(1,dt*9);
  dancing=dance?dancing+dt:0;
  if(!cheering&&!dance)walk+=dt;
  // Start at a stop, so she is watching when the film begins.
  const u=(walk+leg)%(2*(leg+pause));
  let x,turn,walking=true;
  if(u<leg){x=-span+u*speed;turn=Math.PI/2;}
  else if(u<leg+pause){x=span;turn=Math.PI+.5;walking=false;}
  else if(u<2*leg+pause){x=span-(u-leg-pause)*speed;turn=-Math.PI/2;}
  else{x=-span;turn=Math.PI-.5;walking=false;}
  // Cheering and dancing both start square to the screen; her dance turns her round to us.
  if(cheering||dance)turn=Math.PI;
  const swing=Math.atan2(Math.sin(turn-root.rotation.y),Math.cos(turn-root.rotation.y));
  root.rotation.y+=swing*Math.min(1,dt*10);
  // For the credits she steps in from the edge of the picture so the dance is not cropped.
  const want=dance?T.MathUtils.clamp(x,-1.05,1.05):x;shown=shown===null?want:shown+(want-shown)*Math.min(1,dt*(dance?5:2.5));
  const hop=Math.abs(Math.sin(elapsed*9.2))*cheer*boost;
  root.position.set(shown,hop*.24,z);
  runner.animate(elapsed,walking&&!cheering&&!dance,false,dance?1+dancing:0,dt);
  // Her arms are short, so they stretch a little to clear her hair when she cheers.
  for(const i of [1,3])limbs[i].scale.setScalar(dance?1:1+.9*cheer);
  if(dance)return;
  // Carried low while walking; lifted to her mouth for a bite now and then while she watches.
  const bite=walking?.3:.45+.55*Math.max(0,Math.sin(elapsed*.9))**2*(.8+.2*Math.sin(elapsed*3.2));
  limbs[3].rotation.x=-.25-1.0*bite;elbows[1].rotation.x=-.5-1.25*bite;
  // Both arms thrown up and pumping, out of step with each other.
  for(const [i,side] of [[1,-1],[3,1]]){
   const arm=limbs[i],elbow=elbows[i===1?0:1];
   arm.rotation.x=T.MathUtils.lerp(arm.rotation.x,-2.85+.3*Math.sin(elapsed*11+i),cheer);arm.rotation.z=side*.65*cheer;
   elbow.rotation.x=T.MathUtils.lerp(elbow.rotation.x,-.15,cheer);
  }
  body.rotation.z+=Math.sin(elapsed*7.5)*.12*cheer;
 }
 let clock=null,time=0,elapsed=0,boost=1,width=0,height=0,frame=0,last=0;
 function resize(){
  const w=container.clientWidth,h=container.clientHeight;if(!w||!h||(w===width&&h===height))return;
  width=w;height=h;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
 }
 function pose(dt){
  const level=mood.level;
  // Rapture: everyone leaps half as high again.
  boost+=((mood.rapture?1.55:1)-boost)*Math.min(1,dt*5);
  cast.update(dt,camera,{});
  for(const a of audience){
   const t=elapsed+a.phase,wild=Math.min(1,level*(1.1+.25*Math.sin(a.phase*5))),hop=Math.abs(Math.sin(t*(8.5+Math.sin(a.phase)*1.5)))*wild*boost;
   if(a.kind==='guest'){
    const g=a.guest;g.waving=wild>.3;g.speech=null;
    g.group.position.set(a.seat.x,-THEATRE.guestDrop[a.name]+hop*.2,a.seat.z);g.group.rotation.set(0,Math.PI+Math.sin(t*.7)*.06*(1-wild),0);
    continue;
   }
   const {rig}=a;rig.animate(t,false,false);
   if(a.tiny)rig.root.position.set(a.seat.x,THEATRE.tiny.stand+hop*THEATRE.tiny.leap,a.seat.z);
   else rig.root.position.set(a.seat.x+Math.sin(t*6)*.04*wild,-THEATRE.stickDrop+hop*.34+Math.sin(t*2.6)*.012,a.seat.z);
   // Watching: glances at the neighbours. Celebrating: arms up, rocking.
   rig.head.rotation.set(0,Math.sin(t*.8)*.5*(1-wild)+Math.sin(t*9)*.5*wild,0);
   rig.body.rotation.z=Math.sin(t*7.5)*.16*wild;
   const up=wild>.3;rig.limbs[1].visible=rig.limbs[3].visible=!up;
   if(a.flail){a.flail.visible=up;a.flail.rotation.z=Math.sin(t*17)*.1;}
  }
  if(stroller)stroll(dt);
  glow.intensity=(22+5*Math.sin(elapsed*13.1)+4*Math.sin(elapsed*5.3))*(1+.25*level);
 }
 function render(dt){
  resize();elapsed+=dt;
  if(clock)time=clock.now();
  const cheers=mood.step(dt,time,clock?clock.playing:false);
  for(let i=0;i<cheers;i++)onCheer?.();
  pose(dt);renderer.render(scene,camera);
 }
 function start(){
  cancelAnimationFrame(frame);last=performance.now();
  const tick=now=>{frame=requestAnimationFrame(tick);const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;render(dt);};
  frame=requestAnimationFrame(tick);
 }
 function dispose(){
  cancelAnimationFrame(frame);
  scene.traverse(o=>{if(!o.isMesh)return;o.geometry.dispose();for(const m of [].concat(o.material)){m.map?.dispose();m.dispose();}});
  renderer.dispose();renderer.forceContextLoss?.();canvas.remove();
 }
 return {start,render,dispose,follow(source){clock=source;start();},canvas,scene,camera,renderer,audience,mood,stroller,get cheering(){return cheer>.5;},get dancing(){return dancing>0;},
  get time(){return time;},get celebrating(){return mood.celebrating;},get level(){return mood.level;}};
}

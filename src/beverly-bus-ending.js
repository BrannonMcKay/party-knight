import {world, PATIO_FOUNTAIN} from './beverly-layout.js';
import {buildBusEndingCast} from './beverly-reincarnation.js';
import {FOUNTAIN_PLACES} from './beverly-fountain-story.js';

// The balcony aside is shot long: Alex the loon in front, the Hot Chick above and behind him.
export const BUS_ENDING_BALCONY=Object.freeze({fov:36,back:6.5,rise:1.0,aim:.45,normalFov:66});

const script = [
 ['jump',1.15],
 ['bus-plan',5.2,'bran',"Let's take the bus out of here! There's an angry mob of critics coming!"],
 ['look',1.65,'player','Look at that!'],
 ['reveal',.85], ['swim',1.1], ['flight',2.25],
 ['reincarnated',4.2,'bran','Wow, they reincarnated as a flying squirrel and a loon!'],
 ['loon-pan',1.15],
 ['loon-reply',3.4,'loon','Feels good to be back!'],
 ['balcony',4.4,'hot','You look sexier than ever, baby!'],
 ['leave',3.2,'cellist','To the party bus!'],
 ['appear',.95], ['wait',1.9,'al','Wait for me!'],
 ['board',Infinity], ['depart',Infinity]
];

export function createBusEnding(T, model, player, navigation=null) {
 const parent=new T.Group(); parent.name='Alternate party bus ending'; model.root.add(parent);
 const vec=(x,y,z)=>new T.Vector3(x,y,z), place=(u,v,h=8.15)=>vec(...world(u,v,h));
 const beacon=model.story.spots.first.group.clone();
 beacon.name='Mimesis alternate exit'; beacon.position.copy(place(849,478,8.20)); parent.add(beacon);
 for(const mesh of beacon.children){mesh.material=mesh.material.clone();mesh.material.color.set(0xd586ff);}
 const {loon,squirrel,critics,animateAnimals}=buildBusEndingCast(T,model,parent);
 const fountain=place(PATIO_FOUNTAIN.u,PATIO_FOUNTAIN.v,PATIO_FOUNTAIN.surface);
 const water=model.patioFountain.surface.material,waterEmission=water.emissive.clone(),waterIntensity=water.emissiveIntensity;
 const light=new T.PointLight(0xff70e7,0,13,2); light.position.copy(fountain).y+=1;parent.add(light);
 const show=model.performance, bus=model.partyBus, al=model.guests.alPacino, hot=model.guests.hotChick;
 function speaker(root,name,height){
  const anchor=new T.Object3D();anchor.position.y=height;root.add(anchor);
  return {group:root,anchor,speechName:name,speech:null};
 }
 const playerRoot=player?.root??new T.Group();
 const cast={player:speaker(playerRoot,'Christel',2.05),bran:speaker(show.bran,'Bran Man',2.28),cellist:speaker(show.christel.root,'Christel',2.05),loon:speaker(loon.root,'Alex',1.25),al,hot};
 cast.loon.voiceCue='loon';
 const players=[cast.cellist.group,cast.bran.group], stage=players.map(o=>o.position.clone());
 const landing=[place(828,466),place(851,466)], lightHome=show.glows.map(g=>g.light.position.clone()),auraHome=show.glows.map(g=>g.aura.position.clone());
 const legs=show.branBody.children.filter(o=>o.name==='Bran trouser leg'||o.name==='Bran shoe').map(o=>({o,y:o.position.y,z:o.position.z,a:o.rotation.x,sign:Math.sign(o.position.x)}));
 const paths=model.passengers.paths, road=bus.route;
 const crowds=[
  {anchor:road.roadLength*.49,cast:critics.slice(0,6)},
  {anchor:road.roadLength*.16,cast:critics.slice(6)}
 ];
 const routeToCoach=[...paths.prance.points].reverse().concat(paths.toFountain.points.slice(0,-1).reverse(),paths.exit.points.slice(0,-1).reverse());
 const cameraEye=vec(),cameraAim=vec(); let cameraReady=false,chaseLeader=null;
 let fov=BUS_ENDING_BALCONY.normalFov,hotCalled=false;
 let unlocked=false, step=-1, age=0, clock=0, houseDim=0, finished=false, activeSpeaker=null, boarding=[], fadeParts=[], playerSpot=vec(), nextShout=0, shoutIndex=0;
 const alRest={p:al.group.position.clone(),q:al.group.quaternion.clone(),label:al.label.visible};
 function unlock(){unlocked=true;beacon.visible=true;}
 function advanceDialogue(){if(activeSpeaker)age=script[step][1];}
 function prepareAl(){
  // He appears to one side of the musicians and Christel, clear of the camera's line to them.
  al.group.position.copy(place(839,495)); al.group.rotation.set(0,.53,0);al.group.visible=true;al.label.visible=true;
  al.scripted=true;al.running=false;al.moving=false;
  const copies=new Map();
  al.group.traverse(o=>{
   if(!o.isMesh||Array.isArray(o.material))return;
   const old=o.material;
   if(!copies.has(old)){const mat=old.clone();mat.transparent=true;mat.opacity=0;mat.depthWrite=false;copies.set(old,mat);}
   fadeParts.push({o,old});o.material=copies.get(old);
  });
 }
 function restoreAlMaterials(){
  const used=new Set();for(const {o,old} of fadeParts){used.add(o.material);o.material=old;}
  for(const mat of used)mat.dispose();fadeParts=[];
 }
 function callHotChick(){
  // Wherever the chase left her (even face down in a pool), she is back on her
  // balcony for this line. The escape restores her saved pose on reset.
  hotCalled=true;const g=hot.group;
  g.traverse(o=>{if(o!==g&&/Party guest knife|Escape held drink|Escape face|countdown/i.test(o.name))o.visible=false;});
  g.rotation.set(0,0,0);hot.setPosition(vec(...world(...FOUNTAIN_PLACES.balcony)));g.visible=true;hot.label.visible=true;
  hot.scripted=true;hot.moving=hot.running=false;hot.waving=true;hot.faceToward(loon.root.position);
 }
 function boardRoutes(){
  bus.openForBoarding();
  const group=[cast.player.group,...players,al.group,squirrel.root,loon.root];
  boarding=group.map((root,i)=>{
   const isLoon=root===loon.root, points=[root.position.clone()];
   const height=root===squirrel.root?1.42:isLoon?.24:0;
   // Alex lands beyond the rim and skirts the basin on foot before following the others indoors.
   const approach=isLoon?place(942,563):place(885,516);
   for(const p of [approach,...routeToCoach]){
    const next=p.clone();next.y+=height;
    if(next.distanceToSquared(points.at(-1))>.00001)points.push(next);
   }
   const route=new T.CurvePath();
   for(let j=1;j<points.length;j++)route.add(new T.LineCurve3(points[j-1],points[j]));
   return {root,route,length:route.getLength(),delay:isLoon?1.6:i*.23,speed:isLoon?6.95:7.8,done:false};
  });
  al.running=al.moving=true;
 }
 function enter(index){
  if(activeSpeaker)activeSpeaker.speech=null;activeSpeaker=null;
  step=index;age=0;
  const [name,,who,text]=script[step];
  if(who){activeSpeaker=cast[who];activeSpeaker.speech={text,remaining:Infinity};}
  if(name==='reveal'){loon.root.visible=squirrel.root.visible=true;}
  if(name==='balcony')callHotChick();else if(hotCalled)hot.waving=false;
  if(name==='appear')prepareAl();
  if(name==='wait')restoreAlMaterials();
  if(name==='board'){boardRoutes();chaseLeader=null;}
  if(name==='depart'){bus.depart();nextShout=shoutIndex=0;}
 }
 function tryStart(pos,camera){
  if(!unlocked||step>=0||finished||pos.distanceTo(beacon.position)>.88)return false;
  beacon.visible=false;playerSpot.copy(pos);al.scripted=true;al.group.visible=false;
  if(camera){cameraEye.copy(camera.position);cameraAim.copy(camera.getWorldDirection(vec())).multiplyScalar(4).add(cameraEye);cameraReady=true;}
  enter(0);return true;
 }
 function stageShot(camera, eye, target,dt,cut=false,rate=5){
  if(!camera)return;
  const k=!cameraReady||cut?1:1-Math.exp(-dt*rate);
  cameraEye.lerp(eye,k);cameraAim.lerp(target,k);cameraReady=true;
  camera.position.copy(cameraEye);camera.lookAt(cameraAim);camera.updateMatrixWorld(true);
 }
 function moveAnimals(name){
  const t=clock;
  const pondAngle=.25+Math.min(1.1,name==='swim'?age:name==='reveal'?0:1.1)*.92;
  const lift=name==='reveal'?-1.05*(1-Math.min(1,age/.68)) : 0;
  // One determined flutter clears the coping; his webbed feet do the rest.
  const hop=name==='flight'?Math.min(1,age/1.75):['swim','reveal'].includes(name)?0:1;
  const angle=T.MathUtils.lerp(pondAngle,.13,hop), radius=T.MathUtils.lerp(1.42,2.88,hop);
  const footLevel=T.MathUtils.lerp(fountain.y+.10,landing[0].y+.24,hop);
  loon.root.position.set(fountain.x+Math.cos(angle)*radius,footLevel+lift+Math.sin(hop*Math.PI)*1.18,fountain.z+Math.sin(angle)*radius);
  loon.root.rotation.y=T.MathUtils.lerp(-pondAngle,2.9-2*Math.PI,hop);
  squirrel.root.position.copy(fountain).add(vec(Math.sin(t*1.45)*1.65,lift+1.24+.32*Math.cos(t*2),1.3+.42*Math.cos(t*1.45)));
  squirrel.root.rotation.y=.48+1.06*Math.cos(t*1.45);
  const shimmer=.5+.5*Math.sin(t*6);
  water.emissive.setHSL(.80+.15*shimmer,.9,.46);water.emissiveIntensity=.75+.45*shimmer;
  light.color.copy(water.emissive);light.intensity=(22+11*shimmer)*Math.min(1,name==='reveal'?age*2:1);
 }
 function animateRun(dt){
  let all=true;
  for(const [i,a] of boarding.entries()){
   const distance=Math.max(0,(age-a.delay)*a.speed);
   a.done=distance>=a.length; a.root.visible=!a.done;
   if(a.done)continue;
   all=false;const progress=distance/a.length, p=a.route.getPointAt(progress), dir=a.route.getTangentAt(progress);
   a.root.position.copy(p);a.root.rotation.set(0,Math.atan2(dir.x,dir.z),0);
   if(i<4)a.root.position.y+=.09*Math.abs(Math.sin(clock*12+i));
   if(i===0&&player)player.runner.animate(clock,true,false,0,dt);
   if(i===1){show.christel.limbs[0].rotation.x=.55*Math.sin(clock*12);show.christel.limbs[2].rotation.x=-show.christel.limbs[0].rotation.x;}
   if(i===2)for(const {o,y,z,a,sign} of legs){
    const swing=sign*Math.sin(clock*12);o.position.y=y+.07*Math.max(0,swing);o.position.z=z+.14*swing;o.rotation.x=a+swing*.24;
   }
   if(i===3)al.pose(clock,true);
   if(a.root===squirrel.root)a.root.position.y+=.09*Math.sin(clock*5+i);
  }
  return all;
 }
 function doorShot(dt,camera){
  const entry=paths.exit.points.at(-1),offset=vec(-4.3,2.15,2.5).applyQuaternion(bus.group.quaternion);
  stageShot(camera,entry.clone().add(offset),entry.clone().add(vec(0,1.3,0)),dt);
 }
 const roadX=vec(1,0,0);
 function updateCrowd(crowd,dt,camera){
  for(const [i,c] of crowd.cast.entries()){
   const lane=i%3-1;
   if(c.hitAt===null){
    c.march=Math.min(4,(c.march??0)+dt*.98);
    const track=crowd.anchor+3.4-Math.floor(i/3)*3.1+(lane===0?.8:0)+c.march;
    const pose=road.pose(track);
    c.root.visible=true;c.root.position.copy(pose.position).addScaledVector(roadX.clone().applyQuaternion(pose.quaternion),lane*1.05);
    c.root.quaternion.copy(pose.quaternion);
    c.rig.animate(clock+i,true,false);if(camera)c.rig.lookAtCamera(camera,true);
    c.arm.rotation.z=c.handSide*(.3+.11*Math.sin(clock*5+i));
    if(c.sign){c.arm.rotation.x=0;c.sign.rotation.z=.1*Math.sin(clock*4+i);}
    if(bus.distance-track>bus.spec.length*.5)continue;
    c.hitAt=clock;c.setDead(true);
    if(c.sign){parent.attach(c.sign);c.signFrom.copy(c.sign.position);}
    c.impactPose=pose;c.impactPosition=c.root.position.clone();c.rig.animate(0,false,false);
    c.rig.head.quaternion.identity();
    c.rig.limbs.forEach((limb,j)=>{limb.rotation.z=(j<2?-1:1)*(j%2?.58:.28);});
   }
   const t=clock-c.hitAt,k=T.MathUtils.smoothstep(t,0,.20);
   // Lay the whole silhouette face up in the sloping plane of the driveway.
   c.root.quaternion.copy(c.impactPose.quaternion);
   c.root.rotateY((i%2?1:-1)*.11*k);c.root.rotateX(-Math.PI*.5*k);
   c.root.scale.set(c.size*(1+.08*k),c.size,c.size*(1-.91*k));
   c.root.position.copy(c.impactPosition);c.root.position.y+=.085*k;
   if(!c.sign)continue;
   const flight=Math.min(1.30,t),side=lane||((i%2)?1:-1);
   const toss=vec(side*2.8*flight,0,-1.5*flight).applyQuaternion(c.impactPose.quaternion);
   c.sign.position.copy(c.signFrom).add(toss);
   c.sign.position.y=Math.max(c.impactPosition.y+.11+toss.y,c.signFrom.y+3.9*flight-5.8*flight*flight+toss.y);
   c.sign.rotation.set(flight*3.5,i+.4*flight,side*flight*3.4);
  }
 }
 function departure(dt,camera,onCritic){
  if(bus.state==='closing'){doorShot(dt,camera);return;}
  const nearbyCrowd=crowds.find(c=>bus.distance<c.anchor+40&&bus.distance>c.anchor-(c===crowds[0]?23:30));
  if(nearbyCrowd===crowds[0]){
   const intro=bus.distance-nearbyCrowd.anchor>17,focus=nearbyCrowd.anchor+3;
   const eye=road.point(focus+(intro?7:-2.8));
   eye.y+=intro?2.85:8.8;
   const target=road.point(focus);target.y+=intro?1.18:.22;
   stageShot(camera,eye,target,dt,!nearbyCrowd.cast[0].root.visible);
  }else{
   const coach=bus.group.position,forward=vec(0,0,1).applyQuaternion(bus.group.quaternion);
   stageShot(camera,coach.clone().addScaledVector(forward,-5).add(vec(0,13,0)),coach.clone().addScaledVector(forward,3),dt);
  }
  for(const crowd of crowds){
   const lastHit=crowd.cast.at(-1).hitAt;
   if(bus.distance<crowd.anchor+40&&(lastHit===null||clock-lastHit<1.4))updateCrowd(crowd,dt,camera);
  }
  if(nearbyCrowd&&age>=nextShout){
   const standing=nearbyCrowd.cast.filter(c=>c.hitAt===null);
   if(standing.length)onCritic?.(standing[shoutIndex++%standing.length].root.position);
   nextShout=age+.48;
  }
  if(bus.state==='departed')finished=true;
 }
 function update(dt,camera,onCritic){
  if(step<0||finished)return;
  let [name,duration]=script[step];
  if(age>=duration){enter(step+1);[name,duration]=script[step];}
  age+=dt;clock+=dt;
  if(name!=='board'&&name!=='depart'){
   cast.player.group.position.copy(playerSpot);
   const attention=step>=2?fountain:players[1].position;
   cast.player.group.rotation.y=Math.atan2(attention.x-playerSpot.x,attention.z-playerSpot.z);
   const k=name==='jump'?Math.min(1,age/.99):1;
   players.forEach((p,i)=>{p.position.lerpVectors(stage[i],landing[i],k);p.position.y+=Math.sin(Math.PI*k)*1.15;});
   if(step>=3){moveAnimals(name);}
   if(name==='appear'){for(const {o,old} of fadeParts)o.material.opacity=old.opacity*Math.min(1,age/.85);}
   const reveal=['reveal','swim','flight'].includes(name);
   fov+=((name==='balcony'?BUS_ENDING_BALCONY.fov:BUS_ENDING_BALCONY.normalFov)-fov)*(1-Math.exp(-dt*5));
   if(name==='balcony'){
    // From in front of Alex, looking past him and up to the balcony.
    const shot=BUS_ENDING_BALCONY,alex=loon.root.position.clone().add(vec(0,.5,0)),her=hot.group.position.clone().add(vec(0,1.75,0));
    const away=alex.clone().sub(her).setY(0).normalize();
    stageShot(camera,alex.clone().addScaledVector(away,shot.back).add(vec(0,shot.rise,0)),alex.clone().lerp(her,shot.aim),dt);
    hot.faceToward(loon.root.position);
   }else if(name==='loon-pan'||name==='loon-reply'){
    const alex=loon.root.position;
    stageShot(camera,alex.clone().add(vec(1.1,1.1,-2.7)),alex.clone().add(vec(0,.64,0)),dt);
   }else if(reveal)stageShot(camera,fountain.clone().add(vec(3,2.6,4.9)),fountain.clone().add(vec(.3,1.05,.95)),dt);
   else{
    const target=name==='jump'?players[0].position.clone().lerp(players[1].position,.5):activeSpeaker?.group.position.clone()??al.group.position.clone();
    target.y+=name==='jump'?1.0:1.43;
    stageShot(camera,place(886,508,11.3),target,dt);
   }
  }else if(name==='board'){
   fov=BUS_ENDING_BALCONY.normalFov;
   const done=animateRun(dt),leader=boarding.find(a=>!a.done)??boarding[0],root=leader.root;
   const nearDoor=root.position.distanceTo(paths.exit.points.at(-1))<6;
   if(age<3.65){
    const alex=loon.root.position;
    stageShot(camera,alex.clone().add(vec(1.85,1.75,-1.55)),alex.clone().add(vec(0,.35,0)),dt);
   }else if(nearDoor){doorShot(dt,camera);}
   else{
    // Run ahead of the leader, looking back. Cut to the chase instead of
    // sweeping through the house, follow tightly enough to stay clear of the
    // runners, and keep the lens on the near side of any wall.
    const ahead=leader.route.getPointAt(Math.min(1,(Math.max(0,age-leader.delay)*leader.speed+4.6)/leader.length));
    const focus=root.position.clone().add(vec(0,1.1,0));
    let eye=ahead.add(vec(0,2.35,0));
    if(navigation?.clipCamera)eye=navigation.clipCamera(focus,eye);
    stageShot(camera,eye,focus,dt,chaseLeader!==leader,14);chaseLeader=leader;
   }
   if(done)enter(step+1);
  }else{
   for(const a of boarding)a.root.visible=false;
   departure(dt,camera,onCritic);
  }
  let loonMotion='standing';
  if(name==='loon-reply')loonMotion='talking';
  if(name==='swim'||name==='reveal')loonMotion='swimming';
  if(name==='flight'&&age<1.75)loonMotion='fluttering';
  if(name==='board'&&age>=boarding.at(-1).delay)loonMotion='running';
  animateAnimals(clock,loonMotion,camera);
  for(const [i,g] of show.glows.entries()){
   const performer=players[i];g.light.position.copy(performer.position).y+=1.45;g.aura.position.copy(performer.position).y+=1;
   g.aura.visible=performer.visible;if(!performer.visible)g.light.intensity=0;
  }
 }
 function reset(){
  if(step>=0){
   restoreAlMaterials();al.group.position.copy(alRest.p);al.group.quaternion.copy(alRest.q);al.label.visible=alRest.label;
   al.running=al.moving=al.scripted=false; al.speech=null;
   for(const [i,g] of show.glows.entries()){players[i].position.copy(stage[i]);players[i].visible=true;g.light.position.copy(lightHome[i]);g.aura.position.copy(auraHome[i]);g.aura.visible=true;}
   for(const {o,y,z,a} of legs){o.position.y=y;o.position.z=z;o.rotation.x=a;}
   show.christel.limbs[0].rotation.x=show.christel.limbs[2].rotation.x=0;
   bus.showParked();
  }
  if(activeSpeaker)activeSpeaker.speech=null;
  if(hotCalled){hot.waving=false;hot.speech=null;hotCalled=false;}
  fov=BUS_ENDING_BALCONY.normalFov;
  for(const c of critics){
   if(c.sign){c.arm.add(c.sign);c.sign.position.copy(c.hand);c.sign.rotation.set(0,0,0);c.sign.scale.setScalar(1);}
   c.root.visible=false;c.root.rotation.set(0,0,0);c.root.scale.setScalar(c.size);c.hitAt=null;c.march=0;c.setDead(false);
  }
  water.emissive.copy(waterEmission);water.emissiveIntensity=waterIntensity;light.intensity=0;
  loon.root.visible=squirrel.root.visible=beacon.visible=false;
  step=-1;age=clock=houseDim=0;finished=unlocked=cameraReady=false;activeSpeaker=null;boarding=[];
 }
 reset();
 return {beacon,unlock,tryStart,update,reset,advanceDialogue,actors:Object.values(cast),critics,loon,squirrel,
  updateDim(dt){if(unlocked)houseDim=Math.min(1,houseDim+dt/1.4);},
  get houseDim(){return houseDim;},get active(){return step>=0;},get unlocked(){return unlocked;},get finished(){return finished;},
  get phase(){return script[step]?.[0];},get fov(){return fov;},get speaker(){return activeSpeaker;}
 };
}

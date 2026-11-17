import {world,plan,s,ESTATE_MOVEMENT,MAIN_POOL,PATIO_FOUNTAIN,gardenHeight} from './beverly-layout.js';
import {createPartyGuestFactory} from './beverly-party-crowd.js';
import {createPursuitPaths} from './beverly-pursuit-paths.js';
import {createEscapeVisuals} from './beverly-escape-visuals.js';
import {createBusEnding} from './beverly-bus-ending.js';
import {RULES} from './core.js';

// Stabs per attacker in the capture ring: speed (radians a second), how far a
// lunge may carry them, and how close to Christel it stops.
export const CAPTURE_STAB=Object.freeze({rate:17,lunge:1.1,contact:.7});
export const ESCAPE_RULES=Object.freeze({announcement:"Well, that's a wrap!",announcementSeconds:3.2,rallySeconds:4.2,rallyPanSeconds:.7,headStartSeconds:9,rally:"That girl with dog dicks for hair just caused our main characters to die!  Get her!",captureSeconds:RULES.captureDuration,surroundRadius:7,panSpeed:ESTATE_MOVEMENT.run,tokenSpeed:ESTATE_MOVEMENT.run*1.5,tokenSwimSpeed:ESTATE_MOVEMENT.run*.3,tokenSwimLineSeconds:4,tokenSwimLine:"Next I'll join the women's swim team!",hunterSpeed:ESTATE_MOVEMENT.run*.75,drownSeconds:3,ghostRise:1,ghostHover:1,ghostDecision:.4,ghostExit:.45,angelChance:.5});
const HEAD_START_AT=ESCAPE_RULES.announcementSeconds+ESCAPE_RULES.rallySeconds;

export function createBeverlyEscape(T,model,navigation,{random=Math.random,onHeadStart,player,onCritic}={}){
 const group=new T.Group();group.name='Party escape and pool spirits';group.userData={dynamic:true,...ESCAPE_RULES};model.root.add(group);model.groups.Party_escape=group;
 const alternate=createBusEnding(T,model,player,navigation);
 const paths=createPursuitPaths(T,model,navigation),visuals=createEscapeVisuals(T,group),records=[];
 // Distance along Pan Man's escape route at each of its points.
 const pan=model.guests.panMan,originalPan={position:pan.group.position.clone(),quaternion:pan.group.quaternion.clone()};
 const replacements=[],factory=createPartyGuestFactory(T,model.materials);
 function standIn(original,name,index){const actor=factory({id:name,outfit:'none',color:0x292435,name,destination:'patio'},index);group.add(actor.group);actor.group.visible=false;replacements.push({original,actor});return actor;}
 const eater=standIn(model.churroTent.guest,'Churro tent stickman',21),drummer=standIn(model.performance.drummer.root,'Party drummer',22);
 const bartender={id:'bartender',speechName:'Bartender',group:model.performance.bartender.root,model:model.performance.bartender,pose:(t,moving)=>model.performance.bartender.animate(t,moving,false)};
 const cast=[...model.passengers.actors,...model.passengers.poolParty.actors,...model.filmCrew.actors,bartender,eater,drummer];
 function add(actor,hunter=true){
  const regular=!!actor.model,head=actor.head??actor.model?.head,body=actor.body??actor.model?.body??actor.group;
  if(!head)return;
  head.name=head.name||`${actor.group.name} escape head`;
  const localHeight=regular?2.25:actor.height??2.15;
  if(!actor.anchor){actor.anchor=new T.Object3D();actor.anchor.position.y=localHeight+.3;actor.group.add(actor.anchor);}
  actor.speechName??=actor.group.name;
  actor.group.updateWorldMatrix(true,true);const headHeight=actor.group.worldToLocal(head.getWorldPosition(new T.Vector3())).y;
  const faceParts=head.children.filter(o=>regular?o.position.z>.4&&(/face|expression/i.test(o.name)): /eye|lip|grin|mouth|brow/i.test(o.name));
  const normalFace=regular?faceParts.find(o=>/smile/i.test(o.name)):null;
  const drownSeconds=ESCAPE_RULES.drownSeconds;
  const r={actor,head,body,localHeight,headHeight,hunter,drownSeconds,faceParts,state:'idle',clock:0,route:[],routeIndex:0,repath:0,props:[],faces:visuals.faces(head,regular?.37:.195,regular?.442:.215,normalFace),timer:visuals.countdown(drownSeconds),ghost:null,slot:null,washed:false};
  if(hunter){
   r.knife=visuals.knife();r.props.push(r.knife);
   if(regular){actor.model.limbs[3].add(r.knife);r.knife.position.set(.51,-.05,.15);r.knife.rotation.z=-.2;}
   else actor.group.add(r.knife);
   if(!actor.drink){r.drink=visuals.drink();r.drink.visible=false;r.props.push(r.drink);if(regular){actor.model.limbs[1].add(r.drink);r.drink.position.set(-.5,-.07,.15);}else actor.group.add(r.drink);}
  }
  r.original=[];actor.group.traverse(o=>r.original.push({o,p:o.position.clone(),q:o.quaternion.clone(),s:o.scale.clone(),v:o.visible}));r.parent=actor.group.parent;
  model.drowningRemains.register(actor,{height:localHeight});records.push(r);return r;
 }
 for(const a of cast)add(a);
 // Named, non-player guests are vulnerable if they reach water too. Pan Man
 // is deliberately exempt; the controlled Christel keeps her swimming rules.
 add(model.guests.hotChick,false);
 const branHead=new T.Group();branHead.name='Bran escape expression anchor';branHead.position.set(0,1.7,.015);model.performance.branBody.add(branHead);
 const waterActors=[{id:'performing-christel',group:model.performance.christel.root,head:model.performance.christel.head,height:1.8},{id:'bran-man',group:model.performance.bran,head:branHead,height:2.12}];
 for(const a of waterActors)if(a.head)add(a,false);
 let active=false,elapsed=0,result=null,field=null,fieldClock=0,panIndex=0,panEscaped=false,sounds=[],phase='idle',rallyActor=null,introShot=null,capture=null;
 const up=new T.Vector3(0,1,0),p=new T.Vector3();
 function waterAt(position){
  const [u,v]=plan(position.x,position.z),water=navigation.waterAt(position.x,position.z);if(water)return water;
  if(Math.hypot(u-PATIO_FOUNTAIN.u,v-PATIO_FOUNTAIN.v)*s<PATIO_FOUNTAIN.innerRadius)return {id:'patio-fountain',surface:PATIO_FOUNTAIN.surface};
  if([459,741].some(cv=>Math.hypot(u-1058,v-cv)<21.5))return {id:'ornamental-fountain',surface:5.71};
  return null;
 }
 function slotFor(r){
  if(r.slot)return r.slot;
  const occupied=records.filter(a=>a!==r&&a.slot).map(a=>a.slot),candidates=[];
  for(let row=-1;row<=1;row++)for(let col=-5;col<=5;col++)candidates.push(new T.Vector3(...world(1508,601,MAIN_POOL.surface)).add(new T.Vector3(col*1.35,0,row*2.65)));
  candidates.sort((a,b)=>a.distanceToSquared(new T.Vector3(...world(1508,601,MAIN_POOL.surface)))-b.distanceToSquared(new T.Vector3(...world(1508,601,MAIN_POOL.surface))));
  r.slot=candidates.find(c=>occupied.every(q=>Math.abs(q.x-c.x)>1.1||Math.abs(q.z-c.z)>2.3))??candidates[records.indexOf(r)%candidates.length];return r.slot;
 }
 function enroll(r){
  const {actor:a}=r;if(r.state!=='idle'||!a.group.visible)return;
  r.state=r.hunter?(phase==='chasing'?'chasing':'waiting'):'watching';r.clock=0;a.escapeControlled=true;a.speech=null;a.scripted=true;a.group.userData.hostile=r.hunter&&phase==='chasing';
  if(r.hunter){
   // One crew member's idle pose is tucked partly beyond the patio edge.
   // Step into the closest walkable patch before joining the pursuit graph.
   if(!navigation.canStand(a.group.position.x,a.group.position.z)){
    const nearby=paths.nodes.filter(p=>p.distanceTo(a.group.position)<1).sort((p,q)=>p.distanceToSquared(a.group.position)-q.distanceToSquared(a.group.position));
    if(nearby[0])a.group.position.copy(nearby[0]);
   }
   if('hasDrink' in a){a.hasDrink=true;a.hasChurro=false;}
   for(const prop of r.props)prop.visible=true;
   r.knife.visible=phase==='chasing';
   if(a.camera){a.camera.visible=false;for(const arm of a.arms)for(const key of ['upper','fore','hand'])arm[key].visible=false;}
  }
 }
 function start({playerPosition,camera}={}){
  if(active)return false;active=true;elapsed=0;result=null;phase='announcement';capture=null;rallyActor=null;field=null;fieldClock=0;panIndex=0;panEscaped=false;
  pan.scripted=true;pan.escapeRunning=false;pan.escapeSwim=0;pan.group.visible=true;pan.speech={text:ESCAPE_RULES.announcement,remaining:ESCAPE_RULES.announcementSeconds};
  const audience=playerPosition??new T.Vector3(...world(924,639,8.15));pan.faceToward(audience);
  const target=pan.group.position.clone().add(new T.Vector3(0,1.9,0));
  const direction=audience.clone().sub(pan.group.position).setY(0).normalize();
  const eye=target.clone().addScaledVector(direction,6).add(new T.Vector3(0,.9,0));
  introShot={start:camera?.position.clone()??eye.clone(),aim:camera?camera.position.clone().addScaledVector(camera.getWorldDirection(new T.Vector3()),camera.position.distanceTo(target)):target.clone(),fov:camera?.fov??66,position:navigation.clipCamera(target,eye),target};
  model.maze.setExitActive(true);model.performance.shaker.visible=false;model.performance.bartender.escapeControlled=true;model.performance.drummer.escapeControlled=true;model.performance.drumsticks.forEach(o=>o.visible=false);model.churroTent.guest.userData.escapeControlled=true;
  for(const {original,actor} of replacements){original.updateWorldMatrix(true,true);actor.group.position.copy(original.getWorldPosition(new T.Vector3()));actor.group.quaternion.copy(original.getWorldQuaternion(new T.Quaternion()));actor.group.visible=true;original.visible=false;}
  for(const r of records)enroll(r);
  return true;
 }
 function beginRally(playerPosition){
  phase='accusation';pan.speech=null;rallyActor=bartender;
  bartender.speech={text:ESCAPE_RULES.rally,remaining:ESCAPE_RULES.rallySeconds};
  const d=playerPosition.clone().sub(bartender.group.position);bartender.group.rotation.y=Math.atan2(d.x,d.z);
 }
 function beginHeadStart(){
  phase='head-start';bartender.speech=null;onHeadStart?.();
 }
 function beginChase(){
  phase='chasing';
  // The second exit opens the moment the escape countdown ends and the chase begins.
  alternate.unlock();
  for(const r of records.filter(r=>r.state==='waiting')){r.state='chasing';r.actor.group.userData.hostile=true;r.knife.visible=true;}
  const d=records.find(r=>r.actor===drummer);if(d.state==='chasing'){d.state='jumping';d.jumpStart=drummer.group.position.clone();d.jumpEnd=new T.Vector3(...world(879,483,8.15));}
 }
 function beginCapture(playerPosition,camera){
  if(capture||result)return;
  phase='capture';pan.escapeRunning=false;
  if(rallyActor)rallyActor.speech=null;
  const near=records.filter(r=>r.hunter&&r.state==='chasing'&&r.actor.group.visible&&r.actor.group.position.distanceTo(playerPosition)<=ESCAPE_RULES.surroundRadius&&!navigation.blocked(r.actor.group.position,playerPosition));
  const angleOf=r=>Math.atan2(r.actor.group.position.x-playerPosition.x,r.actor.group.position.z-playerPosition.z);
  near.sort((a,b)=>angleOf(a)-angleOf(b));
  const radius=Math.max(1.5,near.length*.17),occupied=[];
  const target=playerPosition.clone().add(new T.Vector3(0,.6,0)),eye=camera?.position.clone()??target.clone().add(new T.Vector3(3,3,3));
  const away=eye.clone().sub(target).setY(0).normalize();if(away.lengthSq()<.1)away.set(1,0,1).normalize();
  capture={elapsed:0,position:playerPosition.clone(),target,startEye:eye,startAim:camera?eye.clone().addScaledVector(camera.getWorldDirection(new T.Vector3()),eye.distanceTo(target)):target.clone(),eye:navigation.clipCamera(target,target.clone().addScaledVector(away,4.6).add(new T.Vector3(0,3.2,0))),attackers:near.map((r,i)=>{
   const start=r.actor.group.position.clone(),angle=angleOf(near[0])+i/Math.max(1,near.length)*Math.PI*2;
   // Keep a full, evenly spaced ring on open ground. Beside walls, use the
   // nearest free arc of the circle rather than placing anyone through masonry.
   let end=null;
   for(let step=0;step<48&&!end;step++){
    const a=angle+(step%2?-1:1)*Math.ceil(step/2)*Math.PI/24;
    const candidate=playerPosition.clone().add(new T.Vector3(Math.sin(a)*radius,0,Math.cos(a)*radius));
    const h=navigation.surface(candidate.x,candidate.z);if(h===null)continue;candidate.y=h;
    if(navigation.canStand(candidate.x,candidate.z)&&!waterAt(candidate)&&occupied.every(p=>p.distanceTo(candidate)>.65)&&paths.clear(start,candidate))end=candidate;
   }
   end??=start.clone();occupied.push(end);
   return {r,start,end,delay:.12+i*.035};
  })};
  for(const {r} of capture.attackers){r.state='surrounding';r.actor.speech=null;r.knife.visible=true;}
  sounds.push('wrong');
 }
 function updateCapture(dt){
  if(!capture)return;capture.elapsed=Math.min(ESCAPE_RULES.captureSeconds,capture.elapsed+dt);
  for(const [index,{r,start,end,delay}] of capture.attackers.entries()){
   const a=r.actor,speed=a.id==='token-trans'?ESCAPE_RULES.tokenSpeed:ESCAPE_RULES.hunterSpeed;
   const t=T.MathUtils.clamp((capture.elapsed-delay)*speed/Math.max(.01,start.distanceTo(end)),0,1);
   pose(r,t<1);a.group.position.lerpVectors(start,end,t);
   a.group.position.y=navigation.surface(a.group.position.x,a.group.position.z)??start.y;
   const d=capture.position.clone().sub(a.group.position);a.group.rotation.set(0,Math.atan2(d.x,d.z),0);
   // Once in the ring everyone stabs, out of step with their neighbours: the
   // knife is drawn back overhead, then driven in with a lunge toward Christel.
   const stab=t<1?0:Math.max(0,Math.sin((capture.elapsed-delay)*CAPTURE_STAB.rate+index*2.1));
   if(stab>0){
    d.y=0;const reach=Math.min(CAPTURE_STAB.lunge,Math.max(0,d.length()-CAPTURE_STAB.contact));
    a.group.position.addScaledVector(d.normalize(),reach*stab);
   }
   if(a.model){a.model.limbs[1].rotation.x=-.45;a.model.limbs[3].rotation.x=t<1?-1.05:T.MathUtils.lerp(-2.6,-.85,stab);a.model.body.rotation.x=.38*stab;}
   else if(r.knife&&a.hands&&t>=1){r.knife.position.y+=.32*(1-stab);r.knife.position.z+=.12+.42*stab;r.knife.rotation.x=T.MathUtils.lerp(-.35,1.45,stab);}
  }
  if(capture.elapsed>=ESCAPE_RULES.captureSeconds){result='caught';phase='result';}
 }
 function cameraShot(){
  if(phase==='announcement'&&introShot){const t=T.MathUtils.smoothstep(elapsed,0,.8);return {position:introShot.start.clone().lerp(introShot.position,t),target:introShot.aim.clone().lerp(introShot.target,t),fov:T.MathUtils.lerp(introShot.fov,46,t)};}
  if(phase==='accusation'&&introShot){const t=T.MathUtils.smoothstep(elapsed-ESCAPE_RULES.announcementSeconds,0,ESCAPE_RULES.rallyPanSeconds);return {position:introShot.position.clone(),target:introShot.target.clone().lerp(bartender.model.head.getWorldPosition(new T.Vector3()),t),fov:46};}
  if(capture){const t=T.MathUtils.smoothstep(capture.elapsed,0,.85);return {position:capture.startEye.clone().lerp(capture.eye,t),target:capture.startAim.clone().lerp(capture.target,t),fov:66};}
  return null;
 }
 function pose(r,moving){
  const a=r.actor;if(a.pose)a.pose(elapsed*1.4,moving);else if(a.model)a.model.animate(elapsed,moving,false);
  if(r.drink)r.drink.visible=true;
  if(a.hands&&!a.model){r.knife?.position.copy(a.hands[1].position);r.knife?.rotation.set(0,0,0);r.drink?.position.copy(a.hands[0].position);}
  if(a.model&&!a.drink){a.model.limbs[1].rotation.x=-.45;a.model.limbs[3].rotation.x=-.6;}
 }
 function moveAlong(actor,route,index,budget,onStep){
  let i=index;
  while(i<route.length&&budget>1e-6){
   const target=route[i],delta=target.clone().sub(actor.group.position);delta.y=0;const distance=delta.length();
   if(distance<.035){i++;continue;}
   const step=Math.min(budget,distance,.12),next=actor.group.position.clone().addScaledVector(delta,step/distance);
   next.y=navigation.surface(next.x,next.z)??gardenHeight(plan(next.x,next.z)[0]);
   if(onStep?.(next)===false)break;
   actor.group.rotation.set(0,Math.atan2(delta.x,delta.z),0);actor.group.position.copy(next);budget-=step;if(step>=distance-.001)i++;
  }return i;
 }
 function enterWater(r,water){
  if(!['waiting','chasing','watching','jumping'].includes(r.state))return false;
  r.actor.speech=null;r.actor.label&&(r.actor.label.visible=false);r.clock=0;r.route=[];r.routeIndex=0;r.washed=water.id!==MAIN_POOL.id;
  r.state=r.washed?'washing':'drowning';r.water=water;r.entry=r.actor.group.position.clone();r.head.quaternion.identity();slotFor(r);
  if(!r.washed)beginPoolDrowning(r);
  else{
   const [u]=plan(r.entry.x,r.entry.z);r.flow=[];
   if(u<1016||water.id==='ornamental-fountain')r.flow.push(new T.Vector3(...world(1032,601,5.24)));
   for(const next of [1134,1166,1279,1316,1344,1385])if(next>u)r.flow.push(new T.Vector3(...world(next,601,(model.maze.waterAt(next,601)?.surface??gardenHeight(next)-.16))));
   r.flowIndex=0;
  }return true;
 }
 function beginPoolDrowning(r){
  r.state=r.actor.id==='token-trans'?'swimming':'drowning';r.clock=0;r.floatCenter=r.entry.clone();
  // Token Trans never drowns: he stays in the pool as its hazard.
  if(r.state==='swimming'){r.greeted=false;keepTokenInPool(r.floatCenter);}
  else r.timer.set(r.drownSeconds);
 }
 function keepTokenInPool(position){
  // Reserve room for the whole horizontal body, not merely its feet/root.
  const min=world(1396,560),max=world(1620,642);
  position.x=T.MathUtils.clamp(position.x,min[0],max[0]);position.z=T.MathUtils.clamp(position.z,min[2],max[2]);return position;
 }
 function makeDead(r,camera){
  r.state='dead';r.clock=0;r.timer.set(null);r.actor.speech=null;r.actor.group.rotation.set(-Math.PI/2,0,0);r.head.quaternion.identity();
  for(const part of r.faceParts)part.visible=false;
  for(const [kind,face] of Object.entries(r.faces))face.visible=kind==='dead';
  poseFloating(r);
  if(camera)r.head.lookAt(camera.position);
  model.drowningRemains.drown(r.actor,{bed:MAIN_POOL.bed,height:r.localHeight});
  r.ghost=visuals.spirit({...r.actor,head:r.head,localHeight:r.localHeight});r.ghost.start=r.ghost.root.position.clone();r.ghost.rotation=r.ghost.root.quaternion.clone();r.ghost.age=0;r.ghost.outcome=random()<ESCAPE_RULES.angelChance?'angel':'red';r.ghost.decided=false;r.ghost.finished=false;
 }
 function poseFloating(r){
  const scale=r.actor.group.scale.y,center=r.floatCenter.clone();center.y=MAIN_POOL.surface-.25+Math.sin(elapsed*1.6+records.indexOf(r))*.015;
  r.actor.group.position.copy(center).sub(new T.Vector3(0,r.localHeight*.44*scale,0).applyQuaternion(r.actor.group.quaternion));
 }
 function updateWater(r,dt,camera,playerPosition){
  if(r.state!=='swimming')r.clock+=dt;
  const a=r.actor,scale=a.group.scale.y;
  if(r.state==='washing'){
   let budget=dt*8;
   while(r.flowIndex<r.flow.length&&budget>0){const target=r.flow[r.flowIndex],d=target.clone().sub(r.entry),distance=d.length(),step=Math.min(budget,distance);if(distance>.001)r.entry.addScaledVector(d,step/distance);budget-=step;if(step>=distance-.001)r.flowIndex++;}
   const wet=waterAt(r.entry),surface=wet?.surface??r.entry.y;
   a.group.position.copy(r.entry);a.group.position.y=surface-r.localHeight*.74*scale+.10+Math.sin(elapsed*10)*.05;a.group.rotation.set(.28,Math.PI/2,Math.sin(elapsed*9)*.12);pose(r,true);
   if(wet?.id===MAIN_POOL.id||r.flowIndex>=r.flow.length)beginPoolDrowning(r);
  }
  if(r.state==='swimming'){
   const playerInPool=waterAt(playerPosition)?.id===MAIN_POOL.id;
   const target=playerInPool?keepTokenInPool(playerPosition.clone()):new T.Vector3(...world(1508,601,MAIN_POOL.surface));
   const d=target.sub(r.floatCenter).setY(0),distance=d.length();
   // Only the water boundary constrains this slow swimmer: submerged maze
   // walls do not stop him, and the head start stays safe.
   if(!result&&phase==='chasing'&&distance>.001){
    r.floatCenter.addScaledVector(d,Math.min(distance,dt*ESCAPE_RULES.tokenSwimSpeed)/distance);keepTokenInPool(r.floatCenter);
   }
   a.poseSwimming(elapsed);a.group.rotation.set(0,Math.atan2(d.x,d.z),0);a.group.rotateX(1.05);
   a.group.position.copy(r.floatCenter).sub(new T.Vector3(0,r.localHeight*.5*scale,0).applyQuaternion(a.group.quaternion));
   r.head.quaternion.identity();a.group.updateWorldMatrix(true,true);
   a.group.position.y+=MAIN_POOL.surface+.09+Math.sin(elapsed*5)*.035-r.head.getWorldPosition(p).y;
   if(camera)r.head.lookAt(camera.position);
   r.knife?.position.copy(a.hands[1].position);r.drink?.position.copy(a.hands[0].position);
   // He announces himself the first time Christel shares the pool.
   if(playerInPool&&!r.greeted){r.greeted=true;a.speech={text:ESCAPE_RULES.tokenSwimLine,remaining:ESCAPE_RULES.tokenSwimLineSeconds};}
   if(a.speech&&(a.speech.remaining-=dt)<=0)a.speech=null;
   if(!result&&phase==='chasing'&&playerInPool&&Math.hypot(r.floatCenter.x-playerPosition.x,r.floatCenter.z-playerPosition.z)<.62)beginCapture(playerPosition,camera);
  }
  if(r.state==='drowning'){
   r.timer.set(Math.max(1,Math.ceil(r.drownSeconds-r.clock-1e-8)));
   // Spread arrivals naturally along the current toward their reserved central
   // berth. There is room for every cast member without stacking their bodies.
   r.floatCenter.lerp(slotFor(r),Math.min(1,dt*.8));a.group.position.copy(r.floatCenter);a.group.position.y=MAIN_POOL.surface-r.headHeight*scale+.04+Math.sin(elapsed*9)*.045;a.group.rotation.set(0,0,0);pose(r,false);
   if(r.actor.model){r.actor.model.limbs[1].rotation.z=-.7+Math.sin(elapsed*13)*.25;r.actor.model.limbs[3].rotation.z=.7-Math.sin(elapsed*13)*.25;}
   r.head.quaternion.identity();if(camera)r.head.lookAt(camera.position);
   if(r.clock+1e-8>=r.drownSeconds)makeDead(r,camera);
  }else if(r.state==='dead'){
   r.floatCenter.lerp(slotFor(r),Math.min(1,dt*.6));poseFloating(r);
   const remains=model.drowningRemains.records.get(a);if(remains.state!=='body'){a.group.visible=false;r.state='skeleton';}
  }
  if(r.state==='dead'&&camera)r.head.lookAt(camera.position);
  if(r.state==='swimming'){
   const anchor=r.head.getWorldPosition(new T.Vector3()).add(new T.Vector3(0,1.05,0));a.group.updateWorldMatrix(true,false);a.anchor.position.copy(a.group.worldToLocal(anchor));
  }
  if(r.timer.group.visible){r.head.getWorldPosition(p);r.timer.group.position.copy(p).add(new T.Vector3(0,.65,0));if(camera)r.timer.group.quaternion.copy(camera.quaternion);}
 }
 function updateGhost(r,dt,camera){
  const g=r.ghost;if(!g||g.finished)return;g.age+=dt;
  const rise=Math.min(1,g.age/ESCAPE_RULES.ghostRise),ease=1-(1-rise)**3;
  // Raise the head end 30 degrees above horizontal, matching the main cast.
  const tilt=Math.PI/6,q=new T.Quaternion().setFromEuler(new T.Euler(Math.PI/2-tilt,0,0));g.root.quaternion.copy(g.rotation).slerp(q,ease);g.root.position.copy(g.start);g.root.position.y+=3*ease;
  g.wings.rotation.x=tilt; // Preserve the readable feather-facing orientation.
  if(camera){g.head.updateWorldMatrix(true,false);g.head.lookAt(camera.position);}
  const decision=ESCAPE_RULES.ghostRise+ESCAPE_RULES.ghostHover;
  if(g.age>=decision&&!g.decided){g.decided=true;sounds.push(g.outcome==='angel'?'correct':'wrong');
   if(g.outcome==='angel')g.wings.visible=g.halo.visible=true;
   else{for(const m of g.materials){if(m.color.getHSL({}).l>.15)m.color.set(0xff454d);if(m.emissive)m.emissive.set(0x9c071c);}g.expressions.happy.visible=false;g.expressions.scared.visible=true;}
  }
  const leave=(g.age-decision-ESCAPE_RULES.ghostDecision)/ESCAPE_RULES.ghostExit;
  if(leave>0){g.root.position.y+=(g.outcome==='angel'?14:-10)*leave*leave;for(const m of g.materials)m.opacity=.5*(1-Math.min(1,leave));}
  if(leave>=1){g.root.visible=false;g.finished=true;}
 }
 function separateFloaters(){
  const floating=records.filter(r=>r.floatCenter&&['dead','drowning'].includes(r.state));
  // Soft elliptical footprints leave space for a horizontal body, including
  // hats. Resolve the drift itself, not just the eventual reserved berths.
  for(let pass=0;pass<4;pass++)for(let i=0;i<floating.length;i++)for(let j=i+1;j<floating.length;j++){
   const a=floating[i],b=floating[j],dx=(b.floatCenter.x-a.floatCenter.x)/1.22,dz=(b.floatCenter.z-a.floatCenter.z)/2.4,d=Math.hypot(dx,dz);
   if(d>=1)continue;
   const nx=d>1e-5?dx/d:(i%2?1:-1),nz=d>1e-5?dz/d:0,push=(1-d)*.5;
   a.floatCenter.x-=nx*push*1.22;b.floatCenter.x+=nx*push*1.22;a.floatCenter.z-=nz*push*2.4;b.floatCenter.z+=nz*push*2.4;
  }
  for(const r of floating){r.floatCenter.x=T.MathUtils.clamp(r.floatCenter.x,world(1380,601)[0],world(1630,601)[0]);r.floatCenter.z=T.MathUtils.clamp(r.floatCenter.z,world(1508,558)[2],world(1508,644)[2]);
   if(r.state==='dead')poseFloating(r);else{r.actor.group.position.x=r.floatCenter.x;r.actor.group.position.z=r.floatCenter.z;}
  }
 }
 function countdownDigit(){
  const remaining=HEAD_START_AT+ESCAPE_RULES.headStartSeconds-elapsed;
  if(phase==='head-start')return Math.max(1,Math.min(ESCAPE_RULES.headStartSeconds,Math.ceil(remaining-1e-8)));
  if((phase==='chasing'||phase==='capture')&&remaining>-.65)return 0;
  return null;
 }
 function update(dt,{playerPosition,camera,playing=true}={}){
  if(!active||!playing||!playerPosition)return;dt=Math.max(0,Math.min(dt,.1));if(!dt)return;
  alternate.updateDim(dt);
  if(phase==='chasing'&&alternate.tryStart(playerPosition,camera))phase='bus-ending';
  if(phase==='bus-ending'){
   alternate.update(dt,camera,onCritic);
   if(alternate.finished){result='bus-escaped';phase='result';}
   return;
  }
  const previousDigit=countdownDigit();elapsed+=dt;
  if(phase==='announcement'&&elapsed+1e-8>=ESCAPE_RULES.announcementSeconds)beginRally(playerPosition);
  if(phase==='accusation'&&elapsed+1e-8>=HEAD_START_AT)beginHeadStart();
  if(phase==='head-start'&&elapsed+1e-8>=HEAD_START_AT+ESCAPE_RULES.headStartSeconds)beginChase();
  const digit=countdownDigit();
  if(digit!==null&&digit!==previousDigit)sounds.push(digit===0?'cash-register':'maze-tick');
  if(pan.speech){pan.speech.remaining-=dt;if(pan.speech.remaining<=0)pan.speech=null;}
  if(rallyActor?.speech){rallyActor.speech.remaining-=dt;if(rallyActor.speech.remaining<=0)rallyActor.speech=null;}
  // Pan Man shows the way through the maze. He sets off when Christel is
  // released and runs it at her running speed without stopping to wait for her.
  if(!result&&phase!=='capture'&&elapsed>=HEAD_START_AT&&!panEscaped){
   pan.escapeRunning=true;panIndex=moveAlong(pan,paths.panRoute,panIndex,ESCAPE_RULES.panSpeed*dt);
   const wet=waterAt(pan.group.position),swimming=wet?.id===MAIN_POOL.id;
   pan.escapeSwim=T.MathUtils.lerp(pan.escapeSwim??0,swimming?1:0,1-Math.exp(-dt*12));
   const swimHeight=MAIN_POOL.surface-1.69+Math.sin(elapsed*7)*.025;
   pan.group.position.y=T.MathUtils.lerp(pan.group.position.y,swimHeight,pan.escapeSwim);
   if(panIndex>=paths.panRoute.length){panEscaped=true;pan.escapeRunning=false;pan.escapeSwim=0;pan.group.visible=false;}
  }
  if(phase==='chasing'){
   fieldClock-=dt;if(fieldClock<=0){field=paths.field(playerPosition);fieldClock=.55;}
  }
  for(const r of records){
   enroll(r);
   if(r.state==='jumping'&&phase==='chasing'){
    r.clock+=dt;const t=Math.min(1,r.clock/1.3);r.actor.group.position.lerpVectors(r.jumpStart,r.jumpEnd,t);r.actor.group.position.y+=Math.sin(t*Math.PI)*1.1;pose(r,true);if(t===1){r.state='chasing';r.clock=0;}
   }
   if(['waiting','chasing','watching'].includes(r.state)){
    const water=waterAt(r.actor.group.position);if(water)enterWater(r,water);
   }
   if(r.state==='waiting')pose(r,false);
   if(!result&&phase==='chasing'&&r.state==='chasing'&&field){
    r.repath-=dt;if(r.repath<=0||r.routeIndex>=r.route.length){r.route=paths.route(r.actor.group.position,field);r.routeIndex=0;r.repath=.85;}
    const speed=r.actor.id==='token-trans'?ESCAPE_RULES.tokenSpeed:ESCAPE_RULES.hunterSpeed;
    r.routeIndex=moveAlong(r.actor,r.route,r.routeIndex,speed*dt,next=>{
     const water=waterAt(next);if(water){r.actor.group.position.copy(next);enterWater(r,water);return false;}
     if(navigation.blocked(r.actor.group.position,next))return false;return true;
    });
    if(r.state==='chasing'){pose(r,true);if(camera&&r.actor.model)r.actor.model.lookAtCamera(camera,false);
     if(r.actor.group.position.distanceTo(playerPosition)<.62&&!navigation.blocked(r.actor.group.position,playerPosition))beginCapture(playerPosition,camera);}
   }
   if(['washing','drowning','swimming','dead'].includes(r.state))updateWater(r,dt,camera,playerPosition);
   updateGhost(r,dt,camera);
  }
  if(phase==='accusation'&&camera)bartender.model.lookAtCamera(camera,false);
  if(phase==='capture')updateCapture(dt);
  separateFloaters();
  if(!result&&['head-start','chasing'].includes(phase)&&playerPosition.distanceTo(model.maze.exit.position)<1.1){result='escaped';phase='result';}
 }
 function reset(){
  // Restore visibility before applying the saved pre-chase poses; otherwise a
  // drowned stand-in could be resurrected at the origin by the next story reset.
  alternate.reset();model.drowningRemains.reset();model.maze.setExitActive(false);
  for(const r of records){r.ghost?.dispose();r.ghost=null;r.timer.set(null);r.state='idle';r.clock=r.repath=0;r.slot=null;r.floatCenter=null;r.route=[];r.actor.speech=null;r.actor.escapeControlled=false;r.actor.scripted=false;r.actor.group.userData.hostile=false;
   r.parent.add(r.actor.group);for(const {o,p,q,s,v} of r.original){o.position.copy(p);o.quaternion.copy(q);o.scale.copy(s);o.visible=v;}}
  for(const {original,actor} of replacements){original.visible=true;actor.group.visible=false;}
  model.performance.bartender.escapeControlled=model.performance.drummer.escapeControlled=false;model.performance.shaker.visible=true;model.performance.drumsticks.forEach(o=>o.visible=true);model.churroTent.guest.userData.escapeControlled=false;
  pan.escapeRunning=false;pan.escapeSwim=0;pan.scripted=false;pan.speech=null;pan.group.visible=true;pan.group.position.copy(originalPan.position);pan.group.quaternion.copy(originalPan.quaternion);
  active=false;elapsed=0;result=null;phase='idle';capture=null;introShot=null;rallyActor=null;field=null;panEscaped=false;sounds=[];
 }
 return {group,alternate,records,paths,start,update,reset,waterAt,enterWater,cameraShot,consumeSounds(){const out=sounds;sounds=[];return out;},get active(){return active;},get result(){return result;},get phase(){return phase;},get locked(){return phase==='bus-ending'||phase==='announcement'||phase==='accusation'||phase==='capture'||!!result;},get countdownDigit(){return countdownDigit();},get headStartRemaining(){return phase==='head-start'?T.MathUtils.clamp(ESCAPE_RULES.headStartSeconds-(elapsed-HEAD_START_AT),0,ESCAPE_RULES.headStartSeconds):0;},get speaker(){if(alternate.active)return alternate.speaker??[];return phase==='announcement'?pan:rallyActor?.speech?rallyActor:null;},get capture(){return capture;},get elapsed(){return elapsed;},get panEscaped(){return panEscaped;},snapshot(){return {active,phase,result,panEscaped,elapsed,cast:records.map(r=>({name:r.actor.group.name,state:r.state,countdown:r.timer.value,ghost:r.ghost?.outcome??null,position:r.actor.group.position.toArray()}))};}};
}

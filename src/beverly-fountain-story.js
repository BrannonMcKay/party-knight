import {world,LEVELS,PATIO_FOUNTAIN} from './beverly-layout.js';
import {buildAlex} from './beverly-alex.js';
import {buildEmily} from './beverly-emily.js';
import {Font} from '../vendor/FontLoader.js';
import fontData from '../vendor/beverly-font.js';

export const FOUNTAIN_LINES=Object.freeze({
 opening:"Have you seen my roommate, Alex?  He won't read my script or pay attention to me, and he is suffering from severe schizophrenic hallucinations.",
 alexArrival:'Emily!',emilySurprise:'Alex!?',
 revelation:"Emily, I was wrong!  It turns out Al Pacino isn't even real!",
 alFarewell:"Alex, if you can see me right now it means you're still schizophrenic.  Good luck, buddy!",
 doubt:"I still hope that hot chick was real though, but I'm not sure...",
 balcony:'Hey baby!',
 alexLove:"Anyway, I want to live happily ever after with you now!  I love you!  I'll read your script!",
 emilyLove:"I love you too!  Your severe mental issues don't need to be addressed!",
 fall:"I like to get in the tub to show the ladies I'm serious!  But this fountain will do!  This one's for you, baby!",
 swim:"Al Pacino forgot to teach me how to swim!",
 rescue:"I'll help you out of there!",together:'Together forever!',horror:'nooooo!!!!'
});
export const FOUNTAIN_PLACES=Object.freeze({emily:[884,639,LEVELS.patio],alex:[914,636,LEVELS.patio],al:[921,486,LEVELS.patio],balcony:[915,750,11.87]});
export const FOUNTAIN_ARRIVAL=[[839,550,8.15],[849,550,8.15],[949,550,8.15],[949,610,8.15],[942,636,8.15],FOUNTAIN_PLACES.alex];
export const FOUNTAIN_TIMING={cameraPan:1.15,fall:.75,drown:3,alexWaterSpeech:1.55,alexSpeechLinger:1,rescueWaterSpeech:2,ghostRise:1,reach:1,buzzer:.45,drop:.30,reward:.50,horror:.70,ascent:.40};
const SPIRIT_PITCH=Math.PI/6;

export function buildFountainStory(T,root,groups,guests,readingSeconds,drowningRemains){
 const group=new T.Group();group.name='Fountain_story_effects';group.userData={dynamic:true,dialogue:FOUNTAIN_LINES};root.add(group);groups.Fountain_story_effects=group;
 const {alex,emily,alPacino,hotChick,panMan}=guests,actors=[alex,emily,alPacino,hotChick,panMan];
 const point=p=>new T.Vector3(...world(...p)),center=point([PATIO_FOUNTAIN.u,PATIO_FOUNTAIN.v,PATIO_FOUNTAIN.surface]);
 const spirits=[buildAlex(T,group,{},{}),buildEmily(T,group,{},{})];
 const materialSets=spirits.map((spirit,i)=>{
  spirit.group.name=(i?'Emily':'Alex')+' translucent spirit';
  const set=new Set();spirit.group.traverse(o=>{if(!o.isMesh)return;o.castShadow=o.receiveShadow=false;o.renderOrder=6;for(const m of Array.isArray(o.material)?o.material:[o.material])set.add(m);});
  for(const m of set){
   const dark=m.color.getHSL({}).l<.2,face=m.name.startsWith('Story expression');
   m.transparent=true;m.opacity=face?.96:dark?.68:.43;m.depthWrite=false;m.userData.spiritColor=m.color.clone();m.userData.spiritOpacity=m.opacity;
   if(m.emissive){m.emissive.set(0x86ccff);m.emissiveIntensity=dark?.04:.4;}
  }
  return set;
 });
 // The halo and individual feathers stay attached to Emily's spirit as she rises.
 const wings=new T.Group();wings.name='Emily spirit wings';spirits[1].body.add(wings);
 // Counter the body's tilt so the feather faces remain toward the audience.
 wings.position.set(0,.38,-.18);wings.rotation.x=-Math.PI/2+SPIRIT_PITCH;
 const featherMat=new T.MeshBasicMaterial({color:0xecf7ff,transparent:true,opacity:.75,depthWrite:false,side:T.DoubleSide});
 for(const sign of [-1,1])for(let i=0;i<8;i++){
  const feather=new T.Mesh(new T.SphereGeometry(1,10,8),featherMat);feather.name='Soft angel wing feather';
  feather.position.set(sign*(.20+i*.075),.25-i*.035,0);feather.scale.set(.11,.29-i*.008,.035);feather.rotation.z=-sign*(.15+i*.10);wings.add(feather);
 }
 const halo=new T.Mesh(new T.TorusGeometry(.245,.022,8,40),new T.MeshBasicMaterial({color:0xffdf6c,transparent:true,opacity:.92,depthWrite:false}));halo.name='Emily golden halo';halo.position.set(0,.36,0);halo.rotation.x=Math.PI/2-.32;spirits[1].head.add(halo);
 const splashes=[alex,emily].map((actor,i)=>{
  const g=new T.Group();g.name=actor.speechName+' fountain splash';group.add(g);
  const material=new T.MeshBasicMaterial({color:0xd7f8ff,transparent:true,opacity:.6,depthWrite:false});
  const ring=new T.Mesh(new T.TorusGeometry(.40,.023,5,32),material);ring.rotation.x=-Math.PI/2;g.add(ring);
  const drops=Array.from({length:10},()=>{const m=new T.Mesh(new T.SphereGeometry(.035,6,4),material);g.add(m);return m;});
  return {group:g,ring,drops,material};
 });
 // Both layers use the transparent pass: an opaque digit would otherwise be
 // drawn before its translucent badge, regardless of their renderOrder.
 const countdownFont=new Font(fontData),countdownInk=new T.MeshBasicMaterial({color:0xffeb91,transparent:true,depthTest:false,depthWrite:false,toneMapped:false});
 const timers=[alex,emily].map(actor=>{
  const g=new T.Group();g.name=actor.speechName+' drowning countdown';group.add(g);
  const disk=new T.Mesh(new T.CircleGeometry(.28,32),new T.MeshBasicMaterial({color:0x172437,transparent:true,opacity:.90,depthTest:false,depthWrite:false,toneMapped:false}));disk.renderOrder=12;g.add(disk);
  const digits=[1,2,3].map(value=>{const geo=new T.ShapeGeometry(countdownFont.generateShapes(String(value),.36));geo.computeBoundingBox();const middle=geo.boundingBox.getCenter(new T.Vector3());geo.translate(-middle.x,-middle.y,.01);const mesh=new T.Mesh(geo,countdownInk);mesh.name=actor.speechName+' countdown '+value;mesh.renderOrder=13;g.add(mesh);return mesh;});
  return {group:g,disk,digits,value:null};
 });
 let phase='idle',phaseTime=0,time=0,caption=null,focus=emily,stage=0,player=null,path=null,sounds=[],fadeMaterials=[],hiddenLabels=[],waterSince=[null,null],fallStarts=[null,null],ghostStarts=[null,null],done=false;
 const emilyReactionFacing=new T.Quaternion();
 let lastCameraView=null,barCameraStart=null,fountainCameraStart=null;
 const fountainCamera=()=>player.clone().add(new T.Vector3(1.65,3.35,1.55));
 const spiritCenter=()=>center.clone().add(new T.Vector3(0,3.15,1.3));
 function spiritBasis(){
  const forward=fountainCamera().sub(spiritCenter()).setY(0).normalize(),up=new T.Vector3(0,1,0);
  const y=forward.clone().multiplyScalar(Math.cos(SPIRIT_PITCH)).addScaledVector(up,Math.sin(SPIRIT_PITCH));
  const z=forward.clone().multiplyScalar(Math.sin(SPIRIT_PITCH)).addScaledVector(up,-Math.cos(SPIRIT_PITCH));
  return {x:y.clone().cross(z),y,z};
 }
 drowningRemains.register(alex,{height:1.96});drowningRemains.register(emily,{height:2.13});
 const wet=[alex,emily],splashPlaces=[center.clone().add(new T.Vector3(.9,0,1.20)),center.clone().add(new T.Vector3(-.9,0,1.05))];
 function control(actor){actor.scripted=true;actor.wandering=false;actor.moving=actor.running=false;actor.speech=null;}
 function place(actor,p){actor.setPosition(point(p));actor.group.visible=true;}
 // Alex's last line stays up for a moment under Emily's reply, so it can be
 // read without delaying her fall: both must be in the water together.
 let linger=null;
 function clearSpeech(){caption=null;linger=null;for(const actor of [...actors,...spirits])actor.speech=null;}
 function speak(speakers,text,duration=readingSeconds(text)){clearSpeech();const cast=Array.isArray(speakers)?speakers:[speakers];caption={actor:cast[0],actors:cast,text,duration};for(const actor of cast)actor.speech={text,remaining:duration,story:true};focus=cast[0];}
 function advanceDialogue(){
  if(!caption||caption.advanceRequested)return false;
  caption.advanceRequested=true;caption.advanceAt=phaseTime;
  for(const actor of caption.actors)actor.speech=null;
  return true;
 }
 function restoreFade(){for(const [mesh,original,clone] of fadeMaterials){mesh.material=original;clone.dispose();}fadeMaterials=[];}
 function restoreLabels(){for(const [label,visible] of hiddenLabels)label.visible=visible;hiddenLabels=[];}
 function prepareFade(){
  restoreFade();alPacino.group.traverse(mesh=>{if(!mesh.isMesh)return;const original=mesh.material,clone=original.clone();clone.transparent=true;clone.depthWrite=false;mesh.material=clone;fadeMaterials.push([mesh,original,clone]);});
 }
 function startFall(i){
  if(i===0)fountainCameraStart=lastCameraView??{position:player.clone().add(new T.Vector3(0,2.2,2.5)),target:cameraTarget(),fov:66};
  const a=wet[i];fallStarts[i]={time,position:a.group.position.clone(),rotation:a.group.quaternion.clone()};a.waterPose='falling';a.expression='joyful';a.moving=false;
 }
 function enterWater(i){
  waterSince[i]=time;wet[i].waterPose='struggling';wet[i].label.visible=false;
  wet[i].group.rotation.set(0,0,0);wet[i].faceToward(player);fallStarts[i].rotation.copy(wet[i].group.quaternion);
  splashes[i].group.position.copy(splashPlaces[i]);
 }
 function floatingPose(actor,i,age){
  const amount=T.MathUtils.smoothstep(age,FOUNTAIN_TIMING.drown,FOUNTAIN_TIMING.drown+.25),q=new T.Quaternion().setFromEuler(new T.Euler(-Math.PI/2,0,i?-.06:.06));
  const start=splashPlaces[i].clone();start.y=PATIO_FOUNTAIN.surface-(i?1.865:1.693)+.09;
  const corpseCenter=center.clone().add(new T.Vector3(i?-.87:.87,-.26+Math.sin(time*1.4+i)*.012,.62));
  const corpseRoot=corpseCenter.sub(new T.Vector3(0,1,0).applyQuaternion(q));
  actor.group.position.copy(start).lerp(corpseRoot,amount);actor.group.quaternion.copy(fallStarts[i].rotation).slerp(q,amount);
 }
 function animateWater(){
  for(let i=0;i<2;i++){
   const a=wet[i],fall=fallStarts[i];if(!fall)continue;
   if(waterSince[i]===null){
    const t=Math.min(1,(time-fall.time)/FOUNTAIN_TIMING.fall),target=splashPlaces[i].clone();target.y=PATIO_FOUNTAIN.surface-(i?1.865:1.693)+.09;
    a.group.position.copy(fall.position).lerp(target,t);a.group.position.y+=Math.sin(t*Math.PI)*1.75;
    a.group.quaternion.copy(fall.rotation).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),(i?.5:-1.4)*Math.sin(t*Math.PI)));
    if(t>=1)enterWater(i);
   }
   if(waterSince[i]!==null){
    const age=time-waterSince[i];
    const timer=timers[i];timer.value=age<FOUNTAIN_TIMING.drown?Math.ceil(FOUNTAIN_TIMING.drown-age):null;timer.group.visible=timer.value!==null;timer.digits.forEach((digit,j)=>digit.visible=j+1===timer.value);
    if(age<FOUNTAIN_TIMING.drown){a.waterPose='struggling';a.expression='joyful';a.group.position.copy(splashPlaces[i]);a.group.position.y=PATIO_FOUNTAIN.surface-(i?1.865:1.693)+.09+Math.sin(time*8+i)*.055;a.group.quaternion.copy(fall.rotation);}
    else{a.waterPose='floating';a.expression='dead';floatingPose(a,i,age);drowningRemains.drown(a,{bed:PATIO_FOUNTAIN.bed});if(!ghostStarts[i])launchSpirit(i);}
    const splash=splashes[i],t=Math.min(1,age/1.1);splash.group.visible=age<1.1;splash.ring.scale.setScalar(.6+t*2);splash.material.opacity=.6*(1-t);
    splash.drops.forEach((drop,j)=>{const angle=j*Math.PI/5;drop.position.set(Math.cos(angle)*t*.7,Math.sin(t*Math.PI)*(.25+(j%3)*.13),Math.sin(angle)*t*.7);});
   }
  }
 }
 function ghostPose(i,rise=1){
  const ghost=spirits[i],start=ghostStarts[i],t=T.MathUtils.clamp(rise,0,1),ease=1-(1-t)**3;
  // Float side by side with their heads raised 30 degrees toward the audience.
  const {x,y,z}=spiritBasis();
  const targetQ=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(x,y,z));
  const q=start.quaternion.clone().slerp(targetQ,T.MathUtils.smoothstep(t,0,1));
  const targetCenter=spiritCenter().addScaledVector(x,i?-.60:.60);
  const c=start.center.clone().lerp(targetCenter,ease);
  ghost.group.position.copy(c).sub(new T.Vector3(0,1,0).applyQuaternion(q));ghost.group.quaternion.copy(q);ghost.spiritProgress=t;
 }
 function launchSpirit(i){
  // Each soul leaves at its own three-second death, with no wait for the
  // partner or the later skeleton replacement. Start at the body's exact pose.
  const body=wet[i],a=spirits[i];
  sounds.push('audience-aww');
  ghostStarts[i]={time,position:body.group.position.clone(),quaternion:body.group.quaternion.clone(),center:new T.Vector3(0,1,0).applyQuaternion(body.group.quaternion).add(body.group.position)};
  const {y,z}=spiritBasis(),joinedHands=spiritCenter().addScaledVector(y,.50).addScaledVector(z,.16);
  a.group.position.copy(body.group.position);a.group.quaternion.copy(body.group.quaternion);a.group.scale.copy(body.group.scale);a.spiritProgress=0;a.spiritHandTarget=joinedHands;a.spiritHoldingHand=i;a.spiritReachDirection=null;a.expression='joyful';a.group.visible=true;ghostPose(i,0);
 }
 function reset(){
  restoreFade();restoreLabels();phase='idle';phaseTime=time=stage=0;caption=null;focus=emily;path=null;player=null;sounds=[];done=false;waterSince=[null,null];fallStarts=[null,null];ghostStarts=[null,null];lastCameraView=barCameraStart=fountainCameraStart=null;
  for(const a of actors){a.waving=false;a.waterPose=null;}
  splashes.forEach(s=>s.group.visible=false);
  timers.forEach(t=>{t.group.visible=false;t.value=null;});
  spirits.forEach((a,i)=>{a.reset();control(a);a.expression='joyful';a.waterPose='spirit';a.spiritProgress=0;a.spiritHandTarget=null;a.spiritReachDirection=null;a.label.visible=false;a.group.visible=false;if(a.drink)a.drink.visible=false;if(a.ticket)a.ticket.visible=false;if(i===0)a.afterBath=true;for(const m of materialSets[i]){m.color.copy(m.userData.spiritColor);m.opacity=m.userData.spiritOpacity;if(m.emissive)m.emissive.set(0x86ccff);}});
  wings.visible=halo.visible=false;
 }
 function prepare(){
  reset();for(const a of actors)control(a);
  place(emily,FOUNTAIN_PLACES.emily);emily.expression=null;
  alex.group.visible=alPacino.group.visible=false;
 }
 const stages=[
  {key:'fountain-emily',actor:emily,text:FOUNTAIN_LINES.opening,enter(){emily.group.rotation.set(0,0,0);emily.faceToward(player);},tick(){emily.faceToward(player);}},
  {key:'fountain-alex-arrives',duration:1,enter(){place(alex,FOUNTAIN_ARRIVAL[0]);alex.afterBath=true;alex.expression='distressed';alex.drink.visible=alex.ticket.visible=false;alex.moving=alex.running=true;path={points:FOUNTAIN_ARRIVAL.map(point),index:0};},ready:()=>!path},
  {key:'fountain-alex-emily',actor:alex,text:FOUNTAIN_LINES.alexArrival,enter(){alex.faceToward(emily.group.position);emily.expression='excited';emily.faceToward(player);}},
  {key:'fountain-emily-surprised',actor:emily,text:FOUNTAIN_LINES.emilySurprise,minDuration:1.05,enter(){emilyReactionFacing.copy(emily.group.quaternion);},tick(){
   // Let Christel see the delighted reaction before Emily turns to Alex.
   const delta=alex.group.position.clone().sub(emily.group.position);
   const target=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.atan2(delta.x,delta.z));
   emily.group.quaternion.copy(emilyReactionFacing).slerp(target,T.MathUtils.smoothstep(phaseTime,.60,1.05));
  }},
  {key:'fountain-revelation',actor:alex,text:FOUNTAIN_LINES.revelation},
  {key:'fountain-bar',actor:alPacino,text:FOUNTAIN_LINES.alFarewell,minDuration:FOUNTAIN_TIMING.cameraPan,enter(){barCameraStart=lastCameraView??{position:player.clone().add(new T.Vector3(0,2.2,2.5)),target:cameraTarget(),fov:66};place(alPacino,FOUNTAIN_PLACES.al);alPacino.faceToward(alex.group.position);panMan.faceToward(alPacino.group.position);alPacino.waving=true;prepareFade();},tick(){
   const normalFade=t=>1-T.MathUtils.smoothstep(t,caption.duration*.4,caption.duration);
   const opacity=caption.advanceRequested?normalFade(caption.advanceAt)*(1-T.MathUtils.smoothstep(phaseTime,caption.advanceAt,Math.max(FOUNTAIN_TIMING.cameraPan,caption.advanceAt+.25))):normalFade(phaseTime);
   for(const [,original,m] of fadeMaterials)m.opacity=original.opacity*opacity;
  },ready:()=>!caption.advanceRequested||phaseTime>=caption.advanceAt+.25},
  {key:'fountain-doubt',actor:alex,text:FOUNTAIN_LINES.doubt,minDuration:FOUNTAIN_TIMING.cameraPan,enter(){alPacino.group.visible=false;alPacino.waving=false;restoreFade();}},
  {key:'fountain-balcony',actor:hotChick,text:FOUNTAIN_LINES.balcony,enter(){
   place(hotChick,FOUNTAIN_PLACES.balcony);hotChick.moving=false;hotChick.waving=true;hotChick.faceToward(alex.group.position);
   hiddenLabels=actors.filter(a=>a!==hotChick).map(a=>[a.label,a.label.visible]);for(const [label] of hiddenLabels)label.visible=false;
  }},
  {key:'fountain-alex-love',actor:alex,text:FOUNTAIN_LINES.alexLove,enter(){hotChick.waving=false;alex.expression='happy';alex.faceToward(emily.group.position);}},
  {key:'fountain-emily-love',actor:emily,text:FOUNTAIN_LINES.emilyLove,enter(){alex.expression=emily.expression='joyful';}},
  {key:'fountain-fall-promise',actor:alex,text:FOUNTAIN_LINES.fall,enter(){alex.faceToward(player);}},
  {key:'fountain-alex-fall',actor:alex,text:FOUNTAIN_LINES.swim,duration:FOUNTAIN_TIMING.fall+FOUNTAIN_TIMING.alexWaterSpeech,ready:()=>waterSince[0]!==null,enter(){startFall(0);}},
  {key:'fountain-rescue',actor:emily,text:FOUNTAIN_LINES.rescue,duration:.45+FOUNTAIN_TIMING.fall+FOUNTAIN_TIMING.rescueWaterSpeech,minDuration:.45,enter(){emily.expression='distressed';emily.faceToward(center);},spoken(){alex.speech={text:FOUNTAIN_LINES.swim,remaining:FOUNTAIN_TIMING.alexSpeechLinger,story:true};caption.actors.push(alex);linger={actor:alex,remaining:FOUNTAIN_TIMING.alexSpeechLinger};},tick(){if(phaseTime>=.45&&!fallStarts[1])startFall(1);},ready:()=>waterSince[1]!==null&&time-waterSince[1]>=FOUNTAIN_TIMING.rescueWaterSpeech},
  {key:'fountain-drowning',duration:0,ready:()=>ghostStarts.every(Boolean)},
  {key:'fountain-spirits-rise',duration:0,ready:()=>ghostStarts.every(start=>start&&time-start.time>=FOUNTAIN_TIMING.ghostRise)},
  {key:'fountain-spirits-reach',actor:spirits,text:FOUNTAIN_LINES.together,duration:FOUNTAIN_TIMING.reach},
  {key:'fountain-wrong-answer',duration:FOUNTAIN_TIMING.buzzer,enter(){sounds.push('wrong');spirits[0].expression='horrified';for(const m of materialSets[0]){const face=m.name.startsWith('Story expression');if(!face){if(m.color.getHSL({}).l>.2)m.color.set(0xff3c45);if(m.emissive)m.emissive.set(0xea1227);}m.opacity=face?.96:.65;}}},
  {key:'fountain-alex-descends',duration:FOUNTAIN_TIMING.drop,enter(){spirits.forEach(a=>a.spiritHandTarget=null);spirits[0].spiritReachDirection=new T.Vector3(0,1,0);},tick(){ghostPose(0);const t=phaseTime/FOUNTAIN_TIMING.drop;spirits[0].group.position.y-=12*t*t;for(const m of materialSets[0])m.opacity=(m.name.startsWith('Story expression')?.96:.65)*(1-T.MathUtils.smoothstep(t,.4,1));}},
  {key:'fountain-emily-reward',duration:FOUNTAIN_TIMING.reward,enter(){spirits[0].group.visible=false;wings.visible=halo.visible=true;sounds.push('correct');}},
  {key:'fountain-emily-horror',actor:spirits[1],text:FOUNTAIN_LINES.horror,duration:FOUNTAIN_TIMING.horror,enter(){spirits[1].expression='horrified';spirits[1].spiritReachDirection=new T.Vector3(0,-1,0);}},
  {key:'fountain-emily-ascends',duration:FOUNTAIN_TIMING.ascent,tick(){ghostPose(1);const t=phaseTime/FOUNTAIN_TIMING.ascent;spirits[1].group.position.y+=18*t*t;for(const m of materialSets[1])m.opacity=m.userData.spiritOpacity*(1-T.MathUtils.smoothstep(t,.5,1));}},
  {key:'fountain-complete',duration:Infinity,enter(){spirits.forEach(a=>a.group.visible=false);panMan.scripted=false;done=true;}}
 ];
 function enter(index){clearSpeech();restoreLabels();stage=index;phaseTime=0;const s=stages[index];phase=s.key;s.enter?.();if(s.text)speak(s.actor,s.text,s.duration);s.spoken?.();}
 function start(position){player=position.clone();control(emily);control(alex);control(alPacino);control(hotChick);control(panMan);enter(0);}
 function moveAlex(dt){
  if(!path)return;let travel=dt*6.8;
  while(path&&travel>0){const target=path.points[path.index],delta=target.clone().sub(alex.group.position),distance=delta.length();if(distance>.001){alex.faceToward(target);alex.group.position.addScaledVector(delta,Math.min(1,travel/distance));}travel-=distance;
   if(alex.group.position.distanceTo(target)<.001){path.index++;if(path.index===path.points.length){path=null;alex.moving=alex.running=false;}}else break;
  }
 }
 function update(dt){
  if(phase==='idle')return;time+=dt;phaseTime+=dt;moveAlex(dt);animateWater();
  for(let i=0;i<2;i++)if(ghostStarts[i]&&spirits[i].spiritProgress<1)ghostPose(i,(time-ghostStarts[i].time)/FOUNTAIN_TIMING.ghostRise);
  if(caption)for(const actor of caption.actors)if(actor.speech)actor.speech.remaining=Math.max(0,actor.speech.remaining-dt);
  if(linger&&(linger.remaining-=dt)<=0){linger.actor.speech=null;if(caption)caption.actors=caption.actors.filter(a=>a!==linger.actor);linger=null;}
  const s=stages[stage];s.tick?.();
  // Space ends a reading hold, never the physical action or its world clock.
  if((caption?.advanceRequested||phaseTime>=(caption?.duration??s.duration??0))&&phaseTime>=(s.minDuration??0)&&(!s.ready||s.ready()))enter(stage+1);
 }
 function afterActors(dt,camera){
  timers.forEach((timer,i)=>{if(!timer.group.visible)return;timer.group.position.copy(wet[i].head.getWorldPosition(new T.Vector3())).add(new T.Vector3(0,.52,0));if(camera)timer.group.quaternion.copy(camera.quaternion);});
  // Address Alex across the patio, keeping Al's face visible throughout the pan.
  if(phase==='fountain-bar')alPacino.head.lookAt(camera?.position??alex.head.getWorldPosition(new T.Vector3()));
  if(phase==='fountain-balcony'){
   hotChick.faceToward(alex.group.position);hotChick.body.rotation.y=0;
   hotChick.head.lookAt(camera?.position??player.clone().add(new T.Vector3(0,1.7,0)));
  }
  // The opening is addressed to Christel; idle upper-body/head motion must not
  // turn Emily away before Alex calls to her in the following exchange.
  if(phase==='fountain-emily'||phase==='fountain-alex-emily')emily.faceToward(player);
  if(['fountain-emily','fountain-alex-emily','fountain-emily-surprised'].includes(phase)){emily.body.rotation.y=0;emily.head.rotation.y=0;}
  for(const a of spirits)if(a.group.visible){
   a.update(dt,camera);
   const original=a.head.quaternion.clone();a.head.lookAt(camera?.position??fountainCamera());
   a.head.quaternion.slerpQuaternions(original,a.head.quaternion.clone(),a.spiritProgress);
  }
  // Spirit speech anchors stay above their heads throughout the tilted pose.
  for(const a of spirits){a.head.updateWorldMatrix(true,false);const head=a.head.getWorldPosition(new T.Vector3()).add(new T.Vector3(0,.45,0));a.group.updateWorldMatrix(true,false);a.anchor.position.copy(a.group.worldToLocal(head));}
  if(camera&&player){const distance=camera.position.distanceTo(cameraTarget());lastCameraView={position:camera.position.clone(),target:camera.position.clone().addScaledVector(camera.getWorldDirection(new T.Vector3()),distance),fov:camera.fov};}
 }
 function cameraTarget(){
  if(['fountain-emily','fountain-alex-emily','fountain-emily-surprised'].includes(phase))return emily.group.position.clone().add(new T.Vector3(0,1.7,0));
  if(phase==='fountain-balcony')return hotChick.group.position.clone().add(new T.Vector3(0,2.2,0));
  if(fallStarts[0]){
   const target=center.clone().add(new T.Vector3(0,.35,.6));
   const firstGhost=ghostStarts.filter(Boolean).reduce((first,start)=>Math.min(first,start.time),Infinity);
   // Keep the shoulder camera in place and smoothly tip its aim up with the
   // first rising ghost; never switch targets on a stage boundary.
   const rise=T.MathUtils.smoothstep(time-firstGhost,0,FOUNTAIN_TIMING.ghostRise+.4);
   return target.lerp(center.clone().add(new T.Vector3(0,2.8,1.3)),rise);
  }
  return emily.group.position.clone().lerp(alex.group.visible?alex.group.position:point(FOUNTAIN_PLACES.alex),.5).add(new T.Vector3(0,1.6,0));
 }
 reset();
 return {group,spirits,wings,halo,timers,prepare,start,reset,update,afterActors,cameraTarget,advanceDialogue,
  get phase(){return phase;},get caption(){return caption;},get done(){return done;},
  cameraShot(){
   if((phase==='fountain-bar'||phase==='fountain-doubt')&&barCameraStart){
    const t=T.MathUtils.smoothstep(phaseTime,0,FOUNTAIN_TIMING.cameraPan),amount=phase==='fountain-bar'?t:1-t;
    // Pan and zoom from Christel's area, lifting just enough to clear the bowls.
    const overlook=barCameraStart.position.clone().add(new T.Vector3(1.5,1.8,0));
    return {position:barCameraStart.position.clone().lerp(overlook,amount),target:barCameraStart.target.clone().lerp(point([929,477,9.3]),amount),fov:T.MathUtils.lerp(barCameraStart.fov,24,amount)};
   }
   // Ease from the actual previous view to the clearer shoulder view. Use the
   // fall's clock so Emily's rescue dialogue (including Space) cannot restart it.
   if(fallStarts[0]&&!done){
    const amount=T.MathUtils.smoothstep(time-fallStarts[0].time,0,FOUNTAIN_TIMING.cameraPan);
    return {position:fountainCameraStart.position.clone().lerp(fountainCamera(),amount),target:fountainCameraStart.target.clone().lerp(cameraTarget(),amount),fov:T.MathUtils.lerp(fountainCameraStart.fov,66,amount)};
   }
   return null;
  },
  consumeSounds(){const events=sounds;sounds=[];return events;},
  snapshot(){return {phase,done,waterSince:[...waterSince],ghostSince:ghostStarts.map(start=>start?.time??null),countdowns:timers.map(t=>t.value),spirits:spirits.map(a=>({visible:a.group.visible,expression:a.expression}))};}
 };
}

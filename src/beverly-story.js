import {buildFountainStory,FOUNTAIN_PLACES} from './beverly-fountain-story.js';
import {world,plan,LEVELS,gardenHeight,darkRoomHeight} from './beverly-layout.js';

export const STORY_LINES=Object.freeze({
 invitation:"I'm looking for an aloof stranger who will get into a bathtub with me.  Preferably a confused film student with minimal apparent redeeming qualities. Have you seen one?",
 introduction:"Who me? Wanna wipe down with my dad's old handkerchief?  Where am I?",
 bath:"Come with me!  It's time to scrub a dub dub, big boy!",
 clean:'That was amazing, and I feel nice and clean now.',
 theatre:"Nice party, huh?  I'd like to watch movies in my secret basement theatre with a freshly bathed young man.  Have you seen one?",
 ticket:'Does your basement theatre have Dolby Atmos? I have this movie ticket!',
 farewell:'Right this way, my boy!  I have much to teach you!',
 // The churro tent's seated stickman, once Al and Alex have left for the theatre.
 // The same stickman, if Christel visits before the first blue hoop.
 churroEarly:'The party is just starting.  Come back later if you want to eat a churro and chill.',
 churro:"Wanna go somewhere private to eat a churro?  How about if we go to Al Pacino's secret basement theater?"
});
export const STORY_MARKS=Object.freeze({
 first:[1028,665,LEVELS.upperGarden],second:[715,783,LEVELS.darkRoom],third:[894,672,LEVELS.patio]
});
export const STORY_PLACES=Object.freeze({
 al:[687,824,LEVELS.darkRoom],alex:[737,865,LEVELS.darkRoom],emily:FOUNTAIN_PLACES.emily,balcony:[915,777,11.87]
});
// Grounded paths follow the south terrace stairs and the one open gallery door.
export const STORY_ROUTES=Object.freeze({
 arrive:[[943,731],[946,705],[963,692],[1000,688],[1030,694],[1084,694],[1084,652]],
 hotExit:[[1076,657],[1062,694],[1026,694],[978,694],[947,694],[949,647],[949,550],[849,550],[839,582],[795,582]],
 alexExit:[[1090,655],[1090,698],[1030,700],[1026,700],[978,700],[938,700],[938,647],[942,647],[942,544],[842,544],[839,582],[795,582]],
 meetAl:[[731,850,7.64],[723,828,7.64],[712,822,7.64]],
 alExit:[[685,804,7.64],[688,779,7.64],[697,747,7.64],[717,740,7.64],[717,701,8.15],[704,675,8.15]],
 alexTheatreExit:[[708,816,7.64],[702,802,7.64],[699,773,7.64],[710,747,7.64],[728,740,7.64],[728,701,8.15],[719,675,8.15]]
});
export const readingSeconds=text=>Math.max(4.25,(2.2+text.trim().split(/\s+/).length/2.7)*.85)*2/3;
export const AL_ENTRANCE_DELAY=readingSeconds(STORY_LINES.theatre)*.7;
export function storyPoint(T,[u,v,y]){
 if(y===undefined)y=u>=968&&u<=1020?gardenHeight(u):u>1020?LEVELS.upperGarden:LEVELS.patio;
 return new T.Vector3(...world(u,v,y));
}

// Where the purple theatre hoop sits, in the churro tent's own frame: on the
// floor mat in front of the table, facing the seated stickman.
export const CHURRO_INVITE_SPOT=Object.freeze([.75,.05,1.0]);

export function buildBeverlyStory(T,root,groups,guests,drowningRemains,churroTent=null){
 const group=new T.Group();group.name='Story_stand_spots';group.userData.dynamic=true;root.add(group);groups.Story_stand_spots=group;
 const spots={};
 function hoop(name,position,color=0x3195ff,core=0x1687ff){
  const spot=new T.Group();spot.name=name;spot.position.copy(position);spot.position.y+=.045;group.add(spot);
  const ink=new T.MeshBasicMaterial({color,transparent:true,opacity:.55,depthWrite:false,toneMapped:false});
  const ring=new T.Mesh(new T.TorusGeometry(.53,.09,8,36),ink);ring.rotation.x=-Math.PI/2;ring.position.y=.085;spot.add(ring);
  // Match the other boards' 64 m exit column: narrow core, broad cylindrical glow.
  const beam=new T.Mesh(new T.CylinderGeometry(.36,.36,64,8),new T.MeshBasicMaterial({color:core,transparent:true,opacity:.36,depthWrite:false,toneMapped:false}));beam.position.y=32;spot.add(beam);
  const glow=new T.Mesh(new T.CylinderGeometry(1.2,1.2,64,24,1,true),new T.MeshBasicMaterial({color,transparent:true,opacity:.05,side:T.DoubleSide,depthWrite:false,toneMapped:false}));glow.position.y=32;spot.add(glow);
  return {group:spot,ring,beam,glow};
 }
 for(const [key,position] of Object.entries(STORY_MARKS))spots[key]=hoop(`Blue story hoop ${key}`,storyPoint(T,position));
 // An optional detour: a purple hoop in the churro tent, where the seated
 // stickman invites Christel to Al Pacino's basement theatre. It appears once
 // Al and Alex have left for the theatre and never blocks the way to Emily.
 const churroPoint=churroTent?new T.Vector3(...CHURRO_INVITE_SPOT).applyEuler(churroTent.eater.rotation).add(churroTent.eater.position):null;
 const churroSpot=churroTent?hoop('Purple theatre hoop',churroPoint,0xa64dff,0x8a2bff):null;
 const churroAnchor=new T.Object3D();churroAnchor.position.set(0,.34,0);churroTent?.head.add(churroAnchor);
 const churroSpeaker=churroTent?{id:'churro-stickman',speechName:'Churro stickman',group:churroTent.guest,anchor:churroAnchor,speech:null}:null;
 // 'off' | 'ready' (hoop showing) | 'asking' (his line) | 'menu' (the game shows the film menu)
 let invite='off',inviteTime=0;
 // Before the story starts he just says to come back later, each time she walks up.
 const EARLY_RADIUS=2.6;let earlyNear=false,earlyTime=0;
 const showInvite=on=>{if(churroSpot)churroSpot.group.visible=on;};
 // Keep the light count constant. Hiding lights with the hoop would force all
 // lit scenery materials to compile again at every scene transition.
 const cueLight=new T.PointLight(0x69bcff,12,12,2);group.add(cueLight);
 // The wooden-room cue leaves a soft pool of blue light while its scene runs.
 const roomLight=new T.PointLight(0x91caff,0,12,2);roomLight.position.copy(storyPoint(T,[709,814,10.2]));group.add(roomLight);
 const finale=buildFountainStory(T,root,groups,guests,readingSeconds,drowningRemains);
 const {alex,emily,hotChick,alPacino}=guests,actors=[alex,emily,hotChick,alPacino];
 const invitationEyeLine=new T.Vector3();
 let phase='first-ready',time=0,phaseTime=0,caption=null,focus=null,locked=false,paths=new Map(),balconyTime=0,secondArrivalStarted=false;
 const point=p=>storyPoint(T,p),markerPoint=key=>point(STORY_MARKS[key]);
 function place(actor,p){actor.setPosition(point(p));actor.group.visible=true;actor.moving=actor.running=false;}
 function control(actor){actor.scripted=true;actor.wandering=false;actor.speech=null;}
 function speak(actor,text){
  for(const a of actors)if(a.scripted)a.speech=null;
  const duration=readingSeconds(text);actor.speech={text,remaining:duration,story:true};caption={actor,text,duration};focus=actor;return duration;
 }
 function go(actor,route,speed=6.8){
  actor.moving=actor.running=true;
  paths.set(actor,{points:route.map(point),index:0,speed});
 }
 function moveActors(dt){
  for(const [actor,path] of paths){
   let budget=dt*path.speed;
   while(budget>0&&path.index<path.points.length){
    const target=path.points[path.index],delta=target.clone().sub(actor.group.position),distance=delta.length();
    if(distance<.001){path.index++;continue;}
    actor.faceToward(target);actor.group.position.addScaledVector(delta,Math.min(1,budget/distance));budget-=distance;
    // Match the actual continuous walking ramp, not a chord through its steps.
    const [u,v]=plan(actor.group.position.x,actor.group.position.z);
    if(u>=947&&v>=662&&v<=708)actor.group.position.y=gardenHeight(u);
    if(phase==='theatre-leaving'){
     actor.group.position.y=darkRoomHeight(u,v);
    }
    if(budget>=0)path.index++;
   }
   if(path.index>=path.points.length){paths.delete(actor);actor.moving=actor.running=false;}
  }
 }
 function enter(next){phase=next;phaseTime=0;}
 function clearDialogue(){caption=null;for(const a of actors)if(a.scripted)a.speech=null;}
 function advanceDialogue(){
  if(!locked)return false;
  if(phase==='fountain')return finale.advanceDialogue();
  if(!caption||caption.advanceRequested)return false;
  caption.advanceRequested=true;caption.actor.speech=null;return true;
 }
 function showMarker(key){
  for(const [id,spot] of Object.entries(spots))spot.group.visible=id===key;
  cueLight.intensity=key==='second'?65:key?12:0;
  if(key)cueLight.position.copy(markerPoint(key)).add(new T.Vector3(0,1.3,0));
 }
 function faceChristel(){
  hotChick.faceToward(invitationEyeLine);hotChick.body.rotation.y=0;
  hotChick.head.lookAt(invitationEyeLine);
 }
 function startFirst(player){
  locked=true;showMarker(null);control(alex);control(hotChick);if(churroSpeaker)churroSpeaker.speech=null;
  invitationEyeLine.copy(player);invitationEyeLine.y+=1.65;faceChristel();
  enter('invitation');speak(hotChick,STORY_LINES.invitation);alex.drink.visible=false;go(alex,STORY_ROUTES.arrive);
 }
 function prepareSecond(){
  paths.clear();clearDialogue();hotChick.group.visible=false;control(alPacino);
  place(alPacino,STORY_PLACES.al);alPacino.faceToward(markerPoint('second'));
  place(alex,STORY_PLACES.alex);alex.afterBath=true;alex.expression='happy';alex.faceToward(markerPoint('second'));alex.scripted=false;
  locked=false;focus=null;roomLight.intensity=18;showMarker('second');enter('second-ready');
 }
 function startSecond(player){
  locked=true;showMarker(null);roomLight.intensity=72;control(alPacino);control(alex);alPacino.faceToward(player);
  enter('theatre-invitation');speak(alPacino,STORY_LINES.theatre);secondArrivalStarted=false;alex.ticket.visible=true;alex.drink.visible=false;
  place(emily,STORY_PLACES.emily);emily.faceToward(markerPoint('third'));
  control(hotChick);place(hotChick,STORY_PLACES.balcony);balconyTime=0;
 }
 function prepareThird(){
  paths.clear();clearDialogue();finale.prepare();
  control(hotChick);place(hotChick,FOUNTAIN_PLACES.balcony);balconyTime=0;
  emily.faceToward(markerPoint('third'));enter('third-ready');locked=false;focus=null;roomLight.intensity=18;showMarker('third');
  invite=churroSpot?'ready':'off';showInvite(invite==='ready');
 }
 function endInvite(){
  if(churroSpeaker)churroSpeaker.speech=null;
  if(invite==='asking'||invite==='menu'){caption=null;locked=false;}
  invite='off';showInvite(false);earlyNear=false;earlyTime=0;
 }
 function reset(){
  drowningRemains.reset();finale.reset();guests.reset();paths.clear();time=phaseTime=balconyTime=0;caption=focus=null;locked=false;phase='first-ready';roomLight.intensity=0;showMarker('first');endInvite();
 }
 function update(dt,{playerPosition=null,active=false}={}){
  dt=Math.min(.1,Math.max(0,dt));time+=dt;
  for(const spot of churroSpot?[...Object.values(spots),churroSpot]:Object.values(spots)){spot.ring.material.opacity=.46+Math.sin(time*1.7)*.09;spot.beam.material.opacity=.34+Math.sin(time*1.4)*.02;spot.glow.material.opacity=.046+Math.sin(time*1.4)*.004;}
  if(!active)return;
  drowningRemains.update(dt);
  if(phase==='fountain'){finale.update(dt);locked=!finale.done;return;}
  phaseTime+=dt;moveActors(dt);
  if(churroSpeaker&&phase==='first-ready'){
   const near=!!playerPosition&&Math.abs(playerPosition.y-churroPoint.y)<.8&&Math.hypot(playerPosition.x-churroPoint.x,playerPosition.z-churroPoint.z)<EARLY_RADIUS;
   if(near&&!earlyNear){churroSpeaker.speech={text:STORY_LINES.churroEarly};earlyTime=readingSeconds(STORY_LINES.churroEarly);}
   earlyNear=near;
   if(churroSpeaker.speech){earlyTime-=dt;if(!near||earlyTime<=0)churroSpeaker.speech=null;}
  }
  if(invite==='ready'&&phase==='third-ready'&&playerPosition&&Math.abs(playerPosition.y-churroPoint.y)<.6&&Math.hypot(playerPosition.x-churroPoint.x,playerPosition.z-churroPoint.z)<.61){
   invite='asking';inviteTime=0;locked=true;showInvite(false);speak(churroSpeaker,STORY_LINES.churro);focus=null;
  }else if(invite==='asking'){
   inviteTime+=dt;
   if(caption.advanceRequested||inviteTime>=caption.duration){churroSpeaker.speech=null;caption=null;invite='menu';}
  }
  if(invite==='asking'||invite==='menu')return;
  if(phase==='invitation'&&playerPosition){invitationEyeLine.copy(playerPosition);invitationEyeLine.y+=1.65;}
  if(phase==='theatre-invitation'&&!secondArrivalStarted&&(phaseTime>=AL_ENTRANCE_DELAY||caption?.advanceRequested)){secondArrivalStarted=true;go(alex,STORY_ROUTES.meetAl);}
  if(caption?.actor.speech)caption.actor.speech.remaining=Math.max(0,caption.actor.speech.remaining-dt);
  const dialogueFinished=caption&&(caption.advanceRequested||phaseTime>=caption.duration);
  if(phase==='first-ready'||phase==='second-ready'||phase==='third-ready'){
   const key=phase==='first-ready'?'first':phase==='second-ready'?'second':'third',p=markerPoint(key);
   if(playerPosition&&Math.abs(playerPosition.y-p.y)<.4&&Math.hypot(playerPosition.x-p.x,playerPosition.z-p.z)<.61){
    if(key==='first')startFirst(playerPosition);else if(key==='second')startSecond(playerPosition);else{endInvite();locked=true;showMarker(null);enter('fountain');finale.start(playerPosition);}
   }
  }else if(phase==='invitation'&&dialogueFinished&&!paths.has(alex)){
   hotChick.faceToward(alex.group.position);alex.faceToward(hotChick.group.position);enter('alex-introduction');speak(alex,STORY_LINES.introduction);
  }else if(phase==='alex-introduction'&&dialogueFinished){enter('bath-invitation');speak(hotChick,STORY_LINES.bath);}
  else if(phase==='bath-invitation'&&dialogueFinished){clearDialogue();alex.expression='happy';enter('happy');focus=alex;}
  else if(phase==='happy'&&phaseTime>=1.4){enter('bath-leaving');go(hotChick,STORY_ROUTES.hotExit);go(alex,STORY_ROUTES.alexExit,6.55);focus=hotChick;}
  else if(phase==='bath-leaving'){
   for(const a of [alex,hotChick])if(!paths.has(a))a.group.visible=false;
   if(paths.size===0)prepareSecond();
  }else if(phase==='theatre-invitation'&&secondArrivalStarted&&dialogueFinished&&!paths.has(alex)){
   alPacino.faceToward(alex.group.position);
   // Open Alex's stance toward Christel so she can see the face of his ticket.
   const towardAl=alPacino.group.position.clone().sub(alex.group.position).normalize();
   const towardChristel=(playerPosition??markerPoint('second')).clone().sub(alex.group.position).normalize();
   alex.faceToward(alex.group.position.clone().add(towardAl.lerp(towardChristel,.5)));
   enter('alex-ticket');speak(alex,STORY_LINES.ticket);
  }else if(phase==='alex-ticket'&&dialogueFinished){enter('theatre-reply');speak(alPacino,STORY_LINES.farewell);}
  else if(phase==='theatre-reply'&&dialogueFinished){clearDialogue();enter('theatre-leaving');go(alPacino,STORY_ROUTES.alExit,5.8);go(alex,STORY_ROUTES.alexTheatreExit,6.0);focus=alPacino;}
  else if(phase==='theatre-leaving'){
   for(const a of [alex,alPacino])if(!paths.has(a))a.group.visible=false;
   if(paths.size===0)prepareThird();
  }
  if(['theatre-invitation','alex-ticket','theatre-reply','theatre-leaving','third-ready'].includes(phase)){
   balconyTime+=dt;const stride=Math.sin(balconyTime*.65),forward=Math.cos(balconyTime*.65)>0;
   if(phase==='third-ready'){
    const [u,v,y]=FOUNTAIN_PLACES.balcony;hotChick.group.position.copy(point([u+stride*3,v,y]));hotChick.group.rotation.y=forward?Math.PI/2:-Math.PI/2;
   }else{hotChick.group.position.copy(point([915,777+17*stride,11.87]));hotChick.group.rotation.y=forward?0:Math.PI;}
   hotChick.moving=true;hotChick.running=false;
  }
 }
 function cameraTarget(){
  if(phase==='fountain'&&locked)return finale.cameraTarget();
  if(invite==='asking'||invite==='menu')return churroAnchor.getWorldPosition(new T.Vector3());
  if(!locked||!focus)return null;
  // Keep the speaker and approaching actor in the same view when together.
  const p=focus.group.position.clone().add(new T.Vector3(0,2.05,0));
  if(phase==='invitation')return p;
  const companion=focus===hotChick?alex:focus===alex?(phase.startsWith('alex-t')?alPacino:hotChick):alex;
  if(companion.group.visible&&companion.group.position.distanceTo(focus.group.position)<4)p.lerp(companion.group.position.clone().add(new T.Vector3(0,2.05,0)),.3);
  return p;
 }
 reset();
 return {group,spots,roomLight,finale,update,reset,cameraTarget,advanceDialogue,
  cameraShot(){return phase==='fountain'?finale.cameraShot():null;},
  afterActors(dt,camera){
   if(phase==='invitation')faceChristel();
   finale.afterActors(dt,camera);
  },
  consumeSounds(){return finale.consumeSounds();},
  get phase(){return phase==='fountain'?finale.phase:phase;},get locked(){return locked;},get caption(){return phase==='fountain'?finale.caption:caption;},
  get marker(){return phase==='first-ready'?'first':phase==='second-ready'?'second':phase==='third-ready'?'third':null;},
  // Review shortcuts still require physically entering the hoop to trigger.
  prepareSecond(){reset();prepareSecond();},
  prepareThird(){reset();prepareThird();},
  markerPosition(key){return key==='theatre'?churroPoint.clone():markerPoint(key);},
  // The film menu is the game's to show; it reports back when Christel is done.
  churroSpeaker,get invite(){return invite;},get theatreMenu(){return invite==='menu';},
  closeTheatreMenu(){endInvite();},
  snapshot(){return {phase:this.phase,locked,marker:this.marker,caption:this.caption?.text??null,moving:[...paths.keys()].map(a=>a.id)};}
 };
}

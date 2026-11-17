import * as T from '../vendor/three.module.js';
import {createEstateScene} from './beverly-scene.js';
import {moveBeverlyPlayer,autoRunsOnDrive,stickKeys} from './beverly-player.js';
import {ESTATE_MOVEMENT,world} from './beverly-layout.js';
import {preloadBeverlyBus} from './beverly-preload.js';
import {createMazeCountdown} from './beverly-countdown.js';
import {PartyKnightAudio} from './beverly-soundtrack.js';
import {playStoryCue,preloadStoryCues} from './beverly-story-audio.js';
import {createBeverlyResult} from './beverly-result.js';
import {createBusFlatten} from './beverly-bus-flatten.js';
import {createLagMonitor,lagAdvice,fullPixelRatio,RESOLUTION_STEPS,LAG_NOTE} from './lag-monitor.js';

export async function bootPartyKnight(){
 const $=id=>document.getElementById(id),canvas=$('estate'),menu=$('menu'),hud=$('hud'),enter=$('enter');
 const loading=$('loading'),progress=$('loading-progress');
 async function showLoadStage(label){
  progress.value+=1;
  $('loading-stage').textContent=label;
  $('loading-step').textContent=(progress.value+1)+' of '+progress.max;
  // Paint the stage before building geometry or uploading it to the GPU.
  await new Promise(resolve=>document.hidden ? setTimeout(resolve,0) : requestAnimationFrame(()=>setTimeout(resolve,0)));
 }
 const audio=new PartyKnightAudio();
 const {model,renderer,scene,camera,controls,navigation,player,stubby,escape,updateEstateLighting,attachSpeech,setShadowView,lightPool}=await createEstateScene(canvas,{onHeadStart:()=>audio.startEscapeMusic(),onLoadStage:showLoadStage});
 const {gate,partyBus,passengers,churroTent,performance,story,guests,filmCrew,drivewayCameraman,patioBubbles}=model;
 controls.enabled=false;
 const showCountdown=createMazeCountdown(canvas.parentElement),intro=$('invitation').textContent;
 const {speech,speechAudio}=attachSpeech(audio);
 const keys=new Set(),result=createBeverlyResult({retry:start,leave:title,standalone:true,media:{pause:()=>audio.setHeld(true),resume:()=>audio.setHeld(false),cheer:()=>audio.effect('taunt')}});
 const flatten=createBusFlatten(T,{player,navigation});
 let mode='title',position=navigation.spawn.clone(),yaw=0,pitch=0,elapsed=0,lookPointer=null,previousTime=0;
 // Automatic running up the drive (see AUTO_RUN); the touch button says what Shift does right now.
 let driveRun=true;const tent=churroTent.eater.getWorldPosition(new T.Vector3()),paceButton=$('pace'),actionButton=$('action');
 // A touch screen has no keys to name in the hints.
 const touch=matchMedia('(pointer:coarse)').matches,nextLine=touch?'Tap Next · next line':'Space · next line';
 function setMode(next){mode=next;document.body.dataset.mode=next;menu.hidden=next!=='title'&&next!=='paused';hud.hidden=next!=='playing';keys.clear();lookPointer=null;}
 function overview(){camera.fov=47;camera.position.set(...world(2150,725,55));camera.lookAt(...world(1150,590,5.3));camera.updateProjectionMatrix();}
 function render(){renderer.render(scene,camera);}
 // A hint when play stays slow: a very large window is the usual cause.
 const lag=createLagMonitor(),lagHint=$('lag-hint');
 // When play stays slow the game lowers its own render resolution a step at a
 // time and says so, with an Undo. Only when it cannot go lower (or the player
 // undid it) does it suggest a smaller window instead.
 // Very large windows start below the device's own sharpness; see PIXEL_BUDGET.
 const devicePixels=renderer.getPixelRatio();let resolutionStep=0,autoResolution=true,noteTimer=0;
 function setResolutionStep(step){resolutionStep=step;resize();}
 function showLagBar(text,{undo=false}={}){
  clearTimeout(noteTimer);lagHint.hidden=!text;if(!text)return;
  $('lag-text').textContent=text;$('lag-undo').hidden=!undo;$('lag-dismiss').hidden=undo;
 }
 function showLagHint(shown){
  if(!shown){if($('lag-undo').hidden)showLagBar('');return;}
  if(autoResolution&&resolutionStep<RESOLUTION_STEPS.length-1){
   // Re-check soon: if it is still slow, the next step follows.
   lag.dismiss(8);setResolutionStep(resolutionStep+1);
   showLagBar(LAG_NOTE.text,{undo:true});noteTimer=setTimeout(()=>showLagBar(''),LAG_NOTE.seconds*1000);
  }else showLagBar(lagAdvice(canvas.clientWidth,canvas.clientHeight));
 }
 $('lag-dismiss').onclick=()=>{lag.dismiss();showLagBar('');canvas.focus();};
 // Undo puts the last step back and stops the game lowering it again this session.
 $('lag-undo').onclick=()=>{autoResolution=false;lag.dismiss();setResolutionStep(Math.max(0,resolutionStep-1));showLagBar('');canvas.focus();};
 function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;if(lag.showing){lag.dismiss(8);showLagBar('');}renderer.setPixelRatio(fullPixelRatio(w,h,devicePixels)*RESOLUTION_STEPS[resolutionStep]);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();render();}
 function activateAudio(){
  audio.activate().then(()=>Promise.all([preloadStoryCues(audio),speechAudio.preload()])).catch(()=>{$('notice').textContent='Audio is unavailable. You can still play.';});
 }
 function title(){flatten.reset();result.reset();audio.setView('home');escape.reset();story.reset();stubby.reset();drivewayCameraman.reset();partyBus.showParked();passengers.showDisplay();gate.close();player.root.visible=false;setShadowView('wide');updateEstateLighting(0,audio.lampCue);
  setMode('title');$('title').textContent='Party Knight';$('invitation').textContent=intro;enter.textContent='Enter the party';$('quit').hidden=true;overview();render();enter.focus();}
 function start(){
  showCountdown(null);flatten.reset();result.reset();escape.reset();story.reset();stubby.reset();filmCrew.reset();player.reset();gate.startLevel();
  partyBus.startLevel(ESTATE_MOVEMENT.run);drivewayCameraman.startLevel();passengers.update(0);
  driveRun=true;position=navigation.spawn.clone();const toward=gate.frame.center.clone().addScaledVector(gate.frame.direction,6).sub(position);yaw=Math.atan2(toward.x,toward.z);pitch=0;elapsed=0;
  setMode('playing');setShadowView('follow');player.root.visible=true;camera.fov=66;camera.updateProjectionMatrix();player.update(0,{position,yaw,camera,pitch});
  audio.startRound();audio.setView('playing');activateAudio();canvas.focus();
 }
 function pause(){if(mode!=='playing')return;setMode('paused');audio.setView('paused');$('title').textContent='Intermission';$('invitation').textContent='The party can wait.';enter.textContent='Resume game';$('quit').hidden=false;enter.focus();}
 function resume(){setMode('playing');audio.setView('playing');activateAudio();canvas.focus();}
 function finish(outcome){setMode('result');audio.setView('result');
  // The crowd cheers a win through the maze exit (after setView, which clears play sounds).
  if(outcome==='escaped')playStoryCue(audio,'audience-cheer');
  result.show(outcome,elapsed);}
 function action(){if(mode!=='playing')return;if(escape.alternate.active)escape.alternate.advanceDialogue();else if(story.locked)story.advanceDialogue();else if(!escape.locked)stubby.interact(position,yaw);}
 enter.onclick=()=>mode==='paused'?resume():start();$('quit').onclick=title;$('pause').onclick=pause;$('action').onclick=action;
 for(const [id,channel] of [['music','music'],['sfx','effects']])$(id).onchange=async e=>{try{await audio.setEnabled(channel,e.target.checked);}catch{e.target.checked=false;}};
 const moves=new Set(['w','s','a','d','arrowup','arrowdown','arrowleft','arrowright','shift']);
 addEventListener('keydown',e=>{
  if(e.key==='Escape'&&(mode==='playing'||mode==='paused')){e.preventDefault();if(!e.repeat)(mode==='playing'?pause:resume)();return;}
  if(mode!=='playing')return;const k=e.key.toLowerCase();
  if(moves.has(k)){e.preventDefault();keys.add(k);}
  else if((e.code==='Space'&&(story.locked||escape.alternate.active))||(k==='e'&&!story.locked)){e.preventDefault();if(!e.repeat)action();}
 });
 addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));addEventListener('blur',()=>keys.clear());
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();audio.setHidden(document.hidden);});
 addEventListener('pagehide',()=>audio.setView('home'));
 canvas.onpointerdown=e=>{if(mode==='playing'){lookPointer=e.pointerId;canvas.setPointerCapture(e.pointerId);}};
 canvas.onlostpointercapture=()=>lookPointer=null;
 canvas.onpointermove=e=>{if(e.pointerId===lookPointer&&mode==='playing'&&!story.locked&&!escape.locked){yaw-=e.movementX*.004;pitch=T.MathUtils.clamp(pitch-e.movementY*.004,-.65,.65);}};
 // Touch: the stick stands for the movement keys, and Run is a tap that sticks (no finger to spare for holding it).
 const stick=$('stick'),knob=stick.firstElementChild,steering=['w','s','a','d'];
 function steer(e){
  const r=stick.getBoundingClientRect(),half=r.width/2;let x=(e.clientX-r.left-half)/half,y=(e.clientY-r.top-half)/half;
  const reach=Math.hypot(x,y);if(reach>1){x/=reach;y/=reach;}
  knob.style.transform='translate('+x*half*.55+'px,'+y*half*.55+'px)';
  const held=mode==='playing'?stickKeys(x,y):[];for(const k of steering)held.includes(k)?keys.add(k):keys.delete(k);
 }
 stick.onpointerdown=e=>{e.preventDefault();stick.setPointerCapture(e.pointerId);steer(e);};
 stick.onpointermove=e=>{if(stick.hasPointerCapture(e.pointerId))steer(e);};
 stick.onlostpointercapture=()=>{knob.style.transform='';for(const k of steering)keys.delete(k);};
 paceButton.onpointerdown=e=>{e.preventDefault();if(mode==='playing')keys.has('shift')?keys.delete('shift'):keys.add('shift');};
 function tick(dt){
  elapsed+=dt;model.effects.update(dt);model.gardenWater.update(dt);model.patioFountain.update(dt);partyBus.update(dt);passengers.update(dt);churroTent.update(dt);performance.update(dt,camera);
  // Run over: the coach rolls on while the camera rises above flattened Christel.
  if(flatten.active){drivewayCameraman.update(camera);const over=flatten.update(dt,camera);speech.update(camera,{storySpeaker:null});if(over)finish('bus');return;}
  driveRun=autoRunsOnDrive(driveRun,{storyStarted:story.phase!=='first-ready',tentDistance:Math.hypot(position.x-tent.x,position.z-tent.z)});
  const autoRun=driveRun||escape.active,pace=keys.has('shift')!==autoRun?'Walk':'Run';if(paceButton.textContent!==pace)paceButton.textContent=pace;
  const act=story.locked||escape.alternate.active?'Next':'Action';if(actionButton.textContent!==act)actionButton.textContent=act;
  const before=position,step=moveBeverlyPlayer(T,navigation,position,yaw,keys,dt,story.locked||escape.locked,autoRun);position=step.position;yaw=step.yaw;
  if(partyBus.state==='driving'&&partyBus.intersectsPlayer(before,position)){partyBus.registerHit();keys.clear();position=before;flatten.start({position:before,busQuaternion:partyBus.group.quaternion,camera});$('objective').textContent='Flattened by the party bus!';$('alert').hidden=true;speech.update(camera,{storySpeaker:null});return;}
  const locked=story.locked;story.update(dt,{playerPosition:position,active:true});if(locked!==story.locked)keys.clear();
  // The churro tent's stickman has finished his invitation: play waits on the film menu.
  if(story.theatreMenu&&mode==='playing'){
   setMode('theatre');audio.setView('paused');
   result.theatreMenu({done(){story.closeTheatreMenu();setMode('playing');audio.setView('playing');activateAudio();canvas.focus();}});
   return;
  }
  const focus=story.cameraTarget();if(focus){const delta=focus.clone().sub(position),turn=Math.atan2(delta.x,delta.z)-yaw;yaw+=Math.atan2(Math.sin(turn),Math.cos(turn))*Math.min(1,dt*5);pitch=0;}
  if(!escape.alternate.active)player.update(dt,{position,yaw,moving:step.moving,locked:story.locked||escape.locked,holding:stubby.held,camera,focus,pitch,capture:escape.capture});
  const shot=escape.alternate.active?null:(escape.cameraShot()??story.cameraShot());if(shot){camera.position.copy(shot.position);camera.lookAt(shot.target);}
  const lens=shot?.fov??(escape.alternate.active?escape.alternate.fov:66);if(camera.fov!==lens){camera.fov=lens;camera.updateProjectionMatrix();}
  stubby.update(dt,{active:!story.locked&&!escape.locked,position,yaw,camera});
  if(story.phase==='fountain-complete'&&!escape.active){escape.start({playerPosition:position,camera});keys.clear();}
  guests.update(dt,camera,{playerPosition:!story.locked&&!escape.active?position:null,canApproach:(a,b)=>!navigation.blocked(a,b)});
  filmCrew.update(dt,{camera,playerPosition:position});drivewayCameraman.update(camera);patioBubbles.update(dt,camera);
  for(const a of passengers.speechActors)if(a.group.visible&&!a.escapeControlled)a.model.lookAtCamera(camera,false);
  story.afterActors(dt,camera);for(const cue of story.consumeSounds())playStoryCue(audio,cue);
  escape.update(dt,{playerPosition:position,camera,playing:!story.locked});
  for(const _ of model.drowningRemains.consumeDeaths())playStoryCue(audio,'drown');
  for(const cue of new Set(escape.consumeSounds()))playStoryCue(audio,cue);
  speech.update(camera,{storySpeaker:escape.speaker??story.caption?.actors??story.caption?.actor});
  speechAudio.updateToken(story.locked||escape.locked ? null : position,yaw);
  $('objective').textContent=escape.alternate.active?(escape.alternate.speaker?nextLine:''):escape.alternate.unlocked?'Follow the pink exit through the pool maze, or find the second exit at the Mimesis stage.':escape.active?'Follow the pink exit through the pool maze.':story.locked?nextLine:story.marker==='second'?'Find Al in the dark wooden room.':story.marker==='third'?'Find Emily by the patio fountain.'+(story.invite==='ready'?' Or grab a churro first.':''):'Find the blue light at the foot of the terrace stairs.';
  showCountdown(escape.countdownDigit);
  const alert=stubby.held?'Stubby vision! '+Math.ceil(stubby.remaining)+'s':stubby.canPickup(position)?(touch?'Tap Action to pick up Stubby!':'Press E to pick up Stubby!'):partyBus.state==='waiting'?'Party bus in '+Math.ceil(Math.max(0,partyBus.spec.delay-partyBus.elapsed))+'s':partyBus.state==='driving'?'Party bus approaching · keep to the side':'';
  $('alert').textContent=alert;$('alert').hidden=!alert||escape.alternate.active;
  if(escape.result)finish(escape.result);
 }
 await showLoadStage('Lighting the estate…');
 overview();resize();
 await showLoadStage('Getting the party bus ready…');
 await preloadBeverlyBus(T,renderer,scene,camera,partyBus);
 await showLoadStage('Opening the gates…');
 title();new ResizeObserver(resize).observe(canvas);
 progress.value=progress.max;loading.hidden=true;enter.hidden=false;enter.disabled=false;
 if(document.activeElement===document.body)enter.focus();
 let lastEncoreMix=0,hadLampCue=false;
 // Review hook for visual audits: party-knight.html?debug exposes the live scene.
 if(new URLSearchParams(location.search).has('debug')){const pk=window.__partyKnight={get driveRun(){return driveRun;},T,result,lag,get resolutionStep(){return resolutionStep;},get autoResolution(){return autoResolution;},renderer,scene,camera,model,audio,navigation,escape,lightPool,updateEstateLighting,get position(){return position;},set position(v){position=v.clone();},get yaw(){return yaw;},set yaw(v){yaw=v;},get mode(){return mode;},get elapsed(){return elapsed;}};import('./party-knight-review.js').then(m=>{pk.review=m.installPartyKnightReview(pk);}).catch(()=>{});}
 function frame(now){
  requestAnimationFrame(frame);const gap=(now-previousTime)/1000,dt=Math.min(gap,.05);previousTime=now;
  if(document.hidden)return;
  if(mode==='playing'){const change=lag.frame(gap);if(change)showLagHint(change==='show');tick(dt);}
  else{lag.reset();if(mode!=='result')return;}
  const mix=audio.encoreLightMix,cue=audio.lampCue;
  if(mode==='result' && !cue && !hadLampCue && mix===lastEncoreMix)return;
  updateEstateLighting(mix,cue);lastEncoreMix=mix;hadLampCue=!!cue;render();
 }
 requestAnimationFrame(frame);
}

import {makeRunner} from './world.js';
import {ESTATE_MOVEMENT,MAIN_POOL} from './beverly-layout.js';

// Stretches where Christel runs without being asked, so nobody has to find
// Shift to enjoy them: up the drive until she first comes within `tentRadius`
// metres of the churro tent, and the whole chase after Alex and Emily die.
// There, Shift slows her to a walk instead.
export const AUTO_RUN=Object.freeze({tentRadius:15});
export function autoRunsOnDrive(wasRunning,{storyStarted=false,tentDistance=Infinity}={}){
 // Once ended it stays ended for the round, even if she wanders back down.
 return wasRunning&&!storyStarted&&tentDistance>=AUTO_RUN.tentRadius;
}

// The touch stick, as the keys it stands for. x and y run from -1 to 1 across
// the pad (y down, like the screen): push up to walk, sideways to turn.
export const STICK=Object.freeze({walk:.3,turn:.35});
export function stickKeys(x,y){
 const keys=[];
 if(y<-STICK.walk)keys.push('w');else if(y>STICK.walk)keys.push('s');
 if(x<-STICK.turn)keys.push('a');else if(x>STICK.turn)keys.push('d');
 return keys;
}

// How much further back and higher the follow camera sits on a picture taller
// than it is wide (a phone held upright), where Christel would fill the frame.
export const TALL_VIEW=Object.freeze({back:2.6,rise:1.0});
export function tallness(aspect){return aspect>0?Math.min(1,Math.max(0,1-aspect)):0;}

// The same runner, turn controls and follow-camera proportions as the boards.
export function moveBeverlyPlayer(T,navigation,position,yaw,keys,dt,locked=false,autoRun=false){
 if(locked)return {position:position.clone(),yaw,moving:false};
 const forward=Number(keys.has('w')||keys.has('arrowup'))-Number(keys.has('s')||keys.has('arrowdown'));
 yaw+=(Number(keys.has('a')||keys.has('arrowleft'))-Number(keys.has('d')||keys.has('arrowright')))*dt*1.6;
 const distance=(keys.has('shift')!==autoRun?ESTATE_MOVEMENT.run:ESTATE_MOVEMENT.walk)*dt*forward;
 const next=distance?navigation.move(position,Math.sin(yaw)*distance,Math.cos(yaw)*distance):position.clone();
 return {position:next,yaw,moving:next.distanceToSquared(position)>.000001};
}

export function createBeverlyPlayer(T,navigation,{runner=makeRunner(),reducedMotion=false}={}){
 runner.root.name='Christel — player';runner.root.visible=false;
 runner.root.userData.playerControlled=true;
 let elapsed=0,idle=0,initialized=false,swimBlend=0,swimPhase=0,waterLevel=0;
 const look=new T.Vector3();
 function reset(){elapsed=idle=swimBlend=swimPhase=0;initialized=false;runner.reset();}
 function update(dt,{position,yaw,moving=false,locked=false,holding=false,camera,focus=null,pitch=0,capture=null}){
  const water=navigation.waterAt?.(position.x,position.z);
  const inPool=water?.id===MAIN_POOL.id;
  const swimTarget=inPool?T.MathUtils.smoothstep(water.surface-position.y,.10,.70):0;
  swimBlend+=(swimTarget-swimBlend)*(1-Math.exp(-9*dt));
  if(swimBlend<.001)swimBlend=0;
  if(inPool)waterLevel=water.surface;
  elapsed+=dt;swimPhase+=dt*(moving&&!locked?4.2:2.4)*(reducedMotion?.7:1);
  idle=moving||locked||swimBlend>0?0:idle+dt;
  runner.root.visible=true;runner.root.position.copy(position);runner.root.rotation.y=yaw;
  const forward=new T.Vector3(Math.sin(yaw),0,Math.cos(yaw));
  // Ease a little higher/back in the pool so the breaststroke is visible from
  // the usual follow view, instead of hiding both arms behind her hair.
  const tall=tallness(camera.aspect);
  const desired=position.clone().addScaledVector(forward,-2.5-.7*swimBlend-TALL_VIEW.back*tall);
  desired.y=Math.max(position.y+2.2+.65*swimBlend+TALL_VIEW.rise*tall,(navigation.surface(desired.x,desired.z)??position.y)+1.5);
  const pivot=position.clone().add(new T.Vector3(0,1.35,0));
  const safe=navigation.clipCamera(pivot,desired);
  const target=focus?.clone()??position.clone().add(new T.Vector3(0,1.18+Math.tan(pitch)*4.7,0)).addScaledVector(forward,2.2-1.3*swimBlend);
  const blend=initialized?Math.min(1,dt*14):1;
  camera.position.lerp(safe,blend);look.lerp(target,blend);
  // Clip the interpolated position too, so turning at a corner cannot cut through it.
  camera.position.copy(navigation.clipCamera(pivot,camera.position));
  camera.up.set(0,1,0);camera.lookAt(look);initialized=true;
  const cameraOffset=Math.atan2(camera.position.x-position.x,camera.position.z-position.z)-yaw;
  runner.animate(elapsed,moving,holding,idle,dt,cameraOffset,reducedMotion,false);
  if(capture){runner.body.position.z=0;runner.tackle(capture.elapsed+.85);return;}
  if(swimBlend>0){
   const {body,head,limbs,elbows}=runner,blend=swimBlend;
   const sweep=(1-Math.cos(swimPhase))/2,kick=Math.max(0,Math.sin(swimPhase-.9))**2;
   // Symmetric reach, outward sweep, recovery and frog kick. At rest this
   // slows to a gentle paddle instead of the standing idle dance.
   // Cradle Stubby above the surface while frog-kicking; empty hands use the
   // full breaststroke. The shallower lean keeps the cat dry in her arms.
   const lean=(holding?.20:1.12)+(reducedMotion?0:.035*Math.cos(swimPhase));
   body.rotation.set(lean*blend,0,0);head.rotation.x=-body.rotation.x;
   body.position.x=0;body.position.z=-.68*Math.sin(body.rotation.x);
   const lift=(waterLevel+.34-position.y)/runner.root.scale.y-1.30*Math.cos(body.rotation.x)-.32;
   body.position.y=T.MathUtils.lerp(body.position.y,lift,blend);
   if(holding){runner.carry.position.y+=.52*blend;for(const i of [1,3])limbs[i].rotation.x=-1.35;for(const elbow of elbows)elbow.rotation.x=-.7;}
   // Even during shore transitions the mouth stays above the actual surface.
   if(inPool)body.position.y=Math.max(body.position.y,(waterLevel+.15-position.y)/runner.root.scale.y-1.30*Math.cos(body.rotation.x)-.20);
   for(let i=0;i<2;i++){
    const side=i===0?-1:1,leg=limbs[i*2],arm=limbs[i*2+1],elbow=elbows[i];
    if(!holding){
     arm.rotation.x=T.MathUtils.lerp(arm.rotation.x,-Math.PI/2-lean+.75*sweep,blend);
     arm.rotation.z=side*.95*sweep*blend;
     elbow.rotation.x=T.MathUtils.lerp(elbow.rotation.x,-.15-1.15*sweep,blend);
     elbow.rotation.z=side*.3*sweep*blend;
    }
    leg.rotation.x=T.MathUtils.lerp(leg.rotation.x,.15+.75*kick,blend);
    leg.rotation.z=side*.45*kick*blend;
   }
  }
 }
 return {root:runner.root,runner,reset,update,get swimming(){return swimBlend>.5;},get swimBlend(){return swimBlend;}};
}

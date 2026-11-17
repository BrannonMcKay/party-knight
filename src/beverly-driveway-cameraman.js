import {FILM_CREW} from './beverly-film-crew.js';

export const DRIVEWAY_CAMERAMAN={
 scale:FILM_CREW.tinyScale,speed:1.7,uphillLead:27,firstSpeech:5,laneOffset:.95,radius:.12,fallSeconds:.32,clearSeconds:4.5,
 lines:["I can't shoot!","It's crazy in there!"]
};

export function buildDrivewayCameraman(T,root,groups,bus,filmCrew){
 const spec=DRIVEWAY_CAMERAMAN,group=new T.Group();group.name='Driveway_cameraman';
 group.userData={dynamic:true,role:'Distraught miniature camera operator fleeing down the driveway',dialogue:spec.lines,scale:spec.scale,entrance:'Starts about 50 metres uphill; first shout after five seconds',collision:'Cartoon bus knockdown farther uphill on actual bumper contact; independent of player damage'};
 root.add(group);groups.Driveway_cameraman=group;
 const actor=filmCrew.createCameraOperator('driveway-camera',[0,0],spec.scale,4,{distressed:true});
 actor.group.name='Fleeing miniature cameraman';actor.speechName='Driveway cameraman';
 actor.group.userData.dialogue=[...spec.lines];actor.group.userData.role=group.userData.role;
 group.add(actor.group);
 let state='hidden',initialDistance=0,impactTime=Infinity,impactPosition=new T.Vector3(),impactRotation=new T.Quaternion();
 const cameraStart=new T.Vector3(),cameraRotation=new T.Quaternion(),cameraLanding=new T.Vector3();
 function positionAt(time){
  const d=Math.max(0,initialDistance-spec.speed*time),p=bus.route.point(d);
  const lateral=new T.Vector3(spec.laneOffset,0,0).applyQuaternion(bus.route.pose(d).quaternion);
  return p.add(lateral).add(new T.Vector3(0,.035,0));
 }
 function runningPose(time,viewCamera){
  const p=positionAt(time),ahead=positionAt(time+.25);
  actor.group.position.copy(p);actor.group.rotation.set(0,Math.atan2(ahead.x-p.x,ahead.z-p.z),0);actor.group.scale.setScalar(spec.scale);
  actor.running=true;filmCrew.poseCameraOperator(actor,time,viewCamera);
 }
 function reset(){
  state='hidden';group.visible=false;actor.group.visible=false;actor.speech=null;actor.running=false;
  // Reattach the thrown camera for a clean replay, preserving the shared prop rig.
  actor.model.body.add(actor.prop);actor.prop.scale.setScalar(1);actor.prop.quaternion.identity();
  actor.model.reset();actor.group.scale.setScalar(spec.scale);actor.group.rotation.set(0,0,0);
 }
 function startLevel(){
  reset();state='running';group.visible=actor.group.visible=true;
  // Start farther up the hill, leaving a 27-metre lead over the front bumper
  // when the coach enters. He approaches naturally instead of appearing at the gate.
  initialDistance=bus.spec.length/2+spec.speed*bus.spec.delay+spec.uphillLead;
  // Find the actual front-bumper contact on the sloped route. A shared bus clock
  // makes this beat identical at low frame rates and when advancing a preview.
  let low=bus.spec.delay,high=null;
  const latest=Math.min(initialDistance/spec.speed,bus.spec.delay+bus.route.roadLength/bus.speed);
  const contact=t=>bus.intersectsAt(positionAt(t).add(new T.Vector3(0,.35,0)),(t-bus.spec.delay)*bus.speed,spec.radius);
  // Locate a real overlap before bisecting; a fixed two-second window can miss
  // contact entirely when the runner begins farther uphill.
  for(let t=low;t<=latest;t+=.05){if(contact(t)){high=t;break;}low=t;}
  if(high!==null)for(let i=0;i<30;i++){
   const t=(low+high)/2;
   if(contact(t))high=t;else low=t;
  }
  impactTime=high??Infinity;if(Number.isFinite(impactTime))impactPosition.copy(positionAt(impactTime));
  runningPose(0);
 }
 function knockDown(viewCamera){
  runningPose(impactTime,viewCamera);actor.running=false;actor.speech=null;state='knocked-down';
  impactRotation.copy(actor.group.quaternion);root.updateMatrixWorld(true);
  group.attach(actor.prop);cameraStart.copy(actor.prop.position);cameraRotation.copy(actor.prop.quaternion);
  cameraLanding.copy(impactPosition).add(new T.Vector3(-1.65,.055,.35).applyQuaternion(impactRotation));
 }
 function update(viewCamera=null){
  if(state==='hidden')return;
  if(bus.state==='display'){reset();return;}
  if(state==='cleared')return;
  const time=bus.elapsed;
  if(time<impactTime){
   runningPose(time,viewCamera);
   const speechTime=time-spec.firstSpeech,phase=speechTime%4.7,index=Math.floor(speechTime/4.7)%spec.lines.length;
   actor.speech=speechTime>=0&&phase<4.2?{text:spec.lines[index],remaining:4.2-phase}:null;
   return;
  }
  if(state==='running')knockDown(viewCamera);
  const age=time-impactTime,fall=T.MathUtils.smoothstep(age,0,spec.fallSeconds);
  actor.group.position.copy(impactPosition).add(new T.Vector3(0,.06*fall,0));
  actor.group.quaternion.copy(impactRotation).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),Math.PI*.5*fall));
  actor.group.scale.set(spec.scale,spec.scale,spec.scale*(1-.7*fall));
  actor.group.visible=age<spec.clearSeconds;
  if(!actor.group.visible)state='cleared';
  const toss=Math.min(1,age/.65);
  actor.prop.position.copy(cameraStart).lerp(cameraLanding,toss);actor.prop.position.y+=Math.sin(toss*Math.PI)*.35;
  actor.prop.quaternion.copy(cameraRotation).multiply(new T.Quaternion().setFromEuler(new T.Euler(toss*4,0,toss*2)));
 }
 initialDistance=bus.spec.length/2+spec.speed*bus.spec.delay+spec.uphillLead;runningPose(0);reset();
 return {group,actor,spec,startLevel,reset,update,get state(){return state;},get impactTime(){return impactTime;}};
}

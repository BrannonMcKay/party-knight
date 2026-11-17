// Christel's cartoon ending under the party bus. She drops flat along the
// coach's heading, the way the driveway cameraman does, while the camera
// rises to look straight down at her before the result card appears.
export const BUS_FLATTEN=Object.freeze({fallSeconds:.32,squash:.72,riseSeconds:.4,panSeconds:1.1,holdSeconds:1.9,cameraHeight:4.7,cameraBack:.9,lift:.09,spread:.35});
export const BUS_FLATTEN_SECONDS=BUS_FLATTEN.panSeconds+BUS_FLATTEN.holdSeconds;

export function createBusFlatten(T,{player,navigation=null}){
 const spec=BUS_FLATTEN,runner=player.runner,root=player.root;
 const restScale=root.scale.clone(),restOrder=root.rotation.order;
 const ground=new T.Vector3(),startEye=new T.Vector3(),startAim=new T.Vector3(),endEye=new T.Vector3(),aim=new T.Vector3(),forward=new T.Vector3();
 const lane=new T.Quaternion(),tip=new T.Quaternion(),xAxis=new T.Vector3(1,0,0);
 let active=false,elapsed=0,heading=0;
 function pose(){
  const fall=T.MathUtils.smoothstep(elapsed,0,spec.fallSeconds);
  root.position.copy(ground);root.position.y+=spec.lift*fall;
  // Tip forward in the coach's own frame, so she lies on the drive's slope
  // instead of sinking into the rising paving; local depth becomes her thickness.
  root.quaternion.copy(lane).multiply(tip.setFromAxisAngle(xAxis,Math.PI/2*fall));
  // Cartoon pancake: thinner, and a little wider than life.
  root.scale.set(restScale.x*(1+spec.spread*fall),restScale.y*(1+.1*fall),restScale.z*(1-spec.squash*fall));
  const {body,head,limbs,elbows}=runner;
  body.rotation.set(0,0,0);body.position.set(0,0,0);head.rotation.set(-.9*fall,0,0);
  // Arms and legs splay out flat.
  limbs[0].rotation.set(0,0,-.32*fall);limbs[2].rotation.set(0,0,.32*fall);
  limbs[1].rotation.set(0,0,-1.25*fall);limbs[3].rotation.set(0,0,1.25*fall);
  for(const elbow of elbows)elbow.rotation.set(0,0,0);
 }
 function start({position,busQuaternion,camera}){
  active=true;elapsed=0;ground.copy(position);
  lane.copy(busQuaternion);
  forward.set(0,0,1).applyQuaternion(busQuaternion);heading=Math.atan2(forward.x,forward.z);
  forward.set(Math.sin(heading),0,Math.cos(heading));
  startEye.copy(camera.position);
  // Begin the pan from wherever the follow camera was already looking.
  startAim.copy(camera.position).add(camera.getWorldDirection(new T.Vector3()).multiplyScalar(Math.max(1,camera.position.distanceTo(position))));
  // She lies ahead of her feet, so centre the overhead view on her body.
  aim.copy(position).addScaledVector(forward,.75);
  endEye.copy(aim).addScaledVector(forward,-spec.cameraBack);endEye.y+=spec.cameraHeight;
  if(navigation?.clipCamera)endEye.copy(navigation.clipCamera(aim.clone().add(new T.Vector3(0,.4,0)),endEye));
  runner.reset();pose();
 }
 // Returns true once the overhead hold has finished.
 function update(dt,camera){
  if(!active)return false;
  elapsed+=Math.max(0,dt);pose();
  const t=T.MathUtils.clamp(elapsed/spec.panSeconds,0,1),ease=t*t*(3-2*t);
  // Crane up over the coach roof first, then drift across to centre on her.
  const r=T.MathUtils.clamp(elapsed/spec.riseSeconds,0,1),rise=1-(1-r)*(1-r);
  camera.position.lerpVectors(startEye,endEye,ease);camera.position.y=T.MathUtils.lerp(startEye.y,endEye.y,rise);camera.up.set(0,1,0);
  camera.lookAt(startAim.clone().lerp(aim,ease));
  return elapsed>=BUS_FLATTEN_SECONDS;
 }
 function reset(){
  active=false;elapsed=0;
  root.scale.copy(restScale);root.rotation.order=restOrder;root.rotation.set(0,heading,0);
 }
 return {start,update,reset,get active(){return active;},get elapsed(){return elapsed;},get heading(){return heading;}};
}

// A fixed set of real point lights shared by every authored lamp.
//
// The forward renderer evaluates every point light for every lit pixel, so the
// estate's fifty-odd lamps cost the same whether they are beside Christel or
// at the far end of the drive. Each authored light stays in the scene as a
// description (colour, intensity, range, position; other modules keep editing
// it as before) but is moved to a layer the camera never draws. Each frame the
// lamps that matter most to the current view borrow one of the pooled lights.
// The pooled count never changes, so no shader is recompiled, and a lamp eases
// in or out over a fraction of a second instead of popping.

const HIDDEN_LAYER=31;

export function createLightPool(T,scene,{size=16,fade=5,cutDistance=4}={}){
 const group=new T.Group();group.name='Pooled point lights';scene.add(group);
 const slots=Array.from({length:size},(_,i)=>{
  const light=new T.PointLight(0xffffff,0,20,2);light.name='Pooled point light '+(i+1);light.userData.pooled=true;group.add(light);
  return {light,source:null,weight:0};
 });
 const sources=[],frustum=new T.Frustum(),matrix=new T.Matrix4(),sphere=new T.Sphere(),eye=new T.Vector3(),lastEye=new T.Vector3(),lastDirection=new T.Vector3(),direction=new T.Vector3();
 let lastTime=0,primed=false,swaps=0,starved=0;
 function adopt(root=scene){
  root.traverse(o=>{
   if(!o.isPointLight||o.userData.pooled||o.userData.pooledSource)return;
   o.userData.pooledSource=true;o.layers.set(HIDDEN_LAYER);
   sources.push({light:o,position:new T.Vector3(),score:0,wanted:false,slot:null});
  });
  return sources.length;
 }
 const shown=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};
 function update(camera,now=performance.now()){
  const dt=Math.min(.25,Math.max(0,(now-lastTime)/1000)),gap=now-lastTime;lastTime=now;
  camera.getWorldPosition(eye);camera.getWorldDirection(direction);
  // A cut, a teleport or the first frame after a pause should not fade in.
  const snap=!primed||gap>400||eye.distanceTo(lastEye)>cutDistance||direction.dot(lastDirection)<.8;
  primed=true;lastEye.copy(eye);lastDirection.copy(direction);
  frustum.setFromProjectionMatrix(matrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
  for(const source of sources){
   const light=source.light,c=light.color,radiance=light.intensity*Math.max(c.r,c.g,c.b);
   source.wanted=false;source.score=0;
   if(radiance<=1e-4||!shown(light))continue;
   light.getWorldPosition(source.position);
   const reach=light.distance>0?light.distance:30;
   sphere.center.copy(source.position);sphere.radius=reach;
   if(!frustum.intersectsSphere(sphere))continue;
   // How far the lamp itself sits outside the view: one that only grazes the
   // edge of frame lights very little of the picture.
   let outside=0;for(const plane of frustum.planes)outside=Math.max(outside,-plane.distanceToPoint(source.position));
   const inView=1-Math.min(1,outside/reach),d2=eye.distanceToSquared(source.position);
   // Brightness of its pool of light, discounted by how small it looks from here.
   // A lamp can ask for extra weight (userData.poolPriority) when losing it would show.
   source.score=radiance*reach*reach/(d2+reach*reach)*(.15+.85*inView*inView)*(source.slot?1.35:1)*(light.userData.poolPriority||1);
  }
  const ranked=sources.filter(s=>s.score>0).sort((a,b)=>b.score-a.score);
  for(let i=0;i<Math.min(size,ranked.length);i++)ranked[i].wanted=true;
  starved=Math.max(0,ranked.length-size);
  for(const slot of slots){
   const source=slot.source;if(!source)continue;
   slot.weight=source.wanted?Math.min(1,snap?1:slot.weight+dt*fade):Math.max(0,snap?0:slot.weight-dt*fade);
   if(slot.weight===0&&!source.wanted){source.slot=null;slot.source=null;}
  }
  for(const source of ranked){
   if(!source.wanted)break;
   if(source.slot)continue;
   const slot=slots.find(s=>!s.source);if(!slot)break;
   slot.source=source;source.slot=slot;slot.weight=snap?1:Math.min(1,dt*fade);if(!snap)swaps++;
  }
  for(const slot of slots){
   const light=slot.light,source=slot.source;
   if(!source){light.intensity=0;continue;}
   light.position.copy(source.position);light.color.copy(source.light.color);
   light.intensity=source.light.intensity*slot.weight;
   light.distance=source.light.distance;light.decay=source.light.decay;
   light.updateMatrixWorld(true);
  }
 }
 return {group,slots,sources,adopt,update,get active(){return slots.filter(s=>s.source).length;},get size(){return size;},
  // Review counters: lamps that eased into a slot, and lamps currently left without one.
  get swaps(){return swaps;},get starved(){return starved;}};
}

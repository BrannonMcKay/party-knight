import {DRIVE,world,plan,s,gardenHeight,nearPolyline,TRAILER_PAD,CHURRO_ACCESS,darkRoomHeight,PATIO_FOUNTAIN} from './beverly-layout.js';

// A bounded walk surface plus capsule-width obstacle probes for the local review.
// Heights are modelling estimates. This is independent of the existing game levels.
export function createBeverlyNavigation(T,model){
 const curve=new T.CatmullRomCurve3(DRIVE.map(p=>new T.Vector3(...world(...p))));
 const road=Array.from({length:501},(_,i)=>{const p=curve.getPoint(i/500);return [...plan(p.x,p.z),p.y];});
 const objects=[model.groups.Ground_floor,model.groups.Upper_floors_and_roofs,model.groups.Terraces,model.groups.Pavilions,model.groups.Driveway,model.groups.Planting,model.groups.Union_Toilets_trailer,model.groups.Churro_tent,model.groups.Patio_bar].filter(Boolean);
 model.root.updateMatrixWorld(true);
 // Keep the authored ramp and standing area before the review batches scenery.
 // Their triangles preserve the paved edges, curved grade and full-width join.
 const coachPaving=['Graded coach parking approach','Party bus standing area'].map(name=>{
  const mesh=model.root.getObjectByName(name);return {mesh,bounds:new T.Box3().setFromObject(mesh)};
 });
 const coachRay=new T.Raycaster(new T.Vector3(),new T.Vector3(0,-1,0));
 const colliders=[];for(const group of objects)group.traverse(o=>{if(o.isMesh)colliders.push({mesh:o,bounds:new T.Box3().setFromObject(o)});});
 const rect=(u,v,a,b,c,d)=>u>=a&&u<=c&&v>=b&&v<=d;
 function surface(x,z){
  const [u,v]=plan(x,z),r=nearPolyline(u,v,road);
  // Only the lower garden pool is swimmable; keep the story fountain bounded.
  if(Math.hypot(u-PATIO_FOUNTAIN.u,v-PATIO_FOUNTAIN.v)*s<PATIO_FOUNTAIN.outerRadius)return null;
  const mazeHeight=model.maze?.surface(u,v);if(mazeHeight!=null)return mazeHeight;
  if(rect(u,v,367,555,572,643))return null; // planted arrival fountain island
  let coachHeight=null;
  for(const {mesh,bounds} of coachPaving)if(x>=bounds.min.x&&x<=bounds.max.x&&z>=bounds.min.z&&z<=bounds.max.z){
   coachRay.ray.origin.set(x,bounds.max.y+1,z);const height=coachRay.intersectObject(mesh,false)[0]?.point.y;
   if(height!==undefined)coachHeight=Math.max(coachHeight??-Infinity,height);
  }
  // The parking branch overlaps the main road as it rises. Walk on the upper
  // paved surface there, then follow its grade into the level standing area.
  if(r.distance*s<3.06||coachHeight!==null)return Math.max(r.distance*s<3.06?r.height:-Infinity,coachHeight??-Infinity);
  if(rect(u,v,208,973,316,1100))return TRAILER_PAD.y;
  if(rect(u,v,316,1040,348,1064))return 5.9-(u-316)/32*.24;
  const catering=nearPolyline(u,v,CHURRO_ACCESS);
  if(catering.distance*s<2.05)return catering.height;
  if(rect(u,v,204,818,289,908))return 6.54;
  if(((u-474)/172)**2+((v-599)/111)**2<=1)return 8;
  // Only the front door connects the arrival and house walk regions.
  if(rect(u,v,630,596,669,624))return 8.15;
  if(rect(u,v,702,707,743,738)||rect(u,v,664,737,763,894)||rect(u,v,740,765,780,790))return darkRoomHeight(u,v);
  if(rect(u,v,657,407,746,728)||rect(u,v,760,454,811,727))return 8.15;
  for(const v0 of [478,530,582,634,686])if(rect(u,v,742,v0-12,767,v0+12))return 8.15;
  if(rect(u,v,807,570,832,594))return 8.15;
  if(rect(u,v,784,721,809,746)||rect(u,v,777,744,894,810)||rect(u,v,889,766,923,788))return 8.15;
  if(rect(u,v,831,407,969,722)||rect(u,v,917,720,960,854))return 8.15;
  for(const [a,b] of [[486,531],[662,708]])if(rect(u,v,968,a,1020,b))return gardenHeight(u);
  if(rect(u,v,1017,411,1133,568)||rect(u,v,1017,634,1133,792))return 5.4;
  if(rect(u,v,1130,547,1349,571)||rect(u,v,1130,630,1349,654))return gardenHeight(u);
  if(rect(u,v,1315,518,1356,572)||rect(u,v,1315,630,1356,682))return 2.2;
  if(rect(u,v,1335,515,1679,535)||rect(u,v,1335,668,1679,685)||rect(u,v,1663,518,1682,681)||rect(u,v,1335,526,1350,678))return 2.2;
  return null;
 }
 function canStand(x,z){
  const h=surface(x,z);if(h===null)return false;
  for(let i=0;i<8;i++){const a=i*Math.PI/4;if(surface(x+Math.cos(a)*.24,z+Math.sin(a)*.24)===null)return false;}
  return true;
 }
 function blocked(a,b,{sealEntry=false}={}){
  if(sealEntry){const [au,av]=plan(a.x,a.z),[bu,bv]=plan(b.x,b.z);if((au<650)!==(bu<650)&&Math.min(av,bv)<631&&Math.max(av,bv)>590)return true;}
  const d=b.clone().sub(a);d.y=0;const length=d.length();if(length<1e-9)return false;d.divideScalar(length);
  if(model.maze?.blocks(a,b))return true;
  const side=new T.Vector3(-d.z,0,d.x);
  const minX=Math.min(a.x,b.x)-.52,maxX=Math.max(a.x,b.x)+.52,minZ=Math.min(a.z,b.z)-.52,maxZ=Math.max(a.z,b.z)+.52;
  const dynamic=[...(model.gate?.colliders||[]),...(model.partyBus?.colliders||[])].map(mesh=>({mesh,bounds:new T.Box3().setFromObject(mesh)}));
  const candidates=[...colliders,...dynamic].filter(({bounds:bbox})=>bbox.min.x<maxX&&bbox.max.x>minX&&bbox.min.z<maxZ&&bbox.max.z>minZ&&bbox.max.y>a.y+.3&&bbox.min.y<a.y+1.9).map(o=>o.mesh);
  for(const height of [.55,1.2,1.68])for(const offset of [-.25,0,.25]){
   const origin=a.clone().addScaledVector(side,offset);origin.y=Math.min(a.y,b.y)+height;
   const ray=new T.Raycaster(origin,d,.001,length+.25);
   if(ray.intersectObjects(candidates,false).length)return true;
  }return false;
 }
 function move(from,dx,dz,options){
  // Subdivide fast/diagonal motion so a thin wall cannot be skipped in one frame.
  let p=from.clone();const count=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.14));
  for(let i=0;i<count;i++){
   const attempt=(sx,sz)=>{const q=p.clone().add(new T.Vector3(sx,0,sz)),h=surface(q.x,q.z);if(h===null||!canStand(q.x,q.z))return false;q.y=h;if(Math.abs(q.y-p.y)>.38||blocked(p,q,options))return false;p=q;return true;};
   if(!attempt(dx/count,dz/count)){attempt(dx/count,0);attempt(0,dz/count);}
  }return p;
 }
 function clipCamera(pivot,desired){
  const delta=desired.clone().sub(pivot),length=delta.length();if(length<.001)return desired.clone();
  const direction=delta.divideScalar(length),bounds=new T.Box3().setFromPoints([pivot,desired]).expandByScalar(.16);
  const dynamic=[...(model.gate?.colliders||[]),...(model.partyBus?.colliders||[])].map(mesh=>({mesh,bounds:new T.Box3().setFromObject(mesh)}));
  const candidates=[...colliders,...dynamic].filter(item=>item.bounds.intersectsBox(bounds)).map(item=>item.mesh);
  let distance=length;
  for(const offset of [[0,0,0],[.13,0,0],[-.13,0,0],[0,.13,0],[0,-.13,0]]){
   const ray=new T.Raycaster(pivot.clone().add(new T.Vector3(...offset)),direction,.02,length+.15);
   const hit=ray.intersectObjects(candidates,false)[0];if(hit)distance=Math.min(distance,Math.max(.12,hit.distance-.18));
  }
  return pivot.clone().addScaledVector(direction,distance);
 }
 const waterAt=(x,z)=>model.maze?.waterAt(...plan(x,z))??null;
 return {surface,waterAt,canStand,blocked,move,clipCamera,spawn:model.gate?.frame.spawn.clone()||new T.Vector3(...world(...DRIVE[1]))};
}

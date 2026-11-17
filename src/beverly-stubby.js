import {makeCat} from './world.js';
import {RULES} from './core.js';
import {world,plan,s,LEVELS,PATIO_FOUNTAIN} from './beverly-layout.js';
import {Font} from '../vendor/FontLoader.js';
import fontData from '../vendor/beverly-font.js';

export const BEVERLY_STUBBY=Object.freeze({u:1088,v:477,y:LEVELS.upperGarden,pickupRadius:1.65,holdSeconds:10,cooldownSeconds:15,speech:'Stubby vision!'});

// Match the ordinary Stubby rig. Vector labels also work in the editable GLB
// and headless geometry tests, while the other boards retain their sprites.
export function buildBeverlyStubby(T,root,groups,materials){
 const group=new T.Group();group.name='Stubby';group.userData.dynamic=true;root.add(group);groups.Stubby=group;
 const font=new Font(fontData);
 function lettering(text){
  const geometry=new T.ShapeGeometry(font.generateShapes(text,.10),5);
  return geometry.center();
 }
 function labelBuilder(text){
  const value=text==='STUBBY'?'Stubby':text;
  const label=new T.Mesh(lettering(value),materials['Guest name ivory']);
  for(const [x,y] of [[-.003,0],[.003,0],[0,-.003],[0,.003]]){
   const outline=new T.Mesh(label.geometry,materials['Guest name dark outline']);
   outline.position.set(x,y,-.002);label.add(outline);
  }
  label.userData.text=value;
  label.userData.setText=value=>{
   if(value===label.userData.text)return;
   const previous=label.geometry;label.geometry=lettering(value);
   for(const outline of label.children)outline.geometry=label.geometry;
   previous.dispose();label.userData.text=value;
  };
  return label;
 }
 const cat=makeCat('stubby',{labelBuilder});cat.root.name='Stubby — maze guide';cat.root.position.set(...world(BEVERLY_STUBBY.u,BEVERLY_STUBBY.v,BEVERLY_STUBBY.y+.025));cat.root.rotation.y=Math.PI/2;group.add(cat.root);
 cat.nameTag.scale.setScalar(1);cat.cooldown.scale.setScalar(1);
 group.userData={dynamic:true,location:'Beside the north second-terrace fountain near the maze entrance',...BEVERLY_STUBBY,vision:'Translucent pink solution while held; E picks up or puts down; leaps to nearest clear dry ground after a water drop'};
 return {group,cat,home:cat.root.position.clone(),spec:BEVERLY_STUBBY};
}

// Include ornamental fountains for cat safety without changing where the player
// can swim. The lower pool/cascades already have exact authored water polygons.
export function stubbyWaterAt(navigation,x,z){
 const water=navigation.waterAt(x,z);if(water)return water;
 const [u,v]=plan(x,z);
 if([459,741].some(cv=>Math.hypot(u-1058,v-cv)<21.5))return {id:'terrace-fountain',surface:5.71};
 if(Math.hypot(u-PATIO_FOUNTAIN.u,v-PATIO_FOUNTAIN.v)*s<PATIO_FOUNTAIN.outerRadius)return {id:'patio-fountain',surface:LEVELS.patio+.5};
 return null;
}

export function dryStubbyLanding(T,navigation,maze,x,z){
 if(stubbyWaterAt(navigation,x,z))return null;
 // Keep paws away from water edges and out of low maze walls or scenery.
 for(let i=0;i<9;i++){
  const a=i*Math.PI/4,r=i===8?0:.30;
  if(stubbyWaterAt(navigation,x+Math.cos(a)*r,z+Math.sin(a)*r))return null;
 }
 const y=navigation.surface(x,z);if(y===null||!navigation.canStand(x,z))return null;
 const p=new T.Vector3(x,y,z);
 for(const axis of [new T.Vector3(.15,0,0),new T.Vector3(0,0,.15)]){
  const a=p.clone().sub(axis),b=p.clone().add(axis);
  if(maze.blocks(a,b,.30)||navigation.blocked(a,b))return null;
 }
 return p.add(new T.Vector3(0,.025,0));
}

export function nearestStubbyLand(T,navigation,maze,origin){
 const here=dryStubbyLanding(T,navigation,maze,origin.x,origin.z);if(here)return here;
 // Concentric rings find the nearest valid shore to within 10 cm. This runs
 // only on release, never per frame, and can leap over the low maze dividers.
 for(let r=.10;r<=30;r+=.10){
  const count=Math.max(16,Math.ceil(2*Math.PI*r/.15));
  for(let i=0;i<count;i++){
   const a=i/count*2*Math.PI,p=dryStubbyLanding(T,navigation,maze,origin.x+Math.cos(a)*r,origin.z+Math.sin(a)*r);
   if(p)return p;
  }
 }
 return null;
}

function buildVision(T,maze,navigation){
 const group=new T.Group();group.name='Stubby vision — translucent pink maze solution';group.visible=false;
 // Straight ribbons follow the solved passages exactly; spline smoothing at
 // right-angle corners would draw misleading shortcuts through the walls.
 function ribbon(width,color,opacity){
  const vertices=[];
  for(let i=1;i<maze.solution.length;i++){
   const a=new T.Vector3(...maze.solution[i-1]),b=new T.Vector3(...maze.solution[i]),d=b.clone().sub(a);d.y=0;
   const length=d.length();if(length<.001)continue;
   const side=new T.Vector3(-d.z,0,d.x).normalize().multiplyScalar(width/2),count=Math.ceil(length/.12);
   const point=t=>{const p=a.clone().lerp(b,t),water=navigation.waterAt(p.x,p.z);p.y=Math.max(navigation.surface(p.x,p.z)??p.y,water?.surface??-Infinity)+.055;return p;};
   for(let j=0;j<count;j++){
    const p=point(j/count),q=point((j+1)/count),corners=[p.clone().add(side),p.clone().sub(side),q.clone().add(side),q.clone().sub(side)];
    for(const k of [0,1,2,2,1,3])vertices.push(...corners[k].toArray());
   }
  }
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.computeVertexNormals();
  const mesh=new T.Mesh(geometry,new T.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,side:T.DoubleSide,toneMapped:false}));mesh.renderOrder=6;group.add(mesh);
 }
 ribbon(.36,0xff6ec4,.18);ribbon(.14,0xffacd9,.58);return group;
}

export function createBeverlyStubby(T,{model,navigation,player,scene}){
 const {cat,group,home,spec}=model.stubby,maze=model.maze;
 const vision=buildVision(T,maze,navigation);scene.add(vision);
 const anchor=new T.Object3D();anchor.position.set(0,.9,0);player.runner.head.add(anchor);
 const speaker={group:player.root,anchor,speechName:'Christel',speech:null};
 let state='ground',remaining=0,cooldown=0,time=0,speechTime=0,jump=null;
 const quaternion=new T.Quaternion();
 function canPickup(position){return state==='ground'&&cooldown<=0&&Math.hypot(position.x-cat.root.position.x,position.z-cat.root.position.z)<spec.pickupRadius&&Math.abs(position.y-cat.root.position.y)<.65&&!navigation.blocked(position,cat.root.position);}
 function pickup(position){
  if(!canPickup(position))return false;
  state='held';remaining=spec.holdSeconds;vision.visible=true;
  player.runner.carry.add(cat.root);cat.root.position.set(0,0,0);cat.root.rotation.set(0,Math.PI/2,0);cat.root.scale.setScalar(.7);
  speaker.speech={text:spec.speech};speechTime=2.2;cat.nameTag.visible=cat.cooldown.visible=false;return true;
 }
 function drop(position,yaw=0){
  if(state!=='held')return false;
  player.root.updateMatrixWorld(true);const start=cat.root.getWorldPosition(new T.Vector3());
  const wet=!!stubbyWaterAt(navigation,position.x,position.z)||!!stubbyWaterAt(navigation,start.x,start.z);
  const desired=wet?start:position.clone().add(new T.Vector3(Math.sin(yaw)*.65,0,Math.cos(yaw)*.65));
  const end=nearestStubbyLand(T,navigation,maze,desired)??home.clone();
  group.attach(cat.root);cat.root.scale.setScalar(1);cat.root.rotation.set(0,Math.atan2(end.x-start.x,end.z-start.z),0);cat.root.position.copy(start);
  jump={start,end,elapsed:0,duration:wet?.72:.42,height:wet?1.25:.22,water:wet};state='leaping';cooldown=spec.cooldownSeconds;remaining=0;vision.visible=false;return true;
 }
 function reset(){
  group.add(cat.root);cat.root.position.copy(home);cat.root.rotation.set(0,Math.PI/2,0);cat.root.scale.setScalar(1);
  state='ground';remaining=cooldown=time=speechTime=0;jump=null;speaker.speech=null;vision.visible=false;cat.nameTag.visible=true;cat.cooldown.visible=false;
 }
 function update(dt,{active=false,position,yaw=0,camera}={}){
  time+=dt;
  if(active){
   cooldown=Math.max(0,cooldown-dt);speechTime=Math.max(0,speechTime-dt);if(!speechTime)speaker.speech=null;
   if(state==='held'){remaining=Math.max(0,remaining-dt);if(!remaining)drop(position,yaw);}
   if(jump){
    jump.elapsed+=dt;const t=Math.min(1,jump.elapsed/jump.duration);
    cat.root.position.lerpVectors(jump.start,jump.end,t);cat.root.position.y+=4*jump.height*t*(1-t);cat.root.rotation.z=Math.sin(t*Math.PI)*-.12;
    if(t===1){cat.root.position.copy(jump.end);cat.root.rotation.z=0;jump=null;state='ground';}
   }
  }
  vision.visible=active&&state==='held';
  cat.tail.rotation.y=Math.sin(time*2)*.16;
  cat.nameTag.visible=state==='ground'&&cooldown<=0;cat.cooldown.visible=state==='ground'&&cooldown>0;
  if(cat.cooldown.visible)cat.cooldown.userData.setText(`${Math.ceil(cooldown)}s · paws off`);
  if(state==='held'){
   cat.root.rotation.y=(1-player.runner.photoBlend)*Math.PI/2;cat.root.rotation.z=-.06*player.runner.photoBlend;
  }
  if(camera){cat.root.getWorldQuaternion(quaternion).invert();for(const label of [cat.nameTag,cat.cooldown])label.quaternion.copy(quaternion).multiply(camera.quaternion);}
 }
 return {cat,vision,speaker,pickup,drop,reset,update,canPickup,spec,
  interact(position,yaw){return state==='held'?drop(position,yaw):pickup(position);},
  get held(){return state==='held';},get state(){return state;},get remaining(){return remaining;},get cooldown(){return cooldown;},get landing(){return jump?.end.clone()??null;}};
}

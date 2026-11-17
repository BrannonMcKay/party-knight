import {makeStickman} from './world.js';
import {say} from './stickman-behavior.js';
import {world,plan,LEVELS} from './beverly-layout.js';

export const FILM_CREW_LINES=Object.freeze([
 'This is dangerous!',
 "We can't film if anyone anywhere in this house had a sip of alcohol!",
 "If you drank anything, you must leave!  Even if it's the main character of the scene!",
 'Who Door Dashed the Smirnoff Ice???',
 'Life has Union rules!',
 "How can we possibly film a party if anyone had even a sip to drink? You couldn't pay me enough!"
]);
export const FIREPLACE_COMPLAINT='Who puked in here!?';
export const FILM_CREW={
 patio:[[832,720],[848,724],[843,706]],tiny:[837,783],vomit:[843,773],
 tinyScale:1/3,triggerRadius:2.6,rearmRadius:3.4,complaintSeconds:5.5,cooldown:8,
 // A tight cluster against the gallery/fireplace-wing corner, leaving the patio clear.
 patioFacing:[888,600],floor:LEVELS.house
};

export function buildBeverlyFilmCrew(T,root,groups,materials){
 const group=new T.Group();group.name='Film_crew';group.userData={dynamic:true,dialogue:[...FILM_CREW_LINES],fireplaceComplaint:FIREPLACE_COMPLAINT};
 const mess=new T.Group();mess.name='Fireplace_floor_spill';root.add(group,mess);groups.Film_crew=group;groups.Fireplace_floor_spill=mess;
 const mat=(name,color,extra={})=>materials[name]=new T.MeshStandardMaterial({name,color,roughness:.7,...extra});
 const ink=mat('Film crew ink',0x292435),cameraMat=mat('Film camera charcoal',0x242831),trim=mat('Film camera metal',0x69727a,{metalness:.5,roughness:.3}),lens=mat('Film camera blue lens',0x245568,{metalness:.6,roughness:.15}),red=mat('Film camera tally light',0xdd4549,{emissive:0xe32439,emissiveIntensity:.5}),screen=mat('Film camera monitor',0x52959e,{emissive:0x275b68,emissiveIntensity:.5}),ivory=mat('Film crew eyes',0xfff8e8);
 const boxGeo=new T.BoxGeometry(1,1,1),sphere=new T.SphereGeometry(1,16,12),cylinder=new T.CylinderGeometry(1,1,1,10),up=new T.Vector3(0,1,0);
 function mesh(g,n,geo,m,p=[0,0,0],scale=[1,1,1]){const o=new T.Mesh(geo,m);o.name=n;o.position.set(...p);o.scale.set(...scale);o.castShadow=o.receiveShadow=true;g.add(o);return o;}
 const ball=(g,n,m,p,scale)=>mesh(g,n,sphere,m,p,scale);
 const box=(g,n,m,p,scale)=>mesh(g,n,boxGeo,m,p,scale);
 function line(g,n,pts,r,m=ink){return mesh(g,n,new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p))),16,r,6,false),m);}
 // Vector versions of the game's worried/angry faces allow DOM-free GLB export.
 function faceBuilder(parent,kind,r,y,z,periodScare=false){
  const f=new T.Group();f.name='Film crew '+kind+' expression';f.position.set(0,y,z);parent.add(f);f.material=ink;
  const k=r/.37;
  if(kind==='horrified'&&periodScare){
   // Match world.js's period-reaction face: outlined white eyes, tiny pupils,
   // high curved brows, oval mouth and the pink tongue inside its lower edge.
   f.name='Period-reaction scared expression';
   const unit=r*1.75/256,xy=(x,y,z=.012)=>[(x-128)*unit,(128-y)*unit,z];
   for(const x of [79,177]){
    ball(f,'Scared eye outline',ink,xy(x,103,0),[31.5*unit,38.5*unit,.009]);
    ball(f,'Wide scared eye',ivory,xy(x,103,.012),[28*unit,35*unit,.009]);
    ball(f,'Tiny scared pupil',ink,xy(x,108,.024),[7*unit,11*unit,.009]);
   }
   for(const [a,b,c] of [[[48,55],[76,31],[107,53]],[[149,53],[178,31],[209,55]]]){
    const curve=new T.QuadraticBezierCurve3(new T.Vector3(...xy(...a)),new T.Vector3(...xy(...b)),new T.Vector3(...xy(...c)));
    mesh(f,'Raised scared eyebrow',new T.TubeGeometry(curve,16,3.5*unit,6,false),ink);
   }
   ball(f,'Scared oval mouth',ink,xy(128,184),[25*unit,34*unit,.010]);
   const tongueMat=materials['Film crew scared tongue']??mat('Film crew scared tongue',0xef9aab);
   const shape=new T.Shape();shape.moveTo(-15*unit,0);shape.absarc(0,0,15*unit,Math.PI,0,true);shape.closePath();
   const tongue=mesh(f,'Scared pink tongue',new T.ShapeGeometry(shape,12),tongueMat,xy(128,203,.024));tongue.scale.y=10/15;
   return f;
  }
  for(const sign of [-1,1]){
   if(kind==='horrified')ball(f,'Worried eye white',ivory,[sign*.123*k,.063*k,0],[.067*k,.083*k,.009]);
   ball(f,'Stickman eye',ink,[sign*.117*k,.055*k,.012],[.023*k,.040*k,.009]);
   const angry=kind==='pout'||kind==='grin';
   line(f,'Expressive eyebrow',[[sign*.19*k,(angry?.14:.17)*k,.01],[sign*.12*k,(angry?.11:.20)*k,.01],[sign*.059*k,(angry?.073:.15)*k,.01]],.010*k);
  }
  if(kind==='horrified')ball(f,'Distressed open mouth',ink,[0,-.135*k,.013],[.063*k,.085*k,.013]);
  else line(f,kind==='pout'?'Angry frown':'Stickman mouth',[[-.105*k,-.115*k,.01],[0,(kind==='pout'?-.061:-.17)*k,.01],[.105*k,-.115*k,.01]],.011*k);
  return f;
 }
 function cameraProp(){
  const g=new T.Group();g.name='Handheld cinema camera';
  box(g,'Cinema camera body',cameraMat,[0,0,0],[.38,.26,.34]);
  box(g,'Camera battery',cameraMat,[0,-.005,-.235],[.27,.23,.12]);
  const barrel=mesh(g,'Camera lens barrel',new T.CylinderGeometry(.10,.12,.25,16),trim,[0,0,.24]);barrel.rotation.x=Math.PI/2;
  mesh(g,'Camera lens glass',new T.CircleGeometry(.088,24),lens,[0,0,.372]);
  box(g,'Camera matte box',cameraMat,[0,.13,.36],[.32,.045,.22]);
  for(const sign of [-1,1])box(g,'Camera matte box side',cameraMat,[sign*.142,0,.36],[.025,.23,.15]);
  line(g,'Top carrying handle',[[-.14,.13,0],[-.14,.24,0],[.14,.24,0],[.14,.13,0]],.028,trim);
  box(g,'Flip out camera monitor frame',cameraMat,[-.275,.11,.02],[.15,.19,.035]);
  box(g,'Camera monitor image',screen,[-.275,.11,.042],[.123,.153,.012]);
  ball(g,'Red recording lamp',red,[.145,.076,.177],[.023,.023,.012]);
  const mic=mesh(g,'Shotgun microphone',new T.CylinderGeometry(.026,.026,.29,10),cameraMat,[.10,.17,.17]);mic.rotation.x=Math.PI/2;
  return g;
 }
 function boomProp(){
  const g=new T.Group();g.name='Overhead boom microphone';
  line(g,'Long carbon fibre boom pole',[[-.36,-.10,-.35],[.02,.50,.575],[.40,1.10,1.50]],.023,cameraMat);
  line(g,'Boom microphone cable',[[-.37,-.12,-.35],[-.015,.47,.58],[.375,1.075,1.49],[.39,1.04,1.69]],.009,ink);
  const mount=mesh(g,'Boom mic shock mount',new T.TorusGeometry(.067,.012,6,14),trim,[.40,1.10,1.56]);
  const microphone=mesh(g,'Gray furry boom windscreen',new T.CapsuleGeometry(.072,.36,4,12),trim,[.40,1.10,1.71]);microphone.rotation.x=Math.PI/2;
  for(let i=0;i<14;i++){
   const a=i*2.4;
   ball(g,'Boom windscreen soft tufts',trim,[.40+Math.cos(a)*.065,1.10+Math.sin(a)*.065,1.52+(i%7)*.06],[.017,.017,.025]);
  }
  return g;
 }
 function makeCrew(id,uv,scale,index,{distressed=false}={}){
  const tiny=scale<1,periodScare=distressed||(!tiny&&index===2),boom=!tiny&&index===1;
  const model=makeStickman(null,{faceBuilder:(...args)=>faceBuilder(...args,periodScare)});model.root.name=tiny?'Tiny angry fireplace cameraman':'Distressed patio camera operator '+(index+1);
  model.root.position.set(...world(...uv,FILM_CREW.floor+(tiny?.03:0)));model.root.scale.setScalar(scale);
  model.root.userData={id,role:'camera operator',hostile:false,characterSource:tiny?'makeStickman / The Leaky Pad, one-third size':'makeStickman / The Mountains',dialogue:tiny?[FIREPLACE_COMPLAINT]:[...FILM_CREW_LINES]};
  if(periodScare)model.root.userData.expression='Scared period-reaction face';
  model.faceColor=tiny&&!distressed?0xff344d:null;
  if(model.faceColor!==null)model.head.children.find(o=>o.isMesh&&o.material.isMeshStandardMaterial).material.color.set(model.faceColor);
  const facing=tiny?world(832,751):world(...FILM_CREW.patioFacing);
  model.root.rotation.y=Math.atan2(facing[0]-model.root.position.x,facing[2]-model.root.position.z);group.add(model.root);
  // Keep the ordinary torso, head, legs and idle, with jointed camera-holding arms.
  const arms=[-1,1].map(sign=>({sign,upper:mesh(model.body,'Camera operator upper arm',cylinder,ink),fore:mesh(model.body,'Camera operator forearm',cylinder,ink),hand:ball(model.body,'Camera operator hand',ink,[0,0,0],[.051,.051,.051])}));
  const prop=boom?boomProp():cameraProp();model.body.add(prop);
  const grips=boom?[[-.269,.044,-.128],[-.117,.284,.242]]:[[-.19,-.045,-.015],[.19,-.045,-.015]];
  if(boom){model.root.name='Distressed patio boom operator';model.root.userData.role='boom microphone operator';}
  const anchor=new T.Object3D();anchor.name='Speech anchor';anchor.position.set(0,2.38,0);model.body.add(anchor);
  return {id,group:model.root,model,camera:prop,prop,grips,boom,arms,anchor,scale,index,tiny,distressed,running:false,speech:null};
 }
 const crew=FILM_CREW.patio.map((uv,i)=>makeCrew('patio-camera-'+i,uv,1,i));
 const tiny=makeCrew('tiny-fireplace-camera',FILM_CREW.tiny,FILM_CREW.tinyScale,3),actors=[...crew,tiny];
 // A small, low cartoon spill on the rug, clear of the chairs and doorways.
 const spillMat=mat('Small olive ochre vomit',0x898043,{roughness:.37}),fleck=mat('Vomit small flecks',0xb29a54,{roughness:.65});
 mess.position.set(...world(...FILM_CREW.vomit,FILM_CREW.floor+.032));
 mess.userData={kind:'small cartoon vomit patch',radius:.48};
 const outline=[];for(let i=0;i<32;i++){const a=i/32*Math.PI*2,r=.36+.046*Math.sin(a*5)+.026*Math.cos(a*3+.7);outline.push(new T.Vector2(Math.cos(a)*r,Math.sin(a)*r*.69));}
 const spill=new T.ShapeGeometry(new T.Shape(outline),12);spill.rotateX(-Math.PI/2);mesh(mess,'Small irregular vomit patch',spill,spillMat);
 for(const [x,z,r] of [[-.08,.05,.11],[.10,.01,.085],[.22,-.055,.06],[-.19,-.07,.052],[.41,.055,.038],[-.40,-.02,.027]])ball(mess,'Low spill glob',spillMat,[x,.014,z],[r,.012,r*.65]);
 for(let i=0;i<9;i++){const a=i*2.4,r=.09+(i%3)*.07;ball(mess,'Small spill fleck',fleck,[Math.cos(a)*r,.027,Math.sin(a)*r*.6],[.012,.005,.009]);}
 const A=new T.Vector3(),B=new T.Vector3(),grip=new T.Vector3();
 function segment(o,a,b){A.set(...a);B.set(...b).sub(A);o.position.copy(A).addScaledVector(B,.5);o.scale.set(.04,B.length(),.04);o.quaternion.setFromUnitVectors(up,B.normalize());}
 function pose(actor,time,viewCamera){
  const {model,camera:prop,arms,index,tiny:small,boom}=actor,t=time+(index*1.7),rate=small?4.9:3.3;
  model.animate(t,actor.running,small&&!actor.distressed,small&&!actor.distressed?null:{kind:'period'});
  // Replace panic's empty waving arms with hands that remain attached to cameras.
  model.limbs[1].visible=model.limbs[3].visible=false;
  for(const child of model.body.children)if(child.isGroup&&child!==model.head&&!model.limbs.includes(child)&&child!==prop)child.visible=false;
  prop.position.set((boom?.12:.42)*Math.sin(t*rate*.57),(boom?1.72:1.49)+(boom?.08:.25)*Math.sin(t*rate),boom?.39:.53);
  prop.rotation.set((boom?0:-.18)+(boom?.045:.22)*Math.sin(t*rate*.81),(boom?.12:.5)*Math.sin(t*rate*.69),(boom?.055:.25)*Math.cos(t*rate));
  for(const [i,arm] of arms.entries()){
   grip.set(...actor.grips[i]).applyEuler(prop.rotation).add(prop.position);
   const elbow=[arm.sign*.34,1.24+(grip.y-1.5)*.55,.27];
   segment(arm.upper,[0,1.37,0],elbow);segment(arm.fore,elbow,grip.toArray());arm.hand.position.copy(grip);
  }
  if(viewCamera)model.lookAtCamera(viewCamera,false);
 }
 let elapsed=0,nextLine=2,lineIndex=0,armed=true,cooldown=0;
 function update(dt,{camera=null,playerPosition=null}={}){
  if(actors.every(a=>a.escapeControlled))return;
  elapsed+=dt;cooldown=Math.max(0,cooldown-dt);
  for(const actor of actors){if(actor.speech){actor.speech.remaining-=dt;if(actor.speech.remaining<=0)actor.speech=null;}pose(actor,elapsed,camera);}
  if(elapsed>=nextLine){
   const text=FILM_CREW_LINES[lineIndex%FILM_CREW_LINES.length],seconds=Math.max(5.5,Math.min(12,text.split(/\s+/).length/3+1.5));
   crew.forEach(a=>a.speech=null);say(crew[lineIndex%crew.length],text,seconds);nextLine=elapsed+seconds+2.8;lineIndex++;
  }
  const distance=playerPosition?playerPosition.distanceTo(tiny.model.root.position):Infinity;
  if(distance>FILM_CREW.rearmRadius)armed=true;
  const uv=playerPosition?plan(playerPosition.x,playerPosition.z):null;
  const inRoom=uv&&uv[0]>=777&&uv[0]<=894&&uv[1]>=744&&uv[1]<=810;
  if(inRoom&&distance<FILM_CREW.triggerRadius&&armed&&cooldown===0){say(tiny,FIREPLACE_COMPLAINT,FILM_CREW.complaintSeconds);armed=false;cooldown=FILM_CREW.cooldown;}
 }
 function reset(){elapsed=0;nextLine=2;lineIndex=0;armed=true;cooldown=0;actors.forEach(a=>a.speech=null);}
 update(0);
 return {group,crew,tiny,actors,mess,spec:FILM_CREW,update,reset,createCameraOperator:makeCrew,poseCameraOperator:pose};
}

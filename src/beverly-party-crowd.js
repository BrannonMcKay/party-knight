import {makeStickman} from './world.js';
import {say} from './stickman-behavior.js';
import {world,LEVELS} from './beverly-layout.js';

export const EXTRA_PASSENGERS=Object.freeze([
 {id:'party-guest-3',outfit:'dress',color:0xc4499d,destination:'churros'},
 {id:'party-guest-4',outfit:'top-hat',color:0x8664bb,destination:'bar'},
 {id:'party-guest-5',outfit:'dress',color:0x329e99,destination:'bar'},
 {id:'party-guest-6',outfit:'top-hat',color:0xca9a45,destination:'bar'},
 {id:'party-guest-7',outfit:'dress',color:0x7359b6,destination:'churros'},
 {id:'party-guest-8',outfit:'bow-tie',color:0xce5969,destination:'bar'},
 {id:'party-guest-9',outfit:'dress',color:0x386bbe,destination:'bar'},
 {id:'party-guest-10',outfit:'top-hat',color:0x439d8e,destination:'bar'}
]);

// Adjacent nodes follow the dry perimeter, never a chord through the fountain.
export const PATIO_PARTY_LOOP=[[900,520],[942,520],[950,565],[950,620],[943,666],[902,679],[855,666],[850,616],[850,563],[852,520]];
// Keep the two existing drinkers beside the maze walls during the layout pass.
export const POOL_PARTY_PATHS=[[[1410,519],[1480,519],[1550,519],[1620,519]],[[1410,681.5],[1480,681.5],[1550,681.5],[1620,681.5]]];

function random(seed){let n=seed>>>0;return ()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}

// Random destinations and pauses on a connected, obstacle-cleared walking graph.
// Absolute time makes a replay or a large preview step match ordinary frame updates.
export function makePartyWander(T,uvs,y,{seed=1,start=0,closed=false,speed=.65}={}){
 const points=uvs.map(p=>new T.Vector3(...world(...p,y)));
 let rng,from,to,began,end,pause;
 function choose(time){
  const choices=[from-1,from+1].map(i=>closed?(i+points.length)%points.length:i).filter(i=>i>=0&&i<points.length);
  to=choices[Math.floor(rng()*choices.length)];began=time;end=time+points[from].distanceTo(points[to])/speed;pause=1+rng()*3.8;
 }
 function reset(){rng=random(seed);from=start;choose(0);}
 function sample(time){
  time=Math.max(0,time);if(time<began)reset();
  while(time>end+pause){from=to;choose(end+pause);}
  const moving=time<end,t=Math.min(1,(time-began)/(end-began));
  return {position:points[from].clone().lerp(points[to],t),direction:points[to].clone().sub(points[from]).normalize(),moving};
 }
 reset();return {points,sample,reset};
}

export function createPartyGuestFactory(T,materials){
 const mat=(name,color,extra={})=>materials[name]??(materials[name]=new T.MeshStandardMaterial({name,color,roughness:.65,...extra}));
 const ink=mat('Party guest black ink',0x282332),ivory=mat('Party guest tooth ivory',0xfff6db),gold=mat('Party guest gold trim',0xe7bb64,{metalness:.4});
 const glass=mat('Party guest glass',0xc9edee,{transparent:true,opacity:.45,roughness:.15,depthWrite:false}),amber=mat('Party guest amber drink',0xe5a638),ice=mat('Party guest ice',0xdffaff,{roughness:.2});
 const pastry=mat('Party guest churro',0xc98a35),sugar=mat('Party guest churro sugar',0xf0d39a);
 const sphere=new T.SphereGeometry(1,12,8),cylinder=new T.CylinderGeometry(1,1,1,8),up=new T.Vector3(0,1,0);
 function mesh(g,n,geometry,m,p=[0,0,0],scale=[1,1,1]){const o=new T.Mesh(geometry,m);o.name=n;o.position.set(...p);o.scale.set(...scale);o.castShadow=o.receiveShadow=true;g.add(o);return o;}
 const ball=(g,n,p,scale,m)=>mesh(g,n,sphere,m,p,scale);
 function line(g,n,points,r,m){return mesh(g,n,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),16,r,5,false),m);}
 function segment(o,a,b,r=.04){const p=new T.Vector3(...a),v=new T.Vector3(...b).sub(p);o.position.copy(p).addScaledVector(v,.5);o.scale.set(r,v.length(),r);o.quaternion.setFromUnitVectors(up,v.normalize());}
 return function create(spec,index){
  let smile,burpMouth;
  function faceBuilder(parent,kind,r,y,z){
   const g=new T.Group();g.name='Party '+kind+' face';g.position.set(0,y,z);g.material=ink;parent.add(g);
   for(const sign of [-1,1])ball(g,'Happy stickman eye',[sign*.12,.075,.01],[.025,.041,.011],ink);
   const mouth=line(g,'Happy curved smile',[[-.15,-.08,.01],[-.08,-.16,.01],[0,-.18,.01],[.08,-.16,.01],[.15,-.08,.01]],.012,ink);
   if(kind==='smile'){smile=mouth;burpMouth=ball(g,'Burping mouth',[0,-.135,.015],[.062,.073,.012],ink);burpMouth.visible=false;}
   return g;
  }
  const model=makeStickman(null,{faceBuilder}),g=model.root;
  g.scale.setScalar(.9); // The first, authored passenger remains a little taller (without hats).
  g.name=spec.name??'Party bus guest '+(index+1);g.userData={id:spec.id,role:'party guest',hostile:false,characterSource:'makeStickman / The Mountains',outfit:spec.outfit,destination:spec.destination,movement:spec.destination==='bar'?'Walk through house to bar, collect drink, then wander on patio':'Walk to churro tent'};
  const clothes=mat('Party fabric '+spec.color.toString(16),spec.color),accessories=new T.Group();accessories.name='Party clothing';model.body.add(accessories);
  if(spec.outfit==='dress'){
   mesh(accessories,'Flared party dress',new T.CylinderGeometry(.125,.33,.64,16),clothes,[0,.84,0]);
   mesh(accessories,'Party dress bodice',new T.CylinderGeometry(.18,.126,.31,12),clothes,[0,1.31,0]);
   mesh(accessories,'Gold dress belt',new T.CylinderGeometry(.14,.14,.04,12),gold,[0,1.17,0]);
   for(const sign of [-1,1])line(accessories,'Dress strap',[[sign*.12,1.4,.05],[sign*.15,1.47,0],[sign*.12,1.4,-.06]],.026,clothes);
  }else if(spec.outfit!=='none'){
   for(const sign of [-1,1])mesh(accessories,'Bright bow tie',new T.ConeGeometry(.076,.14,3),clothes,[sign*.065,1.43,.066]).rotation.z=sign*Math.PI/2;
  }
  const hat=new T.Group();hat.name='Party top hat';model.head.add(hat);hat.visible=spec.outfit==='top-hat';
  if(hat.visible){
   mesh(hat,'Top hat brim',new T.CylinderGeometry(.44,.44,.045,20),ink,[0,.32,0]);
   mesh(hat,'Top hat crown',new T.CylinderGeometry(.285,.30,.40,20),ink,[0,.54,0]);
   mesh(hat,'Satin hat ribbon',new T.CylinderGeometry(.303,.305,.065,20),clothes,[0,.385,0]);
  }
  const arm=[mesh(model.body,'Holding upper arm',cylinder,ink),mesh(model.body,'Holding forearm',cylinder,ink)];
  const hand=new T.Group();hand.name='Party guest prop hand';model.body.add(hand);ball(hand,'Holding hand',[0,0,0],[.052,.054,.048],ink);
  const drink=new T.Group();drink.name='Held party drink';hand.add(drink);
  mesh(drink,'Clear tumbler',new T.CylinderGeometry(.077,.062,.20,14,1,true),glass,[0,.08,0]);
  mesh(drink,'Tumbler base',new T.CylinderGeometry(.062,.062,.008,14),glass,[0,-.02,0]);
  mesh(drink,'Amber drink',new T.CylinderGeometry(.064,.057,.125,14),amber,[0,.045,0]);
  mesh(drink,'Ice cube',new T.BoxGeometry(.052,.043,.047),ice,[.018,.12,0]).rotation.y=.5;
  const churro=new T.Group();churro.name='Guest held churro';hand.add(churro);
  mesh(churro,'Golden churro',new T.CylinderGeometry(.029,.029,.40,10),pastry,[0,.13,0]);
  for(let i=0;i<6;i++){const a=i*Math.PI/3;mesh(churro,'Toasted churro ridge',new T.CylinderGeometry(.006,.006,.40,5),sugar,[Math.cos(a)*.026,.13,Math.sin(a)*.026]);}
  const anchor=new T.Object3D();anchor.name='Party guest speech anchor';anchor.position.y=hat.visible?2.80:2.43;g.add(anchor);
  const guest={id:spec.id,group:g,model,body:model.body,height:(hat.visible?2.60:2.27)*.9,rigidParts:[accessories,hat],drink,churro,hand,anchor,speechName:'Party guest',speech:null,destination:spec.destination,hasDrink:false,hasChurro:false,activity:'waiting',distance:0};
  const rng=random(103+index*67);let nextBurp=8+index*2.7,lastSocial=0,burpUntil=0;
  function reset(){guest.hasDrink=false;guest.hasChurro=false;guest.speech=null;nextBurp=8+index*2.7;lastSocial=burpUntil=0;pose(0,false);}
  function pose(time,moving=true,exiting=false){
   const burping=time<burpUntil,sip=guest.hasDrink&&!moving&&!burping?Math.max(0,Math.sin(time*.9+index))**6:0;
   model.animate(time+index,moving,false,null,exiting?.38:.65);
   model.body.scale.y=exiting?.80:1; // Duck beneath the coach header, including top hats.
   model.body.rotation.z=moving?Math.sin(time*3+index)*.018:Math.sin(time*1.8+index)*.026;
   const holding=guest.hasDrink||guest.hasChurro;drink.visible=guest.hasDrink;churro.visible=guest.hasChurro;hand.visible=holding;arm.forEach(o=>o.visible=holding);
   if(holding){
    model.limbs[1].visible=false;
    const bite=guest.hasChurro?Math.max(0,Math.sin(time*1.1+index))**4:0;
    hand.position.set(-.35+(sip+bite)*.29,1.19+sip*.41+bite*.23,.34+(sip+bite)*.20);
    hand.rotation.set(sip*.65+bite*.80,0,0);
    const elbow=[-.35,1.10+(sip+bite)*.16,.14];segment(arm[0],[0,1.37,0],elbow);segment(arm[1],elbow,hand.position.toArray());
   }
   smile.visible=!burping;burpMouth.visible=burping;
   if(burping){model.body.rotation.x=-.045*Math.sin((burpUntil-time)*8);model.head.rotation.x=-.06;}
   else model.head.rotation.x=0;
  }
  function social(time){
   if(time<lastSocial){nextBurp=time+8+index*2.7;guest.speech=null;burpUntil=0;}
   const dt=Math.max(0,time-lastSocial);lastSocial=time;
   if(guest.speech){guest.speech.remaining-=dt;if(guest.speech.remaining<=0)guest.speech=null;}
   if(guest.hasDrink&&time>=nextBurp){say(guest,index%2?'Burrrp!':'*burp*',1.6);burpUntil=time+1.05;nextBurp=time+17+rng()*18;}
  }
  Object.assign(guest,{pose,social,reset});reset();return guest;
 };
}

export function buildPoolParty(T,root,groups,create){
 const group=new T.Group();group.name='Pool_party_guests';group.userData={dynamic:true};root.add(group);groups.Pool_party_guests=group;
 const actors=POOL_PARTY_PATHS.map((points,i)=>{
  const a=create({id:'pool-party-'+i,name:'Pool party guest '+(i+1),outfit:i?'top-hat':'dress',color:i?0x579bb2:0xc45e85,destination:'pool'},10+i);
  a.group.userData.movement='Wander on dry pool deck with a drink';group.add(a.group);a.wander=makePartyWander(T,points,LEVELS.pool,{seed:97+i,start:i?2:1,speed:.55+i*.08});return a;
 });
 let elapsed=0;
 function update(dt){elapsed+=Math.max(0,dt);for(const a of actors){if(a.escapeControlled)continue;const p=a.wander.sample(elapsed);a.group.position.copy(p.position);const q=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.atan2(p.direction.x,p.direction.z));a.group.quaternion.slerp(q,1-Math.exp(-Math.max(dt,.02)*4));a.hasDrink=true;a.activity=p.moving?'wandering':'enjoying-drink';a.social(elapsed);a.pose(elapsed,p.moving);}}
 function reset(){elapsed=0;actors.forEach(a=>{a.reset();a.wander.reset();});update(0);}
 reset();return {group,actors,update,reset};
}

// Shared aftermath for every drowning in this estate, regardless of the actor
// or pool. Call drown(actor, {bed}) at death; update uses active game time.
export const DROWNING_REMAINS={bodySeconds:10,sinkSeconds:1.1};

export function buildDrowningRemains(T,root,groups){
 const group=new T.Group();group.name='Drowned_character_skeletons';group.userData={dynamic:true,...DROWNING_REMAINS};root.add(group);groups.Drowned_character_skeletons=group;
 const bone=new T.MeshStandardMaterial({name:'Cartoon skeleton ivory',color:0xeee3bd,roughness:.7});
 const dark=new T.MeshStandardMaterial({name:'Cartoon skeleton eye sockets',color:0x302f39,roughness:.9});
 const sphere=new T.SphereGeometry(1,12,8),rod=new T.CylinderGeometry(1,1,1,8),up=new T.Vector3(0,1,0),records=new Map();let deaths=[];
 function skeleton(name,height){
  const g=new T.Group();g.name=name+' sinking skeleton';
  function ball(n,p,size,mat=bone){const m=new T.Mesh(sphere,mat);m.name=n;m.position.set(...p);m.scale.set(...size);g.add(m);return m;}
  function link(n,a,b,r=.028){const p=new T.Vector3(...a),d=new T.Vector3(...b).sub(p),m=new T.Mesh(rod,bone);m.name=n;m.position.copy(p).addScaledVector(d,.5);m.scale.set(r,d.length(),r);m.quaternion.setFromUnitVectors(up,d.normalize());g.add(m);}
  ball('Big cartoon skull',[0,1.70,0],[.19,.205,.16]);
  for(const s of [-1,1])ball('Round eye socket',[s*.074,1.725,.145],[.048,.055,.020],dark);
  ball('Skull nose',[0,1.665,.164],[.023,.027,.011],dark);
  ball('Toothy skull grin',[0,1.601,.143],[.09,.033,.018],dark);
  for(let i=0;i<6;i++)ball('Silly square tooth',[(i-2.5)*.026,1.602,.16],[.010,.025,.012]);
  link('Spine',[0,.89,0],[0,1.51,0],.035);
  for(let i=0;i<6;i++)ball('Spine joint',[0,.96+i*.084,-.012],[.053,.022,.029]);
  link('Collarbone',[-.20,1.40,0],[.20,1.40,0]);
  for(let i=0;i<5;i++){
   const y=1.35-i*.065,w=.17-i*.012;
   const curve=new T.CatmullRomCurve3([new T.Vector3(-w,y,0),new T.Vector3(-w*.78,y-.025,.095),new T.Vector3(0,y-.045,.13),new T.Vector3(w*.78,y-.025,.095),new T.Vector3(w,y,0)]);
   const m=new T.Mesh(new T.TubeGeometry(curve,12,.015,6,false),bone);m.name='Rounded cartoon rib';g.add(m);
  }
  for(const s of [-1,1]){
   ball('Hip bone',[s*.086,.86,0],[.095,.074,.045]);
   link('Upper arm',[s*.20,1.40,0],[s*.30,1.08,.07]);
   link('Forearm',[s*.30,1.08,.07],[s*.36,.91,.15],.022);
   ball('Hand bones',[s*.36,.90,.15],[.049,.062,.024]);
   for(let i=0;i<4;i++)link('Finger',[s*.36+(i-1.5)*.016,.87,.16],[s*.36+(i-1.5)*.018,.82,.18],.008);
   link('Thigh',[s*.10,.83,0],[s*.13,.48,.06],.038);
   ball('Knee',[s*.13,.48,.06],[.047,.044,.046]);
   for(const offset of [-.018,.018])link('Lower leg bone',[s*.13+offset,.46,.06],[s*.14+offset,.11,0],.016);
   ball('Foot bones',[s*.14,.045,.07],[.061,.037,.135]);
  }
  // Bake actor proportions into geometry so its root can copy the body's pose.
  const scale=height/1.905;g.traverse(o=>{if(o.isMesh){o.position.multiplyScalar(scale);o.scale.multiplyScalar(scale);o.castShadow=false;o.receiveShadow=true;}});
  g.visible=false;group.add(g);return g;
 }
 function register(actor,{height=1.95}={}){
  if(records.has(actor))return records.get(actor);
  const record={actor,skeleton:skeleton(actor.speechName||actor.group.name||'Guest',height),state:'idle',age:0,bed:0,originalVisible:true,from:null,to:null};records.set(actor,record);return record;
 }
 function drown(actor,{bed,height}={}){
  if(!Number.isFinite(bed))throw new Error('A drowning needs the receiving pool bed height.');
  const r=register(actor,{height});if(r.state!=='idle')return r;
  Object.assign(r,{state:'body',age:0,bed,originalVisible:actor.group.visible});deaths.push(actor);return r;
 }
 function update(dt){
  for(const r of records.values()){
   if(r.state==='idle')continue;r.age+=Math.max(0,dt);
   if(r.state==='body'&&r.age+1e-8>=DROWNING_REMAINS.bodySeconds){
    const body=r.actor.group,s=r.skeleton;body.updateWorldMatrix(true,false);group.updateWorldMatrix(true,false);
    s.matrix.copy(group.matrixWorld).invert().multiply(body.matrixWorld);s.matrix.decompose(s.position,s.quaternion,s.scale);
    s.visible=true;body.visible=false;r.from=s.position.clone();s.updateWorldMatrix(true,true);
    const bottom=new T.Box3().setFromObject(s).min.y;r.to=r.from.clone();r.to.y+=r.bed+.025-bottom;r.state='sinking';
   }
   if(r.state==='sinking'){
    const t=Math.min(1,Math.max(0,(r.age-DROWNING_REMAINS.bodySeconds)/DROWNING_REMAINS.sinkSeconds));
    r.skeleton.position.copy(r.from).lerp(r.to,t*t);if(t===1)r.state='resting';
   }
  }
 }
 function reset(){deaths=[];for(const r of records.values()){if(r.state!=='idle')r.actor.group.visible=r.originalVisible;r.state='idle';r.age=0;r.skeleton.visible=false;r.from=r.to=null;}}
 return {group,records,register,drown,update,reset,consumeDeaths(){const events=deaths;deaths=[];return events;}};
}

import {Font} from '../vendor/FontLoader.js';
import fontData from '../vendor/beverly-font.js';

export function createPartyKnife(T){
 const g=new T.Group();g.name='Party guest knife';
 const steel=new T.MeshStandardMaterial({color:0xcde5ef,metalness:.65,roughness:.32});
 const grip=new T.Mesh(new T.CylinderGeometry(.028,.028,.17,8),new T.MeshStandardMaterial({color:0x643240}));
 grip.position.y=-.025;
 const guard=new T.Mesh(new T.BoxGeometry(.13,.025,.055),steel);guard.position.y=.06;
 const blade=new T.Shape();
 blade.moveTo(-.045,.07);blade.lineTo(.052,.07);blade.lineTo(.052,.34);
 blade.lineTo(-.015,.48);blade.lineTo(-.045,.32);blade.closePath();
 g.add(grip,guard,new T.Mesh(new T.ExtrudeGeometry(blade,{depth:.018,bevelEnabled:false}),steel));
 return g;
}

// Geometry-only expressions and counters remain readable at night and export
// without a canvas. No shared actor materials are recolored for a spirit.
export function createEscapeVisuals(T,parent){
 const ink=new T.MeshBasicMaterial({color:0x292333}),knifeTemplate=createPartyKnife(T);
 knifeTemplate.visible=false;
 const font=new Font(fontData);
 const mesh=(g,geo,mat,p=[0,0,0],scale=[1,1,1])=>{const m=new T.Mesh(geo,mat);m.position.set(...p);m.scale.set(...scale);g.add(m);return m;};
 function stroke(g,a,b,r=.014,mat=ink){const av=new T.Vector3(...a),d=new T.Vector3(...b).sub(av),m=mesh(g,new T.CylinderGeometry(r,r,d.length(),6),mat);m.position.copy(av).addScaledVector(d,.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return m;}
 function drink(){const g=new T.Group();g.name='Escape held drink';mesh(g,new T.CylinderGeometry(.066,.055,.18,12,1,true),new T.MeshStandardMaterial({color:0xc7e5f0,transparent:true,opacity:.5,depthWrite:false}),[0,.04,0]);mesh(g,new T.CylinderGeometry(.054,.047,.11,12),new T.MeshStandardMaterial({color:0xe5a638}),[0,.02,0]);return g;}
 function faces(head,r=.37,z=.442,normalFace=null){
  const groups={};
  for(const kind of ['happy','dead','scared']){
   const g=new T.Group();g.name='Escape face '+kind;g.position.z=z;g.scale.setScalar(r/.37);g.visible=false;head.add(g);groups[kind]=g;
   // The existing spherical head is the face surface; never add a face plate.
   // Keep a regular stickman's own smile when replacing just its eyes with Xs.
   if(kind==='dead'&&normalFace){const mouth=normalFace.clone(true);mouth.name='Original smile with X eyes';mouth.position.set(0,0,0);mouth.visible=true;mouth.traverse(o=>{if(/eye|brow/i.test(o.name))o.visible=false;});g.add(mouth);}
   for(const sign of [-1,1]){
    const x=sign*.125;
    if(kind==='dead')for(const d of [-1,1])stroke(g,[x-.046,.08-d*.048,.01],[x+.046,.08+d*.048,.01],.017).name='Drowned X eye';
    else if(kind==='scared'){mesh(g,new T.SphereGeometry(1,10,8),ink,[x,.085,.015],[.036,.052,.01]);stroke(g,[x-.052,.17,.01],[x+.052,.20,.01]);}
    else for(let j=0;j<7;j++){const a=Math.PI*j/7,b=Math.PI*(j+1)/7;stroke(g,[x+Math.cos(a)*.055,.05+Math.sin(a)*.04,.01],[x+Math.cos(b)*.055,.05+Math.sin(b)*.04,.01],.012);}
   }
   if(kind==='scared')mesh(g,new T.SphereGeometry(1,14,8),ink,[0,-.13,.015],[.075,.105,.014]);
   else if(kind!=='dead'||!normalFace){const points=[[-.18,-.055,.014],[-.10,-.17,.014],[0,-.20,.014],[.10,-.17,.014],[.18,-.055,.014]];mesh(g,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),24,.016,6),ink);}
  }return groups;
 }
 function countdown(maximum=3){
  const group=new T.Group();group.name='Pursuer drowning countdown';parent.add(group);group.visible=false;
  const disk=mesh(group,new T.CircleGeometry(.28,24),new T.MeshBasicMaterial({color:0x292436,transparent:true,opacity:.88,depthTest:false,depthWrite:false}));disk.renderOrder=12;
  // Keep both layers in the transparent render pass, with digits after the
  // badge. Otherwise Three draws the translucent badge over opaque numbers.
  const digits=Array.from({length:maximum},(_,i)=>i+1).map(value=>{const geo=new T.ShapeGeometry(font.generateShapes(String(value),value>=10?.28:.38));geo.computeBoundingBox();const center=geo.boundingBox.getCenter(new T.Vector3());geo.translate(-center.x,-center.y,.01);const m=mesh(group,geo,new T.MeshBasicMaterial({color:0xffedbd,transparent:true,opacity:1,depthTest:false,depthWrite:false}));m.renderOrder=13;return m;});
  return {group,digits,value:null,set(value){this.value=value;group.visible=value!==null;digits.forEach((m,i)=>m.visible=i+1===value);}};
 }
 function spirit(actor){
  actor.group.updateWorldMatrix(true,true);const root=actor.group.clone(true);root.name=actor.group.name+' spirit';parent.add(root);
  root.position.copy(actor.group.getWorldPosition(new T.Vector3()));root.quaternion.copy(actor.group.getWorldQuaternion(new T.Quaternion()));root.scale.copy(actor.group.getWorldScale(new T.Vector3()));
  const palette=new Map();root.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;o.renderOrder=7;const clone=m=>{if(!palette.has(m)){const n=m.clone();n.transparent=true;n.opacity=.5;n.depthWrite=false;palette.set(m,n);}return palette.get(m);};o.material=Array.isArray(o.material)?o.material.map(clone):clone(o.material);}if(/floating name|speech anchor|countdown|Held party drink|Escape held drink|Party guest knife/i.test(o.name))o.visible=false;});
  const head=root.getObjectByName(actor.head.name),expressions={};for(const kind of ['happy','dead','scared']){expressions[kind]=root.getObjectByName('Escape face '+kind);if(expressions[kind])expressions[kind].visible=kind==='happy';}
  // Feathers fan upward from the back; the animation compensates for body tilt.
  const wings=new T.Group();wings.name='Angel feather wings';root.add(wings);wings.position.set(0,actor.localHeight*.58,-.12);wings.visible=false;
  const featherMaterial=new T.MeshBasicMaterial({color:0xf5edff,transparent:true,opacity:.8,depthWrite:false});
  for(const sign of [-1,1])for(let i=0;i<7;i++){
   const f=mesh(wings,new T.SphereGeometry(1,10,8),featherMaterial,[sign*(.16+i*.065),.08+i*.025,-.12-i*.035],[.10,.31-i*.016,.035]);f.rotation.set(-.65,0,-sign*(.28+i*.13));
  }
  const halo=mesh(head,new T.TorusGeometry(.30,.025,8,36),new T.MeshBasicMaterial({color:0xffdd72,transparent:true,opacity:.95,depthWrite:false}),[0,.53,0]);halo.name='Spirit golden halo';halo.rotation.x=Math.PI/2-.4;halo.visible=false;
  return {root,head,expressions,wings,halo,materials:[...palette.values()],dispose(){root.removeFromParent();palette.forEach(m=>m.dispose());wings.traverse(o=>{if(o.isMesh)o.geometry.dispose();});featherMaterial.dispose();halo.geometry.dispose();halo.material.dispose();}};
 }
 return {knife:()=>knifeTemplate.clone(),drink,faces,countdown,spirit};
}

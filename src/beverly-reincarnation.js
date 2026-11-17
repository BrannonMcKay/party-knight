import {Font} from '../vendor/FontLoader.js';
import fontData from '../vendor/beverly-font.js';
import {makeStickman} from './world.js';
import {createPartyKnife} from './beverly-escape-visuals.js';

export function buildBusEndingCast(T, model, parent) {
 const font = new Font(fontData);
 const sphere = new T.SphereGeometry(1, 16, 12);
 const material = (color, glow = .12) => new T.MeshStandardMaterial({color, emissive:color, emissiveIntensity:glow, roughness:.78});
 const ink = material(0x181827), pearl = material(0xffefcf), chestnut = material(0x94513a), cream = material(0xf2c696);
 function group(owner, name) {const g=new T.Group(); g.name=name; owner.add(g); return g;}
 function mesh(owner, geo, mat, x,y,z) {
  const o=new T.Mesh(geo,mat); o.position.set(x,y,z); owner.add(o); return o;
 }
 function oval(owner, mat, x,y,z, sx,sy,sz) {
  const o=mesh(owner,sphere,mat,x,y,z); o.scale.set(sx,sy,sz); return o;
 }
 function lettering(owner, text, size, mat, y, z, maxWidth=Infinity) {
  const geo=new T.ShapeGeometry(font.generateShapes(text,size),4); geo.center(); geo.computeBoundingBox();
  const o=mesh(owner,geo,mat,0,y,z);
  o.scale.setScalar(Math.min(1,maxWidth/(geo.boundingBox.max.x-geo.boundingBox.min.x))); return o;
 }
 const labelInk = new T.MeshBasicMaterial({color:0xfff3de});
 const outline = new T.MeshBasicMaterial({color:0x302336});
 function animal(name) {
  const root=group(parent,name), body=group(root,name+' in flight'), label=group(root,name+' name');
  const text=lettering(label,name,.17,labelInk,0,0);
  for(const [x,y] of [[-.006,0],[.006,0],[0,.006],[0,-.006]]){
   const edge=mesh(label,text.geometry,outline,x,y,-.004);edge.renderOrder=-1;
  }
  root.visible=false; return {root,body,label};
 }
 const loon=animal('Alex'), squirrel=animal('Emily');
 const bird=loon.body, fur=squirrel.body;
 const footShadow=mesh(loon.root,new T.CircleGeometry(1,24),new T.MeshBasicMaterial({color:0x23172d,transparent:true,opacity:.25,depthWrite:false}),0,-.234,0);
 footShadow.rotation.x=-Math.PI/2;footShadow.scale.set(.31,.49,1);
 oval(bird,ink,0,.10,0,.29,.22,.51); oval(bird,pearl,0,.075,.13,.265,.17,.41);
 oval(bird,ink,0,.39,.30,.15,.32,.155); oval(bird,ink,0,.64,.33,.20,.175,.22);
 const bill=mesh(bird,new T.ConeGeometry(.09,.36,6),ink,0,.63,.66); bill.rotation.x=Math.PI/2; bill.scale.y=1.12;
 const collar=oval(bird,pearl,0,.365,.31,.154,.067,.158); collar.rotation.x=-.22;
 const wings=[], feet=[], slate=material(0x625c68), ruby=material(0xda3f54);
 for(const side of [-1,1]){
  oval(bird,ruby,side*.175,.66,.40,.035,.037,.04);
  const pivot=group(bird,'Loon wing'); pivot.position.set(side*.16,.19,-.05);
  oval(pivot,ink,side*.31,0,-.05,.42,.07,.22).rotation.y=side*.18;
  for(let j=0;j<5;j++){
   oval(pivot,ink,side*(.48+j*.052),-.015,-.16+j*.055,.20,.032,.055).rotation.y=side*(.32-j*.07);
   oval(pivot,pearl,side*(.20+j*.065),.062,-.01+(j%2)*.08,.036,.014,.042);
  }
  wings.push(pivot);
  const leg=group(bird,'Loon paddling leg');leg.position.set(side*.145,0,-.17);
  oval(leg,slate,0,-.10,0,.034,.117,.04);
  const foot=oval(leg,slate,side*.015,-.215,.065,.086,.024,.15);foot.rotation.y=side*.15;
  for(let toe=-1;toe<=1;toe++)oval(leg,slate,toe*.055,-.218,.15,.022,.019,.085).rotation.y=toe*.27;
  feet.push(leg);
 }
 // Use the original print meshes from Alex's bath scene, including the cupid's bow.
 for(const [x,y,z,angle] of [[-.17,.59,.41,-1.05],[.17,.59,.41,1.05],[0,.75,.48,0]]){
  const kiss=model.guests.alex.kiss.clone(); kiss.position.set(x,y,z); kiss.rotation.set(-.15,angle,.15);
  kiss.scale.setScalar(1.45); kiss.visible=true; bird.add(kiss);
 }
 oval(fur,chestnut,0,0,0,.20,.18,.36); oval(fur,cream,0,-.075,.08,.175,.13,.29);
 const tail=oval(fur,chestnut,0,.09,-.47,.14,.15,.38); tail.rotation.x=.35;
 oval(fur,chestnut,0,.11,.28,.225,.205,.23); oval(fur,cream,0,.057,.45,.13,.095,.11);
 oval(fur,ink,0,.09,.545,.052,.04,.035);
 const eyes=model.materials['Emily brown eyes'], whites=model.materials['Emily eye whites'];
 for(const side of [-1,1]){
  oval(fur,chestnut,side*.14,.28,.22,.074,.101,.052);
  oval(fur,cream,side*.14,.29,.256,.046,.065,.019);
  oval(fur,whites,side*.095,.145,.462,.072,.078,.025);
  oval(fur,eyes,side*.098,.15,.48,.052,.064,.024);
  oval(fur,ink,side*.098,.151,.501,.026,.044,.01);
  oval(fur,pearl,side*.098-.011,.172,.511,.012,.013,.005);
  oval(fur,chestnut,side*.10,.228,.433,.071,.014,.015).rotation.z=-side*.16;
  // The scalloped patagium stretches between the outstretched fore and hind paws.
  const web=new T.Shape();
  web.moveTo(.11,.23);web.quadraticCurveTo(.27,.23,.51,.28);web.quadraticCurveTo(.35,.06,.43,-.07);
  web.quadraticCurveTo(.42,-.16,.48,-.26);web.quadraticCurveTo(.26,-.20,.11,-.23);web.closePath();
  const skin=new T.ShapeGeometry(web,8);skin.rotateX(Math.PI/2);
  const membrane=mesh(fur,skin,cream,0,-.025,0);membrane.scale.x=side;cream.side=T.DoubleSide;
  for(const end of [-1,1])oval(fur,chestnut,side*.36,.005,end*.19,.18,.047,.062).rotation.y=-side*end*.43;
 }
 function animateAnimals(time, motion, camera){
  const running=motion==='running',flapping=running||motion==='fluttering';
  footShadow.visible=running||motion==='standing'||motion==='talking';
  const stride=Math.sin(time*18),wingBeat=Math.sin(time*(running?17:10));
  bird.position.y=running?.055*Math.abs(stride):0;
  bird.rotation.set(running?.09:motion==='talking'?.055*Math.sin(time*9):0,0,running?.13*stride:0);
  feet.forEach((leg,i)=>{
   leg.visible=motion!=='swimming';
   leg.rotation.x=running?(i?stride:-stride)*.96:0;
  });
  wings.forEach((w,i)=>{
   const side=i?1:-1;w.rotation.z=side*(flapping?.28+wingBeat*.70:.06);
   w.scale.x=flapping?1:.42;w.rotation.y=side*(flapping?.12:1.12);
  });
  fur.rotation.z=.19*Math.sin(time*3); tail.rotation.x=.35+.13*Math.sin(time*4);
  for(const a of [loon,squirrel]){a.label.position.y=a===loon?1.06:.57;if(camera)a.label.quaternion.copy(a.root.quaternion).invert().multiply(camera.quaternion);}
 }
 // The first six critics meet the bus uphill. Space the other three signs across the downhill rows.
  const CRUDE_DOODLE=['doodle'];
 const signLines=new Map([
  [0,['I give you','Zero Star']], [2,['No thumbs up',"unless it's up",'your butt']], [4,CRUDE_DOODLE],
  [6,['Billy Bites!']], [11,['Backhanded','Homage!']], [16,['Go back','to hell!']]
 ]);
 const cardboard=material(0xf4dbb1,.55), paint=new T.MeshBasicMaterial({color:0x322035}), wood=material(0x714735);
 const knifeTemplate=createPartyKnife(T);
 // One critic lets a hasty marker doodle do the talking: wobbly strokes, an
 // uneven pair and a few stray lines, drawn on the face of the card.
 function doodle(sign){
  const art=group(sign,'Crude marker doodle');art.position.set(.03,1.085,.027);art.rotation.z=-.5;art.scale.setScalar(1.3);
  let seed=41;const wobble=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return (seed/4294967296-.5)*.022;};
  const stroke=(points,radius=.013)=>{
   const curve=new T.CatmullRomCurve3(points.map(([x,y])=>new T.Vector3(x+wobble(),y+wobble(),0)));
   const line=mesh(art,new T.TubeGeometry(curve,points.length*5,radius,5,false),paint,0,0,0);line.castShadow=false;return line;
  };
  const ring=(cx,cy,rx,ry,from=0,to=Math.PI*2)=>stroke(Array.from({length:13},(_,i)=>{const a=from+(to-from)*i/12;return [cx+Math.cos(a)*rx,cy+Math.sin(a)*ry];}));
  ring(-.125,-.2,.118,.105,.35,Math.PI*2+.75);ring(.135,-.215,.128,.115,-.6,Math.PI*2-.2);
  // Shaft: up one side, over a lopsided crown and back down, not quite meeting.
  stroke([[-.085,-.11],[-.095,.05],[-.088,.2],[-.1,.27],[-.07,.335],[0,.36],[.075,.33],[.1,.265],[.085,.2],[.092,.05],[.08,-.12]]);
  stroke([[-.09,.262],[-.03,.248],[.04,.252],[.092,.262]],.01);
  stroke([[0,.352],[.004,.315]],.009);
  for(const [x,y,dx,dy] of [[-.235,-.27,-.05,-.045],[-.2,-.315,-.02,-.06],[.255,-.3,.05,-.04],[.2,-.335,.03,-.055],[.01,-.32,-.005,-.055]])stroke([[x,y],[x+dx*.55,y+dy*.5],[x+dx,y+dy]],.008);
  for(const [x,y] of [[.19,.42],[.265,.375],[.3,.3]])stroke([[x,y],[x+.04,y+.03]],.009);
  return art;
 }
 function makeSign(lines){
  const sign=new T.Group();sign.name='Protest sign';sign.userData.text=lines===CRUDE_DOODLE?'(crude doodle)':lines.join(' ');
  mesh(sign,new T.BoxGeometry(.045,1.04,.042),wood,0,.44,0);
  mesh(sign,new T.BoxGeometry(1.54,.83,.045),cardboard,0,1.10,0);
  if(lines===CRUDE_DOODLE)doodle(sign);
  else lines.forEach((line,j)=>lettering(sign,line,.167,paint,1.1+((lines.length-1)/2-j)*.22,.026,1.43));
  return sign;
 }
 function angryFace(head,kind,r,y,z){
  const face=group(head,'Angry critic expression'); face.position.set(0,y,z);
  if(kind!=='smile')return face; // The marching rig uses its default expression throughout this shot.
  // Open eyes while marching; crossed-out eyes once the bus has flattened him.
  const open=[],crossed=[];
  for(const side of [-1,1]){
   open.push(oval(face,ink,side*.13,.055,0,.025,.042,.014));
   oval(face,ink,side*.13,.114,.006,.092,.022,.015).rotation.z=side*.36;
   for(const tilt of [-1,1]){const stroke=oval(face,ink,side*.13,.055,.002,.062,.013,.014);stroke.rotation.z=tilt*Math.PI/4;stroke.visible=false;crossed.push(stroke);}
  }
  face.userData.eyes={open,crossed};
  oval(face,ink,0,-.11,0,.102,.058,.012); oval(face,pearl,0,-.083,.014,.076,.017,.005); return face;
 }
 const critics=[];
 const RED_CRITICS=new Set([3,9,14,20]);
 const sizes=[1,.84,1.18,.78,1.05,.95];
 for(let i=0;i<24;i++){
  const rig=makeStickman(null,{faceBuilder:angryFace}), root=rig.root;
  parent.add(root);root.name='Movie critic '+(i+1);root.rotation.order='YXZ';root.visible=false;
  // White heads, with a few furious red ones scattered through both mobs.
  rig.faceColor=RED_CRITICS.has(i)?0xe2332d:0xf6f2ea;root.scale.setScalar(sizes[i%sizes.length]);
  const handSide=i%3===0?-1:1,arm=rig.limbs[handSide===1?3:1];
  const lines=signLines.get(i),sign=lines?makeSign(lines):null;
  const prop=sign??knifeTemplate.clone(),hand=new T.Vector3(handSide*.53,-.06,.13);
  arm.add(prop);prop.position.copy(hand);
  if(!sign)prop.rotation.z=-handSide*.32;
  const eyes=rig.head.children.map(o=>o.userData.eyes).find(Boolean);
  const setDead=dead=>{for(const o of eyes.open)o.visible=!dead;for(const o of eyes.crossed)o.visible=dead;};
  critics.push({rig,root,sign,hand,handSide,arm,size:root.scale.x,hitAt:null,signFrom:sign?new T.Vector3():null,setDead,eyes});
 }
 return {loon,squirrel,animateAnimals,critics};
}

import {world,LEVELS} from './beverly-layout.js';
import {Font} from '../vendor/FontLoader.js';
import fontData from '../vendor/beverly-font.js';

// Local +Z is forward. Her initial heading looks back up at the main patio.
export const HOT_CHICK={id:'hot-chick',name:'Hot Chick',u:1065,v:643,y:LEVELS.upperGarden,target:[903,601]};

export function buildHotChick(T,root,groups,materials){
 const group=new T.Group();group.name='Hot_Chick_guest';group.userData.dynamic=true;root.add(group);groups.Hot_Chick_guest=group;
 const actor=new T.Group();actor.name=HOT_CHICK.name;group.add(actor);
 actor.userData={id:HOT_CHICK.id,role:'main story character',hostile:false,playerControlled:false,
  reference:'Sara Sampaio in the three user-supplied Party Knight party stills; face reference from the earlier portrait',
  appearance:'Taller than Alex, slim with a slightly fuller bust, slicked-back dark ponytail, green eyes, sparkling sheer long-sleeved midi dress over an opaque black bodysuit, black heels and a sequined handbag',
  location:'Second terrace, between the garden lamp and central watercourse, facing the upper patio',
  movement:'Stays at her starting mark with subtle breathing, relaxed hands and small head movements',dialogue:[]};
 const mat=(name,color,extra={})=>materials[name]=new T.MeshStandardMaterial({name,color,roughness:.75,...extra});
 const skin=mat('Hot Chick warm skin',0xce9c7f),contour=mat('Hot Chick soft face contours',0xb17c66),lip=mat('Hot Chick muted rose lipstick',0x955951,{roughness:.47});
 const white=mat('Hot Chick eye whites',0xeee7db);
 const black=mat('Hot Chick opaque black bodysuit',0x14161c,{roughness:.50}),piping=mat('Hot Chick fine black trim',0x2b2930,{roughness:.38}),shoes=mat('Hot Chick black heels',0x14151a,{roughness:.30});
 const sheer=mat('Hot Chick sheer champagne mesh',0xcbb8a6,{transparent:true,opacity:.095,depthWrite:false,side:T.DoubleSide,roughness:.55});
 const weave=mat('Hot Chick fine dress net',0xb3a592,{transparent:true,opacity:.23,depthWrite:false,side:T.DoubleSide});
 const crystal=mat('Hot Chick dress rhinestones',0xe0dbd0,{metalness:.68,roughness:.20,emissive:0x9a9286,emissiveIntensity:.11});
 const bagFabric=mat('Hot Chick black sequined purse',0x101116,{roughness:.40}),bagSequin=mat('Hot Chick purse sequins',0x4f5260,{metalness:.65,roughness:.27});
 const hair=mat('Hot Chick dark chestnut hair',0x261d19,{roughness:.40}),strand=mat('Hot Chick subtle hair highlights',0x49362a,{roughness:.43});
 const ink=mat('Hot Chick dark eyelashes',0x211b1b),iris=mat('Hot Chick green eyes',0x668878),irisRim=mat('Hot Chick green eye rim',0x344943);
 const silver=mat('Hot Chick silver earrings',0xc6c8cd,{metalness:.75,roughness:.24});
 const sphere=new T.SphereGeometry(1,18,14),cube=new T.BoxGeometry(1,1,1),up=new T.Vector3(0,1,0);
 function mesh(g,n,geo,m,p=[0,0,0],scale=[1,1,1]){const o=new T.Mesh(geo,m);o.name=n;o.position.set(...p);o.scale.set(...scale);o.castShadow=o.receiveShadow=true;g.add(o);return o;}
 const ball=(g,n,p,scale,m)=>mesh(g,n,sphere,m,p,scale),box=(g,n,p,scale,m)=>mesh(g,n,cube,m,p,scale);
 function part(g,n,p=[0,0,0]){const o=new T.Group();o.name=n;o.position.set(...p);g.add(o);return o;}
 function line(g,n,points,r,m){return mesh(g,n,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),20,r,6,false),m);}
 // Ring profiles keep the opaque bodysuit and sheer outer dress separate.
 function fabric(g,n,rings,m,pointAt=null){
  const positions=[],indices=[],columns=48;
  for(let row=0;row<rings.length;row++){
   const [y,rx,rz]=rings[row];
   for(let col=0;col<=columns;col++){
    const a=col/columns*Math.PI*2;
    positions.push(...(pointAt?pointAt(a,row,y,rx,rz):[Math.sin(a)*rx,y,Math.cos(a)*rz]));
    if(row&&col<columns){const i=(row-1)*(columns+1)+col,j=i+columns+1;indices.push(i,i+1,j,i+1,j+1,j);}
   }
  }
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();return mesh(g,n,geo,m);
 }
 // All stones are combined into one faceted mesh per garment piece. They catch
 // the existing terrace lights and survive the review's rigid-piece batching.
 function stones(g,n,points,m){
  const positions=[],indices=[];
  for(const [x,y,z,r] of points){
   const i=positions.length/3;
   positions.push(x+r,y,z,x-r,y,z,x,y+r,z,x,y-r,z,x,y,z+r,x,y,z-r);
   for(const face of [[0,2,4],[2,1,4],[1,3,4],[3,0,4],[2,0,5],[1,2,5],[3,1,5],[0,3,5]])indices.push(...face.map(k=>k+i));
  }
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();
  const o=mesh(g,n,geo,m);o.castShadow=false;return o;
 }
 function beadedNet(g,n,surface,rows,cols){
  const positions=[],indices=[],gems=[];
  function quad(a,b,c,d){const i=positions.length/3;positions.push(...a,...b,...c,...d);indices.push(i,i+1,i+2,i,i+2,i+3);}
  for(let row=0;row<=rows;row++)for(let col=0;col<cols;col++){
   const a=(col+(row%2)*.5)/cols*Math.PI*2,t=row/rows;
   const p=surface(a,t),size=.0018+(.5+.5*Math.sin(row*73.1+col*29.7))*.0018;
   gems.push([...p,(row*7+col*11)%37===0?size*1.6:size]);
   if(row<rows){
    for(const sign of [-1,1]){
     const next=a+sign*Math.PI/cols;
     quad(surface(a-.002,t),surface(a+.002,t),surface(next+.002,t+1/rows),surface(next-.002,t+1/rows));
    }
   }
  }
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();
  const o=mesh(g,n+' diamond weave',geo,weave);o.castShadow=false;
  stones(g,n+' rhinestones',gems,crystal);
 }
 const hips=part(actor,'Hot Chick legs and heels'),legs=[];
 ball(hips,'Smooth hips beneath the bodysuit',[0,.999,-.01],[.178,.174,.120],skin);
 for(const sign of [-1,1]){
  const leg=part(actor,'Long leg beneath the sheer dress',[sign*.100,0,0]);legs.push(leg);
  fabric(leg,'Leg silhouette',[[.14,.037,.043],[.31,.042,.052],[.43,.051,.064],[.58,.047,.055],[.72,.065,.074],[.9,.078,.088],[1.07,.081,.088]],skin);
  ball(leg,'Bare instep',[0,.108,.05],[.046,.04,.1],skin);
  ball(leg,'Pointed black pump',[0,.073,.083],[.055,.045,.144],shoes);
  box(leg,'Slim shoe heel',[0,.036,-.035],[.026,.072,.028],shoes);
  ball(leg,'Shoe toe sole',[0,.028,.135],[.053,.018,.071],shoes);
 }
 const body=part(actor,'Hot Chick relaxed upper body',[0,1.14,0]),torso=part(body,'Hot Chick crystal mesh party dress');
 fabric(torso,'Upper body beneath the dress',[[-.19,.168,.117],[0,.124,.09],[.14,.132,.103],[.25,.174,.134],[.34,.181,.139],[.43,.167,.116],[.49,.166,.082],[.53,.119,.069]],skin);
 ball(torso,'Slender neck',[0,.594,.005],[.061,.101,.059],skin);
 fabric(torso,'Opaque black strapless bodysuit',[[-.30,.175,.127],[-.04,.158,.118],[.05,.132,.100],[.17,.145,.118],[.26,.183,.145],[.34,.190,.153],[.385,.174,.133]],black,
  (a,row,y,rx,rz)=>[Math.sin(a)*rx,y+(row===0?.26*Math.abs(Math.sin(a))**1.3:0),Math.cos(a)*rz]);
 line(torso,'Straight bodysuit neckline',Array.from({length:49},(_,i)=>{const a=i/48*Math.PI*2;return [Math.sin(a)*.175,.385,Math.cos(a)*.134];}),.0035,piping);
 for(const sign of [-1,1]){
  ball(torso,'Bare shoulder',[sign*.18,.478,-.006],[.052,.065,.057],skin);
 }
 const dressRings=[[-.66,.218,.161],[-.49,.224,.169],[-.28,.222,.165],[-.15,.195,.147],[0,.151,.118],[.14,.152,.128],[.25,.194,.158],[.34,.201,.166],[.43,.183,.130],[.51,.184,.099],[.585,.073,.070],[.635,.066,.065]];
 fabric(torso,'Sheer long-sleeved midi dress shell',dressRings,sheer).castShadow=false;
 function dressSurface(a,t){
  const y=dressRings[0][0]+t*(dressRings.at(-1)[0]-dressRings[0][0]);
  let row=0;while(row<dressRings.length-2&&y>dressRings[row+1][0])row++;
  const from=dressRings[row],to=dressRings[row+1],mix=(y-from[0])/(to[0]-from[0]);
  return [Math.sin(a)*(T.MathUtils.lerp(from[1],to[1],mix)+.002),y,Math.cos(a)*(T.MathUtils.lerp(from[2],to[2],mix)+.002)];
 }
 beadedNet(torso,'Silver crystal dress',dressSurface,55,34);
 line(torso,'Delicate mesh hem',Array.from({length:49},(_,i)=>dressSurface(i/48*Math.PI*2,0)),.0028,weave);
 line(torso,'Fine black necklace',Array.from({length:33},(_,i)=>{const a=i/32*Math.PI*2;return [Math.sin(a)*.064,.635,Math.cos(a)*.062+.005];}),.004,black);
 ball(torso,'Tiny dark necklace pendant',[0,.617,.071],[.008,.011,.004],black);
 const head=part(body,'Hot Chick gentle head movement',[0,.79,.012]),portrait=part(head,'Hot Chick portrait and long hair');
 ball(portrait,'Slicked-back hair cap',[0,.035,-.071],[.161,.210,.107],hair);
 ball(portrait,'Oval face',[0,0,0],[.154,.216,.134],skin);
 ball(portrait,'Tapered jaw',[0,-.123,.012],[.112,.100,.107],skin);
 for(const sign of [-1,1]){
  ball(portrait,'Ear',[sign*.152,-.015,-.01],[.025,.05,.022],skin);
  ball(portrait,'Silver earring',[sign*.169,-.064,.020],[.014,.022,.012],silver);
  for(let i=0;i<3;i++)ball(portrait,'Earring sparkle',[sign*(.171+i*.002),-.057-i*.012,.03],[.004,.007,.004],white);
  ball(portrait,'High cheekbone',[sign*.104,-.046,.083],[.044,.047,.038],skin);
  ball(portrait,'Almond eye white',[sign*.067,.025,.123],[.040,.023,.015],white);
  ball(portrait,'Green iris outer ring',[sign*.066,.027,.139],[.017,.020,.006],irisRim);
  ball(portrait,'Green iris',[sign*.066,.027,.144],[.014,.017,.004],iris);
  ball(portrait,'Pupil',[sign*.066,.027,.148],[.0075,.012,.003],ink);
  ball(portrait,'Eye catchlight',[sign*.060,.036,.152],[.004,.004,.002],white);
  line(portrait,'Defined eyebrow',[[sign*.026,.085,.131],[sign*.070,.094,.134],[sign*.115,.075,.110]],.009,hair);
  line(portrait,'Upper lash contour',[[sign*.029,.030,.134],[sign*.065,.049,.139],[sign*.111,.035,.116]],.0045,ink);
  line(portrait,'Outer eyeliner',[[sign*.102,.036,.12],[sign*.119,.044,.109]],.003,ink);
  line(portrait,'Soft lower lid',[[sign*.034,.007,.134],[sign*.071,.001,.139],[sign*.103,.013,.12]],.0025,contour);
 }
 ball(portrait,'Nose bridge',[0,-.006,.135],[.022,.057,.027],skin);
 ball(portrait,'Nose tip',[0,-.052,.16],[.027,.02,.024],skin);
 line(portrait,'Upper lip bow',[[-.047,-.116,.133],[-.021,-.107,.145],[0,-.113,.150],[.022,-.107,.145],[.047,-.116,.133]],.007,lip);
 line(portrait,'Full lower lip',[[-.042,-.12,.139],[0,-.132,.148],[.043,-.12,.137]],.009,lip);
 line(portrait,'Closed mouth',[[-.041,-.118,.144],[0,-.121,.156],[.041,-.118,.144]],.0025,ink);
 // The party stills have the hair swept off her shoulders into a low ponytail.
 for(const sign of [-1,1]){
  const crown=ball(portrait,'Smooth swept-back crown',[sign*.071,.160,-.040],[.094,.075,.111],hair);crown.rotation.z=sign*.10;
  line(portrait,'Swept temple hair',[[sign*.084,.181,.034],[sign*.140,.112,.001],[sign*.155,.014,-.047],[sign*.104,-.105,-.14]],.021,hair);
  for(let i=0;i<4;i++)line(portrait,'Fine swept hair strand',[[sign*(.025+i*.022),.217-i*.010,.021],[sign*(.07+i*.021),.154-i*.010,-.067],[sign*(.082+i*.016),.027,-.15],[sign*.055,-.111,-.17]],.0024,strand);
 }
 ball(portrait,'Ponytail tie',[0,-.119,-.17],[.043,.026,.027],black);
 line(portrait,'Long low ponytail',[[0,-.135,-.175],[.025,-.27,-.210],[.018,-.44,-.225],[.04,-.60,-.195]],.051,hair);
 for(const x of [-.025,0,.025])line(portrait,'Ponytail strand',[[x,-.14,-.193],[x+.025,-.27,-.243],[x+.018,-.45,-.260],[x+.04,-.595,-.219]],.003,strand);
 const limbs=[],hands=[];
 function sleevedArm(name,r,length){
  const g=part(body,name);
  mesh(g,'Arm under sheer sleeve',new T.CylinderGeometry(r*.98,r,length,12),skin);
  mesh(g,'Transparent mesh sleeve',new T.CylinderGeometry(r+.002,r+.002,length,16),sheer).castShadow=false;
  beadedNet(g,name,(a,t)=>[Math.sin(a)*(r+.003),(t-.5)*length,Math.cos(a)*(r+.003)],11,12);
  g.userData.length=length;return g;
 }
 for(const sign of [-1,1]){
  const upperArm=sleevedArm('Hot Chick beaded upper sleeve',.041,.28),forearm=sleevedArm('Hot Chick beaded lower sleeve',.030,.30),hand=part(body,'Hot Chick relaxed hand');
  ball(hand,'Slender palm',[0,0,0],[.029,.048,.023],skin);
  for(let i=0;i<4;i++)ball(hand,'Relaxed finger',[(i-1.5)*.013,-.045+Math.abs(i-1.5)*.005,.003],[.008,.032,.009],skin);
  ball(hand,'Thumb',[-sign*.028,-.012,.012],[.010,.024,.012],skin);
  if(sign===-1)ball(hand,'Small silver ring',[-.006,-.050,.012],[.009,.005,.008],silver);
  hands.push(hand);limbs.push({sign,upperArm,forearm,hand});
 }
 // The short handle is physically attached to her right hand, including in the
 // export and after rigid batching; the bag follows the same relaxed idle pose.
 const purse=part(hands[0],'Hot Chick carried black purse');
 ball(purse,'Soft sequined handbag',[0,-.322,.006],[.112,.147,.059],bagFabric);
 ball(purse,'Gathered purse closure',[0,-.20,.006],[.061,.030,.044],black);
 line(purse,'Purse loop handle',[[-.041,-.20,.005],[-.048,-.112,.009],[-.017,-.039,.015],[.018,-.031,.015],[.050,-.118,.009],[.041,-.20,.005]],.007,black);
 const bagStones=[];
 for(let j=1;j<15;j++)for(let i=0;i<24;i++){
  const a=i/24*Math.PI*2,p=j/15*Math.PI;
  bagStones.push([Math.sin(a)*Math.sin(p)*.114,-.322+Math.cos(p)*.148,.006+Math.cos(a)*Math.sin(p)*.061,.0028]);
 }
 stones(purse,'Black bag sequins',bagStones,bagSequin);
 const label=part(actor,'Hot Chick floating name',[0,2.34,0]);label.userData={text:HOT_CHICK.name,billboard:true};
 const labelInk=materials['Guest name ivory']??(materials['Hot Chick name ivory']=new T.MeshBasicMaterial({name:'Hot Chick name ivory',color:0xfff3d8,side:T.DoubleSide}));
 const outlineInk=materials['Guest name dark outline']??(materials['Hot Chick name outline']=new T.MeshBasicMaterial({name:'Hot Chick name outline',color:0x272333,side:T.DoubleSide}));
 const lettering=new T.ShapeGeometry(new Font(fontData).generateShapes(HOT_CHICK.name,.10),5);lettering.computeBoundingBox();const center=lettering.boundingBox.getCenter(new T.Vector3());lettering.translate(-center.x,-center.y,0);
 for(const [x,y] of [[-.003,0],[.003,0],[0,-.003],[0,.003]])mesh(label,'Name outline',lettering,outlineInk,[x,y,-.002]);
 mesh(label,'Hot Chick name lettering',lettering,labelInk);label.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=false;});
 const anchor=part(actor,'Hot Chick future speech anchor',[0,2.61,0]);
 const va=new T.Vector3(),vb=new T.Vector3(),cameraWorld=new T.Vector3(),labelWorld=new T.Vector3(),rotation=new T.Quaternion(),yawQ=new T.Quaternion();
 function segment(o,a,b){va.set(...a);vb.set(...b).sub(va);o.position.copy(va).addScaledVector(vb,.5);o.scale.set(1,vb.length()/o.userData.length,1);o.quaternion.setFromUnitVectors(up,vb.normalize());}
 const guest={id:HOT_CHICK.id,speechName:HOT_CHICK.name,voiceCue:'balcony-hey',spec:HOT_CHICK,group:actor,body,head,label,anchor,hands,purse,speech:null,
  rigidParts:[hips,...legs,torso,portrait,...hands,...limbs.flatMap(l=>[l.upperArm,l.forearm])],
  setPosition(position){actor.position.copy(position);},
  faceToward(position){actor.rotation.y=Math.atan2(position.x-actor.position.x,position.z-actor.position.z);}};
 let elapsed=0;
 function pose(time){
  const breath=Math.sin(time*1.35)*.003;
  const stride=guest.moving?Math.sin(time*(guest.running?12:5)):0;
  body.position.y=1.14+Math.abs(stride)*.028;
  legs.forEach((leg,i)=>{const step=stride*(i?1:-1);leg.position.y=Math.max(0,step)*.12;leg.position.z=step*.19;});
  body.rotation.set(.012+breath,Math.sin(time*.34)*.012,-.023+Math.sin(time*.48)*.006);
  head.rotation.set(-.018+Math.sin(time*.43)*.014,Math.sin(time*.37)*.055,.015);
  for(const l of limbs){
   const waving=guest.waving&&l.sign===1;
   const elbow=waving?[.32,.61,.02]:[l.sign*(l.sign===-1?.247:.221),.206,.018],p=waving?[.38+Math.sin(time*10)*.12,.99,.12]:[l.sign*(l.sign===-1?.282:.183),-.094,.055+breath-stride*l.sign*.12];
   segment(l.upperArm,[l.sign*.178,.477,0],elbow);segment(l.forearm,elbow,p);l.hand.position.set(...p);l.hand.rotation.z=-l.sign*.075;
  }
 }
 function update(dt,camera=null){
  elapsed+=Math.max(0,dt);pose(elapsed);
  if(camera){actor.updateWorldMatrix(true,true);camera.getWorldPosition(cameraWorld);label.getWorldPosition(labelWorld);actor.getWorldQuaternion(rotation);label.quaternion.copy(rotation.invert()).multiply(yawQ.setFromAxisAngle(up,Math.atan2(cameraWorld.x-labelWorld.x,cameraWorld.z-labelWorld.z)));}
 }
 function reset(){elapsed=0;Object.assign(guest,{speech:null,scripted:false,moving:false,running:false,waving:false});actor.visible=true;actor.position.set(...world(HOT_CHICK.u,HOT_CHICK.v,HOT_CHICK.y));guest.faceToward(new T.Vector3(...world(...HOT_CHICK.target,HOT_CHICK.y)));pose(0);}
 reset();Object.assign(guest,{update,reset});return guest;
}

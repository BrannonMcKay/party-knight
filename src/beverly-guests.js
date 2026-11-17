import {world,LEVELS} from './beverly-layout.js';
import {Font} from '../vendor/FontLoader.js';
import fontData from '../vendor/beverly-font.js';
import {buildPanMan} from './beverly-pan-man.js';
import {buildAlex} from './beverly-alex.js';
import {buildEmily} from './beverly-emily.js';
import {buildHotChick} from './beverly-hot-chick.js';
import {say} from './stickman-behavior.js';
import {createGuestApproach} from './beverly-guest-approach.js';

export const AL_PACINO={id:'al-pacino',name:'Al Pacino',u:765,v:465,y:LEVELS.house,facing:0,scale:[.95,.90,.95]};
export const AL_PACINO_LINES=Object.freeze([
 'Thanks for coming to my party!',
 'I would like to watch movies in the basement with a freshly bathed young man.  Have you seen one?',
 "I'm Al Pacino, also known as Billy Knight."
]);

// A separate, movable story actor. Local +Z is forward; his starting pose faces
// down the gallery from the left side of Misty Ogle's painting.
export function buildBeverlyGuests(T,root,groups,materials){
 const group=new T.Group();group.name='Gallery_guests';group.userData.dynamic=true;
 root.add(group);groups.Gallery_guests=group;
 const actor=new T.Group();actor.name=AL_PACINO.name;
 actor.userData={id:AL_PACINO.id,role:'party guest',hostile:false,playerControlled:false,
  reference:'Two user-supplied photographs of Al Pacino',interactions:'Periodic party dialogue, turns to greet Christel on approach, and scripted wooden-room scene controlled by beverly-story.js',dialogue:[...AL_PACINO_LINES],
  appearance:'Short, compact and slightly stooped; swept gray-brown hair, short gray beard, black shirt and jacket'};
 actor.position.set(...world(AL_PACINO.u,AL_PACINO.v,AL_PACINO.y));actor.scale.set(...AL_PACINO.scale);group.add(actor);
 const mat=(name,color,extra={})=>materials[name]=new T.MeshStandardMaterial({name,color,roughness:.85,...extra});
 const skin=mat('Pacino warm skin',0xbe9076),crease=mat('Pacino facial creases',0x916c59),lip=mat('Pacino muted lips',0x98685c);
 const jacketMat=mat('Pacino black jacket',0x17191d),lapel=mat('Pacino charcoal lapels',0x26282d),shirt=mat('Pacino black patterned shirt',0x101315),pattern=mat('Pacino subtle shirt pattern',0x303235);
 const trousers=mat('Pacino black trousers',0x1c1d21),shoes=mat('Pacino black leather shoes',0x101216,{roughness:.38});
 const hair=mat('Pacino gray brown hair',0x69645c),silver=mat('Pacino silver hair strands',0x817d73),beard=mat('Pacino short silver beard',0x999689),ink=mat('Pacino dark eyes',0x272521),eye=mat('Pacino eye whites',0xd2c3ab);
 const sphere=new T.SphereGeometry(1,16,12),rod=new T.CylinderGeometry(1,1,1,10),cube=new T.BoxGeometry(1,1,1),up=new T.Vector3(0,1,0);
 function mesh(parent,name,geometry,m,p=[0,0,0],scale=[1,1,1]){const o=new T.Mesh(geometry,m);o.name=name;o.position.set(...p);o.scale.set(...scale);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
 const ball=(g,n,p,scale,m)=>mesh(g,n,sphere,m,p,scale);
 const box=(g,n,p,scale,m)=>mesh(g,n,cube,m,p,scale);
 function line(g,n,points,r,m){return mesh(g,n,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),18,r,5,false),m);}
 function panel(g,n,points,m){const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(points.flat(),3));geometry.setIndex([0,1,2,0,2,3]);geometry.computeVertexNormals();return mesh(g,n,geometry,m);}
 function part(parent,name,p=[0,0,0]){const g=new T.Group();g.name=name;g.position.set(...p);parent.add(g);return g;}
 const hips=part(actor,'Pacino hips and shoes');
 ball(hips,'Loose trouser hips',[0,.79,-.035],[.218,.14,.139],trousers);
 const feet=[];
 for(const sign of [-1,1])feet.push(ball(hips,'Black loafer',[sign*.13,.055,.06],[.097,.055,.18],shoes));
 const upper=part(actor,'Pacino stooped upper body',[0,.79,0]);
 const jacket=part(upper,'Pacino layered black clothing');
 ball(jacket,'Rounded jacket back',[0,.275,-.045],[.252,.34,.15],jacketMat);
 ball(jacket,'Soft black shirt',[0,.27,.036],[.191,.325,.13],shirt);
 for(const sign of [-1,1]){
  ball(jacket,'Jacket front panel',[sign*.18,.25,.058],[.085,.325,.105],jacketMat);
  ball(jacket,'Relaxed jacket shoulder',[sign*.237,.48,-.007],[.108,.112,.13],jacketMat);
  const points=[[-.04,.54,.123],[-.125,.40,.182],[-.118,.18,.178],[-.225,.45,.122]].map(([x,y,z])=>[x*sign,y,z]);
  if(sign===1)points.reverse();panel(jacket,'Open jacket lapel',points,lapel);
  line(jacket,'Jacket pocket welt',[[sign*.125,.09,.149],[sign*.212,.10,.131]],.01,lapel);
 }
 ball(jacket,'Exposed neck',[0,.60,.062],[.085,.118,.083],skin);
 for(const sign of [-1,1])panel(jacket,'Open shirt collar',[[sign*.016,.565,.13],[sign*.10,.565,.105],[sign*.116,.448,.15],[sign*.047,.485,.159]].reverse(),lapel);
 for(let i=0;i<5;i++){
  ball(jacket,'Small shirt button',[0,.08+i*.075,.171],[.008,.008,.007],lapel);
  for(const sign of [-1,1])line(jacket,'Subtle woven shirt dash',[[sign*.048,.09+i*.071,.160],[sign*.094,.10+i*.071,.153]],.0035,pattern);
 }
 const head=part(upper,'Pacino face and swept hair',[0,.72,.105]);
 ball(head,'Older face',[0,0,0],[.193,.231,.164],skin);
 ball(head,'Longer jaw',[0,-.121,.016],[.151,.13,.137],skin);
 for(const sign of [-1,1]){
  ball(head,'Ear',[sign*.195,-.013,-.006],[.040,.067,.028],skin);
  ball(head,'Recessed ear fold',[sign*.219,-.015,.010],[.012,.035,.014],crease);
  ball(head,'Cheekbone',[sign*.111,-.055,.106],[.073,.055,.049],skin);
  ball(head,'Tired lower eyelid',[sign*.077,.016,.151],[.057,.029,.015],crease);
  ball(head,'Soft eye white',[sign*.078,.038,.157],[.042,.021,.015],eye);
  ball(head,'Dark hazel iris',[sign*.073,.039,.170],[.015,.018,.007],ink);
  ball(head,'Eye glint',[sign*.070,.045,.177],[.004,.004,.002],eye);
  line(head,'Heavy arched eyebrow',[[sign*.031,.084,.155],[sign*.073,.097,.157],[sign*.123,.078,.136]],.015,hair);
  line(head,'Under eye line',[[sign*.042,-.001,.166],[sign*.083,-.008,.164],[sign*.119,.001,.147]],.0035,crease);
  line(head,'Smile crease',[[sign*.051,-.065,.179],[sign*.088,-.110,.159],[sign*.079,-.148,.145]],.0035,crease);
  line(head,'Crow foot',[[sign*.125,.03,.135],[sign*.154,.021,.116]],.0035,crease);
 }
 ball(head,'Prominent nose bridge',[0,.002,.168],[.034,.068,.035],skin);
 ball(head,'Rounded nose tip',[0,-.049,.205],[.047,.034,.038],skin);
 for(const sign of [-1,1])ball(head,'Nostril',[sign*.027,-.061,.220],[.012,.006,.007],crease);
 line(head,'Mild smile',[[-.057,-.125,.157],[0,-.133,.174],[.054,-.12,.157]],.007,lip);
 line(head,'Lower lip',[[-.036,-.144,.16],[0,-.147,.167],[.034,-.141,.158]],.005,skin);
 // A short, broken silver beard follows the jaw, leaving mouth and cheeks visible.
 for(let i=0;i<11;i++){
  const a=-1.05+i/10*2.1,x=Math.sin(a)*.119;
  ball(head,'Short gray jaw beard',[x,-.191+Math.abs(x)*.32,.105+Math.cos(a)*.031],[.028,.026,.022],beard);
 }
 for(const sign of [-1,1]){
  const moustache=ball(head,'Silver moustache',[sign*.032,-.102,.173],[.036,.016,.020],beard);moustache.rotation.z=sign*.18;
  line(head,'Gray sideburn',[[sign*.174,-.025,.038],[sign*.168,-.10,.07],[sign*.137,-.164,.093]],.018,silver);
 }
 for(const y of [.129,.156])line(head,'Forehead expression line',[[-.069,y,.139],[0,y+.005,.150],[.066,y,.14]],.0025,crease);
 // Receding at the temples, full tousled sides and a swept-back crown.
 ball(head,'Back hair',[0,.048,-.112],[.205,.22,.10],hair);
 for(const sign of [-1,1])for(let i=0;i<7;i++){
  const y=.183-i*.047,x=sign*(.154+Math.sin(i*.52)*.052),z=i<2?-.03:-.045;
  const lock=ball(head,'Tousled temple lock',[x,y,z],[.051,.076,.063],hair);lock.rotation.z=sign*(.4+i*.11);
  line(head,'Loose gray temple strand',[[x-sign*.022,y+.038,z+.049],[x+sign*.022,y+.005,z+.050],[x+sign*.010,y-.054,z+.014]],.004,silver);
 }
 for(let i=0;i<7;i++){
  const x=-.142+i*.044,lock=ball(head,'Swept crown lock',[x,.199+Math.sin(i*.91)*.024,-.033],[.05,.042,.096],hair);lock.rotation.z=-.38;
  line(head,'Fine swept silver strand',[[x-.024,.223,.037],[x+.009,.246+Math.sin(i)*.015,-.013],[x+.030,.215,-.115]],.004,silver);
 }
 const limbs=[],hands=[];
 for(const sign of [-1,1]){
  const thigh=mesh(actor,'Pacino trouser thigh',rod,trousers),shin=mesh(actor,'Pacino trouser shin',rod,trousers);
  const sleeve=mesh(upper,'Pacino upper sleeve',rod,jacketMat),forearm=mesh(upper,'Pacino lower sleeve',rod,jacketMat);
  const hand=part(upper,'Pacino relaxed hand');
  ball(hand,'Palm',[0,0,0],[.045,.068,.034],skin);
  for(let i=0;i<4;i++)ball(hand,'Finger',[(i-1.5)*.018,-.050,.009],[.012,.036,.014],skin);
  ball(hand,'Thumb',[-sign*.042,-.018,.022],[.019,.039,.019],skin);
  hands.push(hand);limbs.push({sign,thigh,shin,sleeve,forearm});
 }
 const lettering=new T.ShapeGeometry(new Font(fontData).generateShapes(AL_PACINO.name,.10),5);
 lettering.computeBoundingBox();const center=lettering.boundingBox.getCenter(new T.Vector3());lettering.translate(-center.x,-center.y,0);
 const label=part(actor,'Al Pacino floating name',[0,1.96,.19]);label.userData={text:AL_PACINO.name,billboard:true};
 const labelInk=new T.MeshBasicMaterial({name:'Guest name ivory',color:0xfff3d8,side:T.DoubleSide});materials[labelInk.name]=labelInk;
 const outlineInk=new T.MeshBasicMaterial({name:'Guest name dark outline',color:0x272333,side:T.DoubleSide});materials[outlineInk.name]=outlineInk;
 // A fine outline, without a panel, stays legible against both plaster and hair.
 for(const [x,y] of [[-.003,0],[.003,0],[0,-.003],[0,.003]])mesh(label,'Name outline',lettering,outlineInk,[x,y,-.002]).castShadow=false;
 mesh(label,'Al Pacino name lettering',lettering,labelInk).castShadow=false;
 label.traverse(o=>{if(o.isMesh)o.receiveShadow=false;});
 const anchor=part(actor,'Al Pacino speech anchor',[0,2.27,.19]);
 const va=new T.Vector3(),vb=new T.Vector3();
 function segment(o,a,b,r){va.set(...a);vb.set(...b).sub(va);o.position.copy(va).addScaledVector(vb,.5);o.scale.set(r,vb.length(),r);o.quaternion.setFromUnitVectors(up,vb.normalize());}
 function pose(time,moving=false){
  const breath=Math.sin(time*1.4)*.005,step=moving?Math.sin(time*5):0;
  upper.rotation.x=.13+breath;upper.rotation.z=moving?step*.015:0;
  for(const [i,l] of limbs.entries()){
   const stride=step*l.sign*.13,lift=moving?Math.max(0,step*l.sign)*.035:0;
   segment(l.thigh,[l.sign*.12,.79,-.035],[l.sign*.14,.43,.035+stride*.45],.094);
   segment(l.shin,[l.sign*.14,.43,.035+stride*.45],[l.sign*.13,.095,stride],.073);
   feet[i].position.z=.06+stride;feet[i].position.y=.055+lift;
   const waving=alPacino.waving&&i===1;
   const hand=waving?[.44+Math.sin(time*10)*.12,.98,.20]:[l.sign*.285,-.015,.14-stride*.25+breath];
   segment(l.sleeve,[l.sign*.253,.47,0],[l.sign*.305,.235,.025-stride*.2],.078);
   segment(l.forearm,[l.sign*.305,.235,.025-stride*.2],hand,.061);hands[i].position.set(...hand);
  }
  head.rotation.set(-.045,Math.sin(time*.48)*.025,0);
 }
 const panMan=buildPanMan(T,root,groups,materials);
 const alex=buildAlex(T,root,groups,materials);
 const emily=buildEmily(T,root,groups,materials);
 const hotChick=buildHotChick(T,root,groups,materials);
 const alPacino={id:AL_PACINO.id,speechName:AL_PACINO.name,voiceCue:'ghost-boo',speech:null,anchor,group:actor,upper,head,label,pose,spec:AL_PACINO,
  rigidParts:[jacket,head,...hands],
  setPosition(position){actor.position.copy(position);},
  faceToward(position){actor.rotation.y=Math.atan2(position.x-actor.position.x,position.z-actor.position.z);}};
 let elapsed=0,nextSpeech=7,lineIndex=0;
 function speak(){
  const index=lineIndex++%AL_PACINO_LINES.length,duration=index===1?10:5;
  say(alPacino,AL_PACINO_LINES[index],duration);nextSpeech=elapsed+duration+12;
 }
 const approach=createGuestApproach(alPacino,speak);
 const labelWorld=new T.Vector3(),cameraWorld=new T.Vector3(),parentRotation=new T.Quaternion();
 function update(dt,camera,context={}){
  dt=Math.max(0,dt);
  panMan.update(dt,camera);
  alex.update(dt,camera,context);
  emily.update(dt,camera,context);
  hotChick.update(dt,camera);
  elapsed+=dt;pose(elapsed*(alPacino.running?2.3:1),alPacino.moving);
  if(!alPacino.scripted&&actor.visible){
   if(alPacino.speech){alPacino.speech.remaining-=dt;if(alPacino.speech.remaining<=0)alPacino.speech=null;}
   alPacino.attending=approach.update(dt,context);
   if(elapsed>=nextSpeech&&!alPacino.attending)speak();
  }
  if(camera){
   actor.updateWorldMatrix(true,true);camera.getWorldPosition(cameraWorld);label.getWorldPosition(labelWorld);
   // Upright yaw billboard; depth testing still hides the name behind walls.
   const yaw=Math.atan2(cameraWorld.x-labelWorld.x,cameraWorld.z-labelWorld.z);
   actor.getWorldQuaternion(parentRotation);label.quaternion.copy(parentRotation.invert()).multiply(new T.Quaternion().setFromAxisAngle(up,yaw));
  }
 }
 pose(0);
 return {group,alPacino,panMan,alex,emily,hotChick,update,reset(){
  panMan.reset();alex.reset();emily.reset();hotChick.reset();approach.reset();elapsed=0;nextSpeech=7;lineIndex=0;Object.assign(alPacino,{speech:null,scripted:false,attending:false,moving:false,running:false,waving:false});actor.visible=true;actor.position.set(...world(AL_PACINO.u,AL_PACINO.v,AL_PACINO.y));actor.rotation.y=AL_PACINO.facing;pose(0);
 }};
}

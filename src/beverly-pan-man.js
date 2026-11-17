import {world,LEVELS} from './beverly-layout.js';
import {FILM_CREW} from './beverly-film-crew.js';
import {say} from './stickman-behavior.js';
import {Font} from '../vendor/FontLoader.js';
import fontData from '../vendor/beverly-font.js';

export const PAN_MAN_LINES=Object.freeze([
 'Shoot the fucking scene!',
 'This is a party!  I paid you $500k so shut up and press record!'
]);
export const PAN_MAN={id:'pan-man',name:'Pan Man',u:935,v:472,y:LEVELS.house,firstShout:6,quietSeconds:12};

export function buildPanMan(T,root,groups,materials){
 const group=new T.Group();group.name='Party_guests';group.userData.dynamic=true;root.add(group);groups.Party_guests=group;
 const actor=new T.Group();actor.name=PAN_MAN.name;actor.position.set(...world(PAN_MAN.u,PAN_MAN.v,PAN_MAN.y));group.add(actor);
 actor.userData={id:PAN_MAN.id,role:'movie producer and party guest',hostile:false,playerControlled:false,
  reference:'User-supplied group photograph; second person from the left',
  appearance:'Tall and lanky, full medium-long brown hair, burgundy jacket, black shirt and scarf, broad smile, drink in hand',dialogue:[...PAN_MAN_LINES]};
 const mat=(name,color,extra={})=>materials[name]=new T.MeshStandardMaterial({name,color,roughness:.8,...extra});
 const skin=mat('Pan Man warm skin',0xc99374),crease=mat('Pan Man smile creases',0x956c55),lip=mat('Pan Man lips',0x955749),ink=mat('Pan Man dark features',0x30261f);
 const burgundy=mat('Pan Man burgundy knit jacket',0x652e35),rib=mat('Pan Man knit edges',0x81434a),black=mat('Pan Man black shirt and scarf',0x1b1d22),trousers=mat('Pan Man slim dark trousers',0x252630),shoeMat=mat('Pan Man brown shoes',0x4d382d,{roughness:.5});
 const hair=mat('Pan Man brown hair',0x4b3629),hairLight=mat('Pan Man brown hair strands',0x69503b),eyeWhite=mat('Pan Man eyes and teeth',0xffead4),iris=mat('Pan Man brown irises',0x5b4835);
 const glass=mat('Pan Man clear drink glass',0xc7e5e8,{transparent:true,opacity:.36,roughness:.12,metalness:.08,side:T.DoubleSide,depthWrite:false});
 const amber=mat('Pan Man amber drink',0xcb8e37,{roughness:.2}),iceMat=mat('Pan Man ice cubes',0xd6f1f2,{transparent:true,opacity:.68,roughness:.22});
 const sphere=new T.SphereGeometry(1,16,12),cylinder=new T.CylinderGeometry(1,1,1,10),cube=new T.BoxGeometry(1,1,1),up=new T.Vector3(0,1,0);
 function mesh(parent,name,geo,material,pos=[0,0,0],scale=[1,1,1]){const m=new T.Mesh(geo,material);m.name=name;m.position.set(...pos);m.scale.set(...scale);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
 const ball=(g,n,p,size,m)=>mesh(g,n,sphere,m,p,size);
 const box=(g,n,p,size,m)=>mesh(g,n,cube,m,p,size);
 function part(g,name,pos=[0,0,0]){const p=new T.Group();p.name=name;p.position.set(...pos);g.add(p);return p;}
 function line(g,name,points,r,m){return mesh(g,name,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),16,r,6,false),m);}
 const hips=part(actor,'Pan Man hips and grounded shoes');
 const trouserHips=part(hips,'Pan Man rigid trouser hips');
 ball(trouserHips,'Narrow trouser hips',[0,1.035,0],[.158,.13,.11],trousers);
 const feet=[-1,1].map(sign=>ball(hips,'Brown party shoe',[sign*.145,.06,.058],[.074,.06,.158],shoeMat));
 const body=part(actor,'Pan Man animated upper body',[0,1.04,0]),torso=part(body,'Pan Man burgundy jacket and scarf');
 ball(torso,'Long narrow shirt',[0,.31,.015],[.168,.37,.102],black);
 ball(torso,'Burgundy jacket back',[0,.31,-.055],[.191,.395,.095],burgundy);
 for(const sign of [-1,1]){
  ball(torso,'Open burgundy jacket front',[sign*.142,.295,.025],[.067,.38,.096],burgundy);
  ball(torso,'Slim jacket shoulder',[sign*.205,.615,-.006],[.081,.090,.11],burgundy);
  line(torso,'Ribbed jacket opening',[[sign*.105,.66,.07],[sign*.13,.40,.112],[sign*.13,-.042,.099]],.014,rib);
  for(let i=0;i<5;i++)line(torso,'Fine jacket cuff rib',[[sign*.10+i*.009*sign,-.043,.113],[sign*.10+i*.009*sign,.005,.114]],.003,rib);
  const collar=box(torso,'Open black shirt collar',[sign*.065,.665,.09],[.065,.115,.035],black);collar.rotation.z=sign*.28;
  const scarf=box(torso,'Long black scarf end',[sign*.082,.24,.147],[.105,.77,.032],black);scarf.rotation.z=sign*.035;
 }
 ball(torso,'Long exposed neck',[0,.735,.01],[.067,.106,.067],skin);
 const head=part(body,'Pan Man expressive head',[0,.94,.027]),portrait=part(head,'Pan Man face and poofy brown hair');
 ball(portrait,'Long smiling face',[0,-.004,0],[.173,.226,.147],skin);
 ball(portrait,'Tapered clean-shaven jaw',[0,-.135,.01],[.128,.104,.113],skin);
 for(const sign of [-1,1]){
  ball(portrait,'Ear',[sign*.176,-.016,-.015],[.030,.061,.025],skin);
  ball(portrait,'Cheek',[sign*.105,-.053,.095],[.059,.057,.034],skin);
  ball(portrait,'Smiling eye white',[sign*.069,.047,.134],[.043,.022,.013],eyeWhite);
  ball(portrait,'Brown eye',[sign*.067,.046,.148],[.016,.019,.008],iris);
  ball(portrait,'Dark pupil',[sign*.065,.045,.156],[.007,.011,.003],ink);
  ball(portrait,'Eye highlight',[sign*.06,.051,.159],[.003,.003,.002],eyeWhite);
  line(portrait,'Friendly brown eyebrow',[[sign*.028,.089,.14],[sign*.069,.11,.137],[sign*.115,.088,.115]],.011,hair);
  line(portrait,'Laughing eye crease',[[sign*.045,.02,.145],[sign*.084,.017,.14],[sign*.110,.027,.125]],.003,crease);
  line(portrait,'Broad smile crease',[[sign*.068,-.065,.141],[sign*.109,-.095,.123],[sign*.092,-.134,.12]],.0035,crease);
 }
 ball(portrait,'Long nose',[0,.005,.142],[.026,.056,.032],skin);
 ball(portrait,'Nose tip',[0,-.041,.179],[.033,.027,.031],skin);
 const smile=part(head,'Pan Man enjoying the party smile');
 ball(smile,'Broad open smile',[0,-.104,.140],[.082,.040,.014],lip);
 ball(smile,'Smile dark interior',[0,-.104,.151],[.072,.031,.008],ink);
 ball(smile,'Happy white teeth',[0,-.092,.159],[.066,.015,.005],eyeWhite);
 const shout=part(head,'Pan Man shouting mouth');
 ball(shout,'Shouting lips',[0,-.111,.143],[.070,.069,.014],lip);
 const mouth=ball(shout,'Open shout',[0,-.111,.157],[.059,.058,.008],ink);
 ball(shout,'Shouting upper teeth',[0,-.071,.164],[.049,.012,.006],eyeWhite);
 shout.visible=false;
 // Full lifted crown and loose side/back locks, longer than the other male guests.
 ball(portrait,'Full brown hair at back',[0,.054,-.095],[.202,.248,.106],hair);
 for(const sign of [-1,1])for(let i=0;i<6;i++){
  const x=sign*(.163+Math.sin(i*.7)*.031),y=.177-i*.055,z=-.034-i*.007;
  const lock=ball(portrait,'Loose medium-length side lock',[x,y,z],[.055,.094,.074],hair);lock.rotation.z=sign*(.32+i*.08);
  line(portrait,'Soft brown side strand',[[x-sign*.015,y+.059,z+.064],[x+sign*.018,y+.005,z+.073],[x+sign*.01,y-.073,z+.031]],.0035,hairLight);
 }
 for(let i=0;i<8;i++){
  const x=-.166+i*.046,y=.196+Math.sin(i*.56+.6)*.082,z=.011+Math.sin(i*.9)*.015;
  const lock=ball(portrait,'Poofy swept brown crown',[x,y,z],[.065,.073,.13],hair);lock.rotation.z=-.27+i*.035;
  line(portrait,'Lifted crown strand',[[x-.023,y-.027,z+.105],[x-.006,y+.047,z+.064],[x+.032,y+.045,z-.07]],.004,hairLight);
 }
 for(const [x,y] of [[-.1,.172],[-.045,.186],[.045,.182],[.115,.164]]){
  const fringe=ball(portrait,'Soft parted fringe',[x,y,.098],[.037,.065,.044],hair);fringe.rotation.z=x<0?-.42:.5;
 }
 const limbs=[],hands=[];
 for(const sign of [-1,1]){
  const thigh=mesh(actor,'Pan Man long trouser thigh',cylinder,trousers),shin=mesh(actor,'Pan Man long trouser shin',cylinder,trousers);
  const sleeve=mesh(body,'Pan Man long jacket sleeve',cylinder,burgundy),forearm=mesh(body,'Pan Man forearm sleeve',cylinder,burgundy);
  const hand=part(body,sign<0?'Pan Man drink hand':'Pan Man gesturing hand');
  ball(hand,'Slim hand palm',[0,0,0],[.038,.058,.03],skin);
  for(let i=0;i<4;i++)ball(hand,'Long finger',[(i-1.5)*.016,-.043,.008],[.01,.032,.014],skin);
  ball(hand,'Thumb',[-sign*.037,-.006,.025],[.016,.033,.018],skin);
  hands.push(hand);limbs.push({sign,thigh,shin,sleeve,forearm});
 }
 const drink=part(hands[0],'Pan Man held drink',[.005,.075,.025]);
 const cup=mesh(drink,'Clear highball glass',new T.CylinderGeometry(.064,.055,.20,20,1,true),glass,[0,.06,0]);cup.castShadow=false;
 mesh(drink,'Glass bottom',new T.CylinderGeometry(.055,.055,.008,20),glass,[0,-.037,0]).castShadow=false;
 mesh(drink,'Amber party drink',new T.CylinderGeometry(.055,.049,.117,20),amber,[0,.024,0]);
 for(const [x,z,a] of [[-.021,0,.35],[.024,.012,-.4]]){const ice=box(drink,'Floating ice cube',[x,.091,z],[.040,.032,.036],iceMat);ice.rotation.y=a;ice.castShadow=false;}
 const rim=mesh(drink,'Glass rim',new T.TorusGeometry(.063,.005,6,24),glass,[0,.162,0]);rim.rotation.x=Math.PI/2;rim.castShadow=false;
 const label=part(actor,'Pan Man floating name',[0,2.53,.035]);label.userData={text:PAN_MAN.name,billboard:true};
 const labelInk=materials['Guest name ivory']??new T.MeshBasicMaterial({name:'Guest name ivory',color:0xfff3d8,side:T.DoubleSide});
 const outlineInk=materials['Guest name dark outline']??new T.MeshBasicMaterial({name:'Guest name dark outline',color:0x272333,side:T.DoubleSide});
 materials[labelInk.name]=labelInk;materials[outlineInk.name]=outlineInk;
 const lettering=new T.ShapeGeometry(new Font(fontData).generateShapes(PAN_MAN.name,.10),5);lettering.computeBoundingBox();const center=lettering.boundingBox.getCenter(new T.Vector3());lettering.translate(-center.x,-center.y,0);
 for(const [x,y] of [[-.003,0],[.003,0],[0,-.003],[0,.003]])mesh(label,'Name outline',lettering,outlineInk,[x,y,-.002]);
 mesh(label,'Pan Man name lettering',lettering,labelInk);label.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=false;});
 const anchor=part(actor,'Pan Man speech anchor',[0,2.80,0]);
 const crewUV=FILM_CREW.patio.reduce((sum,p)=>[sum[0]+p[0]/FILM_CREW.patio.length,sum[1]+p[1]/FILM_CREW.patio.length],[0,0]);
 const crewTarget=new T.Vector3(...world(...crewUV,PAN_MAN.y)),partyTarget=new T.Vector3(...world(960,530,PAN_MAN.y));
 const va=new T.Vector3(),vb=new T.Vector3(),labelWorld=new T.Vector3(),cameraWorld=new T.Vector3(),rotation=new T.Quaternion(),yawQ=new T.Quaternion();
 function segment(o,a,b,r){va.set(...a);vb.set(...b).sub(va);o.position.copy(va).addScaledVector(vb,.5);o.scale.set(r,vb.length(),r);o.quaternion.setFromUnitVectors(up,vb.normalize());}
 const guest={id:PAN_MAN.id,speechName:PAN_MAN.name,voiceCue:'buschemi',group:actor,body,head,label,anchor,drink,hands,smile,shout,spec:PAN_MAN,speech:null,crewTarget,
  rigidParts:[trouserHips,torso,portrait,...hands],
  setPosition(position){actor.position.copy(position);},
  faceToward(position){actor.rotation.y=Math.atan2(position.x-actor.position.x,position.z-actor.position.z);}
 };
 let elapsed=0,nextShout=PAN_MAN.firstShout,lineIndex=0;
 function pose(time,calling){
  const running=!!guest.escapeRunning;
  const swim=guest.escapeSwim??0;
  const sway=Math.sin(time*1.7)*.020;
  body.rotation.z=calling?Math.sin(time*4.5)*.015:sway;body.rotation.x=calling?-.045:Math.sin(time*1.1)*.01;
  head.rotation.y=Math.sin(time*.9)*.055;head.rotation.x=calling?-.065:-.025;
  smile.visible=!calling;shout.visible=calling;mouth.scale.y=.047+.012*(.5+.5*Math.sin(time*13));
  const sip=!calling?Math.max(0,Math.sin(time*.48-1))**8:0;
  for(const [i,l] of limbs.entries()){
   const stride=running?Math.sin(time*19+i*Math.PI):0,lift=running?Math.max(0,-stride)*.23:0;
   const kick=Math.sin(time*15+i*Math.PI),knee=[l.sign*.13,.58+lift*.3-swim*.11,.035+stride*.23*(1-swim)-swim*.28],ankle=[l.sign*.145,.11+lift*(1-swim)+swim*(.18+kick*.12),.02+stride*.42*(1-swim)-swim*(.72+kick*.18)];
   segment(l.thigh,[l.sign*.10,1.045,0],knee,.066);
   segment(l.shin,knee,ankle,.049);feet[i].position.set(ankle[0],ankle[1]-.05,ankle[2]+.038);feet[i].rotation.x=running?-stride*.25:0;
   const pos=i===0?[-.33+sip*.235,.31+sip*.53+(calling?.15:0),.28+sip*.045]:[.33+(calling?.16:.04),.20+(calling?.43+.055*Math.sin(time*6):.07*Math.sin(time*1.7)),calling?.45:.16];
   const elbow=[l.sign*.30,.41+(calling?.075:0)+sip*(i===0?.10:0),.07];
   if(swim){const swimHand=i===0?[-.38,1.12,.29]:[.42,.20+Math.sin(time*8)*.12,.15+Math.cos(time*8)*.32],swimElbow=i===0?[-.43,.79,.21]:[.40,.46,.06];for(let n=0;n<3;n++){pos[n]+=(swimHand[n]-pos[n])*swim;elbow[n]+=(swimElbow[n]-elbow[n])*swim;}}
   segment(l.sleeve,[l.sign*.21,.61,0],elbow,.068);segment(l.forearm,elbow,pos,.052);
   hands[i].position.set(...pos);hands[i].rotation.set(-body.rotation.x,0,-body.rotation.z);
  }
  if(running){body.rotation.x=.12+swim*.10;body.position.y=1.04+Math.abs(Math.sin(time*19))*.04*(1-swim);head.rotation.x=-body.rotation.x;}
  else body.position.y=1.04;
  if(swim)hands[0].rotation.x=-body.rotation.x;
 }
 function update(dt,camera=null){
  dt=Math.max(0,dt);elapsed+=dt;
  if(!guest.scripted&&guest.speech){guest.speech.remaining-=dt;if(guest.speech.remaining<=0)guest.speech=null;}
  if(!guest.scripted&&elapsed>=nextShout){const text=PAN_MAN_LINES[lineIndex%PAN_MAN_LINES.length],duration=lineIndex%2?9:5.5;say(guest,text,duration);nextShout=elapsed+duration+PAN_MAN.quietSeconds;lineIndex++;}
  const target=guest.speech?crewTarget:partyTarget,yaw=Math.atan2(target.x-actor.position.x,target.z-actor.position.z);
  yawQ.setFromAxisAngle(up,yaw);if(!guest.scripted)actor.quaternion.slerp(yawQ,1-Math.exp(-dt*5));pose(elapsed,!!guest.speech);
  if(camera){actor.updateWorldMatrix(true,true);camera.getWorldPosition(cameraWorld);label.getWorldPosition(labelWorld);actor.getWorldQuaternion(rotation);label.quaternion.copy(rotation.invert()).multiply(yawQ.setFromAxisAngle(up,Math.atan2(cameraWorld.x-labelWorld.x,cameraWorld.z-labelWorld.z)));}
 }
 function reset(){elapsed=0;nextShout=PAN_MAN.firstShout;lineIndex=0;guest.speech=null;guest.scripted=false;guest.escapeRunning=false;guest.escapeSwim=0;guest.faceToward(partyTarget);pose(0,false);}
 reset();Object.assign(guest,{update,reset});
 return guest;
}

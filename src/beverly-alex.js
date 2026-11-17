import {createStoryRig} from './beverly-story-rig.js';
import {world,LEVELS} from './beverly-layout.js';
import {say} from './stickman-behavior.js';
import {makePartyWander} from './beverly-party-crowd.js';
import {createGuestApproach} from './beverly-guest-approach.js';
import {Font} from '../vendor/FontLoader.js';
import fontData from '../vendor/beverly-font.js';

export const ALEX_BURP='Burrp!';
export const ALEX_LINES=Object.freeze(["I followed my dad's handkerchief here.",'Who did I even come here with?',ALEX_BURP]);
// Each observation plays twice before a burp, including after a level reset.
export const ALEX_SPEECH_SEQUENCE=Object.freeze([ALEX_LINES[0],ALEX_LINES[1],ALEX_LINES[0],ALEX_LINES[1],ALEX_BURP]);
export const ALEX={id:'alex',name:'Alex',u:941,v:803,y:LEVELS.patio,firstSpeech:8,quietSeconds:14};
export const ALEX_WANDER=[[941,803],[944,782],[941,754],[943,733]];

// An independently movable story character. Local +Z faces forward.
export function buildAlex(T,root,groups,materials){
 const group=new T.Group();group.name='Alex_guest';group.userData.dynamic=true;root.add(group);groups.Alex_guest=group;
 const actor=new T.Group();actor.name=ALEX.name;actor.position.set(...world(ALEX.u,ALEX.v,ALEX.y));group.add(actor);
 actor.userData={id:ALEX.id,role:'main story character and party guest',hostile:false,playerControlled:false,
  reference:'Charlie Heaton as Alex in the user-supplied Billy Knight bus photograph',
  appearance:'Average height, lanky, slightly oversized head, parted tousled brown hair, pale blue overshirt, dark slim trousers, puzzled and amazed expression, held drink',
  location:'Side back patio outside the fireplace-room exit, leaving the doorway clear',dialogue:[...ALEX_LINES],speechSequence:[...ALEX_SPEECH_SEQUENCE],interactions:'Small wandering loop and approach greetings; scripted terrace and wooden-room scenes controlled by beverly-story.js'};
 const mat=(name,color,extra={})=>materials[name]=new T.MeshStandardMaterial({name,color,roughness:.8,...extra});
 const skin=mat('Alex fair skin',0xd9b39b),crease=mat('Alex face shading',0xae8571),lip=mat('Alex muted lips',0xa97469);
 const blue=mat('Alex pale blue overshirt',0xb6ccdc),seam=mat('Alex blue seams',0x809db2),tee=mat('Alex ivory undershirt',0xe9e4d7);
 const trousers=mat('Alex charcoal narrow jeans',0x292d34),shoeMat=mat('Alex dark shoes',0x24262c,{roughness:.47}),sole=mat('Alex worn shoe soles',0x676663);
 const hair=mat('Alex dark brown hair',0x3f302a),hairMid=mat('Alex chestnut fringe',0x77513a),hairLight=mat('Alex light brown hair strands',0x9d7551);
 const ink=mat('Alex dark features',0x30272a),eyeWhite=mat('Alex eye whites',0xf3e6d9),iris=mat('Alex hazel eyes',0x7b8465);
 const glass=mat('Alex clear highball glass',0xc4e3e7,{transparent:true,opacity:.33,roughness:.13,side:T.DoubleSide,depthWrite:false});
 const amber=mat('Alex amber drink',0xc58737,{roughness:.22}),iceMat=mat('Alex ice',0xd9edf0,{transparent:true,opacity:.64,roughness:.2});
 const sphere=new T.SphereGeometry(1,16,12),rod=new T.CylinderGeometry(1,1,1,10),cube=new T.BoxGeometry(1,1,1),up=new T.Vector3(0,1,0);
 function mesh(parent,name,geometry,m,p=[0,0,0],scale=[1,1,1]){const o=new T.Mesh(geometry,m);o.name=name;o.position.set(...p);o.scale.set(...scale);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
 const ball=(g,n,p,size,m)=>mesh(g,n,sphere,m,p,size),box=(g,n,p,size,m)=>mesh(g,n,cube,m,p,size);
 function part(parent,name,p=[0,0,0]){const g=new T.Group();g.name=name;g.position.set(...p);parent.add(g);return g;}
 function line(g,n,points,r,m){return mesh(g,n,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),16,r,5,false),m);}
 const hips=part(actor,'Alex hips and grounded shoes');
 const jeans=part(hips,'Alex jean hips'),feet=[];
 ball(jeans,'Narrow jean hips',[0,.895,0],[.151,.12,.10],trousers);
 for(const sign of [-1,1]){
  const foot=part(hips,'Alex walking shoe',[sign*.125,0,0]);feet.push(foot);
  ball(foot,'Worn dark shoe',[0,.061,.055],[.075,.059,.155],shoeMat);
  ball(foot,'Flat sole',[0,.018,.055],[.077,.018,.157],sole);
 }
 const body=part(actor,'Alex relaxed upper body',[0,.90,0]),torso=part(body,'Alex light blue overshirt');
 ball(torso,'Narrow ivory T shirt',[0,.235,.025],[.144,.287,.097],tee);
 ball(torso,'Long light blue shirt back',[0,.237,-.048],[.169,.30,.089],blue);
 for(const sign of [-1,1]){
  ball(torso,'Open overshirt front',[sign*.119,.231,.022],[.058,.30,.088],blue);
  ball(torso,'Slightly dropped shoulder',[sign*.177,.46,0],[.073,.080,.10],blue);
  const collar=box(torso,'Pointed open collar',[sign*.062,.515,.092],[.070,.113,.025],blue);collar.rotation.z=sign*.35;
  box(torso,'Chest pocket',[sign*.111,.334,.11],[.082,.10,.012],seam);
  box(torso,'Pocket flap',[sign*.111,.376,.120],[.089,.024,.012],blue);
  ball(torso,'Pocket button',[sign*.111,.369,.13],[.008,.008,.005],ink);
  line(torso,'Long overshirt seam',[[sign*.064,.447,.127],[sign*.080,.21,.122],[sign*.077,-.027,.102]],.004,seam);
 }
 for(let i=0;i<4;i++)ball(torso,'Overshirt dark button',[.079,.28-i*.081,.129],[.008,.008,.005],ink);
 ball(torso,'Slender neck',[0,.556,.014],[.064,.104,.063],skin);
 const head=part(body,'Alex observing head',[0,.793,.035]),portrait=part(head,'Alex portrait and parted hair');
 ball(portrait,'Slightly oversized face',[0,0,0],[.211,.251,.170],skin);
 ball(portrait,'Tapered jaw',[0,-.139,.012],[.143,.11,.13],skin);
 for(const sign of [-1,1]){
  ball(portrait,'Ear',[sign*.207,-.007,-.003],[.033,.067,.027],skin);
  ball(portrait,'Ear fold',[sign*.229,-.008,.013],[.008,.036,.009],crease);
  ball(portrait,'High cheekbone',[sign*.124,-.054,.101],[.058,.052,.040],skin);
  ball(portrait,'Wide curious eye',[sign*.084,.034,.153],[.050,.031,.017],eyeWhite);
  ball(portrait,'Hazel iris',[sign*.080,.039,.17],[.019,.022,.008],iris);
  ball(portrait,'Small pupil',[sign*.078,.041,.178],[.009,.013,.004],ink);
  ball(portrait,'Eye catchlight',[sign*.073,.050,.182],[.004,.004,.002],eyeWhite);
  line(portrait,'Soft lower eyelid',[[sign*.044,.003,.162],[sign*.084,-.003,.169],[sign*.128,.006,.143]],.0035,crease);
  const raised=sign<0?.022:0;
  line(portrait,'Uneven questioning eyebrow',[[sign*.035,.092+raised,.154],[sign*.077,.114+raised,.151],[sign*.134,.088+raised,.133]],.012,hair);
 }
 ball(portrait,'Long narrow nose',[0,-.006,.165],[.029,.067,.036],skin);
 ball(portrait,'Nose tip',[0,-.064,.196],[.036,.027,.029],skin);
 for(const sign of [-1,1])ball(portrait,'Nostril',[sign*.023,-.076,.206],[.009,.005,.005],crease);
 const neutral=part(head,'Alex slightly amazed mouth');
 ball(neutral,'Parted lips',[0,-.131,.153],[.047,.023,.013],lip);
 ball(neutral,'Small open mouth',[0,-.13,.164],[.035,.012,.006],ink);
 const talking=part(head,'Alex speaking mouth');
 ball(talking,'Talking lips',[0,-.137,.154],[.049,.038,.013],lip);
 const mouth=ball(talking,'Open speaking mouth',[0,-.137,.166],[.038,.027,.006],ink);
 ball(talking,'Upper teeth',[0,-.117,.172],[.030,.006,.003],eyeWhite);
 const burp=part(head,'Alex burping mouth');
 ball(burp,'Rounded burp lips',[0,-.136,.154],[.039,.047,.013],lip);
 ball(burp,'Rounded burp opening',[0,-.136,.166],[.029,.036,.007],ink);
 talking.visible=burp.visible=false;
 const smile=part(head,'Alex huge happy smile');
 ball(smile,'Big delighted grin',[0,-.127,.169],[.080,.047,.012],ink);
 ball(smile,'Big smiling teeth',[0,-.115,.18],[.068,.026,.006],eyeWhite);
 // Sit below the raised cheekbone, tangent to the lower right cheek, so the
 // whole print clears the face facets from Christel's side of the conversation.
 const kiss=part(head,'Alex lipstick kiss — right cheek',[-.137,-.142,.105]);kiss.rotation.set(0,-.85,.18);
 const lipstick=mat('Alex lipstick kiss red',0xc32852,{emissive:0x661021,emissiveIntensity:.25});
 for(const sign of [-1,1]){
  const mark=ball(kiss,'Lipstick upper lip',[sign*.019,.006,0],[.025,.010,.004],lipstick);mark.rotation.z=sign*.24;
 }
 line(kiss,'Lipstick lower lip',[[-.041,0,0],[0,-.019,.002],[.041,0,0]],.007,lipstick);
 const leftKiss=kiss.clone();leftKiss.name='Alex lipstick kiss — left cheek';
 leftKiss.position.set(.137,-.142,.105);leftKiss.rotation.set(0,.85,-.18);head.add(leftKiss);
 const foreheadKiss=kiss.clone();foreheadKiss.name='Alex lipstick kiss — forehead';
 foreheadKiss.position.set(.012,.160,.168);foreheadKiss.rotation.set(-.25,0,-.24);head.add(foreheadKiss);
 const kisses=[kiss,leftKiss,foreheadKiss];
 const messy=part(head,'Alex dishevelled locks');
 for(const [x,a] of [[-.14,-.6],[-.04,.3],[.07,-.35],[.16,.55]]){
  const tuft=ball(messy,'Dishevelled hair tuft',[x,.207,.025],[.031,.067,.052],hairMid);tuft.rotation.z=a;
 }
 smile.visible=messy.visible=false;for(const mark of kisses)mark.visible=false;
 // Long, uneven curtains at the temples and a lighter swept front, as on the bus wrap.
 ball(portrait,'Dark tousled back of hair',[0,.050,-.116],[.219,.233,.087],hair);
 for(const sign of [-1,1])for(let i=0;i<5;i++){
  const x=sign*(.184+Math.sin(i*.65)*.02),y=.162-i*.052,z=-.009-i*.011;
  const lock=ball(portrait,'Loose side hair',[x,y,z],[.045,.083,.067],hair);lock.rotation.z=sign*(.16+i*.12);
  line(portrait,'Fine side hair strand',[[x-sign*.015,y+.052,z+.060],[x+sign*.013,y+.004,z+.064],[x+sign*.012,y-.062,z+.027]],.0035,hairMid);
 }
 for(let i=0;i<8;i++){
  const x=-.175+i*.05,y=.211+Math.sin(i*.73)*.018;
  const lock=ball(portrait,'Parted chestnut crown',[x,y,-.015],[.057,.065,.124],i<5?hairMid:hair);lock.rotation.z=x<0?.28:-.37;
  line(portrait,'Swept light hair strand',[[x,.257,-.056],[x-.013,.258,.024],[x-.023,.186,.095]],.004,hairLight);
 }
 for(const [x,y,a] of [[-.147,.148,-.28],[-.101,.165,-.25],[-.055,.192,-.12],[.071,.174,.32],[.127,.139,.42],[.176,.103,.48]]){
  const fringe=ball(portrait,'Uneven curtain fringe',[x,y,.105],[.033,.085,.037],x<0?hairMid:hair);fringe.rotation.z=a;
  line(portrait,'Fringe fine strand',[[x-.005,y+.06,.133],[x+.011,y,.142],[x+.01,y-.056,.12]],.003,hairLight);
 }
 const limbs=[],hands=[];
 for(const sign of [-1,1]){
  const thigh=mesh(actor,'Alex slim trouser thigh',rod,trousers),shin=mesh(actor,'Alex slim trouser shin',rod,trousers);
  const sleeve=mesh(body,'Alex long shirt sleeve',rod,blue),forearm=mesh(body,'Alex forearm sleeve',rod,blue);
  const hand=part(body,sign>0?'Alex drink hand':'Alex wondering hand');
  ball(hand,'Slim palm',[0,0,0],[.036,.056,.031],skin);
  for(let i=0;i<4;i++)ball(hand,'Finger',[(i-1.5)*.015,-.042,.015],[.010,.03,.013],skin);
  ball(hand,'Thumb',[-sign*.034,-.002,.025],[.015,.031,.019],skin);
  box(hand,'Blue cuff',[0,.065,0],[.088,.045,.081],blue);
  hands.push(hand);limbs.push({sign,thigh,shin,sleeve,forearm});
 }
 // Props stay outside the hand's rigid batch so scenes can swap them.
 const drink=part(body,'Alex held drink',[0,.074,.028]);
 mesh(drink,'Clear highball',new T.CylinderGeometry(.056,.048,.185,18,1,true),glass,[0,.055,0]).castShadow=false;
 mesh(drink,'Glass base',new T.CylinderGeometry(.048,.048,.008,18),glass,[0,-.035,0]).castShadow=false;
 mesh(drink,'Amber drink',new T.CylinderGeometry(.048,.043,.105,18),amber,[0,.016,0]);
 for(const [x,z,a] of [[-.018,0,.3],[.019,.012,-.4]]){const ice=box(drink,'Ice cube',[x,.074,z],[.030,.027,.031],iceMat);ice.rotation.y=a;ice.castShadow=false;}
 const rim=mesh(drink,'Glass rim',new T.TorusGeometry(.055,.004,6,24),glass,[0,.149,0]);rim.rotation.x=Math.PI/2;rim.castShadow=false;
 const ticket=part(body,'Alex movie ticket');
 const paper=mat('Alex movie ticket cream',0xffedb3),ticketInk=mat('Alex movie ticket ink',0x362943);
 box(ticket,'Movie admission ticket',[0,.12,0],[.30,.17,.012],paper);
 const ticketText=new T.ShapeGeometry(new Font(fontData).generateShapes('MOVIE',.033),3);
 mesh(ticket,'MOVIE ticket lettering',ticketText,ticketInk,[-.069,.117,.008]);
 for(let i=0;i<9;i++)box(ticket,'Ticket barcode',[-.09+i*.023,.062,.009],[.006,.025,.002],ticketInk);
 ticket.visible=false;
 const label=part(actor,'Alex floating name',[0,2.19,0]);label.userData={text:ALEX.name,billboard:true};
 const labelInk=materials['Guest name ivory']??mat('Alex name ivory',0xfff3d8),outlineInk=materials['Guest name dark outline']??mat('Alex name outline',0x272333);
 const lettering=new T.ShapeGeometry(new Font(fontData).generateShapes(ALEX.name,.10),5);lettering.computeBoundingBox();const center=lettering.boundingBox.getCenter(new T.Vector3());lettering.translate(-center.x,-center.y,0);
 for(const [x,y] of [[-.003,0],[.003,0],[0,-.003],[0,.003]])mesh(label,'Name outline',lettering,outlineInk,[x,y,-.002]);
 mesh(label,'Alex name lettering',lettering,labelInk);label.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=false;});
 const anchor=part(actor,'Alex speech anchor',[0,2.46,0]);
 const va=new T.Vector3(),vb=new T.Vector3(),cameraWorld=new T.Vector3(),labelWorld=new T.Vector3(),rotation=new T.Quaternion(),yawQ=new T.Quaternion();
 function segment(o,a,b,r){va.set(...a);vb.set(...b).sub(va);o.position.copy(va).addScaledVector(vb,.5);o.scale.set(r,vb.length(),r);o.quaternion.setFromUnitVectors(up,vb.normalize());}
 const wander=makePartyWander(T,ALEX_WANDER,ALEX.y,{seed:818,closed:true,speed:.48});
 const guest={id:ALEX.id,speechName:ALEX.name,voiceCue:'loon',spec:ALEX,group:actor,body,head,label,anchor,drink,ticket,hands,feet,neutral,talking,burp,smile,kiss,kisses,messy,speech:null,
  moving:false,running:false,wandering:true,scripted:false,expression:null,afterBath:false,
  rigidParts:[jeans,...feet,torso,portrait,...hands,drink,ticket],
  setPosition(position){guest.wandering=false;actor.position.copy(position);},
  faceToward(position){actor.rotation.y=Math.atan2(position.x-actor.position.x,position.z-actor.position.z);}};
 guest.faceToward(new T.Vector3(...world(935,660,ALEX.y)));
 guest.storyRig=createStoryRig(T,guest,portrait,limbs,{emily:false});
 let elapsed=0,nextSpeech=ALEX.firstSpeech,lineIndex=0,wanderTime=0,walkPhase=0;
 function speak(){const text=guest.afterBath?'That was amazing, and I feel nice and clean now.':ALEX_SPEECH_SEQUENCE[lineIndex++%ALEX_SPEECH_SEQUENCE.length],duration=text===ALEX_BURP?2.5:6;say(guest,text,duration);nextSpeech=elapsed+duration+ALEX.quietSeconds;}
 const approach=createGuestApproach(guest,speak);
 function pose(time){
  const burping=guest.speech?.text===ALEX_BURP,speaking=!!guest.speech&&!burping;
  const sip=!guest.speech?Math.max(0,Math.sin(time*.46-.8))**8:0;
  body.position.y=.90+(guest.moving?Math.abs(Math.sin(walkPhase))*.025:0);
  body.rotation.z=Math.sin(time*.85)*.015;body.rotation.x=guest.running?.12:.018+(burping?Math.sin(time*12)*.018:0);
  head.rotation.set(burping?-.07:-.035+Math.sin(time*.61)*.03,guest.attending||guest.scripted?0:Math.sin(time*.32)*.26,.065+Math.sin(time*.43)*.025);
  smile.visible=guest.expression==='happy'&&!speaking;
  neutral.visible=!guest.speech&&!smile.visible;talking.visible=speaking;burp.visible=burping;mouth.scale.y=.020+.010*(.5+.5*Math.sin(time*12));
  messy.visible=guest.afterBath;for(const mark of kisses)mark.visible=guest.afterBath;
  for(const [i,l] of limbs.entries()){
   const step=guest.moving?Math.sin(walkPhase)*l.sign*(guest.running?.34:.14):0,lift=guest.moving?Math.max(0,Math.sin(walkPhase)*l.sign)*(guest.running?.14:.045):0;
   feet[i].position.set(l.sign*.125,lift,step);
   segment(l.thigh,[l.sign*.095,.9,0],[l.sign*.117,.47,.025+step*.45],.061);
   segment(l.shin,[l.sign*.117,.47,.025+step*.45],[l.sign*.125,.10+lift,.015+step],.045);
   // A big wave with the free hand when asked (the trailer stage).
   const wave=guest.waving&&i===0;
   const p=wave?[-.41-Math.sin(time*10)*.11,.76,.16]:i===1?(ticket.visible?[.30,.57+Math.sin(time*8)*.09,.22]:[.275-sip*.23,.14+sip*.45,.18+sip*.09]):[-.245-(speaking?.05:0),-.11+(speaking?.22:0),.10+(speaking?.06:0)-step*.7];
   const elbow=wave?[-.32,.42,.05]:[l.sign*.265,.23+(i===1?sip*.095:0),.05];
   segment(l.sleeve,[l.sign*.178,.457,0],elbow,.059);segment(l.forearm,elbow,p,.044);
   hands[i].position.set(...p);hands[i].rotation.set(-body.rotation.x-(i===1?sip*.18:0),0,-body.rotation.z);
  }
  drink.position.copy(hands[1].position).add(new T.Vector3(0,.074,.028));drink.quaternion.copy(hands[1].quaternion);
  ticket.position.copy(hands[1].position);ticket.rotation.set(-.15,Math.sin(time*6)*.3,Math.sin(time*8)*.18);
 }
 function update(dt,camera=null,context={}){
  dt=Math.max(0,dt);elapsed+=dt;
  if(!guest.scripted&&actor.visible){
   if(guest.speech){guest.speech.remaining-=dt;if(guest.speech.remaining<=0)guest.speech=null;}
   guest.attending=approach.update(dt,context);
   if(elapsed>=nextSpeech&&!guest.attending)speak();
   guest.moving=false;
   if(guest.wandering&&!guest.speech&&!guest.attending){
    wanderTime+=Math.max(0,Math.min(dt,elapsed-4));const p=wander.sample(wanderTime);actor.position.copy(p.position);guest.moving=p.moving;
    if(guest.moving)guest.faceToward(p.position.clone().add(p.direction));
   }
  }
  if(guest.moving)walkPhase+=dt*(guest.running?12:4.4);
  pose(elapsed);guest.storyRig.update(elapsed);
  if(camera){actor.updateWorldMatrix(true,true);camera.getWorldPosition(cameraWorld);label.getWorldPosition(labelWorld);actor.getWorldQuaternion(rotation);label.quaternion.copy(rotation.invert()).multiply(yawQ.setFromAxisAngle(up,Math.atan2(cameraWorld.x-labelWorld.x,cameraWorld.z-labelWorld.z)));}
 }
 function reset(){elapsed=lineIndex=wanderTime=walkPhase=0;nextSpeech=ALEX.firstSpeech;Object.assign(guest,{speech:null,moving:false,running:false,scripted:false,attending:false,expression:null,afterBath:false,wandering:true});wander.reset();approach.reset();actor.visible=true;actor.position.set(...world(ALEX.u,ALEX.v,ALEX.y));guest.faceToward(new T.Vector3(...world(935,660,ALEX.y)));drink.visible=true;ticket.visible=false;pose(0);}
 const resetBase=reset;const resetScene=()=>{guest.waterPose=null;guest.expression=null;actor.rotation.set(0,0,0);label.visible=true;resetBase();guest.storyRig.update(0);};
 resetScene();Object.assign(guest,{update,reset:resetScene});return guest;
}

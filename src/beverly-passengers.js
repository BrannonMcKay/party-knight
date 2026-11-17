import {Font} from '../vendor/FontLoader.js';
import fontData from '../vendor/beverly-font.js';
import {world,DRIVE,nearPolyline,plan,PATIO_FOUNTAIN} from './beverly-layout.js';
import {BUS_DOOR} from './beverly-bus.js';
import {EXTRA_PASSENGERS,PATIO_PARTY_LOOP,createPartyGuestFactory,makePartyWander,buildPoolParty} from './beverly-party-crowd.js';

export const PASSENGER_TIMING={first:BUS_DOOR.delay+BUS_DOOR.duration+.15,spacing:1,exitSpeed:.72,pranceSpeed:1.75,waddleSpeed:1.05,guestSpeed:1.35,barService:2.3,pause:1.4};

// The two authored leads are followed by eight ordinary party guests.
export function buildBeverlyPassengers(T,root,groups,materials,bus){
 const group=new T.Group();group.name='Party_bus_passengers';group.userData={dynamic:true,activeCount:10,churroGuests:3,barGuests:6,prancingGuests:1};root.add(group);groups.Party_bus_passengers=group;
 const mat=(name,color,extra={})=>materials[name]=new T.MeshStandardMaterial({name,color,roughness:.7,...extra});
 const skin=mat('Guest ivory stick limbs',0xead5bc),pink=mat('Guest bright pink shorts',0xfa4598),shirt=mat('Guest cropped ivory shirt',0xffeee4),ink=mat('Guest face ink',0x25232c),hair=mat('Guest chestnut hair',0x5b3130),beard=mat('Guest short beard',0x6c423c),lip=mat('Guest rose lipstick',0xd82b63),shadow=mat('Guest lavender eye shadow',0xa779c7),gold=mat('Guest gold earrings',0xe8b857,{metalness:.65,roughness:.3}),teal=mat('Guest loose teal shirt',0x42a69c),dark=mat('Guest dark shorts and shoes',0x34454e),white=mat('Guest smile and eyes',0xfffaf2);
 const cube=new T.BoxGeometry(1,1,1),sphere=new T.SphereGeometry(1,18,12),cylinder=new T.CylinderGeometry(1,1,1,9),font=new Font(fontData);
 function mesh(parent,name,geometry,m,p=[0,0,0],scale=[1,1,1]){const o=new T.Mesh(geometry,m);o.name=name;o.position.set(...p);o.scale.set(...scale);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 const ball=(g,n,p,scale,m)=>mesh(g,n,sphere,m,p,scale);
 const box=(g,n,p,scale,m)=>mesh(g,n,cube,m,p,scale);
 function line(g,n,points,r,m){return mesh(g,n,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),24,r,6,false),m);}
 function text(g,value,y,size){const geo=new T.ShapeGeometry(font.generateShapes(value,size),4);geo.computeBoundingBox();geo.translate(-(geo.boundingBox.min.x+geo.boundingBox.max.x)/2,0,0);const label=mesh(g,value,geo,ink,[0,y,.166]);label.userData.text=value;}
 function actor(id,name,tall){
  const g=new T.Group();g.name=name;group.add(g);g.userData={id,style:tall?'Tall stick figure, pink shorts, cropped Token Trans shirt, hair, earrings, lipstick, eye shadow and short beard':'Short round-shirted stick figure, huge grin and tiny stick legs',movement:tall?'Prance between entrance fountain and back patio through house':'Waddle to the churro tent'};
  const body=new T.Group();body.name=name+' torso and face';g.add(body);
  const hip=tall?1.04:.43,shoulder=tall?1.57:.99;
  if(tall){
   ball(body,'Exposed midriff',[0,1.25,0],[.155,.19,.12],skin);
   box(body,'Pink shorts waistband',[0,1.065,0],[.44,.12,.29],pink);
   for(const sign of [-1,1])box(body,'Pink short leg',[sign*.13,.972,0],[.17,.18,.30],pink);
   box(body,'Cropped shirt',[0,1.50,0],[.49,.36,.30],shirt);
   for(const sign of [-1,1])ball(body,'Crop top sleeve',[sign*.245,1.57,0],[.092,.095,.14],shirt);
   text(body,'Token',1.535,.091);text(body,'Trans',1.407,.091);
   ball(body,'Neck',[0,1.727,0],[.072,.095,.073],skin);
   const head=new T.Group();head.name='Hair makeup earrings and short beard';head.position.y=1.90;body.add(head);
   ball(head,'Tall guest head',[0,0,0],[.208,.225,.196],skin);
   mesh(head,'Swept hair crown',new T.SphereGeometry(1,18,10,0,Math.PI*2,0,1.18),hair,[0,.01,-.008],[.223,.239,.207]);
   ball(head,'Gathered back hair',[0,-.02,-.17],[.20,.245,.10],hair);
   ball(head,'Side swept lock',[-.16,.075,.10],[.065,.143,.085],hair);
   for(const sign of [-1,1]){
    ball(head,'Ear',[sign*.208,-.01,0],[.04,.057,.038],skin);
    mesh(head,'Gold hoop earring',new T.TorusGeometry(.058,.012,7,20),gold,[sign*.231,-.089,.022]);
    ball(head,'Lavender eye shadow',[sign*.073,.055,.182],[.062,.038,.019],shadow);
    ball(head,'Eye white',[sign*.073,.033,.195],[.048,.022,.016],white);
    ball(head,'Dark eye',[sign*.073,.031,.209],[.016,.019,.008],ink);
    line(head,'Upper eyeliner',[[sign*.028,.049,.208],[sign*.074,.062,.211],[sign*.116,.05,.199]],.008,ink);
    ball(head,'Short beard cheek',[sign*.139,-.115,.12],[.032,.066,.035],beard);
   }
   ball(head,'Nose',[0,-.017,.202],[.029,.045,.039],skin);
   ball(head,'Short beard chin',[0,-.174,.125],[.123,.049,.053],beard);
   line(head,'Rose upper lip',[[-.066,-.096,.188],[-.023,-.084,.205],[0,-.091,.21],[.024,-.084,.205],[.066,-.096,.188]],.012,lip);
   line(head,'Rose lower lip',[[-.06,-.102,.19],[0,-.12,.201],[.06,-.102,.19]],.012,lip);
  }else{
   ball(body,'Round loose shirt belly',[0,.735,.045],[.38,.395,.29],teal);
   for(const sign of [-1,1]){ball(body,'Loose short sleeve',[sign*.32,.98,0],[.13,.135,.18],teal);box(body,'Little shorts',[sign*.12,.434,0],[.2,.135,.21],dark);}
   box(body,'Shirt placket',[0,.845,.318],[.025,.37,.018],white);
   for(const y of [.72,.84,.96])ball(body,'Shirt button',[0,y,.333],[.021,.021,.009],gold);
   ball(body,'Short guest neck',[0,1.115,0],[.075,.08,.075],skin);
   const head=new T.Group();head.name='Broad grinning face';head.position.set(0,1.32,.015);body.add(head);
   ball(head,'Round grinning head',[0,0,0],[.235,.23,.205],skin);
   for(const sign of [-1,1]){ball(head,'Happy eye',[sign*.082,.057,.197],[.026,.035,.012],ink);ball(head,'Rounded ear',[sign*.235,-.015,0],[.04,.055,.032],skin);}
   const grin=new T.Shape();grin.moveTo(-.151,-.045);grin.quadraticCurveTo(0,-.102,.151,-.045);grin.quadraticCurveTo(.127,-.177,0,-.18);grin.quadraticCurveTo(-.127,-.177,-.151,-.045);
   mesh(head,'Huge white grin',new T.ShapeGeometry(grin,16),white,[0,0,.196]);
   line(head,'Grin outline',[[-.152,-.045,.198],[-.105,-.153,.198],[0,-.18,.199],[.105,-.153,.198],[.152,-.045,.198]],.011,ink);
   ball(head,'Button nose',[0,-.008,.216],[.044,.04,.035],skin);
  }
  const legs=[],arms=[],hands=[],feet=[];
  for(const sign of [-1,1]){
   legs.push([mesh(g,'Animated stick thigh',cylinder,skin),mesh(g,'Animated stick shin',cylinder,skin)]);
   arms.push([mesh(g,'Animated stick upper arm',cylinder,skin),mesh(g,'Animated stick forearm',cylinder,skin)]);
   hands.push(ball(g,'Guest hand',[0,0,0],[.056,.058,.055],skin));
   feet.push(ball(g,'Guest shoe',[0,0,0],tall?[.09,.068,.155]:[.105,.064,.14],tall?pink:dark));
  }
  function segment(o,a,b,r){const va=new T.Vector3(...a),vb=new T.Vector3(...b),delta=vb.clone().sub(va);o.position.copy(va).add(vb).multiplyScalar(.5);o.scale.set(r,delta.length(),r);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());}
  function pose(time,moving=true,exiting=false){
   const phase=time*(tall?8.4:9),wave=Math.sin(phase),bob=moving?(tall?.045*Math.abs(wave):.018*Math.abs(wave)):0;
   body.position.y=exiting?bob*.3:bob;body.rotation.z=moving?(tall?.026:.075)*wave:0;
   for(let i=0;i<2;i++){
    const sign=i?1:-1,step=moving?Math.sin(phase+i*Math.PI):0,lift=Math.max(0,step)*(exiting?.055:tall?.15:.052),stride=step*(exiting?.075:tall?.22:.105),x=sign*(tall?.12:.125);
    const knee=[x,hip*.5+lift*.3,stride*.52],ankle=[x,.075+lift,stride];
    segment(legs[i][0],[x,hip+body.position.y,0],knee,.041);segment(legs[i][1],knee,ankle,.038);feet[i].position.set(x,.064+lift,stride+.065);
    const elbow=[sign*(tall?.38:.43),shoulder-(tall?.22:.24),-stride*.45];
    const hand=[sign*(tall?.38:.39),shoulder-(tall?.30:.43),tall?.16-step*.09:-stride*.7];
    segment(arms[i][0],[sign*(tall?.255:.32),shoulder+body.position.y,0],elbow,.039);segment(arms[i][1],elbow,hand,.036);hands[i].position.set(...hand);
   }
  }
  function poseSwimming(time){
   pose(time,true);body.rotation.z=0;
   const sweep=(1-Math.cos(time*4))/2;
   for(let i=0;i<2;i++){
    const sign=i?1:-1,elbow=[sign*(.26+sweep*.22),shoulder+.12-sweep*.16,.02],hand=[sign*(.20+sweep*.48),shoulder+.46-sweep*.50,.07];
    segment(arms[i][0],[sign*.255,shoulder+body.position.y,0],elbow,.039);segment(arms[i][1],elbow,hand,.036);hands[i].position.set(...hand);
   }
  }
  pose(0,false);return {id,group:g,body,hands,head:body.children.find(o=>o.name===(tall?'Hair makeup earrings and short beard':'Broad grinning face')),rigidParts:[body],pose,poseSwimming,height:tall?2.15:1.56,activity:'display',distance:0};
 }
 const actors=[actor('token-trans','Token Trans',true),actor('churro-guest','Grinning churro guest',false)];
 const createGuest=createPartyGuestFactory(T,materials),extras=EXTRA_PASSENGERS.map((spec,i)=>createGuest(spec,i+2));
 for(const a of extras){group.add(a.group);actors.push(a);}
 const poolParty=buildPoolParty(T,root,groups,createGuest);
 const parked=bus.route.pose(bus.route.length);
 const fromBus=([x,y,z])=>new T.Vector3(x,y,z).applyQuaternion(parked.quaternion).add(parked.position);
 function path(points){const lengths=[0];for(let i=1;i<points.length;i++)lengths.push(lengths.at(-1)+points[i].distanceTo(points[i-1]));return {points,length:lengths.at(-1),sample(distance){const d=Math.max(0,Math.min(lengths.at(-1),distance));let i=1;while(i<lengths.length-1&&lengths[i]<d)i++;return {position:points[i-1].clone().lerp(points[i],(d-lengths[i-1])/(lengths[i]-lengths[i-1])),direction:points[i].clone().sub(points[i-1]).normalize()};}};}
 const exit=path([[.32,1.215,2.65],[.48,1.215,2.65],[.61,.915,2.65],[.83,.915,2.65],[.98,.615,2.65],[1.20,.615,2.65],[1.35,.315,2.65],[1.57,.315,2.65],[1.76,-.045,2.65],[2.18,-.045,2.65]].map(([x,y,z])=>fromBus([-x,y,z])));
 const common=[[238,565,8],[277,588,8],[315,625,8],[352,659,8],[395,675,8]];
 const toFountain=path([exit.points.at(-1),...common.map(p=>new T.Vector3(...world(...p))),new T.Vector3(...world(433,665,8))]);
 const prance=path([[433,665,8],[557,691,8],[585,652,8],[610,626,8],[642,610,8],[670,606,8.15],[723,606,8.15],[723,582,8.15],[782,582,8.15],[836,582,8.15],[856,555,8.15],[900,546,8.15]].map(p=>new T.Vector3(...world(...p))));
 const roadCurve=new T.CatmullRomCurve3(DRIVE.map(p=>new T.Vector3(...world(...p))));
 const roadSamples=Array.from({length:1201},(_,i)=>{const p=roadCurve.getPoint(i/1200);return [...plan(p.x,p.z),p.y];});
 const cateringPoints=[[436,696,8],[464,704,8],[420,726],[391,752],[370,776],[359,830],[351,890],[348,934],[332,922],[320,911,6.64],[310,901,6.70],[307,897,6.54],[305,895,6.54],[294,877,6.54],[282,863,6.54],[266,863,6.54]];
 const toChurros=path([exit.points.at(-1),...common.map(p=>new T.Vector3(...world(...p))),...cateringPoints.map(([u,v,y])=>new T.Vector3(...world(u,v,y??nearPolyline(u,v,roadSamples).height)))]);
 const extraPaths={};let barIndex=0,churroIndex=0;
 for(const [i,a] of extras.entries()){
  if(a.destination==='churros'){
   const v=churroIndex++?886:844;
   a.approach=path([...toChurros.points.slice(0,-1),...[ [275,863,6.54],[275,v,6.54],[264,v,6.54] ].map(p=>new T.Vector3(...world(...p)))]);
  }else{
   const slot=barIndex++,u=884+slot*8,v=466+(slot%2)*5;
   a.approach=path([...toFountain.points,...prance.points.slice(1),...[ [900,520,8.15],[900,496,8.15],[u,v,8.15] ].map(p=>new T.Vector3(...world(...p)))]);
   a.departure=path([[u,v,8.15],[u,497,8.15],[900,520,8.15]].map(p=>new T.Vector3(...world(...p))));
   a.wander=makePartyWander(T,PATIO_PARTY_LOOP,8.15,{seed:41+i*71,closed:true,speed:.62+(i%3)*.065});
   extraPaths[a.id+'-bar-departure']=a.departure;
  }
  extraPaths[a.id+'-approach']=a.approach;
 }
 function place(a,sample,time,moving,dt=1,reverse=false,exiting=false){a.group.visible=true;a.group.position.copy(sample.position);const d=sample.direction.multiplyScalar(reverse?-1:1),target=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.atan2(d.x,d.z));a.group.quaternion.slerp(target,Math.min(1,dt*9));a.pose(time,moving,exiting);}
 let displayTime=0,lastState=bus.state,lastParked=0;
 function separateWanderers(){
  const guests=extras.filter(a=>!a.escapeControlled&&a.group.visible&&['wandering','enjoying-drink'].includes(a.activity));
  const fountain=new T.Vector3(...world(PATIO_FOUNTAIN.u,PATIO_FOUNTAIN.v,8.15));
  const clamp=p=>{
   const [u,v]=plan(p.x,p.z);p.set(...world(T.MathUtils.clamp(u,841,959),T.MathUtils.clamp(v,509,694),8.15));
   const delta=p.clone().sub(fountain),distance=delta.length(),clearance=PATIO_FOUNTAIN.outerRadius+.48;
   if(distance<clearance)p.copy(fountain).addScaledVector(delta,clearance/Math.max(distance,.001));
  };
  // Small local sidesteps keep randomly meeting guests distinct, inside dry paving.
  for(let pass=0;pass<4;pass++)for(let i=0;i<guests.length;i++)for(let j=i+1;j<guests.length;j++){
   const a=guests[i].group.position,b=guests[j].group.position,delta=a.clone().sub(b),d=delta.length();
   if(d>=.80)continue;
   if(d<.001)delta.set(i%2?.6:1,0,i%2?1:-.6).normalize();else delta.divideScalar(d);
   const push=(.80-d)*.51;a.addScaledVector(delta,push);b.addScaledVector(delta,-push);clamp(a);clamp(b);
  }
 }
 function resetExtras(){extras.forEach(a=>{a.reset();a.wander?.reset();});poolParty.reset();}
 function displayExtras(dt){
  displayTime+=Math.max(0,dt);
  for(const [i,a] of extras.entries()){
   if(a.escapeControlled)continue;
   a.group.visible=true;
   if(a.destination==='churros'){a.hasChurro=true;a.activity='at-churros';place(a,a.approach.sample(a.approach.length),displayTime,false,dt);a.group.rotation.y=-Math.PI/2;}
   else {a.hasDrink=true;const p=a.wander.sample(displayTime+i*8);a.activity=p.moving?'wandering':'enjoying-drink';a.social(displayTime);place(a,p,displayTime,p.moving,dt);}
  }
  separateWanderers();
 }
 function showDisplay(){displayTime=0;resetExtras();for(const [i,a] of actors.slice(0,2).entries()){a.group.visible=true;a.group.position.copy(fromBus([-2.4,-.045,i?1:2.65]));a.group.rotation.set(0,0,0);a.pose(0,false);a.activity='display';}displayExtras(0);lastState=bus.state;lastParked=bus.parkedElapsed;}
 function update(dt){
  if((lastState==='display'&&bus.state!=='display')||(bus.state==='waiting'&&lastState!=='waiting')||bus.parkedElapsed<lastParked)resetExtras();
  lastState=bus.state;lastParked=bus.parkedElapsed;poolParty.update(dt);
  if(bus.state==='display'){displayExtras(dt);return;}
  const t=bus.parkedElapsed;
  for(const [i,a] of actors.slice(0,2).entries()){
   if(a.escapeControlled)continue;
   let age=t-PASSENGER_TIMING.first-i*PASSENGER_TIMING.spacing;
   if(bus.state!=='parked'||age<0){a.group.visible=false;a.activity='waiting';a.distance=0;continue;}
   const exitSeconds=exit.length/PASSENGER_TIMING.exitSpeed;
   if(age<exitSeconds){a.activity='exiting';place(a,exit.sample(age*PASSENGER_TIMING.exitSpeed),age,true,dt,false,true);continue;}
   age-=exitSeconds;const speed=i?PASSENGER_TIMING.waddleSpeed:PASSENGER_TIMING.pranceSpeed,approach=i?toChurros:toFountain;
   if(age<approach.length/speed){a.activity=i?'waddling':'prancing';a.distance=age*speed;place(a,approach.sample(a.distance),age,true,dt);continue;}
   age-=approach.length/speed;
   if(i){a.activity='at-churros';place(a,toChurros.sample(toChurros.length),age,false,dt);continue;}
   const leg=prance.length/speed,half=leg+PASSENGER_TIMING.pause,cycle=age%(2*half),reverse=cycle>=half,local=cycle%half,distance=Math.min(leg,local)*speed;
   a.activity='prancing';a.distance=reverse?prance.length-distance:distance;place(a,prance.sample(a.distance),age,local<leg,dt,reverse);
  }
  for(const [j,a] of extras.entries()){
   if(a.escapeControlled)continue;
   let age=t-PASSENGER_TIMING.first-(j+2)*PASSENGER_TIMING.spacing;
   if(bus.state!=='parked'||age<0){a.group.visible=false;a.activity='waiting';a.speech=null;continue;}
   const exitSeconds=exit.length/PASSENGER_TIMING.exitSpeed;
   a.hasDrink=false;a.hasChurro=false;
   if(age<exitSeconds){a.activity='exiting';place(a,exit.sample(age*PASSENGER_TIMING.exitSpeed),age,true,dt,false,true);continue;}
   age-=exitSeconds;const approachSeconds=a.approach.length/PASSENGER_TIMING.guestSpeed;
   if(age<approachSeconds){a.activity=a.destination==='bar'?'walking-to-bar':'walking-to-churros';place(a,a.approach.sample(age*PASSENGER_TIMING.guestSpeed),age,true,dt);continue;}
   age-=approachSeconds;
   if(a.destination==='churros'){a.hasChurro=true;a.activity='at-churros';place(a,a.approach.sample(a.approach.length),age,false,dt);a.group.rotation.y=-Math.PI/2;continue;}
   if(age<PASSENGER_TIMING.barService){a.activity='ordering-drink';place(a,a.approach.sample(a.approach.length),age,false,dt);a.group.rotation.y=Math.PI;continue;}
   age-=PASSENGER_TIMING.barService;a.hasDrink=true;a.social(age);
   const departSeconds=a.departure.length/PASSENGER_TIMING.guestSpeed;
   if(age<departSeconds){a.activity='leaving-bar';place(a,a.departure.sample(age*PASSENGER_TIMING.guestSpeed),age,true,dt);continue;}
   const p=a.wander.sample(age-departSeconds);a.activity=p.moving?'wandering':'enjoying-drink';place(a,p,age,p.moving,dt);
  }
  separateWanderers();
 }
 showDisplay();
 return {group,actors,extras,poolParty,speechActors:[...extras,...poolParty.actors],paths:{exit,toFountain,prance,toChurros,...extraPaths},timing:PASSENGER_TIMING,update,showDisplay};
}

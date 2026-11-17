import {Font} from '../vendor/FontLoader.js';
import fontData from '../vendor/beverly-font.js';
import {world,DRIVE,GATE_PROGRESS,PARTY_BUS,ESTATE_MOVEMENT} from './beverly-layout.js';
export const BUS_DOOR={x:-1.32,z:2.65,width:1.18,threshold:1.2,delay:1,duration:1.1};

// Local +Z is the nose and +Y is up: vehicle right is -X, driver left is +X.
// Authored coach dimensions follow the supplied photographs.
export function buildPartyBus(T,root,groups,materials){
 const spec=PARTY_BUS,bus=new T.Group();bus.name='Billy_Knight_party_bus';bus.userData.dynamic=true;root.add(bus);groups.Party_bus=bus;
 bus.userData={dynamic:true,reference:'User-supplied Billy Knight coach photos, September 19',dimensions:spec,wrap:'Black and plum with yellow Billy Knight script and stylized film figures',driver:'Left side when facing forward; stickman wearing a white captain hat',arrival:`${spec.delay} seconds after level start; 1.5 times estate running speed; slows to park`,passengers:'Ten guests unload one second apart; three visit churros and six visit the bar',door:'Right side, opens one second after parking'};
 const mat=(name,color,roughness=.6,extra={})=>materials[name]=new T.MeshStandardMaterial({name,color,roughness,...extra});
 const black=mat('Bus black enamel',0x16161d,.28,{metalness:.4}),plum=mat('Bus plum movie wrap',0x302230,.55),chrome=mat('Bus brushed chrome',0xaab3b8,.24,{metalness:.82}),rubber=mat('Bus tire rubber',0x13171b,.94),yellow=mat('Billy Knight title yellow',0xf1dc45,.5,{emissive:0x635005,emissiveIntensity:.2}),white=mat('Captain hat ivory',0xeee9dd),ink=mat('Driver charcoal uniform',0x202732),skin=mat('Driver pale stick figure',0xd8c8a7),glass=mat('Bus cab glazing',0x8cadb5,.12,{transparent:true,opacity:.17,depthWrite:false}),warm=mat('Bus warm headlights',0xffeed3,.3,{emissive:0xffdba1,emissiveIntensity:1.7}),red=mat('Bus red tail lights',0x8f1724,.4,{emissive:0xe33222,emissiveIntensity:1}),amber=mat('Bus amber markers',0xe99128,.5,{emissive:0xe99128,emissiveIntensity:.7});
 const cube=new T.BoxGeometry(1,1,1),sphere=new T.SphereGeometry(1,12,8),fixed=new T.Group();fixed.name='Coach body and fittings';bus.add(fixed);
 function mesh(g,name,geo,m,p=[0,0,0],scale=[1,1,1]){const o=new T.Mesh(geo,m);o.name=name;o.position.set(...p);o.scale.set(...scale);o.castShadow=true;o.receiveShadow=true;g.add(o);return o;}
 const box=(g,n,p,size,m)=>mesh(g,n,cube,m,p,size);
 const ball=(g,n,p,size,m)=>mesh(g,n,sphere,m,p,size);
 function rod(g,n,a,b,r,m){const av=new T.Vector3(...a),bv=new T.Vector3(...b),d=bv.clone().sub(av);const o=mesh(g,n,new T.CylinderGeometry(r,r,d.length(),8),m,av.add(bv).multiplyScalar(.5).toArray());o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return o;}
 function label(g,value,size,pos,m,angle=0){const geo=new T.ShapeGeometry(new Font(fontData).generateShapes(value,size),4);geo.computeBoundingBox();geo.translate(-(geo.boundingBox.min.x+geo.boundingBox.max.x)/2,0,0);const o=mesh(g,value,geo,m,pos);o.rotation.y=angle;o.userData.text=value;return o;}
 // Rounded vertical body corners, separate open cab and wheel-arch skirts.
 const outline=new T.Shape();outline.moveTo(-1.275,-5.7);outline.lineTo(-1.275,5.5);outline.quadraticCurveTo(-1.275,5.9,-.91,5.9);outline.lineTo(.91,5.9);outline.quadraticCurveTo(1.275,5.9,1.275,5.5);outline.lineTo(1.275,3.24);outline.lineTo(.08,3.24);outline.lineTo(.08,2.06);outline.lineTo(1.275,2.06);outline.lineTo(1.275,-5.7);outline.quadraticCurveTo(1.275,-5.9,1.05,-5.9);outline.lineTo(-1.05,-5.9);outline.quadraticCurveTo(-1.275,-5.9,-1.275,-5.7);
 const lower=new T.ExtrudeGeometry(new T.Shape(outline.getPoints(6).map(p=>new T.Vector2(-p.x,p.y))),{depth:.57,bevelEnabled:false,curveSegments:6});lower.rotateX(Math.PI/2);mesh(fixed,'Rounded lower coach body',lower,black,[0,1.77,0]);
 box(fixed,'Rear living compartment',[0,2.45,-1.92],[2.55,2.37,7.96],black);
 box(fixed,'Cab bulkhead ahead of entry',[0,2.45,3.69],[2.55,2.37,.9],black);
 box(fixed,'Entry ceiling',[0,3.56,2.65],[2.55,.15,1.18],black);
 box(fixed,'Entry vestibule opposite wall',[1.23,2.36,2.65],[.09,2.4,1.18],ink);
 box(fixed,'Coach roof',[0,3.65,-.05],[2.52,.17,11.48],chrome);
 box(fixed,'Coach chassis behind entry',[0,.67,-1.695],[2.02,.23,7.51],ink);
 box(fixed,'Coach chassis ahead of entry',[0,.67,4.345],[2.02,.23,2.21],ink);
 box(fixed,'Chassis rail beside stairwell',[.465,.67,2.65],[1.09,.23,1.18],ink);
 box(fixed,'Cab floor',[0,1.47,4.7],[2.44,.18,2.3],ink);
 // Windshield is transparent with no solid box behind the captain.
 box(fixed,'Front windshield',[0,2.64,5.79],[2.25,1.63,.025],glass);
 for(const x of [-1.2,0,1.2])rod(fixed,'Windshield mullion',[x,1.81,5.81],[x,3.52,5.70],x===0?.025:.055,black);
 for(const x of [-1.255,1.255]){box(fixed,'Cab side glass',[x,2.65,4.86],[.025,1.6,1.6],glass);box(fixed,'Cab side pillar',[x,2.67,4.05],[.06,1.91,.1],chrome);}
 box(fixed,'Front brow',[0,3.52,5.64],[2.42,.19,.37],black);
 box(fixed,'Front fascia',[0,1.38,5.81],[2.39,.75,.12],black);
 box(fixed,'Chrome front bumper',[0,.91,5.9],[2.44,.17,.11],chrome);
 for(const x of [-.85,.85]){box(fixed,'Headlight bezel',[x,1.31,5.89],[.53,.3,.08],chrome);box(fixed,'Headlight lens',[x,1.33,5.94],[.43,.19,.02],warm);box(fixed,'Front turn signal',[x,1.08,5.94],[.33,.065,.02],amber);rod(fixed,'Windshield wiper',[x*.65,1.92,5.84],[x*.45,2.65,5.84],.018,ink);}
 for(let i=0;i<4;i++)box(fixed,'Front grille slot',[0,1.14+i*.09,5.902],[.85,.025,.014],chrome);
 // Bottom storage skirts leave visible tire arches around both axles.
 for(const side of [-1,1]){
  for(const [a,b] of [[-5.79,-3.88],[-2.62,side===-1?2.06:3.27],[4.63,5.65]])box(fixed,'Lower luggage skirt',[side*1.265,.91,(a+b)/2],[.07,.61,b-a],black);
  for(const z of [-4.72,-1.8,-.32,1.16,2.64]){if(side===-1&&z===2.64)continue;box(fixed,'Storage hatch outline',[side*1.308,1.04,z],[.016,.65,1.31],chrome);box(fixed,'Storage hatch',[side*1.32,1.04,z],[.012,.6,1.25],black);box(fixed,'Storage latch',[side*1.337,1.2,z+.38],[.015,.075,.12],chrome);}
  for(const y of [1.52,3.56])for(const [a,b] of (side===-1&&y===1.52?[[-5.7,2.06],[3.24,5.5]]:[[-5.7,5.5]]))box(fixed,'Full-length side trim',[side*1.287,y,(a+b)/2],[.028,.034,b-a],chrome);
  for(const z of [-5.3,-2,1.7,5.15])box(fixed,'Side amber clearance marker',[side*1.33,1.56,z],[.035,.07,.15],amber);
  rod(fixed,'Mirror support',[side*1.2,2.04,5.22],[side*1.68,2.1,5.37],.045,chrome);box(fixed,'Chrome mirror housing',[side*1.7,2.42,5.37],[.16,.65,.32],chrome);box(fixed,'Mirror glass',[side*1.71,2.43,5.55],[.12,.53,.012],glass);
 }
 const wheels=[];
 for(const z of [-3.25,3.95])for(const x of [-1.245,1.245]){
  const pivot=new T.Group();pivot.name='Rolling coach wheel';pivot.position.set(x,.51,z);bus.add(pivot);wheels.push(pivot);
  const tire=mesh(pivot,'Coach tire',new T.CylinderGeometry(.51,.51,.26,24),rubber);tire.rotation.z=Math.PI/2;
  const hub=mesh(pivot,'Chrome wheel hub',new T.CylinderGeometry(.32,.32,.28,24),chrome);hub.rotation.z=Math.PI/2;
  for(let i=0;i<8;i++){const a=i*Math.PI/4;ball(pivot,'Wheel lug',[Math.sign(x)*.151,Math.sin(a)*.21,Math.cos(a)*.21],[.022,.033,.033],ink);}
  const arch=mesh(fixed,'Wheel arch trim',new T.TorusGeometry(.61,.033,6,32,Math.PI),chrome,[x*1.047,.51,z]);arch.rotation.y=Math.PI/2;
 }
 // Entry door behind the passenger-side cab; roof ACs and long rolled awning.
 for(const z of [2.045,3.255])box(fixed,'Passenger door jamb',[-1.303,2.02,z],[.09,2.94,.07],chrome);
 box(fixed,'Passenger door lintel',[-1.303,3.49,2.65],[.09,.07,1.28],chrome);
 box(fixed,'Entry courtesy lamp',[-1.37,3.43,2.65],[.07,.08,.32],warm);
 const door=new T.Group();door.name='Party_bus_right_door_hinge';door.position.set(BUS_DOOR.x,0,3.24);bus.add(door);
 box(door,'Opening passenger door',[0,2.025,-.59],[.08,2.85,1.18],black);
 box(door,'Passenger door inset',[-.045,1.19,-.59],[.015,1.04,1.04],plum);
 box(door,'Passenger door window',[-.045,2.65,-.59],[.018,1.14,.98],glass);
 box(door,'Passenger door grab handle',[-.085,1.91,-1.01],[.06,.27,.045],chrome);
 const steps=new T.Group();steps.name='Party_bus_deploying_steps';steps.position.set(-.15,0,2.65);bus.add(steps);
 for(let i=0;i<4;i++){const x=.2+i*.37,top=1.2-i*.3;box(steps,'Entry step '+(i+1),[-x,top-.15,0],[.37,.3,1.06],ink);box(steps,'Non-slip step nosing',[-x-.16,top+.004,0],[.045,.02,1.06],yellow);}
 // Quaternion track exports portably through glTF.
 const closedQ=new T.Quaternion(),openQ=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.PI*.52);
 const animations=[new T.AnimationClip('Party bus door opens after parking',BUS_DOOR.delay+BUS_DOOR.duration,[new T.QuaternionKeyframeTrack(door.name+'.quaternion',[0,BUS_DOOR.delay,BUS_DOOR.delay+BUS_DOOR.duration],[...closedQ.toArray(),...closedQ.toArray(),...openQ.toArray()]),new T.VectorKeyframeTrack(steps.name+'.scale',[0,BUS_DOOR.delay,BUS_DOOR.delay+BUS_DOOR.duration],[.001,1,1,.001,1,1,1,1,1])])];
 for(const z of [-3.45,1.5]){box(fixed,'Roof air conditioner',[0,3.94,z],[1.27,.43,1.1],ink);for(let i=0;i<7;i++)box(fixed,'AC cooling grille',[0,3.87+i*.04,z+.557],[1.04,.014,.012],chrome);}
 box(fixed,'Roof vent',[0,3.85,-.45],[.65,.22,.63],white);rod(fixed,'Rolled side awning',[-1.32,3.48,-4.9],[-1.32,3.48,2.6],.085,ink);
 for(const x of [-1.05,1.05]){const tail=box(fixed,'Slanted rear tail lamp',[x,1.45,-5.925],[.11,.79,.035],red);tail.rotation.z=x*.25;}
 box(fixed,'Rear bumper',[0,.78,-5.96],[2.35,.16,.09],chrome);label(fixed,'BILLY KNIGHT',.14,[0,1.0,-5.98],white,Math.PI);
 for(const x of [-.96,-.48,0,.48,.96])box(fixed,'Roof clearance marker',[x,3.56,5.78],[.1,.045,.03],amber);
 // Hand-lettered vector strokes: gold script remains crisp at any review distance.
 const strokes=[[[0,0],[.08,1.18],[.36,1.33],[.49,1.14],[.34,.77],[.08,.67],[.4,.72],[.52,.51],[.42,.2],[.12,.11]],[[.52,.22],[.65,.68],[.6,.29],[.72,.24]],[[.69,.99],[.72,1.03]],[[.73,.25],[.83,1.31],[1.0,1.47],[1.05,1.23],[.88,.73],[.79,.26],[.97,.3]],[[.98,.29],[1.14,1.27],[1.3,1.43],[1.34,1.2],[1.14,.73],[1.05,.28],[1.21,.29]],[[1.2,.64],[1.2,.32],[1.36,.26],[1.54,.63],[1.38,-.21],[1.14,-.4],[.78,-.39],[.75,-.24],[1.02,-.09],[1.65,.06]],[[1.92,.08],[2.02,1.32]],[[2.03,.65],[2.62,1.36]],[[2.03,.63],[2.63,.12]],[[2.65,.15],[2.76,.67],[2.78,.25],[2.95,.62],[3.09,.66],[3.03,.2],[3.18,.16]],[[3.18,.19],[3.31,.66],[3.25,.2],[3.42,.16]],[[3.37,.94],[3.4,.98]],[[3.88,.57],[3.69,.65],[3.5,.45],[3.54,.21],[3.74,.23],[3.93,.58],[3.73,-.23],[3.51,-.43],[3.21,-.35],[3.44,-.16],[4.08,.18]],[[4.0,.18],[4.2,1.25],[4.26,1.34],[4.13,.6],[4.36,.65],[4.43,.5],[4.36,.16],[4.52,.17]],[[4.68,1.17],[4.51,.22],[4.62,.13],[4.81,.28]],[[4.26,.8],[4.7,.85],[5.01,.77]]];
 function title(parent,pos,scale,angle=0){const g=new T.Group();g.name='Billy Knight yellow script';g.userData.text='Billy Knight';g.position.set(...pos);g.scale.setScalar(scale);g.rotation.y=angle;parent.add(g);for(const pts of strokes){const c=new T.CatmullRomCurve3(pts.map(([x,y])=>new T.Vector3(x-2.5,y,0)));mesh(g,'Handwritten title stroke',new T.TubeGeometry(c,pts.length*6,.012,5,false),yellow);}return g;}
 // Flat game-style silhouettes echo the full-film wrap without baking photo glare into it.
 const redCoat=mat('Movie wrap red coat',0x96434e),blueCoat=mat('Movie wrap pale jacket',0xaebed3),portrait=mat('Movie wrap warm profile',0xc89b87);
 for(const side of [-1,1]){
  const panel=new T.Group();panel.name='Billy Knight side movie wrap';panel.position.set(side*1.289,1.65,-.8);panel.rotation.y=side*Math.PI/2;fixed.add(panel);
  for(const [a,b] of (side===-1?[[-4.84,2.86],[4.04,4.84]]:[[-4.84,4.84]]))box(panel,'Plum promotional panel',[(a+b)/2,.89,0],[b-a,1.78,.012],plum);
  title(panel,[side===-1?-1.9:-2.23,.48,.025],side===-1?.70:.84);
  label(panel,'A FILM BY ALEC GRIFFEN ROTH',.105,[side===-1?-1.9:-2.1,.22,.025],white);
  label(panel,'BILLY KNIGHT',.13,[side===-1?1.4:2.05,.13,.03],yellow);
  for(const [x,sign,m] of [[side===-1?.8:1.25,1,redCoat],[side===-1?2:2.87,-1,blueCoat]]){
   ball(panel,'Movie wrap profile head',[x,1.22,.023],[.34,.39,.017],portrait);ball(panel,'Movie wrap profile nose',[x+sign*.27,1.15,.04],[.15,.09,.013],portrait);ball(panel,'Movie wrap hair',[x-sign*.095,1.45,.045],[.32,.21,.016],black);box(panel,'Movie wrap neck',[x,.85,.023],[.21,.25,.012],portrait);ball(panel,'Movie wrap coat',[x,.35,.025],[.51,.48,.019],m);
  }
 }
 title(fixed,[0,2.74,-5.925],.43,Math.PI);label(fixed,'A TINSELTOWN FAIRYTALE',.105,[0,2.46,-5.94],white,Math.PI);
 title(fixed,[0,1.53,5.955],.25);
 // Stickman captain, hands on wheel, visible through the front and side glass.
 const captain=new T.Group();captain.name='Stickman captain driver';captain.position.set(.64,1.55,4.91);fixed.add(captain);
 box(captain,'Driver seat',[0,.29,-.17],[.58,.17,.58],ink);box(captain,'Seat back',[0,.72,-.4],[.58,.92,.12],ink);
 ball(captain,'Captain head',[0,1.19,0],[.17,.19,.17],skin);rod(captain,'Captain torso',[0,.45,-.1],[0,1,0],.066,ink);
 for(const sign of [-1,1]){rod(captain,'Captain upper arm',[sign*.08,.89,0],[sign*.28,.65,.16],.045,ink);rod(captain,'Captain steering hand',[sign*.28,.65,.16],[sign*.22,.74,.43],.043,skin);rod(captain,'Captain thigh',[sign*.06,.48,-.1],[sign*.19,.28,.34],.054,ink);rod(captain,'Captain shin',[sign*.19,.28,.34],[sign*.19,-.05,.43],.045,ink);box(captain,'Captain shoe',[sign*.19,-.045,.51],[.13,.1,.27],black);}
 const brim=mesh(captain,'Captain black peaked visor',new T.CylinderGeometry(.225,.225,.038,20),black,[0,1.36,.055]);brim.scale.z=1.23;
 const hat=mesh(captain,'Captain white cap',new T.CylinderGeometry(.215,.18,.135,20),white,[0,1.43,0]);hat.rotation.x=-.09;
 ball(captain,'Captain gold cap badge',[0,1.405,.188],[.046,.05,.014],yellow);
 box(fixed,'Dashboard',[0,1.94,5.47],[2.23,.24,.5],ink);
 const steering=mesh(captain,'Steering wheel',new T.TorusGeometry(.27,.024,7,24),black,[0,.7,.47]);steering.rotation.x=-.5;
 // Keep these lights in the render list while the coach is hidden. Changing
 // intensity is cheap; changing light counts recompiles every lit material.
 const headlamps=new T.Group();headlamps.name='Bus headlights';headlamps.userData.dynamic=true;root.add(headlamps);groups.Party_bus_lights=headlamps;
 for(const x of [-.82,.82]){const light=new T.SpotLight(0xffe6c2,240,28,.48,.65,2);light.position.set(x,1.35,5.97);light.target.position.set(0,0,-1);light.add(light.target);light.quaternion.setFromUnitVectors(new T.Vector3(0,0,-1),new T.Vector3(0,-.065,1).normalize());headlamps.add(light);}
 const cabLight=new T.PointLight(0xffd9aa,8,3.8,2);cabLight.position.set(0,3.37,5.15);headlamps.add(cabLight);
 const entryLight=new T.PointLight(0xffdda9,32,6,2);entryLight.name='Warm bus entry light';entryLight.position.set(-1.68,3.30,2.65);headlamps.add(entryLight);
 const lightLevels=headlamps.children.map(light=>({light,intensity:light.intensity}));let night=true;
 function syncLights(){headlamps.position.copy(bus.position);headlamps.quaternion.copy(bus.quaternion);headlamps.scale.copy(bus.scale);for(const {light,intensity} of lightLevels)light.intensity=night&&bus.visible?intensity:0;headlamps.updateMatrixWorld(true);}

 const road=new T.CatmullRomCurve3(DRIVE.map(p=>new T.Vector3(...world(...p))));road.arcLengthDivisions=1800;road.updateArcLengths();
 const start=GATE_PROGRESS*road.getLength()-spec.length/2,join=.96*road.getLength(),roadLength=join-start;
 const parking=new T.CatmullRomCurve3([road.getPointAt(.96),...[[380,758,7.54],[381,738,7.75],[363,714,7.99],[322,691,8],[274,670,8],[225,650,8],[194,638,8],[185,615,8],spec.park].map(p=>new T.Vector3(...world(...p)))]);parking.arcLengthDivisions=600;parking.updateArcLengths();
 const length=roadLength+parking.getLength();
 // Pull forward in a wide arc through the paved coach bay and rejoin the downhill lane.
 const outbound=new T.CatmullRomCurve3([...[
  spec.park,[186,561,8],[206,526,8],[251,515,8],[289,535,8],[309,582,8],[315,651,8],
  [333,692,8],[363,714,7.99],[381,738,7.75],[380,758,7.54]
 ].map(p=>new T.Vector3(...world(...p))),road.getPointAt(.96)]);
 outbound.updateArcLengths();const outboundLength=outbound.getLength();
 function point(distance){if(distance<roadLength)return road.getPointAt(Math.max(0,(start+distance)/road.getLength()));return parking.getPointAt(Math.min(1,(distance-roadLength)/parking.getLength()));}
 function pose(distance){const p=point(distance),front=point(Math.min(length,distance+3.95)),rear=point(Math.max(0,distance-3.25)),forward=front.sub(rear).normalize(),left=new T.Vector3(0,1,0).cross(forward).normalize(),up=forward.clone().cross(left);return {position:p.add(new T.Vector3(0,.045,0)),quaternion:new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(left,up,forward))};}
 function applyPose(distance,p=pose(distance),wheelDistance=distance){bus.position.copy(p.position);bus.quaternion.copy(p.quaternion);for(const w of wheels)w.rotation.x=wheelDistance/.51;bus.updateMatrixWorld(true);syncLights();collider.matrix.copy(bus.matrixWorld).multiply(new T.Matrix4().makeTranslation(0,1.9,0)).scale(new T.Vector3(spec.width,3.4,spec.length));collider.updateMatrixWorld(true);}
 let state='display',elapsed=0,distance=length,runSpeed=ESTATE_MOVEMENT.run,hit=false,sweep=[],parkedElapsed=0,doorProgress=0;
 const collider=box(new T.Group(),'Bus collision envelope',[0,1.9,0],[spec.width,3.4,spec.length],black);collider.visible=false;collider.matrixAutoUpdate=false;
 function updateDoor(){doorProgress=Math.max(0,Math.min(1,(parkedElapsed-BUS_DOOR.delay)/BUS_DOOR.duration));const ease=doorProgress*doorProgress*(3-2*doorProgress);door.rotation.y=Math.PI*.52*ease;steps.scale.x=.001+.999*ease;}
 function reset(){state='waiting';elapsed=0;distance=0;parkedElapsed=0;updateDoor();hit=false;sweep=[];bus.visible=false;applyPose(0);}
 function showParked(){state='display';elapsed=0;distance=length;parkedElapsed=0;updateDoor();hit=false;sweep=[];bus.visible=true;applyPose(length);}
 function previewUnloading(){showParked();state='parked';}
 const turnBack=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.PI);
 function openForBoarding(){if(state!=='parked')previewUnloading();parkedElapsed=BUS_DOOR.delay+BUS_DOOR.duration;updateDoor();}
 function depart(){if(state!=='parked')return;state='closing';parkedElapsed=BUS_DOOR.delay+BUS_DOOR.duration;}
 function startLevel(speed=ESTATE_MOVEMENT.run){runSpeed=speed;reset();}
 function atPose(point,p,r=.24){const local=point.clone().sub(p.position).applyQuaternion(p.quaternion.clone().invert());return local.y>-1.7&&local.y<spec.height&&Math.abs(local.x)<spec.width/2+r&&Math.abs(local.z)<spec.length/2+r;}
 function intersectsPlayer(from,to=from){if(!bus.visible)return false;const frames=sweep.length?sweep:[pose(distance)];return frames.some((p,i)=>atPose(from.clone().lerp(to,frames.length===1?1:i/(frames.length-1)),p));}
 function update(dt){
  sweep=[];
  if(state==='closing'){
   parkedElapsed=Math.max(BUS_DOOR.delay,parkedElapsed-dt);updateDoor();
   if(doorProgress<=0)state='departing';
   return;
  }
  if(state==='departing'){
   if(distance>roadLength){
    distance=Math.max(roadLength,distance-dt*6.5*(length-roadLength)/outboundLength);
    const t=(length-distance)/(length-roadLength),position=outbound.getPointAt(t),heading=outbound.getTangentAt(t);
    const rotation=new T.Matrix4().lookAt(heading,new T.Vector3(),new T.Vector3(0,1,0));
    position.y+=.045;
    applyPose(distance,{position,quaternion:new T.Quaternion().setFromRotationMatrix(rotation)},length+t*outboundLength);
   }else{
    distance=Math.max(0,distance-dt*11);
    const p=pose(distance);p.quaternion.multiply(turnBack);
    applyPose(distance,p,length+outboundLength+roadLength-distance);
   }
   if(distance===0)state='departed';
   return;
  }
  if(state==='parked'){elapsed+=Math.max(0,dt);parkedElapsed+=Math.max(0,dt);updateDoor();return;}if(state!=='waiting'&&state!=='driving')return;
  const previous=elapsed;elapsed+=Math.max(0,dt);
  if(elapsed<spec.delay)return;
  let remaining=elapsed-Math.max(previous,spec.delay);state='driving';bus.visible=true;sweep.push(pose(distance));
  while(remaining>1e-8&&distance<length){const speed=distance>=roadLength?spec.parkingSpeed:runSpeed*spec.speedMultiplier,boundary=distance<roadLength?roadLength:length,travel=Math.min(remaining*speed,.12,boundary-distance);distance=Math.min(boundary,distance+travel);remaining-=travel/speed;sweep.push(pose(distance));}
  applyPose(distance);if(distance>=length){state='parked';parkedElapsed=remaining;updateDoor();}
 }
 showParked();
 return {group:bus,fixed,wheels,door,steps,animations,collider,captain,headlamps,spec,route:{point,pose,length,roadLength},startLevel,showParked,previewUnloading,openForBoarding,depart,update,intersectsPlayer,intersectsAt:(point,distance,radius)=>atPose(point,pose(distance),radius),get parkedElapsed(){return parkedElapsed;},get doorProgress(){return doorProgress;},get colliders(){return bus.visible?[collider]:[];},get state(){return state;},get elapsed(){return elapsed;},get distance(){return distance;},get speed(){return runSpeed*spec.speedMultiplier;},get hit(){return hit;},registerHit(){hit=true;},setNight(on){night=on;syncLights();}};
}

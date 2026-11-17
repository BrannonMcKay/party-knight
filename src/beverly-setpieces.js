import {Font} from '../vendor/FontLoader.js';
import fontData from '../vendor/beverly-font.js';
import {world,plan,s,DRIVE,TRAILER_PAD,GATE_PROGRESS,GATE_OPEN_SECONDS} from './beverly-layout.js';

export function gateFrame(T){
 const curve=new T.CatmullRomCurve3(DRIVE.map(p=>new T.Vector3(...world(...p))));
 const center=curve.getPointAt(GATE_PROGRESS),direction=curve.getTangentAt(GATE_PROGRESS);direction.y=0;direction.normalize();
 const normal=new T.Vector3(-direction.z,0,direction.x);
 return {curve,center,direction,normal,rotation:Math.atan2(-normal.z,normal.x),spawn:curve.getPointAt(GATE_PROGRESS-6/curve.getLength())};
}

export function buildBeverlySetPieces(T,root,groups,materials){
 const boxGeo=new T.BoxGeometry(1,1,1),sphere=new T.SphereGeometry(1,12,8);
 const mat=(name,color,roughness=.7,extra={})=>materials[name]=new T.MeshStandardMaterial({name,color,roughness,...extra});
 const white=mat('Toilet trailer enamel',0xe1e4d9,.4,{metalness:.25}),trim=mat('Trailer aluminum trim',0xa1abad,.3,{metalness:.7}),navy=mat('Union Toilets navy',0x163a44,.5),rubber=mat('Trailer tires',0x17191a,.94),inside=mat('Trailer interior shadow',0x25302d,.9);
 const iron=materials['Aged iron'],stone=materials['Warm limestone paving'],glow=materials['Lantern glass'];
 function group(name,dynamic=false){const g=new T.Group();g.name=name;g.userData.dynamic=dynamic;root.add(g);groups[name]=g;return g;}
 function mesh(g,geo,material,name,pos,scale=[1,1,1]){const m=new T.Mesh(geo,material);m.name=name;m.position.set(...pos);m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
 const box=(g,name,pos,size,material)=>mesh(g,boxGeo,material,name,pos,size);
 function rod(g,name,a,b,r,material){const start=new T.Vector3(...a),end=new T.Vector3(...b),d=end.clone().sub(start);const m=mesh(g,new T.CylinderGeometry(r,r,d.length(),8),material,name,start.clone().add(end).multiplyScalar(.5).toArray());m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return m;}
 function text(g,value,size,pos,material){const geo=new T.ShapeGeometry(new Font(fontData).generateShapes(value,size),4);geo.computeBoundingBox();geo.translate(-(geo.boundingBox.max.x+geo.boundingBox.min.x)/2,0,0);const m=mesh(g,geo,material,value,pos);m.userData.text=value;return m;}

 // Mobile restroom trailer, with its long signed face looking across the driveway.
 const trailer=group('Union_Toilets_trailer'),pad=TRAILER_PAD;
 trailer.position.set(...world(pad.u,pad.v,pad.y));trailer.rotation.y=Math.PI/2;
 box(trailer,'Steel trailer chassis',[0,.52,0],[8,.24,2.52],iron);
 box(trailer,'Restroom trailer floor',[0,.73,0],[7.6,.18,2.45],white);
 box(trailer,'Restroom rear wall',[0,2.02,-1.18],[7.6,2.48,.12],white);
 for(const x of [-3.75,3.75])box(trailer,'Restroom end wall',[x,2.02,0],[.12,2.48,2.4],white);
 box(trailer,'Restroom roof',[0,3.31,0],[7.88,.2,2.65],white);
 // Open doorway at x=-1.7, and a second closed stall at the other end.
 box(trailer,'Signed trailer side',[1.38,2.02,1.2],[4.75,2.48,.14],white);
 box(trailer,'Side wall beside open stall',[-3.15,2.02,1.2],[1.2,2.48,.14],white);
 box(trailer,'Open stall door header',[-1.76,3.03,1.2],[1.6,.44,.14],white);
 box(trailer,'Dark interior stall partition',[-.97,1.92,0],[.08,2.3,2.36],inside);
 box(trailer,'Open bathroom stall rear',[-1.77,1.85,-1.07],[1.52,2.16,.07],inside);
 const door=new T.Group();door.name='Open overflowing restroom door';door.position.set(-2.55,.84,1.29);door.rotation.y=-Math.PI*.7;trailer.add(door);
 box(door,'Open enamel door leaf',[.71,1.02,0],[1.42,2.04,.08],white);
 box(door,'Door handle',[1.25,1.06,.075],[.035,.19,.045],trim);
 box(trailer,'Closed second restroom door',[2.68,1.78,1.3],[1.16,2.04,.07],white);
 for(const x of [2.07,3.29])box(trailer,'Closed door frame',[x,1.8,1.35],[.055,2.13,.07],trim);
 box(trailer,'Closed door upper frame',[2.68,2.87,1.35],[1.26,.055,.07],trim);
 box(trailer,'Second stall handle',[3.1,1.75,1.38],[.035,.19,.05],iron);
 box(trailer,'Union Toilets name panel',[1.38,2.42,1.32],[4.45,.8,.06],navy);
 const label=text(trailer,'Union Toilets',.39,[1.38,2.23,1.41],white);label.userData.facing='Driveway';
 text(trailer,'MOBILE RESTROOMS',.145,[1.38,1.86,1.41],navy);
 // Wheels, tow frame, jacks, roof vents and entry fixtures make its function readable.
 for(const x of [-.65,.65])for(const z of [-1.23,1.23]){const wheel=mesh(trailer,new T.CylinderGeometry(.4,.4,.24,20),rubber,'Tandem axle tire',[x,.4,z]);wheel.rotation.x=Math.PI/2;const hub=mesh(trailer,new T.CylinderGeometry(.2,.2,.255,14),trim,'Wheel hub',[x,.4,z]);hub.rotation.x=Math.PI/2;}
 for(const z of [-.93,.93])rod(trailer,'Tow frame',[3.85,.52,z],[5.1,.52,0],.07,iron);
 box(trailer,'Tow coupler',[5.17,.52,0],[.4,.13,.2],trim);
 for(const x of [-3.15,3.15])for(const z of [-.98,.98]){rod(trailer,'Leveling jack',[x,.02,z],[x,.63,z],.055,trim);box(trailer,'Jack foot',[x,.04,z],[.35,.06,.28],iron);}
 for(const x of [-2.5,.8]){box(trailer,'Roof ventilator',[x,3.48,0],[.65,.22,.65],trim);box(trailer,'Roof vent dark grille',[x,3.595,0],[.48,.02,.48],iron);}
 for(const x of [-1.76,2.68]){box(trailer,'Restroom doorway lamp',[x,3.02,1.37],[.34,.13,.13],glow);}
 box(trailer,'Toilet cistern glimpse',[-1.75,1.23,-.68],[.51,.64,.28],white);
 mesh(trailer,sphere,white,'Toilet bowl glimpse',[-1.75,1.05,-.27],[.3,.23,.4]);
 for(let i=0;i<4;i++){const z=1.52+i*.29,top=.78-i*.195;box(trailer,'Overflowing entry step',[-1.76,top/2,z],[1.5,top,.29],trim);}
 for(const x of [-2.57,-.95]){rod(trailer,'Entry stair rail',[x,1.69,1.28],[x,.99,2.65],.025,trim);rod(trailer,'Stair rail outer post',[x,.04,2.65],[x,.99,2.65],.025,trim);}

 const GATE_TITLE={metresPerPixel:.0028,color:0xfff3c4,glowColor:0xffd873,glowOpacity:.85,lamp:3.5,
  left:{text:'Billy',file:'gate-billy.webp',glow:'gate-billy-glow.webp',pixels:[1018,571]},right:{text:'Knight',file:'gate-knight.webp',glow:'gate-knight-glow.webp',pixels:[1188,571]}};
 // Two independent hinged leaves. +local Z faces the street; both leaves open uphill.
 const frame=gateFrame(T),gateGroup=group('Entrance_gate',true);
 gateGroup.position.copy(frame.center);gateGroup.rotation.y=frame.rotation;
 const leaves=[],gateColliders=[];
 for(const sign of [-1,1]){
  const pivot=new T.Group();pivot.name=sign<0?'Beverly_gate_left_hinge':'Beverly_gate_right_hinge';pivot.position.x=sign*3.56;gateGroup.add(pivot);
  const inward=-sign,width=3.53;
  const panel=box(pivot,'Gate leaf panel',[inward*width/2,1.12,0],[width,1.9,.115],iron);gateColliders.push(panel);
  for(const h of [.16,2.06,2.65])box(pivot,'Gate horizontal frame',[inward*width/2,h,0],[width,.085,.16],iron);
  for(let j=0;j<=11;j++){const x=inward*j*width/11;box(pivot,'Gate upright',[x,1.4,0],[.035,2.55,.055],iron);mesh(pivot,new T.ConeGeometry(.058,.18,4),iron,'Gate spear finial',[x,2.77,0]);}
  for(let j=0;j<6;j++){const curl=mesh(pivot,new T.TorusGeometry(.18,.022,5,16),iron,'Gate upper scroll',[inward*(.27+j*.59),2.34,0]);curl.scale.y=1.35;}
  // The film's title in its own script, one word per leaf, facing the street.
  // A blurred copy behind each word and a faint lamp give it a soft yellow glow.
  const word=sign<0?GATE_TITLE.left:GATE_TITLE.right,wide=word.pixels[0]*GATE_TITLE.metresPerPixel,tall=word.pixels[1]*GATE_TITLE.metresPerPixel;
  const title=new T.Group();title.name='Gate title: '+word.text;title.userData={text:word.text,glow:'soft yellow'};title.position.set(inward*width/2,1.13,.092);pivot.add(title);
  if(typeof document!=='undefined'){
   const load=file=>{const map=new T.TextureLoader().load(new URL('../assets/'+file,import.meta.url).href);map.colorSpace=T.SRGBColorSpace;map.anisotropy=8;return map;};
   const halo=new T.Mesh(new T.PlaneGeometry(wide,tall),new T.MeshBasicMaterial({map:load(word.glow),color:GATE_TITLE.glowColor,transparent:true,opacity:GATE_TITLE.glowOpacity,blending:T.AdditiveBlending,depthWrite:false,fog:false}));
   halo.name='Gate title glow';halo.renderOrder=3;title.add(halo);
   const script=new T.Mesh(new T.PlaneGeometry(wide,tall),new T.MeshBasicMaterial({map:load(word.file),color:GATE_TITLE.color,transparent:true,depthWrite:false,fog:false}));
   script.name='Gate title script';script.position.z=.006;script.renderOrder=4;title.add(script);
  }
  const lamp=new T.PointLight(GATE_TITLE.glowColor,GATE_TITLE.lamp,7,2);lamp.name='Gate title glow lamp';lamp.userData.poolPriority=4;lamp.position.set(inward*width/2,1.2,.75);pivot.add(lamp);
  leaves.push({pivot,sign,title});
 }
 gateGroup.userData.initialState='closed';gateGroup.userData.trigger='level start';gateGroup.userData.openSeconds=GATE_OPEN_SECONDS;
 const angleAt=t=>{const f=Math.max(0,Math.min(1,t/GATE_OPEN_SECONDS));return f*f*(3-2*f)*Math.PI*.505;};
 function setGateTime(t){for(const {pivot,sign} of leaves)pivot.rotation.y=-sign*angleAt(t);gateGroup.updateMatrixWorld(true);}
 let gateElapsed=0,gateRunning=false;
 function startLevel(){gateElapsed=0;gateRunning=true;setGateTime(0);}
 function closeGate(){gateElapsed=0;gateRunning=false;setGateTime(0);}
 function openGate(){gateElapsed=GATE_OPEN_SECONDS;gateRunning=false;setGateTime(gateElapsed);}
 const tracks=leaves.map(({pivot,sign})=>{const times=[],values=[];for(let i=0;i<=32;i++){const t=i/32*GATE_OPEN_SECONDS;times.push(t);values.push(...new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),-sign*angleAt(t)).toArray());}return new T.QuaternionKeyframeTrack(pivot.name+'.quaternion',times,values);});
 const animations=[new T.AnimationClip('Beverly entrance opens at level start',GATE_OPEN_SECONDS,tracks)];

 // One continuous watercourse: doorway -> entry steps -> apron -> driveway -> street.
 const waterGroup=group('Overflow_water',true),timeUniform={value:0};
 const flood=mat('Overflow moving water',0x639296,.22,{metalness:.3,transparent:true,opacity:.86,side:T.DoubleSide});
 flood.onBeforeCompile=shader=>{
  shader.uniforms.overflowTime=timeUniform;
  shader.vertexShader='varying vec2 vOverflowUv;\n'+shader.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\nvOverflowUv=uv;');
  shader.fragmentShader='uniform float overflowTime; varying vec2 vOverflowUv;\n'+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   float wave=sin(vOverflowUv.x*8.0-overflowTime*5.8+sin(vOverflowUv.y*12.0));
   float thread=pow(max(0.0,wave),17.0)*(0.3+0.7*pow(sin(vOverflowUv.y*19.0+vOverflowUv.x*0.5),2.0));
   diffuseColor.rgb=mix(diffuseColor.rgb,vec3(0.84,0.94,0.91),thread*0.82);
   diffuseColor.rgb*=0.9+0.10*sin(vOverflowUv.x*3.0-overflowTime*3.1+vOverflowUv.y*9.0);
  `);
 };
 flood.customProgramCacheKey=()=> 'beverly-overflow-v1';
 const doorV=pad.v+1.76/s,curve=frame.curve;
 let joinT=0,best=Infinity;
 for(let i=0;i<=1200;i++){const p=curve.getPoint(i/1200),uv=plan(p.x,p.z),d=Math.abs(uv[1]-doorV)+Math.abs(uv[0]-356)*.2;if(d<best){best=d;joinT=i/1200;}}
 const waterPoints=[];
 for(const [offset,h] of [[1.2,.86],[1.48,.86],[1.7,.67],[1.99,.48],[2.28,.285],[2.57,.10],[3.1,.09],[4.0,.08]])waterPoints.push(new T.Vector3(...world(pad.u+offset/s,doorV,pad.y+h)));
 waterPoints.push(new T.Vector3(...world(316,doorV,5.98)),new T.Vector3(...world(332,doorV,5.90)));
 const join=curve.getPoint(joinT);waterPoints.push(new T.Vector3(join.x-.8,join.y+.18,join.z));
 const roadWaterStart=waterPoints.length;
 for(let i=0;i<=420;i++){
  const t=joinT*(1-i/420),p=curve.getPoint(t),d=curve.getTangent(t),n=new T.Vector3(-d.z,0,d.x).normalize();p.addScaledVector(n,Math.sin(i*.059)*.25+.28);p.y+=.085;waterPoints.push(p);
 }
 const positions=[],uvs=[],indices=[];let distance=0;
 for(let i=0;i<waterPoints.length;i++){
  const p=waterPoints[i];if(i)distance+=p.distanceTo(waterPoints[i-1]);
  const prev=waterPoints[Math.max(0,i-1)],next=waterPoints[Math.min(waterPoints.length-1,i+1)],normal=new T.Vector3(-(next.z-prev.z),0,next.x-prev.x).normalize();
  const spread=Math.max(0,Math.min(1,(i-7)/8)),width=.82+spread*(.48+.2*Math.sin(i*.12));
  for(const sign of [-1,1]){const q=p.clone().addScaledVector(normal,sign*width/2);positions.push(...q.toArray());uvs.push(distance,sign*.5+.5);}
  if(i<waterPoints.length-1){const k=i*2;indices.push(k,k+2,k+1,k+1,k+2,k+3);}
 }
 const ribbon=new T.BufferGeometry();ribbon.setAttribute('position',new T.Float32BufferAttribute(positions,3));ribbon.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));ribbon.setIndex(indices);ribbon.computeVertexNormals();
 const stream=mesh(waterGroup,ribbon,flood,'Continuous toilet overflow to Beverly Drive',[0,0,0]);stream.castShadow=false;stream.renderOrder=2;stream.userData.flow='doorway to street';stream.userData.lengthMetres=distance;
 const splashMaterial=mat('Overflow foam',0xd2e6db,.5,{emissive:0x4a7169,emissiveIntensity:.17});
 const splash=new T.InstancedMesh(new T.SphereGeometry(.045,6,4),splashMaterial,42);splash.name='Gushing doorway spray';splash.castShadow=false;waterGroup.add(splash);
 const dummy=new T.Object3D(),source=waterPoints[1];
 function update(dt){
  timeUniform.value+=dt;
  if(gateRunning){gateElapsed=Math.min(GATE_OPEN_SECONDS,gateElapsed+dt);setGateTime(gateElapsed);if(gateElapsed===GATE_OPEN_SECONDS)gateRunning=false;}
  for(let i=0;i<42;i++){const f=(timeUniform.value*.85+i/42)%1;dummy.position.set(source.x+f*1.75,source.y+.10+f*.18-f*f*.84,source.z+Math.sin(i*9.1)*(.12+f*.34));dummy.scale.set(.5+f,.6+f*.8,.6+f);dummy.updateMatrix();splash.setMatrixAt(i,dummy.matrix);}splash.instanceMatrix.needsUpdate=true;
 }
 update(0);closeGate();
 return {animations,gate:{group:gateGroup,leaves,colliders:gateColliders,frame,startLevel,close:closeGate,open:openGate,get progress(){return gateElapsed/GATE_OPEN_SECONDS;}},effects:{update,waterPoints,roadWaterStart,timeUniform,stream},trailer};
}






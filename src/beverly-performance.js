import {makeRunner,makeStickman} from './world.js';
import {world,LEVELS,PATIO_FOUNTAIN} from './beverly-layout.js';
import {Font} from '../vendor/FontLoader.js';
import fontData from '../vendor/beverly-font.js';

export const MIMESIS_LOGO={
 image:'../assets/mimesis-logo.png',u:838,v:452.15,centerHeight:10.8,width:2.55,height:2.55*701/1460,
 // Frame the transparent source using UVs, preserving the original PNG and proportions.
 corners:[[229/1920,187/1080],[1689/1920,187/1080],[229/1920,888/1080],[1689/1920,888/1080]]
};

export const PATIO_PERFORMANCE={
 // Extend the cap over the existing box's unused rear surface for the compact kit.
 stage:{u:838,v:425.7,y:LEVELS.house+4.02,width:3.05,depth:4.06},
 christel:{u:828.7,v:438.5},bran:{u:847.3,v:431.5},drummer:{u:829,v:410},
 bar:{u:905,v:445,y:LEVELS.house,width:3.5,depth:.86},
 // Guests approach the customer side, leaving the gallery doors and stairs clear.
 barGuestTarget:[905,475,LEVELS.house],facingTarget:[PATIO_FOUNTAIN.u,PATIO_FOUNTAIN.v],audio:null
};

/** Concert NPCs are independent of the player and hostile AI. The bartender uses
 * the same rig/idle animation as the mountain stickmen; only his role is different.
 * Vector faces keep the shared models portable in the editable GLB without a DOM. */
export function buildPatioPerformance(T,root,groups,materials,logoTexture=null){
 const spec=PATIO_PERFORMANCE,group=new T.Group(),bar=new T.Group();
 group.name='Patio_performance';group.userData={dynamic:true,song:'Party Knight',audio:'Awaiting song asset',roles:['cellist','guitarist','drummer','bartender']};
 bar.name='Patio_bar';root.add(group,bar);groups.Patio_performance=group;groups.Patio_bar=bar;
 const mat=(name,color,extra={})=>materials[name]=new T.MeshStandardMaterial({name,color,roughness:.65,...extra});
 const black=mat('Performance charcoal',0x15151f),chrome=mat('Performance satin chrome',0x99a5b2,{metalness:.7,roughness:.28}),ivory=mat('Instrument ivory',0xf4f0df),wood=mat('Cello amber maple',0x9a411b,{roughness:.32}),edge=mat('Cello dark ribs',0x492718),gold=mat('Stage brass',0xc6a76b,{metalness:.55});
 const faceInk=new T.MeshBasicMaterial({name:'Regular character face ink',color:0x292435});materials[faceInk.name]=faceInk;
 const unitBox=new T.BoxGeometry(1,1,1),unitBall=new T.SphereGeometry(1,16,12),unitRod=new T.CylinderGeometry(1,1,1,10);
 function mesh(parent,name,geo,material,pos=[0,0,0],scale=[1,1,1]){const m=new T.Mesh(geo,material);m.name=name;m.position.set(...pos);m.scale.set(...scale);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
 const box=(p,n,m,pos,size)=>mesh(p,n,unitBox,m,pos,size);
 const ball=(p,n,m,pos,size)=>mesh(p,n,unitBall,m,pos,size);
 function segment(p,n,m,a,b,r=.025){const o=mesh(p,n,unitRod,m);poseSegment(o,a,b,r);return o;}
 const up=new T.Vector3(0,1,0);
 const faceFountain=actor=>{actor.rotation.y=Math.atan2(world(...spec.facingTarget)[0]-actor.position.x,world(...spec.facingTarget)[2]-actor.position.z);};
 const forwardOf=actor=>new T.Vector3(0,0,1).applyQuaternion(actor.quaternion);
 function poseSegment(o,a,b,r){const A=new T.Vector3(...a),B=new T.Vector3(...b),delta=B.clone().sub(A);o.position.copy(A).add(B).multiplyScalar(.5);o.scale.set(r,delta.length(),r);o.quaternion.setFromUnitVectors(up,delta.normalize());}
 function curve(p,n,m,points,r=.012){return mesh(p,n,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v))),32,r,6,false),m);}
 function label(p,text,width,pos,material=ivory){const geo=new T.ShapeGeometry(new Font(fontData).generateShapes(text,.2),4);geo.computeBoundingBox();const b=geo.boundingBox,center=b.getCenter(new T.Vector3());geo.translate(-center.x,-center.y,0);const fit=width/(b.max.x-b.min.x);geo.scale(fit,fit,1);return mesh(p,text,geo,material,pos);}
 function faceBuilder(parent,kind,r,y,z){
  const f=new T.Group();f.name='Shared character '+kind+' expression';f.position.set(0,y,z);parent.add(f);
  // A material holder preserves makeRunner's normal/happy expression API.
  f.material=faceInk;const k=r/.37;
  for(const sign of [-1,1]){
   ball(f,'Eye',faceInk,[sign*.116*k,.048*k,0],[.023*k,.042*k,.009]);
   curve(f,'Raised eyebrow',faceInk,[[sign*.18*k,.13*k,0],[sign*.12*k,.16*k,0],[sign*.064*k,.132*k,0]],.009*k);
  }
  if(kind==='runner'){
   const lip=mat('Christel singing lips',0xab5468);const mouth=ball(f,'Singing mouth',lip,[0,-.105*k,.003],[.052,.036,.012]);f.userData.singing=true;f.singingMouth=mouth;
  }else curve(f,'Regular stickman smile',faceInk,[[-.125*k,-.045*k,0],[-.075*k,-.115*k,0],[.035*k,-.136*k,0],[.13*k,-.055*k,0]],.010*k);
  return f;
 }
 // Keep the actual game bodies, hair and proportions; pose their arms for instruments.
 const christel=makeRunner({faceBuilder,faceTextureBuilder:()=>null});
 christel.root.name='Christel 2 — glowing cellist';christel.root.position.set(...world(spec.christel.u,spec.christel.v,spec.stage.y));
 christel.root.userData={role:'cellist',playerControlled:false,hostile:false,characterSource:'makeRunner / The Leaky Pad',glow:'pink and purple'};group.add(christel.root);
 faceFountain(christel.root);
 for(const i of [1,3])christel.body.remove(christel.limbs[i]);
 const jacket=christel.body.children.find(o=>o.isMesh&&o.geometry.type==='CylinderGeometry'&&o.material.color?.getHex()===0xc8e59b).material;
 const skin=christel.body.children.find(o=>o.isMesh&&o.material.color?.getHex()===0xeac1a4).material;
 function arm(parent,name,material,handMaterial,r=.065){
  const upper=segment(parent,name+' upper arm',material,[0,0,0],[0,.2,0],r),fore=segment(parent,name+' forearm',material,[0,0,0],[0,.2,0],r*.9),hand=ball(parent,name+' hand',handMaterial,[0,0,0],[r*1.1,r*1.1,r*1.1]);
  return {upper,fore,hand,pose(a,b,c){poseSegment(upper,a,b,r);poseSegment(fore,b,c,r*.9);hand.position.set(...c);}};
 }
 const celloLeft=arm(christel.body,'Cellist fingering',jacket,skin),celloRight=arm(christel.body,'Cellist bowing',jacket,skin);
 const bran=new T.Group(),branBody=new T.Group();bran.name='Bran Man — glowing guitarist';bran.add(branBody);bran.position.set(...world(spec.bran.u,spec.bran.v,spec.stage.y));
 bran.userData={role:'guitarist',playerControlled:false,hostile:false,reference:'User in blue shirt, short swept hair and sunglasses',glow:'pulsing blue and purple',instrument:'Blue and white Parker NiteFly'};group.add(bran);
 faceFountain(bran);
 const branSkin=mat('Bran warm skin',0xe1b392),shirt=mat('Bran blue T-shirt',0x1879d2),pants=mat('Bran black trousers',0x222635),hair=mat('Bran short light brown hair',0x907055),beard=mat('Bran light stubble',0x827064);
 for(const sign of [-1,1]){segment(branBody,'Bran trouser leg',pants,[sign*.13,.79,0],[sign*.17,.13,.025],.105);ball(branBody,'Bran shoe',black,[sign*.17,.085,.09],[.125,.08,.205]);}
 mesh(branBody,'Bran blue shirt',new T.CylinderGeometry(.24,.21,.61,16),shirt,[0,1.02,0]);
 segment(branBody,'Bran neck',branSkin,[0,1.25,0],[0,1.48,0],.1);
 ball(branBody,'Bran head',branSkin,[0,1.70,.015],[.315,.37,.295]);
 for(const sign of [-1,1])ball(branBody,'Bran ear',branSkin,[sign*.316,1.68,0],[.054,.085,.05]);
 const crown=mesh(branBody,'Bran cropped hair',new T.SphereGeometry(1,20,12,0,Math.PI*2,0,.95),hair,[0,1.7,.005],[.322,.39,.30]);
 for(let i=0;i<5;i++){const lock=ball(branBody,'Bran swept fringe',hair,[-.19+i*.077,2.015+Math.sin(i)*.02,.105],[.060,.105,.078]);lock.rotation.z=-.4;}
 ball(branBody,'Bran chin stubble',beard,[0,1.445,.192],[.195,.078,.10]);
 for(const sign of [-1,1])curve(branBody,'Bran jaw stubble',beard,[[sign*.265,1.63,.17],[sign*.25,1.49,.19],[sign*.14,1.43,.21]],.025);
 const lenses=mat('Bran mirrored blue sunglasses',0x125cd9,{metalness:.55,roughness:.15});
 for(const sign of [-1,1]){ball(branBody,'Sunglasses black rim',black,[sign*.139,1.756,.281],[.151,.093,.030]);ball(branBody,'Sunglasses blue lens',lenses,[sign*.139,1.756,.307],[.128,.071,.012]);segment(branBody,'Sunglasses temple',black,[sign*.277,1.78,.26],[sign*.308,1.77,-.02],.018);}
 segment(branBody,'Sunglasses bridge',black,[-.02,1.77,.31],[.02,1.77,.31],.015);
 ball(branBody,'Bran nose',branSkin,[0,1.66,.303],[.047,.065,.064]);
 const branMouth=ball(branBody,'Bran singing mouth',faceInk,[0,1.52,.28],[.071,.036,.015]);
 const guitarLeft=arm(branBody,'Guitar fretting',shirt,branSkin,.077),guitarRight=arm(branBody,'Guitar strumming',shirt,branSkin,.077);
 // The same pink/purple palette pulse used by PadPowerWorld, with a blue variant for Bran.
 function glowFor(actor,colors){
  const palette=[],clones=new Map();actor.traverse(o=>{if(!o.isMesh||!o.material.emissive)return;
   // A performer's pulse must never recolor shared stage, microphone or bar materials.
   const original=o.material;let owned=clones.get(original);
   if(!owned){owned=original.clone();owned.name=actor.name+' / '+(original.name||'body '+clones.size);clones.set(original,owned);materials[owned.name]=owned;palette.push({material:owned,base:original.color.clone()});}o.material=owned;
  });
  const light=new T.PointLight(colors[0],14,13,2);light.name=actor.name+' cast light';light.position.copy(actor.position).addScaledVector(forwardOf(actor),1.6);light.position.y+=.9;group.add(light);
  // Radial vertex alpha gives a soft aura without a generated image or opaque shell.
  const positions=[],colorsRGBA=[],indices=[],rings=14,segments=48;
  for(let j=0;j<=rings;j++)for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2,r=j/rings;positions.push(Math.cos(a)*r*1.05,Math.sin(a)*r*1.32,0);colorsRGBA.push(1,1,1,.22*Math.pow(1-r,2));if(j&&i){const n=j*(segments+1)+i;indices.push(n,n-1,n-segments-2,n,n-segments-2,n-segments-1);}}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('color',new T.Float32BufferAttribute(colorsRGBA,4));geo.setIndex(indices);
  const normals=new Float32Array(positions.length);for(let i=2;i<normals.length;i+=3)normals[i]=1;geo.setAttribute('normal',new T.BufferAttribute(normals,3));
  const auraMaterial=new T.MeshBasicMaterial({name:actor.name+' aura',color:colors[0],vertexColors:true,transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending});
  const aura=mesh(group,actor.name+' soft aura',geo,auraMaterial,actor.position.clone().add(new T.Vector3(0,1,0)).addScaledVector(forwardOf(actor),-.13).toArray());aura.quaternion.copy(actor.quaternion);aura.castShadow=aura.receiveShadow=false;
  return {palette,light,aura,colors:colors.map(c=>new T.Color(c))};
 }
 const glows=[glowFor(christel.root,[0xff48cb,0x9349ff]),glowFor(bran,[0x2589ff,0x9349ff])];
 // Cello: carved double-bout outline, ribs, ebony fingerboard, bridge, four strings and bow.
 const cello=new T.Group();cello.name='Christel cello';christel.body.add(cello);
 // Facing +Z, her anatomical left is +X. Lean toward that shoulder about the planted endpin.
 const celloTilt=.25;cello.rotation.z=-celloTilt;cello.position.set(.16*Math.sin(celloTilt),.16*Math.cos(celloTilt),.40);
 const celloShape=new T.Shape();celloShape.moveTo(0,0);celloShape.bezierCurveTo(-.32,0,-.36,.30,-.19,.39);celloShape.bezierCurveTo(-.12,.44,-.13,.52,-.20,.55);celloShape.bezierCurveTo(-.34,.72,-.20,.88,0,.88);celloShape.bezierCurveTo(.20,.88,.34,.72,.20,.55);celloShape.bezierCurveTo(.13,.52,.12,.44,.19,.39);celloShape.bezierCurveTo(.36,.30,.32,0,0,0);
 const celloGeo=new T.ExtrudeGeometry(celloShape,{depth:.12,bevelEnabled:true,bevelSize:.016,bevelThickness:.018,bevelSegments:2,steps:1,curveSegments:18});
 mesh(cello,'Cello maple soundboard',celloGeo,wood);
 mesh(cello,'Cello back and ribs',celloGeo,edge,[0,0,-.05],[1.04,1.02,1]);
 segment(cello,'Cello endpin',chrome,[0,-.16,.01],[0,.07,.01],.011);
 box(cello,'Cello ebony fingerboard',black,[0,.92,.14],[.075,.68,.03]);box(cello,'Cello neck',wood,[0,1.03,.08],[.075,.67,.06]);
 ball(cello,'Cello scroll',wood,[0,1.38,.085],[.058,.070,.065]);
 for(const sign of [-1,1])for(let i=0;i<2;i++)segment(cello,'Cello tuning peg',black,[0,1.21+i*.09,.1],[sign*.105,1.21+i*.09,.1],.017);
 box(cello,'Cello bridge',ivory,[0,.30,.163],[.12,.07,.025]);
 for(let i=0;i<4;i++)segment(cello,'Cello string',chrome,[(i-1.5)*.012,.12,.176],[(i-1.5)*.012,1.33,.15],.002);
 for(const sign of [-1,1]){curve(cello,'Cello f-hole',black,[[sign*.14,.61,.143],[sign*.10,.55,.147],[sign*.135,.42,.147],[sign*.095,.35,.149]],.012);ball(cello,'F-hole eye',black,[sign*.14,.61,.143],[.021,.02,.006]);}
 // Bow in the right hand (-X), with its frog on that end. Parenting to the cello keeps
 // the hair across the strings throughout both the instrument lean and bow stroke.
 const bow=new T.Group();bow.name='Moving cello bow';cello.add(bow);bow.position.set(0,.43,.160);
 segment(bow,'Cello bow stick',edge,[-.47,0,0],[.48,0,0],.010);segment(bow,'Cello bow hair',ivory,[-.44,-.028,.009],[.45,-.028,.009],.005);box(bow,'Cello bow frog',black,[-.38,-.015,.005],[.08,.047,.03]);
 // Parker NiteFly-style asymmetric double cutaway, blue finish and white pickguard.
 const guitar=new T.Group();guitar.name='Bran blue and white Parker NiteFly';branBody.add(guitar);guitar.position.set(-.075,.77,.28);guitar.rotation.z=-.64;
 const blue=mat('Parker blue finish',0x1767b0,{metalness:.28,roughness:.22});
 const shape=new T.Shape();shape.moveTo(0,-.29);shape.bezierCurveTo(-.25,-.30,-.30,-.12,-.21,.05);shape.bezierCurveTo(-.15,.14,-.18,.28,-.12,.40);shape.bezierCurveTo(-.06,.44,-.10,.17,-.015,.16);shape.lineTo(.045,.16);shape.bezierCurveTo(.16,.19,.11,.36,.22,.31);shape.bezierCurveTo(.25,.23,.11,.12,.19,.03);shape.bezierCurveTo(.35,-.14,.23,-.31,0,-.29);
 const guitarGeo=new T.ExtrudeGeometry(shape,{depth:.085,bevelEnabled:true,bevelSize:.022,bevelThickness:.016,bevelSegments:3,curveSegments:16});mesh(guitar,'Parker asymmetric blue body',guitarGeo,blue);
 const guard=new T.Shape();guard.moveTo(-.05,-.23);guard.quadraticCurveTo(.22,-.20,.13,.04);guard.lineTo(.085,.18);guard.lineTo(-.04,.18);guard.lineTo(-.10,.06);guard.quadraticCurveTo(-.02,-.01,-.15,-.12);guard.closePath();mesh(guitar,'Parker white pickguard',new T.ShapeGeometry(guard),ivory,[0,0,.112]);
 box(guitar,'Guitar maple neck',wood,[.023,.60,.04],[.070,.87,.045]);box(guitar,'Guitar ebony fretboard',black,[.023,.59,.071],[.067,.87,.018]);
 const headstock=box(guitar,'Parker tapered headstock',blue,[.012,1.09,.04],[.095,.22,.044]);headstock.rotation.z=.12;
 for(let i=0;i<22;i++){const y=.22+.78*(1-Math.pow(2,-i/12));segment(guitar,'Guitar fret',chrome,[-.01,y,.085],[.057,y,.085],.0025);}
 for(const y of [-.025,.085])box(guitar,'Single coil pickup',ivory,[.021,y,.137],[.14,.026,.018]);
 for(const y of [-.127,-.092])box(guitar,'Bridge humbucker coil',black,[.021,y,.135],[.15,.028,.020]);
 box(guitar,'Guitar tremolo bridge',chrome,[.021,-.185,.139],[.14,.046,.033]);
 for(let i=0;i<6;i++){const x=.005+i*.007;segment(guitar,'Guitar string',chrome,[x,-.196,.162],[x,1.14,.09],.0011);const sign=i<3?-1:1,y=1.02+(i%3)*.058;segment(guitar,'Guitar tuner',chrome,[.012,y,.04],[sign*.07,y,.04],.008);ball(guitar,'Guitar tuner key',chrome,[sign*.076,y,.04],[.018,.012,.01]);}
 curve(guitar,'Tremolo arm',chrome,[[.08,-.18,.15],[.16,-.09,.21],[.19,.02,.21]],.006);
 for(const y of [-.11,-.19])ball(guitar,'Guitar control knob',ivory,[.17,y,.146],[.022,.022,.02]);
 curve(branBody,'Black guitar strap',black,[[-.21,1.29,0],[-.33,1.19,.13],[-.25,.75,.27]],.030);
 // Stage cap sits on the user's existing box, leaving the house geometry intact.
 const stage=new T.Group();stage.name='Party Knight rooftop riser';stage.position.set(...world(spec.stage.u,spec.stage.v,spec.stage.y));group.add(stage);
 box(stage,'Existing box stage cap',black,[0,-.012,0],[spec.stage.width,.024,spec.stage.depth]);
 label(stage,'PARTY KNIGHT',1.55,[0,-.17,spec.stage.depth/2+.022],ivory);
 box(stage,'Stage front fascia',black,[0,-.15,spec.stage.depth/2],[spec.stage.width,.29,.035]);
 // Matte transparent ink sits directly on the stucco beneath the fascia, without a signboard.
 if(logoTexture){logoTexture.colorSpace=T.SRGBColorSpace;logoTexture.flipY=false;}
 const logoPaint=mat('Mimesis painted wall logo',0xffffff,{map:logoTexture,roughness:1,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
 logoPaint.userData={embeddedImage:MIMESIS_LOGO.image,finish:'Black paint on stucco'};
 const logoGeometry=new T.PlaneGeometry(MIMESIS_LOGO.width,MIMESIS_LOGO.height);
 logoGeometry.setAttribute('uv',new T.Float32BufferAttribute(MIMESIS_LOGO.corners.flat(),2));
 const wallLogo=mesh(group,'Mimesis logo painted below Party Knight',logoGeometry,logoPaint,world(MIMESIS_LOGO.u,MIMESIS_LOGO.v,MIMESIS_LOGO.centerHeight));
 wallLogo.castShadow=false;wallLogo.userData={image:MIMESIS_LOGO.image,finish:'Painted on existing wall'};
 for(const artist of [christel.root,bran]){const monitorRig=new T.Group();monitorRig.name='Fountain-facing stage monitor';monitorRig.position.copy(artist.position).addScaledVector(forwardOf(artist),.89);monitorRig.quaternion.copy(artist.quaternion);group.add(monitorRig);const monitor=box(monitorRig,'Stage wedge monitor',black,[0,.12,0],[.42,.23,.32]);monitor.rotation.x=-.15;box(monitorRig,'Monitor grille',chrome,[0,.16,.165],[.34,.12,.007]);}
 function microphone(artist,mouthY,name,standOffset=.612){
  const mic=new T.Group();mic.name=name;mic.position.copy(artist.position).addScaledVector(forwardOf(artist),standOffset);mic.quaternion.copy(artist.quaternion);group.add(mic);
  mesh(mic,'Microphone weighted base',new T.CylinderGeometry(.17,.19,.035,20),black,[0,.018,0]);segment(mic,'Microphone stand',black,[0,.03,0],[0,mouthY-.16,0],.016);
  segment(mic,'Microphone boom',chrome,[0,mouthY-.17,0],[0,mouthY,-.23],.010);segment(mic,'Vocal microphone',black,[0,mouthY,-.19],[0,mouthY,-.34],.026);
  ball(mic,'Microphone mesh capsule',chrome,[0,mouthY,-.35],[.03,.03,.038]);curve(mic,'Microphone cable',black,[[0,mouthY,-.18],[.04,.4,.06],[.06,.04,.10],[.30,.02,.17]],.006);
  return mic;
 }
 const mics=[microphone(christel.root,1.29,'Christel vocal microphone',.714),microphone(bran,1.52,'Bran Man vocal microphone')];
 // A compact acoustic kit fits on the rear of the same box; no extension of the house.
 const drumKit=new T.Group();drumKit.name='Corner drum kit';drumKit.position.set(...world(spec.drummer.u,spec.drummer.v,spec.stage.y));faceFountain(drumKit);group.add(drumKit);
 const drummer=makeStickman(null,{faceBuilder});drummer.root.name='Seated patio drummer — regular stickman';drummer.root.userData={role:'drummer',hostile:false,playerControlled:false,characterSource:'makeStickman / The Mountains',behavior:'seated drumming'};drumKit.add(drummer.root);
 drummer.body.position.y=-.22;
 // Shared rig rods have baked lengths/radii. Normalize just this NPC's segments
 // before posing them, so the seated limbs retain the regular stick thickness.
 drummer.limbs.forEach(l=>l.children.forEach(o=>{if(o.isMesh)o.geometry=unitRod;}));
 // Bend the shared rig's existing thigh and shin segments into a seated pose.
 for(const [i,sign] of [[0,-1],[2,1]]){
  const leg=drummer.limbs[i],knee=[sign*.21,-.01,.33],ankle=[sign*.25,-.50,.46];
  poseSegment(leg.children[0],[0,0,0],knee,.043);poseSegment(leg.children[1],knee,ankle,.043);
  segment(leg,'Drummer foot',leg.children[0].material,ankle,[sign*.25,-.50,.59],.043);
 }
 mesh(drumKit,'Drum throne cushion',new T.CylinderGeometry(.20,.20,.08,20),black,[0,.48,-.035]);
 segment(drumKit,'Drum throne post',chrome,[0,.10,-.035],[0,.45,-.035],.025);
 for(let i=0;i<3;i++){const a=i*Math.PI*2/3;segment(drumKit,'Drum throne foot',chrome,[0,.16,-.035],[Math.cos(a)*.25,.035,Math.sin(a)*.25-.035],.016);}
 const drumShell=mat('Drum kit midnight blue shells',0x263c65,{metalness:.35,roughness:.28}),drumHead=mat('Drum kit ivory heads',0xe0dfce,{roughness:.82}),cymbalMat=mat('Drum kit warm brass cymbals',0xc8a650,{metalness:.8,roughness:.36}),stickWood=mat('Drummer maple sticks',0xd8b87e);
 function drum(name,position,radius,depth,vertical=true){
  const d=new T.Group();d.name=name;d.position.set(...position);if(!vertical)d.rotation.x=Math.PI/2;drumKit.add(d);
  mesh(d,name+' shell',new T.CylinderGeometry(radius,radius,depth,24),drumShell);
  for(const sign of [-1,1]){
   mesh(d,name+' head',new T.CylinderGeometry(radius-.01,radius-.01,.008,24),drumHead,[0,sign*(depth/2+.003),0]);
   const hoop=mesh(d,name+' chrome hoop',new T.TorusGeometry(radius,.012,6,32),chrome,[0,sign*depth/2,0]);hoop.rotation.x=Math.PI/2;
  }
  for(let i=0;i<8;i++){const a=i*Math.PI/4,x=Math.cos(a)*(radius+.008),z=Math.sin(a)*(radius+.008);segment(d,name+' tension rod',chrome,[x,-depth*.40,z],[x,depth*.40,z],.009);}
  return d;
 }
 const bass=drum('Bass drum',[0,.32,.80],.30,.34,false);
 for(const side of [-1,1])segment(drumKit,'Bass drum spur',chrome,[side*.24,.25,.90],[side*.36,.035,1.02],.015);
 // Black centre patch on the outward-facing bass head.
 const bassPatch=mesh(bass,'Bass drum centre patch',new T.CylinderGeometry(.075,.075,.009,20),black,[0,.18,0]);
 drum('Snare drum',[-.43,.69,.64],.215,.13);segment(drumKit,'Snare stand',chrome,[-.43,.06,.64],[-.43,.62,.64],.017);
 drum('Rack tom',[.18,.93,.70],.18,.20);segment(drumKit,'Rack tom mount',chrome,[.10,.54,.76],[.18,.84,.70],.015);
 drum('Floor tom',[.55,.57,.66],.205,.30);
 for(let i=0;i<3;i++){const a=i*Math.PI*2/3;segment(drumKit,'Floor tom leg',chrome,[.55+Math.cos(a)*.18,.48,.66+Math.sin(a)*.18],[.55+Math.cos(a)*.23,.03,.66+Math.sin(a)*.23],.013);}
 function cymbal(name,x,y,z,r){
  const pivot=new T.Group();pivot.name=name;pivot.position.set(x,y,z);drumKit.add(pivot);
  const profile=[new T.Vector2(.016,.030),new T.Vector2(.065,.026),new T.Vector2(.10,.010),new T.Vector2(r,-.01)];
  const bronze=cymbalMat.clone();bronze.side=T.DoubleSide;const disc=new T.LatheGeometry(profile,36);disc.normalizeNormals();mesh(pivot,name+' brass disc',disc,bronze);
  segment(drumKit,name+' stand',chrome,[x,.08,z],[x,y+.055,z],.012);ball(drumKit,name+' wing nut',black,[x,y+.057,z],[.027,.012,.012]);
  for(let i=0;i<3;i++){const a=i*Math.PI*2/3;segment(drumKit,name+' tripod',chrome,[x,.23,z],[x+Math.cos(a)*.18,.03,z+Math.sin(a)*.18],.010);}
  return pivot;
 }
 const hiHat=cymbal('Hi-hat',-.64,1.10,.38,.22),ride=cymbal('Ride cymbal',.59,1.28,.85,.27);
 const lowerHat=mesh(hiHat,'Lower hi-hat cymbal',new T.ConeGeometry(.215,.032,32,1,true),cymbalMat,[0,-.035,0]);
 box(drumKit,'Bass drum kick pedal',black,[.23,.035,.52],[.08,.028,.21]);segment(drumKit,'Bass pedal beater arm',chrome,[.23,.06,.60],[.09,.23,.64],.008);ball(drumKit,'Bass pedal felt beater',ivory,[.09,.23,.64],[.025,.035,.02]);
 const drumsticks=[segment(drumKit,'Left maple drumstick',stickWood,[-.35,.9,.4],[-.44,.78,.70],.010),segment(drumKit,'Right maple drumstick',stickWood,[.35,1,.3],[.22,1.04,.70],.010)];
 function poseDrummer(t){
  drummer.animate(t,false,false);drummer.body.position.y=-.22;drummer.limbs.forEach(l=>l.rotation.set(0,0,0));drummer.head.rotation.x=Math.sin(t*3.4)*.035;
  for(const [n,sign] of [[0,-1],[1,1]]){
   const lift=(1-Math.cos(t*6.8+n*Math.PI))/2;
   const hand=[sign*.36,(n?1.02:.94)+lift*.18,.36],tip=[n?.22:-.44,(n?1.04:.775)+lift*.30,n?.70:.64];
   const elbow=[sign*.29,1.02+lift*.09,.14],armGroup=drummer.limbs[n*2+1];
   const local=point=>[point[0],point[1]+.22-1.37,point[2]];
   poseSegment(armGroup.children[0],[0,0,0],local(elbow),.04);poseSegment(armGroup.children[1],local(elbow),local(hand),.04);
   for(let i=0;i<3;i++)poseSegment(armGroup.children[i+2],local(hand),local([hand[0]+sign*(.035+i*.025),hand[1]-.025+i*.024,hand[2]+.05]),.02);
   poseSegment(drumsticks[n],hand,tip,.010);
  }
  hiHat.rotation.z=Math.sin(t*13.6)*.012;ride.rotation.x=Math.sin(t*6.8)*.025;
 }
 poseDrummer(0);
 // Counter and back bar stay low enough to see the hedges and the server's face.
 const barWood=mat('Bar walnut panels',0x48302d),barTop=mat('Bar dark counter',0x202831,{roughness:.27}),glass=mat('Bar glass',0xc5eef0,{transparent:true,opacity:.42,roughness:.12}),amber=mat('Bar amber drink',0xe39b36),green=mat('Bar green bottles',0x1c795a,{roughness:.18}),purple=mat('Bar violet bottles',0x5b3882,{roughness:.2});
 bar.position.set(...world(spec.bar.u,spec.bar.v,spec.bar.y));
 const counter=box(bar,'Solid patio bar counter',barWood,[0,.51,0],[spec.bar.width,1.02,spec.bar.depth]);
 box(bar,'Polished bar top',barTop,[0,1.075,0],[spec.bar.width+.16,.13,spec.bar.depth+.15]);
 for(let i=0;i<9;i++)box(bar,'Bar front panel seam',gold,[-1.55+i*.387,.54,.436],[.014,.84,.016]);
 segment(bar,'Brass foot rail',gold,[-1.72,.19,.59],[1.72,.19,.59],.028);label(bar,'BAR',.53,[0,.65,.454],ivory);
 const bartender=makeStickman(null,{faceBuilder});bartender.root.name='Patio bartender — regular stickman';bartender.root.position.set(...world(spec.bar.u,spec.bar.v-16,spec.bar.y));bartender.root.userData={role:'bartender',hostile:false,playerControlled:false,characterSource:'makeStickman / The Mountains',behavior:'serve drinks'};group.add(bartender.root);
 box(bar,'Back bar bottle shelf',barWood,[0,.87,-1.87],[3,.10,.38]);
 for(const x of [-1.3,1.3])box(bar,'Back bar support',barWood,[x,.43,-1.87],[.09,.86,.23]);
 function bottle(p,x,z,color,height=.30){mesh(p,'Drink bottle',new T.CylinderGeometry(.043,.052,height*.65,12),color,[x,.95+height*.325,z]);segment(p,'Bottle neck',color,[x,.95+height*.65,z],[x,.95+height,z],.022);box(p,'Bottle paper label',ivory,[x,.95+height*.34,z+.052],[.06,.08,.006]);}
 for(let i=0;i<8;i++)bottle(bar,-1.2+i*.34,-1.87,i%2?green:purple,.26+(i%3)*.03);
 function cup(p,pos){const c=new T.Group();c.name='Served drink';c.position.set(...pos);p.add(c);mesh(c,'Glass tumbler',new T.CylinderGeometry(.055,.045,.15,16,1,true),glass,[0,.075,0]);mesh(c,'Amber drink',new T.CylinderGeometry(.044,.040,.09,16),amber,[0,.045,0]);mesh(c,'Glass base',new T.CylinderGeometry(.046,.046,.009,16),glass,[0,.005,0]);return c;}
 for(const x of [-1.18,-.8,.88,1.25])cup(bar,[x,1.145,.12]);const served=cup(bar,[.3,1.145,.02]);
 // Shaker follows his real hand; his original stick arms, fingers and idle legs remain.
 const shaker=new T.Group();shaker.name='Bartender cocktail shaker';bartender.limbs[3].add(shaker);shaker.position.set(.5,-.03,.15);
 mesh(shaker,'Steel shaker body',new T.CylinderGeometry(.052,.040,.18,16),chrome,[0,.04,0]);mesh(shaker,'Shaker cap',new T.CylinderGeometry(.025,.052,.065,16),chrome,[0,.16,0]);
 const barLight=new T.PointLight(0xcb77ff,5,5,2);barLight.name='Soft bar accent';barLight.position.set(...world(spec.bar.u,spec.bar.v,spec.bar.y+1.1));group.add(barLight);
 bar.userData={role:'bar',guestDestination:spec.barGuestTarget,behavior:'Six arriving bus guests collect drinks on the customer side, then wander on the patio'};
 let time=0,night=false;
 function update(dt,camera=null){
  time+=Math.max(0,dt);const bowStroke=Math.sin(time*3.4)*.15,strum=Math.sin(time*12)*.065;
  christel.body.rotation.z=Math.sin(time*1.7)*.018;bow.position.x=bowStroke;
  cello.updateMatrix();bow.updateMatrix();
  const celloAt=v=>new T.Vector3(...v).applyMatrix4(cello.matrix).toArray();
  const bowGrip=new T.Vector3(-.38,-.015,.005).applyMatrix4(bow.matrix).applyMatrix4(cello.matrix).toArray();
  celloLeft.pose([.22,1.12,0],[.44,1.01,.24],celloAt([.035,1.04+Math.sin(time*1.4)*.022,.17]));
  celloRight.pose([-.22,1.12,0],[-.43,.81,.24],bowGrip);
  christel.expression.singingMouth.scale.y=.026+.022*(.5+.5*Math.sin(time*8));
  christel.hairLocks.forEach((lock,i)=>lock.rotation.z=Math.sin(time*1.7+i*.6)*.025);
  branBody.rotation.z=Math.sin(time*1.7+.6)*.026;branMouth.scale.y=.023+.025*(.5+.5*Math.sin(time*7.2+.7));
  // Convert fretting and picking points from guitar coordinates into torso coordinates.
  guitar.updateMatrix();const at=v=>new T.Vector3(...v).applyMatrix4(guitar.matrix).toArray();
  guitarLeft.pose([.22,1.25,0],[.45,1.09,.14],at([.023,.67+Math.sin(time*.9)*.045,.115]));
  guitarRight.pose([-.22,1.25,0],[-.42,1.04,.20],at([strum,-.055,.19]));
  glows.forEach((g,i)=>{const pulse=.5+.5*Math.sin(time*Math.PI*(i?1.5:2.4));const tint=g.colors[0].clone().lerp(g.colors[1],pulse);
   g.palette.forEach(({material,base},j)=>{const c=g.colors[0].clone().lerp(g.colors[1],j%2?1-pulse:pulse);material.color.copy(base).lerp(c,.36);material.emissive.copy(c);material.emissiveIntensity=.24+pulse*.25;});
   g.light.color.copy(tint);g.light.intensity=(night?14:4)+pulse*(night?10:3);g.aura.material.color.copy(tint);g.aura.scale.setScalar(1+pulse*.12);if(camera)g.aura.quaternion.copy(camera.quaternion);
  });
  if(!bartender.escapeControlled){bartender.animate(time,false,false);const pour=(Math.sin(time*1.7)+1)/2;
   bartender.limbs[3].rotation.set(-.42-pour*.25,0,-.20-pour*.45);bartender.limbs[1].rotation.x=-.35;
   shaker.rotation.z=-pour*.85;served.rotation.z=0;}
  if(!drummer.escapeControlled)poseDrummer(time);
 }
 update(0);
 return {group,bar,barLight,spec,stage,christel,bran,branBody,bartender,drummer,drumKit,drumsticks,cello,bow,guitar,mics,glows,counter,shaker,update,setNight(value){night=!!value;update(0);},get elapsed(){return time;}};
}

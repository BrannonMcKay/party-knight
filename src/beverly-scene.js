import * as T from '../vendor/three.module.js';
import {OrbitControls} from '../vendor/OrbitControls.js';
import {mergeGeometries} from '../vendor/BufferGeometryUtils.js';
import {buildBeverlyEstate} from './beverly-model.js';
import {PARTY_KNIGHT_ART,WORDS_LOSE_ART} from './beverly-artwork.js';
import {MIMESIS_LOGO} from './beverly-performance.js';
import {createBeverlyNavigation} from './beverly-navigation.js';
import {createBeverlyPlayer} from './beverly-player.js';
import {createBeverlyStubby} from './beverly-stubby.js';
import {createBeverlyEscape} from './beverly-escape.js';
import {createBeverlySpeech} from './beverly-speech.js';
import {createBeverlySpeechAudio} from './beverly-speech-audio.js';
import {world,CHURRO_TENT} from './beverly-layout.js';
import {applyEstateSurfaces} from './beverly-surface.js';
import {createLightPool} from './beverly-light-pool.js';

// Both the playable game and the estate review use this scene and these rigs.
export async function createEstateScene(canvas,{onHeadStart,onLoadStage}={}){
await onLoadStage?.('Loading the artwork…');
const renderer=new T.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.5;
// Party Knight always takes place at night, including the pre-level overview.
const scene=new T.Scene();scene.background=new T.Color(0x111e32);scene.fog=new T.Fog(0x111e32,260,600);
const camera=new T.PerspectiveCamera(47,1,.08,500),controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.07;controls.minDistance=.3;controls.maxDistance=250;controls.maxPolarAngle=Math.PI*.49;
const hemi=new T.HemisphereLight(0xe3edff,0x665844,.31);scene.add(hemi);const moon=new T.DirectionalLight(0x9eafff,.36);moon.position.set(35,75,-35);moon.castShadow=true;moon.shadow.mapSize.set(2048,2048);Object.assign(moon.shadow.camera,{left:-90,right:90,top:85,bottom:-85,near:1,far:220});moon.shadow.normalBias=.06;moon.shadow.bias=-.00012;scene.add(moon);scene.add(moon.target);
const [paintingTexture,logoTexture,hallPaintingTexture]=await Promise.all([PARTY_KNIGHT_ART.image,MIMESIS_LOGO.image,WORDS_LOSE_ART.image].map(path=>new T.TextureLoader().loadAsync(new URL(path,import.meta.url).href)));
for(const texture of [paintingTexture,logoTexture,hallPaintingTexture])texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
await onLoadStage?.('Building the estate…');
const model=buildBeverlyEstate(T,{paintingTexture,logoTexture,hallPaintingTexture});
// World-projected grain, joints and relief for the flat-colour estate materials.
applyEstateSurfaces(T,model.materials,{anisotropy:Math.min(4,renderer.capabilities.getMaxAnisotropy())});
const {root,groups,materials,maze,gate,effects,gardenWater,patioFountain,churroTent,partyBus,passengers,performance,guests,story,filmCrew,drivewayCameraman,patioBubbles}=model;
// Keep the fixture locations before their meshes are merged. The glowing panes
// are light sources themselves, so incident light should not wash their red to white.
const driveBulb=new T.MeshBasicMaterial({name:'Lit driveway lantern glass',color:0xfff9f3,toneMapped:false});
const houseLens=materials['Lantern glass'].clone();
houseLens.name='House lantern glass';
groups.Ground_floor.traverse(o=>{if(o.material===materials['Lantern glass'])o.material=houseLens;});
const driveFixtures=[];
for(const mesh of groups.Lamps.children){
 if(mesh.material===materials['Lantern glass']&&mesh.position.x<world(845,0)[0])mesh.material=houseLens;
 if(mesh.material!==materials['Driveway lantern glass'])continue;
 driveFixtures.push(mesh.getWorldPosition(new T.Vector3()));
 mesh.material=driveBulb;
}
const navigation=createBeverlyNavigation(T,model);
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const player=createBeverlyPlayer(T,navigation,{reducedMotion:reducedMotion.matches});scene.add(player.root);
const stubby=createBeverlyStubby(T,{model,navigation,player,scene});
// Batch immutable preview geometry by section, material and ground cell. Export
// keeps editable objects. Cells let the renderer skip scenery that is behind
// the camera or outside the moving shadow window instead of drawing one
// estate-wide mesh per material in both passes.
const CELL=30,cellCenter=new T.Vector3();
let sourceMeshes=0;
for(const group of Object.values(groups)){
 if(group.userData.dynamic||group.userData.preserveGeometry)continue;
 const batches=new Map();root.updateMatrixWorld(true);
 group.traverse(o=>{if(!o.isMesh)return;sourceMeshes++;const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);g.deleteAttribute('uv');g.deleteAttribute('uv1');g.deleteAttribute('color');g.computeBoundingBox();g.boundingBox.getCenter(cellCenter);const key=o.material.uuid+'|'+Math.floor(cellCenter.x/CELL)+'|'+Math.floor(cellCenter.z/CELL);let b=batches.get(key);if(!b)batches.set(key,b={mat:o.material,geos:[]});b.geos.push(g);});
 group.clear();group.position.set(0,0,0);group.rotation.set(0,0,0);group.scale.set(1,1,1);for(const {mat,geos} of batches.values()){const geo=mergeGeometries(geos,false);const m=new T.Mesh(geo,mat);m.castShadow=group!==groups.Pool_and_cascades&&group!==groups.Terrain;m.receiveShadow=true;m.userData.staticBatch=true;group.add(m);geos.forEach(g=>g.dispose());}
}
scene.add(root);
patioBubbles.setNight(true);performance.setNight(true);materials['Lantern glass'].emissiveIntensity=2;
// Merge the moving coach's rigid pieces in their own local coordinates.
await onLoadStage?.('Preparing the party guests…');
for(const section of [...story.finale.spirits.flatMap(a=>a.rigidParts),partyBus.fixed,...partyBus.wheels,partyBus.door,partyBus.steps,...passengers.actors.filter(a=>a.model).flatMap(a=>a.rigidParts),...passengers.poolParty.actors.flatMap(a=>a.rigidParts),...guests.alPacino.rigidParts,...guests.panMan.rigidParts,...guests.alex.rigidParts,...guests.emily.rigidParts,...guests.hotChick.rigidParts]){
 root.updateMatrixWorld(true);const inverse=section.matrixWorld.clone().invert(),batches=new Map();
  section.traverse(o=>{if(!o.isMesh)return;let b=batches.get(o.material.uuid);if(!b)batches.set(o.material.uuid,b={mat:o.material,geos:[]});const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(inverse.clone().multiply(o.matrixWorld));g.deleteAttribute('uv');b.geos.push(g);});
 section.clear();for(const b of batches.values()){const m=new T.Mesh(mergeGeometries(b.geos,false),b.mat);m.castShadow=true;m.receiveShadow=true;section.add(m);b.geos.forEach(g=>g.dispose());}
}
partyBus.setNight(true);
let sound;
const escape=createBeverlyEscape(T,model,navigation,{onHeadStart,player,onCritic(position){
 if(!sound?.enabled.effects||sound.hidden||sound.view!=='playing')return;
 const direction=camera.getWorldDirection(new T.Vector3());
 sound.taunt({player:{x:camera.position.x,z:camera.position.z,angle:Math.atan2(direction.x,direction.z)}},'taunt',{x:position.x,z:position.z});
}});
const nightLights=new T.Group();scene.add(nightLights);
for(const [u,v,y,p] of [[840,582,11,110],[840,686,11,115],[960,710,11,90],[1515,498,5.5,130],[1530,704,5.5,130],[1680,600,5,180],[1060,543,7.7,85],[1215,660,6.7,85],[639,610,10.5,140],[725,550,11.2,75],[786,630,11.2,75],[809,442,11.2,8]]){const l=new T.PointLight(0xffc58a,p,19,2);l.position.set(...world(u,v,y));nightLights.add(l);}
const poolFill=new T.PointLight(0x42bbca,140,28,2);poolFill.position.set(...world(1508,600,2.8));nightLights.add(poolFill);
const fountainFill=new T.PointLight(0x9ddedb,48,9,2);fountainFill.position.set(...world(903,601,9.1));nightLights.add(fountainFill);
for(const position of driveFixtures){
 const light=new T.PointLight(0xffffff,52,22,2);
 light.name='Driveway lantern';light.position.copy(position);nightLights.add(light);
}
// A small lens glow stays attached to each pane. Draw all of them together,
// letting the depth buffer hide them behind the gate, trees and bus.
const haloCanvas=document.createElement('canvas');haloCanvas.width=haloCanvas.height=64;
const ctx=haloCanvas.getContext('2d'),halo=ctx.createRadialGradient(32,32,0,32,32,32);
for(const [radius,alpha] of [[0,1],[.18,.55],[.4,.16],[.7,.035],[1,0]])halo.addColorStop(radius,`rgba(255,255,255,${alpha})`);
ctx.fillStyle=halo;ctx.fillRect(0,0,64,64);
const haloMaterial=new T.PointsMaterial({size:1.65,map:new T.CanvasTexture(haloCanvas),transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false});
const driveHalos=new T.Points(new T.BufferGeometry().setFromPoints(driveFixtures),haloMaterial);
driveHalos.name='Driveway lantern glow';scene.add(driveHalos);
const fireplaceLight=new T.PointLight(0xffc58a,105,15,2);fireplaceLight.position.set(...world(835,770,11.2));nightLights.add(fireplaceLight);
const interiorFill=new T.PointLight(0xffd9b0,60,15,2);interiorFill.position.set(...world(828,763,11.25));scene.add(interiorFill);
const woodFill=new T.PointLight(0xdba678,15,12,2);woodFill.position.set(...world(708,763,10.5));scene.add(woodFill);
const trailerLight=new T.PointLight(0xe0edeb,85,13,2);trailerLight.position.set(...world(291,1049,8.9));nightLights.add(trailerLight);
for(const [du,h,power] of [[7,2.32,38],[53,3.25,28]]){const light=new T.PointLight(0xffd4a0,power,12,2);light.position.set(...world(CHURRO_TENT.u+du,CHURRO_TENT.v,CHURRO_TENT.y+h));nightLights.add(light);}
const encoreColors=[0xb493ff,0xfa8acb,0x839fff].map(hex=>new T.Color(hex));
const lampBases=nightLights.children.filter(l=>l!==poolFill&&l!==fountainFill).map((l,i)=>({l,color:l.color.clone(),intensity:l.intensity,encore:encoreColors[i%3],driveway:l.name==='Driveway lantern'}));
const fills=[[poolFill,2],[fountainFill,1],[interiorFill,0],[woodFill,2],[model.artwork.light,1],[performance.barLight,1],[hemi,0],[moon,2]].map(([l,index])=>({l,color:l.color.clone(),intensity:l.intensity,encore:encoreColors[index]}));
const houseLights=new Set([fireplaceLight,interiorFill,woodFill,model.artwork.light,...nightLights.children.filter(l=>l.position.x>=world(620,0)[0]&&l.position.x<=world(845,0)[0]&&l.position.z>=world(0,430)[2]&&l.position.z<=world(0,800)[2])]);
const escapeRed=new T.Color(0xff2850);
const restingPink=new T.Color(0xb54175),estatePurple=new T.Color(0x8513ff),pulseColor=new T.Color();
const bulbWhite=driveBulb.color.clone(),driveRed=new T.Color(0xff1428),drivePink=new T.Color(0xff83b0),driveEmission=new T.Color(),driveSpill=new T.Color();
const nightSky=scene.background.clone(),driveSky=new T.Color(0x060a14);
const lens=materials['Lantern glass'],lensColor=lens.color.clone(),lensEmissive=lens.emissive.clone(),lensIntensity=lens.emissiveIntensity;
function updateEstateLighting(encoreMix=0,cue=null){
 const danger=escape.active?Math.min(1,escape.elapsed/2):0;
 const lampMix=encoreMix*(1-.22*danger);
 const cueMix=cue ? cue.cueMix*(1-danger) : 0;
 const pulse=(cue?.pulse??0)*(reducedMotion.matches ? .22 : 1);
 const flicker=reducedMotion.matches ? .5 : (cue?.flicker??.5);
 pulseColor.copy(restingPink).lerp(estatePurple,pulse);
 const spill=.13+.07*flicker+2.02*pulse;
 const driveMix=cue?.driveway ? cueMix : 0;
 const estateMix=cue && !cue.driveway ? cueMix : 0;
 // Use the same attack and release for the source and its reflected light.
 // At rest the glass is still visible while its spill is almost gone.
 driveEmission.copy(drivePink).multiplyScalar(.019+.012*flicker).lerp(driveRed,pulse);
 driveSpill.copy(drivePink).multiplyScalar(.0045+.003*flicker).lerp(driveRed,pulse).multiplyScalar(1.8);
 driveBulb.color.copy(bulbWhite).lerp(escapeRed,danger).lerp(encoreColors[1],lampMix).lerp(driveEmission,driveMix);
 haloMaterial.color.copy(driveBulb.color);
 haloMaterial.opacity=T.MathUtils.lerp(.25,.08+.80*pulse,driveMix);
 // The renderer multiplies light color by intensity. Blend the resulting
 // radiance so the return to white has no second flash halfway through.
 for(const {l,color,intensity,encore,driveway} of lampBases){
  if(driveway){
   l.intensity=intensity;
   l.color.copy(color).lerp(escapeRed,danger).lerp(encore,lampMix).multiplyScalar((1-.55*danger)*(1-.32*encoreMix)).lerp(driveSpill,driveMix);
   continue;
  }
  const mix=estateMix;
  l.color.copy(color).lerp(escapeRed,danger).lerp(encore,lampMix).lerp(pulseColor,mix);
  l.intensity=intensity*T.MathUtils.lerp((1-.55*danger)*(1-.32*encoreMix),spill,mix);
 }
 let approachMix=0;
 if(driveMix){
  let nearest=Infinity;
  for(const position of driveFixtures)nearest=Math.min(nearest,camera.position.distanceToSquared(position));
  approachMix=driveMix*(1-T.MathUtils.smoothstep(Math.sqrt(nearest),16,32));
 }
 scene.background.copy(nightSky).lerp(driveSky,approachMix);scene.fog.color.copy(scene.background);
 for(const {l,color,intensity,encore} of fills){
  const skyLight=l===hemi||l===moon;
  const mix=skyLight ? 0 : estateMix;
  l.color.copy(color).lerp(encore,encoreMix).lerp(pulseColor,mix);
  l.intensity=intensity*T.MathUtils.lerp(1-.24*encoreMix,spill,mix);
  if(skyLight)l.intensity*=1-(l===hemi ? .87 : .80)*approachMix;
 }
 for(const l of houseLights)l.intensity*=1-.88*escape.alternate.houseDim;
 lens.color.copy(lensColor).lerp(escapeRed,danger).lerp(encoreColors[1],lampMix).lerp(pulseColor,estateMix);
 lens.emissive.copy(lensEmissive).lerp(escapeRed,danger).lerp(encoreColors[1],lampMix).lerp(pulseColor,estateMix);
 lens.emissiveIntensity=T.MathUtils.lerp(lensIntensity*(1-danger*.45)*(1-.32*encoreMix),.30+.16*flicker+2.1*pulse,estateMix);
 const houseLevel=1-.88*escape.alternate.houseDim;
 houseLens.color.copy(lens.color).multiplyScalar(houseLevel);houseLens.emissive.copy(lens.emissive);houseLens.emissiveIntensity=lens.emissiveIntensity*houseLevel;
}
function attachSpeech(soundtrack){
sound=soundtrack;
const speechAudio=createBeverlySpeechAudio(soundtrack,{stickmen:[...filmCrew.actors,drivewayCameraman.actor,...passengers.speechActors,...escape.records.filter(r=>r.hunter).map(r=>r.actor)],token:escape.records.find(r=>r.actor.id==='token-trans'),blocked:navigation.blocked});
const speech=createBeverlySpeech(T,[...new Set([stubby.speaker,...(story.churroSpeaker?[story.churroSpeaker]:[]),...escape.alternate.actors,...story.finale.spirits,...filmCrew.actors,drivewayCameraman.actor,guests.alPacino,guests.panMan,guests.alex,guests.emily,guests.hotChick,...passengers.speechActors,...escape.records.map(r=>r.actor)])],canvas,[groups.Ground_floor,groups.Upper_floors_and_roofs,groups.Terraces,groups.Planting],{onVisibleSpeech:speechAudio.update});
return {speech,speechAudio};
}
// Soft contact shadows keep Christel and the coach planted under the lanterns,
// which cast no shadows of their own.
function softShadow(width,depth,round,opacity){
 const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),image=g.createImageData(128,128);
 for(let y=0;y<128;y++)for(let x=0;x<128;x++){
  const px=Math.abs(x-63.5)/63.5,py=Math.abs(y-63.5)/63.5;
  // Rounded-box falloff: solid inside the core, easing to nothing at the quad edge.
  const dx=Math.max(0,px-round[0])/(1-round[0]),dy=Math.max(0,py-round[1])/(1-round[1]),k=1-Math.min(1,Math.hypot(dx,dy));
  image.data[(y*128+x)*4+3]=Math.round(255*k*k*(3-2*k));
 }
 g.putImageData(image,0,0);
 const mesh=new T.Mesh(new T.PlaneGeometry(width,depth).rotateX(-Math.PI/2),new T.MeshBasicMaterial({color:0x04050a,map:new T.CanvasTexture(c),transparent:true,opacity,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4}));
 mesh.renderOrder=2;mesh.castShadow=mesh.receiveShadow=false;return mesh;
}
const playerShadow=softShadow(1.5,1.5,[.05,.05],.5);playerShadow.name='Christel contact shadow';scene.add(playerShadow);
const busShadow=softShadow(4.4,14.6,[.5,.78],.62);busShadow.name='Coach contact shadow';busShadow.position.y=.05;partyBus.group.add(busShadow);
// One headlight throws real shadows, so the coach's beams rake long shadows up
// the drive ahead of Christel. It renders only while the lit coach is nearby.
const beam=partyBus.headlamps.children.find(l=>l.isSpotLight);
beam.castShadow=true;beam.shadow.mapSize.set(1024,1024);beam.shadow.camera.near=.5;beam.shadow.camera.far=28;beam.shadow.bias=-.0008;beam.shadow.normalBias=.03;beam.shadow.autoUpdate=false;
// Hair strands, fingers and similar slivers are too small to read as shadows
// but each one is a separate draw in every shadow pass.
const casterSize=new T.Vector3();
scene.updateMatrixWorld(true);
scene.traverse(o=>{
 if(!o.isMesh||!o.castShadow)return;
 if(!o.geometry.boundingSphere)o.geometry.computeBoundingSphere();
 if(o.geometry.boundingSphere.radius*casterSize.setFromMatrixScale(o.matrixWorld).length()/Math.sqrt(3)<.075)o.castShadow=false;
});
// The moon's shadow map follows the play camera in whole-texel steps: about
// twice as sharp as one fixed estate-wide map, and it now reaches the drive.
const moonDirection=moon.position.clone().normalize(),moonRight=new T.Vector3(0,1,0).cross(moonDirection).normalize(),moonUp=moonDirection.clone().cross(moonRight);
const shadowFocus=new T.Vector3(),shadowForward=new T.Vector3();
const SHADOW_FOLLOW=38;let shadowView='wide';
function setShadowView(view){
 shadowView=view;const follow=view==='follow',c=moon.shadow.camera;
 if(follow)Object.assign(c,{left:-SHADOW_FOLLOW,right:SHADOW_FOLLOW,top:SHADOW_FOLLOW,bottom:-SHADOW_FOLLOW,near:1,far:260});
 else{Object.assign(c,{left:-90,right:90,top:85,bottom:-85,near:1,far:220});moon.position.set(35,75,-35);moon.target.position.set(0,0,0);moon.updateMatrixWorld(true);moon.target.updateMatrixWorld(true);}
 moon.shadow.normalBias=follow?.035:.06;c.updateProjectionMatrix();
}
function followShadow(view){
 view.getWorldDirection(shadowForward);shadowForward.y=0;if(shadowForward.lengthSq()>1e-6)shadowForward.normalize();
 shadowFocus.copy(view.position).addScaledVector(shadowForward,SHADOW_FOLLOW*.55);
 const texel=SHADOW_FOLLOW*2/moon.shadow.mapSize.x,snap=v=>Math.round(v/texel)*texel;
 const a=snap(shadowFocus.dot(moonRight)),b=snap(shadowFocus.dot(moonUp));
 moon.target.position.set(0,0,0).addScaledVector(moonRight,a).addScaledVector(moonUp,b);
 moon.position.copy(moon.target.position).addScaledVector(moonDirection,130);
 moon.updateMatrixWorld(true);moon.target.updateMatrixWorld(true);
}
// The guests are built from thousands of small parts. Parts that would cover
// about a pixel are skipped, and only characters near Christel cast moon
// shadows; both tests are a distance check against the part's own size.
// Patio set dressing (the band, bubbles, fountain jets) is hundreds of draws
// and cannot be made out from the lower drive, so it rests beyond this range.
const FAR_DRESSING2=72*72,dressing=new Set();
for(const group of [groups.Patio_performance,groups.Floating_patio_bubbles,groups.Patio_fountain_water])group?.traverse(o=>{if(o.isMesh)dressing.add(o);});
const detail=[];
scene.traverse(o=>{
 if(!o.isMesh||o.userData.staticBatch||o===playerShadow||o===busShadow)return;
 if(!o.geometry.boundingSphere)o.geometry.computeBoundingSphere();
 const scale=casterSize.setFromMatrixScale(o.matrixWorld).length()/Math.sqrt(3),m=o.material;
 // Parts parked at a collapsed scale (stowed steps, waiting spirits) keep their authored size.
 const radius=o.geometry.boundingSphere.radius*(scale<.05?1:scale);
 const glows=!m||Array.isArray(m)||m.isMeshBasicMaterial||(m.emissive&&m.emissiveIntensity>0&&m.emissive.r+m.emissive.g+m.emissive.b>0);
 detail.push({o,radius2:radius*radius,glows,far:dressing.has(o),casts:o.castShadow,hidden:false});
});
const CAST_RANGE2=26*26,viewSize=new T.Vector2();
function updateDetail(view){
 const e=view.matrixWorld.elements,cx=e[12],cy=e[13],cz=e[14];
 // Angular radius of about 1.4 pixels in play (0.8 in the wide title view) at
 // the current resolution and lens: far crowds stop costing a draw per limb.
 const play=shadowView==='follow',limit=Math.tan(view.fov*Math.PI/360)*2/Math.max(1,renderer.getDrawingBufferSize(viewSize).y)*(play?1.4:.8),limit2=limit*limit;
 for(const d of detail){
  const m=d.o.matrixWorld.elements,dx=m[12]-cx,dy=m[13]-cy,dz=m[14]-cz,d2=dx*dx+dy*dy+dz*dz;
  const tiny=(!d.glows&&d.radius2<d2*limit2)||(d.far&&play&&d2>FAR_DRESSING2);
  if(tiny!==d.hidden){d.hidden=tiny;if(tiny)d.o.layers.disable(0);else d.o.layers.enable(0);}
  if(d.casts){const near=d2<CAST_RANGE2;if(near!==d.o.castShadow)d.o.castShadow=near;}
 }
}
// Authored lamps lend their light to a fixed pool; see beverly-light-pool.js.
const lightPool=createLightPool(T,scene,{size:14});lightPool.adopt();
let adoptClock=0;
scene.onBeforeRender=(_,__,view)=>{
 if(++adoptClock%240===0)lightPool.adopt();
 lightPool.update(view);
 if(view.isPerspectiveCamera)updateDetail(view);
 if(shadowView==='follow')followShadow(view);
 const p=player.root.position;
 playerShadow.visible=player.root.visible&&player.swimBlend<.35;playerShadow.position.set(p.x,p.y+.035,p.z);
 beam.shadow.needsUpdate=partyBus.group.visible&&beam.intensity>0&&view.position.distanceToSquared(partyBus.group.position)<70*70;
};
return {model,renderer,scene,camera,controls,navigation,player,stubby,escape,sourceMeshes,updateEstateLighting,attachSpeech,setShadowView,lightPool};
}

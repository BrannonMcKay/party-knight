// A small stage shown beside the Billy Knight trailer: the game's Alex, Emily
// and Al Pacino stand on a red carpet and wave. It owns its own renderer and
// builds fresh copies of the guests with the same builders the estate uses.
import * as T from '../vendor/three.module.js';
import {buildBeverlyGuests} from './beverly-guests.js';

export const CAST_WAVE=Object.freeze({
 // Left to right as the audience sees them; x in metres, a slight turn inward.
 places:[['alex',-1.05,.24],['alPacino',0,0],['emily',1.05,-.24]],
 eye:[0,1.25,5.2],aim:[0,1.02,0],fov:34
});

export function createCastWaveStage(container,{pixelRatio=Math.min(2,globalThis.devicePixelRatio||1)}={}){
 const canvas=document.createElement('canvas');canvas.className='wrath-canvas';canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Alex, Al Pacino and Emily waving');
 container.append(canvas);
 const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'low-power'});
 renderer.setPixelRatio(pixelRatio);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 const scene=new T.Scene();scene.background=new T.Color(0x140f1f);
 const camera=new T.PerspectiveCamera(CAST_WAVE.fov,16/9,.05,60);camera.position.set(...CAST_WAVE.eye);camera.lookAt(...CAST_WAVE.aim);
 const hemi=new T.HemisphereLight(0xfff1dc,0x3a2c4a,1.0),key=new T.DirectionalLight(0xffe6c4,1.5);
 key.position.set(2.5,5,4.5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-4,right:4,top:4,bottom:-4,near:.5,far:16});key.shadow.bias=-.0012;key.shadow.normalBias=.015;
 const rim=new T.PointLight(0xff7ad9,14,9,2);rim.position.set(-2.6,2.2,-1.2);
 scene.add(hemi,key,key.target,rim);
 // Premiere dressing: a dark floor, a red carpet and a curtain wall.
 const box=(pos,size,color,extra={})=>{const m=new T.Mesh(new T.BoxGeometry(...size),new T.MeshStandardMaterial({color,roughness:.9,...extra}));m.position.set(...pos);m.receiveShadow=true;scene.add(m);return m;};
 box([0,-.05,0],[14,.1,10],0x241b30);box([0,.006,.6],[4.2,.012,6],0x9d1b2c);
 for(let i=-8;i<=8;i++)box([i*.5,1.7,-1.9-(i%2?0:.07)],[.5,3.6,.1],i%2?0x5a1020:0x4a0c1b);
 for(const x of [-2.35,2.35]){box([x,.5,1.4],[.07,1,.07],0xc9a24b,{metalness:.7,roughness:.35});box([x,1.02,1.4],[.14,.06,.14],0xc9a24b,{metalness:.7,roughness:.35});}
 // Cast.
 const cast=buildBeverlyGuests(T,scene,{},{});
 for(const extra of [cast.panMan,cast.hotChick])extra.group.visible=false;
 const actors=CAST_WAVE.places.map(([name,x,turn])=>{
  const guest=cast[name];
  Object.assign(guest,{scripted:true,wandering:false,moving:false,running:false,waving:true,speech:null,expression:'happy'});
  guest.group.visible=true;guest.group.position.set(x,0,0);guest.group.rotation.set(0,turn,0);
  guest.group.traverse(o=>{if(o.isMesh)o.castShadow=true;});
  return {guest,x,turn};
 });
 let width=0,height=0,frame=0,last=0;
 function resize(){
  const w=container.clientWidth,h=container.clientHeight;if(!w||!h||(w===width&&h===height))return;
  width=w;height=h;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
 }
 function render(dt){
  resize();camera.updateMatrixWorld(true);
  cast.update(dt,camera,{});
  // The builders' own routines may nudge a guest; keep everyone on their mark.
  for(const {guest,x,turn} of actors){guest.group.position.set(x,0,0);guest.group.rotation.set(0,turn,0);guest.waving=true;guest.speech=null;}
  renderer.render(scene,camera);
 }
 function start(){
  cancelAnimationFrame(frame);last=performance.now();
  const tick=now=>{frame=requestAnimationFrame(tick);const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;render(dt);};
  frame=requestAnimationFrame(tick);
 }
 function dispose(){
  cancelAnimationFrame(frame);
  scene.traverse(o=>{if(!o.isMesh)return;o.geometry.dispose();for(const m of [].concat(o.material)){m.map?.dispose();m.dispose();}});
  renderer.dispose();renderer.forceContextLoss?.();canvas.remove();
 }
 return {start,render,dispose,canvas,cast,actors,camera,scene,renderer};
}

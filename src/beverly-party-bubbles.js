import {world,LEVELS} from './beverly-layout.js';

export function buildPatioBubbles(T,root,groups,materials){
 const group=new T.Group();group.name='Floating_patio_bubbles';group.userData={dynamic:true,lighting:'Soft champagne, lavender and blue soap-bubble glow',motion:'Gentle drift and volume-preserving flex'};
 root.add(group);groups.Floating_patio_bubbles=group;
 const shell=new T.MeshPhysicalMaterial({name:'Translucent iridescent bubble film',color:0xc7e7ea,metalness:0,roughness:.12,transparent:true,opacity:.12,depthWrite:false,iridescence:1,iridescenceIOR:1.3,clearcoat:1,emissive:0x466778,emissiveIntensity:.2});
 // Fresnel opacity makes a transparent center and a visible soap-film edge.
 // The same material exports as a portable translucent, iridescent PBR shell.
 shell.onBeforeCompile=shader=>{
  shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`#include <opaque_fragment>
   float bubbleEdge = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 2.4);
   vec3 soapTint = mix(vec3(0.43, 0.79, 0.87), vec3(0.87, 0.62, 0.90), 0.5 + 0.5 * sin(normal.y * 9.0 + normal.x * 4.0));
   gl_FragColor.rgb += soapTint * bubbleEdge * 0.75;
   gl_FragColor.a = 0.015 + bubbleEdge * 0.45;`);
 };shell.customProgramCacheKey=()=> 'beverly-soap-film-1';materials[shell.name]=shell;
 const highlight=new T.MeshBasicMaterial({name:'Bubble pearl reflections',color:0xfff0d7,transparent:true,opacity:.78,depthWrite:false});materials[highlight.name]=highlight;
 const pearl=new T.MeshBasicMaterial({name:'Bubble cool reflections',color:0xc5ddfa,transparent:true,opacity:.28,depthWrite:false});materials[pearl.name]=pearl;
 const sphere=new T.SphereGeometry(1,32,24),bubbles=[],lights=[];
 const placement=[
  [849,491,4.7,.35],[866,513,5.6,.50],[896,493,4.2,.31],[931,492,5.0,.43],
  [953,519,4.1,.28],[874,550,4.1,.41],[914,547,6.0,.55],[946,568,4.8,.36],
  [849,580,5.1,.33],[878,606,6.0,.53],[917,587,4.6,.32],[953,613,5.7,.47],
  [850,642,4.6,.44],[885,654,5.5,.32],[924,636,4.0,.39],[949,657,5.4,.46],
  [862,697,5.3,.31],[894,711,4.2,.38],[925,694,5.9,.54],[953,716,4.7,.29]
 ];
 for(const [i,[u,v,h,r]] of placement.entries()){
  const g=new T.Group();g.name='Floating soap bubble '+(i+1);g.position.set(...world(u,v,LEVELS.house+h));g.scale.setScalar(r);group.add(g);
  const film=new T.Mesh(sphere,shell);film.name='Transparent soap film';film.renderOrder=2;g.add(film);
  const reflections=new T.Group();reflections.name='Soft bubble reflections';g.add(reflections);
  for(const [x,y,z,sx,sy] of [[-.44,.72,.56,.115,.055],[.58,-.55,.63,.077,.036]]){
   const glint=new T.Mesh(new T.SphereGeometry(1,12,8),highlight);glint.name='Pearl reflection patch';glint.position.set(x,y,z);glint.scale.set(sx,sy,.012);glint.rotation.z=.35;glint.renderOrder=3;reflections.add(glint);
  }
  for(const [start,span,radius,m] of [[.55,.58,.87,highlight],[3.65,.36,.91,pearl]]){
   const pts=Array.from({length:17},(_,j)=>{const a=start+j/16*span;return new T.Vector3(Math.cos(a)*radius,Math.sin(a)*radius,Math.sqrt(1-radius*radius)+.012);});
   const arc=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),24,.014,5,false),m);arc.name='Curved window glint';reflections.add(arc);
  }
  const entry={group:g,film,reflections,base:g.position.clone(),radius:r,phase:i*2.399,light:null};
  if([0,4,7,12,15,18].includes(i)){
   const light=new T.PointLight([0xffe1b5,0xc8bffc,0xbadfe7][i%3],9,10,2);light.name='Soft bubble light '+(i+1);light.position.copy(g.position);group.add(light);lights.push(light);entry.light=light;
  }
  bubbles.push(entry);
 }
 let elapsed=0,night=true;
 function setNight(value){night=value;for(const b of bubbles)if(b.light)b.light.intensity=night?9:1;}
 function update(dt,camera){
  elapsed+=dt;
  for(const b of bubbles){
   const t=elapsed*.32+b.phase,sx=1+.019*Math.sin(t*1.13),sy=1+.023*Math.sin(t*.91+1.2);
   b.group.position.copy(b.base).add(new T.Vector3(.13*Math.sin(t),.09*Math.cos(t*.8),.11*Math.sin(t*.7+1)));
   b.group.scale.set(b.radius*sx,b.radius*sy,b.radius/(sx*sy));
   if(camera)b.reflections.lookAt(camera.position);
   if(b.light){b.light.position.copy(b.group.position);b.light.intensity=(night?9:1)*(1+.065*Math.sin(t*.8));}
  }
 }
 return {group,bubbles,lights,update,setNight};
}

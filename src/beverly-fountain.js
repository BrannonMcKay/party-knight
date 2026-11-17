import {world,PATIO_FOUNTAIN} from './beverly-layout.js';

// An excavated well and recirculating display; beverly-fountain-story stages its actors.
export function buildPatioFountain(T,root,groups,materials){
 const f=PATIO_FOUNTAIN,origin=new T.Vector3(...world(f.u,f.v));
 const structure=new T.Group();structure.name='Deep upper patio fountain';structure.position.copy(origin);groups.Terraces.add(structure);
 const water=new T.Group();water.name='Patio_fountain_water';water.position.copy(origin);water.userData.dynamic=true;root.add(water);groups.Patio_fountain_water=water;
 const cream=materials['Ivory architectural trim'],stone=materials['Warm limestone paving'];
 const makeMat=(name,options)=>materials[name]=new T.MeshStandardMaterial({name,...options});
 const lining=makeMat('Fountain teal tile lining',{color:0x467e81,roughness:.55,side:T.DoubleSide});
 const bedMat=makeMat('Deep fountain tile bed',{color:0x285357,roughness:.56});
 const grout=makeMat('Fountain submerged tile joints',{color:0x82a29d,roughness:.8});
 function mesh(group,name,geometry,material){const m=new T.Mesh(geometry,material);m.name=name;m.castShadow=group===structure;m.receiveShadow=true;group.add(m);return m;}
 function lathe(name,profile,material=cream){const geo=new T.LatheGeometry(profile.map(p=>new T.Vector2(...p)),64);geo.normalizeNormals();return mesh(structure,name,geo,material);}
 function disk(group,name,r,y,material){const geo=new T.CircleGeometry(r,64);geo.rotateX(-Math.PI/2);const p=geo.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,0);const m=mesh(group,name,geo,material);m.position.y=y;return m;}
 function ring(group,name,r,y,tube,material){const m=mesh(group,name,new T.TorusGeometry(r,tube,5,64),material);m.rotation.x=-Math.PI/2;m.position.y=y;return m;}
 // Closed annular masonry leaves the interior hollow all the way to the bed.
 lathe('Fountain basin masonry and broad coping',[[2.38,f.bed-.18],[2.38,8.48],[f.outerRadius,8.54],[f.outerRadius,f.rim],[f.innerRadius,f.rim],[f.innerRadius,f.bed],[2.38,f.bed-.18]]);
 lathe('Fountain inner tiled well',[[f.innerRadius-.006,8.51],[f.innerRadius-.006,f.bed]],lining);
 disk(structure,'Deep fountain bed',f.innerRadius,f.bed,bedMat);
 // Tile joints and a submerged plinth give readable depth below the waterline.
 for(let y=f.bed+.28;y<8.49;y+=.28)ring(structure,'Fountain tile course',f.innerRadius-.012,y,.007,grout);
 for(const r of [.7,1.2,1.7,2.08])ring(structure,'Fountain bed tile joint',r,f.bed+.006,.006,grout);
 lathe('Fountain anchored pedestal',[[0,f.bed],[.53,f.bed],[.53,f.bed+.2],[.32,f.bed+.32],[.25,8.75],[.32,9.04],[.27,9.2],[0,9.2]],stone);
 lathe('Fountain lower hollow bowl',[[.24,9.02],[.5,9.1],[.83,9.3],[1.04,9.57],[1.08,9.65],[1.08,9.71],[.98,9.71],[.93,9.58],[.7,9.4],[.24,9.26]],cream);
 lathe('Fountain upper pedestal',[[0,9.26],[.19,9.26],[.16,10.12],[0,10.12]],stone);
 lathe('Fountain upper hollow bowl',[[.15,10.07],[.34,10.17],[.53,10.37],[.56,10.45],[.56,10.49],[.48,10.49],[.43,10.35],[.15,10.22]],cream);
 lathe('Fountain brass nozzle',[[0,10.24],[.065,10.24],[.065,10.61],[0,10.61]],materials['Brass detail']);
 const time={value:0};
 function waterMaterial(name,jet=false){
  const m=makeMat(name,{color:jet?0xb3e1df:0x418f96,roughness:jet?.2:.16,metalness:.12,transparent:true,opacity:jet?.76:.57,side:T.DoubleSide,depthWrite:false});
  m.onBeforeCompile=shader=>{
   shader.uniforms.fountainTime=time;
   shader.vertexShader='varying vec2 vFountainUv;\n'+shader.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\nvFountainUv=uv;');
   shader.fragmentShader='uniform float fountainTime; varying vec2 vFountainUv;\n'+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    float ripple=${jet?'sin(vFountainUv.x*105.0-fountainTime*15.0)':'sin(length(vFountainUv-0.5)*100.0-fountainTime*3.0)'};
    diffuseColor.rgb=mix(diffuseColor.rgb,vec3(0.83,0.97,0.96),pow(max(0.0,ripple),8.0)*${jet?'0.45':'0.12'});
   `);
  };
  m.customProgramCacheKey=()=>`beverly-fountain-${jet}-1`;return m;
 }
 const surfaceMat=waterMaterial('Deep fountain rippling water'),jetMat=waterMaterial('Running fountain jets',true);
 const zone={...f,type:'deep-water',shape:'circle',radius:f.innerRadius,depth:f.surface-f.bed,flow:'Local recirculation through tiered fountain bowls',terminal:true,futureScene:'Active third story scene: choreographed falls, happy faces with three-second drowning countdowns, floating bodies and spirits'};
 const surface=disk(water,'Deep patio fountain water surface',f.innerRadius,f.surface,surfaceMat);surface.userData.waterRegion=zone;surface.renderOrder=3;
 disk(water,'Lower bowl water',1.045,9.695,surfaceMat).renderOrder=3;
 disk(water,'Upper bowl water',.525,10.478,surfaceMat).renderOrder=3;
 const jets=[],ripples=[];
 function jet(name,points,radius,landingY){
  const curve=new T.QuadraticBezierCurve3(...points.map(p=>new T.Vector3(...p)));
  const m=mesh(water,name,new T.TubeGeometry(curve,28,radius,6,false),jetMat);m.castShadow=false;m.renderOrder=4;
  jets.push({curve,landingY});
 }
 jet('Central rising fountain jet',[[0,10.61,0],[.06,11.63,0],[.25,10.485,0]],.034,10.478);
 for(let i=0;i<4;i++){
  const a=i*Math.PI/2+.2,c=Math.cos(a),z=Math.sin(a);
  jet('Upper bowl spill into lower bowl',[[.51*c,10.485,.51*z],[.82*c,10.4,.82*z],[.92*c,9.70,.92*z]],.024,9.695);
 }
 const foam=makeMat('Fountain splash rings',{color:0xd1ece7,roughness:.36,transparent:true,opacity:.36,depthWrite:false});
 for(let i=0;i<8;i++){
  const a=i*Math.PI/4+.18,c=Math.cos(a),z=Math.sin(a);
  jet('Lower bowl spill into deep basin',[[1.045*c,9.699,1.045*z],[1.46*c,9.56,1.46*z],[1.61*c,f.surface+.018,1.61*z]],.028,f.surface);
  for(let j=0;j<2;j++){
   const ripple=ring(water,'Expanding fountain splash ripple',.22,f.surface+.023,.009,foam);ripple.position.x=1.61*c;ripple.position.z=1.61*z;ripple.renderOrder=5;
   ripples.push({mesh:ripple,offset:i*.119+j*.5});
  }
 }
 // Tiny traveling highlights break up the smooth stream silhouettes.
 const droplets=[];
 const dropGeo=new T.SphereGeometry(.032,6,4);
 for(const [i,j] of jets.entries())for(let k=0;k<3;k++){
  const m=mesh(water,'Moving fountain droplet',dropGeo,jetMat);m.castShadow=false;m.renderOrder=4;droplets.push({mesh:m,curve:j.curve,offset:k/3+i*.071});
 }
 root.userData.waterRegions.push(zone);
 root.userData.patioFountain={...zone,dimensionsAre:'Authored design estimates; not measured',previousOuterDiameter:4.3};
 function update(dt){time.value+=dt;for(const d of droplets){const t=(time.value*.66+d.offset)%1;d.mesh.position.copy(d.curve.getPoint(t));d.mesh.scale.set(1,1.6,1);}for(const r of ripples){const t=(time.value*.7+r.offset)%1;r.mesh.scale.setScalar(.2+t);}}
 update(0);return {structure,water,zone,surface,jets,time,update};
}

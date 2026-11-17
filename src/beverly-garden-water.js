import {world,s,GARDEN_BASINS,GARDEN_CASCADES,MAIN_POOL,FUTURE_WATER_RULES} from './beverly-layout.js';

// Authored water regions. Christel can traverse the lower garden maze;
// unscripted crowd drowning is a separate, later gameplay pass.
export function buildGardenWater(T,root,groups,materials){
 const group=new T.Group();group.name='Garden_water';group.userData.dynamic=true;
 group.userData.flow='upper terrace to middle terrace to lower catch basin to main pool';
 group.userData.futureGameplay=FUTURE_WATER_RULES;root.add(group);groups.Garden_water=group;
 const time={value:0};
 function material(name,fall=false,foam=false){
  const m=new T.MeshStandardMaterial({name,color:foam?0xe1f4ee:fall?0x67bac0:0x36979f,roughness:fall?.3:.21,metalness:.12,transparent:true,opacity:foam?.65:fall?.87:.83,side:T.DoubleSide,depthWrite:!foam});
  m.onBeforeCompile=shader=>{
   shader.uniforms.gardenTime=time;
   shader.vertexShader='varying vec2 vGardenUv;\n'+shader.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\nvGardenUv=uv;');
   shader.fragmentShader='uniform float gardenTime; varying vec2 vGardenUv;\n'+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    float travel=vGardenUv.x*${fall?'13.0':'5.0'}-gardenTime*${fall?'9.0':'1.4'};
    float streak=pow(max(0.0,sin(travel+sin(vGardenUv.y*23.0)*1.5)),${fall?'5.0':'18.0'});
    float crossWave=sin(vGardenUv.y*31.0+vGardenUv.x*1.7-gardenTime*1.1);
    diffuseColor.rgb=mix(diffuseColor.rgb,vec3(0.85,0.96,0.95),streak*${foam?'0.6':fall?'0.65':'0.16'});
    diffuseColor.rgb*=0.95+0.05*crossWave;
    ${foam?'diffuseColor.a*=smoothstep(0.0,0.18,vGardenUv.y)*(1.0-smoothstep(0.82,1.0,vGardenUv.y))*(0.4+0.6*streak);':''}
   `);
  };
  m.customProgramCacheKey=()=>`beverly-garden-water-${fall}-${foam}-1`;
  materials[name]=m;return m;
 }
 const calm=material('Flowing terrace water'),falls=material('Stepped waterfall water',true),foam=material('Waterfall landing foam',true,true);
 // The terminal swimming pool collects the cascade water. Keep its broad
 // surface still; only the local inlet retains moving foam from the spillway.
 const poolWater=new T.MeshStandardMaterial({name:'Still main pool water',color:0x36979f,roughness:.21,metalness:.12,transparent:true,opacity:.55,side:T.DoubleSide});
 materials[poolWater.name]=poolWater;
 function mesh(name,geo,mat,metadata={}){
  const m=new T.Mesh(geo,mat);m.name=name;m.receiveShadow=true;m.castShadow=false;m.renderOrder=mat===foam?4:3;m.userData=metadata;group.add(m);return m;
 }
 // UV.x follows actual distance along the channel and down each vertical riser.
 function sheet(name,profile,v1,v2,mat,metadata={}){
  const p=[],uv=[],indices=[];let distance=0;
  for(let i=0;i<profile.length;i++){
   const [u,y]=profile[i];if(i)distance+=Math.hypot((u-profile[i-1][0])*s,y-profile[i-1][1]);
   for(const [v,cross] of [[v1,0],[v2,1]]){p.push(...world(u,v,y));uv.push(distance,cross);}
   if(i<profile.length-1){const k=2*i;indices.push(k,k+1,k+2,k+1,k+3,k+2);}
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();
  return mesh(name,g,mat,{...metadata,profile,flowDirection:[1,0,0]});
 }
 const zones=[],surfaces=[],cascadeProfiles=[];
 for(const basin of GARDEN_BASINS){
  const zone={...basin,type:'shallow-water',depth:basin.surface-basin.bed,futureTraversal:'wade',downstream:basin===GARDEN_BASINS[2]?MAIN_POOL.id:GARDEN_CASCADES[GARDEN_BASINS.indexOf(basin)].id};zones.push(zone);
  surfaces.push(sheet(basin.id,[[basin.u1,basin.surface],[basin.u2,basin.surface]],basin.v1,basin.v2,calm,{waterRegion:zone}));
 }
 for(const cascade of GARDEN_CASCADES){
  const profile=[[cascade.u1,cascade.from]],drop=(cascade.from-cascade.to)/cascade.steps;
  for(let i=1;i<=cascade.steps;i++){
   const u=cascade.u1+(cascade.u2-cascade.u1)*i/cascade.steps,top=cascade.from-drop*(i-1),bottom=cascade.from-drop*i;
   profile.push([u,top],[u,bottom]);
   sheet(cascade.id+' landing foam '+i,[[u,bottom+.018],[u+3.1,bottom+.018]],586.3,615.7,foam);
  }
  cascadeProfiles.push(profile);
  surfaces.push(sheet(cascade.id,profile,586,616,falls,{from:cascade.from,to:cascade.to,downstream: cascade===GARDEN_CASCADES[0]?GARDEN_BASINS[1].id:GARDEN_BASINS[2].id}));
 }
 // A notch through the coping gives the final outflow a physical opening.
 const outlet=[[1343,2.04],[1361,2.04],[1361,MAIN_POOL.surface],[1365,MAIN_POOL.surface]];
 surfaces.push(sheet('Final spill into main pool',outlet,586,616,falls,{downstream:MAIN_POOL.id}));
 sheet('Pool inlet foam',[[1361,MAIN_POOL.surface+.018],[1373,MAIN_POOL.surface+.018]],583,619,foam);
 const shape=new T.Shape(MAIN_POOL.polygon.map(([u,v])=>new T.Vector2((u-820)*s,-(v-600)*s)));
 const poolGeometry=new T.ShapeGeometry(shape);poolGeometry.rotateX(-Math.PI/2);poolGeometry.translate(0,MAIN_POOL.surface,0);
 const pos=poolGeometry.attributes.position,poolUvs=poolGeometry.attributes.uv;
 for(let i=0;i<pos.count;i++)poolUvs.setXY(i,(pos.getX(i)-world(1359,601)[0])*.4,(pos.getZ(i)-world(1359,539)[2])/((663-539)*s));
 const poolZone={...MAIN_POOL,type:'deep-water',depth:MAIN_POOL.surface-MAIN_POOL.bed,futureTraversal:'slow swim',terminal:true};zones.push(poolZone);
 surfaces.push(mesh('Main pool receiving terrace water',poolGeometry,poolWater,{waterRegion:poolZone}));
 root.userData.waterRegions=zones;
 return {group,zones,surfaces,cascadeProfiles,outlet,time,update(dt){time.value+=dt;}};
}

// Procedural surface detail for the estate's flat-colour materials.
// The batched scenery has no UVs, so every pattern is projected from world
// position. One small tiling noise texture feeds all of them, and each pattern
// fades with its own on-screen footprint so thin joints never shimmer in motion.

export const SURFACE_KINDS={stucco:0,paving:1,roofTile:2,timber:3,mosaic:4,foliage:5,ground:6,asphalt:7,bark:8};

// Material name -> [kind, strength]. Strength scales colour variation and relief.
export const ESTATE_SURFACES={
 'Peach lime stucco':['stucco',1],'Ivory architectural trim':['stucco',.55],'Red fireplace room':['stucco',.8],'Vaulted cream plaster':['stucco',.5],
 'Warm limestone paving':['paving',1],
 'Terracotta roof and coping':['roofTile',1],'Terracotta variation':['roofTile',.7],
 'Dark timber':['timber',1],'Parquet wood':['timber',1],'Dark room aged timber':['timber',.9],'Dark room panel relief':['timber',.7],
 'Pool tile':['mosaic',1],'Terracotta gallery paving':['stucco',.9],
 'Clipped hedges':['foliage',1],'Tree foliage':['foliage',1],
 'Lawn':['ground',1],'Hillside earth':['ground',1],
 'Street asphalt':['asphalt',1],'Tree bark':['bark',1]
};

function lattice(size,seed){
 const values=new Float32Array(size*size);let state=seed>>>0;
 for(let i=0;i<values.length;i++){state=(Math.imul(state,1664525)+1013904223)>>>0;values[i]=state/4294967296;}
 return values;
}
// Periodic value noise: the lattice wraps, so the texture tiles without a seam.
function tileable(size,cells,seed){
 const grid=lattice(cells,seed),out=new Float32Array(size*size);
 for(let y=0;y<size;y++){
  const gy=y/size*cells,y0=Math.floor(gy),fy=gy-y0,sy=fy*fy*(3-2*fy),r0=(y0%cells)*cells,r1=((y0+1)%cells)*cells;
  for(let x=0;x<size;x++){
   const gx=x/size*cells,x0=Math.floor(gx),fx=gx-x0,sx=fx*fx*(3-2*fx),c0=x0%cells,c1=(x0+1)%cells;
   const top=grid[r0+c0]+(grid[r0+c1]-grid[r0+c0])*sx,bottom=grid[r1+c0]+(grid[r1+c1]-grid[r1+c0])*sx;
   out[y*size+x]=top+(bottom-top)*sy;
  }
 }
 return out;
}
function fbm(size,cells,octaves,seed){
 const out=new Float32Array(size*size);let amplitude=1,total=0;
 for(let o=0;o<octaves;o++){const layer=tileable(size,cells<<o,seed+o*977);for(let i=0;i<out.length;i++)out[i]+=layer[i]*amplitude;total+=amplitude;amplitude*=.5;}
 for(let i=0;i<out.length;i++)out[i]/=total;
 return out;
}

// R: fine grain · G: mid-scale mottling · B: broad clouds · A: stringy fibre.
export function createSurfaceNoise(T,{size=256,anisotropy=4}={}){
 const fine=fbm(size,32,3,11),mid=fbm(size,8,4,23),broad=fbm(size,3,3,37),fibre=fbm(size,64,2,53);
 const data=new Uint8Array(size*size*4);
 const stretch=(v,gain)=>Math.max(0,Math.min(255,Math.round(((v-.5)*gain+.5)*255)));
 for(let i=0;i<size*size;i++){data[i*4]=stretch(fine[i],2.4);data[i*4+1]=stretch(mid[i],2.2);data[i*4+2]=stretch(broad[i],2.2);data[i*4+3]=stretch(fibre[i],2.6);}
 const texture=new T.DataTexture(data,size,size,T.RGBAFormat);
 texture.name='Estate surface noise';texture.wrapS=texture.wrapT=T.RepeatWrapping;
 texture.magFilter=T.LinearFilter;texture.minFilter=T.LinearMipmapLinearFilter;texture.generateMipmaps=true;
 texture.anisotropy=anisotropy;texture.colorSpace=T.NoColorSpace;texture.needsUpdate=true;
 return texture;
}

const VERTEX_HEAD='varying vec3 vSurfPos;\nvarying vec3 vSurfNormal;\n';
const FRAGMENT_HEAD=`
uniform sampler2D surfNoise;
uniform float surfStrength;
varying vec3 vSurfPos;
varying vec3 vSurfNormal;
float surfHash(vec2 p){p=fract(p*vec2(.1031,.1030));p+=dot(p,p.yx+33.33);return fract((p.x+p.y)*p.y);}
// x: colour multiplier, y: relief height (metres), z: roughness offset.
vec3 surfDetail(vec3 p,vec3 n,out vec3 tint){
 tint=vec3(1.0);
 vec3 a=abs(n);
#if SURF_KIND>=5
 // Organic surfaces: a sheared projection has no seams on round canopies.
 vec2 uv=p.xz+p.y*vec2(.37,.61);
#else
 vec2 uv=a.y>=a.x&&a.y>=a.z?p.xz:(a.x>=a.z?p.zy:p.xy);
#endif
 float px=max(max(fwidth(uv.x),fwidth(uv.y)),1e-5); // metres covered by one pixel
#if SURF_KIND==0
 vec4 broad=texture2D(surfNoise,uv*.11),grain=texture2D(surfNoise,uv*1.7);
 float trowel=texture2D(surfNoise,uv*vec2(.45,.2)).g;
 float c=1.0+surfStrength*(.24*(broad.b-.5)+.16*(trowel-.5)+.10*(grain.r-.5));
 return vec3(c,surfStrength*(.0012*grain.g+.005*trowel),.08*(grain.g-.5));
#elif SURF_KIND==1
 // Running-bond limestone flags with recessed joints and a tone per flag.
 const vec2 flag=vec2(1.2,.8);
 vec2 q=uv/flag;q.x+=.5*mod(floor(q.y),2.0);
 vec2 cell=floor(q),f=fract(q);
 vec2 edge=min(f,1.0-f)*flag;
 float aa=px*1.5,width=.011;
 float joint=1.0-smoothstep(width-aa,width+aa,min(edge.x,edge.y));
 float visible=1.0-smoothstep(.03,.14,px); // joints dissolve before they alias
 joint*=visible;
 float tone=surfHash(cell)-.5;
 vec4 grain=texture2D(surfNoise,uv*.9),broad=texture2D(surfNoise,uv*.07);
 float c=1.0+surfStrength*(.13*tone*visible+.20*(broad.b-.5)+.12*(grain.g-.5)+.06*(grain.r-.5));
 c*=1.0-.42*joint;
 tint=mix(vec3(1.0),vec3(1.04,.99,.93),clamp(tone+.5,0.0,1.0)*visible*surfStrength);
 return vec3(c,surfStrength*(.0012*grain.g-.008*joint),.10*(grain.g-.5)+.2*joint);
#elif SURF_KIND==2
 // Barrel tiles: rounded channels running down the slope, lapped in courses.
 float along=a.y>=a.x&&a.y>=a.z?p.x:p.y,across=a.y>=a.x&&a.y>=a.z?p.z:(a.x>=a.z?p.z:p.x);
 float chan=across/.26,course=along/.44;
 float visible=1.0-smoothstep(.02,.09,px);
 float barrel=abs(sin(3.14159*chan));
 float lap=smoothstep(.0,.12,fract(course));
 float tone=surfHash(vec2(floor(chan),floor(course)))-.5;
 vec4 grain=texture2D(surfNoise,uv*1.3),broad=texture2D(surfNoise,uv*.09);
 float c=1.0+surfStrength*(visible*(.26*(barrel-.6)+.18*tone-.22*(1.0-lap))+.2*(broad.b-.5)+.08*(grain.r-.5));
 tint=mix(vec3(1.0),vec3(1.06,.97,.9),clamp(tone+.5,0.0,1.0)*visible*surfStrength);
 return vec3(c,surfStrength*visible*(.012*barrel+.006*lap),.1*(grain.g-.5));
#elif SURF_KIND==3
 // Boards along the longer horizontal run, with stretched grain.
 vec2 g=a.y>=a.x&&a.y>=a.z?uv:uv.yx;
 float board=g.y/.16;
 float visible=1.0-smoothstep(.012,.06,px);
 float f=fract(board),seam=(1.0-smoothstep(.0,.05+px*4.0,min(f,1.0-f)))*visible;
 float tone=surfHash(vec2(floor(board),3.0))-.5;
 float grain=texture2D(surfNoise,vec2(g.x*.35+tone*7.0,g.y*5.0)).a;
 float broad=texture2D(surfNoise,uv*.2).b;
 float c=1.0+surfStrength*(.28*(grain-.5)+.22*tone*visible+.16*(broad-.5));
 c*=1.0-.4*seam;
 return vec3(c,surfStrength*(.001*grain-.004*seam),.14*(grain-.5));
#elif SURF_KIND==4
 // Small glazed pool mosaic with pale grout.
 vec2 q=uv/.22,f=fract(q);
 vec2 edge=min(f,1.0-f)*.22;
 float aa=px*1.5;
 float visible=1.0-smoothstep(.012,.06,px);
 float grout=(1.0-smoothstep(.008-aa,.008+aa,min(edge.x,edge.y)))*visible;
 float tone=surfHash(floor(q))-.5;
 float broad=texture2D(surfNoise,uv*.13).b;
 float c=1.0+surfStrength*(.22*tone*visible+.18*(broad-.5));
 c=mix(c,1.25,grout*.55);
 return vec3(c,-.004*grout*surfStrength,.25*grout-.05);
#elif SURF_KIND==5
 // Leaf clumps: two scales of mottling and a strong relief so lamps rake it.
 vec4 clump=texture2D(surfNoise,uv*.33),leaf=texture2D(surfNoise,uv*1.9);
 float c=1.0+surfStrength*(.5*(clump.g-.5)+.3*(leaf.g-.5));
 tint=mix(vec3(.94,1.0,.9),vec3(1.1,1.04,.84),clump.b);
 return vec3(c,surfStrength*(.02*clump.g+.004*leaf.g),.1*(leaf.g-.5));
#elif SURF_KIND==6
 vec4 area=texture2D(surfNoise,uv*.06),blade=texture2D(surfNoise,uv*1.4),mid=texture2D(surfNoise,uv*.31);
 float c=1.0+surfStrength*(.36*(area.b-.5)+.3*(mid.g-.5)+.2*(blade.r-.5));
 tint=mix(vec3(.95,1.0,.92),vec3(1.1,1.03,.82),area.g);
 return vec3(c,surfStrength*.007*mid.g,.08*(blade.g-.5));
#elif SURF_KIND==7
 vec4 grit=texture2D(surfNoise,uv*2.6),area=texture2D(surfNoise,uv*.08);
 float c=1.0+surfStrength*(.3*(grit.r-.5)+.24*(area.b-.5));
 return vec3(c,surfStrength*.0015*grit.g,.15*(grit.g-.5));
#else
 float ridge=texture2D(surfNoise,vec2((p.x+p.z)*2.2,p.y*.22)).a;
 float c=1.0+surfStrength*.6*(ridge-.5);
 return vec3(c,surfStrength*.006*ridge,.1*(ridge-.5));
#endif
}
`;

// Adds world-projected colour variation, roughness breakup and relief to a
// MeshStandardMaterial. Safe to call once per material; clones need their own call.
export function applySurfaceDetail(material,kind,noise,strength=1){
 const id=SURFACE_KINDS[kind];if(id===undefined)throw new Error('Unknown surface kind: '+kind);
 const uniforms={surfNoise:{value:noise},surfStrength:{value:strength}};
 material.userData.surface={kind,strength};
 material.defines={...(material.defines||{}),SURF_KIND:id};
 material.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,uniforms);
  shader.vertexShader=VERTEX_HEAD+shader.vertexShader
   .replace('#include <defaultnormal_vertex>','#include <defaultnormal_vertex>\nvSurfNormal=mat3(modelMatrix)*objectNormal;')
   .replace('#include <project_vertex>','#include <project_vertex>\nvSurfPos=(modelMatrix*vec4(transformed,1.0)).xyz;');
  shader.fragmentShader=FRAGMENT_HEAD+shader.fragmentShader
   .replace('#include <map_fragment>',`#include <map_fragment>
    vec3 surfN=normalize(vSurfNormal);vec3 surfTint;
    vec3 surf=surfDetail(vSurfPos,surfN,surfTint);
    diffuseColor.rgb*=max(surf.x,.2)*surfTint;`)
   .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=clamp(roughnessFactor+surf.z,.08,1.0);')
   .replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
    {
     // Screen-space relief from the height field; fades out as texels shrink.
     vec3 dpdx=dFdx(vSurfPos),dpdy=dFdy(vSurfPos);
     float dhx=dFdx(surf.y),dhy=dFdy(surf.y);
     vec3 nw=gl_FrontFacing?surfN:-surfN;
     vec3 r1=cross(dpdy,nw),r2=cross(nw,dpdx);
     float det=dot(dpdx,r1);
     vec3 grad=sign(det)*(dhx*r1+dhy*r2);
     float keep=1.0-smoothstep(.02,.1,length(dpdx)+length(dpdy));
     vec3 bumped=normalize(abs(det)*nw-grad*keep);
     normal=normalize(mix(normal,normalize((viewMatrix*vec4(bumped,0.0)).xyz),keep));
    }`);
 };
 material.customProgramCacheKey=()=>'estate-surface-'+id;
 material.needsUpdate=true;
 return material;
}

export function applyEstateSurfaces(T,materials,{anisotropy=4,table=ESTATE_SURFACES}={}){
 const noise=createSurfaceNoise(T,{anisotropy});
 const applied=[];
 for(const [name,[kind,strength]] of Object.entries(table)){
  const material=materials[name];if(!material)continue;
  applySurfaceDetail(material,kind,noise,strength);applied.push(name);
 }
 return {noise,applied};
}

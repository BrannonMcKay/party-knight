import {world,s,gardenHeight,GARDEN_BASINS,GARDEN_CASCADES,MAIN_POOL} from './beverly-layout.js';
import {Font} from '../vendor/FontLoader.js';
import fontData from '../vendor/beverly-font.js';
import {buildEmergencyExitSign} from './beverly-exit-sign.js';

// The supplied Baby Maze, adapted to the long garden: nested perimeter runs,
// comb-like side passages, a north-side entrance and opposite-corner finish.
// Passage widths take priority over reproducing the sketch's tight pen spacing.
export const BABY_MAZE=Object.freeze({rows:12,columns:6,u1:1166,u2:1666,v1:524,v2:677,
 entranceU:1124,entranceColumn:4,finishColumn:0,wallWidth:.12,wallHeight:.38,
 submergedClearance:.09,playerRadius:.25,exit:[1674,600,2.2]});
const M=BABY_MAZE,du=(M.u2-M.u1)/M.rows,dv=(M.v2-M.v1)/M.columns;
const uv=(row,column)=>[M.u1+row*du,M.v2-column*dv];
// On the pool's long sides, guide the runner onto paving with room for both
// feet. Leave the outer promenades beyond the maze free for the pool guests.
const center=(r,c)=>{const p=uv(r+.5,c+.5);if(c===0)p[1]+=5;else if(c===M.columns-1)p[1]-=5;return p;};
const id=(r,c)=>r*M.columns+c;
const linkKey=(a,b)=>a<b?`${a}:${b}`:`${b}:${a}`;

export function createMazePlan(){
 const links=new Set(),visited=new Set(),route=[];
 const connect=(a,b)=>{links.add(linkKey(a,b));visited.add(a);visited.add(b);};
 // The drawing closes the outer left lane about two-thirds of the way down.
 // Turn inward before that cross-wall; branch generation must not reopen it.
 const leftStop=linkKey(id(7,0),id(8,0));
 // Both outside lanes run on the pool deck. The winning path follows the
 // paving, swims back through the pool, then returns to dry ground again.
 const bends=[[0,M.entranceColumn],[0,0],[7,0],[7,1],[3,1],[3,5],[8,5],[8,2],[10,2],[10,5],[11,5],[11,M.finishColumn]];
 let [r,c]=bends[0];route.push(id(r,c));visited.add(id(r,c));
 for(const [nr,nc] of bends.slice(1))while(r!==nr||c!==nc){const a=id(r,c);r+=Math.sign(nr-r);c+=Math.sign(nc-c);connect(a,id(r,c));route.push(id(r,c));}
 // Fixed branch seed keeps the layout and exported model identical on replay.
 let seed=20260921;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 function grow(cell,previousDirection=-1){
  const row=Math.floor(cell/M.columns),column=cell%M.columns;
  const choices=[[1,0],[-1,0],[0,1],[0,-1]].map(([dr,dc],direction)=>({r:row+dr,c:column+dc,direction,rank:random()+(direction===previousDirection?1.3:0)})).sort((a,b)=>b.rank-a.rank);
  for(const next of choices){if(next.r<0||next.r>=M.rows||next.c<0||next.c>=M.columns)continue;const n=id(next.r,next.c);if(visited.has(n)||linkKey(cell,n)===leftStop)continue;connect(cell,n);grow(n,next.direction);}
 }
 for(const cell of route)grow(cell);
 const walls=[];
 const wall=(a,b,kind='maze')=>walls.push({a,b,kind});
 for(let row=0;row<=M.rows;row++)for(let col=0;col<M.columns;col++){
  if(row===0&&col===M.entranceColumn||row===M.rows&&col===M.finishColumn)continue;
  if(row>0&&row<M.rows&&links.has(linkKey(id(row-1,col),id(row,col))))continue;
  wall(uv(row,col),uv(row,col+1));
 }
 for(let col=0;col<=M.columns;col++)for(let row=0;row<M.rows;row++){
  if(col>0&&col<M.columns&&links.has(linkKey(id(row,col-1),id(row,col))))continue;
  wall(uv(row,col),uv(row+1,col));
 }
 const top=uv(0,M.entranceColumn),bottom=uv(0,M.entranceColumn+1),entryV=(top[1]+bottom[1])/2;
 for(const edge of [top,bottom])wall([M.entranceU,edge[1]],edge,'entrance');
 // This transverse rail seals both old stair approaches. Only the north stair
 // throat is open; the first Hot Chick scene stays entirely uphill of this rail.
 wall([M.entranceU,398],[M.entranceU,bottom[1]],'entry-barrier');
 wall([M.entranceU,top[1]],[M.entranceU,810],'entry-barrier');
 const cells=Array.from({length:M.rows*M.columns},(_,n)=>center(Math.floor(n/M.columns),n%M.columns));
 return {links,walls,cells,route:route.map(n=>cells[n]),entry:[M.entranceU,entryV],
  approach:[[1106,entryV],[M.entranceU,entryV],[1135,entryV],[1165,entryV]],finish:[M.u2,center(M.rows-1,M.finishColumn)[1]]};
}

function distanceToSegment(p,a,b){const x=b[0]-a[0],z=b[1]-a[1],len=x*x+z*z;if(!len)return Math.hypot(p[0]-a[0],p[1]-a[1]);const t=Math.max(0,Math.min(1,((p[0]-a[0])*x+(p[1]-a[1])*z)/len));return Math.hypot(p[0]-a[0]-t*x,p[1]-a[1]-t*z);}
function polygonContains(p,poly){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
export function gardenWaterAt(u,v){
 if(polygonContains([u,v],MAIN_POOL.polygon))return {...MAIN_POOL,edge:Math.min(...MAIN_POOL.polygon.map((a,i)=>distanceToSegment([u,v],a,MAIN_POOL.polygon[(i+1)%MAIN_POOL.polygon.length])))*s};
 if(v<586||v>616)return null;
 const basin=GARDEN_BASINS.find(b=>u>=b.u1&&u<=b.u2);
 if(basin)return {...basin,edge:Math.min(v-586,616-v,u-basin.u1,basin.u2-u)*s};
 const cascade=GARDEN_CASCADES.find(b=>u>=b.u1&&u<=b.u2);
 if(cascade){const surface=gardenHeight(u)-.16;return {id:cascade.id,surface,bed:surface-.14,edge:Math.min(v-586,616-v)*s};}
 if(u>=1343&&u<=1365)return {id:'pool-inlet',surface:2.04,bed:1.8,edge:Math.min(v-586,616-v)*s};
 return null;
}
export function mazeContains(u,v){return u>=M.u1&&u<=M.u2&&v>=M.v1&&v<=M.v2;}
// Match the existing lawn, paving and stairs. Ease the runner into the water
// from any shore, so a deep pool edge cannot become an impassable height step.
export function mazeSurface(u,v){
 if(!mazeContains(u,v))return null;
 const ground=gardenHeight(u),water=gardenWaterAt(u,v);
 if(water){const t=Math.min(1,water.edge/(water.id===MAIN_POOL.id?1.35:.85)),blend=t*t*(3-2*t);return ground+(Math.max(water.bed,water.surface-.82)-ground)*blend;}
 const slope=(u>1280&&u<1315),onStairs=(v>=547&&v<=571)||(v>=630&&v<=654);
 if(slope&&!onStairs){const edge=Math.min(u-1280,1315-u,...[547,571,630,654].map(n=>Math.abs(v-n)))*s;return ground-.32*Math.min(1,edge/.8);}
 return ground;
}

export function buildBeverlyMaze(T,root,groups,materials){
 const layout=createMazePlan(),group=new T.Group();group.name='Baby_maze';root.add(group);groups.Baby_maze=group;
 group.userData={source:'User Baby Maze sketch',layout:'Adapted perimeter runs and branching passages fitted to the lower terraces and pool',...M};
 const stone=new T.MeshStandardMaterial({name:'Baby maze pale stone',color:0xd0be9b,roughness:.91,emissive:0x33413e,emissiveIntensity:.14});materials[stone.name]=stone;
 const wetStone=new T.MeshStandardMaterial({name:'Submerged baby maze stone',color:0xa8d9d1,roughness:.58,emissive:0x4d928a,emissiveIntensity:.26});materials[wetStone.name]=wetStone;
 const positions=[[],[]],indices=[[],[]];
 function block(a,b,wet){
  const index=wet?1:0,p=positions[index],ix=indices[index],offset=p.length/3;
  const aw=gardenWaterAt(...a),bw=gardenWaterAt(...b),height=M.wallHeight;
  const topA=wet?(aw?.surface??gardenHeight(a[0])-.16)-M.submergedClearance:gardenHeight(a[0])+height;
  const topB=wet?(bw?.surface??gardenHeight(b[0])-.16)-M.submergedClearance:gardenHeight(b[0])+height;
  const lowA=wet?(aw?.bed??topA-.2):topA-height-.4,lowB=wet?(bw?.bed??topB-.2):topB-height-.4;
  const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),nx=-dz/len*M.wallWidth/2/s,nz=dx/len*M.wallWidth/2/s;
  for(const [q,top,low] of [[a,topA,lowA],[b,topB,lowB]])for(const y of [low,top])for(const sign of [-1,1])p.push(...world(q[0]+nx*sign,q[1]+nz*sign,y));
  for(const n of [0,1,3,0,3,2,4,6,7,4,7,5,2,3,7,2,7,6,0,4,5,0,5,1,0,2,6,0,6,4,1,5,7,1,7,3])ix.push(offset+n);
 }
 // Sample contours and water edges closely; no flat wall cuts across a stair
 // flight or sticks up out of the swimming pool.
 for(const wall of layout.walls){const count=Math.ceil(Math.hypot(wall.b[0]-wall.a[0],wall.b[1]-wall.a[1])*s/.18);for(let i=0;i<count;i++){
  const at=t=>wall.a.map((n,j)=>n+(wall.b[j]-n)*t),a=at(i/count),b=at((i+1)/count),mid=at((i+.5)/count);block(a,b,!!gardenWaterAt(...mid));
 }}
 for(let i=0;i<2;i++){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions[i],3));geo.setIndex(indices[i]);const flat=geo.toNonIndexed();flat.computeVertexNormals();geo.dispose();const mesh=new T.Mesh(flat,i?wetStone:stone);mesh.name=i?'Submerged maze walls':'Low contour-following maze walls';mesh.castShadow=!i;mesh.receiveShadow=true;group.add(mesh);}
 const font=new Font(fontData),ink=new T.MeshStandardMaterial({name:'Maze ground lettering',color:0xe9d4a3,emissive:0x5a4023,emissiveIntensity:.22,roughness:1,polygonOffset:true,polygonOffsetFactor:-2});
 function paint(text,u,v,size,angle=0){const geo=new T.ShapeGeometry(font.generateShapes(text,size));geo.computeBoundingBox();geo.translate(-(geo.boundingBox.max.x+geo.boundingBox.min.x)/2,0,0);geo.rotateX(-Math.PI/2);const mesh=new T.Mesh(geo,ink);mesh.name='Ground paint: '+text;mesh.position.set(...world(u,v,gardenHeight(u)+.014));mesh.rotation.y=angle;group.add(mesh);}
 paint('BABY MAZE',1107,layout.entry[1],.25,-Math.PI/2);paint('Start',1117,layout.entry[1],.14,-Math.PI/2);paint('Finish',1672,667,.17,-Math.PI/2);
 const exitSign=buildEmergencyExitSign(T,group,materials);
 const worldWalls=layout.walls.map(w=>({a:world(...w.a),b:world(...w.b)}));
 function blocks(a,b,radius=M.playerRadius){
  // Low/submerged walls still have a solid footprint. Capsule sweep checks the
  // full movement segment, including corners and sprint-length frame steps.
  const start=[a.x,a.z],end=[b.x,b.z],limit=radius+M.wallWidth/2;
  for(const w of worldWalls){const c=[w.a[0],w.a[2]],d=[w.b[0],w.b[2]];
   if(Math.max(start[0],end[0])+limit<Math.min(c[0],d[0])||Math.min(start[0],end[0])-limit>Math.max(c[0],d[0])||Math.max(start[1],end[1])+limit<Math.min(c[1],d[1])||Math.min(start[1],end[1])-limit>Math.max(c[1],d[1]))continue;
   const cross=(p,q,r)=>(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]);
   if(cross(start,end,c)*cross(start,end,d)<=0&&cross(c,d,start)*cross(c,d,end)<=0)return true;
   if(Math.min(distanceToSegment(start,c,d),distanceToSegment(end,c,d),distanceToSegment(c,start,end),distanceToSegment(d,start,end))<limit)return true;
  }return false;
 }
 const solution=[...layout.approach,...layout.route,[1672,layout.finish[1]],[1674,660],M.exit].map(([u,v])=>world(u,v,mazeSurface(u,v)??gardenHeight(u)));
 const atEntrance=world(1106,layout.entry[1],5.4);
 const exit=new T.Group();exit.name='Maze_exit';exit.userData.dynamic=true;exit.position.set(...world(...M.exit));root.add(exit);groups.Maze_exit=exit;
 const ring=new T.Mesh(new T.TorusGeometry(.9,.06,8,48),new T.MeshBasicMaterial({color:0xeccb87,toneMapped:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.08;exit.add(ring);
 const beam=new T.Mesh(new T.CylinderGeometry(.36,.36,64,8),new T.MeshBasicMaterial({color:0xff53c7,transparent:true,opacity:.45,depthWrite:false,toneMapped:false}));beam.position.y=32;exit.add(beam);
 const glow=new T.Mesh(new T.CylinderGeometry(1.2,1.2,64,24,1,true),new T.MeshBasicMaterial({color:0xff82d8,transparent:true,opacity:.08,depthWrite:false,side:T.DoubleSide,toneMapped:false}));glow.position.y=32;exit.add(glow);
 let exitActive=false;
 function setExitActive(active){exitActive=active;beam.visible=glow.visible=active;ring.material.color.set(active?0xff53c7:0xeccb87);}
 setExitActive(false);
 return {group,spec:M,layout,solution,atEntrance,blocks,surface:mazeSurface,waterAt:gardenWaterAt,exit,exitSign,setExitActive,get exitActive(){return exitActive;}};
}

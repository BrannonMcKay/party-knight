import {world,gardenHeight} from './beverly-layout.js';
import {PATIO_PARTY_LOOP} from './beverly-party-crowd.js';

// Connected estate corridors feed the maze's actual graph, including every
// water passage and dead end. Water is never given an avoidance cost.
export function createPursuitPaths(T,model,navigation){
 const nodes=[],edges=[],keys=new Map(),maze=model.maze,M=maze.spec;
 const point=p=>new T.Vector3(...world(p[0],p[1],p[2]??gardenHeight(p[0])));
 const add=p=>{const key=`${p.x.toFixed(3)},${p.z.toFixed(3)}`;if(keys.has(key))return keys.get(key);const i=nodes.length;keys.set(key,i);nodes.push(p.clone());edges.push(new Map());return i;};
 const link=(a,b)=>{if(a===b)return;const cost=nodes[a].distanceTo(nodes[b]);edges[a].set(b,cost);edges[b].set(a,cost);};
 function chain(points){let last=add(points[0]);for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i],count=Math.max(1,Math.ceil(a.distanceTo(b)/.7));
  for(let j=1;j<=count;j++){const n=add(a.clone().lerp(b,j/count));link(last,n);last=n;}
 }}
 const paths=model.passengers.paths;
 for(const path of Object.values(paths))if(path!==paths.exit)chain(path.points);
 const loop=[...PATIO_PARTY_LOOP,PATIO_PARTY_LOOP[0]].map(p=>point([...p,8.15]));chain(loop);
 const branches=[
  [[900,520],[950,520],[950,508],[970,508],[1018,508],[1030,550],[1106,maze.layout.entry[1]]],
  [[900,520],[900,496],[935,496],[935,472]],
  [[900,496],[878,496],[878,429],[905,429]], // around the end of the bar
  [[852,520],[852,486],[878,486]],
  [[902,679],[925,700],[940,720],[940,778],[915,778],[881,778],[837,783]],
  [[837,783],[797,778],[756,778],[723,778],[723,730],[723,700],[723,606]],
  [[925,700],[848,700],[848,724],[832,720],[843,706],[850,616]],
  [[943,666],[970,684],[1018,684],[1085,684],[1106,684],[1106,maze.layout.entry[1]]],
  [[1106,maze.layout.entry[1]],[1106,519],[1335,519],[1480,519],[1674,519],[1674,660]],
  [[1350,681.5],[1550,681.5],[1674,681.5],[1674,660],[1674,600]]
 ];
 for(const branch of branches)chain(branch.map(([u,v])=>{const p=point([u,v]);p.y=navigation.surface(p.x,p.z)??gardenHeight(u);return p;}));
 chain(maze.layout.approach.map(p=>point(p)));
 const cells=maze.layout.cells.map(([u,v])=>add(point([u,v,maze.surface(u,v)])));
 for(const key of maze.layout.links){const [a,b]=key.split(':').map(Number);link(cells[a],cells[b]);}
 link(add(point(maze.layout.approach.at(-1))),cells[M.entranceColumn]);
 chain([nodes[cells[(M.rows-1)*M.columns+M.finishColumn]],...[[1672,maze.layout.finish[1]],[1674,660],M.exit].map(point)]);
 // Small open-floor grids let the crew get around the fireplace furniture and
 // patio corners, rather than being trapped on one authored procession line.
 for(const [u1,v1,u2,v2] of [[832,488,962,720],[797,752,947,787],[1018,644,1120,704]])for(let u=u1;u<=u2;u+=8)for(let v=v1;v<=v2;v+=8){
  const p=point([u,v]);const h=navigation.surface(p.x,p.z);if(h!==null&&navigation.canStand(p.x,p.z)){p.y=h;add(p);}
 }
 function clear(a,b){
  const distance=Math.hypot(a.x-b.x,a.z-b.z),count=Math.max(1,Math.ceil(distance/.18));let previous=a.clone();
  for(let i=1;i<=count;i++){const p=a.clone().lerp(b,i/count),h=navigation.surface(p.x,p.z);if(h===null)return false;p.y=h;if(navigation.blocked(previous,p))return false;previous=p;}
  return true;
 }
 // Sample uphill segments at walking height so a stair riser is not mistaken
 // for an obstacle. The same capsule checks still enforce every maze wall.
 for(let i=0;i<nodes.length;i++)for(const j of [...edges[i].keys()])if(j>i&&!clear(nodes[i],nodes[j])){edges[i].delete(j);edges[j].delete(i);}
 for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++)if(nodes[i].distanceToSquared(nodes[j])<.88**2&&clear(nodes[i],nodes[j]))link(i,j);
 function nearest(p){
  const order=nodes.map((n,i)=>({i,d:n.distanceToSquared(p)})).sort((a,b)=>a.d-b.d);
  for(const {i} of order.slice(0,48))if(clear(p,nodes[i]))return i;
  return null;
 }
 // Small binary heap keeps a shared target field cheap for all pursuers.
 function field(target){
  const end=nearest(target),distance=new Float64Array(nodes.length).fill(Infinity),next=new Int32Array(nodes.length).fill(-1),heap=[];
  function push(item){let i=heap.length;heap.push(item);while(i){const p=(i-1)>>1;if(heap[p].d<=item.d)break;heap[i]=heap[p];i=p;}heap[i]=item;}
  function pop(){const first=heap[0],tail=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let j=i*2+1;if(j+1<heap.length&&heap[j+1].d<heap[j].d)j++;if(heap[j].d>=tail.d)break;heap[i]=heap[j];i=j;}heap[i]=tail;}return first;}
  if(end!==null){distance[end]=0;push({i:end,d:0});}
  while(heap.length){const {i,d}=pop();if(d!==distance[i])continue;for(const [j,cost] of edges[i])if(d+cost<distance[j]){distance[j]=d+cost;next[j]=i;push({i:j,d:d+cost});}}
  return {target:target.clone(),end,next,distance};
 }
 function route(from,targetField){
  const to=targetField.target;
  if(from.distanceTo(to)<5&&clear(from,to))return [to.clone()];
  let i=nearest(from);if(i===null||!Number.isFinite(targetField.distance[i]))return [];
  const path=[nodes[i].clone()];for(let steps=0;i!==targetField.end&&steps<nodes.length;steps++){i=targetField.next[i];if(i<0)return [];path.push(nodes[i].clone());}
  path.push(to.clone());return path;
 }
 const panRoute=[...[[935,496],[950,508],[970,508],[1018,508],[1030,550]].map(([u,v])=>point([u,v,navigation.surface(...[world(u,v)[0],world(u,v)[2]])??gardenHeight(u)])),...maze.solution.map(p=>new T.Vector3(...p))];
 return {nodes,edges,nearest,field,route,clear,panRoute};
}

import {DROWNING_REMAINS} from './beverly-drowning-remains.js';
// Trace coordinates refer to the supplied plan resized to 2048 x 1198.
// This is an image trace, not a survey. Y elevations are photo-guided estimates.
export const PLAN = Object.freeze({width:2048,height:1198,metresPerPixel:(74.75*.3048)/298,origin:[820,600],poolLength:74.75*.3048,poolWidth:9.3726});
export const s=PLAN.metresPerPixel;
export function world(u,v,y=0){return [(u-820)*s,y,(v-600)*s];}
export function plan(x,z){return [x/s+820,z/s+600];}
export const LEVELS = Object.freeze({arrival:8,house:8.15,darkRoom:7.64,patio:8.15,upperGarden:5.4,middleGarden:4.0,pool:2.2});
// Authored deep fountain for the staged scene, not a surveyed depth.
export const PATIO_FOUNTAIN={id:'upper-patio-fountain',u:903,v:601,outerRadius:2.45,innerRadius:2.16,surface:8.42,bed:6.22,rim:8.65};
export const FUTURE_STORY={status:'Three sequential scenes active in the estate review',progression:'Hot Chick at the bottom of the terrace stairs, Al Pacino in the wooden room, then Emily by the fountain',cue:'One faint blue exit-style light column and ground hoop at the next standing position',trigger:'Standing in the hoop locks movement for the readable, overhead character dialogue and restores it when the scene ends',fountainScene:'Reunion, bar and balcony cutaways, happy faces with three-second drowning countdowns, submerged bodies and diverging spirit endings'};
// Central garden watercourse. These depths are authored estimates for the site,
// not measurements. The separate octagonal ornamental fountains stay in place.
export const GARDEN_BASINS = [
 {id:'upper-terrace-basin',u1:1016,u2:1135,v1:586,v2:616,surface:5.24,bed:4.80},
 {id:'middle-terrace-basin',u1:1165,u2:1280,v1:586,v2:616,surface:3.84,bed:3.40},
 {id:'lower-catch-basin',u1:1315,u2:1343,v1:586,v2:616,surface:2.04,bed:1.60}
];
export const GARDEN_CASCADES = [
 {id:'upper-terrace-cascade',u1:1135,u2:1165,from:5.24,to:3.84,steps:5},
 {id:'lower-terrace-cascade',u1:1280,u2:1315,from:3.84,to:2.04,steps:5}
];
export const MAIN_POOL = {id:'main-swimming-pool',surface:1.955,bed:.14,polygon:[[1359,564],[1369,550],[1382,548],[1389,539],[1632,539],[1639,548],[1648,550],[1657,569],[1657,632],[1648,649],[1639,653],[1632,663],[1389,663],[1382,654],[1369,652],[1359,635]]};
export const FUTURE_WATER_RULES = {
 status:'Christel swims across Baby Maze; armed stickmen pursue her after the fountain scene, wash into the main pool and drown with random spirit outcomes; Pan Man swims safely with his drink raised',
 aftermath:DROWNING_REMAINS,
 christel:{terraceWater:'wade across',mainPool:'swim slowly'},
 stickmen:{canSwim:false,exception:'Token Trans swims and never drowns',current:'drift slowly downhill into the main pool',drownAfterSeconds:3,spiritOutcome: {redDescent:.5,angelAscent:.5}},
 tokenTrans:{canSwim:true,drownAfterSeconds:10,swimSpeedRelativeToChristelRun:.3,ignoresSubmergedWalls:true,canCatchWhileSwimming:true,speech:"Next I'll join the women's swim team!"}
};
// USER-07 satellite registered to the patio fountain and pool axis. Canopy-hidden
// bends and all elevations remain estimates; these are not survey coordinates.
export const DRIVE = [[2631,223,-18],[2528,348,-17.2],[2317,583,-14.5],[2076,840,-11.6],[1885,1080,-8.7],[1572,1167,-5.5],[1247,1179,-2.5],[959,1174,.2],[737,1179,2.5],[530,1171,4],[360,1093,5.3],[348,934,6.5],[370,776,7.4],[464,704,8]];
export const SIDE_DRIVE = [[360,1093,5.3],[630,1120,5.4],[790,1068,5.7],[1020,970,5.9],[1213,864,6.1]];
// Shared by the rendered parking ramp and player navigation.
export const COACH_APPROACH=[[380,758,7.54],[381,738,7.75],[363,714,7.965],[322,691,7.965]];
export const TRAILER_PAD={u:263,v:1030,y:5.9}; // revised by user: across the upper drive from the palms
export const CHURRO_TENT={u:238,v:863,y:6.54,width:7.2,depth:5.4};
export const CHURRO_ACCESS=[[348,934,6.5],[320,911,6.54],[294,877,6.54],[272,863,6.54]];
// User-requested closure of the bare outer edge of the entrance loop. Keep the
// space behind the forecourt urn/statue available for a later arriving party bus.
export const ARRIVAL_WALL=[[310,754],[90,750],[55,620],[65,490],[165,447],[395,450]];
export const FUTURE_BUS_BAY={u1:130,u2:245,v1:515,v2:700,y:8,status:'Billy Knight coach parking and ten-passenger unloading'};
// The estate's long routes use a 50% faster pace than the original board tuning.
export const ESTATE_MOVEMENT={walk:4.5,run:7.95};
export const PARTY_BUS={length:11.8,width:2.55,height:3.65,delay:10,speedMultiplier:1.5,parkingSpeed:2.1,park:[185,603,8]};
export const GATE_PROGRESS=.055;
export const GATE_OPEN_SECONDS=2.8;
export function darkRoomHeight(u,v){
 if(v<737)return 8.15-Math.max(0,Math.min(1,(v-707)/30))*.51;
 if(u>740&&v>760&&v<794)return 7.64+Math.max(0,Math.min(1,(u-740)/30))*.51;
 return 7.64;
}
export const WEST_PATIO=[[638,906],[786,906],[786,939],[749,974],[674,974],[638,938]];
export const BYPASS_HEDGES=[[[470,889],[470,1006],[638,1006],[800,1006],[875,901],[965,880],[1044,804],[1510,804]],[[650,398],[943,398],[973,402],[1088,416],[1510,416]]];
export const ROUTE = [
  ...DRIVE.slice(1),
  [557,691,8],[585,652,8],[610,626,8],[642,610,8],[670,606,8.15],[723,606,8.15],
  [723,582,8.15],[782,582,8.15],[836,582,8.15],[912,558,8.15],
  [956,512,8.15],[986,512,7],[1018,512,5.4],[1030,550,5.4],[1087,553,5.4],
  [1135,553,5.4],[1167,553,4],[1267,553,4],[1315,553,2.2],
  [1340,525,2.2],[1520,524,2.2],[1656,527,2.2],[1675,553,2.2],[1678,600,2.2]
];
export const LANDMARKS = [
  {id:'arrival',label:'Arrival court',uv:[535,635],y:8},
  {id:'entry',label:'Front door',uv:[650,610],y:8.15},
  {id:'galleries',label:'Paired galleries',uv:[731,558],y:8.15},
  {id:'fireplace',label:'Fireplace room · your marked location',uv:[835,777],y:8.15},
  {id:'patio',label:'Upper patio',uv:[914,600],y:8.15},
  {id:'pool',label:'Pool · 74′ 9″',uv:[1508,600],y:2.2},
  {id:'exit',label:'Exit · far end',uv:[1678,600],y:2.2},
  {id:'turnaround',label:'Corrected photo location',uv:[260,870],y:6.7},
  {id:'gate',label:'Gate · N. Beverly Drive',uv:[2528,348],y:-17.2},
  {id:'trailer',label:'Union Toilets · overflow source',uv:[263,1030],y:7.3},
  {id:'churros',label:'Eat Churros Here',uv:[238,863],y:9.3},
  {id:'wood-room',label:'Lower wooden room',uv:[712,775],y:7.64},
  {id:'west',label:'Raised side patio & rail',uv:[712,948],y:8.15}
];
export function gardenHeight(u){
  if(u<976)return 8.15;
  if(u<1016)return 8.15-(u-976)/40*2.75;
  if(u<1135)return 5.4;
  if(u<1165)return 5.4-(u-1135)/30*1.4;
  if(u<1280)return 4;
  if(u<1315)return 4-(u-1280)/35*1.8;
  return 2.2;
}
export function nearPolyline(u,v,points){
  let best={distance:Infinity,height:0};
  for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i],dx=b[0]-a[0],dz=b[1]-a[1];
    const t=Math.max(0,Math.min(1,((u-a[0])*dx+(v-a[1])*dz)/(dx*dx+dz*dz)));
    const d=Math.hypot(u-a[0]-dx*t,v-a[1]-dz*t);
    if(d<best.distance)best={distance:d,height:a[2]+(b[2]-a[2])*t};
  }return best;
}
export function terrainHeight(u,v){
  // Broad hill fall follows the house-to-street drop; local grading should not
  // excavate a deep trench through an otherwise flat site.
  let h=8.0-Math.max(0,u-700)*.0135-Math.max(0,v-830)*.009-Math.max(0,250-v)*.012;
  h+=.22*Math.sin(u*.013)*Math.cos(v*.012);
  if(u>285&&u<978&&v>128&&v<905)h=7.8;
  if(u>85&&u<399&&v>478&&v<734)h=7.8; // grade the expanded bus standing area
  if(u>650&&u<775&&v>700&&v<906)h=7.3; // excavate below the lowered interior
  const gardenDistance=Math.max(978-u,u-1710,366-v,v-824,0);
  if(u>928&&gardenDistance<95){const blend=1-Math.min(1,gardenDistance/95);h=h*(1-blend)+(gardenHeight(Math.max(978,u))-.2)*blend;}
  if(u>1013&&u<1362&&v>580&&v<622)h=Math.min(h,gardenHeight(u)-.9); // shallow basin / stepped-watercourse excavation
  if(u>1350&&u<1664&&v>535&&v<668)h=-.25; // pool excavation
  const road=[nearPolyline(u,v,DRIVE),nearPolyline(u,v,SIDE_DRIVE)].sort((a,b)=>a.distance-b.distance)[0];
  if(road.distance<110){const t=Math.max(0,(road.distance-50)/60);h=road.height-.22+(h-road.height+.22)*t;}
  if(u>163&&u<340&&v>780&&v<988)h=6.35;
  if(u>205&&u<334&&v>974&&v<1102)h=5.67;
  // Excavate beyond the rim so coarse terrain triangles cannot fill the well.
  if(Math.hypot(u-PATIO_FOUNTAIN.u,v-PATIO_FOUNTAIN.v)*s<PATIO_FOUNTAIN.outerRadius+1.7)h=Math.min(h,PATIO_FOUNTAIN.bed-.3);
  return h;
}

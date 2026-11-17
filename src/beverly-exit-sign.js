import {world,LEVELS} from './beverly-layout.js';

// Single-stroke marker letters, drawn as geometry so the handmade sign also
// survives the editable GLB export without a canvas or platform font.
const LETTERS={
 E:[[[.62,1],[.05,.98],[0,.01],[.64,0]],[[.02,.51],[.52,.53]]],
 M:[[[0,0],[.03,1],[.36,.40],[.70,.98],[.72,.01]]],
 R:[[[.01,0],[.03,.99],[.45,1],[.62,.84],[.58,.62],[.35,.51],[.03,.52]],[[.32,.51],[.68,0]]],
 G:[[[.65,.86],[.47,1],[.16,.93],[.01,.69],[.02,.28],[.20,.03],[.48,0],[.66,.20],[.66,.48],[.36,.49]]],
 N:[[[0,0],[.03,1],[.65,.02],[.67,1]]],
 C:[[[.64,.86],[.46,1],[.18,.94],[.01,.68],[.02,.27],[.21,.03],[.48,0],[.65,.17]]],
 Y:[[[0,1],[.34,.52],[.68,1]],[[.34,.52],[.31,0]]],
 A:[[[0,0],[.30,1],[.40,.99],[.73,0]],[[.13,.40],[.58,.42]]],
 Z:[[[0,.99],[.69,1],[.02,0],[.71,.02]]],
 X:[[[0,1],[.67,0]],[[.65,1],[.02,0]]],
 I:[[[.04,1],[.52,.99]],[[.29,.99],[.25,0]],[[0,0],[.53,.01]]],
 T:[[[0,.98],[.75,1]],[[.39,.99],[.35,0]]]
};

export function buildEmergencyExitSign(T,parent,materials){
 const group=new T.Group();group.name='Emergency Maze Exit sign';
 // Pan Man's left, tucked on the bar side of the stair opening (v=481..535).
 // Even the arrowhead stays outside that opening instead of overhanging it.
 group.position.set(...world(958,475,LEVELS.patio));parent.add(group);
 group.userData={text:'Emergency Maze Exit',location:'To Pan Man’s left, clear of the bar-side patio stairs',direction:'Down the stairs toward Baby Maze',readFrom:'Christel fountain story position',appearance:'Pink hand-painted arrow with handwritten marker lettering and a running stickman doodle'};
 const pink=new T.MeshBasicMaterial({name:'Emergency sign painted pink',color:0xed7bae,toneMapped:false});
 const cream=new T.MeshBasicMaterial({name:'Emergency sign cream edge',color:0xffe4ee,toneMapped:false});
 const ink=new T.MeshBasicMaterial({name:'Emergency sign plum marker',color:0x351c32,toneMapped:false});
 const postMaterial=new T.MeshStandardMaterial({name:'Emergency sign wooden post',color:0x774551,roughness:1});
 for(const mat of [pink,cream,ink,postMaterial])materials[mat.name]=mat;
 const post=new T.Mesh(new T.CylinderGeometry(.055,.065,2.73,8),postMaterial);post.name='Exit sign post';post.position.set(-.65,1.365,-.08);group.add(post);
 const arrow=new T.Group();arrow.name='Downstairs arrow';arrow.position.y=2.65;arrow.rotation.z=-.22;arrow.scale.setScalar(.8);group.add(arrow);
 const shape=new T.Shape();shape.moveTo(-1.55,-.55);shape.lineTo(.85,-.55);shape.lineTo(.85,-.85);shape.lineTo(1.8,0);shape.lineTo(.85,.85);shape.lineTo(.85,.55);shape.lineTo(-1.55,.55);shape.closePath();
 const border=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:.055,bevelEnabled:false}),cream);border.name='Arrow-shaped exit sign border';arrow.add(border);
 const face=new T.Mesh(new T.ShapeGeometry(shape),pink);face.name='Pink arrow sign face';face.scale.set(.96,.91,1);face.position.z=.057;arrow.add(face);
 function stroke(parent,name,points,r=.016){
  const curve=new T.CatmullRomCurve3(points.map(([x,y])=>new T.Vector3(x,y,0)));
  const mesh=new T.Mesh(new T.TubeGeometry(curve,Math.max(8,points.length*5),r,5,false),ink);mesh.name=name;parent.add(mesh);
 }
 function write(text,y,height){
  const line=new T.Group();line.name='Handwritten exit sign: '+text;line.position.set(-.35,y,.079);arrow.add(line);
  const advance=height*.90,width=[...text].reduce((n,c)=>n+(c===' '?advance*.6:advance),0)-advance+height*.72;
  let x=-width/2;
  [...text].forEach((c,i)=>{
   if(c===' '){x+=advance*.6;return;}
   const letter=new T.Group();letter.position.set(x,Math.sin(i*2.3)*.011,0);letter.rotation.z=Math.sin(i*3.7)*.045;line.add(letter);
   for(const points of LETTERS[c])stroke(letter,'Marker letter '+c,points.map(([px,py])=>[(px+py*.045)*height,py*height]),.0155);
   x+=advance;
  });
 }
 write('EMERGENCY',.12,.255);write('MAZE EXIT',-.30,.275);
 const runner=new T.Group();runner.name='Hand-drawn running stickman';runner.position.set(1.08,0,.082);arrow.add(runner);
 stroke(runner,'Wobbly stickman head',[[.03,.32],[.10,.34],[.16,.30],[.17,.24],[.12,.19],[.05,.20],[.01,.25],[.03,.32]],.019);
 stroke(runner,'Leaning running body',[[.09,.19],[.02,.07],[-.03,-.05]],.020);
 stroke(runner,'Forward bent arm',[[.06,.12],[.19,.10],[.24,.21]],.019);
 stroke(runner,'Back bent arm',[[.06,.12],[-.10,.18],[-.18,.08]],.019);
 stroke(runner,'Lifted running leg',[[-.03,-.05],[.15,-.14],[.08,-.29]],.021);
 stroke(runner,'Trailing running leg',[[-.03,-.05],[-.14,-.22],[-.25,-.18]],.021);
 stroke(runner,'Hasty motion line',[[-.19,.01],[-.30,.02]],.011);
 return group;
}

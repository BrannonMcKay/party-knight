// The model review uses the same cream speech balloons and tail as the game.
// Only projection/occlusion differs because this site uses meshes instead of maze cells.
export function createBeverlySpeech(T,actors,canvas,occluders,{onVisibleSpeech=()=>{}}={}){
 const bubbles=actors.map(actor=>{const el=document.createElement('div');el.className='character-speech';el.setAttribute('role','status');el.setAttribute('aria-label',actor.speechName?actor.speechName+' says':actor.tiny?'Tiny Stickman says':'Film crew says');el.hidden=true;document.body.append(el);return {actor,el};});
 const point=new T.Vector3(),projected=new T.Vector3(),direction=new T.Vector3(),ray=new T.Raycaster();
 function update(camera,{storySpeaker=null}={}){
  const rect=canvas.getBoundingClientRect(),boxes=[],visible=[],speakers=storySpeaker?(Array.isArray(storySpeaker)?storySpeaker:[storySpeaker]):null;
  for(const {actor,el} of bubbles){
   el.hidden=true;if(!actor.speech||actor.group?.visible===false||(speakers&&!speakers.includes(actor)))continue;
   el.classList.toggle('story-speech',speakers?.includes(actor)??false);
   actor.anchor.getWorldPosition(point);
   // Nearby named guests can also be heard while Christel looks away.
   if(actor.voiceCue && camera.position.distanceToSquared(point)<38*38)visible.push({actor,position:{x:point.x,z:point.z}});
   projected.copy(point).project(camera);
   if(projected.z<=-1||projected.z>=1||Math.abs(projected.x)>.98||Math.abs(projected.y)>.98)continue;
   direction.copy(point).sub(camera.position);const distance=direction.length();if(distance>27)continue;
   ray.set(camera.position,direction.normalize());ray.near=.08;ray.far=Math.max(.08,distance-.10);
   if(ray.intersectObjects(occluders,true).length)continue;
   if(el.textContent!==actor.speech.text)el.textContent=actor.speech.text;el.hidden=false;
   const half=el.offsetWidth/2+8,anchor=rect.left+(projected.x+1)*.5*rect.width;
   const x=T.MathUtils.clamp(anchor,rect.left+half,rect.right-half);
   let y=Math.max(rect.top+el.offsetHeight+12,rect.top+(1-projected.y)*.5*rect.height-10);
   for(const box of boxes)if(Math.abs(x-box.x)<half+box.half&&Math.abs(y-box.y)<el.offsetHeight+14)y=box.y-box.height-18;
   y=Math.max(rect.top+el.offsetHeight+12,y);el.style.left=x+'px';el.style.top=y+'px';
   el.style.setProperty('--tail-left',T.MathUtils.clamp(anchor-x+el.offsetWidth/2-7,12,el.offsetWidth-25)+'px');
   boxes.push({x,y,half,height:el.offsetHeight});if(!actor.voiceCue)visible.push({actor,position:{x:point.x,z:point.z}});
  }
  camera.getWorldDirection(direction);
  onVisibleSpeech(visible,{x:camera.position.x,z:camera.position.z,angle:Math.atan2(direction.x,direction.z)});
 }
 return {update,dispose(){bubbles.forEach(({el})=>el.remove());}};
}

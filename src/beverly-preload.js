// Upload the coach's buffers and compile its night-light shaders before play.
// A tiny offscreen render also warms the shadow/depth passes, without flashing
// the bus over the player's view or advancing its arrival clock.
export async function preloadBeverlyBus(T,renderer,scene,camera,bus){
 const previousTarget=renderer.getRenderTarget(),visible=bus.group.visible;
 const culling=[],target=new T.WebGLRenderTarget(64,64);
 const warmCamera=camera.clone();warmCamera.aspect=1;warmCamera.fov=55;
 warmCamera.position.copy(bus.group.position).add(new T.Vector3(12,8,16).applyQuaternion(bus.group.quaternion));
 warmCamera.lookAt(bus.group.position.clone().add(new T.Vector3(0,2,0)));warmCamera.updateProjectionMatrix();
 bus.group.visible=true;
 bus.group.traverse(o=>{if(o.isMesh){culling.push([o,o.frustumCulled]);o.frustumCulled=false;}});
 try{
  await renderer.compileAsync(bus.group,warmCamera,scene);
  renderer.setRenderTarget(target);renderer.render(scene,warmCamera);
 }finally{
  renderer.setRenderTarget(previousTarget);bus.group.visible=visible;
  for(const [o,culled] of culling)o.frustumCulled=culled;
  target.dispose();
 }
}

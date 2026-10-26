import {sphericalPath} from './connections.js?v=lanes-1';
import {createPathHighlight,setPathHighlight,updatePathHighlight} from './path-highlight.js?v=smaller-peaks-2';
// Camera navigation has one fixed pivot. Drag changes orientation; zoom changes
// only the distance from that pivot. No pan or independent camera look direction.
export function createGlobe({T,root,assets,projects,categories,reduced,onIntroComplete=()=>{},onSelect,onBlank=()=>{},hasSelection=()=>false,isPaused,onZoomOut}) {
  const $=s=>document.querySelector(s), radius=9, width=3.6, height=2.3, maxZoom=1.65;
  const compact=matchMedia('(max-width: 1024px), (hover: none) and (pointer: coarse)');
  const renderer=new T.WebGLRenderer({antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0xffffff,0);
  const canvas=renderer.domElement;root.append(canvas);
  canvas.setAttribute('aria-label','Rotating project globe. Drag to rotate, scroll or pinch to enter and exit. Arrow keys rotate; plus and minus zoom.');
  const scene=new T.Scene(),group=new T.Group(),camera=new T.PerspectiveCamera(49,1,.1,160);scene.add(group);
  const geometry=new T.PlaneGeometry(width,height);
  const meshes=projects.map((p,i)=>{
    // A Fibonacci sphere gives every panel an equal-size place around the center.
    const y=1-2*(i+.5)/projects.length,a=i*Math.PI*(3-Math.sqrt(5)),r=Math.sqrt(1-y*y);
    const map=assets[i].texture;
    const blur={value:0};
    const material=new T.MeshBasicMaterial({map,side:T.DoubleSide,transparent:true,opacity:reduced.matches?1:0});
    material.onBeforeCompile=shader=>{
      shader.uniforms.projectBlur=blur;
      shader.uniforms.blurredMap={value:assets[i].blurredTexture};
      shader.fragmentShader='uniform float projectBlur;\nuniform sampler2D blurredMap;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',T.ShaderChunk.map_fragment.replace(
        'vec4 sampledDiffuseColor = texture2D( map, vMapUv );',
        'vec4 sampledDiffuseColor = mix(texture2D(map, vMapUv), texture2D(blurredMap, vMapUv), projectBlur);'
      ));
    };
    material.customProgramCacheKey=()=> 'project-focus-v1';
    const mesh=new T.Mesh(geometry,material);
    mesh.position.set(Math.cos(a)*r*radius,y*radius,Math.sin(a)*r*radius);
    mesh.userData.globePosition=mesh.position.clone();
    mesh.userData.id=i;mesh.userData.blur=blur;mesh.userData.targetBlur=0;group.add(mesh);return mesh;
  });
  const connectionPaths=categories.map((category,categoryIndex)=>{
    const positions=category.projects.map(name=>meshes[projects.find(p=>p.name===name).id].position);
    const points=sphericalPath(T,positions,radius+.04,categoryIndex);
    const line=new T.Group();line.name='category-'+category.id;line.userData.categoryId=category.id;
    const highlight=createPathHighlight(T,points,category.color);line.add(highlight);line.userData.highlight=highlight;group.add(line);
    return line;
  });
  function showConnections(id){
    const active=id===null?[]:projects[id].categoryIds;
    connectionPaths.forEach(line=>{setPathHighlight(line.userData.highlight,active.includes(line.userData.categoryId)?meshes[id].position:null)});
    meshes.forEach((mesh,i)=>{mesh.userData.targetBlur=id!==null&&!projects[i].categoryIds.some(category=>active.includes(category))?1:0});
  }
  let zoom=0,targetZoom=0,yaw=.15,targetYaw=.15,pitch=.1,targetPitch=.1;
  let spin=0,autoRotate=!reduced.matches,raf=0,last=0,fitDistance=35,drag=null,pinch=null,hover=null,hoverPointer=null;
  let introComplete=false;
  function completeIntro(){if(!introComplete){introComplete=true;onIntroComplete()}}
  let introTime=reduced.matches?3.5:0;
  const ringPoint=new T.Vector3();
  function finishIntro(){completeIntro();introTime=3.5;meshes.forEach(m=>{m.position.copy(m.userData.globePosition);m.scale.setScalar(1);m.material.opacity=1});connectionPaths.forEach(p=>p.userData.highlight.material.uniforms.introOpacity.value=1)}
  const pointers=new Map(),ray=new T.Raycaster(),pointer=new T.Vector2();
  const origin=new T.Vector3(),orbit=new T.Vector3(),inverse=new T.Quaternion(),world=new T.Vector3();
  const smooth=(a,b,x)=>{const t=T.MathUtils.clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
  function setZoom(z){if(compact.matches)return;finishIntro();targetZoom=T.MathUtils.clamp(z,0,maxZoom);if(targetZoom<.85)onZoomOut();clearHover();wake()}
  function updateToggle(){ if(!$('#motion'))return; $('#motion').textContent=autoRotate?'Auto-rotate on':'Auto-rotate off';$('#motion').setAttribute('aria-pressed',String(autoRotate)) }
  function clearHover(){hoverPointer=null;hover=null;showConnections(null);$('#hover-label').hidden=true;setCategoryVisibility(false);canvas.style.cursor='grab'}
  function frame(time){
    raf=0;if(document.hidden||!root.isConnected)return;
    const dt=Math.min((time-last)/1000||.016,.05);last=time;
    const k=reduced.matches?1:1-Math.exp(-dt*7);
    zoom+=(targetZoom-zoom)*k;yaw+=(targetYaw-yaw)*k;pitch+=(targetPitch-pitch)*k;
    const moving=autoRotate&&!reduced.matches&&!drag&&!isPaused()&&!(compact.matches&&hover!==null);
    if(reduced.matches)finishIntro();
    if(introTime<3.5&&!isPaused())introTime=Math.min(3.5,introTime+dt);
    if(introTime>=2.35)completeIntro();
    const morph=smooth(2.5,3.5,introTime);
    if(moving)spin+=dt*.045*morph;
    group.rotation.set(0,spin,0);group.updateMatrixWorld(true);
    const distance=fitDistance*(1-smooth(0,1,zoom))-radius*.6*Math.max(0,zoom-1)/.65;
    orbit.set(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch));
    camera.position.copy(orbit).multiplyScalar(distance);
    // This remains defined even at distance zero (inside the globe).
    camera.lookAt(camera.position.clone().sub(orbit));
    camera.fov=49+21*smooth(.55,1,zoom);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
    group.getWorldQuaternion(inverse).invert();meshes.forEach(m=>m.quaternion.copy(inverse).multiply(camera.quaternion));
    if(introTime<3.5){
      const turn=.32*smooth(1.3,2.6,introTime);
      meshes.forEach((m,i)=>{
        const angle=Math.PI/2-i/projects.length*Math.PI*2-turn;
        ringPoint.set(Math.cos(angle)*radius,Math.sin(angle)*radius,0).applyQuaternion(camera.quaternion).applyQuaternion(inverse);
        m.position.copy(ringPoint).lerp(m.userData.globePosition,morph);
        m.scale.setScalar(.72+.28*morph);
        m.material.opacity=smooth(i*.085,i*.085+.4,introTime);
      });
    }else{meshes.forEach(m=>{m.position.copy(m.userData.globePosition);m.scale.setScalar(1);m.material.opacity=1})}
    connectionPaths.forEach(p=>p.userData.highlight.material.uniforms.introOpacity.value=smooth(.55,1,morph));
    // Keep hover accurate as a card moves beneath a stationary pointer.
    group.updateMatrixWorld(true);
    if(hoverPointer&&!drag&&!isPaused()){
      const h=hit(hoverPointer);setHover(h?h.object.userData.id:null,hoverPointer);
      canvas.style.cursor=h?'pointer':'grab';
    }
    if(hover!==null)positionCaption(hover);
    // Finish transitions even when auto-rotation is off; reduced motion is instant.
    const focusEase=reduced.matches?1:1-Math.exp(-dt*12);
    let focusSettling=false;
    for(const line of connectionPaths){
      if(updatePathHighlight(line.userData.highlight,dt,reduced.matches))focusSettling=true;
    }
    for(const mesh of meshes){
      const difference=mesh.userData.targetBlur-mesh.userData.blur.value;
      mesh.userData.blur.value=Math.abs(difference)<.001?mesh.userData.targetBlur:mesh.userData.blur.value+difference*focusEase;
      if(Math.abs(difference)>.001)focusSettling=true;
    }
    assets.forEach((asset,i)=>asset.update?.(time,meshes[i].userData.blur.value>.001));
    const mediaPlaying=assets.some(asset=>(asset.video&&!asset.video.paused)||(asset.gif&&!reduced.matches));
    renderer.render(scene,camera);
    const opacity=1-smooth(.015,.3,zoom);
    $('#intro').style.opacity=String(opacity);$('#intro').style.visibility=opacity<.005?'hidden':'';
    $('#intro p').textContent=compact.matches?'Open on desktop for the best experience':'Hover over work to see related nodes';
    $('#guide').textContent=compact.matches?'Swipe to rotate and explore':zoom>.85?'Scroll down to return and drag to explore':'Scroll up to enter and drag to rotate';
    const settling=Math.abs(zoom-targetZoom)+Math.abs(yaw-targetYaw)+Math.abs(pitch-targetPitch)>.0001;
    if((introTime<3.5&&!isPaused())||moving||settling||focusSettling||mediaPlaying)wake();
  }
  function wake(){if(!raf&&!document.hidden){raf=requestAnimationFrame(frame)}}
  function resize(){
    const categoryHost=compact.matches?$('#intro'):$('#spatial-view');
    if($('#spatial-categories').parentElement!==categoryHost)categoryHost.append($('#spatial-categories'));
    canvas.setAttribute('aria-label',compact.matches?'Project globe. Swipe to rotate; tap a project to show its title and categories.':'Rotating project globe. Drag to rotate, scroll or pinch to enter and exit. Arrow keys rotate; plus and minus zoom.');
    const w=root.clientWidth,h=root.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;
    const vertical=49*Math.PI/180,horizontal=2*Math.atan(Math.tan(vertical/2)*camera.aspect);
    // Fit a bounding sphere at every orientation, including the panel corners.
    fitDistance=(radius+Math.hypot(width,height)/2)/Math.sin(Math.min(vertical,horizontal)/2)*1.2;
    wake();
  }
  function hit(e){if(introTime<3.5)return null;const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);return ray.intersectObjects(meshes)[0]}
  function handleWheel(e){if(compact.matches)return;if(isPaused()&&e.target.closest('#index-view,dialog,#project'))return;if(e.target.closest('#index-view,dialog,#project'))return;e.preventDefault();const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?root.clientHeight:1);setZoom(targetZoom+T.MathUtils.clamp(delta,-120,120)*.0015)}
  $('#experience').addEventListener('wheel',handleWheel,{passive:false});
  canvas.onpointerdown=e=>{finishIntro();clearHover();pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});canvas.setPointerCapture(e.pointerId);drag={id:e.pointerId,x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,moved:0};if(pointers.size===2){const p=[...pointers.values()];pinch=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)}wake()};
  canvas.onpointermove=e=>{
    if(pointers.has(e.pointerId))pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pointers.size===2){const p=[...pointers.values()],d=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);if(!compact.matches&&pinch!==null)setZoom(targetZoom+(d-pinch)*.004);pinch=d;if(drag)drag.moved=100;return}
    if(drag&&drag.id===e.pointerId){targetYaw-=(e.clientX-drag.x)*.004;targetPitch=T.MathUtils.clamp(targetPitch+(e.clientY-drag.y)*.004,-1.3,1.3);drag.moved=Math.max(drag.moved,Math.hypot(e.clientX-drag.sx,e.clientY-drag.sy));drag.x=e.clientX;drag.y=e.clientY;wake();return}
    if(compact.matches)return;
    hoverPointer=e.pointerType==='mouse'?{clientX:e.clientX,clientY:e.clientY}:null;
    const h=hit(e);setHover(h?h.object.userData.id:null,e); 
    canvas.style.cursor=h?'pointer':'grab';wake();
  };
  function setCategoryVisibility(visible){
    $('#spatial-categories').classList.toggle('is-visible',visible);
    $('#spatial-categories').setAttribute('aria-hidden',String(!visible));
    $('#spatial-view').classList.toggle('has-hover',visible);
  }
  function setHover(id,e){
    const changed=id!==hover;hover=id;showConnections(id);const label=$('#hover-label');label.hidden=id===null;setCategoryVisibility(id!==null);
    if(id===null)return;
    if(changed||label.children.length===0){label.replaceChildren();const name=document.createElement('span');name.className='hover-title';name.textContent=projects[id].title||projects[id].name;label.append(name);
    const keys=$('#spatial-categories');keys.replaceChildren();
    categories.filter(c=>projects[id].categoryIds.includes(c.id)).forEach(c=>{const item=document.createElement('span');item.className='category-key';item.style.setProperty('--category-color',c.color);const swatch=document.createElement('i');swatch.setAttribute('aria-hidden','true');item.append(swatch,document.createTextNode(c.name));keys.append(item)});}
    positionCaption(id);
  }
  function positionCaption(id){
    const label=$('#hover-label'),rect=canvas.getBoundingClientRect(),parent=label.offsetParent.getBoundingClientRect();
    const mesh=meshes[id];
    const left=new T.Vector3(-width/2,-height/2,0).applyMatrix4(mesh.matrixWorld).project(camera);
    const right=new T.Vector3(width/2,-height/2,0).applyMatrix4(mesh.matrixWorld).project(camera);
    const centerX=rect.left+((left.x+right.x)/2+1)*rect.width/2;
    const bottom=rect.top+(1-Math.min(left.y,right.y))*rect.height/2;
    label.style.width=Math.min(240,Math.max(180,Math.abs(right.x-left.x)*rect.width/2))+'px';
    label.style.left=Math.max(8,Math.min(centerX-parent.left-label.offsetWidth/2,parent.width-label.offsetWidth-8))+'px';
    label.style.top=(bottom-parent.top+10)+'px';
    label.style.visibility=left.z>1||left.z<-1?'hidden':'';
  }
  // Compact layouts keep every tap in the related-work preview state.
  let tappedProject=null;
  function release(e,cancelled=false){
    pointers.delete(e.pointerId);pinch=null;
    const click=!cancelled&&drag&&drag.id===e.pointerId&&drag.moved<6;
    drag=null;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
    if(click){const h=hit(e);if(h){const id=h.object.userData.id;
      if(compact.matches||(e.pointerType==='touch'&&!hasSelection()&&tappedProject!==id)){tappedProject=id;setHover(id,e);wake();return}
      tappedProject=null;clearHover();onSelect(id);wake();return;
    }else{onBlank()}}
    tappedProject=null;clearHover();wake();
  }
  canvas.onpointerup=e=>release(e);canvas.onpointercancel=e=>release(e,true);canvas.onpointerleave=e=>{if((compact.matches||e.pointerType==='touch')&&tappedProject!==null)return;clearHover();wake()};
  if($('#motion'))$('#motion').onclick=()=>{autoRotate=!autoRotate;updateToggle();wake()};updateToggle();
  reduced.addEventListener('change',()=>{if(reduced.matches)autoRotate=false;updateToggle();wake()});
  document.addEventListener('keydown',e=>{
    if(isPaused()||['INPUT','BUTTON','A','SELECT','TEXTAREA'].includes(document.activeElement.tagName))return;
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home'].includes(e.key))return;
    e.preventDefault();if(e.key==='ArrowLeft')targetYaw-=.2;if(e.key==='ArrowRight')targetYaw+=.2;
    if(['ArrowUp','+','='].includes(e.key))setZoom(targetZoom+.15);
    if(['ArrowDown','-'].includes(e.key))setZoom(targetZoom-.15);
    if(e.key==='Home')setZoom(0);wake();
  });
  compact.addEventListener('change',()=>{if(compact.matches){zoom=targetZoom=0;onZoomOut()}tappedProject=null;clearHover();wake()});
  new ResizeObserver(resize).observe(root);document.addEventListener('visibilitychange',()=>{last=performance.now();wake()});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();$('#error').hidden=false});
  resize();
  return {
    returnToGlobe(){targetYaw=.15;targetPitch=.1;setZoom(0)},
    enter:()=>setZoom(1),refresh:wake,clearConnections:()=>{clearHover();wake()},
    focus(id){if(compact.matches){setHover(id);wake();return}finishIntro();clearHover();targetZoom=maxZoom;group.updateMatrixWorld(true);meshes[id].getWorldPosition(world);world.normalize().negate();let a=Math.atan2(world.x,world.z);while(a-targetYaw>Math.PI)a-=2*Math.PI;while(a-targetYaw<-Math.PI)a+=2*Math.PI;targetYaw=a;targetPitch=Math.asin(T.MathUtils.clamp(world.y,-1,1));wake()}
  };
}

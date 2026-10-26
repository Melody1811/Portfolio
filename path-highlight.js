// Evenly spaced round points with a quiet, repeating variation in size.
export function createPathHighlight(T,points,color){
  const distances=[0];
  for(let i=1;i<points.length;i++)distances.push(distances[i-1]+points[i].distanceTo(points[i-1]));
  const length=distances.at(-1)||0,vertices=[],sizes=[],pathDistances=[];
  const count=Math.max(2,Math.ceil(length/.36));
  let segment=1;
  if(points.length>=2){
    for(let i=0;i<count;i++){
      const d=i*length/count;
      while(segment<points.length-1&&distances[segment]<d)segment++;
      const t=(d-distances[segment-1])/Math.max(.00001,distances[segment]-distances[segment-1]);
      vertices.push(...points[segment-1].clone().lerp(points[segment],t).toArray());
      sizes.push([1.4,1.9,2.5,1.7,1.4,2.2,3.2,2.0][i%8]);
      pathDistances.push(d);
    }
  }
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
  geometry.setAttribute('dotSize',new T.Float32BufferAttribute(sizes,1));
  geometry.setAttribute('pathDistance',new T.Float32BufferAttribute(pathDistances,1));
  const origin={value:0},reach={value:0};
  const material=new T.ShaderMaterial({transparent:true,depthWrite:false,
    uniforms:{introOpacity:{value:1},ink:{value:new T.Color(color)},emphasis:{value:0},pixelRatio:{value:1},revealOrigin:origin,revealReach:reach},
    vertexShader:`
      attribute float dotSize; attribute float pathDistance;
      uniform float pixelRatio; uniform float emphasis; uniform float revealOrigin; uniform float revealReach;
      varying float vEmphasis;
      void main(){
        vec4 view=modelViewMatrix*vec4(position,1.0);
        gl_Position=projectionMatrix*view;
        float reveal=1.0-smoothstep(max(0.0,revealReach-0.3),max(0.001,revealReach),abs(pathDistance-revealOrigin));
        vEmphasis=emphasis*reveal;
        gl_PointSize=(dotSize+0.65*vEmphasis)*pixelRatio*clamp(30.0/max(1.0,-view.z),0.75,1.4);
        if(view.z>=-0.1){gl_Position=vec4(2.0,2.0,2.0,1.0);gl_PointSize=0.0;}
      }`,
    fragmentShader:`
      uniform vec3 ink; uniform float introOpacity; varying float vEmphasis;
      void main(){
        float r=length(gl_PointCoord-vec2(0.5));
        float edge=1.0-smoothstep(0.32,0.5,r);
        if(edge<0.01)discard;
        gl_FragColor=vec4(ink,edge*mix(0.28,0.95,vEmphasis)*introOpacity);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  const path=new T.Points(geometry,material);path.frustumCulled=false;
  // Draw connections before the image layer so dots never overlay card artwork.
  path.renderOrder=-1;
  path.onBeforeRender=renderer=>{material.uniforms.pixelRatio.value=renderer.getPixelRatio()};
  path.userData={active:false,progress:0,strength:0,origin,reach,length};
  path.userData.setSource=position=>{
    if(!points.length)return;
    let nearest=0;
    for(let i=1;i<points.length;i++)if(points[i].distanceToSquared(position)<points[nearest].distanceToSquared(position))nearest=i;
    origin.value=distances[nearest];
  };
  return path;
}
export function setPathHighlight(path,source){
  const state=path.userData;
  if(source&&!state.active){state.setSource(source);state.progress=0;state.reach.value=0;}
  state.active=Boolean(source);
}
export function updatePathHighlight(path,dt,reduced){
  const state=path.userData,target=state.active?1:0;
  const difference=target-state.strength;
  state.strength=reduced||Math.abs(difference)<.001?target:state.strength+difference*(1-Math.exp(-dt*14));
  if(Math.abs(target-state.strength)<.001)state.strength=target;
  if(state.active)state.progress=reduced?1:Math.min(1,state.progress+dt/.75);
  const eased=1-Math.pow(1-state.progress,2);
  state.reach.value=eased*(Math.max(state.origin.value,state.length-state.origin.value)+.3);
  path.material.uniforms.emphasis.value=state.strength;
  return Math.abs(target-state.strength)>.001||(state.active&&state.progress<1);
}

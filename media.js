import {texture as sampleTexture} from './art.js?v=focus-1';
const root='assets/photos/';
const ver='?v=gallery-5';
const media={
  "Common Space": {"image": "senavian2.gif", "gif": true},
  "Field Notes": {"image": "senavian3.gif", "gif": true},
  "Soft Signal": {"image": "clown2.gif", "background": "#000", "gif": true},
  "Open Archive": {"image": "guide.gif", "gif": true},
  "Near & Far": {"image": "senavian4.gif", "gif": true},
  "Fold / Form": {"image": "stool.gif", "gif": true},
  "Variable Voices": {"image": "kreaton0.gif", "gif": true},
  "Still Studio": {"image": "Girlcard.gif", "gif": true},
  "Modular Objects": {"image": "Red-tube1.gif", "gif": true},
  "Chromatic Loops": {"image": "loopit-logo.gif", "background": "#000", "gif": true},
  "Quiet Cities": {"image": "stool2.gif", "gif": true},
  "Kinetic Studies": {"image": "yurta.gif", "gif": true},
  "Play / Practice": {"image": "Tubes3.gif", "gif": true},
  "Margin Journal": {"image": "noob-main.gif", "gif": true},
  "Digital Garden": {"image": "loopit.gif", "gif": true},
  "Fluid Fields": {"image": "subme-gallery.gif", "gif": true},
  "Poster Study": {"image": "poster1.gif", "gif": true},
  "Binary Cards": {"image": "vtb-cards.gif", "gif": true}
};
function loadImage(src){
  return new Promise((resolve,reject)=>{
    const img=new Image();
    img.onload=()=>resolve(img);
    img.onerror=reject;
    img.src=src;
  });
}
async function loadFirstAvailable(paths){
  for(const p of paths){
    try{return await loadImage(encodeURI(p)+ver);}catch{}
  }
  throw new Error('Media not found');
}
export async function projectMedia(T,project){
  const entry=media[project.name];if(!entry)return sampleTexture(T,project);
  let image;
  try{
    const paths=entry.candidates||[root+entry.image,entry.image,root+'noob/'+entry.image];
    image=await loadFirstAvailable(paths);
  }catch{
    return sampleTexture(T,project);
  }
  const canvas=document.createElement('canvas');canvas.width=720;canvas.height=460;
  const ctx=canvas.getContext('2d');
  const blurred=document.createElement('canvas');blurred.width=360;blurred.height=230;
  const blurCtx=blurred.getContext('2d');
  const texture=new T.CanvasTexture(canvas),blurredTexture=new T.CanvasTexture(blurred);
  texture.colorSpace=blurredTexture.colorSpace=T.SRGBColorSpace;
  function draw(source,sw,sh){
    const w=sw||source.videoWidth||source.naturalWidth||source.displayWidth||source.codedWidth,h=sh||source.videoHeight||source.naturalHeight||source.displayHeight||source.codedHeight;
    if(!w||!h)return;
    // One scale factor preserves proportions. Center cropping matches CSS object-fit:cover.
    const scale=Math.max(canvas.width/w,canvas.height/h);
    ctx.fillStyle=entry.background||'#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(source,(canvas.width-w*scale)/2,(canvas.height-h*scale)/2,w*scale,h*scale);
    texture.needsUpdate=true;
  }
  function blur(){
    blurCtx.fillStyle='#fff';blurCtx.fillRect(0,0,360,230);
    blurCtx.filter='blur(10px)';blurCtx.drawImage(canvas,-10,-10,380,250);blurCtx.filter='none';blurredTexture.needsUpdate=true;
  }
  draw(image);blur();
  let video=null,last=-Infinity,lastBlur=-Infinity,gifState=null;
  if(entry.gif&&typeof ImageDecoder!=='undefined'){
    gifState={decoder:null,frameIndex:0,nextFrameTime:0,busy:false};
    fetch(image.src).then(r=>r.arrayBuffer()).then(buf=>{
      const dec=new ImageDecoder({data:buf,type:'image/gif'});
      return dec.tracks.ready.then(()=>{gifState.decoder=dec});
    }).catch(()=>{});
  }
  if(entry.video){video=document.createElement('video');video.muted=true;video.loop=true;video.playsInline=true;video.preload='auto';video.src=root+entry.video;}
  return {texture,blurredTexture,background:entry.background||'#fff',url:image.src,videoUrl:entry.video?root+entry.video:null,video,gif:Boolean(entry.gif),
    update(time,needsBlur){
      if(gifState?.decoder&&!gifState.busy&&time>=gifState.nextFrameTime){
        const track=gifState.decoder.tracks.selectedTrack;
        const count=track.frameCount||1;
        gifState.busy=true;
        gifState.decoder.decode({frameIndex:gifState.frameIndex}).then(({image:frame})=>{
          const dur=(frame.duration||80000)/1000;
          draw(frame,frame.displayWidth,frame.displayHeight);
          frame.close();
          if(needsBlur&&time-lastBlur>125){blur();lastBlur=time;}
          gifState.frameIndex=(gifState.frameIndex+1)%count;
          gifState.nextFrameTime=time+Math.max(33,dur);
          gifState.busy=false;
        }).catch(()=>{gifState.busy=false;gifState.nextFrameTime=time+100});
        return;
      }
      if(!video||video.paused||video.readyState<2||time-last<1000/24)return;
      draw(video);last=time;if(needsBlur&&time-lastBlur>125){blur();lastBlur=time;}
    }
  };
}

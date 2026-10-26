import * as T from './vendor/three.module.js';
import {projectMedia} from './media.js?v=media-refresh-12';
const $=s=>document.querySelector(s);
import {projects,categories,sharedCategories} from './projects.js?v=descriptions-10';
import {initCaseStudies} from './case-view.js?v=15';
const reduced=matchMedia('(prefers-reduced-motion: reduce)');let selected=null,engine=null;

const assets=await Promise.all(projects.map(p=>projectMedia(T,p)));
await document.fonts.ready;
const indexVideos=[];
let currentView='spatial';
function syncMedia(){
  const active=!document.hidden&&!reduced.matches&&!$('#info').open&&!$('#contact-dialog').open;
  for(const [videos,view] of [[assets.map(a=>a.video).filter(Boolean),'spatial'],[indexVideos,'index']]){
    for(const video of videos){if(active&&currentView===view)video.play().then(()=>engine?.refresh()).catch(()=>{});else video.pause();}
  }
  engine?.refresh();
}
document.addEventListener('visibilitychange',syncMedia);reduced.addEventListener('change',syncMedia);
$('#info').addEventListener('close',syncMedia);
$('#contact-dialog').addEventListener('close',syncMedia);
$('#contact').onclick=()=>{$('#contact-dialog').showModal();syncMedia()};
$('#contact-close').onclick=()=>$('#contact-dialog').close();
let emailCopyTimer;
$('.contact-email').onclick=async()=>{
  clearTimeout(emailCopyTimer);
  const status=$('#email-copy-status');
  try{
    await navigator.clipboard.writeText('aysamaeva@gmail.com');
    status.textContent='скопировано';
    emailCopyTimer=setTimeout(()=>{status.textContent=''},2500);
  }catch{status.textContent='не удалось скопировать';}
};
$('#contact-dialog').addEventListener('close',()=>{clearTimeout(emailCopyTimer);$('#email-copy-status').textContent=''});
syncMedia();
function setView(view){
  if(view===currentView)return;
  currentView=view;const isIndex=view==='index';
  $('#experience').classList.toggle('is-index',isIndex);
  $('#index-view').inert=!isIndex;$('#index-view').setAttribute('aria-hidden',String(!isIndex));
  $('#spatial-view').inert=isIndex;$('#spatial-view').setAttribute('aria-hidden',String(isIndex));
  $('#index-open').setAttribute('aria-pressed',String(isIndex));$('#spatial').setAttribute('aria-pressed',String(!isIndex));
  if(isIndex){closeProject();dismissLoading();}
  engine?.clearConnections();syncMedia();engine?.refresh();
}
$('.segments').addEventListener('keydown',e=>{
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
  e.preventDefault();const view=e.key==='Home'?'index':e.key==='End'?'spatial':currentView==='index'?'spatial':'index';
  navigateView(view);$(view==='index'?'#index-open':'#spatial').focus();
});
const navigateView=initCaseStudies(setView);
$('#index-open').onclick=()=>navigateView('index');$('#spatial').onclick=()=>navigateView('spatial');$('#info-open').onclick=()=>{$('#info').showModal();syncMedia()};$('#info-close').onclick=()=>$('#info').close();
function select(id,keyboard=false){
  if(matchMedia('(max-width: 1024px), (hover: none) and (pointer: coarse)').matches){engine?.focus(id);return}
  selected=id;const p=projects[id];
  $('#project-title').textContent=p.title||p.name;$('#project-description').textContent=p.desc||'';
  $('#project-navigation').hidden=false;$('#project-detail').hidden=false;$('#experience').classList.add('has-selection');$('#spatial-view').inert=false;
  engine?.focus(id);syncMedia();if(keyboard)$('#close-project').focus();
}
function closeProject(){
  $('#project-navigation').hidden=true;$('#project-detail').hidden=true;selected=null;$('#experience').classList.remove('has-selection');
  $('#spatial-view').inert=currentView!=='spatial';engine?.clearConnections();syncMedia();
}
// The globe distinguishes project hits from blank space; other outside clicks dismiss.
document.addEventListener('pointerdown',e=>{
  if(selected===null||e.button!==0||e.target.closest('#project, #scene, #project-navigation')||$('#info').open||$('#contact-dialog').open)return;
  closeProject();
},true);
$('#close-project').onclick=()=>{closeProject();$('#spatial').focus()};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&selected!==null&&!$('#info').open&&!$('#contact-dialog').open){closeProject();$('#spatial').focus()}});

import {createGlobe} from './globe.js?v=touch-caption-5';
try {
  engine=createGlobe({T,root:$('#scene'),assets,projects,categories,reduced,onIntroComplete:dismissLoading,onSelect:select,onBlank:closeProject,hasSelection:()=>selected!==null,isPaused:()=>currentView!=='spatial'||$('#info').open||$('#contact-dialog').open||selected!==null,onZoomOut:()=>{if(selected!==null)closeProject()}});
  $('#info').addEventListener('close',()=>engine.refresh());
  revealSite();
} catch(error) {
  console.error(error);$('#error').hidden=false;revealSite();dismissLoading();
}

function revealSite(){
  $('#experience').classList.replace('is-loading','is-ready');
  $('#experience').setAttribute('aria-busy','false');
}

function dismissLoading(){
  const loading=$('#loading');
  loading.classList.add('is-finished');
  setTimeout(()=>{loading.hidden=true},reduced.matches?0:450);
}

$('#project-return').onclick=()=>{closeProject();engine?.returnToGlobe();$('#spatial').focus({preventScroll:true})};
$('#project-next').onclick=()=>{
  const candidates=projects.filter(p=>p.id!==selected);
  if(candidates.length)select(candidates[Math.floor(Math.random()*candidates.length)].id);
};

// Preload alternate portraits so hover changes never move or empty the photo frame.
const infoPhotos=new Map();
for(const [key,alt] of [['practice','Minimal white sculpture in soft light'],['learning','Figure casting a long shadow across pale sand'],['place','Fog-softened beach and horizon']]){
  const image=new Image();image.className='info-photo-swap';image.src='assets/photos/info-'+key+'.jpg';image.alt=alt;image.setAttribute('aria-hidden','true');
  $('.info-portrait-frame').append(image);infoPhotos.set(key,image);
}
function showInfoPhoto(key){
  for(const [name,image] of infoPhotos){const active=name===key;image.classList.toggle('is-active',active);image.setAttribute('aria-hidden',String(!active))}
  $('.info-portrait').setAttribute('aria-hidden',String(Boolean(key)));
}
for(const keyword of document.querySelectorAll('.info-keyword')){
  keyword.addEventListener('pointerenter',()=>showInfoPhoto(keyword.dataset.photo));
  keyword.addEventListener('pointerleave',()=>showInfoPhoto(null));
  keyword.addEventListener('focus',()=>showInfoPhoto(keyword.dataset.photo));
  keyword.addEventListener('blur',()=>showInfoPhoto(null));
}
$('#info').addEventListener('close',()=>showInfoPhoto(null));

// Only dismiss genuine backdrop clicks, not clicks or text selections inside.
for(const dialog of [$('#info'),$('#contact-dialog')]){
  let startedOutside=false;
  const outside=e=>{const r=dialog.getBoundingClientRect();return e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom};
  dialog.addEventListener('pointerdown',e=>{startedOutside=e.button===0&&outside(e)});
  dialog.addEventListener('pointercancel',()=>{startedOutside=false});
  dialog.addEventListener('click',e=>{if(startedOutside&&outside(e))dialog.close();startedOutside=false});
}

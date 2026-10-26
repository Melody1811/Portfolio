import {caseStudies} from './case-studies.js?v=10';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const SHORT_WORDS=/(^|[\s(\u00A0«"'])(а|в|во|и|к|ко|о|об|обо|с|со|у|я|на|по|из|изо|за|от|до|но|да|не|ни|то|он|мы|вы|им|ей|их|её|его|ему|них|ней|нём|для|под|над|при|про|без|или|что|как|так|где|кто|чем|кем|всё|все|вся|всю|это|эти|эту|три|два|две|раз|моя|моё|мои|мой|сам|уже|ещё|вот|между|через|перед|среди|после|кроме|около|вокруг|когда|чтобы|прежде|\d+)\s+/giu;
const typo=s=>{
 let r=escape(s).replace(/^—\s+/u,'—\u00A0').replace(/\s+—/gu,'\u00A0—').replace(/\s+(же|бы|ли|ж|б)(?=[\s.,;:!?»)"']|$)/giu,'\u00A0$1');
 for(let i=0;i<3;i++)r=r.replace(SHORT_WORDS,'$1$2\u00A0');
 return r;
};
export function initCaseStudies(setView){
 const root=document.querySelector('#index-view');let indexScroll=0,lastCase=false;
 const media=m=>m.type==='video'?`<video controls playsinline preload="metadata" aria-label="${escape(m.alt)}" src="${escape(m.src)}"></video>`:`<img class="${m.narrow?'case-img-narrow':''}${m.rounded?' case-img-rounded':''}" src="${escape(m.src)}" alt="${escape(m.alt)}" width="${m.width}" height="${m.height}" loading="${m.eager?'eager':'lazy'}"${m.eager?' fetchpriority="high"':''} decoding="async">`;
 const renderBlock=b=>{
  if(b.type==='image')return `<figure class="case-figure${b.narrow?' is-narrow':''}${b.rounded?' is-rounded':''}">${media(b)}</figure>`;
  if(b.type==='text-group')return `<div class="case-text-group">${b.items.map(it=>`<section class="case-text-item${(it.spaced||(!it.compact&&!it.spacedLast&&it.paragraphs&&it.paragraphs.length>2))?' has-spaced-paragraphs':''}"><h2>${typo(it.heading)}</h2>${(it.paragraphs||[]).map((t,idx)=>`<p${it.spacedLast&&idx===it.paragraphs.length-1?' class="case-p-spaced"':''}>${typo(t)}</p>`).join('')}${it.list?`<ul class="case-list">${it.list.map(li=>`<li>${typo(li)}</li>`).join('')}</ul>`:''}</section>`).join('')}</div>`;
  if(b.type==='section')return `<section class="case-section"><div class="case-section-head"><h2>${typo(b.heading)}</h2>${(b.paragraphs||[]).map(t=>`<p>${typo(t)}</p>`).join('')}</div>${b.image?`<figure class="case-figure${b.image.rounded?' is-rounded':''}">${media(b.image)}</figure>`:''}${b.footer?`<div class="case-section-foot">${(b.footer.paragraphsBefore||[]).map(t=>`<p>${typo(t)}</p>`).join('')}${b.footer.list?`<ul class="case-list">${b.footer.list.map(li=>`<li>${typo(li)}</li>`).join('')}</ul>`:''}${(b.footer.paragraphsAfter||[]).map(t=>`<p>${typo(t)}</p>`).join('')}</div>`:''}</section>`;
  if(b.type==='competitors')return `<section class="case-competitors-block">${b.image?`<figure class="case-figure">${media(b.image)}</figure>`:`<div class="case-competitors-grid">${(b.items||[]).map(c=>`<div class="case-competitor-card"><img src="${escape(c.icon)}" alt="${escape(c.name)}" width="55" height="61" loading="lazy"><h3>${typo(c.name)}</h3><p>${typo(c.text)}</p></div>`).join('')}</div>`}<div class="case-hypothesis-copy">${b.summary.map(t=>`<p>${typo(t)}</p>`).join('')}</div></section>`;
  if(b.type==='vimeo')return `<section class="case-vimeo-section"><div class="case-vimeo-embed"><iframe src="${escape(b.embedUrl)}" title="${escape(b.title||'Vimeo video player')}" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media" allowfullscreen loading="lazy"></iframe></div></section>`;
  if(b.type==='stack')return `<div class="case-stack">${b.images.map(img=>`<figure class="case-figure${img.rounded?' is-rounded':''}">${media(img)}</figure>`).join('')}</div>`;
  if(b.type==='split')return `<section class="case-split-section"><figure class="case-figure case-split-left">${media(b.left)}</figure><figure class="case-figure case-split-right">${media(b.right)}</figure></section>`;
  if(b.type==='moods')return `<section class="case-moods-section"><h2 class="case-centered-heading">${typo(b.heading)}</h2><figure class="case-figure">${media(b.image)}</figure></section>`;
  return '';
 };
 function render(){
  const hash=location.hash, p=caseStudies.find(p=>!p.comingSoon&&hash==='#project/'+p.id);
  const isIndex=hash==='#work'||hash==='#index'||Boolean(p);
  if(!lastCase)indexScroll=root.scrollTop;
  root.querySelectorAll('video').forEach(v=>v.pause());
  setView(isIndex?'index':'spatial');
  if(p){
   const facts=[['Тип проекта',p.category],...(p.year?[['Год',p.year]]:[])];
   const body=p.blocks?`<div class="case-blocks">${p.blocks.map(renderBlock).join('')}</div>`:`<div class="case-gallery">${p.images.map(media).join('')}</div>`;
   root.innerHTML=`<a class="case-back" href="#work"><svg class="case-nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 3 5 8l5 5"/></svg><span>All projects</span></a><article class="case-page"><div class="case-introduction"><h1 id="index-heading" tabindex="-1">${typo(p.caseTitle||p.title)}</h1><p>${typo(p.overview||p.description)}</p>${p.toolUrl?`<a class="case-tool" href="${escape(p.toolUrl)}" target="_blank" rel="noopener noreferrer"><span>Try the interactive tool</span><svg class="case-nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12 12 4M4 4h8v8"/></svg></a>`:''}</div><dl class="case-facts">${facts.map(([k,v])=>`<div><dt>${typo(k)}</dt><dd>${typo(v)}</dd></div>`).join('')}</dl>${body}<button type="button" class="case-back case-bottom"><svg class="case-nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10 8 5l5 5"/></svg><span>Back to top</span></button></article>`;
   root.querySelector('.case-bottom').onclick=()=>{root.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});root.querySelector('#index-heading').focus({preventScroll:true})};
   root.scrollTop=0;
  }else{
   root.innerHTML=`<div class="index-heading-row"><h1 id="index-heading" tabindex="-1">Избранные работы <span>(01—06)</span></h1><p>Visual design, creative code, ux/ui and motion</p></div><div id="index-grid">${caseStudies.map((p,i)=>`<a class="index-card${p.comingSoon?' is-coming-soon':''}" href="${p.comingSoon?'#work':'#project/'+p.id}"${p.comingSoon?' aria-disabled="true"':''}><div class="index-image"><img class="project-thumbnail" src="${escape(p.image)}" alt="${escape(p.images[0].alt)}" width="${p.images[0].width||1306}" height="${p.images[0].height||1047}" loading="eager" fetchpriority="${i<3?'high':'auto'}" decoding="async"></div><div class="project-meta"><h2 class="project-name">${typo(p.title)}</h2><span class="project-number">${String(i+1).padStart(2,'0')}</span></div><p class="project-summary">${typo(p.description)}</p>${p.comingSoon?'<span class="coming-soon-pill" role="status">Скоро\u00A0будет</span>':''}</a>`).join('')}</div><footer class="index-coming-soon"><p>Больше проектов скоро</p></footer>`;
   root.querySelectorAll('.index-card.is-coming-soon').forEach(card=>{
    let timer;
    const move=e=>{
     const r=card.getBoundingClientRect();
     card.style.setProperty('--pill-x',`${e.clientX-r.left}px`);
     card.style.setProperty('--pill-y',`${e.clientY-r.top}px`);
    };
    card.addEventListener('pointerenter',move);
    card.addEventListener('pointermove',move);
    card.addEventListener('pointerdown',move);
    card.addEventListener('click',e=>{
     e.preventDefault();
     if(e.clientX||e.clientY)move(e);
     clearTimeout(timer);
     card.classList.add('is-active');
     timer=setTimeout(()=>card.classList.remove('is-active'),2200);
    });
    card.addEventListener('pointerleave',()=>{clearTimeout(timer);card.classList.remove('is-active')});
   });
   root.scrollTop=lastCase?indexScroll:0;
  }
  document.title=p?`${p.caseTitle||p.title} — AYSA`:'AYSA — Portfolio';
  if(isIndex&&lastCase!==Boolean(p))root.querySelector('#index-heading').focus({preventScroll:true});
  lastCase=Boolean(p);
 }
 window.addEventListener('hashchange',render);render();
 return view=>{const hash=view==='index'?'#work':'#spatial';if(location.hash===hash)render();else location.hash=hash};
}

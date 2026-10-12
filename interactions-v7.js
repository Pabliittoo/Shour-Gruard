(() => {
  'use strict';
  const root = document.documentElement;
  const text = JSON.parse(document.querySelector('#ui-copy').textContent);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  document.addEventListener('keydown', event => { if (event.key === 'Tab') root.dataset.input = 'keyboard'; }, true);
  document.addEventListener('pointerdown', () => { root.dataset.input = 'pointer'; }, true);
  const finishIntro = () => {
    root.classList.remove('intro-playing');
    document.querySelector('.splash').inert = true;
    try { sessionStorage.setItem('shore-intro', 'seen'); } catch {}
  };
  document.querySelector('#skip-intro').addEventListener('click', finishIntro);
  document.addEventListener('keydown', event => { if(root.classList.contains('intro-playing')) finishIntro(); }, {once:true});
  if (root.classList.contains('intro-playing')) setTimeout(finishIntro, reduce.matches ? 350 : 1100);
  else finishIntro();

  const themes = document.querySelectorAll('[data-set-theme]');
  function setTheme(theme) {
    root.dataset.theme = theme === 'ocean' ? 'ocean' : 'sand';
    const hero=document.querySelector('#hero-image');if(hero){const src='/assets/shore-guard-brand/hero-'+root.dataset.theme+'.webp';if(hero.getAttribute('src')!==src)hero.src=src;}
    document.querySelector('meta[name="theme-color"]').content = root.dataset.theme === 'ocean' ? '#0B1F33' : '#F6F2EB';
    themes.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.setTheme === root.dataset.theme)));
    try { localStorage.setItem('shore-theme',root.dataset.theme); } catch {}
  }
  setTheme(root.dataset.theme);
  themes.forEach(b => b.addEventListener('click', () => setTheme(b.dataset.setTheme)));
  const languageTrigger=document.querySelector('#language-trigger');
  const languagePanel=document.querySelector('#language-panel');
  function closeLanguage(returnFocus=false){
    const wasOpen=languageTrigger.getAttribute('aria-expanded')==='true';
    languageTrigger.setAttribute('aria-expanded','false');languagePanel.classList.remove('open');languagePanel.inert=true;
    if(wasOpen&&returnFocus)languageTrigger.focus();
  }
  languageTrigger.addEventListener('click',()=>{
    const open=languageTrigger.getAttribute('aria-expanded')!=='true';
    languageTrigger.setAttribute('aria-expanded',String(open));languagePanel.classList.toggle('open',open);languagePanel.inert=!open;
  });
  languageTrigger.addEventListener('keydown',event=>{
    if(event.key==='ArrowDown'){event.preventDefault();languageTrigger.setAttribute('aria-expanded','true');languagePanel.classList.add('open');languagePanel.inert=false;languagePanel.querySelector('a').focus();}
  });
  document.addEventListener('click',event=>{if(!event.target.closest('.language'))closeLanguage();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeLanguage(true);});
  document.addEventListener('focusin',event=>{if(!event.target.closest('.language'))closeLanguage();});
  document.querySelectorAll('a[data-lang]').forEach(a => a.addEventListener('click', () => {
    try { localStorage.setItem('shore-language',a.dataset.lang); } catch {}
  }));

  const menu = document.querySelector('.menu'), nav = document.querySelector('#nav');
  const mobile = matchMedia('(max-width:1050px)');
  function closeMenu(focus = false) {
    const open = nav.classList.contains('open');
    nav.classList.remove('open'); nav.inert = mobile.matches;
    menu.setAttribute('aria-expanded','false'); menu.setAttribute('aria-label',text.menu);
    if (open && focus) menu.focus();
  }
  closeMenu();
  menu.addEventListener('click', () => {
    const open = nav.classList.toggle('open'); nav.inert = !open && mobile.matches;
    menu.setAttribute('aria-expanded',String(open)); menu.setAttribute('aria-label',open ? text.menuClose : text.menu);
  });
  mobile.addEventListener('change', () => closeMenu());
  document.addEventListener('keydown', e => { if(e.key==='Escape') closeMenu(true); });
  document.addEventListener('click', e => { if(!e.target.closest('header')) closeMenu(); });
  const header = document.querySelector('header');
  const updateHeader=()=>header.classList.toggle('scrolled',scrollY>30);
  addEventListener('scroll',updateHeader,{passive:true});updateHeader();

  // Native details remain usable without JS. Height transitions reverse from the visible height.
  document.querySelectorAll('.questions details').forEach(details => {
    const summary = details.querySelector('summary'), answer = details.querySelector('.answer');
    let expanded = details.open;
    details.dataset.expanded = String(expanded);
    summary.setAttribute('aria-expanded',String(expanded));
    answer.style.height = expanded ? 'auto' : '0px';
    answer.style.opacity = expanded ? '1' : '0';
    let timer;
    function settle() {
      clearTimeout(timer);
      details.open = expanded;
      answer.style.height = expanded ? 'auto' : '0px';
    }
    summary.addEventListener('click', event => {
      event.preventDefault();clearTimeout(timer);
      const height = details.open ? answer.getBoundingClientRect().height : 0;
      expanded = !expanded;
      details.dataset.expanded = String(expanded);
      summary.setAttribute('aria-expanded',String(expanded));
      details.open = true;
      answer.style.height = `${height}px`;
      void answer.offsetHeight;
      answer.style.height = expanded ? `${answer.scrollHeight}px` : '0px';
      answer.style.opacity = expanded ? '1' : '0';
      if (event.detail===0 || reduce.matches) settle();
      else timer = setTimeout(settle,220);
    });
    answer.addEventListener('transitionend', e => {if(e.propertyName==='height')settle();});
  });

  const nativeTransitions='onpageswap' in window && CSS.supports('view-transition-name: root');
  document.addEventListener('click',event=>{
    const a=event.target.closest('a[href]');
    if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||!a||a.target||a.hasAttribute('download'))return;
    const dest=new URL(a.href,location.href);
    if(dest.origin!==location.origin||dest.hash||dest.href===location.href)return;
    root.classList.add('navigating');closeMenu();closeLanguage();
    if(nativeTransitions||event.detail===0||reduce.matches)return;
    event.preventDefault();root.classList.add('page-leaving');setTimeout(()=>location.assign(dest.href),160);
  });
  addEventListener('pageshow',()=>root.classList.remove('page-leaving','navigating'));
  document.addEventListener('visibilitychange',()=>root.classList.toggle('tab-hidden',document.hidden));
  const cards = [...document.querySelectorAll('.work-card[data-category]')];
  const filterStatus = document.querySelector('#filter-status');
  let filterTimer,filterGeneration=0;
  const workGrid=document.querySelector('.work-grid');
  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
    const generation=++filterGeneration;clearTimeout(filterTimer);
    document.querySelectorAll('[data-filter]').forEach(b => {b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});
    const apply=()=>{
      if(generation!==filterGeneration)return;
      cards.forEach(card=>{card.hidden=button.dataset.filter!=='all'&&card.dataset.category!==button.dataset.filter;if(!card.hidden)card.classList.add('revealed');});
      filterStatus.textContent=`${text.count}: ${cards.filter(c=>!c.hidden).length}`;
      requestAnimationFrame(()=>{if(generation===filterGeneration)workGrid.classList.remove('filter-leaving');});
    };
    if(reduce.matches){workGrid.classList.remove('filter-leaving');apply();}
    else{workGrid.classList.add('filter-leaving');filterTimer=setTimeout(apply,180);}
  }));
  const dialog = document.querySelector('#gallery-dialog');
  if(dialog){
    let current=0,album=0,token=0;
    const img=dialog.querySelector('#dialog-image'),video=dialog.querySelector('#dialog-video'),stage=dialog.querySelector('.gallery-stage');
    const caption=dialog.querySelector('#dialog-caption');
    async function show(index){
      const a=text.albums[album],total=a.photos.length+(a.video?1:0),ticket=++token;
      current=(index+total)%total;const selected=current,isVideo=selected===a.photos.length;
      video.pause();stage.classList.add('switching');
      const ready=isVideo?Promise.resolve():new Promise(resolve=>{const preload=new Image();preload.onload=preload.onerror=resolve;preload.src=a.photos[selected];});
      await Promise.all([ready,new Promise(resolve=>setTimeout(resolve,reduce.matches?0:160))]);
      if(ticket!==token)return;
      img.hidden=isVideo;video.hidden=!isVideo;
      if(isVideo){video.src=a.video;video.poster=a.cover;video.load();}else{video.removeAttribute('src');video.load();img.src=a.photos[selected];img.alt=a.title+' — '+text.photo+' '+(selected+1);}
      caption.textContent=`${a.title} · ${selected+1} / ${total}`;
      requestAnimationFrame(()=>stage.classList.remove('switching'));
    }
    document.querySelectorAll('[data-album]').forEach(b=>b.addEventListener('click',()=>{album=Number(b.dataset.album);dialog.showModal();show(0);}));
    dialog.addEventListener('close',()=>{++token;video.pause();video.removeAttribute('src');video.load();});
    dialog.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',event => {if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
    function step(direction){show(current+direction);}
    dialog.querySelectorAll('[data-gallery-step]').forEach(b=>b.addEventListener('click',()=>step(Number(b.dataset.galleryStep))));
    dialog.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();step(1);}if(e.key==='ArrowLeft'){e.preventDefault();step(-1);}});
  }
  document.querySelectorAll('img').forEach(img=>img.addEventListener('error',()=>img.classList.add('image-unavailable')));

  if(!reduce.matches && 'IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('revealed');observer.unobserve(entry.target);}}),{threshold:0.08,rootMargin:'0px 0px -24px 0px'});
    document.querySelectorAll('.story-grid,.section-top,.home-services>a,.service,.work-card,.cta-inner,.methods-list article,.process-list article,.questions details,.note-panel,.contact-info,form,.benefit-bar>span').forEach(el=>{el.classList.add('reveal');observer.observe(el);});
    reduce.addEventListener('change',event=>{if(event.matches){observer.disconnect();document.querySelectorAll('.reveal').forEach(el=>el.classList.add('revealed'));}});
  }
  const form = document.querySelector('#inquiry');
  if(form){
    const status=document.querySelector('#form-status'),download=document.querySelector('#download');
    let draft='';
    form.addEventListener('input', e => {draft='';download.hidden=true;status.textContent='';delete status.dataset.state;e.target.removeAttribute('aria-invalid');});
    form.addEventListener('submit',e=>{
      e.preventDefault();const data=new FormData(form);const name=String(data.get('name')).trim(),contact=String(data.get('contact')).trim(),digits=contact.replace(/\D/g,'');
      const valid=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)||(/^[+()\d\s-]+$/.test(contact)&&digits.length>=9&&digits.length<=15);
      form.elements.name.setAttribute('aria-invalid',String(!name));form.elements.contact.setAttribute('aria-invalid',String(!valid));
      if(!name||!valid){status.dataset.state='error';status.textContent=!name?text.errorName:text.errorContact;(!name?form.elements.name:form.elements.contact).focus();return;}
      draft=`SHORE GUARD\n${text.name}: ${name}\n${text.contact}: ${contact}\n${text.service}: ${data.get('service')}\n${text.message}: ${data.get('message')}`;
      status.dataset.state='success';status.textContent=text.success;download.hidden=false;
    });
    download.addEventListener('click',()=>{if(!draft)return;const url=URL.createObjectURL(new Blob(['\ufeff'+draft],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='shore-guard-enquiry.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
  }
})();

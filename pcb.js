// Shared PCB 3D viewer — preview cards + project detail page.
(function (root) {
  'use strict';

  /* ── tiny mesh helper ─────────────────────────────────────────── */
  function mesh(geo, opts, pos, rotY) {
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial(opts));
    if (pos) m.position.set(pos[0], pos[1], pos[2]);
    if (rotY !== undefined) m.rotation.y = rotY;
    m.castShadow = true;
    return m;
  }

  function addComp(group, c, y0) {
    switch (c.t) {
      case 'ic': {
        const cw = c.w||0.4, ch=c.h||0.06, cd=c.d||0.4;
        group.add(mesh(new THREE.BoxGeometry(cw,ch,cd),{color:c.col||0x1e1e1e,roughness:0.75},[c.x,y0+ch/2,c.z]));
        group.add(mesh(new THREE.CylinderGeometry(0.022,0.022,0.005,8),{color:0xd4a830,metalness:0.7},
          [c.x-cw/2+0.08,y0+ch+0.001,c.z-cd/2+0.08]));
        break;
      }
      case 'cap': {
        const r=c.r||0.09, ch=c.h||0.3;
        group.add(mesh(new THREE.CylinderGeometry(r,r,ch,20),{color:c.col||0x1c1c3a,roughness:0.5},[c.x,y0+ch/2,c.z]));
        group.add(mesh(new THREE.CylinderGeometry(r*0.82,r*0.82,0.008,20),{color:0x999999,metalness:0.6},[c.x,y0+ch+0.003,c.z]));
        break;
      }
      case 'res': {
        const rw=c.w||0.13, rh=0.065, rd=c.d||0.065;
        group.add(mesh(new THREE.BoxGeometry(rw,rh,rd),{color:c.col||0x8a7050,roughness:0.85},[c.x,y0+rh/2,c.z]));
        [-rw/2-0.015,rw/2+0.015].forEach(ox=>
          group.add(mesh(new THREE.BoxGeometry(0.025,rh*0.85,rd*0.85),{color:0xbbbbbb,metalness:0.7},[c.x+ox,y0+rh/2,c.z])));
        break;
      }
      case 'conn': {
        const cw=c.w||0.28, ch=c.h||0.18, cd=c.d||0.18;
        group.add(mesh(new THREE.BoxGeometry(cw,ch,cd),{color:c.col||0xf0f0f0,roughness:0.9},[c.x,y0+ch/2,c.z]));
        const pins=Math.max(2,Math.round(cw/0.1)), step=cw/pins;
        for(let i=0;i<pins;i++)
          group.add(mesh(new THREE.CylinderGeometry(0.022,0.022,ch+0.01,8),{color:0x111111},
            [c.x-cw/2+step/2+i*step,y0+ch/2,c.z]));
        break;
      }
      case 'mosfet': {
        group.add(mesh(new THREE.BoxGeometry(0.22,0.28,0.12),{color:0x111111,roughness:0.8},[c.x,y0+0.14,c.z]));
        group.add(mesh(new THREE.BoxGeometry(0.22,0.055,0.04),{color:0x888888,metalness:0.65},[c.x,y0+0.27,c.z-0.07]));
        [-0.06,0,0.06].forEach(ox=>
          group.add(mesh(new THREE.BoxGeometry(0.022,0.11,0.022),{color:0xcccccc,metalness:0.8},[c.x+ox,y0-0.055,c.z])));
        break;
      }
      case 'inductor': {
        for(let i=0;i<5;i++){
          const ring=mesh(new THREE.TorusGeometry(0.07,0.017,8,18),
            {color:0xc8952d,metalness:0.7,roughness:0.3},[c.x,y0+0.07,c.z+(i-2)*0.04]);
          ring.rotation.x=Math.PI/2; group.add(ring);
        }
        break;
      }
      case 'led':
        group.add(mesh(new THREE.CylinderGeometry(0.055,0.048,0.11,16),
          {color:c.col||0xff2200,roughness:0.25,transparent:true,opacity:0.88},[c.x,y0+0.11,c.z]));
        break;
      case 'crystal':
        group.add(mesh(new THREE.BoxGeometry(0.13,0.055,0.075),
          {color:0xd4b030,metalness:0.8,roughness:0.3},[c.x,y0+0.03,c.z]));
        break;
    }
  }

  function buildBoard(group, cfg) {
    const bw=cfg.w, bh=cfg.h, y0=0.04;
    group.add(mesh(new THREE.BoxGeometry(bw,0.07,bh),{color:0x1a5218,roughness:0.65,metalness:0.08}));
    group.add(mesh(new THREE.BoxGeometry(bw-0.08,0.006,bh-0.08),{color:0xb58c28,roughness:0.35,metalness:0.8},[0,0.038,0]));
    const hg=new THREE.CylinderGeometry(0.07,0.07,0.1,16);
    [[-bw/2+0.2,-bh/2+0.2],[bw/2-0.2,-bh/2+0.2],[-bw/2+0.2,bh/2-0.2],[bw/2-0.2,bh/2-0.2]]
      .forEach(([x,z])=>group.add(mesh(hg,{color:0x0d0d0d},[x,0,z])));
    (cfg.traces||[]).forEach(t=>{
      const len=Math.hypot(t.x2-t.x1,t.z2-t.z1);
      const ang=Math.atan2(t.z2-t.z1,t.x2-t.x1);
      group.add(mesh(new THREE.BoxGeometry(len,0.005,t.w||0.022),
        {color:0xc8952d,metalness:0.85,roughness:0.2},
        [(t.x1+t.x2)/2,0.038,(t.z1+t.z2)/2],-ang));
    });
    (cfg.components||[]).forEach(c=>addComp(group,c,y0));
  }

  /* ── loader styles (injected once) ───────────────────────────── */
  function injectLoaderStyles() {
    if (document.getElementById('pcb-loader-styles')) return;
    const s = document.createElement('style');
    s.id = 'pcb-loader-styles';
    s.textContent = `
      .pcb-loader{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:var(--surface,rgba(0,0,0,0.04));color:var(--fg,#141414);z-index:5;transition:opacity 0.4s ease;pointer-events:none;user-select:none;}
      .pcb-loader.hidden{opacity:0;}
      .pcb-loader-ast{position:relative;width:44px;height:44px;animation:pcb-spin 1.6s cubic-bezier(.5,0,.5,1) infinite;}
      .pcb-loader-arm{position:absolute;left:50%;top:50%;width:4px;height:44px;margin-left:-2px;margin-top:-22px;background:currentColor;border-radius:2px;}
      .pcb-loader-arm:nth-child(1){transform:rotate(0deg);}
      .pcb-loader-arm:nth-child(2){transform:rotate(60deg);}
      .pcb-loader-arm:nth-child(3){transform:rotate(120deg);}
      @keyframes pcb-spin{0%{transform:rotate(0deg) scale(1);}50%{transform:rotate(180deg) scale(1.18);}100%{transform:rotate(360deg) scale(1);}}
      .pcb-loader-text{font-size:12px;letter-spacing:0.06em;color:var(--fg2,#4a4a50);}
      .pcb-loader-dots::after{content:'';display:inline-block;width:18px;text-align:left;animation:pcb-dots 1.4s steps(4) infinite;}
      @keyframes pcb-dots{0%{content:'';}25%{content:'.';}50%{content:'..';}75%{content:'...';}100%{content:'';}}
      .pcb-loader-pct{font-size:11px;font-variant-numeric:tabular-nums;letter-spacing:0.04em;color:var(--fg2,#4a4a50);opacity:0.75;}
      /* pan indicator */
      .pcb-pan-indicator{position:absolute;pointer-events:none;z-index:10;transition:opacity 0.3s;}
      .pcb-pan-indicator.hidden{opacity:0;}
      .pcb-pan-ring{width:36px;height:36px;border-radius:50%;border:2px solid rgba(255,255,255,0.7);box-shadow:0 0 0 1px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;}
      .pcb-pan-dot{width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,0.9);}
      .pcb-pan-coords{position:absolute;bottom:10px;left:12px;font-size:10px;font-family:monospace;color:var(--fg2,#4a4a50);letter-spacing:0.03em;pointer-events:none;opacity:0.75;transition:opacity 0.3s;}
      .pcb-pan-coords.hidden{opacity:0;}
      /* fullscreen button */
      .pcb-fs-btn{position:absolute;bottom:10px;right:10px;z-index:10;background:var(--nav-bg,rgba(255,255,255,0.78));border:1px solid var(--border,rgba(0,0,0,0.1));border-radius:6px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;cursor:pointer;opacity:0.7;transition:opacity 0.15s;backdrop-filter:blur(8px);}
      .pcb-fs-btn:hover{opacity:1;}
      .pcb-fs-btn svg{display:block;}
    `;
    document.head.appendChild(s);
  }

  /* ── main viewer init ─────────────────────────────────────────── */
  function initPCBViewer(id, cfg, opts) {
    opts = opts || {};
    const interactive = opts.interactive !== false;
    const camDist = opts.camDist || 3.8;
    const camHeight = opts.camHeight || 3.0;

    const container = document.getElementById(id);
    if (!container) return;
    if (typeof THREE === 'undefined') {
      container.style.cssText += 'display:flex;align-items:center;justify-content:center;';
      container.innerHTML = '<span style="font-size:12px;opacity:.4">3D viewer unavailable</span>';
      return;
    }

    const W = container.clientWidth || 640;
    const H = container.clientHeight || 260;

    var isMobile = ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    var skipForMobile = isMobile && cfg && cfg.mobileSkipGlb === true;
    var resolvedGlbPath = skipForMobile ? null
      : ((interactive && cfg && cfg.glbPathFull) ? cfg.glbPathFull : (cfg && cfg.glbPath));

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = !resolvedGlbPath;
    if (resolvedGlbPath) {
      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
    }
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 50);
    camera.position.set(0, camHeight, camDist);
    camera.lookAt(0, 0.3, 0);

    if (resolvedGlbPath) {
      scene.add(new THREE.HemisphereLight(0xffffff, 0x404044, 1.5));
      var sunG = new THREE.DirectionalLight(0xffffff, 2.2); sunG.position.set(3,6,4); scene.add(sunG);
      var fillG = new THREE.DirectionalLight(0xffffff, 1.0); fillG.position.set(-4,2,-3); scene.add(fillG);
      var rimG = new THREE.DirectionalLight(0xffffff, 0.6); rimG.position.set(0,-3,-5); scene.add(rimG);
    } else {
      scene.add(new THREE.AmbientLight(0xffffff, 0.65));
      var sun = new THREE.DirectionalLight(0xffffff, 1.1); sun.position.set(4,7,4); sun.castShadow=true; scene.add(sun);
      var fill = new THREE.DirectionalLight(0xffffff, 0.35); fill.position.set(-3,2,-4); scene.add(fill);
      var rim = new THREE.DirectionalLight(0xffffff, 0.2); rim.position.set(0,-4,-6); scene.add(rim);
    }

    const group = new THREE.Group();
    scene.add(group);
    group.rotation.x = -0.28;
    group.rotation.y = 0.40;

    injectLoaderStyles();

    // Loading overlay — shown for ALL GLB loads (preview + interactive)
    var loaderEl = null;
    if (resolvedGlbPath) {
      loaderEl = document.createElement('div');
      loaderEl.className = 'pcb-loader';
      loaderEl.innerHTML =
        '<div class="pcb-loader-ast">' +
          '<span class="pcb-loader-arm"></span><span class="pcb-loader-arm"></span><span class="pcb-loader-arm"></span>' +
        '</div>' +
        '<div class="pcb-loader-text">loading 3d model<span class="pcb-loader-dots"></span></div>' +
        '<div class="pcb-loader-pct">0%</div>';
      container.appendChild(loaderEl);
    }
    function setLoaderPct(pct) {
      if (!loaderEl) return;
      const el = loaderEl.querySelector('.pcb-loader-pct');
      if (el) el.textContent = pct + '%';
    }
    function hideLoader() {
      if (!loaderEl) return;
      loaderEl.classList.add('hidden');
      setTimeout(()=>{ if(loaderEl&&loaderEl.parentNode) loaderEl.parentNode.removeChild(loaderEl); }, 450);
    }

    // Pan indicator
    var panIndicator = null, panCoords = null;
    if (interactive) {
      panIndicator = document.createElement('div');
      panIndicator.className = 'pcb-pan-indicator hidden';
      panIndicator.innerHTML = '<div class="pcb-pan-ring"><div class="pcb-pan-dot"></div></div>';
      container.appendChild(panIndicator);

      panCoords = document.createElement('div');
      panCoords.className = 'pcb-pan-coords hidden';
      container.appendChild(panCoords);
    }

    var panHideTimer = null;
    function showPanIndicator(cx, cy, px, py) {
      if (!panIndicator) return;
      panIndicator.style.left = (cx - 18) + 'px';
      panIndicator.style.top  = (cy - 18) + 'px';
      panIndicator.classList.remove('hidden');
      if (panCoords) {
        panCoords.textContent = 'pan ' + px.toFixed(2) + ', ' + py.toFixed(2);
        panCoords.classList.remove('hidden');
      }
      clearTimeout(panHideTimer);
      panHideTimer = setTimeout(()=>{
        panIndicator.classList.add('hidden');
        if (panCoords) panCoords.classList.add('hidden');
      }, 1200);
    }

    // Fullscreen button
    if (interactive) {
      const fsBtn = document.createElement('button');
      fsBtn.className = 'pcb-fs-btn';
      fsBtn.title = 'Fullscreen';
      fsBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M1 5V1h4M9 1h4v4M13 9v4H9M5 13H1V9"/></svg>';
      fsBtn.addEventListener('click', ()=>{
        const wrap = container.closest('.viewer-wrap') || container;
        if (!document.fullscreenElement) {
          (wrap.requestFullscreen || wrap.webkitRequestFullscreen).call(wrap);
        } else {
          (document.exitFullscreen || document.webkitExitFullscreen).call(document);
        }
      });
      container.appendChild(fsBtn);
    }

    // GLB load
    if (resolvedGlbPath) {
      (function loadGLB() {
        if (typeof THREE.GLTFLoader === 'undefined') {
          buildBoard(group, cfg); hideLoader(); return;
        }
        const loader = new THREE.GLTFLoader();
        if (typeof THREE.DRACOLoader !== 'undefined') {
          const draco = new THREE.DRACOLoader();
          draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.4.1/');
          loader.setDRACOLoader(draco);
        }
        loader.load(resolvedGlbPath,
          function(gltf) {
            const model = gltf.scene;
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const scale = 2.2 / Math.max(size.x, size.y, size.z);
            model.scale.setScalar(scale);
            model.position.sub(center.multiplyScalar(scale));
            const pv = (cfg && cfg.pivotOffset) || {x:0,y:0,z:0};
            model.position.x -= (pv.x||0);
            model.position.y -= (pv.y||0);
            model.position.z -= (pv.z||0);
            model.position.y += 0.25;
            group.add(model);
            setLoaderPct(100); hideLoader();
          },
          function(xhr) {
            if (xhr && xhr.lengthComputable && xhr.total)
              setLoaderPct(Math.round((xhr.loaded/xhr.total)*100));
          },
          function(err) { console.warn('GLB load error', err); buildBoard(group,cfg); hideLoader(); }
        );
      })();
    } else {
      buildBoard(group, cfg);
    }

    /* ── interaction state ───────────────────────────────────────── */
    let dragging=false, panning=false, autoSpin=true;
    let prev={x:0,y:0}, spinTimer=null;
    let targetRotX=group.rotation.x, targetRotY=group.rotation.y;
    let panX=0, panY=0, targetPanX=0, targetPanY=0;
    let velX=0, velY=0, lastMoveTime=0;
    let targetFov=camera.fov;
    const el = renderer.domElement;

    if (interactive) {
      el.style.cursor = 'grab';
      el.style.touchAction = 'none';

      /* desktop */
      el.addEventListener('mousedown', e => {
        panning = e.shiftKey;
        dragging = true;
        autoSpin = false;
        clearTimeout(spinTimer);
        prev = {x:e.clientX, y:e.clientY};
        velX=0; velY=0; lastMoveTime=performance.now();
        el.style.cursor = panning ? 'move' : 'grabbing';
      });

      window.addEventListener('mousemove', e => {
        if (!dragging) return;
        const now = performance.now();
        const dt = Math.max(1, now-lastMoveTime);
        const dx = (e.clientX-prev.x)*0.007;
        const dy = (e.clientY-prev.y)*0.007;
        if (panning) {
          targetPanX += (e.clientX-prev.x)*0.004;
          targetPanY -= (e.clientY-prev.y)*0.004;
          const rect = el.getBoundingClientRect();
          showPanIndicator(e.clientX-rect.left, e.clientY-rect.top, targetPanX, targetPanY);
        } else {
          targetRotY += dx; targetRotX += dy;
          velY = velY*0.55+(dx/dt)*0.45;
          velX = velX*0.55+(dy/dt)*0.45;
        }
        prev = {x:e.clientX, y:e.clientY};
        lastMoveTime = now;
      });

      window.addEventListener('mouseup', () => {
        dragging=false; panning=false;
        el.style.cursor='grab';
        spinTimer = setTimeout(()=>{ autoSpin=true; }, 1200);
      });

      el.addEventListener('wheel', e => {
        targetFov = Math.max(5, Math.min(75, targetFov+e.deltaY*0.05));
        e.preventDefault();
      }, {passive:false});

      /* touch */
      let lastPinchDist=null, lastTwoMid=null;
      el.addEventListener('touchstart', e=>{
        if (e.touches.length===1) {
          lastPinchDist=null; lastTwoMid=null;
          dragging=true; panning=false; autoSpin=false;
          clearTimeout(spinTimer);
          prev={x:e.touches[0].clientX, y:e.touches[0].clientY};
          velX=0; velY=0; lastMoveTime=performance.now();
        } else if (e.touches.length===2) {
          dragging=false;
          lastPinchDist=Math.hypot(
            e.touches[1].clientX-e.touches[0].clientX,
            e.touches[1].clientY-e.touches[0].clientY);
          lastTwoMid={
            x:(e.touches[0].clientX+e.touches[1].clientX)/2,
            y:(e.touches[0].clientY+e.touches[1].clientY)/2
          };
        }
        e.preventDefault();
      },{passive:false});

      el.addEventListener('touchmove', e=>{
        if (e.touches.length===1 && lastPinchDist===null) {
          if (!dragging) { e.preventDefault(); return; }
          const now=performance.now(), dt=Math.max(1,now-lastMoveTime);
          const dx=(e.touches[0].clientX-prev.x)*0.007;
          const dy=(e.touches[0].clientY-prev.y)*0.007;
          targetRotY+=dx; targetRotX+=dy;
          velY=velY*0.55+(dx/dt)*0.45; velX=velX*0.55+(dy/dt)*0.45;
          prev={x:e.touches[0].clientX, y:e.touches[0].clientY};
          lastMoveTime=now;
        } else if (e.touches.length===2) {
          const dist=Math.hypot(
            e.touches[1].clientX-e.touches[0].clientX,
            e.touches[1].clientY-e.touches[0].clientY);
          const mid={
            x:(e.touches[0].clientX+e.touches[1].clientX)/2,
            y:(e.touches[0].clientY+e.touches[1].clientY)/2
          };
          // pinch = zoom
          if (lastPinchDist!==null)
            targetFov=Math.max(5,Math.min(75,targetFov-(dist-lastPinchDist)*0.18));
          // 2-finger drag = pan
          if (lastTwoMid!==null) {
            targetPanX+=(mid.x-lastTwoMid.x)*0.004;
            targetPanY-=(mid.y-lastTwoMid.y)*0.004;
            const rect=el.getBoundingClientRect();
            showPanIndicator(mid.x-rect.left, mid.y-rect.top, targetPanX, targetPanY);
          }
          lastPinchDist=dist; lastTwoMid=mid;
        }
        e.preventDefault();
      },{passive:false});

      el.addEventListener('touchend', e=>{
        if (e.touches.length===0){ lastPinchDist=null; lastTwoMid=null; dragging=false; spinTimer=setTimeout(()=>{autoSpin=true;},1200); }
        else if (e.touches.length===1){ lastPinchDist=null; lastTwoMid=null; dragging=true; prev={x:e.touches[0].clientX,y:e.touches[0].clientY}; }
      });
    } else {
      el.style.pointerEvents='none';
    }

    if ('ResizeObserver' in window) {
      new ResizeObserver(()=>{
        const w=container.clientWidth, h=container.clientHeight;
        renderer.setSize(w,h); camera.aspect=w/h; camera.updateProjectionMatrix();
      }).observe(container);
    }

    let lastFrame=performance.now();
    (function loop(){
      requestAnimationFrame(loop);
      const now=performance.now();
      const dt=Math.min(48,now-lastFrame); lastFrame=now;

      if (interactive) {
        if (!dragging) {
          targetRotY+=velY*dt; targetRotX+=velX*dt;
          const friction=Math.pow(0.94,dt/16);
          velY*=friction; velX*=friction;
          if(Math.abs(velX)<1e-5)velX=0; if(Math.abs(velY)<1e-5)velY=0;
          if(autoSpin&&Math.abs(velY)===0) targetRotY+=0.003;
        }
        if(targetRotX>1.35)targetRotX=1.35;
        if(targetRotX<-1.35)targetRotX=-1.35;
        const k=1-Math.pow(1-0.22,dt/16);
        group.rotation.x+=(targetRotX-group.rotation.x)*k;
        group.rotation.y+=(targetRotY-group.rotation.y)*k;
        // pan: move camera target
        panX+=(targetPanX-panX)*k;
        panY+=(targetPanY-panY)*k;
        camera.position.x = panX;
        camera.position.y = camHeight + panY;
        camera.lookAt(panX, 0.3+panY, 0);
        if(Math.abs(targetFov-camera.fov)>0.01){
          camera.fov+=(targetFov-camera.fov)*k;
          camera.updateProjectionMatrix();
        }
      } else {
        if(autoSpin) group.rotation.y+=0.003;
      }
      renderer.render(scene,camera);
    })();
  }

  root.initPCBViewer = initPCBViewer;
})(window);

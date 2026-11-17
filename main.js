(function () {
  "use strict";

  const isPhoneQuery = "(max-width: 767px), (max-width: 900px) and (pointer: coarse)";
  const isPhone = () => window.matchMedia(isPhoneQuery).matches;
  const isReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ==========================================================================
     1. HERO STORY COPY
     ========================================================================== */
  const STORY_TEXT =
    "Minha Casa Minha Vida e médio padrão em São Paulo. Preço, metragem, bairro e previsão de entrega no mesmo lugar, para você escolher com calma.";

  const desktopCopyEl = document.getElementById("hero-story-copy");
  const phoneCopyEl = document.getElementById("hero-story-copy-phone");

  if (desktopCopyEl) desktopCopyEl.textContent = STORY_TEXT;
  if (phoneCopyEl) phoneCopyEl.textContent = STORY_TEXT;

  /* ==========================================================================
     2. LOTTIE SIGNATURE (PURPLE #502E84 + HOVER REPLAY)
     ========================================================================== */
  function recolorLottieData(data, hexColor) {
    const clean = hexColor.replace("#", "");
    const num = parseInt(
      clean.length === 3
        ? clean
            .split("")
            .map((c) => c + c)
            .join("")
        : clean,
      16
    );
    const r = ((num >> 16) & 255) / 255;
    const g = ((num >> 8) & 255) / 255;
    const b = (num & 255) / 255;
    const clone = JSON.parse(JSON.stringify(data));

    function walk(obj) {
      if (obj && typeof obj === "object") {
        if (
          (obj.ty === "fl" || obj.ty === "st") &&
          obj.c &&
          Array.isArray(obj.c.k) &&
          typeof obj.c.k[0] === "number"
        ) {
          const alpha = obj.c.k[3] !== undefined ? obj.c.k[3] : 1;
          obj.c.k = [r, g, b, alpha];
        }
        for (const k in obj) {
          walk(obj[k]);
        }
      }
    }
    walk(clone);
    return clone;
  }

  async function getSignatureData(hexColor) {
    const raw = window.JJ_SIGNATURE_DATA || null;
    if (!raw) return null;
    return hexColor ? recolorLottieData(raw, hexColor) : raw;
  }

  const signatureControllers = [];

  async function initSignatures() {
    if (!window.lottie) return;
    const animData = await getSignatureData("#502E84");
    if (!animData) return;

    const containers = [
      document.getElementById("hero-sig-desktop"),
      document.getElementById("hero-sig-phone"),
    ].filter(Boolean);

    containers.forEach((container) => {
      let playing = false;
      let rewindQueued = false;

      const anim = window.lottie.loadAnimation({
        container,
        renderer: "svg",
        loop: false,
        autoplay: false,
        animationData: JSON.parse(JSON.stringify(animData)),
        rendererSettings: {
          preserveAspectRatio: "xMidYMid meet",
        },
      });

      anim.setSpeed(1.35);

      anim.addEventListener("complete", () => {
        if (rewindQueued) {
          rewindQueued = false;
          anim.setSpeed(1.35);
          anim.setDirection(1);
          anim.play();
          return;
        }
        playing = false;
      });

      container.addEventListener("pointerenter", (e) => {
        if (e.pointerType !== "mouse" || isReducedMotion()) return;
        if (!playing) {
          playing = true;
          rewindQueued = true;
          anim.setSpeed(8);
          anim.setDirection(-1);
          anim.play();
        }
      });

      signatureControllers.push({
        playEntrance() {
          if (isReducedMotion()) {
            anim.goToAndStop((anim.totalFrames || 1) - 1, true);
            return;
          }
          playing = true;
          anim.setSpeed(1.35);
          anim.setDirection(1);
          anim.goToAndPlay(75, true);
        },
      });
    });
  }

  /* ==========================================================================
     3. 3D ROOKIE TRADING CARD TILT & HOLOGRAPHIC SHEEN
     ========================================================================== */
  const heroCard = document.querySelector("[data-hero-card]");
  if (heroCard) {
    const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
    const setVars = (el, vars) => {
      for (const [k, v] of Object.entries(vars)) {
        el.style.setProperty(k, v);
      }
    };

    heroCard.addEventListener("pointermove", (e) => {
      const rect = heroCard.getBoundingClientRect();
      if (!rect.width) return;
      const ny = clamp((e.clientY - (rect.top + rect.height / 2)) / (window.innerHeight / 2), -1, 1);
      const nx = clamp((e.clientX - (rect.left + rect.width / 2)) / (window.innerWidth / 2), -1, 1);
      const mxf = clamp((e.clientX - rect.left) / rect.width, 0, 1);

      setVars(heroCard, {
        "--hover": "1",
        "--mxf": String(mxf),
        "--ry-cursor": `${13 * nx}deg`,
        "--rx": `${-9 * ny}deg`,
        "--scale": "1.05",
        "--tz": "46px",
      });
    });

    heroCard.addEventListener("pointerleave", () => {
      setVars(heroCard, {
        "--hover": "0",
        "--ry-cursor": "0deg",
        "--rx": "0deg",
        "--scale": "1",
        "--tz": "0px",
      });
    });
  }

  /* ==========================================================================
     4. HEADER HAMBURGER & NAVIGATION OVERLAY
     ========================================================================== */
  const hamburgerBtn = document.querySelector("[data-hamburger]");
  const hamburgerMirror = document.querySelector("[data-hamburger-mirror]");
  const navOverlay = document.getElementById("site-navigation");
  let menuOpen = false;

  function setMenuOpen(open) {
    menuOpen = open;
    if (!hamburgerBtn || !navOverlay) return;
    hamburgerBtn.setAttribute("data-state", open ? "open" : "closed");
    hamburgerBtn.setAttribute("aria-expanded", String(open));
    hamburgerBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if (hamburgerMirror) {
      hamburgerMirror.setAttribute("data-state", open ? "open" : "closed");
    }
    navOverlay.classList.toggle("is-open", open);
    navOverlay.setAttribute("aria-hidden", String(!open));
    document.body.classList.toggle("menu-open", open);
    playClickSound();
  }

  if (hamburgerBtn) {
    hamburgerBtn.addEventListener("click", () => setMenuOpen(!menuOpen));
  }

  document.querySelectorAll("#site-navigation .menu-link").forEach((link) => {
    link.addEventListener("click", () => {
      if (menuOpen) setMenuOpen(false);
    });
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menuOpen) {
      setMenuOpen(false);
    }
  });

  /* ==========================================================================
     5. AMBIENT AUDIO & UI SOUND EFFECTS (BOTTOM-RIGHT BUTTON)
     ========================================================================== */
  const soundToggleBtn = document.querySelector("[data-sound-toggle]");
  let audioCtx = null;
  let soundEnabled = false;
  let ambientNodes = [];
  let ambientInterval = null;

  function ensureAudioCtx() {
    if (audioCtx) return audioCtx;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
    return audioCtx;
  }

  function midiToFreq(m) {
    return 440 * Math.pow(2, (m - 69) / 12);
  }

  function playHoverSound() {
    if (!soundEnabled || !audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(680, now + 0.06);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.025, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  function playClickSound() {
    if (!soundEnabled || !audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.09);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.05, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  function startAmbientBed() {
    const ctx = ensureAudioCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, ctx.currentTime);
    master.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 2.0);
    master.connect(ctx.destination);

    // Sub drone
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = "sine";
    sub.frequency.value = midiToFreq(36);
    subGain.gain.value = 0.12;
    sub.connect(subGain).connect(master);
    sub.start();
    ambientNodes.push(sub, master);

    const notes = [48, 53, 55, 58, 60, 62, 67];
    const playChordNote = () => {
      if (!soundEnabled || !audioCtx) return;
      const note = notes[Math.floor(Math.random() * notes.length)];
      const freq = midiToFreq(note);
      const now = ctx.currentTime + 0.05;
      const dur = 5.5;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(650, now);
      filter.frequency.linearRampToValueAtTime(1400, now + dur * 0.45);
      filter.frequency.linearRampToValueAtTime(600, now + dur);

      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, now);
      env.gain.exponentialRampToValueAtTime(0.04, now + dur * 0.45);
      env.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      filter.connect(env).connect(master);

      [freq, freq * 2].forEach((f, idx) => {
        const o = ctx.createOscillator();
        o.type = "triangle";
        o.frequency.value = f;
        o.detune.value = idx === 0 ? -4 : 4;
        const g = ctx.createGain();
        g.gain.value = idx === 0 ? 0.7 : 0.18;
        o.connect(g).connect(filter);
        o.start(now);
        o.stop(now + dur + 0.1);
      });
    };

    playChordNote();
    ambientInterval = window.setInterval(playChordNote, 4800);
  }

  function stopAmbientBed() {
    if (ambientInterval) {
      clearInterval(ambientInterval);
      ambientInterval = null;
    }
    ambientNodes.forEach((n) => {
      try {
        if (n.stop) n.stop();
        if (n.disconnect) n.disconnect();
      } catch (_) {}
    });
    ambientNodes = [];
  }

  if (soundToggleBtn) {
    soundToggleBtn.addEventListener("click", () => {
      soundEnabled = !soundEnabled;
      soundToggleBtn.setAttribute("aria-pressed", String(soundEnabled));
      soundToggleBtn.setAttribute("aria-label", soundEnabled ? "Turn sound off" : "Turn sound on");
      soundToggleBtn.setAttribute("title", soundEnabled ? "Sound on" : "Sound off");
      if (soundEnabled) {
        startAmbientBed();
        playClickSound();
      } else {
        stopAmbientBed();
      }
    });
  }

  document.querySelectorAll("a, button, [role='button']").forEach((el) => {
    el.addEventListener("pointerenter", () => playHoverSound());
  });

  /* ==========================================================================
     6. HERO PORTRAIT (ULTRA-LIGHTWEIGHT 3D PARALLAX & SNAPPY ENTRANCE)
     ========================================================================== */
  const mouse = {
    current: { x: 0, y: 0 },
    target: { x: 0, y: 0 },
  };

  const lerp = (a, b, t) => a + (b - a) * t;

  window.addEventListener(
    "pointermove",
    (e) => {
      const hw = window.innerWidth * 0.5;
      const hh = window.innerHeight * 0.5;
      mouse.target.x = (e.clientX - hw) / hw;
      mouse.target.y = (e.clientY - hh) / hh;
    },
    { passive: true }
  );

  const introState = {
    progress: 1,
    isWiped: false,
  };

  function initHeroPortrait(onReady) {
    const heroImg = document.getElementById("hero-portrait-img");

    function updatePortrait() {
      // Only execute transforms when Hero is active and not scrolled away
      if (!introState.isWiped && window.scrollY < window.innerHeight * 0.85) {
        mouse.current.x = lerp(mouse.current.x, mouse.target.x, 0.08);
        mouse.current.y = lerp(mouse.current.y, mouse.target.y, 0.08);

        if (heroImg) {
          const panX = mouse.current.x * 12;
          const panY = mouse.current.y * 8;
          const rotY = mouse.current.x * 4;
          const rotX = -mouse.current.y * 3;
          const p = introState.progress;
          const diveScale = 1.05 - 0.05 * p;

          heroImg.style.transform = `translateX(-50%) translate3d(${panX.toFixed(1)}px, ${panY.toFixed(1)}px, 0) rotateY(${rotY.toFixed(2)}deg) rotateX(${rotX.toFixed(2)}deg) scale(${diveScale.toFixed(3)})`;
        }
      }

      requestAnimationFrame(updatePortrait);
    }

    requestAnimationFrame(updatePortrait);
    if (onReady) onReady();
  }

  function runHeroEntrance() {
    // Play signature entrance immediately
    signatureControllers.forEach((s) => s.playEntrance());

    // Snappy, silky 500ms landing dive without blocking UI
    const startTime = performance.now();
    const duration = 500;
    introState.progress = 0;

    function tickDive(now) {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - t, 3);
      introState.progress = ease;

      if (t < 1) {
        requestAnimationFrame(tickDive);
      }
    }
    requestAnimationFrame(tickDive);
  }

  let entranceStarted = false;
  function triggerEntranceOnce() {
    if (entranceStarted) return;
    entranceStarted = true;
    runHeroEntrance();
  }

  /* ==========================================================================
     9. SECTION 2: SIGNATURE MOMENTS (YARD LINES, STAGE WIPE, FLYING CARD & 3D RAIL)
     ========================================================================== */
  function initYardLines() {
    const yardContainer = document.getElementById("sig-yardlines");
    if (!yardContainer) return;
    yardContainer.innerHTML = "";
  }

  function initHomeStageAndMoments() {
    const stageEl = document.querySelector('[data-section="home-stage"]');
    const pinEl = document.querySelector("[data-home-pin]");
    const heroWindow = document.querySelector(".jj-hero-window");
    const wipeNav = document.querySelector("[data-home-wipe-nav]");
    const yardlinesEl = document.getElementById("sig-yardlines");
    const railEl = document.getElementById("sig-cards-rail");
    const flightProxy = document.getElementById("hero-flight-proxy");
    const flightSpin = flightProxy ? flightProxy.querySelector("[data-flight-spin]") : null;

    if (!stageEl || !pinEl || !railEl) return;

    const cardBoxes = Array.from(railEl.querySelectorAll("[data-card-box]"));
    const cardTitles = Array.from(railEl.querySelectorAll("[data-card-title]"));
    const firstCardBox = cardBoxes[0] || null;
    const firstCardTitle = cardTitles[0] || null;

    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
    const lerp = (a, b, t) => a + (b - a) * t;
    const smoothstep = (t) => t * t * (3 - 2 * t);

    // Set up 3D hover tilt on the Signature Moments cards
    cardBoxes.forEach((box, idx) => {
      box.addEventListener("pointermove", (e) => {
        const rect = box.getBoundingClientRect();
        if (!rect.width) return;
        const ny = clamp((e.clientY - (rect.top + rect.height / 2)) / (window.innerHeight / 2), -1, 1);
        const nx = clamp((e.clientX - (rect.left + rect.width / 2)) / (window.innerWidth / 2), -1, 1);
        const mxf = clamp((e.clientX - rect.left) / rect.width, 0, 1);

        box.style.setProperty("--hover", "1");
        box.style.setProperty("--mxf", String(mxf));
        box.style.setProperty("--ry-cursor", `${13 * nx}deg`);
        box.style.setProperty("--rx", `${-9 * ny}deg`);
        box.style.setProperty("--scale", "1.05");
        box.style.setProperty("--tz", "46px");

        const titleEl = cardTitles[idx];
        if (titleEl) {
          titleEl.style.setProperty("--hover", "1");
        }
      });

      box.addEventListener("pointerleave", () => {
        box.style.setProperty("--hover", "0");
        box.style.setProperty("--ry-cursor", "0deg");
        box.style.setProperty("--rx", "0deg");
        box.style.setProperty("--scale", "1");
        box.style.setProperty("--tz", "0px");
        const titleEl = cardTitles[idx];
        if (titleEl) {
          titleEl.style.setProperty("--hover", "0");
        }
      });

    });

    // Clicking the Hero Rookie Card scrolls smoothly into Section 2 (Signature Moments)
    if (heroCard) {
      heroCard.addEventListener("click", () => {
        playClickSound();
        const stageTop = stageEl.getBoundingClientRect().top + window.scrollY;
        const totalScroll = Math.max(1, stageEl.offsetHeight - window.innerHeight);
        window.scrollTo({
          top: stageTop + totalScroll * 0.22,
          behavior: "smooth",
        });
      });
    }

    // Drag-to-scroll on the Signature Moments horizontal rail
    let dragState = null;
    railEl.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      dragState = {
        startX: e.clientX,
        startScrollY: window.scrollY,
        moved: false,
      };
      railEl.dataset.justDragged = "false";
    });

    window.addEventListener(
      "pointermove",
      (e) => {
        if (!dragState) return;
        const dx = e.clientX - dragState.startX;
        if (Math.abs(dx) > 6) {
          dragState.moved = true;
          railEl.classList.add("is-dragging");
          railEl.dataset.justDragged = "true";
        }
        if (dragState.moved) {
          window.scrollTo(0, dragState.startScrollY - dx * 1.35);
        }
      },
      { passive: true }
    );

    const endDrag = () => {
      if (!dragState) return;
      dragState = null;
      railEl.classList.remove("is-dragging");
      setTimeout(() => {
        railEl.dataset.justDragged = "false";
      }, 60);
    };
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);

    const quoteLayer = document.getElementById("sig-quote-section");
    const quoteWrap = document.getElementById("sig-quote-wrap");
    const quoteTitle = document.getElementById("sig-quote-title");
    const quoteDesc = document.getElementById("sig-quote-desc");
    const quoteCanvas = document.getElementById("sig-quote-canvas");
    const quoteMarks = quoteWrap ? quoteWrap.querySelector(".sig-quote-marks") : null;
    const quoteLineEls = quoteTitle ? Array.from(quoteTitle.querySelectorAll("[data-quote-line]")) : [];

    // Dot Halftone Particle Generator & Renderer (exact reproduction of 1354.js)
    let dotSampler = null;
    function initQuoteDotSampler() {
      if (!quoteCanvas || !quoteLineEls.length) return null;
      const ctx = quoteCanvas.getContext("2d");
      if (!ctx) return null;

      let particles = [];
      let dpr = 1;
      let cw = 0;
      let ch = 0;
      let hasDrawn = false;
      const getParticleSpacing = () => (isPhone() ? 6.4 : 3.8);
      let fontColor = "rgb(232, 176, 74)";

      function resizeCanvas() {
        dpr = Math.min(2, window.devicePixelRatio || 1);
        const w = window.innerWidth;
        const h = window.innerHeight;
        if (w !== cw || h !== ch) {
          cw = w;
          ch = h;
          quoteCanvas.width = Math.round(cw * dpr);
          quoteCanvas.height = Math.round(ch * dpr);
          quoteCanvas.style.width = `${cw}px`;
          quoteCanvas.style.height = `${h}px`;
          hasDrawn = false;
        }
      }
      resizeCanvas();

      const sCurve = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - (1 - t) * (1 - t));

      return {
        resize: resizeCanvas,
        clear: () => {
          if (ctx && (cw > 0 || hasDrawn)) {
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, cw, ch);
            hasDrawn = false;
          }
        },
        resample: () => {
          try {
            resizeCanvas();
            particles = [];
            const offCanvas = document.createElement("canvas");
            const offCtx = offCanvas.getContext("2d", { willReadFrequently: true });
            if (!offCtx) return;

            const rects = quoteLineEls.map((el) => el.getBoundingClientRect());
            const validRects = rects.filter((r) => r.width > 2 && r.height > 2);
            if (!validRects.length) return;

            const minLeft = Math.min(...validRects.map((r) => r.left));
            const totalW = Math.max(1, Math.max(...validRects.map((r) => r.right)) - minLeft);
            const particleSpacing = getParticleSpacing();

            quoteLineEls.forEach((el, lineIdx) => {
              const rect = rects[lineIdx];
              if (rect.width < 2 || rect.height < 2) return;

              const normLineLeft = (rect.left - minLeft) / totalW;
              const normLineW = rect.width / totalW;

              const computed = getComputedStyle(el);
              fontColor = computed.color || fontColor;
              const scale = 200 / rect.height;
              const renderW = Math.max(2, Math.round(rect.width * scale));
              const padY = Math.round(56);
              const renderH = 200 + 2 * padY;

              offCanvas.width = renderW;
              offCanvas.height = renderH;

              const dummy = document.createElement("span");
              dummy.style.cssText = "display:inline-block;width:0;height:0;overflow:hidden";
              el.appendChild(dummy);
              const baselineOffset = dummy.getBoundingClientRect().bottom - rect.top;
              el.removeChild(dummy);
              const baselineY = baselineOffset * scale + padY;

              offCtx.clearRect(0, 0, renderW, renderH);
              const fontSize = (parseFloat(computed.fontSize) || rect.height) * scale;
              offCtx.font = `${computed.fontWeight} ${fontSize}px ${computed.fontFamily}`;
              if ("fontStretch" in offCtx) offCtx.fontStretch = "ultra-condensed";
              offCtx.textBaseline = "alphabetic";
              offCtx.textAlign = "left";
              offCtx.fillStyle = "#fff";

              const textTransform = computed.textTransform;
              const transformText = (t) =>
                textTransform === "uppercase"
                  ? t.toUpperCase()
                  : textTransform === "lowercase"
                  ? t.toLowerCase()
                  : textTransform.startsWith("capitalize")
                  ? t.replace(/\b\p{L}/gu, (c) => c.toUpperCase())
                  : t;
              const letterSpacing = parseFloat(computed.letterSpacing) || 0;

              const firstChild = el.firstChild;
              const fullText = el.textContent || "";
              let measuredCharByChar = false;

              if (firstChild && firstChild.nodeType === Node.TEXT_NODE && (firstChild.textContent || "") === fullText) {
                const range = document.createRange();
                const charRects = [];
                for (let ci = 0; ci < fullText.length; ci++) {
                  range.setStart(firstChild, ci);
                  range.setEnd(firstChild, ci + 1);
                  const cr = range.getBoundingClientRect();
                  charRects.push({ left: cr.left - rect.left, width: cr.width - letterSpacing });
                }
                if (charRects.length === fullText.length) {
                  for (let ci = 0; ci < fullText.length; ci++) {
                    const ch = transformText(fullText[ci]);
                    const cr = charRects[ci];
                    if (!ch.trim() || cr.width <= 0) continue;
                    const charW = offCtx.measureText(ch).width;
                    if (charW > 0) {
                      offCtx.save();
                      offCtx.translate(cr.left * scale, baselineY);
                      offCtx.scale((cr.width * scale) / charW, 1);
                      offCtx.fillText(ch, 0, 0);
                      offCtx.restore();
                    }
                  }
                  measuredCharByChar = true;
                }
              }

              if (!measuredCharByChar) {
                const textStr = transformText(fullText.trim());
                const measured = offCtx.measureText(textStr).width || renderW;
                offCtx.save();
                offCtx.translate(0, baselineY);
                offCtx.scale(renderW / measured, 1);
                offCtx.fillText(textStr, 0, 0);
                offCtx.restore();
              }

              const imgData = offCtx.getImageData(0, 0, renderW, renderH).data;
              const step = particleSpacing;
              for (let py = step / 2; py < renderH; py += step) {
                for (let px = step / 2; px < renderW; px += step) {
                  const pixelAlpha = imgData[(Math.round(py) * renderW + Math.round(px)) * 4 + 3] || 0;
                  if (pixelAlpha > 110) {
                    const nx = px / renderW;
                    const base = 1 - (normLineLeft + nx * normLineW);
                    const rnd = ((43758.5453 * Math.sin(12.9898 * px + 78.233 * py + 37 * lineIdx) % 1) + 1) % 1;
                    particles.push({
                      line: lineIdx,
                      nx,
                      ny: (py - padY) / 200,
                      base,
                      rnd,
                    });
                  }
                }
              }
            });
          } catch (_) {}
        },
        render: (quoteProg, config, lineBounds) => {
          if (!ctx) return [];
          const lineCount = Math.max(1, quoteLineEls.length);
          const lineDoneFracs = Array(lineCount).fill(0);

          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          if (hasDrawn) {
            ctx.clearRect(0, 0, cw, ch);
            hasDrawn = false;
          }

          const { dotSize, dotEnd, wipeStart, jitter } = config;
          const M = Math.min(1, quoteProg / Math.max(0.001, dotEnd));
          const stepSize = Math.max(1e-4, 0.70 - wipeStart) / lineCount;

          for (let li = 0; li < lineCount; li++) {
            lineDoneFracs[li] = Math.max(0, Math.min(1, (quoteProg - (wipeStart + li * stepSize)) / stepSize));
          }

          if (quoteProg <= 0 || lineDoneFracs.every((f) => f >= 1)) {
            return lineDoneFracs;
          }

          const particleSpacing = getParticleSpacing();
          const buckets = Array(15).fill(null);

          for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            const bounds = lineBounds[p.line];
            if (!bounds || bounds.width < 1) continue;

            const thresh = (p.base * (1 - jitter) + p.rnd * jitter) * 0.91;
            const nVal = sCurve((M - thresh) / 0.09);
            if (nVal <= 0) continue;

            const lineFrac = lineDoneFracs[p.line] || 0;
            const fade = Math.round(nVal * (1 - Math.max(0, Math.min(1, (lineFrac - p.nx) / 0.05))) * 14);
            if (fade <= 0) continue;

            const rx = bounds.left + p.nx * bounds.width;
            const ry = bounds.top + p.ny * bounds.height;
            const rad = (bounds.height / 200) * particleSpacing * dotSize * nVal;

            if (rx + rad < 0 || rx - rad > cw || ry + rad < 0 || ry - rad > ch) continue;

            if (!buckets[fade]) buckets[fade] = new Path2D();
            buckets[fade].moveTo(rx + rad, ry);
            buckets[fade].arc(rx, ry, rad, 0, Math.PI * 2);
          }

          ctx.fillStyle = fontColor;
          for (let b = 1; b <= 14; b++) {
            if (buckets[b]) {
              ctx.globalAlpha = b / 14;
              ctx.fill(buckets[b]);
              hasDrawn = true;
            }
          }
          ctx.globalAlpha = 1;
          return lineDoneFracs;
        },
      };
    }
    dotSampler = initQuoteDotSampler();
    if (dotSampler) {
      setTimeout(() => {
        measureStageLayout();
      }, 300);
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          measureStageLayout();
          renderStageFrame(currentProgress);
        });
      }
    }

    // Cached layout metrics (recomputed ONLY on resize — zero getBoundingClientRect during scroll!)
    const layoutCache = {
      vw: window.innerWidth,
      vh: window.innerHeight,
      phone: isPhone(),
      stageTop: 0,
      totalScroll: 1,
      railScrollExtra: 0,
      totalRailDistance: 0,
      heroCardRect: null,
      firstCardRect: null,
      cardBaseCentersX: [],
      quote: null,
    };

    function measureStageLayout() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const phone = isPhone();

      layoutCache.vw = vw;
      layoutCache.vh = vh;
      layoutCache.phone = phone;

      const headlineBottom =
        0.015 * vh +
        Math.max(Math.min(80, 0.12 * vw), 21.76 * Math.min(vw / 100, 0.018 * Math.max(vh, 700))) * 0.83;
      const sigDrop = phone ? 0 : Math.max(0, Math.round(headlineBottom + 24 - 0.18 * vh));
      pinEl.style.setProperty("--sig-drop", `${sigDrop}px`);
      pinEl.style.setProperty("--home-pane", `${vh}px`);
      const headline = document.querySelector("[data-jj-headline]");
      pinEl.style.setProperty("--sig-mobile-top", `${(headline ? headline.offsetHeight : 0.22 * vh) + 32}px`);

      stageEl.style.setProperty("--sig-scroll-extra", "0px");
      const stageRect = stageEl.getBoundingClientRect();
      layoutCache.stageTop = stageRect.top + window.scrollY;
      layoutCache.totalScroll = Math.max(1, stageEl.offsetHeight - vh);

      // Temporarily reset rail transform to measure natural card positions
      const prevRailTransform = railEl.style.transform;
      railEl.style.transform = "translate3d(0px, 0, 0)";
      // Measure center of last card so scroll stops smoothly with Card 5 centered in view (never empty)
      layoutCache.totalRailDistance = Math.max(0, railEl.scrollWidth - vw + 0.12 * vw);

      if (heroCard) {
        const hr = heroCard.getBoundingClientRect();
        // Hero card is inside hero-side-wrap which scales with --wipe; normalize its natural unscaled rect
        const curWipe = parseFloat(pinEl.style.getPropertyValue("--wipe")) || 0;
        const scaleFactor = Math.max(0.5, 1 - curWipe * 0.18);
        const w = hr.width / scaleFactor;
        const h = hr.height / scaleFactor;
        layoutCache.heroCardRect = {
          cx: hr.left + hr.width / 2,
          cy: hr.top + hr.height / 2,
          w,
          h,
        };
      }

      if (firstCardBox) {
        const fr = firstCardBox.getBoundingClientRect();
        layoutCache.firstCardRect = {
          cx: fr.left + fr.width / 2,
          cy: fr.top + fr.height / 2,
          w: fr.width,
          h: fr.height,
        };
      }

      layoutCache.cardBaseCentersX = cardBoxes.map((box) => {
        const r = box.getBoundingClientRect();
        return r.left + r.width / 2;
      });

      // Calibrate total travel distance so Card 5 smoothly glides across and exits off the left
      // right as the Quote seamlessly reveals in the center (exact original seamless flow)
      const lastBox = cardBoxes[cardBoxes.length - 1];
      if (lastBox) {
        const lastR = lastBox.getBoundingClientRect();
        layoutCache.totalRailDistance = Math.max(0, lastR.right + 0.04 * vw);
      } else {
        layoutCache.totalRailDistance = Math.max(0, railEl.scrollWidth - vw + 0.35 * vw);
      }

      railEl.style.transform = prevRailTransform;

      // Add scroll distance only to the mobile cards, keeping the hero and finale pacing.
      const mobileRailSpan = 0.56 - 0.24;
      layoutCache.railScrollExtra = phone
        ? Math.max(0, layoutCache.totalRailDistance / 0.65 - layoutCache.totalScroll * mobileRailSpan)
        : 0;
      stageEl.style.setProperty("--sig-scroll-extra", `${layoutCache.railScrollExtra}px`);

      // Measure quote layout relative to center (exact math from 1354.js M())
      if (quoteTitle && quoteWrap && quoteLineEls.length) {
        const vuFit = Math.min(Math.min(vw, 1728) / 100, (1.8 * vh) / 100);
        quoteTitle.style.fontSize = "calc(9.5 * var(--vu))";
        quoteTitle.style.letterSpacing = "-0.015em";
        quoteTitle.style.transform = "none";
        quoteTitle.style.transformOrigin = "center center";
        quoteDesc.style.fontSize = "max(13px, calc(1.05 * var(--vu)))";
        quoteDesc.style.transformOrigin = "center top";
        if (quoteMarks) quoteMarks.style.transform = "none";

        const wrapR = quoteWrap.getBoundingClientRect();
        const titleR = quoteTitle.getBoundingClientRect();
        const u = titleR.width;
        const p = titleR.height;
        const f = titleR.left + u / 2 - (wrapR.left + wrapR.width / 2);
        const m = titleR.top + p / 2 - (wrapR.top + wrapR.height / 2);

        const x = quoteLineEls.map((el) => {
          const r = el.getBoundingClientRect();
          return {
            left: r.left - titleR.left - u / 2,
            top: r.top - titleR.top - p / 2,
            width: r.width,
            height: r.height,
          };
        });
        const b = x.map((item) => ({ ...item }));

        layoutCache.quote = { u, p, f, m, x, b };
        if (dotSampler) dotSampler.resample();
      }
    }

    let targetProgress = 0;
    let currentProgress = 0;
    let scrollRaf = 0;

    function getScrollProgress() {
      const { stageTop, totalScroll, railScrollExtra } = layoutCache;
      let scroll = window.scrollY - stageTop;
      if (railScrollExtra > 0) {
        const railStartScroll = totalScroll * 0.24;
        const railScroll = totalScroll * (0.56 - 0.24) + railScrollExtra;
        scroll -= clamp((scroll - railStartScroll) / railScroll, 0, 1) * railScrollExtra;
      }
      return clamp(scroll / totalScroll, 0, 1);
    }

    function renderStageFrame(progress) {
      const { vw, vh, phone, totalRailDistance, heroCardRect, firstCardRect, cardBaseCentersX } = layoutCache;

      // 1. Diagonal Hero Wipe (progress 0 -> 0.14 on desktop, 0 -> 0.22 on phone)
      const wipeEnd = phone ? 0.22 : 0.14;
      const wipe = clamp(progress / wipeEnd, 0, 1);
      const maxAngle = phone ? -5 : -9;
      const wipeAngle = maxAngle * Math.sin(wipe * Math.PI);

      pinEl.style.setProperty("--wipe", wipe.toFixed(4));

      const isWiped = wipe >= 0.998;
      introState.isWiped = isWiped;

      if (heroWindow) {
        heroWindow.classList.toggle("is-wiped", isWiped);
      }
      document.body.classList.toggle("in-moments", isWiped);

      // Compute exact diagonal wipe line (yLeft at x=0, yRight at x=vw)
      if (wipe <= 0.001) {
        if (heroWindow) heroWindow.style.clipPath = "none";
        if (wipeNav) wipeNav.style.clipPath = "polygon(0 100%, 100% 100%, 100% 100%, 0 100%)";
      } else if (isWiped) {
        if (heroWindow) heroWindow.style.clipPath = "polygon(0 0, 100% 0, 100% 0, 0 0)";
        if (wipeNav) wipeNav.style.clipPath = "polygon(0 0, 100% 0, 100% 0, 0 0)";
      } else {
        const rad = (wipeAngle * Math.PI) / 180;
        const baseH = vh * (1 - 1.18 * wipe);
        const yLeft = baseH - (vw / 2) * Math.tan(rad);
        const yRight = baseH + (vw / 2) * Math.tan(rad);
        if (heroWindow) {
          heroWindow.style.clipPath = `polygon(0px 0px, ${vw}px 0px, ${vw}px ${yRight.toFixed(1)}px, 0px ${yLeft.toFixed(1)}px)`;
        }
        if (wipeNav) {
          wipeNav.style.clipPath = `polygon(0px ${yLeft.toFixed(1)}px, ${vw}px ${yRight.toFixed(1)}px, ${vw}px ${vh}px, 0px ${vh}px)`;
        }
      }

      // 2. Horizontal Rail Scroll (progress 0.10 -> 0.56)
      // Cards slide naturally across the screen; Card 5 exits smoothly as Quote arrives
      const railStart = phone ? 0.24 : 0.10;
      const railEnd = 0.56;
      const railProgress = clamp((progress - railStart) / (railEnd - railStart), 0, 1);
      const currentRailX = -railProgress * (totalRailDistance || 1);

      railEl.style.opacity = "";
      railEl.style.visibility = "";
      railEl.style.pointerEvents = progress >= 0.54 ? "none" : "";
      railEl.style.transform = `translate3d(${currentRailX.toFixed(1)}px, 0, 0)`;

      // Backdrop transitions seamlessly into deep purple fog (#563B80) as Quote approaches (progress 0.44 -> 0.56)
      const backdropEl = document.querySelector("[data-jj-backdrop]");
      const headlineEl = document.querySelector("[data-jj-headline]");
      const lightEl = document.querySelector("[data-jj-light]");

      if (lightEl) {
        const lightFade = clamp(1 - (progress - 0.42) / 0.12, 0, 1);
        lightEl.style.setProperty("--jj-light-fade", lightFade.toFixed(3));
      }
      if (yardlinesEl) {
        const yardFade = clamp(1 - (progress - 0.44) / 0.10, 0, 1);
        yardlinesEl.style.opacity = yardFade.toFixed(3);
      }
      if (headlineEl) {
        const headFade = clamp(1 - (progress - 0.44) / 0.10, 0, 1);
        headlineEl.style.opacity = headFade.toFixed(3);
      }
      if (backdropEl) {
        const colorProg = clamp((progress - 0.44) / 0.12, 0, 1);
        // Lerp from #171220 (23, 18, 32) to #563B80 (86, 59, 128)
        const cr = Math.round(lerp(36, 107, colorProg));
        const cg = Math.round(lerp(12, 31, colorProg));
        const cb = Math.round(lerp(23, 58, colorProg));
        backdropEl.style.backgroundColor = `rgb(${cr}, ${cg}, ${cb})`;
      }

      // 3. Quote Transition Finale (starts seamlessly at 0.54 right as Card 5 exits)
      const quoteStart = 0.54;
      const quoteProg = clamp((progress - quoteStart) / (1.0 - quoteStart), 0, 1);

      if (quoteProg <= 0) {
        // Completely invisible while cards are in active center view before 0.66
        if (quoteLayer) {
          quoteLayer.style.opacity = "0";
          quoteLayer.style.visibility = "hidden";
        }
        if (quoteTitle) {
          quoteTitle.style.visibility = "hidden";
          quoteTitle.style.transform = "none";
        }
        if (quoteDesc) {
          quoteDesc.style.opacity = "0";
          quoteDesc.style.transform = "translateX(-50%)";
        }
        if (quoteMarks) {
          quoteMarks.style.transform = "none";
        }
        if (quoteWrap) {
          quoteWrap.style.transform = "translate(-50%, -50%)";
        }
        if (dotSampler) {
          dotSampler.clear();
        }
      } else {
        if (quoteLayer) {
          const layerFade = clamp(quoteProg / 0.04, 0, 1);
          quoteLayer.style.opacity = layerFade.toString();
          quoteLayer.style.visibility = "";
        }

        const startFactor = 3.5;
        const easePower = 2;
        const posY = -5.3;
        const dotEnd = 0.32;
        const wipeStart = 0.32;
        const dotJitter = 0.1;

        const C = 1 - Math.pow(1 - quoteProg, easePower);
        const P = startFactor - (startFactor - 1) * C;

        const vuFit = Math.min(Math.min(vw, 1728) / 100, (1.8 * vh) / 100);
        const eUnit = Math.min(vh / 100, 0.625 * vuFit);
        const T = posY * C * eUnit;

        if (quoteWrap) {
          quoteWrap.style.transform = `translate(calc(-50% + 0vw), calc(-50% + ${T.toFixed(2)}px))`;
        }

        const qLayout = layoutCache.quote;
        if (qLayout && qLayout.x && qLayout.b) {
          const { u, p, f, m, x, b } = qLayout;
          const k = vw * 0.5 + f;
          const R = 0.5 * vh + T + m;

          for (let t = 0; t < x.length; t++) {
            b[t].left = k + x[t].left * P;
            b[t].top = R + x[t].top * P;
            b[t].width = x[t].width * P;
            b[t].height = x[t].height * P;
          }

          const z = quoteProg > wipeStart;
          const B = z && u * P * Math.min(2, window.devicePixelRatio || 1) > 8192;
          const H = `calc(${9.5 * (B ? P : 1)} * var(--vu))`;
          if (quoteTitle) {
            if (quoteTitle.style.fontSize !== H) quoteTitle.style.fontSize = H;
            quoteTitle.style.visibility = z ? "" : "hidden";
            quoteTitle.style.transform = z && !B ? `scale(${P.toFixed(4)})` : "none";
          }

          // Quotation marks are NEVER scaled! Only vertical translation:
          const L = B ? 0 : (p * (P - 1)) / 2;
          if (quoteMarks) {
            quoteMarks.style.transform = `translateY(${-L.toFixed(2)}px)`;
          }

          // Quote description paragraph:
          if (quoteDesc) {
            const g = Math.max(13, 1.05 * vuFit);
            const W = z ? Math.max(13, 1.05 * vuFit * P) / g : 1;
            quoteDesc.style.transform = `translate(-50%, ${L.toFixed(2)}px) scale(${W.toFixed(4)})`;
            const maxDescW = `${Math.min(30 * g, (0.86 * vw) / W)}px`;
            if (quoteDesc.style.maxWidth !== maxDescW) quoteDesc.style.maxWidth = maxDescW;

            const descAlpha = clamp((quoteProg - wipeStart) / 0.35, 0, 1);
            quoteDesc.style.opacity = (0.85 * descAlpha).toFixed(3);
          }

          // Halftone particles canvas render & clipPath reveal per line
          if (dotSampler) {
            const lineFracs = dotSampler.render(
              quoteProg,
              { dotSize: 0.2, dotEnd, wipeStart, jitter: dotJitter },
              b
            );
            if (lineFracs && quoteLineEls.length) {
              quoteLineEls.forEach((lineEl, idx) => {
                const frac = lineFracs[idx] != null ? lineFracs[idx] : 0;
                if (frac >= 1) {
                  lineEl.style.clipPath = "none";
                } else {
                  const kVal = 118 * Math.max(0, frac);
                  lineEl.style.clipPath = `polygon(0 -15%, ${kVal.toFixed(1)}% -15%, ${(kVal - 18).toFixed(1)}% 115%, 0 115%)`;
                }
              });
            }
          }
        }
      }

      // 3. 3D Flying Rookie Card Handoff (desktop landscape: progress 0.015 -> 0.13)
      const canFly =
        !phone &&
        vw >= 1024 &&
        vw > vh &&
        heroCard &&
        firstCardBox &&
        flightProxy &&
        flightSpin &&
        heroCardRect &&
        firstCardRect;

      if (canFly) {
        const flyStart = 0.015;
        const flyEnd = 0.13;

        if (progress <= flyStart) {
          heroCard.style.visibility = "visible";
          firstCardBox.style.visibility = "hidden";
          if (firstCardTitle) firstCardTitle.style.opacity = "0";
          flightProxy.style.visibility = "hidden";
        } else if (progress < flyEnd) {
          const ft = smoothstep(clamp((progress - flyStart) / (flyEnd - flyStart), 0, 1));
          heroCard.style.visibility = "hidden";
          firstCardBox.style.visibility = "hidden";
          if (firstCardTitle) {
            firstCardTitle.style.opacity = String(clamp((ft - 0.75) / 0.25, 0, 1));
          }

          const w = lerp(heroCardRect.w, firstCardRect.w, ft);
          const h = lerp(heroCardRect.h, firstCardRect.h, ft);
          const cx = lerp(heroCardRect.cx, firstCardRect.cx + currentRailX, ft);
          const cy = lerp(heroCardRect.cy, firstCardRect.cy, ft) - Math.sin(ft * Math.PI) * 32;
          const rotY = 360 * ft;
          const rotZ = lerp(0, -1.8, ft);

          flightProxy.style.visibility = "visible";
          flightProxy.style.width = `${w.toFixed(1)}px`;
          flightProxy.style.height = `${h.toFixed(1)}px`;
          flightProxy.style.transform = `translate3d(${(cx - w / 2).toFixed(1)}px, ${(cy - h / 2).toFixed(1)}px, 0)`;
          flightSpin.style.transform = `rotateY(${rotY.toFixed(1)}deg) rotateZ(${rotZ.toFixed(2)}deg)`;
        } else {
          heroCard.style.visibility = "hidden";
          firstCardBox.style.visibility = "visible";
          if (firstCardTitle) {
            firstCardTitle.style.opacity = "1";
          }
          flightProxy.style.visibility = "hidden";
        }
      } else {
        if (heroCard) heroCard.style.visibility = "";
        if (firstCardBox) firstCardBox.style.visibility = "visible";
        if (firstCardTitle) firstCardTitle.style.opacity = "1";
        if (flightProxy) flightProxy.style.visibility = "hidden";
      }

      // 4. Per-Card Viewport Position 3D Tilt (computed purely from cached centers + currentRailX!)
      const halfVw = Math.max(1, vw / 2);
      for (let i = 0; i < cardBoxes.length; i++) {
        const box = cardBoxes[i];
        const centerX = (cardBaseCentersX[i] || halfVw) + currentRailX;
        const normX = clamp((centerX - halfVw) / halfVw, -1.5, 1.5);
        const absX = Math.min(1, Math.abs(normX));
        const isHovered = box.style.getPropertyValue("--hover") === "1";

        box.style.setProperty("--ry-pos", `${(10 * normX).toFixed(2)}deg`);
        box.style.setProperty("--rz", `${(2.2 * normX).toFixed(2)}deg`);

        if (!isHovered) {
          box.style.setProperty("--scale", (1 - 0.08 * absX).toFixed(3));
          box.style.setProperty("--tz", `${(-80 * absX).toFixed(1)}px`);
        }
      }
    }

    function tickScroll() {
      scrollRaf = 0;
      const diff = targetProgress - currentProgress;
      const absDiff = Math.abs(diff);

      if (absDiff > 0.00008 && !isReducedMotion()) {
        // High-performance dynamic lerp: immediate responsiveness + silky fluid glide
        const factor = Math.min(0.24 + absDiff * 0.6, 0.45);
        currentProgress += diff * factor;
        renderStageFrame(currentProgress);
        scrollRaf = requestAnimationFrame(tickScroll);
      } else {
        currentProgress = targetProgress;
        renderStageFrame(currentProgress);
      }
    }

    function updateStageOnScroll() {
      targetProgress = getScrollProgress();
      if (!scrollRaf) {
        scrollRaf = requestAnimationFrame(tickScroll);
      }
    }

    initYardLines();
    measureStageLayout();
    targetProgress = getScrollProgress();
    currentProgress = targetProgress;
    renderStageFrame(currentProgress);

    window.addEventListener("scroll", updateStageOnScroll, { passive: true });
    window.addEventListener("resize", () => {
      measureStageLayout();
      updateStageOnScroll();
    });
  }

  // ============================================================================
  // SECTION 4: THE JJETS FOUNDATION (BUILDING SOMETHING THAT LASTS)
  // Accordion tile hover interactions & light tone header adaptation
  // ============================================================================
  function initFoundation() {
    const section = document.getElementById("foundation");
    if (!section) return;

    const gallery = section.querySelector(".fnd-gallery");
    const tiles = section.querySelectorAll(".fnd-tile");
    const defaultIndex = 3; // Strip 4: Justin dancing with kids

    const mobileRail = section.querySelector(".fnd-mobile-rail");
    if (mobileRail) {
      // Touch uses native scrolling; mouse dragging also works in mobile previews.
      let railDrag = null;
      mobileRail.addEventListener("pointerdown", (event) => {
        if (event.pointerType !== "mouse" || event.button !== 0) return;
        railDrag = { x: event.clientX, scroll: mobileRail.scrollLeft };
        mobileRail.setPointerCapture(event.pointerId);
        mobileRail.classList.add("is-dragging");
        event.preventDefault();
      });
      mobileRail.addEventListener("pointermove", (event) => {
        if (!railDrag) return;
        mobileRail.scrollLeft = railDrag.scroll + railDrag.x - event.clientX;
      });
      const endRailDrag = () => {
        railDrag = null;
        mobileRail.classList.remove("is-dragging");
      };
      mobileRail.addEventListener("pointerup", endRailDrag);
      mobileRail.addEventListener("pointercancel", endRailDrag);
      mobileRail.addEventListener("lostpointercapture", endRailDrag);
    }

    if (gallery && tiles.length) {
      function setActiveTile(index) {
        tiles.forEach((tile, i) => {
          if (i === index) {
            tile.classList.add("is-active");
          } else {
            tile.classList.remove("is-active");
          }
        });
      }

      tiles.forEach((tile, index) => {
        tile.addEventListener("pointerenter", () => {
          setActiveTile(index);
        });
        tile.addEventListener("focus", () => {
          setActiveTile(index);
        });
      });

      gallery.addEventListener("pointerleave", () => {
        setActiveTile(defaultIndex);
      });
    }

    // Toggle header dark theme when over Section 4
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            document.body.classList.toggle("in-foundation", entry.isIntersecting);
          });
        },
        {
          rootMargin: "-60px 0px -60px 0px",
          threshold: 0.08,
        }
      );
      observer.observe(section);
    }
  }

  // ============================================================================
  // SECTION 5: FOOTER (RECORDS WERE MADE TO BE BROKEN)
  // Background darkening on approach, dynamic signature, and header hiding
  // ============================================================================
  async function initFooter() {
    const footer = document.getElementById("footer");
    if (!footer) return;

    // 1. Tandem continuous darkening: Footer starts in the same light sand (#d3c8ba) as Section 4
    // and both seamlessly darken together into dark ink (#171220) as the user scrolls
    function updateFooterDarkening() {
      const rect = footer.getBoundingClientRect();
      const vh = window.innerHeight || 1;

      // Progress goes from 0 (when footer enters at rect.top = vh) to 1 (when footer reaches top rect.top <= 0.10 * vh)
      const rawProgress = (vh - rect.top) / (0.90 * vh);
      const progress = Math.max(0, Math.min(1, rawProgress));

      // Continuous Lerp background: Light Sand #d3c8ba (211, 200, 186) -> Dark Ink #171220 (23, 18, 32)
      const cr = Math.round(234 + (36 - 234) * progress);
      const cg = Math.round(223 + (12 - 223) * progress);
      const cb = Math.round(208 + (23 - 208) * progress);

      // Continuous Lerp text: Deep Ink #171220 (23, 18, 32) -> Bone White #f6f3ef (246, 243, 239)
      const dk = progress < 0.42;
      const tr = dk ? 36 : 247;
      const tg = dk ? 12 : 242;
      const tb = dk ? 23 : 236;

      document.documentElement.style.setProperty("--fd-color", `rgb(${cr}, ${cg}, ${cb})`);
      document.documentElement.style.setProperty("--fd-text", `rgb(${tr}, ${tg}, ${tb})`);
      document.documentElement.style.setProperty("--fdp", progress.toFixed(3));

      if (progress >= 0.70) {
        document.body.setAttribute("data-footer-dark", "1");
      } else {
        document.body.removeAttribute("data-footer-dark");
      }
    }

    window.addEventListener("scroll", updateFooterDarkening, { passive: true });
    window.addEventListener("resize", updateFooterDarkening);
    updateFooterDarkening();

    // 2. Load Purple Signature Animation
    const sigContainer = document.getElementById("footer-sig");
    if (sigContainer && window.lottie && typeof getSignatureData === "function") {
      try {
        const animData = await getSignatureData("#9E6DE9");
        if (animData) {
          sigContainer.innerHTML = "";
          const anim = window.lottie.loadAnimation({
            container: sigContainer,
            renderer: "svg",
            loop: false,
            autoplay: false,
            animationData: animData,
          });

          let hasPlayed = false;
          if ("IntersectionObserver" in window) {
            const sigObserver = new IntersectionObserver(
              (entries) => {
                entries.forEach((entry) => {
                  if (entry.isIntersecting && !hasPlayed) {
                    hasPlayed = true;
                    anim.play();
                  }
                });
              },
              { threshold: 0.2 }
            );
            sigObserver.observe(footer);
          } else {
            anim.play();
          }
        }
      } catch (err) {
        console.warn("Footer signature lottie error:", err);
      }
    }
  }

  // Initialize everything
  initSignatures();
  initHomeStageAndMoments();
  initFoundation();
  initFooter();

  initHeroPortrait(() => {
    triggerEntranceOnce();
  });

  // Safety fallback if textures take long
  setTimeout(() => {
    triggerEntranceOnce();
  }, 1500);
})();


/* ===== Moraí: clique nos cards abre a página do empreendimento ===== */
(function(){
  var down=null;
  document.addEventListener('pointerdown',function(e){down={x:e.clientX,y:e.clientY}},true);
  document.addEventListener('click',function(e){
    var box=e.target.closest&&e.target.closest('[data-href]');
    if(!box)return;
    if(down&&(Math.abs(e.clientX-down.x)>8||Math.abs(e.clientY-down.y)>8))return;
    location.href=box.getAttribute('data-href');
  });
  document.addEventListener('keydown',function(e){
    if(e.key!=='Enter')return;
    var box=e.target.closest&&e.target.closest('[data-href]');
    if(box)location.href=box.getAttribute('data-href');
  });
})();

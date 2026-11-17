/* =========================================================
   THAIGODEV — engine do portfólio 2D
   ========================================================= */
(() => {
    'use strict';

    const $ = (s, el = document) => el.querySelector(s);
    const $$ = (s, el = document) => [...el.querySelectorAll(s)];
    const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
    const lerp = (a, b, t) => a + (b - a) * t;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const store = {
        get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
        set(k, v) { try { sessionStorage.setItem(k, v); } catch { /* sem storage */ } },
    };

    /* =====================================================
       SOM (WebAudio, desligado por padrão)
       ===================================================== */
    const sound = {
        on: false,
        ctx: null,
        beep(freq, dur = 0.08, delay = 0, type = 'square', slide) {
            if (!this.on || !this.ctx) return;
            const t = this.ctx.currentTime + delay;
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.type = type;
            o.frequency.setValueAtTime(freq, t);
            if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
            g.gain.setValueAtTime(0.06, t);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            o.connect(g).connect(this.ctx.destination);
            o.start(t);
            o.stop(t + dur + 0.02);
        },
        coin() { this.beep(988, 0.07); this.beep(1319, 0.22, 0.07); },
        select() { this.beep(660, 0.04); },
        flag() { [523, 659, 784, 1047].forEach((f, i) => this.beep(f, 0.09, i * 0.07)); },
        jump() { this.beep(300, 0.14, 0, 'square', 700); },
        start() { [392, 523, 659, 784, 1047].forEach((f, i) => this.beep(f, 0.1, i * 0.08)); },
        power() { [523, 784, 659, 1047, 784, 1319].forEach((f, i) => this.beep(f, 0.08, i * 0.06)); },
    };

    const soundBtn = $('#sound-toggle');
    soundBtn.addEventListener('click', () => {
        sound.on = !sound.on;
        if (sound.on && !sound.ctx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (AC) sound.ctx = new AC();
        }
        soundBtn.setAttribute('aria-pressed', String(sound.on));
        soundBtn.innerHTML = sound.on
            ? '<i class="fa-solid fa-volume-high"></i>'
            : '<i class="fa-solid fa-volume-xmark"></i>';
        sound.select();
    });

    /* =====================================================
       SPRITE DO PERSONAGEM (12×16, original)
       ===================================================== */
    const PAL = {
        H: '#1b1410', S: '#e0a982', s: '#b97a57', G: '#0d1117', g: '#6cc3c9',
        B: '#3a2a20', P: '#e46aa8', p: '#a8457a', L: '#2e5e6b', K: '#e6edf3',
    };
    const HEAD = [
        '...HHHHH....',
        '..HHHHHHHH..',
        '.HHHHHHHHH..',
        '.HHHSSSSSH..',
        '.HHSGGGSGGG.',
        '.HSSGgGSGgG.',
        '..SSSSSSSs..',
        '..SBSSSSBS..',
        '...BBBBBB...',
        '..pPPPPPPp..',
    ];
    const FRAMES = {
        idle: [...HEAD, '.pPPPPPPPPp.', '.SpPPPPPPpS.', '..LLLLLLLL..', '..LLL..LLL..', '..LL....LL..', '.KKK...KKK..'],
        run1: [...HEAD, '.pPPPPPPPPS.', 'SpPPPPPPPp..', '..LLLLLLLL..', '.LLL...LLL..', 'LL......LL..', 'KK.......KKK'],
        run2: [...HEAD, '.SPPPPPPPPp.', '..pPPPPPPpS.', '..LLLLLLLL..', '...LLLLL....', '....LLL.....', '...KKKK.....'],
        jump: [...HEAD, 'SpPPPPPPPpS.', '.pPPPPPPPp..', '..LLLLLLLL..', '.LLL..LLL...', '.KK....KK...', '............'],
    };
    // variante "idle" com reflexo do óculos andando
    FRAMES.idle2 = FRAMES.idle.map((r, i) => (i === 5 ? '.HSSGGgSGGg.' : r));

    function drawSprite(canvas, name) {
        if (canvas._frame === name) return;
        canvas._frame = name;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 12, 16);
        FRAMES[name].forEach((row, y) => {
            for (let x = 0; x < row.length; x++) {
                const c = PAL[row[x]];
                if (c) { ctx.fillStyle = c; ctx.fillRect(x, y, 1, 1); }
            }
        });
    }

    /* =====================================================
       BOOT
       ===================================================== */
    const boot = $('#boot');
    const bootLog = $('#boot-log');
    const bootStart = $('#boot-start');
    let booted = false;

    function closeBoot() {
        if (booted) return;
        booted = true;
        boot.classList.add('off');
        document.body.classList.remove('locked');
        store.set('booted', '1');
        sound.start();
        setTimeout(() => boot.remove(), 600);
    }

    if (store.get('booted') || reduced) {
        boot.remove();
        booted = true;
    } else {
        document.body.classList.add('locked');
        const lines = [
            '<span class="t">THAIGO_OS</span> BIOS v2.6 — (c) 2026',
            'CPU: JVM 21 ................ <span class="y">OK</span>',
            'MEM: 640K de café .......... <span class="y">OK</span>',
            'LOAD spring-boot.jar ....... <span class="y">OK</span>',
            'LOAD nest.js ............... <span class="y">OK</span>',
            'MOUNT /home/thiago ......... <span class="y">OK</span>',
            '',
            '<span class="p">&gt;</span> READY_',
        ];
        lines.forEach((l, i) => setTimeout(() => {
            if (!booted) bootLog.innerHTML += l + '\n';
        }, 140 * i + 150));
        setTimeout(() => bootStart.classList.add('show'), 140 * lines.length + 200);
        setTimeout(closeBoot, 140 * lines.length + 2600);

        bootStart.addEventListener('click', closeBoot);
        boot.addEventListener('click', closeBoot);
        window.addEventListener('keydown', closeBoot, { once: true });
        window.addEventListener('wheel', closeBoot, { once: true, passive: true });
        window.addEventListener('touchmove', closeBoot, { once: true, passive: true });
    }

    /* =====================================================
       TOASTS / SCORE
       ===================================================== */
    const toasts = $('#toasts');
    function toast(title, text) {
        const el = document.createElement('div');
        el.className = 'toast px-box';
        el.innerHTML = `<b>${title}</b>${text}`;
        toasts.appendChild(el);
        setTimeout(() => el.remove(), 3700);
    }

    const achievements = new Set();
    function achieve(id, title, text) {
        if (achievements.has(id)) return;
        achievements.add(id);
        bonus += 1000;
        toast(`★ ${title}`, text);
        sound.flag();
    }

    const scoreEl = $('#score');
    const coinsEl = $('#coins');
    let coins = 0;
    let bonus = 0;
    let maxProg = 0;
    let shownScore = -1;

    function popScore(x, y, txt) {
        const el = document.createElement('span');
        el.className = 'score-pop';
        el.textContent = txt;
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 800);
    }

    function updateScore() {
        const s = Math.round(maxProg * 900) * 10 + coins * 500 + bonus;
        if (s !== shownScore) {
            shownScore = s;
            scoreEl.textContent = String(s).padStart(6, '0');
        }
    }

    /* =====================================================
       MUNDO — parallax em pixel art (canvas low-res)
       ===================================================== */
    const world = $('#world');
    const wctx = world.getContext('2d');
    const PX = 3;
    let W = 0, H = 0;

    const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    const mix = (a, b, t) => `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], t))).join(',')})`;

    // Paletas do céu ao longo da jornada: noite teal → crepúsculo rosa → roxo → amanhecer
    const SKY = [
        { p: 0.00, top: '#0a0e18', bot: '#1d3b4f', far: '#22495a', mid: '#2a2142', near: '#10141d', orb: '#e6edf3' },
        { p: 0.35, top: '#120d24', bot: '#4b2350', far: '#3b2b5e', mid: '#29173a', near: '#100e19', orb: '#f2a7c8' },
        { p: 0.70, top: '#0b0f17', bot: '#2a1650', far: '#2c3060', mid: '#1f1636', near: '#0d1018', orb: '#6cc3c9' },
        { p: 1.00, top: '#1a0f2e', bot: '#b8508a', far: '#5c3b6c', mid: '#3a1f45', near: '#130c19', orb: '#f7c948' },
    ].map(k => ({ ...k, top: hex(k.top), bot: hex(k.bot), far: hex(k.far), mid: hex(k.mid), near: hex(k.near), orb: hex(k.orb) }));

    function skyAt(p) {
        let i = 0;
        while (i < SKY.length - 2 && p > SKY[i + 1].p) i++;
        const a = SKY[i], b = SKY[i + 1];
        const t = clamp((p - a.p) / (b.p - a.p));
        const out = {};
        for (const k of ['top', 'bot', 'far', 'mid', 'near', 'orb']) out[k] = a[k].map((v, j) => lerp(v, b[k][j], t));
        return out;
    }
    const rgb = c => `rgb(${c.map(Math.round).join(',')})`;
    const shade = (c, f) => rgb(c.map(v => clamp(v * f, 0, 255)));

    // gerador determinístico
    const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

    let stars = [];
    let flies = [];
    const CITY_PERIOD = 900;
    let city = [];

    function buildCity() {
        city = [];
        let x = 0, i = 0;
        while (x < CITY_PERIOD) {
            const w = 10 + Math.floor(hash(i) * 16);
            const h = 14 + Math.floor(hash(i + 50) * 46);
            const antenna = hash(i + 90) > 0.75;
            city.push({ x, w, h, antenna, seed: i });
            x += w + (hash(i + 7) > 0.6 ? 2 : 0);
            i++;
        }
    }

    function resizeWorld() {
        W = Math.ceil(innerWidth / PX);
        H = Math.ceil(innerHeight / PX);
        world.width = W;
        world.height = H;
        stars = Array.from({ length: Math.floor(W * H / 260) }, (_, i) => ({
            x: hash(i * 3.1) * W, y: hash(i * 7.7) * H * 0.62, tw: hash(i * 1.3) * 6.28, big: hash(i * 9.9) > 0.93,
        }));
        flies = Array.from({ length: 22 }, (_, i) => ({
            x: hash(i * 4.4) * W, y: hash(i * 2.2) * H, sp: 0.05 + hash(i) * 0.12, c: i % 3,
        }));
    }

    const WINDOW_COLORS = ['#f7c948', '#e46aa8', '#6cc3c9'];
    const cloudShapes = [[0, 2, 14, 3], [3, 0, 7, 3], [9, 1, 4, 2]];

    function drawWorld(t, sy, p) {
        const c = skyAt(p);
        // céu em faixas (dithering “banded”)
        const bands = 14;
        for (let i = 0; i < bands; i++) {
            const tt = i / (bands - 1);
            wctx.fillStyle = mix(c.top, c.bot, tt * tt);
            wctx.fillRect(0, Math.floor(i * H / bands), W, Math.ceil(H / bands) + 1);
        }

        // estrelas (somem no amanhecer)
        const starA = clamp(1 - (p - 0.82) / 0.18);
        if (starA > 0) {
            for (const s of stars) {
                const a = (0.45 + 0.55 * Math.sin(t * 0.002 + s.tw)) * starA;
                if (a < 0.15) continue;
                wctx.globalAlpha = a;
                wctx.fillStyle = s.big ? '#f7c948' : '#e6edf3';
                const sx = ((s.x - sy * 0.01) % W + W) % W;
                wctx.fillRect(Math.floor(sx), Math.floor(s.y), 1, 1);
                if (s.big && a > 0.7) {
                    wctx.fillRect(Math.floor(sx) - 1, Math.floor(s.y), 3, 1);
                    wctx.fillRect(Math.floor(sx), Math.floor(s.y) - 1, 1, 3);
                }
            }
            wctx.globalAlpha = 1;
        }

        // lua → sol
        const ox = Math.floor(W * 0.78);
        const oy = Math.floor(lerp(H * 0.2, H * 0.3, clamp(p / 0.8)) - clamp((p - 0.8) / 0.2) * H * 0.08);
        const r = Math.max(8, Math.floor(Math.min(W, H) * 0.045));
        wctx.fillStyle = rgb(c.orb);
        for (let y = -r; y <= r; y++) {
            const half = Math.floor(Math.sqrt(r * r - y * y));
            wctx.fillRect(ox - half, oy + y, half * 2 + 1, 1);
        }
        if (p < 0.75) { // crateras
            wctx.fillStyle = shade(c.orb, 0.82);
            wctx.fillRect(ox - Math.floor(r * 0.4), oy - Math.floor(r * 0.3), 3, 2);
            wctx.fillRect(ox + Math.floor(r * 0.2), oy + Math.floor(r * 0.25), 4, 3);
            wctx.fillRect(ox - Math.floor(r * 0.1), oy + Math.floor(r * 0.5), 2, 2);
        }

        // nuvens
        wctx.fillStyle = mix(c.bot, [230, 237, 243], 0.18);
        for (let i = 0; i < 5; i++) {
            const base = hash(i + 200) * W * 1.5;
            const cx = Math.floor(((base + t * 0.004 * (1 + i * 0.3) - sy * 0.02) % (W + 60) + W + 60) % (W + 60)) - 30;
            const cy = Math.floor(H * (0.08 + hash(i + 300) * 0.3));
            for (const [x, y, w, h] of cloudShapes) wctx.fillRect(cx + x, cy + y, w, h);
        }

        // montanhas distantes
        const offFar = sy * 0.012;
        const baseFar = H * 0.66;
        for (let x = 0; x < W; x++) {
            const wx = Math.floor((x + offFar) / 2) * 2;
            const h = H * 0.13 * (Math.sin(wx * 0.011) * 0.6 + Math.sin(wx * 0.027 + 2) * 0.4 + 1) * 0.6 + H * 0.04;
            const y = Math.floor(baseFar - h);
            wctx.fillStyle = rgb(c.far);
            wctx.fillRect(x, y, 1, H - y);
            if (h > H * 0.12) { wctx.fillStyle = shade(c.far, 1.45); wctx.fillRect(x, y, 1, 2); }
        }

        // colinas médias
        const offMid = sy * 0.03;
        const baseMid = H * 0.78;
        wctx.fillStyle = rgb(c.mid);
        for (let x = 0; x < W; x++) {
            const wx = Math.floor((x + offMid) / 3) * 3;
            const h = H * 0.07 * (Math.sin(wx * 0.02 + 1) + Math.sin(wx * 0.043) * 0.5 + 1.5);
            const y = Math.floor(baseMid - h);
            wctx.fillRect(x, y, 1, H - y);
        }

        // vagalumes / partículas
        for (const f of flies) {
            const fy = ((f.y - t * f.sp * 0.05 - sy * 0.02) % H + H) % H;
            const fx = f.x + Math.sin(t * 0.001 + f.y) * 4;
            wctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 0.004 + f.x);
            wctx.fillStyle = WINDOW_COLORS[f.c];
            wctx.fillRect(Math.floor(fx), Math.floor(fy), 1, 1);
        }
        wctx.globalAlpha = 1;

        // cidade em primeiro plano
        const offNear = sy * 0.08;
        const ground = H - 6;
        const nearC = rgb(c.near);
        const startX = -((offNear % CITY_PERIOD) + CITY_PERIOD) % CITY_PERIOD;
        for (let rep = startX; rep < W; rep += CITY_PERIOD) {
            for (const b of city) {
                const bx = Math.floor(rep + b.x);
                if (bx > W || bx + b.w < 0) continue;
                const by = ground - b.h;
                wctx.fillStyle = nearC;
                wctx.fillRect(bx, by, b.w, b.h);
                if (b.antenna) {
                    wctx.fillRect(bx + Math.floor(b.w / 2), by - 6, 1, 6);
                    if (Math.floor(t / 600 + b.seed) % 2) {
                        wctx.fillStyle = '#ff5d73';
                        wctx.fillRect(bx + Math.floor(b.w / 2), by - 7, 1, 1);
                    }
                }
                // janelas
                for (let wy = by + 3; wy < ground - 3; wy += 4) {
                    for (let wx = bx + 2; wx < bx + b.w - 2; wx += 3) {
                        const hv = hash(wx * 0.37 + wy * 1.91 + b.seed);
                        if (hv > 0.72) {
                            const flick = hv > 0.985 && Math.floor(t / 300 + hv * 10) % 3 === 0;
                            if (flick) continue;
                            wctx.fillStyle = WINDOW_COLORS[Math.floor(hv * 100) % 3];
                            wctx.globalAlpha = 0.85;
                            wctx.fillRect(wx, wy, 1, 1);
                        }
                    }
                }
                wctx.globalAlpha = 1;
            }
        }
        // chão
        wctx.fillStyle = '#0a0d12';
        wctx.fillRect(0, ground, W, H - ground);
        wctx.fillStyle = shade(c.far, 1.2);
        wctx.fillRect(0, ground, W, 1);

        // véu escuro para legibilidade do conteúdo
        wctx.fillStyle = 'rgba(13,17,23,0.28)';
        wctx.fillRect(0, 0, W, H);
    }

    /* =====================================================
       REFERÊNCIAS DE CENA
       ===================================================== */
    const titleSec = $('#start');
    const titleWrap = $('#title-wrap');
    const heroBig = $('#hero-big');
    const bubble = $('#hero-bubble');
    const bubbleText = $('#hero-bubble-text');
    const track = $('#track');
    const trackHero = $('#track-hero');
    const trackFlags = $('#track-flags');
    const xpFill = $('#xp-fill');
    const worldName = $('#world-name');
    const sections = $$('main > section[data-world]');
    const questMap = $('#quest-map');
    const questFill = $('#quest-fill');
    const quests = $$('.quest');
    const bossSec = $('#projects');
    const bossTrack = $('#boss-track');
    const bosses = $$('.boss');
    const bossIdx = $('#boss-idx');
    $('#boss-total').textContent = bosses.length;

    drawSprite(heroBig, 'idle');
    drawSprite(trackHero, 'idle');

    /* ---------- falas do herói na tela de título ---------- */
    const LINES = [
        'Olá, jogador! Eu sou o Thiago.',
        'Dev back-end: Java, Spring e Nest.js. Bora explorar?',
    ];
    let bubbleLine = -1;
    let bubbleTimer = null;
    function sayLine(i) {
        if (i === bubbleLine) return;
        bubbleLine = i;
        clearInterval(bubbleTimer);
        if (i < 0) { bubble.classList.remove('show'); return; }
        bubble.classList.add('show');
        const txt = LINES[i];
        if (reduced) { bubbleText.textContent = txt; return; }
        let n = 0;
        bubbleText.textContent = '';
        bubbleTimer = setInterval(() => {
            n++;
            bubbleText.textContent = txt.slice(0, n);
            if (n % 3 === 0) sound.beep(880 + (n % 5) * 40, 0.02);
            if (n >= txt.length) clearInterval(bubbleTimer);
        }, 28);
    }

    /* ---------- bandeiras da trilha ---------- */
    let trackStart = 0;
    let flagPos = [];
    function buildFlags() {
        trackFlags.innerHTML = '';
        const docMax = document.documentElement.scrollHeight - innerHeight;
        trackStart = titleSec.offsetHeight - innerHeight;
        flagPos = sections.slice(1).map(sec => {
            const prog = clamp((sec.offsetTop - innerHeight * 0.4 - trackStart) / (docMax - trackStart));
            const el = document.createElement('div');
            el.className = 'track-flag';
            el.style.left = `calc(${prog * 100}% )`;
            el.innerHTML = `<a href="#${sec.id}" tabindex="-1" aria-label="Ir para ${sec.dataset.world}"></a>`;
            trackFlags.appendChild(el);
            return { prog, el, hit: false };
        });
    }

    /* ---------- boss rush horizontal ---------- */
    let bossMax = 0;
    function layoutBoss() {
        bossTrack.style.transform = 'none';
        bossMax = Math.max(0, bossTrack.scrollWidth - innerWidth);
        bossSec.style.height = (bossMax + innerHeight) + 'px';
    }

    /* =====================================================
       LOOP PRINCIPAL
       ===================================================== */
    let lastY = -1;
    let lastMove = 0;
    let dir = 1;
    let heroX = 0;
    let jumpT = -1;
    let currentWorld = '';
    let startedScroll = false;

    function onScrollFrame(t) {
        const y = scrollY;
        const vh = innerHeight;
        const docMax = Math.max(1, document.documentElement.scrollHeight - vh);
        const prog = clamp(y / docMax);

        if (y !== lastY) {
            if (lastY >= 0) { dir = y > lastY ? 1 : -1; lastMove = t; }
            lastY = y;
        }
        maxProg = Math.max(maxProg, prog);
        xpFill.style.transform = `scaleX(${prog})`;
        updateScore();

        if (!startedScroll && y > 80) {
            startedScroll = true;
            achieve('start', 'CONQUISTA', 'Primeiro passo dado.');
        }

        /* ---- tela de título (scrub) ---- */
        const tp = clamp(y / Math.max(1, titleSec.offsetHeight - vh));
        const fade = clamp((tp - 0.12) / 0.22);
        titleWrap.style.opacity = String(1 - fade);
        titleWrap.style.transform = `translateY(${-tp * 160}px) scale(${1 + fade * 0.25})`;

        const center = innerWidth / 2 - heroBig.offsetWidth / 2;
        let hx, frame;
        const moving = t - lastMove < 140;
        if (tp < 0.3) {
            hx = lerp(-140, center, clamp(tp / 0.3));
        } else if (tp < 0.82) {
            hx = center;
        } else {
            hx = lerp(center, innerWidth + 60, clamp((tp - 0.82) / 0.16));
        }
        if (Math.abs(hx - heroX) > 0.5 || (moving && (tp < 0.3 || tp >= 0.82))) {
            frame = Math.floor(hx / 22) % 2 ? 'run1' : 'run2';
        } else {
            frame = Math.floor(t / 900) % 4 === 0 ? 'idle2' : 'idle';
        }
        heroX = hx;
        drawSprite(heroBig, frame);
        heroBig.style.transform = `translateX(${hx}px) scaleX(${tp < 0.3 && dir < 0 ? -1 : 1})`;

        sayLine(tp < 0.32 || tp > 0.84 ? -1 : tp < 0.56 ? 0 : 1);

        /* ---- trilha inferior ---- */
        const showTrack = y > trackStart - vh * 0.1;
        track.classList.toggle('show', showTrack);
        const tprog = clamp((y - trackStart) / Math.max(1, docMax - trackStart));
        const trackW = trackFlags.clientWidth;
        let jy = 0;
        flagPos.forEach(f => {
            const hit = tprog >= f.prog - 0.002;
            if (hit && !f.hit) { jumpT = t; sound.jump(); }
            f.hit = hit;
            f.el.classList.toggle('hit', hit);
        });
        if (jumpT >= 0) {
            const jt = (t - jumpT) / 420;
            if (jt >= 1) jumpT = -1;
            else jy = -Math.sin(jt * Math.PI) * 22;
        }
        drawSprite(trackHero, jumpT >= 0 ? 'jump' : moving ? (Math.floor(t / 110) % 2 ? 'run1' : 'run2') : (Math.floor(t / 900) % 4 === 0 ? 'idle2' : 'idle'));
        trackHero.style.transform = `translate(${tprog * (trackW - 6)}px, ${Math.round(jy)}px) scaleX(${dir})`;

        /* ---- mundo atual ---- */
        let cur = sections[0];
        for (const s of sections) if (s.offsetTop <= y + vh * 0.45) cur = s;
        if (cur.dataset.world !== currentWorld) {
            currentWorld = cur.dataset.world;
            worldName.textContent = currentWorld;
            if (cur.id === 'contact') achieve('end', 'ZEROU!', 'Você chegou ao save point.');
        }

        /* ---- quest log ---- */
        const qr = questMap.getBoundingClientRect();
        questFill.style.transform = `scaleY(${clamp((vh * 0.62 - qr.top) / qr.height)})`;
        quests.forEach(q => {
            const r = q.getBoundingClientRect();
            const reached = r.top < vh * 0.62;
            if (reached && !q.classList.contains('reached')) sound.flag();
            q.classList.toggle('reached', reached);
        });

        /* ---- boss rush ---- */
        const bp = clamp((y - bossSec.offsetTop) / Math.max(1, bossSec.offsetHeight - vh));
        bossTrack.style.transform = `translate3d(${-bp * bossMax}px,0,0)`;
        let active = 0;
        bosses.forEach((b, i) => {
            const r = b.getBoundingClientRect();
            const mid = r.left + r.width / 2;
            if (mid < innerWidth * 0.62) active = i;
            const visible = r.top < vh && r.bottom > 0;
            if (visible && mid < innerWidth * 0.62 && !b.classList.contains('beaten')) b.classList.add('beaten');
        });
        bosses.forEach((b, i) => b.classList.toggle('active', i === active));
        bossIdx.textContent = active + 1;
    }

    function loop(t) {
        onScrollFrame(t);
        drawWorld(reduced ? 0 : t, scrollY / PX, clamp(scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight)));
        requestAnimationFrame(loop);
    }

    /* =====================================================
       REVEALS / MOEDAS / DIÁLOGO
       ===================================================== */
    const io = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (!e.isIntersecting) return;
            e.target.classList.add('in');
            io.unobserve(e.target);
            if (e.target.matches('[data-type]')) typeDialog(e.target);
        });
    }, { threshold: 0.18, rootMargin: '0px 0px -40px 0px' });
    $$('.reveal').forEach(el => io.observe(el));
    const invGrid = $('#inv-grid');
    io.observe(invGrid);

    const coinEls = $$('.coin');
    const coinIO = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (!e.isIntersecting || e.target.classList.contains('got')) return;
            const el = e.target;
            el.classList.add('got');
            coinIO.unobserve(el);
            coins++;
            coinsEl.textContent = String(coins).padStart(2, '0');
            const r = el.getBoundingClientRect();
            popScore(r.left, r.top, '+500');
            sound.coin();
            if (coins === coinEls.length) achieve('coins', 'COLECIONADOR', `Todas as ${coins} moedas!`);
        });
    }, { rootMargin: '-35% 0px -35% 0px' });
    coinEls.forEach(c => coinIO.observe(c));

    function typeDialog(box) {
        if (reduced) return;
        const body = $('.dialog-body', box);
        body.style.minHeight = body.offsetHeight + 'px';
        const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
        const nodes = [];
        while (walker.nextNode()) nodes.push({ node: walker.currentNode, text: walker.currentNode.textContent });
        nodes.forEach(n => (n.node.textContent = ''));
        let ni = 0, ci = 0, done = false;
        const finish = () => {
            done = true;
            nodes.forEach(n => (n.node.textContent = n.text));
        };
        box.addEventListener('click', finish, { once: true });
        const tick = () => {
            if (done) return;
            for (let k = 0; k < 3 && ni < nodes.length; k++) {
                const n = nodes[ni];
                ci++;
                n.node.textContent = n.text.slice(0, ci);
                if (ci >= n.text.length) { ni++; ci = 0; }
            }
            if (ni < nodes.length) setTimeout(tick, 16);
        };
        tick();
    }

    /* =====================================================
       RETRATO 8-BIT (quantizado na paleta do tema)
       ===================================================== */
    const portraitFrame = $('#portrait');
    const portraitImg = $('.portrait-photo', portraitFrame);
    const portraitCv = $('#portrait-pixel');
    const portraitBtn = $('#portrait-toggle');
    const PORTRAIT_PAL = [
        '#0d1117', '#1b1410', '#2b2f3a', '#3a2a20', '#6b4a3a', '#a8735a', '#e0a982', '#f2c9a5',
        '#3f8a93', '#6cc3c9', '#b9e3e6', '#a8457a', '#e46aa8', '#4c2a85', '#8b5cf6', '#e6edf3', '#f7c948',
    ].map(hex);
    const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];

    function pixelatePortrait() {
        const N = 56;
        portraitCv.width = N;
        portraitCv.height = N;
        const ctx = portraitCv.getContext('2d', { willReadFrequently: true });
        const iw = portraitImg.naturalWidth, ih = portraitImg.naturalHeight;
        const s = Math.min(iw * 0.66, ih);
        ctx.drawImage(portraitImg, iw * 0.2, ih * 0.17, s, s, 0, 0, N, N);
        let data;
        try { data = ctx.getImageData(0, 0, N, N); } catch { return; } // canvas "tainted" via file://
        const d = data.data;
        for (let y = 0; y < N; y++) {
            for (let x = 0; x < N; x++) {
                const i = (y * N + x) * 4;
                const dth = (BAYER[y % 4][x % 4] / 16 - 0.5) * 28;
                const r = d[i] + dth, g = d[i + 1] + dth, b = d[i + 2] + dth;
                let best = 0, bd = Infinity;
                PORTRAIT_PAL.forEach((c, k) => {
                    const dd = (r - c[0]) ** 2 * 0.3 + (g - c[1]) ** 2 * 0.59 + (b - c[2]) ** 2 * 0.11;
                    if (dd < bd) { bd = dd; best = k; }
                });
                [d[i], d[i + 1], d[i + 2]] = PORTRAIT_PAL[best];
            }
        }
        ctx.putImageData(data, 0, 0);
    }
    portraitImg.loading = 'eager';
    if (portraitImg.complete && portraitImg.naturalWidth) pixelatePortrait();
    else portraitImg.addEventListener('load', pixelatePortrait, { once: true });

    portraitBtn.addEventListener('click', () => {
        const hd = portraitFrame.classList.toggle('hd');
        portraitBtn.setAttribute('aria-pressed', String(hd));
        portraitBtn.textContent = hd ? '[B] MODO 8-BIT' : '[A] MODO HD';
        sound.select();
    });

    /* =====================================================
       INVENTÁRIO
       ===================================================== */
    const DEV = 'https://cdn.jsdelivr.net/gh/devicons/devicon@v2.16.0/icons/';
    const RARITY = {
        legend: ['★ LENDÁRIO', '#f7c948'],
        epic: ['◆ ÉPICO', '#e46aa8'],
        rare: ['● RARO', '#6cc3c9'],
        common: ['○ COMUM', '#8b949e'],
    };
    const ITEMS = [
        { n: 'Java', i: 'java/java-original.svg', r: 'legend', c: 'back', d: 'Arma principal. Back-end corporativo, POO e APIs robustas.' },
        { n: 'Spring Boot', i: 'spring/spring-original.svg', r: 'legend', c: 'back', d: 'APIs REST em camadas, Spring Security, JPA e testes.' },
        { n: 'Nest.js', i: 'nestjs/nestjs-original.svg', r: 'epic', c: 'back', d: 'APIs escaláveis em TypeScript — usado no dia a dia na Univértix.' },
        { n: 'Node.js', i: 'nodejs/nodejs-original.svg', r: 'epic', c: 'back', d: 'Serviços e APIs com Express e integrações.' },
        { n: 'TypeScript', i: 'typescript/typescript-original.svg', r: 'epic', c: 'back', d: 'Tipagem forte em todo o ecossistema JS.' },
        { n: 'Hibernate / JPA', i: 'hibernate/hibernate-original.svg', r: 'rare', c: 'back', d: 'Mapeamento objeto-relacional no mundo Spring.', inv: true },
        { n: 'Express', i: 'express/express-original.svg', r: 'rare', c: 'back', d: 'APIs REST minimalistas em Node.', inv: true },
        { n: 'JUnit', i: 'junit/junit-original.svg', r: 'common', c: 'back', d: 'Testes unitários para manter os bosses derrotados.' },
        { n: 'Swagger', i: 'swagger/swagger-original.svg', r: 'common', c: 'back', d: 'Contratos de API documentados e testáveis.' },
        { n: 'PostgreSQL', i: 'postgresql/postgresql-original.svg', r: 'epic', c: 'data', d: 'Banco relacional favorito para dados sérios.' },
        { n: 'MySQL', i: 'mysql/mysql-original.svg', r: 'rare', c: 'data', d: 'Relacional do dia a dia em produção.' },
        { n: 'MongoDB', i: 'mongodb/mongodb-original.svg', r: 'rare', c: 'data', d: 'NoSQL para dados flexíveis e alto volume de acessos.' },
        { n: 'Docker', i: 'docker/docker-original.svg', r: 'epic', c: 'ops', d: 'Containers para rodar igual em qualquer mapa.' },
        { n: 'AWS', i: 'amazonwebservices/amazonwebservices-original-wordmark.svg', r: 'rare', c: 'ops', d: 'ECS e RDS para orquestrar e persistir em nuvem.', inv: true },
        { n: 'Linux / VPS', i: 'linux/linux-original.svg', r: 'rare', c: 'ops', d: 'Deploy, monitoramento e manutenção de servidores.' },
        { n: 'GitHub Actions', i: 'githubactions/githubactions-original.svg', r: 'rare', c: 'ops', d: 'Pipelines de CI/CD com entregas contínuas.' },
        { n: 'Git / GitHub', i: 'github/github-original.svg', r: 'common', c: 'ops', d: 'Versionamento e colaboração.', inv: true },
        { n: 'Postman', i: 'postman/postman-original.svg', r: 'common', c: 'ops', d: 'Testar e explorar APIs.' },
        { n: 'Next.js', i: 'nextjs/nextjs-original.svg', r: 'rare', c: 'front', d: 'Front-ends completos integrados às APIs.', inv: true },
        { n: 'React', i: 'react/react-original.svg', r: 'rare', c: 'front', d: 'Interfaces web e mobile (React Native).' },
        { n: 'Tailwind', i: 'tailwindcss/tailwindcss-original.svg', r: 'common', c: 'front', d: 'Estilo rápido e consistente.' },
    ];

    const invIcon = $('#inv-icon'), invName = $('#inv-name'), invRarity = $('#inv-rarity'), invDesc = $('#inv-desc');
    let activeSlot = null;

    function iconImg(it) {
        const img = document.createElement('img');
        img.src = DEV + it.i;
        img.alt = '';
        img.loading = 'lazy';
        if (it.inv) img.style.filter = 'invert(1) hue-rotate(180deg)';
        img.addEventListener('error', () => {
            const f = document.createElement('span');
            f.className = 'fallback';
            f.textContent = it.n.slice(0, 2).toUpperCase();
            img.replaceWith(f);
        }, { once: true });
        return img;
    }

    function selectItem(it, slot) {
        if (activeSlot) activeSlot.classList.remove('active');
        activeSlot = slot;
        slot.classList.add('active');
        invIcon.replaceChildren(iconImg(it));
        invName.textContent = it.n;
        invRarity.textContent = RARITY[it.r][0];
        invRarity.style.color = RARITY[it.r][1];
        invDesc.textContent = it.d;
        sound.select();
    }

    ITEMS.forEach((it, idx) => {
        const li = document.createElement('li');
        li.style.transitionDelay = `${idx * 35}ms`;
        const b = document.createElement('button');
        b.className = `slot r-${it.r}`;
        b.dataset.cat = it.c;
        b.setAttribute('aria-label', `${it.n} — ${RARITY[it.r][0]}`);
        b.appendChild(iconImg(it));
        b.addEventListener('mouseenter', () => selectItem(it, b));
        b.addEventListener('focus', () => selectItem(it, b));
        b.addEventListener('click', () => selectItem(it, b));
        li.appendChild(b);
        invGrid.appendChild(li);
    });

    $$('.inv-tabs button').forEach(tab => tab.addEventListener('click', () => {
        $$('.inv-tabs button').forEach(t => t.setAttribute('aria-selected', String(t === tab)));
        const f = tab.dataset.filter;
        $$('.slot', invGrid).forEach(s => s.classList.toggle('dim', f !== 'all' && s.dataset.cat !== f));
        sound.select();
    }));

    /* =====================================================
       PAUSE / MAPA
       ===================================================== */
    const pause = $('#pause');
    const menuBtn = $('#menu-toggle');
    function setPause(open) {
        pause.hidden = !open;
        menuBtn.setAttribute('aria-expanded', String(open));
        menuBtn.textContent = open ? 'FECHAR' : 'MAPA';
        document.body.classList.toggle('locked', open);
        if (open) $('a', pause).focus();
        sound.select();
    }
    menuBtn.addEventListener('click', () => setPause(pause.hidden));
    pause.addEventListener('click', e => { if (e.target === pause) setPause(false); });
    $$('a', pause).forEach(a => a.addEventListener('click', () => setPause(false)));

    /* =====================================================
       TECLADO: ESC + KONAMI
       ===================================================== */
    const KONAMI = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
    let kpos = 0;
    window.addEventListener('keydown', e => {
        if (e.key === 'Escape' && booted) setPause(pause.hidden);
        const k = e.key.toLowerCase();
        kpos = k === KONAMI[kpos] ? kpos + 1 : (k === KONAMI[0] ? 1 : 0);
        if (kpos === KONAMI.length) {
            kpos = 0;
            document.body.classList.toggle('cheat');
            sound.power();
            achieve('konami', 'CHEAT CODE', '+30 vidas. Modo arco-íris ativado!');
        }
    });

    /* =====================================================
       CONTINUE? countdown
       ===================================================== */
    const countdown = $('#countdown');
    let cdTimer = null, cd = 9;
    new IntersectionObserver(([e]) => {
        clearInterval(cdTimer);
        if (!e.isIntersecting) return;
        cdTimer = setInterval(() => {
            cd = cd <= 0 ? 9 : cd - 1;
            countdown.textContent = cd;
            if (cd <= 3) sound.beep(440, 0.05);
        }, 1000);
    }).observe(countdown);

    /* =====================================================
       INIT
       ===================================================== */
    function layout() {
        resizeWorld();
        layoutBoss();
        buildFlags();
    }
    buildCity();
    layout();
    let rt;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(layout, 120); });
    window.addEventListener('load', layout);
    if (document.fonts) document.fonts.ready.then(layout);
    requestAnimationFrame(loop);
})();

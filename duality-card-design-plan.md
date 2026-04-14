# DUALITY CARD — Design System & Implementation Plan
> Biglietto da visita 3D interattivo | Concept 5
> Versione snapshot: Aprile 2026

---

## 0. VISIONE GENERALE

Un singolo oggetto — un biglietto da visita — che racconta due identità complementari
e inscindibili. La metafora fisica del "girare un biglietto" diventa un atto rituale:
girare la carta significa attraversare un confine, passare dalla notte al giorno,
dal codice alla persona. Il mondo attorno alla carta **cambia con essa**.

```
FRONTE  →  "The Engineer"   →  Notte stellata  →  Toni digitali
RETRO   →  "The Human"      →  Alba mediterranea →  Suoni organici
```

---

## 1. SFONDO — "The Living World"

### 1.1 Struttura a layer

```
Layer 0 (base)   — gradient animato ciclico (notte ↔ alba)
Layer 1          — particelle generative (stelle / pollini)
Layer 2          — vignetta radiale ai bordi
Layer 3          — noise grain overlay (2–4% opacity, texture)
Layer 4 (top)    — il biglietto 3D fluttuante
```

### 1.2 Stato NOTTE (fronte attivo)

| Proprietà       | Valore                                                    |
|-----------------|-----------------------------------------------------------|
| Colore base     | `#02020a` — nero profondo quasi blu notte                 |
| Gradient mesh   | radiale `#0a0a1a` → `#02020a`, centro leggermente spostato in alto |
| Tint accento    | aureola blu elettrico `#1a3aff` a 4% opacity attorno al biglietto |
| Particelle      | stelle — 180 punti, dimensioni 0.5–2px, movimento browniano lentissimo |
| Velocità drift  | 0.015px/frame — quasi impercettibili                      |
| Parallasse      | layer stelle vicine: 8% cursore / layer stelle lontane: 2% cursore |

### 1.3 Stato ALBA (retro attivo)

| Proprietà       | Valore                                                    |
|-----------------|-----------------------------------------------------------|
| Colore base     | `#f5ede0` — bianco caldo avorio                           |
| Gradient mesh   | da `#f0dfc0` in basso a `#faf6f0` in alto, con bande orizzontali sfumate — alba |
| Tint accento    | glow ocra `#d4862a` a 6% opacity sul fondo               |
| Particelle      | pollini/petali — 60 punti, forma ovale leggera, caduta gravitazionale lenta |
| Velocità drift  | 0.03px/frame — visibili, organici, irregolari             |
| Parallasse      | 5% cursore — fluido, non meccanico                        |

### 1.4 Transizione sfondo durante il flip

- Durata: **2.0s** — sincrona al flip del biglietto
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)` — decelerazione naturale
- Al frame 50% del flip: il gradient inizia a cambiare
- Le particelle del tipo precedente fade-out (0.8s), quelle nuove fade-in (0.8s)
- Il grain overlay cambia opacity: notte 4% → alba 2% (carta è più luminosa)

### 1.5 Noise Grain

- Generato via `<canvas>` offscreen o SVG `<feTurbulence>`
- Monochrome, opacity: `0.03` (notte) / `0.02` (alba)
- Animated: seed che cambia ogni 80ms → effetto film analogico
- Funzione: aggiunge profondità e fisicità — toglie la "plasticità" digitale

---

## 2. BIGLIETTO — FISICA & COMPORTAMENTO BASE

### 2.1 Dimensioni e proporzioni

```
Ratio standard biglietto da visita: 85.6mm × 54mm (ISO 7810 ID-1)
Aspect ratio: 1.585 : 1

In viewport:
  width:  420px  (desktop)
  height: 265px  (desktop)
  Responsive: scale con viewport, mai sotto 300px width
```

### 2.2 Float — galleggiamento continuo

```
Oscillazione verticale:
  amplitude: 10px
  period: 3.2s
  easing: sin — organico

Rotazione micro (idle):
  rotateX: sin(t * 0.7) * 2.5deg   — ondeggia avanti/indietro
  rotateY: sin(t * 0.5) * 1.8deg   — lieve dondolio laterale
  rotateZ: sin(t * 0.3) * 0.4deg   — quasi impercettibile

Update: requestAnimationFrame, delta-time based
```

### 2.3 Tilt — risposta al cursore

```
Range massimo: ±18deg su X, ±22deg su Y
Easing segui cursore: lerp(current, target, 0.08) — morbido, non istantaneo
Origine trasformazione: center center

Effetto luce speculare:
  - Pseudoelemento ::after con radial-gradient bianco
  - Opacity e posizione seguono il tilt
  - Max opacity: 0.15 — suggestione, non patina

Effetto ombra dinamica:
  - box-shadow offset segue il tilt opposto (ombra "sotto")
  - Blur: 40–80px in base all'altitudine del float
  - Color: rgba(0,0,0,0.4) notte / rgba(180,120,60,0.2) alba
```

### 2.4 Prospettiva e profondità 3D

```css
.scene {
  perspective: 900px;
  perspective-origin: 50% 45%;   /* leggermente sopra centro — più naturale */
}

.card {
  transform-style: preserve-3d;
  /* fronte e retro come figli con backface-visibility: hidden */
}
```

---

## 3. FRONTE — "THE ENGINEER"

### 3.1 Materiale & Superficie

| Elemento        | Specifica                                                  |
|-----------------|------------------------------------------------------------|
| Base            | Carbonio woven — pattern a 45deg, tile 8×8px, SVG inline  |
| Overlay         | `linear-gradient(135deg, rgba(255,255,255,0.04), transparent)` — microluce |
| Bordo           | `1px solid rgba(0, 140, 255, 0.3)` + inner glow blu 2px   |
| Border radius   | `6px` — tecnologico ma non tagliente                       |
| Thickness 3D    | `8px` depth simulato con translateZ sul retro              |

### 3.2 Palette cromatica — NOTTE TECH

```
Primario sfondo:    #0d0d14   (quasi nero, tinta blu notte)
Testo primario:     #e8eaf0   (bianco freddo, non puro)
Accento principale: #2979ff   (blu elettrico — IBM Blue virato)
Accento secondario: #00e5ff   (ciano — dettagli e LED)
Metadati/label:     #4a5568   (grigio medio)
Woven pattern:      #141420 / #0f0f1a  (contrasto sottile)
```

### 3.3 Tipografia — "The Engineer"

```
Display / Nome:     "JetBrains Mono" — weight 700, letter-spacing: -0.02em
Titolo/ruolo:       "JetBrains Mono" — weight 400, opacity 0.6
Metadata:           "JetBrains Mono" — weight 300, size ridotta, tutto lowercase
```

**Gerarchia visiva fronte:**
```
┌─────────────────────────────────────────────────────┐
│  ● ● ●                              [LED 1] [LED 2] │  ← corner details
│                                                     │
│  Ishar Pasquale Mannara Alam│  ← nome, mono bold
│  automation architect & r&d engineer                │  ← ruolo, mono light
│                                                     │
│  created: 1997    language: py, c++, js             │  ← metadata row 1
│  status: building    uptime: 7y+                    │  ← metadata row 2
│                                                     │
│  [QR — github]              ◈  — logo/simbolo 3D   │  ← bottom row
└─────────────────────────────────────────────────────┘
```

### 3.4 Micro-animazioni fronte

- **Typing effect**: il nome si "scrive" ogni volta che il biglietto entra in viewport (velocità: 60ms/char, cursore lampeggiante poi scompare)
- **LED blink**: i due cerchi in alto a destra pulsano in modo asincrono — LED1 ciclo 2.1s, LED2 ciclo 3.7s — mai sincroni, mai "artificiali"
- **Tracce SVG**: linee circuitali sottili negli angoli che si "accendono" in sequenza al caricamento (stroke-dasharray animation, una volta sola, durata 1.2s)
- **Logo centrale**: icona/simbolo personale che ruota su Y lentamente (rotateY 360deg / 8s, loop)
- **Metadata scan**: una volta ogni ~20s una riga di testo fa "glitch scan" — sfarfalla, si rimappa, torna normale — dura 400ms

### 3.5 Bordo laterale (thickness) — fronte

- Colore: gradient da `#1a1a2e` a `#0d0d14`
- Incisione "laser" sul bordo lungo sinistro: `// IMAN.PASQUALE // v2.0 //` — testo micro, orizzontale, ciano 20% opacity
- Visibile solo con angolazione >10deg

---

## 4. RETRO — "THE HUMAN"

### 4.1 Materiale & Superficie

| Elemento        | Specifica                                                  |
|-----------------|------------------------------------------------------------|
| Base            | Tela cotone/lino — texture SVG turbulence + displacement   |
| Overlay         | `linear-gradient(180deg, rgba(255,255,255,0.3), rgba(255,240,220,0.1))` |
| Bordo           | `1px solid rgba(180,120,60,0.25)` — oro antico morbido     |
| Border radius   | `8px` — più arrotondato del fronte, più umano              |
| Texture grain   | più intensa — paper feel autentico                         |

### 4.2 Palette cromatica — ALBA MEDITERRANEA

```
Primario sfondo:    #faf6f0   (bianco carta naturale)
Testo primario:     #2c2416   (quasi nero caldo, inchiostro)
Accento principale: #c4622d   (terracotta — Marocco, Italia del sud)
Accento secondario: #5a7a52   (verde oliva — Mediteraneo)
Dettagli/label:     #8b7355   (sabbia dorata)
Texture base:       #f0e8d8   (avorio caldo)
```

### 4.3 Tipografia — "The Human"

```
Display / Nome:     "Playfair Display" — weight 700, italic, colore terracotta
Bio/descrizione:    "Lora" — weight 400, serif elegante, leggibile
Label/categorie:    "Lora" — weight 600 small caps
Citazione:          "Playfair Display" — italic, grande, centrata
```

### 4.4 Layout retro — Timeline biografica

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Ishar Pasquale Mannara Alam       [foto/avatar]   │  ← nome serif italic
│   ───────────────────────                           │
│                                                     │
│   Chi sono                                          │  ← sezione bio breve
│   Ingegnere di giorno, curioso di notte.            │
│   Costruisco macchine che pensano.                  │
│                                                     │
│   ○ 1997  Nato a ___                                │  ← timeline
│   ○ 2015  Prima riga di codice                      │
│   ○ 2019  Primo robot autonomo                      │
│   ○ 2023  1.5M€ generati                            │
│                                                     │
│   ♪  ✈  ⚽  📷  🌱                                  │  ← hobby icone
│                                                     │
│   [QR — messaggio personale]         Torino, IT     │
└─────────────────────────────────────────────────────┘
```

### 4.5 Micro-animazioni retro

- **Fade-in staggerato**: ogni elemento appare con delay progressivo dopo il flip (0ms, 150ms, 300ms, 450ms...)
- **Timeline hover**: ogni punto si espande mostrando un tooltip/popover con dettaglio
- **Hobby icons hover**: ogni icona ha una micro-animazione tematica propria:
  - ♪ musica → note che fluttuano per 1s
  - ✈ viaggi → l'aereo percorre una traiettoria curva
  - 📷 foto → flash bianco + shutter click sound
  - 🌱 natura → fogliolina che cresce
- **Macchia caffè** easter egg: angolo in basso a sinistra — cliccando si sente il suono della tazza
- **Francobollo**: angolo alto destra, timbro postale "TORINO" in rosso, leggero skew

### 4.6 Bordo laterale (thickness) — retro

- Colore: gradient da `#e8d5b8` a `#d4b896`
- Sul bordo lungo destro: piccolo fregio ornamentale ripetuto — ispirazione carta da lettere italiana
- Visibile solo con angolazione >10deg

---

## 5. INTERAZIONI NASCOSTE — Discovery Map

Ordinate per probabilità di scoperta (1 = trovata subito, 9 = easter egg profondo)

### Tier 1 — Visibile subito

| ID  | Nome              | Trigger              | Effetto                                           |
|-----|-------------------|----------------------|---------------------------------------------------|
| I1  | Float             | auto (sempre)        | Oscillazione verticale sinusoidale continua       |
| I2  | Tilt              | mouse move           | Card inclina verso cursore, luce speculare reagisce |

### Tier 2 — Scoperta entro 30 secondi

| ID  | Nome              | Trigger              | Effetto                                           |
|-----|-------------------|----------------------|---------------------------------------------------|
| I3  | Scroll Zoom Out   | scroll su sfondo     | Camera zoom out — biglietto diventa più piccolo   |
| I4  | Scroll Card       | scroll dentro card   | Contenuto interno scorre, pagina non si muove     |
| I5  | Idle Showcase     | 15s inattività       | Card ruota lentamente su Y mostrando entrambi i lati |
| I6  | Hint Flip         | 5s senza interazione | Micro-freccia lampeggia sui bordi lunghi laterali |

### Tier 3 — Richiede intenzione

| ID  | Nome              | Trigger                  | Effetto                                        |
|-----|-------------------|--------------------------|------------------------------------------------|
| I7  | Flip              | doppio click bordo lungo | Rotazione 3D + il mondo cambia (notte ↔ alba)  |
| I8  | Magnetic Hover    | hover su bordo corto     | Card si inclina verso il cursore come attratta |
| I9  | Drag & Float      | click + drag             | Card trascinabile nello spazio, torna al centro con spring physics |
| I10 | Metadata Glitch   | auto ogni ~20s (fronte)  | Una riga testo fa glitch scan per 400ms        |

### Tier 4 — Easter eggs profondi

| ID  | Nome              | Trigger                  | Effetto                                        |
|-----|-------------------|--------------------------|------------------------------------------------|
| I11 | Coffee Click      | click macchia caffè (retro) | Suono tazza, macchia si "allarga" per 1s     |
| I12 | LED Click         | click LED (fronte)        | LED si spegne/accende + suono elettrico        |
| I13 | Konami Code       | ↑↑↓↓←→←→BA               | Card diventa pixel art 8-bit per 3 secondi     |
| I14 | Triple Click      | 3× click rapido su nome  | Confetti esplodono dalla card, poi scompaiono  |
| I15 | Shake             | mouse velocity alta       | Glitch effetto, poi card "si stabilizza"       |
| I16 | Long Press        | click hold 1.5s           | Angoli si piegano come carta vera              |

---

## 6. SUONI — Audio Design System

### 6.1 Principi

- Tutti i suoni sono **opt-in**: al primo click sulla pagina, un micro-toast appare
  `"🔊 Enable sounds?"` con [Yes] [No] — rispetta la preferenza, la salva in localStorage
- Volume master: 0.35 (mai invasivo)
- Tutti i file: `.webm` + `.mp3` fallback, < 50KB ciascuno
- Generabili via Tone.js per zero dipendenze da file esterni

### 6.2 Catalogo suoni

| ID  | Evento              | Descrizione audio                              | Tone.js sketch              |
|-----|---------------------|------------------------------------------------|-----------------------------|
| S1  | Hover bordo card    | Tick cristallino brevissimo, 800Hz, 80ms       | Synth, triangle, decay 0.08 |
| S2  | Flip — inizio       | Whoosh carta + risonanza metallica leggera     | Noise + filtered sine sweep |
| S3  | Flip — atterraggio  | Tap morbido + risonanza finale                 | MembraneSynth, pitch basso  |
| S4  | LED click (fronte)  | Click elettrico secco                          | MetalSynth, brevissimo      |
| S5  | Hover hobby ♪       | Singola nota musicale (do5, piano)             | Sampler o Synth sine        |
| S6  | Hover hobby ✈       | Piccolo swoosh aereo                           | Filtered noise, sweep       |
| S7  | Hover hobby 📷      | Shutter meccanico + flash                      | Noise burst 30ms            |
| S8  | Coffee click        | Gorgoglio tazza, 600ms                         | Noise filtrato, organico    |
| S9  | Konami easter egg   | Jingle 8-bit 3 note                            | PolySynth, square wave      |
| S10 | Confetti (I14)      | Pop festivo                                    | Synth, breve sweep up       |
| S11 | Idle showcase start | Nessun suono — silenzio aumenta mistero        | —                           |
| S12 | Glitch (I10/I15)    | Artefatto digitale 100ms                       | BitCrusher su noise         |

### 6.3 Transizione sonora al flip

```
Notte → Alba:
  fade out: toni digitali (80ms)
  crossfade: suono flip (S2 + S3)
  fade in: ambianza organica — silence caldo
  durata totale: 2.2s

Alba → Notte:
  specularmente opposto
```

---

## 7. DETTAGLI GRAFICI EXTRA

### 7.1 QR Codes — due destinazioni

| Posizione       | Destinazione                        | Stile QR                           |
|-----------------|-------------------------------------|------------------------------------|
| Fronte, dx basso | GitHub profile                     | Dark, pixel arrotondati, tint blu  |
| Retro, sx basso  | Video/audio messaggio personale    | Light, pixel arrotondati, tint terracotta |

I QR sono SVG inline — mai immagini raster — scalabili e tematizzabili.

### 7.2 Font Pairing

```
FRONTE:
  JetBrains Mono (Google Fonts / self-host)
  Weights: 300, 400, 700
  Usage: tutto il testo fronte

RETRO:
  Playfair Display — display, titoli, citazione
  Lora — body text, bio, timeline
  Pesi: 400, 600, 700 (Lora) / 400 italic, 700 italic (Playfair)
```

### 7.3 Continuità visiva fronte/retro

- La venatura del tessuto (retro) si "continua" geometricamente col pattern carbonio (fronte)
  → durante il flip si vede il bordo: i pattern si incrociano al centro
- Il simbolo/logo personale sul fronte appare in versione "sigillo" sul retro (stesso shape, stile ink stamp)
- Il colore accento blu (fronte) e terracotta (retro) sono complementari su ruota cromatica

### 7.4 Ombra dinamica

```
Fronte (notte):
  box-shadow:
    0 0 0 1px rgba(0, 140, 255, 0.15),      /* inner border glow */
    0 20px 60px rgba(0, 0, 0, 0.7),          /* ombra principale */
    0 0 80px rgba(41, 121, 255, 0.12)        /* ambient glow blu */

Retro (alba):
  box-shadow:
    0 0 0 1px rgba(196, 98, 45, 0.2),        /* inner border warm */
    0 20px 50px rgba(120, 80, 30, 0.25),     /* ombra calda */
    0 0 60px rgba(212, 134, 42, 0.1)         /* ambient glow ocra */

Le ombre cambiano dinamicamente con il float (intensità aumenta quando card è "in alto")
```

### 7.5 Cursore personalizzato

```
Default (sfondo):    cursore crosshair sottile — bianco (notte) / nero (alba)
Hover card:          cursore si trasforma in cerchio con punto centrale
Hover bordo lungo:   cursore mostra due frecce opposte orizzontali (hint flip)
Drag:                cursore grab → grabbing
Hover LED:           cursore pointer con alone
```

### 7.6 Responsive Strategy

```
Desktop (>900px):    esperienza completa, tutti gli effetti attivi
Tablet (600–900px):  card ridotta, tilt ridotto a ±10deg, audio opzionale
Mobile (<600px):     flip via swipe laterale, tilt via gyroscope API,
                     float ridotto, no drag, effetti particelle dimezzati
                     Orientamento consigliato: landscape (hint a comparsa)
```

### 7.7 Performance Budget

```
Target:  60fps costanti su hardware mid-range (2020+)
JS bundle: < 80KB gzipped (escluso Tone.js opzionale)
CSS:      < 15KB — priorità CSS per animazioni (GPU composited)
Canvas:   off-thread dove possibile (OffscreenCanvas)
Particelle: max 180 (notte) / 60 (alba) — adattive a performance API
Rilevamento: se fps < 30 per 2s → dimezza particelle automaticamente
```

---

## 8. STACK TECNICO CONSIGLIATO

```
HTML/CSS/JS vanilla (zero framework) — massima compatibilità e performance

Dipendenze opzionali:
  Tone.js         — audio generativo (solo se suoni abilitati)
  gsap (light)    — spring physics per drag/drop (alternativa: CSS spring)

Nessun framework CSS — tutto custom
Font: Google Fonts con font-display: swap
3D: CSS transforms + perspective — no WebGL (performance + compatibilità)
Canvas: solo per grain noise (leggero, offscreen)
```

---

## 9. FILE STRUCTURE (progetto)

```
imannaraalamfile.github.io/
├── .nojekyll
├── index.html
├── style/
│   ├── base.css          — reset, variabili CSS, font
│   ├── scene.css         — sfondo, particelle, layout
│   ├── card.css          — fisica 3D, float, tilt
│   ├── front.css         — fronte: materiale, tipografia, LED
│   ├── back.css          — retro: materiale, tipografia, timeline
│   └── interactions.css  — hover states, cursore, hint
├── js/
│   ├── main.js           — init, orchestrazione
│   ├── scene.js          — background, particelle, transizione
│   ├── card.js           — float, tilt, flip, drag
│   ├── interactions.js   — scroll, easter eggs, Konami
│   └── audio.js          — Tone.js wrapper, suoni opzionali
└── assets/
    ├── qr-github.svg
    ├── qr-personal.svg
    └── logo.svg
```

---

## 10. MILESTONE DI SVILUPPO

```
Sprint 1 — Struttura 3D base
  ✓ HTML struttura card fronte/retro
  ✓ CSS perspective + preserve-3d
  ✓ Float animation (rAF)
  ✓ Tilt mouse tracking

Sprint 2 — Visual design completo
  ✓ Fronte: materiale carbonio, tipografia, LED, QR
  ✓ Retro: materiale lino, tipografia, timeline
  ✓ Ombre dinamiche

Sprint 3 — Sfondo e particelle
  ✓ Gradient notte/alba
  ✓ Sistema particelle (stelle + pollini)
  ✓ Grain canvas noise
  ✓ Transizione sfondo al flip

Sprint 4 — Interazioni avanzate
  ✓ Flip con doppio click
  ✓ Scroll zoom + scroll interno
  ✓ Drag & drop con spring physics
  ✓ Idle showcase

Sprint 5 — Easter eggs & Audio
  ✓ Tutti i Tier 4 easter eggs
  ✓ Konami code
  ✓ Sistema audio Tone.js
  ✓ Cursore personalizzato

Sprint 6 — Polish & Performance
  ✓ Responsive mobile (gyroscope, swipe)
  ✓ Performance adaptive (fps monitor)
  ✓ Accessibilità (prefers-reduced-motion)
  ✓ Test cross-browser
```

---

*Documento generato: Aprile 2026 — da aggiornare ad ogni iterazione significativa*

# Duality Card

Esperienza portfolio interattiva "The Engineer / The Human" sviluppata in HTML/CSS/JS vanilla.

## Screenshot

Placeholder: aggiungi qui una cattura schermata del fronte e retro card.

## Feature

- Card 3D dual-face con flip sincronizzato mondo notte/alba.
- Living world a layer: gradient, particelle generative, vignetta, grain canvas.
- 16 interazioni (hint, flip edge, magnetic hover, easter egg, confetti, shake, long press).
- Audio synthesis opt-in con Web Audio API e persistenza `localStorage`.
- Progressive enhancement per mobile, keyboard e preferenze accessibilita'.

## Browser support

- Chrome 90+ (desktop/mobile)
- Edge 90+
- Firefox 90+
- Safari 15+ (desktop/iOS)

## Sviluppo locale

Avvio rapido con server statico:

```bash
npx serve .
```

In alternativa puoi aprire direttamente `index.html` nel browser.

## Configurazione QR e logo

- Sostituisci `assets/qr-github.svg` con il QR reale del profilo GitHub.
- Sostituisci `assets/qr-personal.svg` con il QR del messaggio personale.
- Sostituisci `assets/logo.svg` con il logo definitivo mantenendo `viewBox` coerente.

## Audio

- Al primo click viene mostrato il consenso audio.
- Toggle rapido audio da tastiera: tasto `A`.

## Limitazioni note

- Nessun uso di WebGL: rendering 3D tramite CSS transforms.
- `OffscreenCanvas` opzionale: fallback automatico su canvas tradizionale.

## Licenza

MIT — vedi `LICENSE`.

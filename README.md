# Vessel Impact

Browser-based **vessel collision design calculator** for bridge piers and
superstructures per **AASHTO LRFD Bridge Design Specifications, 9th Edition,
Section 3.14 — Vessel Collision: CV**.

Live layout, symbols, and report style follow the companion app
[WaveLoadX](https://github.com/sandslamsal/WaveLoadX) (coastal storm wave
loads).

## Modules

- **Ship Impact** — collision energy (Eq. 3.14.7-1) with hydrodynamic mass
  coefficient interpolation, head-on ship impact force on the pier
  (Eq. 3.14.8-1), ship bow damage length (Eq. 3.14.9-1), and superstructure
  forces for bow, deck house, and mast collision (Arts. 3.14.10.1–3.14.10.3),
  with the design collision velocity distribution of Fig. 3.14.6-1.
- **Barge Impact** — barge tow displacement, collision energy, barge bow
  damage length (Eq. 3.14.12-1), and barge impact force (Eqs. 3.14.11-1/-2),
  including the non-standard-width and head-log adjustments of C3.14.11.
- **Annual Frequency** — Method II risk analysis (Art. 3.14.5):
  probability of aberrancy with all correction factors (Art. 3.14.5.2.3),
  geometric probability from the normal sailing-path distribution
  (Art. 3.14.5.3), probability of collapse (Art. 3.14.5.4), protection factor
  (Art. 3.14.5.5), and AF acceptance checks for typical and critical bridges.

Every module renders a fully-labeled definition diagram, a step-by-step LaTeX
derivation with clause citations, and a one-click **PDF calculation report**.

## Stack

React 19 + Vite, KaTeX (live math), MathJax → PNG (PDF math), jsPDF.

```bash
npm install
npm run dev      # local dev server
npm run build    # production build in dist/
```

## Disclaimer

Vessel Impact is an engineering aid. Verify all results against the governing
edition of the AASHTO LRFD Bridge Design Specifications before design use.

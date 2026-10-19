#!/usr/bin/env node
// Builds the press dossier PDFs (eu + es) into static/docs/ with headless Edge or Chrome.
//
//   node scripts/press-kit/build.js
//
// Figures are aggregates taken from the organisers' participant workbook
// ("CyberLehia 2026 Partehartzaile kudeaketa.xlsx"): totals and percentages only, never personal data.
// Facts about editions, phases and venues come from the website content. Update both each year.
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const { pathToFileURL } = require("url");

const root = path.resolve(__dirname, "../..");
const asset = (p) => pathToFileURL(path.join(root, p)).href;

// ---------- Data (2026 edition) ----------
const data = {
  participants: 346,
  teams: 143,
  centres: 35,
  teachers: 60,
  territory: [["Bizkaia", 155], ["Gipuzkoa", 152], ["Araba", 38], ["BIRT (online)", 1]],
  ages: [["< 18", 25], ["18–20", 130], ["21–25", 148], ["26–30", 32], ["> 30", 11]],
  medianAge: 21,
  families: { ict: 293, elec: 23, other: 30 }, // Informatics & communications / Electricity & electronics / other
  cyberCourse: 104, // students of the cybersecurity specialisation course
  returning: 42,
  women: 32,
  // Women in an earlier edition, to show how much their presence grew. Fill in from the organisers' data;
  // while women is null the dossier shows a dashed "%XX" placeholder to fill in before publishing (never guess it).
  womenPrev: { year: 2025, women: null, participants: null },
  teamsOfThree: 81,
  topCentres: [
    ["IES Xabier Zubiri-Manteo BHI", "Gipuzkoa", 41],
    ["CIFP Uni Eibar-Ermua LHII", "Gipuzkoa", 30],
    ["CPIFP Maristak Durango LHIPI", "Bizkaia", 23],
    ["CIFP Ciudad Jardín LHII", "Araba", 22],
    ["CIFP Tartanga LHII", "Bizkaia", 18],
  ],
};
const pct = (n) => Math.round((n / data.participants) * 100);
const wp = data.womenPrev;
const womenGrowth = wp.women && wp.participants
  ? { year: wp.year, prevShare: Math.round((wp.women / wp.participants) * 100), share: pct(data.women), rel: Math.round(((data.women / data.participants) / (wp.women / wp.participants) - 1) * 100) }
  : null;

// ---------- Texts ----------
const t = {
  eu: {
    file: "cyberlehia-prentsa-txostena.pdf",
    lang: "eu",
    docTitle: "CyberLehia · Prentsa-txostena",
    docType: "Prentsa-txostena",
    date: "2026ko urria",
    dateLabel: "Data",
    subtitle: "Euskadiko Lanbide Heziketako zibersegurtasun lehiaketa (CTF)",
    web: "cyberlehia.fpeuskadi.eus",
    whatTitle: "Zer da CyberLehia?",
    what: "CyberLehia Euskadiko Lanbide Heziketako Sailburuordetzak eta CyberZaintzak, Zibersegurtasunaren Euskal Agentziak, sustatutako zibersegurtasun lehiaketa bat da: <strong>CTF</strong> (<em>Capture The Flag</em>) txapelketa bat eta, aldi berean, Lanbide Heziketako ikasleen topaketa.",
    goalsTitle: "Helburuak",
    goals: ["Lanbide Heziketan zibersegurtasunaren kultura sustatzea.", "Ikastetxeetan egiten den lanaren berri ematea.", "Ikasleen motibazioa sustatzea."],
    companiesTitle: "Finalean, enpresekin harremanetan",
    companies: "Finalean zibersegurtasun arloko enpresek parte hartzen dute, beren erakustokiekin. Horri esker, ikasleek zuzenean jar daitezke harremanetan enpresa horiekin.",
    whoTitle: "Nork hartzen du parte?",
    who: "Euskadiko Lanbide Heziketako ikastetxe integratuetako ikasleek eta Zibersegurtasuneko espezializazio ofiziala duten ikastetxeetakoek, 1etik 3ra bitarteko taldeetan.",
    howTitle: "Nola funtzionatzen du?",
    how: [
      ["Izen-ematea", "Gehienez 1000 parte-hartzaile, 1, 2 edo 3 pertsonako taldeetan."],
      ["1. sailkatze fasea", "Online CTF: gai eta zailtasun ezberdinetako erronkak."],
      ["2. sailkatze fasea", "Online CTF, 3 pertsonako taldeetan."],
      ["Finala", "5 talde onenak: txosten teorikoa (%50) eta Eraso/Defentsa proba aurrez aurre (%50)."],
    ],
    orgTitle: "Antolatzaileak",
    numbersTitle: "2026ko edizioa zenbakitan",
    big: [[data.participants, "parte-hartzaile"], [data.teams, "talde"], [data.centres, "ikastetxe"], [data.teachers, "irakasle laguntzaile"]],
    territoryTitle: "Parte-hartzaileak lurraldeka",
    ageTitle: "Parte-hartzaileak adinaren arabera",
    ageNote: `Adinaren mediana: ${data.medianAge} urte.`,
    studiesTitle: "Ikasketak",
    studies: [["Informatika eta komunikazioak", data.families.ict], ["Elektrizitatea eta elektronika", data.families.elec], ["Beste batzuk", data.families.other]],
    highlights: [
      `<strong>%${pct(data.cyberCourse)}</strong> zibersegurtasuneko espezializazio-ikastaroko ikasleak dira (${data.cyberCourse}).`,
      `<strong>%${pct(data.returning)}</strong>-k aurreko edizio batean ere parte hartu zuen (${data.returning}).`,
      `<strong>${data.teamsOfThree}</strong> talde 3 kidekoak izan ziren.`,
      womenGrowth
        ? `Emakumeen presentzia <strong>%${womenGrowth.rel}</strong> handitu da ${womenGrowth.year}ko ediziotik (%${womenGrowth.prevShare} → %${womenGrowth.share}).`
        : `<span class="todo">Emakumeen presentzia <strong>%XX</strong> handitu da ${data.womenPrev.year}eko ediziotik.</span>`,
    ],
    topTitle: "Parte-hartzaile gehien izan zituzten ikastetxeak",
    phasesTitle: "2026ko egutegia",
    phases: [
      ["Izen-ematea", "2025/12/15 – 2026/01/20"],
      ["1. sailkatze fasea", "2026/01/29 – 02/02 · 33 talde onenak 2. fasera"],
      ["2. sailkatze fasea", "2026/02/05 – 02/09 · 5 talde onenak finalera"],
      ["Ariketa teorikoa", "2026/02/12 – 02/26"],
      ["Final handia", "2026/03/05 · Donostia, Tabakalera"],
    ],
    historyTitle: "Ibilbidea",
    history: [
      ["2024", "1. edizioa", "Finala Bilbon, La Terminalen."],
      ["2025", "2. edizioa", "Finala Bilbon, La Terminalen. Final handian, CTFaz gain, hitzaldiak, tailer teknikoak eta enpresen erakustokiak izan ziren."],
      ["2026", "3. edizioa", `Finala Donostian, Tabakaleran, martxoaren 5ean. ${data.participants} parte-hartzaile eta ${data.teams} talde.`],
      ["2027", "4. edizioa", "<span class=\"todo\">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.</span>"], // TODO: real text before publishing
    ],
    resourcesTitle: "Komunikabideentzako baliabideak",
    resources: [
      ["Argazkiak", "cyberlehia.fpeuskadi.eus/prentsa-gunea/argazki-bilduma/"],
      ["Bideoak", "cyberlehia.fpeuskadi.eus/prentsa-gunea/bideoak/"],
      ["Logotipoak", "cyberlehia.fpeuskadi.eus/prentsa-gunea/"],
    ],
    contactTitle: "Harremanetarako",
    contact: "Elkarrizketak, argazkiak edo informazio gehiago eskatzeko:",
    source: "Datuen iturria: CyberLehia 2026ko izen-emateak (antolakuntza). Datu agregatuak.",
    page: "orria",
  },
  es: {
    file: "cyberlehia-dossier-prensa.pdf",
    lang: "es",
    docTitle: "CyberLehia · Dossier de prensa",
    docType: "Dossier de prensa",
    date: "Octubre de 2026",
    dateLabel: "Fecha",
    subtitle: "Competición de ciberseguridad (CTF) de la Formación Profesional de Euskadi",
    web: "cyberlehia.fpeuskadi.eus/es/",
    whatTitle: "¿Qué es CyberLehia?",
    what: "CyberLehia es un concurso de ciberseguridad promovido por la Viceconsejería de Formación Profesional de Euskadi y CyberZaintza, la Agencia Vasca de Ciberseguridad: un campeonato <strong>CTF</strong> (<em>Capture The Flag</em>) y, al mismo tiempo, un encuentro del alumnado de Formación Profesional.",
    goalsTitle: "Objetivos",
    goals: ["Fomentar la cultura de la ciberseguridad en la Formación Profesional.", "Dar a conocer el trabajo que se realiza en los centros.", "Motivar al alumnado."],
    companiesTitle: "En la final, en contacto con las empresas",
    companies: "En la final participan empresas de ciberseguridad con stands propios. Esto permite que el alumnado contacte directamente con ellas.",
    whoTitle: "¿Quién participa?",
    who: "Alumnado de los Centros Integrados de Formación Profesional de Euskadi y de los centros con Especialización oficial en Ciberseguridad, en equipos de 1 a 3 personas.",
    howTitle: "¿Cómo funciona?",
    how: [
      ["Inscripción", "Máximo 1000 participantes, en equipos de 1, 2 o 3 personas."],
      ["1ª fase clasificatoria", "CTF online: retos de distinta temática y dificultad."],
      ["2ª fase clasificatoria", "CTF online, en equipos de 3 personas."],
      ["Final", "Los 5 mejores equipos: informe teórico (50%) y prueba de Ataque/Defensa presencial (50%)."],
    ],
    orgTitle: "Organizan",
    numbersTitle: "La edición 2026 en cifras",
    big: [[data.participants, "participantes"], [data.teams, "equipos"], [data.centres, "centros"], [data.teachers, "docentes colaboradores"]],
    territoryTitle: "Participantes por territorio",
    ageTitle: "Participantes por edad",
    ageNote: `Mediana de edad: ${data.medianAge} años.`,
    studiesTitle: "Estudios",
    studies: [["Informática y comunicaciones", data.families.ict], ["Electricidad y electrónica", data.families.elec], ["Otros", data.families.other]],
    highlights: [
      `El <strong>${pct(data.cyberCourse)}%</strong> cursa el curso de especialización en ciberseguridad (${data.cyberCourse}).`,
      `El <strong>${pct(data.returning)}%</strong> ya había participado en una edición anterior (${data.returning}).`,
      `<strong>${data.teamsOfThree}</strong> equipos tuvieron 3 integrantes.`,
      womenGrowth
        ? `La presencia de mujeres ha aumentado un <strong>${womenGrowth.rel}%</strong> respecto a ${womenGrowth.year} (del ${womenGrowth.prevShare}% al ${womenGrowth.share}%).`
        : `<span class="todo">La presencia de mujeres ha aumentado un <strong>XX%</strong> respecto a ${data.womenPrev.year}.</span>`,
    ],
    topTitle: "Centros con más participantes",
    phasesTitle: "Calendario 2026",
    phases: [
      ["Inscripción", "15/12/2025 – 20/01/2026"],
      ["1ª fase clasificatoria", "29/01 – 02/02/2026 · los 33 mejores equipos pasan a la 2ª fase"],
      ["2ª fase clasificatoria", "05/02 – 09/02/2026 · los 5 mejores equipos pasan a la final"],
      ["Ejercicio teórico", "12/02 – 26/02/2026"],
      ["Gran final", "05/03/2026 · Donostia, Tabakalera"],
    ],
    historyTitle: "Trayectoria",
    history: [
      ["2024", "1ª edición", "Final en Bilbao, en La Terminal."],
      ["2025", "2ª edición", "Final en Bilbao, en La Terminal. La gran final incluyó, además del CTF, ponencias, talleres técnicos y expositores de empresas."],
      ["2026", "3ª edición", `Final en Donostia, en Tabakalera, el 5 de marzo. ${data.participants} participantes y ${data.teams} equipos.`],
      ["2027", "4ª edición", "<span class=\"todo\">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.</span>"], // TODO: real text before publishing
    ],
    resourcesTitle: "Recursos para medios",
    resources: [
      ["Fotografías", "cyberlehia.fpeuskadi.eus/es/sala-de-prensa/galeria-de-fotos/"],
      ["Vídeos", "cyberlehia.fpeuskadi.eus/es/sala-de-prensa/videos/"],
      ["Logotipos", "cyberlehia.fpeuskadi.eus/es/sala-de-prensa/"],
    ],
    contactTitle: "Contacto",
    contact: "Para entrevistas, fotografías o más información:",
    source: "Fuente de los datos: inscripciones de CyberLehia 2026 (organización). Datos agregados.",
    page: "página",
  },
};

// ---------- Template ----------
const bars = (rows, max) => `
  <div class="bars">${rows.map(([label, n]) => `
    <div class="bar-row"><span class="bar-label">${label}</span>
      <span class="bar-track"><span class="bar" style="width:${Math.max((n / max) * 100, 0.8).toFixed(1)}%"></span></span>
      <span class="bar-value">${n}</span></div>`).join("")}
  </div>`;

const html = (x) => `<!doctype html>
<html lang="${x.lang}">
<head>
<meta charset="utf-8">
<title>${x.docTitle}</title>
<style>
  @font-face { font-family: "Space Grotesk"; src: url("${asset("themes/cyberlehia/static/fonts/space-grotesk-latin-wght-normal.woff2")}") format("woff2"); font-weight: 300 700; }
  @font-face { font-family: "JetBrains Mono"; src: url("${asset("themes/cyberlehia/static/fonts/jetbrains-mono-latin-wght-normal.woff2")}") format("woff2"); font-weight: 100 800; }
  :root { --ink: #0c0e1a; --muted: #4a5078; --soft: #e7e9f6; --line: #d5d8ec; --brand: #4f5bd5; --cyan: #0e8597; --pink: #c7357a; --navy: #07080f; }
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { margin: 0; }
  body { font-family: "Segoe UI", system-ui, sans-serif; color: var(--ink); font-size: 10.5pt; line-height: 1.5; }
  h1, h2, h3, .num { font-family: "Space Grotesk", sans-serif; letter-spacing: -0.01em; }
  .mono { font-family: "JetBrains Mono", monospace; }
  .page { width: 210mm; height: 297mm; padding: 18mm 18mm 30mm; position: relative; overflow: hidden; page-break-after: always; }
  .page:last-child { page-break-after: auto; }
  .eyebrow { font-family: "Space Grotesk", sans-serif; font-size: 8pt; letter-spacing: 0.2em; text-transform: uppercase; color: var(--cyan); font-weight: 600; }
  h2 { font-size: 22pt; margin: 2mm 0 6mm; line-height: 1.1; }
  h3 { font-size: 12pt; margin: 0 0 2.5mm; }
  p { margin: 0 0 3mm; }
  /* Footer on every page: organisers' logos (white artwork) on a dark band + page label */
  .foot { position: absolute; left: 0; right: 0; bottom: 0; height: 19mm; background: var(--navy); display: flex; align-items: center; justify-content: space-between; gap: 8mm; padding: 0 18mm; color: #b4b9d9; font-size: 7.5pt; letter-spacing: 0.04em; }
  .foot::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 0.8mm; background: linear-gradient(to right, #16b2c9, #4f5bd5, #e95095); }
  .foot .org { display: flex; align-items: center; gap: 7mm; }
  .foot .org img { height: 7.5mm; width: auto; object-fit: contain; }
  .foot .org img.wide { height: 6.5mm; }
  .todo { outline: 0.4mm dashed var(--pink); outline-offset: 1mm; background: #fde8f1; }
  /* Cover */
  .cover { background: #f6f7fc; color: var(--ink); padding: 0; }
  /* The CyberLehia logo is white: it sits on a navy band at the top; the rest of the cover is light */
  .cover .head { position: absolute; left: 0; right: 0; top: 0; height: 52mm; background: var(--navy); }
  /* Formal cover: logo, document type, title, date and contact; brand colours only as a thin edge line */
  .cover::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 2.5mm; z-index: 1; background: linear-gradient(to bottom, #16b2c9, #4f5bd5, #e95095); }
  .cover .inner { position: absolute; left: 22mm; right: 22mm; top: 98mm; }
  .cover .doctype { font-family: "Space Grotesk", sans-serif; font-size: 11pt; font-weight: 600; letter-spacing: 0.3em; text-transform: uppercase; color: var(--cyan); margin: 0; }
  .cover .details { position: absolute; left: 22mm; right: 22mm; bottom: 34mm; display: grid; grid-template-columns: 1fr 1.6fr; gap: 10mm; border-top: 0.3mm solid var(--line); padding-top: 6mm; font-size: 10pt; color: var(--ink); }
  .cover .details .k { display: block; font-size: 7.5pt; letter-spacing: 0.2em; text-transform: uppercase; color: var(--muted); margin-bottom: 1.5mm; }
  .cover .logo { position: absolute; left: 22mm; top: 18.5mm; height: 15mm; }
  .cover h1 { font-size: 48pt; margin: 6mm 0 5mm; line-height: 1; letter-spacing: -0.02em; color: var(--navy); }
  .cover .sub { font-size: 16pt; line-height: 1.35; color: var(--muted); max-width: 150mm; margin: 0; }
  .cover .rule { height: 1mm; width: 40mm; margin-top: 9mm; background: linear-gradient(to right, #16b2c9, #4f5bd5, #e95095); }
  /* Blocks */
  .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 9mm; }
  ul.dash { list-style: none; padding: 0; margin: 0; }
  ul.dash li { padding-left: 5mm; position: relative; margin-bottom: 1.5mm; }
  ul.dash li::before { content: ""; position: absolute; left: 0.5mm; top: 2.1mm; width: 1.6mm; height: 1.6mm; background: var(--brand); }
  .steps { counter-reset: s; display: grid; gap: 3mm; }
  .step { border: 0.3mm solid var(--line); border-left: 1mm solid var(--brand); border-radius: 2mm; padding: 3mm 4mm; }
  .callout { margin-top: 6mm; background: #f3f4fb; border-left: 1mm solid var(--pink); border-radius: 2mm; padding: 4mm 5mm; }
  .callout p { margin: 0; }
  .step b { display: block; font-family: "Space Grotesk", sans-serif; font-size: 11pt; }
  .logos { display: flex; align-items: center; justify-content: space-between; gap: 8mm; flex-wrap: wrap; margin-top: 3mm; background: var(--navy); border-radius: 3mm; padding: 6mm 8mm; } /* logos are white: dark band like the site footer */
  .logos img { height: 11mm; object-fit: contain; }
  .big { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4mm; margin-bottom: 8mm; }
  .big div { border-top: 1mm solid var(--brand); padding-top: 2.5mm; }
  .big .num { font-size: 30pt; font-weight: 700; line-height: 1; }
  .big span { display: block; color: var(--muted); font-size: 9pt; margin-top: 1mm; }
  .bars { display: grid; gap: 2mm; margin-bottom: 2mm; }
  .bar-row { display: grid; grid-template-columns: 34mm 1fr 12mm; align-items: center; gap: 3mm; font-size: 9pt; }
  .bar-label { color: var(--ink); }
  .bar-track { height: 4mm; background: var(--soft); border-radius: 1mm; overflow: hidden; }
  .bar { display: block; height: 100%; background: var(--brand); border-radius: 0 1mm 1mm 0; }
  .bar-value { font-family: "JetBrains Mono", monospace; font-weight: 600; text-align: right; }
  .note { font-size: 8.5pt; color: var(--muted); }
  .chart { margin-bottom: 7mm; }
  .hl { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm; margin: 2mm 0 7mm; }
  .hl div { background: #f3f4fb; border-radius: 2mm; padding: 3mm 4mm; font-size: 9.5pt; }
  .hl strong { color: var(--pink); font-family: "Space Grotesk", sans-serif; font-size: 12pt; }
  table { width: 100%; border-collapse: collapse; font-size: 9pt; }
  td { padding: 1.6mm 0; border-bottom: 0.3mm solid var(--line); vertical-align: top; }
  td.k { font-family: "JetBrains Mono", monospace; color: var(--muted); width: 38mm; }
  td.n { text-align: right; font-family: "JetBrains Mono", monospace; font-weight: 600; width: 12mm; }
  .timeline { display: grid; gap: 4mm; }
  .tl { display: grid; grid-template-columns: 18mm 1fr; gap: 4mm; }
  .tl .y { font-family: "Space Grotesk", sans-serif; font-size: 18pt; font-weight: 700; color: var(--brand); line-height: 1; }
  .tl .e { font-family: "JetBrains Mono", monospace; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.12em; color: var(--cyan); }
  .contact { margin-top: 8mm; background: var(--navy); color: #fff; border-radius: 3mm; padding: 6mm 7mm; display: flex; justify-content: space-between; align-items: center; gap: 6mm; }
  .contact .mail { font-family: "JetBrains Mono", monospace; font-size: 13pt; color: #5fd3e3; }
</style>
</head>
<body>

<section class="page cover">
  <div class="head"></div>
  <img class="logo" src="${asset("static/images/logo-cyberlehia.png")}" alt="CyberLehia">
  <div class="inner">
    <p class="doctype">${x.docType}</p>
    <h1>CyberLehia</h1>
    <p class="sub">${x.subtitle}</p>
    <div class="rule"></div>
  </div>
  <div class="details">
    <div><span class="k">${x.dateLabel}</span>${x.date}</div>
    <div><span class="k">${x.contactTitle}</span>cyberlehia@tknika.eus · ${x.web}</div>
  </div>
  <div class="foot"><div class="org">
    <img class="wide" src="${asset("static/images/logo-eusko-jaurlaritza.png")}" alt="Eusko Jaurlaritza">
    <img src="${asset("static/images/logo-cyberzaintza.png")}" alt="CyberZaintza">
    <img src="${asset("static/images/logo-tknika.png")}" alt="Tknika">
    <img src="${asset("static/images/logo-fp-euskadi.png")}" alt="FP Euskadi">
  </div><span>${x.web}</span></div>
</section>

<section class="page">
  <h2>${x.whatTitle}</h2>
  <p style="font-size:12pt">${x.what}</p>
  <div class="cols" style="margin-top:6mm">
    <div>
      <h3>${x.goalsTitle}</h3>
      <ul class="dash">${x.goals.map((g) => `<li>${g}</li>`).join("")}</ul>
      <h3 style="margin-top:6mm">${x.whoTitle}</h3>
      <p>${x.who}</p>
      <div class="callout"><h3>${x.companiesTitle}</h3><p>${x.companies}</p></div>
    </div>
    <div>
      <h3>${x.howTitle}</h3>
      <div class="steps">${x.how.map(([a, b]) => `<div class="step"><b>${a}</b>${b}</div>`).join("")}</div>
    </div>
  </div>
  <div class="foot"><div class="org">
    <img class="wide" src="${asset("static/images/logo-eusko-jaurlaritza.png")}" alt="Eusko Jaurlaritza">
    <img src="${asset("static/images/logo-cyberzaintza.png")}" alt="CyberZaintza">
    <img src="${asset("static/images/logo-tknika.png")}" alt="Tknika">
    <img src="${asset("static/images/logo-fp-euskadi.png")}" alt="FP Euskadi">
  </div><span>${x.docTitle.split(" · ")[1]} · 2</span></div>
</section>

<section class="page">
  <p class="eyebrow">CyberLehia 2026</p>
  <h2>${x.numbersTitle}</h2>
  <div class="big">${x.big.map(([n, l]) => `<div><div class="num">${n}</div><span>${l}</span></div>`).join("")}</div>
  <div class="cols">
    <div>
      <div class="chart"><h3>${x.territoryTitle}</h3>${bars(data.territory, 155)}</div>
      <div class="chart"><h3>${x.ageTitle}</h3>${bars(data.ages, 148)}<p class="note">${x.ageNote}</p></div>
    </div>
    <div>
      <div class="chart"><h3>${x.studiesTitle}</h3>${bars(x.studies, data.families.ict)}</div>
      <h3>${x.topTitle}</h3>
      <table>${data.topCentres.map(([c, terr, n]) => `<tr><td>${c}<br><span class="note">${terr}</span></td><td class="n">${n}</td></tr>`).join("")}</table>
    </div>
  </div>
  <div class="hl">${x.highlights.filter(Boolean).map((h) => `<div>${h}</div>`).join("")}</div>
  <p class="note">${x.source}</p>
  <div class="foot"><div class="org">
    <img class="wide" src="${asset("static/images/logo-eusko-jaurlaritza.png")}" alt="Eusko Jaurlaritza">
    <img src="${asset("static/images/logo-cyberzaintza.png")}" alt="CyberZaintza">
    <img src="${asset("static/images/logo-tknika.png")}" alt="Tknika">
    <img src="${asset("static/images/logo-fp-euskadi.png")}" alt="FP Euskadi">
  </div><span>${x.docTitle.split(" · ")[1]} · 3</span></div>
</section>

<section class="page">
  <h2>${x.phasesTitle}</h2>
  <table style="margin-bottom:9mm">${x.phases.map(([a, b]) => `<tr><td class="k">${a}</td><td>${b}</td></tr>`).join("")}</table>
  <h2>${x.historyTitle}</h2>
  <div class="timeline">${x.history.map(([y, e, d]) => `<div class="tl"><div class="y">${y}</div><div><div class="e">${e}</div>${d}</div></div>`).join("")}</div>
  <h3 style="margin-top:9mm">${x.resourcesTitle}</h3>
  <table>${x.resources.map(([a, b]) => `<tr><td class="k">${a}</td><td class="mono" style="font-size:8.5pt">${b}</td></tr>`).join("")}</table>
  <div class="contact">
    <div><div class="eyebrow" style="color:#5fd3e3">${x.contactTitle}</div><div style="margin-top:1.5mm">${x.contact}</div></div>
    <div class="mail">cyberlehia@tknika.eus</div>
  </div>
  <div class="foot"><div class="org">
    <img class="wide" src="${asset("static/images/logo-eusko-jaurlaritza.png")}" alt="Eusko Jaurlaritza">
    <img src="${asset("static/images/logo-cyberzaintza.png")}" alt="CyberZaintza">
    <img src="${asset("static/images/logo-tknika.png")}" alt="Tknika">
    <img src="${asset("static/images/logo-fp-euskadi.png")}" alt="FP Euskadi">
  </div><span>${x.docTitle.split(" · ")[1]} · 4</span></div>
</section>

</body>
</html>`;

// ---------- Render ----------
const browsers = [
  process.env.BROWSER,
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);
const browser = browsers.find((b) => fs.existsSync(b));
if (!browser) throw new Error("No Edge/Chrome found: set BROWSER=/path/to/chrome");

const outDir = path.join(root, "static/docs");
fs.mkdirSync(outDir, { recursive: true });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "press-kit-"));
const keepHtml = process.argv.includes("--html");
for (const x of Object.values(t)) {
  const src = path.join(tmp, `${x.lang}.html`);
  fs.writeFileSync(src, html(x));
  const out = path.join(outDir, x.file);
  const printed = path.join(tmp, x.file);
  // Own profile: otherwise a browser window already open (e.g. viewing the PDF) takes the job and nothing is printed
  execFileSync(browser, ["--headless=new", "--disable-gpu", "--no-pdf-header-footer", "--allow-file-access-from-files", `--user-data-dir=${path.join(tmp, "profile")}`, `--print-to-pdf=${printed}`, pathToFileURL(src).href], { stdio: "ignore" });
  // msedge.exe can return before the PDF is written: wait until it exists and its size is stable
  const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
  let size = -1;
  for (let i = 0; i < 60; i++) {
    const now = fs.existsSync(printed) ? fs.statSync(printed).size : -1;
    if (now > 10000 && now === size) break;
    size = now;
    sleep(500);
  }
  if (size < 10000) throw new Error(`${x.file}: the browser did not produce the PDF`);
  fs.copyFileSync(printed, out); // throws if the old PDF is open/locked, instead of silently keeping it
  console.log(`${out} (${Math.round(fs.statSync(out).size / 1024)} KB)${keepHtml ? `  html: ${src}` : ""}`);
}
// Headless Edge on Windows can stay alive after printing and keep files locked: close the processes
// started with our temporary profile.
if (process.platform === "win32") {
  const ps = `Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*${path.basename(tmp)}*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`;
  try { execFileSync("powershell", ["-NoProfile", "-Command", ps], { stdio: "ignore" }); } catch {}
}
if (!keepHtml) fs.rmSync(tmp, { recursive: true, force: true });

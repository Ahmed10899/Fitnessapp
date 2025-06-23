let trainingsDaten = [];
let nutzerDaten = {};
let settings = { zielPunkte: 350, aktuellerPunkte: 0 };
let aktuellePunkte = 0;
let bearbeiteteKarte = null;

const fortschrittBalken = document.querySelector(".balken");
const fortschrittText = document.querySelector(".punktzahl");
const kartenContainer = document.querySelector(".karten-container");

const form = document.querySelector("form");
const datumInput = document.getElementById("datum");
const aktivitaetSelect = document.getElementById("aktivität");
const dauerInput = document.getElementById("dauer");
const kalorienInput = document.getElementById("kalorien");
const bewertungSelect = document.getElementById("bewertung");
const startzeitInput = document.getElementById("startzeit");
const endzeitInput = document.getElementById("endzeit");
const notizTextarea = document.getElementById("notiz");

const toast = document.getElementById("motivationsToast");
const toastMessage = document.getElementById("motivationsMessage");

const diagrammKontext = document.getElementById("wochenDiagramm").getContext("2d");
let trainingsChart = new Chart(diagrammKontext, {
  type: "bar",
  data: {
    labels: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"],
    datasets: [
      {
        label: "Trainingsdauer (Minuten)",
        data: [0, 0, 0, 0, 0, 0, 0],
        backgroundColor: "#4caf50",
        barThickness: 40,
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: true, text: "Trainingsdauer pro Wochentag" },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: "Minuten" },
      },
    },
  },
});



async function ladeDaten() {
  try {
    const response = await fetch("./api/read.php"); 
    if (!response.ok) throw new Error("Fehler beim Laden der Daten");

    const daten = await response.json(); 

    trainingsDaten = daten.trainings || [];
    nutzerDaten = daten.nutzer || {};
    settings = daten.settings || { zielPunkte: 350, aktuellerPunkte: 0 };
    
    aktuellePunkte = settings.aktuellerPunkte || 0;

    renderTrainingsKarten();
    updateDiagramm();
    aktualisiereBalken(false);

    console.log("Daten geladen:", daten);
  } catch (error) {
    console.error("LadeDaten Fehler:", error);
  }
}




async function speichereDaten() {
  try {
    settings.aktuellerPunkte = aktuellePunkte;

    const payload = {
      trainings: trainingsDaten,
      nutzer: nutzerDaten,
      settings: settings,
    };

    const response = await fetch("./api/write.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify(payload), 
    });

    if (!response.ok) throw new Error(`HTTP Fehler: ${response.status}`);

    const result = await response.json();
    if (result.status !== "success") throw new Error("Fehler beim Speichern");

    console.log("Daten erfolgreich gespeichert");
  } catch (error) {
    console.error("SpeichereDaten Fehler:", error);
  }
}





function aktualisiereBalken(showToast = false) {
  const prozent = Math.min((aktuellePunkte / settings.zielPunkte) * 100, 100);
  fortschrittBalken.style.width = `${prozent}%`;
  fortschrittText.textContent = `${aktuellePunkte} / ${settings.zielPunkte} Punkte`;

  if (aktuellePunkte > 0) {
    fortschrittBalken.classList.add("animiert");
  } else {
    fortschrittBalken.classList.remove("animiert");
  }

  if (showToast) {
    let message = "";
    if (aktuellePunkte < 100)
      message = "Guter Anfang! Sie sind auf dem richtigen Weg!";
    else if (aktuellePunkte < 200)
      message = "Super! Sie sind fleißig am Training!";
    else if (aktuellePunkte < 350)
      message = "Fantastisch! Sie haben ihr Ziel fast erreicht!";
    else message = "Herzlichen Glückwunsch! Sie haben ihr Ziel erreicht!";

    toastMessage.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
  }
}

function updateActivity(aktivitaet) {
  const aktivitaetIcon = {
    Joggen: "fa-running",
    Yoga: "fa-spa",
    Krafttraining: "fa-dumbbell",
    Radfahren: "fa-bicycle",
    Wandern: "fa-hiking",
  }[aktivitaet] || "fa-heartbeat";

  const labelClass = {
    Joggen: "cardio",
    Yoga: "erholung",
    Krafttraining: "kraft",
    Radfahren: "cardio",
    Wandern: "erholung",
  }[aktivitaet] || "erholung";

  return { aktivitaetIcon, labelClass };
}

function berechneDauer() {
  const startzeit = startzeitInput.value;
  const endzeit = endzeitInput.value;

  if (startzeit && endzeit) {
    const [startStunde, startMinute] = startzeit.split(":").map(Number);
    const [endStunde, endMinute] = endzeit.split(":").map(Number);

    let startMinuten = startStunde * 60 + startMinute;
    let endMinuten = endStunde * 60 + endMinute;

    let dauer = endMinuten - startMinuten;
    if (dauer < 0) dauer += 24 * 60;

    dauerInput.value = dauer;
    document.getElementById("dauerWert").textContent = dauer;
  } else {
    dauerInput.value = 0;
    document.getElementById("dauerWert").textContent = 0;
  }
}


startzeitInput.addEventListener("input", berechneDauer);
endzeitInput.addEventListener("input", berechneDauer);


function renderTrainingsKarten() {
  kartenContainer.innerHTML = "";
  trainingsDaten.forEach((eintrag) => {
    const { aktivitaetIcon, labelClass } = updateActivity(eintrag.aktivitaet);
    const karte = document.createElement("div");
    karte.className = "karte";
    karte.setAttribute("data-datum", eintrag.datum);
    karte.setAttribute("data-aktivitaet", eintrag.aktivitaet);
    karte.setAttribute("data-dauer", eintrag.dauer);

    karte.innerHTML = `
      <div class="label ${labelClass}">${eintrag.aktivitaet}</div>
      <h3><i class="fa-solid ${aktivitaetIcon}"></i> ${eintrag.aktivitaet}</h3>
      <p><strong>Datum:</strong> ${eintrag.datum}</p>
      <p><strong>Dauer:</strong> ${eintrag.dauer} Min</p>
      <p><strong>Kalorien:</strong> ${eintrag.kalorien} kcal</p>
      <p><strong>Intensität:</strong> ${eintrag.bewertung}</p>
      <p><strong>Startzeit:</strong> ${eintrag.startzeit}</p>
      <p><strong>Endzeit:</strong> ${eintrag.endzeit}</p>
      <p><strong>Notiz:</strong> ${eintrag.notiz}</p>
      <button type="button" class="update"><i class="fa-solid fa-pen-to-square"></i> UPDATE</button>
      <button type="button" class="delete"><i class="fa-solid fa-trash"></i> DELETE</button>
    `;
    kartenContainer.appendChild(karte);
  });
}

function getWochentagIndex(datumStr) {
  const date = new Date(datumStr);
  const tag = date.getDay();
  return tag === 0 ? 6 : tag - 1;
}

function updateDiagramm() {
  const neueWerte = [0, 0, 0, 0, 0, 0, 0];
  trainingsDaten.forEach((eintrag) => {
    const index = getWochentagIndex(eintrag.datum);
    neueWerte[index] += parseInt(eintrag.dauer) || 0;
  });
  trainingsChart.data.datasets[0].data = neueWerte;
  trainingsChart.update();
}

form.querySelector("button[type='button']").addEventListener("click", async () => {
  if (!datumInput.value || !aktivitaetSelect.value || !kalorienInput.value) {
    alert("Bitte mindestens Datum, Aktivität und Kalorien ausfüllen.");
    return;
  }

  const eintrag = {
    datum: datumInput.value,
    aktivitaet: aktivitaetSelect.value,
    dauer: dauerInput.value,
    kalorien: kalorienInput.value,
    bewertung: bewertungSelect.value || "Keine Angabe",
    startzeit: startzeitInput.value,
    endzeit: endzeitInput.value,
    notiz: notizTextarea.value,
  };

  if (bearbeiteteKarte) {
    const index = trainingsDaten.findIndex(
      (t) =>
        t.datum === bearbeiteteKarte.getAttribute("data-datum") &&
        t.aktivitaet === bearbeiteteKarte.getAttribute("data-aktivitaet") &&
        t.dauer == bearbeiteteKarte.getAttribute("data-dauer")
    );
    if (index !== -1) {
      trainingsDaten[index] = eintrag;
    }
    bearbeiteteKarte = null;
  } else {
    trainingsDaten.push(eintrag);
    aktuellePunkte += 50;
    if (aktuellePunkte > settings.zielPunkte) aktuellePunkte = settings.zielPunkte;
    aktualisiereBalken(true);
  }

  await speichereDaten();
  renderTrainingsKarten();
  updateDiagramm();
form.reset();

dauerInput.value = 0;
document.getElementById("dauerWert").textContent = 0;

startzeitInput.value = "";
endzeitInput.value = "";
});

kartenContainer.addEventListener("click", async (e) => {
  if (e.target.closest(".delete")) {
    const karte = e.target.closest(".karte");
    const datum = karte.getAttribute("data-datum");
    const aktivitaet = karte.getAttribute("data-aktivitaet");
    const dauer = karte.getAttribute("data-dauer");

    trainingsDaten = trainingsDaten.filter(
      (t) => !(t.datum === datum && t.aktivitaet === aktivitaet && t.dauer == dauer)
    );

    aktuellePunkte -= 50;
    if (aktuellePunkte < 0) aktuellePunkte = 0;
    aktualisiereBalken(false);
    await speichereDaten();
    renderTrainingsKarten();
    updateDiagramm();
  }

  if (e.target.closest(".update")) {
    const karte = e.target.closest(".karte");
    bearbeiteteKarte = karte;

    datumInput.value = karte.querySelector("p:nth-of-type(1)").textContent.split(":")[1].trim();
    let aktivitaetName = karte.querySelector("h3").textContent.trim().replace(/^\S+\s/, "");
    aktivitaetSelect.value = aktivitaetName;

dauerInput.value = karte.querySelector("p:nth-of-type(2)").textContent.split(":")[1].trim().replace(" Min", "");
startzeitInput.value = karte.querySelector("p:nth-of-type(5)").textContent.split(":")[1].trim();
endzeitInput.value = karte.querySelector("p:nth-of-type(6)").textContent.split(":")[1].trim();
    kalorienInput.value = karte.querySelector("p:nth-of-type(3)").textContent.split(":")[1].trim().replace(" kcal", "");

    const intensitätText = karte.querySelector("p:nth-of-type(4)").textContent.toLowerCase();
    if (intensitätText.includes("leicht")) bewertungSelect.value = "leicht";
    else if (intensitätText.includes("mittel")) bewertungSelect.value = "mittel";
    else if (intensitätText.includes("intensiv")) bewertungSelect.value = "intensiv";
    else bewertungSelect.value = "";

    startzeitInput.value = karte.querySelector("p:nth-of-type(5)").textContent.split(":")[1].trim();
    endzeitInput.value = karte.querySelector("p:nth-of-type(6)").textContent.split(":")[1].trim();
    notizTextarea.value = karte.querySelector("p:nth-of-type(7)").textContent.split(":")[1].trim();
  }
});


document.addEventListener("DOMContentLoaded", () => {
  ladeDaten();
});

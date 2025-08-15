import { APP_NAME, APP_VERSION } from "../app-properties.js";
import { getSvgIcon } from "./services/icons.service.js";
import { setStorage, getUser, setUser } from "./services/storage.service..js";
import { showToast } from "./services/toast.service.js";
import { 
  convertMillisecondsToTimeObject,
  convertTimeValuesToMilliseconds,
  getCompactColonTimeStringByTimeValues, 
  getCompactVerboseTimeStringByTimeValues, 
  getFullColonTimeStringByMilliseconds, 
  getFullColonTimeStringByTimeValues, 
  getFullVerboseTimeStringByTimeValues 
} from "./utils/dateAndTime.utils.js";
import { setHTMLTitle, logAppInfos } from "./utils/UTILS.js";
import { requestWakeLock } from "./utils/wakelock.js";
// VARIABLES //////////////////////////////////////////////////////////////////////////////////////
const HEADER = document.getElementById('header');
const MAIN = document.getElementById('main');
let selectedSortingValue = 'date';

// FUNCTIONS //////////////////////////////////////////////////////////////////////////////////////
const getElapsedMilliseconds = (sourceTimestamp, currentTimestamp) => {
  return currentTimestamp - sourceTimestamp;
}
// USER INTERACTIONS ##########################################################
const onSelectOptionChange = (event) => {
  const value = event.target.value;
  selectedSortingValue = value;
  let previousSessions = getUser().previousSessions;
  if (value == 'date') {

  } else if (value == 'type') {
    previousSessions.sort((a, b) => { return b.type.id - a.type.id})
  }
  document.getElementById('sessionsContainer').innerHTML = getSessionsIHM(previousSessions);
};
window.onSelectOptionChange = onSelectOptionChange;

// DATA #######################################################################

// IHM RENDER #################################################################
const getSessionIHM = (session) => {
  const elapsedTimeSession = getElapsedMilliseconds(session.infos.start_time, session.infos.end_time)
  const averageLapTime = Math.floor(elapsedTimeSession / session.laps.length);
      
  let bestLapTime = null;
  for (const lap of session.laps) {
    let elapsedTimeLap = getElapsedMilliseconds(lap.start_time, lap.end_time);
    if (bestLapTime == null) {
      bestLapTime = elapsedTimeLap;
    } else {
      if (elapsedTimeLap < bestLapTime) {
        bestLapTime = elapsedTimeLap;
      }
    }
  }

  let str = 
  `<div class="session-card" onclick="window.location = './session-details.html?id=${session.id}'">
    <div class="card-title">
      <span>${new Date(session.infos.start_time).toLocaleDateString()}</span>
      <span>${(session.type.total_distance / 1000).toFixed(3)} km | ${session.type.lap_count === 1 ? 'Sprint' : `${session.type.lap_count} x ${session.type.lap_distance} m`}</span>
    </div>
    
    <span class="card-total-time">${getChronoFormattedString(getFullColonTimeStringByMilliseconds(elapsedTimeSession))}</span>
    
    <div class="card-laps">
      <div class="card-lap average-lap">
        <span style="font-size: 2svh;">tour moyen</span>
        <span>${getChronoFormattedString(getFullColonTimeStringByMilliseconds(averageLapTime))}</span>
        <span style="font-size: 2svh;">${(((session.type.lap_distance / (averageLapTime / 1000)) * 3600) / 1000).toFixed(2)} km/h</span>
      </div>
      <div class="card-lap best-lap">
        <span style="font-size: 2svh;">meilleur tour</span>
        <span>${getChronoFormattedString(getFullColonTimeStringByMilliseconds(bestLapTime))}</span>
        <span style="font-size: 2svh;">${(((session.type.lap_distance / (bestLapTime / 1000)) * 3600) / 1000).toFixed(2)} km/h</span>
      </div>
  </div>
  </div>`;
  return str;
}
const getSessionsIHM = (previousSessions) => {
  let str = '';
  for (let session of previousSessions.reverse()) {
    str += `${getSessionIHM(session)}`;
  }
  return str;
}
const setNewSessionIHM = () => {
  let previousSessions = getUser().previousSessions;
  MAIN.innerHTML = `
  <div class="homepage-user-display">
    <img class="profile-picture" src="./medias/images/blurp.jpg"/>
    <span>BratiLM</span>
    <div class="select-container">
      <span>Trier par</span>
      <select class="lzr-select" onchange="onSelectOptionChange(event)">
      <option value="date">Date</option>
        <option value="type">Type</option>
      </select>
    </div>
  </div>
  <div id="sessionsContainer" class="session-cards-container">
    ${getSessionsIHM(previousSessions)}
  </div>
  `;
}

function getChronoFormattedString(fullColonTimeString) {
  // Normalise : remplace les ":" finaux en "." si erreur de format
  fullColonTimeString = fullColonTimeString.replace(/^(\d{2}):(\d{2}):(\d{2})[:.](\d{3})$/, '$1:$2:$3.$4');

  const match = fullColonTimeString.match(/^(\d{2}):(\d{2}):(\d{2})\.(\d{3})$/);
  if (!match) return fullColonTimeString; // retourne brut si format inattendu

  const [_, h, m, s, ms] = match;
  const msShort = ms.slice(0, 2); // on garde les deux premières décimales

  let parts = [];
  if (h !== "00") {
    parts.push(h, m, s + "." + msShort);
  } else if (m !== "00") {
    parts.push(m, s + "." + msShort);
  } else if (s !== "00") {
    parts.push(s + "." + msShort);
  } else {
    parts.push(msShort);
  }

  // Déduction du prefix "inutile" pour le span zero-time
  const full = `${h}:${m}:${s}.${msShort}`;
  const useful = parts.join(":");
  const prefixLength = full.indexOf(useful);
  const zeroPart = full.slice(0, prefixLength);

  return (
    (zeroPart ? `<span class="zero-time">${zeroPart}</span>` : "") +
    `<span class="time">${useful}</span>`
  );
}

// LOGGING ####################################################################

// INITIALIZATION /////////////////////////////////////////////////////////////////////////////////

requestWakeLock();
logAppInfos(APP_NAME, APP_VERSION);
setHTMLTitle(APP_NAME);
HEADER.innerHTML = `<span class="header-title" onclick="window.location = './';">${APP_NAME}</span>`;
setStorage();

// EXECUTION //////////////////////////////////////////////////////////////////////////////////////
setNewSessionIHM();











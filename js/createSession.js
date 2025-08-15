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

let currentSessionType = {
  id: 0,
  lap_count: 1,
  lap_distance: 400,
  total_distance: 400,
}


// FUNCTIONS //////////////////////////////////////////////////////////////////////////////////////
const getElapsedMilliseconds = (sourceTimestamp, currentTimestamp) => {
  return currentTimestamp - sourceTimestamp;
}
// USER INTERACTIONS ##########################################################
const onCreateButtonClick = () => {
  console.log(currentSessionType);
  let user = getUser();
  let previousSessionTypeId = user.sessionTypes[user.sessionTypes.length - 1].id;
  console.log(previousSessionTypeId);
  currentSessionType.id = previousSessionTypeId + 1;
  user.sessionTypes.push(currentSessionType);
  setUser(user);
  window.location = './new-session.html';
};
window.onCreateButtonClick = onCreateButtonClick;

const onTotalLengthChange = (event) => {
  console.log(event.srcElement.value);
  currentSessionType.total_distance = Number(event.srcElement.value);
  currentSessionType.lap_count = currentSessionType.total_distance / currentSessionType.lap_distance;
  document.getElementById('createdSessionDisplay').innerHTML = `<span>${(currentSessionType.total_distance / 1000).toFixed(3)} km | ${currentSessionType.lap_count === 1 ? 'Sprint' : `${currentSessionType.lap_count} x ${currentSessionType.lap_distance} m`}</span>`;
}
window.onTotalLengthChange = onTotalLengthChange;

const onLapLengthChange = (event) => {
  console.log(event.srcElement.value);
  currentSessionType.lap_distance = Number(event.srcElement.value);
  currentSessionType.lap_count = currentSessionType.total_distance / currentSessionType.lap_distance;
  document.getElementById('createdSessionDisplay').innerHTML = `<span>${(currentSessionType.total_distance / 1000).toFixed(3)} km | ${currentSessionType.lap_count === 1 ? 'Sprint' : `${currentSessionType.lap_count} x ${currentSessionType.lap_distance} m`}</span>`;
}
window.onLapLengthChange = onLapLengthChange;

// DATA #######################################################################

// IHM RENDER #################################################################
const setCreateSessionIHM = () => {
  MAIN.innerHTML = `
    <div class="create-session-display">
      <span class="create-title">Nouveau type de session</span>
      <div class="create-session-raw">
        <span>Distance totale <span style="color: var(--color--primary);">(en mètres)</span></span>
        <input 
          type="number" 
          id="totalLengthInput" 
          min="1"
          step="1"
          value="${currentSessionType.total_distance}"
          onchange="onTotalLengthChange(event)" />
      </div>
      <div class="create-session-raw">
        <span>Longueur du tour <span style="color: var(--color--primary);">(en mètres)</span></span>
        <input 
          type="number" 
          id="lapLengthInput" 
          min="1"
          step="1"
          value="${currentSessionType.lap_distance}"
          onchange="onLapLengthChange(event)" />
      </div>
    </div>
    <div id="createdSessionDisplay" class="created-session-display">
      <span>${(currentSessionType.total_distance / 1000).toFixed(3)} km | ${currentSessionType.lap_count === 1 ? 'Sprint' : `${currentSessionType.lap_count} x ${currentSessionType.lap_distance} m<`}</span>
    </div>
    <button 
      id="lapButton"
      class="solid primary create-button" 
      onclick="onCreateButtonClick()">Créer</button>
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
setCreateSessionIHM();











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


// FUNCTIONS //////////////////////////////////////////////////////////////////////////////////////
const getElapsedMilliseconds = (sourceTimestamp, currentTimestamp) => {
  return currentTimestamp - sourceTimestamp;
}
// USER INTERACTIONS ##########################################################
const onButtonClick = (toastClass) => {
  showToast(toastClass, `clicked on ${toastClass}`);
};
window.onButtonClick = onButtonClick;

const onLapButtonClick = () => {
  if (CURRENT_LAP.id == 0) {
    // STARTING RACE, FIRST LAP
    console.log('new session start, first lap');
    const startTime =  new Date().getTime();
    CURRENT_SESSION.infos.start_time = startTime;
    console.log(new Date(CURRENT_SESSION.infos.start_time).toLocaleDateString());
    CURRENT_LAP = { 
      id: 1,
      start_time: startTime,
      end_time: 0
    };
    if (CURRENT_LAP.id < CURRENT_SESSION.type.lap_count) {
      document.getElementById('lapButton').innerHTML = `TOUR ${CURRENT_LAP.id}`;
    } else if (CURRENT_LAP.id == CURRENT_SESSION.type.lap_count) {
      document.getElementById('lapButton').innerHTML = `FIN`;
    }
    chronoInterval = setInterval(() => {
      document.getElementById('chrono').innerHTML = getChronoFormattedString(
        getFullColonTimeStringByMilliseconds(
          getElapsedMilliseconds(CURRENT_LAP.start_time, new Date().getTime())
        )
      );
    }, 10);
  } else {
    const endTime = new Date().getTime();
    CURRENT_LAP.end_time = endTime;
    //console.log(getFullColonTimeStringByMilliseconds(getElapsedMilliseconds(CURRENT_LAP.start_time, CURRENT_LAP.end_time)));
    CURRENT_SESSION.laps.push(CURRENT_LAP);

    updatePreviousLapsIHM();

    if (CURRENT_LAP.id === CURRENT_SESSION.type.lap_count) {
      // LAST LAP
      CURRENT_SESSION.infos.end_time = endTime;
      clearInterval(chronoInterval);
      document.getElementById('chrono').innerHTML = '<span class="zero-time">00:00:00.00</span>';
      console.log(new Date(CURRENT_SESSION.infos.start_time).toLocaleDateString());
      console.log(new Date(CURRENT_SESSION.infos.start_time).toLocaleTimeString());
      console.log(new Date(CURRENT_SESSION.infos.end_time).toLocaleTimeString());
      for (const lap of CURRENT_SESSION.laps) {
        console.log(`Tour ${lap.id}: ${getFullColonTimeStringByMilliseconds(getElapsedMilliseconds(lap.start_time, lap.end_time))}`);
      }
      // TODO enregistrer session
      let user = getUser();
      let id = user.previousSessions.length == 0 ? 1 : user.previousSessions[user.previousSessions.length - 1].id + 1;
      CURRENT_SESSION.id = id;
      user.previousSessions.push(CURRENT_SESSION);
      setUser(user);
      // TODO naviguer vers résumé
    } else {
      // IF MULTIPLE LAPS AND NOT OVER YET
      if (CURRENT_SESSION.type.lap_count > 1) {
        const newId = CURRENT_LAP.id + 1;
        if (newId <= CURRENT_SESSION.type.lap_count) {
          // Setup new lap
          if (newId < CURRENT_SESSION.type.lap_count) {
            document.getElementById('lapButton').innerHTML = `TOUR ${newId}`;
          } else if (newId == CURRENT_SESSION.type.lap_count) {
            document.getElementById('lapButton').innerHTML = `FIN`;
          }
          CURRENT_LAP = { 
            id: newId,
            start_time: endTime,
            end_time: 0
          };
        }
      }
    }
  }
};
window.onLapButtonClick = onLapButtonClick;

// DATA #######################################################################

// IHM RENDER #################################################################
const setSessionDetailsIHM = () => {
  const elapsedTimeSession = getElapsedMilliseconds(CURRENT_SESSION.infos.start_time, CURRENT_SESSION.infos.end_time)
  const averageLapTime = Math.floor(elapsedTimeSession / CURRENT_SESSION.laps.length);
  let bestLapTime = null;

  for (const lap of CURRENT_SESSION.laps) {
    let elapsedTimeLap = getElapsedMilliseconds(lap.start_time, lap.end_time);
    if (bestLapTime == null) {
      bestLapTime = elapsedTimeLap;
    } else {
      if (elapsedTimeLap < bestLapTime) {
        bestLapTime = elapsedTimeLap;
      }
    }
  }
  MAIN.innerHTML = `
    <div class="session-details-date">
      <span>${new Date(CURRENT_SESSION.infos.start_time).toLocaleDateString()}</span>
    </div>

    <div class="session-details-type">
      <span>${(CURRENT_SESSION.type.total_distance / 1000).toFixed(3)} km | ${CURRENT_SESSION.type.lap_count === 1 ? 'Sprint' : `${CURRENT_SESSION.type.lap_count} x ${CURRENT_SESSION.type.lap_distance} m`}</span>
    </div>

    <div class="session-details-laps">
      <div class="session-details-lap average-lap">
        <span>tour moyen</span>
        ${getSvgIcon('gauge-simple', 'l', 'var(--color--fg-80')}
        <span>${getChronoFormattedString(getFullColonTimeStringByMilliseconds(averageLapTime))}</span>
        <span>${(((CURRENT_SESSION.type.lap_distance / (averageLapTime / 1000)) * 3600) / 1000).toFixed(2)} km/h</span>
      </div>
      <div class="session-details-lap best-lap">
        <span>meilleur tour</span>
        ${getSvgIcon('gauge-simple-high', 'l', 'var(--color--fg-80')}
        <span>${getChronoFormattedString(getFullColonTimeStringByMilliseconds(bestLapTime))}</span>
        <span>${(((CURRENT_SESSION.type.lap_distance / (bestLapTime / 1000)) * 3600) / 1000).toFixed(2)} km/h</span>
      </div>
    </div>

    <div class="session-details-time-display">
      <span id="chrono" class="current-time">
        ${getChronoFormattedString(getFullColonTimeStringByMilliseconds(elapsedTimeSession))}
      </span>
    </div>

    <div class="session-details-previous-laps">
    ${getPreviousLapsIHM(CURRENT_SESSION)}</div>
  `;
}

const getPreviousLapsIHM = (session) => {
  let str = '';
  const sessionLaps = [...session.laps];
  for (const lap of sessionLaps) {
    if (lap.id == 1) {
      str += `${getPreviousLapIHM(lap, null)}`;
    } else {
      const previousLap = sessionLaps.find((previousLap) => previousLap.id == lap.id - 1)
      str += `${getPreviousLapIHM(lap, getElapsedMilliseconds(previousLap.start_time, previousLap.end_time))}`;
    }
  }
  return str;
}
const getPreviousLapIHM = (lap, previousLapElapsedTime) => {
  let previousCompareIcon = null;
  if (previousLapElapsedTime != null) {
    const lapElapsedTime = getElapsedMilliseconds(lap.start_time, lap.end_time);
    if (previousLapElapsedTime - 990 > lapElapsedTime) {
      previousCompareIcon = `<span class="compared-good">${getSvgIcon('angles-down', 'l', 'var(--color--primary')}</span>`;
    } else if (previousLapElapsedTime + 990 < lapElapsedTime) {
      previousCompareIcon = `<span class="compared-bad">${getSvgIcon('angles-up', 'l', 'var(--color--error')}</span>`;
    } else {
      previousCompareIcon = `<span class="compared-normal">${getSvgIcon('equals', 'l', 'var(--color-fg-80')}</span>`;
    }
  }
  return `
    <div class="previous-lap-card">
      <span>Tour ${lap.id < 10 ? `<span style="opacity: 0;">0</span>${lap.id}` : lap.id}</span>
      ${previousCompareIcon == null ? '' : previousCompareIcon}
      <span>${getChronoFormattedString(getFullColonTimeStringByMilliseconds(getElapsedMilliseconds(lap.start_time, lap.end_time)))}</span>
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
const currentSessionId = new URLSearchParams(window.location.search).get('id');
//console.log(currentSessionTypeId);
console.log(getUser().previousSessions);
let currentSession = getUser().previousSessions.find((session) => session.id == currentSessionId);
console.log(currentSession);

// EXECUTION //////////////////////////////////////////////////////////////////////////////////////
if (currentSession == null || currentSession == undefined) {
  window.location = './'
}
let CURRENT_SESSION = currentSession;

setSessionDetailsIHM();











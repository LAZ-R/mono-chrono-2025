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
const TING = new Audio('./medias/audio/mono-chrono-ting.mp3');

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
    //console.log('new session start, first lap');
    const startTime =  new Date().getTime();
    CURRENT_SESSION.infos.start_time = startTime;
    //console.log(new Date(CURRENT_SESSION.infos.start_time).toLocaleDateString());
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
      let user = getUser();
      let id = user.previousSessions.length == 0 ? 1 : user.previousSessions[user.previousSessions.length - 1].id + 1;
      CURRENT_SESSION.id = id;
      user.previousSessions.push(CURRENT_SESSION);
      setUser(user);
      window.location = `./session-details.html?id=${id}`;
    } else {
      // IF MULTIPLE LAPS AND NOT OVER YET
      if (CURRENT_SESSION.type.lap_count > 1) {
        const newId = CURRENT_LAP.id + 1;
        if (newId <= CURRENT_SESSION.type.lap_count) {
          if (newId === CURRENT_SESSION.type.lap_count - 2) {
            //console.log('3 laps to go');
            TING.play();
            setTimeout(() => {
              TING.pause();
              TING.currentTime = 0;
              TING.play();
              setTimeout(() => {
                TING.pause();
                TING.currentTime = 0;
                TING.play();
              }, 500);
            }, 500);
          } else {
            TING.pause();
            TING.currentTime = 0;
            TING.play();
          }
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
const setCurrentSessionIHM = () => {
  MAIN.innerHTML = `
    <div class="current-session-display">
      <div class="current-session-type">
        <span>${(CURRENT_SESSION.type.total_distance / 1000).toFixed(3)} km | ${CURRENT_SESSION.type.lap_count === 1 ? 'Sprint' : `${CURRENT_SESSION.type.lap_count} x ${CURRENT_SESSION.type.lap_distance} m`}</span>
      </div>
      <div id="previousLapsArea" class="current-session-previous-laps"></div>
    </div>
    <div class="current-time-display">
      <span id="chrono" class="current-time">
        <span class="zero-time">00:00:00.00</span>
      </span>
    </div>
    <button id="lapButton" class="solid primary next-lap-button" onclick="onLapButtonClick()">GO</button>
  `;
}

const updatePreviousLapsIHM = () => {
  document.getElementById('previousLapsArea').innerHTML = `
    ${getPreviousLapsIHM(CURRENT_SESSION)}
  `;
}
const getPreviousLapsIHM = (session) => {
  let str = '';
  const reversedSessionLaps = [...session.laps];
  for (const lap of reversedSessionLaps.reverse()) {
    if (lap.id == 1) {
      str += `${getPreviousLapIHM(lap, null)}`;
    } else {
      const previousLap = reversedSessionLaps.find((previousLap) => previousLap.id == lap.id - 1)
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
const currentSessionTypeId = new URLSearchParams(window.location.search).get('id');
//console.log(currentSessionTypeId);
let currentSessionType = getUser().sessionTypes.find((type) => type.id == currentSessionTypeId);
console.log(currentSessionType);

// EXECUTION //////////////////////////////////////////////////////////////////////////////////////
if (currentSessionType == null || currentSessionType == undefined) {
  window.location = './'
}
let CURRENT_SESSION = {
  id: 0,
  infos: {
    start_time: 0,
    end_time: 0,
  },
  type: currentSessionType,
  laps: []
}

let CURRENT_LAP = { 
  id: 0,
  start_time: 0,
  end_time: 0
};

let chronoInterval = null;

setCurrentSessionIHM();











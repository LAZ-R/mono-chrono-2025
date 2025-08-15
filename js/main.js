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
const onNewSessionButtonClick = () => {
  window.location = './new-session.html'
};
window.onNewSessionButtonClick = onNewSessionButtonClick;

const onHistoryButtonClick = () => {
  window.location = './history.html'
};
window.onHistoryButtonClick = onHistoryButtonClick;

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
const getTotalDistanceMeters = () => {
  let user = getUser();
  let totalDistanceMeters = 0;
  for (let session of user.previousSessions) {
    totalDistanceMeters += session.type.total_distance;
  }
  return totalDistanceMeters;
}

// IHM RENDER #################################################################
const setHomepageIHM = () => {
  let user = getUser();
  const previousSessions = user.previousSessions;
  let previousSessionDisplayIHM = '';
  if (previousSessions.length == 0) {
    previousSessionDisplayIHM = `
    <div class="last-session-display">
      <div class="last-session-header">
        <span>Dernière session</span>
      </div>
    </div>
    `;
  } else {
    const lastSession = previousSessions[previousSessions.length - 1];
    //console.log(lastSession)
    const elapsedTimeSession = getElapsedMilliseconds(lastSession.infos.start_time, lastSession.infos.end_time)
    
    const averageLapTime = Math.floor(elapsedTimeSession / lastSession.laps.length);
    
    let bestLapTime = null;
    for (const lap of lastSession.laps) {
      let elapsedTimeLap = getElapsedMilliseconds(lap.start_time, lap.end_time);
      if (bestLapTime == null) {
        bestLapTime = elapsedTimeLap;
      } else {
        if (elapsedTimeLap < bestLapTime) {
          bestLapTime = elapsedTimeLap;
        }
      }
    }
    
    previousSessionDisplayIHM = `
    <div class="last-session-display" onclick="window.location = './session-details.html?id=${lastSession.id}'">
      <div class="last-session-header">
        <span>Dernière session</span>
      </div>
      <div class="last-session-highlights-display">
        <div class="last-session-infos">
          <span>${new Date(lastSession.infos.start_time).toLocaleDateString()}</span>
          <span>${(lastSession.type.total_distance / 1000).toFixed(3)} km | ${lastSession.type.lap_count === 1 ? 'Sprint' : `${lastSession.type.lap_count} x ${lastSession.type.lap_distance} m`}</span>
        </div>
        <div class="last-session-total-time">
          <span>${getChronoFormattedString(getFullColonTimeStringByMilliseconds(elapsedTimeSession))}</span>
        </div>
        <div class="last-session-laps">
          <div class="last-session-lap average-lap">
            <span>tour moyen</span>
            ${getSvgIcon('gauge-simple', 'l', 'var(--color--fg-80')}
            <span>${getChronoFormattedString(getFullColonTimeStringByMilliseconds(averageLapTime))}</span>
            <span>${(((lastSession.type.lap_distance / (averageLapTime / 1000)) * 3600) / 1000).toFixed(2)} km/h</span>
          </div>
          <div class="last-session-lap best-lap">
            <span>meilleur tour</span>
            ${getSvgIcon('gauge-simple-high', 'l', 'var(--color--primary-dark')}
            <span>${getChronoFormattedString(getFullColonTimeStringByMilliseconds(bestLapTime))}</span>
            <span>${(((lastSession.type.lap_distance / (bestLapTime / 1000)) * 3600) / 1000).toFixed(2)} km/h</span>
          </div>
        </div>
      </div>
    </div>
    `;
  }
  MAIN.innerHTML = `
    <div class="homepage-user-display">
      <img class="profile-picture" src="./medias/images/blurp.jpg"/>
      <span>BratiLM</span>
      <span style="margin-left: auto; font-size: 2svh; text-align: end;">
        Total<br>
        <span style="font-size: 2.5svh;">
          ${(getTotalDistanceMeters() / 1000).toFixed(3)} km
        </span>
      </span>
    </div>
    ${previousSessionDisplayIHM}
    <button class="history-display" onclick="onHistoryButtonClick()">
      <span>HISTORIQUE</span>
      <span>${previousSessions.length}</span>
    </button>
    <button 
      id="newSessionButton" 
      class="solid primary new-session-button" 
      onclick="onNewSessionButtonClick()">NOUVELLE<br>SESSION</button>
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
    if (previousLapElapsedTime - 2000 > lapElapsedTime) {
      previousCompareIcon = `<span class="compared-good">${getSvgIcon('angles-down', 'l', 'var(--color--success')}</span>`;
    } else if (previousLapElapsedTime + 2000 < lapElapsedTime) {
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
HEADER.innerHTML = `<span class="header-title">${APP_NAME}</span><span class="header-title"onclick="window.location = './storage-parameters.html';">${getSvgIcon('database', 'm')}</span>`;
setStorage();


// EXECUTION //////////////////////////////////////////////////////////////////////////////////////

setHomepageIHM();










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
const SESSIONS_TYPES = getUser().sessionTypes;
let selectedSessionType = 1;

// FUNCTIONS //////////////////////////////////////////////////////////////////////////////////////
const getElapsedMilliseconds = (sourceTimestamp, currentTimestamp) => {
  return currentTimestamp - sourceTimestamp;
}
// USER INTERACTIONS ##########################################################
const onLaunchSessionButtonClick = () => {
  window.location = `./current-session.html?id=${selectedSessionType}`;
};
window.onLaunchSessionButtonClick = onLaunchSessionButtonClick;

const onCreateSessionTypeButtonClick = () => {
  window.location = `./create-session.html`;
};
window.onCreateSessionTypeButtonClick = onCreateSessionTypeButtonClick;

const onSelectOptionChange = (event) => {
  const value = event.target.value;
  selectedSessionType = value;
};
window.onSelectOptionChange = onSelectOptionChange;

// DATA #######################################################################

// IHM RENDER #################################################################
const getSessionsSelectIHM = () => {
  let str = '';
  for (let sessionType of SESSIONS_TYPES) {
    str += `<option value="${sessionType.id}">${(sessionType.total_distance / 1000).toFixed(3)} km | ${sessionType.lap_count === 1 ? 'Sprint' : `${sessionType.lap_count} x ${sessionType.lap_distance} m`}</option>`;
  }
  return str;
}
const setNewSessionIHM = () => {
  MAIN.innerHTML = `
    <div class="homepage-user-display">
      <img class="profile-picture" src="./medias/images/blurp.jpg"/>
      <span>BratiLM</span>
    </div>
    <div class="new-session-selection-display">
      <div class="new-session-selection">
        <span>Type de session</span>
        <select class="select solid primary" onchange="onSelectOptionChange(event)" style="color: var(--color--fg-90)">
          ${getSessionsSelectIHM()}
        </select>
      </div>
    </div>
    <div class="create-new-session" onclick="window.location = './create-session.html'">
      créer un nouveau type de session
    </div>
    <button 
      id="newSessionButton" 
      class="solid primary new-session-page-button" 
      onclick="onLaunchSessionButtonClick()">LANCER<br>SESSION</button>
  `;
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











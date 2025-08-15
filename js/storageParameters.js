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

// DATA #######################################################################
function downloadText() {
  let user = getUser();
  let date = new Date();
  let dateStr = `${date.getFullYear()}_${date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1}_${date.getDate() < 10 ? `0${date.getDate()}` : date.getDate()}-${date.getHours() < 10 ? `0${date.getHours()}` : date.getHours()}H${date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes()}M${date.getSeconds() < 10 ? `0${date.getSeconds()}` : date.getSeconds()}S`;
  let userStr = JSON.stringify(user);
  const contenu = userStr; // ta variable string

  // Création d’un blob avec le contenu texte
  const blob = new Blob([contenu], { type: "text/plain" });

  // Création d’un lien de téléchargement
  const lien = document.createElement("a");
  lien.href = URL.createObjectURL(blob);
  lien.download = `monocrono_savefile-${dateStr}.txt`; // nom du fichier

  // Ajout du lien au DOM et clic automatique
  document.body.appendChild(lien);
  lien.click();

  // Nettoyage
  document.body.removeChild(lien);
  URL.revokeObjectURL(lien.href);
}
window.downloadText = downloadText;

function onImportFileClick(event) {
  const input = event.target;
  if (!input.files?.length) return;

  console.log('Importing .txt file');
  const file = input.files[0];
  const reader = new FileReader();
  reader.onload = async () => {
    const text = reader.result;
    console.log(text);
    const jsonText = JSON.parse(text);
    console.log(jsonText);

    setUser(jsonText);

    input.value = ''; // Important : reset file value here, to be able to upload the same file and still trigger the onchange event

    window.location = './';
  };
  reader.readAsText(file);
}
window.onImportFileClick = onImportFileClick;

// IHM RENDER #################################################################
const setHomepageIHM = () => {
  MAIN.innerHTML = `
  <div class="storage-display">
    <div class="storage-option-container export">
      <h1>Exportation des données du stockage local</h1>
      <p>Génère un fichier .txt du JSON de l'utilisateur du stockage local.</p>
      <button class="button solid primary" onclick="downloadText()">Exporter .txt</button>
    </div>

    <div class="storage-option-container import">
      <h1>Importation de données dans le stockage local</h1>
      <p>Importe un fichier .txt pour valoriser le JSON de l'utilisateur du stockage local.</p>
      <p class="error-bloc">Attention, le fichier texte de sauvegarde importé va écraser le stockage actuel.</p>
      <input type="file" onchange="onImportFileClick(event)" accept=".txt" />
    </div>
  </div>
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

setHomepageIHM();










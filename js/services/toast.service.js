import { ICONS } from "../data/svgIcons.data.js";
import { getSvgIcon } from "./icons.service.js";

export const showToast = (toastClass, message, duration = 2000) => {
  if (document.getElementById('toast') === null) {
    let toastStr = `
    <div id="toast" class="toast ${toastClass}">
    ${getSvgIcon(toastClass === 'success' ? 'circle-check' : toastClass === 'info' ? 'circle-info' : toastClass === 'error' ? 'circle-exclamation' : 'circle-info', 'm',  'var(--color--fg-0')}
      <span>${message}</span>
    </div>`;
    document.getElementById('toastContainer').style.display = 'flex';
    document.getElementById('toastContainer').innerHTML += toastStr;
    document.getElementById('toast').classList.add('toast-in');
    setTimeout(() => {
      document.getElementById('toast').classList.add('toast-out');
      setTimeout(() => {
        document.getElementById('toast').remove();
      }, 250);
    }, duration);
  }
}
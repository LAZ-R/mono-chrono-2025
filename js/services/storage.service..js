import { APP_LOCAL_STORAGE_ID } from "../../app-properties.js";

const STORAGE = localStorage;
const appLocalStorageId = APP_LOCAL_STORAGE_ID;

export const setStorage = () => {
  if (STORAGE.getItem(`${appLocalStorageId}FirstTime`) === null) {
    STORAGE.setItem(`${appLocalStorageId}FirstTime`, '0');
    let userTMP = {
      sessionTypes: [
        {
          id: 1,
          total_distance: 10000,
          lap_count: 25,
          lap_distance: 400
        },
      ],
      previousSessions:  [],
    };
    STORAGE.setItem(`${appLocalStorageId}User`, JSON.stringify(userTMP));
  }
}

export const getUser = () => {
  return JSON.parse(STORAGE.getItem(`${appLocalStorageId}User`));
}
export const setUser = (user) => {
  STORAGE.setItem(`${appLocalStorageId}User`, JSON.stringify(user));
}

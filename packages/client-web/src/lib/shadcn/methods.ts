"use client";

import { Logger } from "../logger";

export const toDarkMode = () => {
  try {
    document.body.classList.add("dark");
  } catch (err) {
    Logger.error("toDarkMode", { err });
  }
};

export const toLightMode = () => {
  try {
    document.body.classList.remove("dark");
  } catch (err) {
    Logger.error("toLightMode", { err });
  }
};

export const toggleMode = (needDarkMode: boolean) => {
  try {
    document.body.classList.toggle("dark", needDarkMode);
  } catch (err) {
    Logger.error("toggleMode", { err });
  }
};

export const checkIsDarkMode = () => {
  try {
    return document.body.classList.contains("dark");
  } catch (err) {
    Logger.error("checkIsDarkMode", { err });
    return false;
  }
};

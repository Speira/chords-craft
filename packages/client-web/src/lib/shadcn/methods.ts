"use client";

import { Logger } from "../logger";

export const toDarkMode = () => {
  try {
    document.documentElement.classList.add("dark");
  } catch (err) {
    Logger.error("toDarkMode", { err });
  }
};

export const toLightMode = () => {
  try {
    document.documentElement.classList.remove("dark");
  } catch (err) {
    Logger.error("toLightMode", { err });
  }
};

export const toggleMode = (needDarkMode: boolean) => {
  try {
    document.documentElement.classList.toggle("dark", needDarkMode);
  } catch (err) {
    Logger.error("toggleMode", { err });
  }
};

export const checkIsDarkMode = () => {
  try {
    return document.documentElement.classList.contains("dark");
  } catch (err) {
    Logger.error("checkIsDarkMode", { err });
    return false;
  }
};

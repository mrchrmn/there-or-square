/* eslint-disable max-statements */
/* eslint-disable max-lines-per-function */

"use strict";

import { urlBase64ToUint8Array } from "/javascript/base64.mjs";
import { texts } from "/locale/texts.mjs";

// eslint-disable-next-line no-undef
const TEXTS = texts[language];


// SERVICE WORKER

async function registerServiceWorker() {
  try {
    let registration = await navigator.serviceWorker.register("/service-worker.js");
    return registration;

  } catch (error) {
    console.log("Unable to register service worker:\n" + error);
    return null;
  }
}


// SUBSCRIPTION HANDLING

const publicVapidKey = 'BJlwITZQd9mrnKedh07Tze13WtSSaqfTzeKT5xx4qpDFzxhHgS4vqbGm_XlAELasf1cCuAU5L9us46GkhOHOyOU';

async function subscribe(registration) {
  try {
    if (Notification.permission !== "granted") {
      await Notification.requestPermission();
    }

    if (Notification.permission === "granted") {
      return await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });
    } else {
      throw new Error("Permission not granted.");
    }

  } catch (error) {
    console.log("Unable to subscribe to push notification:\n" + error);
    return null;
  }
}

async function unsubscribe(registration) {
  try {
    let subscription = await registration.pushManager.getSubscription();
    return await subscription.unsubscribe();

  } catch (error) {
    console.log("Unable to unsubscribe from notifications:\n" + error);
    return null;
  }
}


// HELPER

function getEventId() {
  let path = window.location.pathname;
  if (path.startsWith("/event/")) return path.split("/")[2];
  return null;
}


function canPush() {
  if (!("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)) {
    console.log("This browser does not support push notifications.");
    return null;
  }

  if (Notification.permission === "denied") {
    console.log("The user has denied all push notifications from ThrSqr.");
    return null;
  }

  return true;
}


function createSubLink(parent, text) {
  let p = document.createElement("P");
  let a = document.createElement("A");
  a.setAttribute("href", "#");
  a.innerHTML = text;

  parent.appendChild(p);
  p.appendChild(a);
  return a;
}


function removeChildren(parent) {
  while (parent.lastChild) {
    parent.lastChild.remove();
  }
}


// DATABASE FETCHES

async function isEventSubbed(endpoint, eventId) {
  try {
    let status = await fetch(`/event/${eventId}/check-sub`, {
      method: "POST",
      body: endpoint
    });

    console.log("\n== status ==\n" + !!Number(status) + "\n");
    return !!Number(status);

  } catch (error) {
    console.log("Could not check subscription:\n", error);
    return null;
  }
}


async function subscribeEvent(subscription, eventId) {
  try {
    await fetch(`/event/${eventId}/subscribe`, {
      method: "POST",
      body: JSON.stringify(subscription),
      headers: {
        "content-type": "application/json"
      }
    });
    return true;

  } catch (error) {
    console.log("Could not subscribe to event:\n", error);
    return null;
  }
}


async function unsubscribeEvent(endpoint, eventId) {
  try {
    await fetch(`/event/${eventId}/unsubscribe`, {
      method: "POST",
      body: endpoint
    });
    return true;

  } catch (error) {
    console.log("Could not unsubscribe from event:\n", error);
    return null;
  }
}


async function unsubscribeAll(endpoint) {
  try {
    await fetch(`/unsubscribe-all`, {
      method: "POST",
      body: endpoint
    });
    return true;

  } catch (error) {
    console.log("Could not unsubscribe from ThrSqr:\n", error);
    return null;
  }
}


// SUBSCRIPTION UI

async function handleSubLinks(registration) {

  if (!canPush()) return null;

  let subsSection = document.getElementById("subscriptions");

  if (subsSection) {

    subsSection.style.display = "none";
    removeChildren(subsSection);

    let eventId = getEventId();
    let subscription = await registration.pushManager.getSubscription();

    // On event page with no prior subscriptions
    if (!subscription && eventId) {
      subsSection.style.display = "block";

      let subLink = createSubLink(subsSection, TEXTS.subscribeEvent);
      subLink.addEventListener("click", async event => {
        event.preventDefault();
        let subscription = await subscribe(registration);
        await subscribeEvent(subscription, eventId);
        await handleSubLinks(registration);
      });
    }

    if (subscription) {
      subsSection.style.display = "block";

      if (eventId) {
        let eventSubbed = await isEventSubbed(subscription.endpoint, eventId);

        if (eventSubbed) {
          let unsubLink = createSubLink(subsSection, TEXTS.unsubscribeEvent);
          unsubLink.addEventListener("click", async event => {
            event.preventDefault();
            await unsubscribeEvent(subscription.endpoint, eventId);
            await handleSubLinks(registration);
          });

        } else {
          let subLink = createSubLink(subsSection, TEXTS.unsubscribeEvent);
          subLink.addEventListener("click", async event => {
            event.preventDefault();
            await subscribeEvent(subscription, eventId);
            await handleSubLinks(registration);
          });
        }
      }

      let unsubAllLink = createSubLink(subsSection, TEXTS.unsubscribeAll);
      unsubAllLink.addEventListener("click", async event => {
        event.preventDefault();
        await unsubscribeAll(subscription.endpoint);
        await unsubscribe(registration);
        await handleSubLinks(registration);
      });
    }
  }

  return true;
}


// LET'S GO!

document.addEventListener("DOMContentLoaded", async () => {
  let registration = await registerServiceWorker();
  await handleSubLinks(registration);
});
"use strict";

/* eslint-disable max-lines-per-function */
/* eslint-disable max-len */

const texts = {
  en: {
    there: "There",
    square: "Square",
    willBe: "will be"
  },

  de: {
    there: "Dabei",
    square: "Nicht dabei",
    willBe: "ist"
  }
};

// ###### PUSH NOTIFICATIONS

self.addEventListener("push", event => {
  if (event.data) {
    let data = event.data.json();

    let TEXTS = texts[data.language];
    let title = data.title;
    let body = `${TEXTS.there}: ${data.going} | ${TEXTS.square}: ${data.notGoing}\n\n`;

    if (data.username) {
      let there = data.there ? TEXTS.there.toLowerCase() : TEXTS.square.toLowerCase();
      body += `${data.username} ${TEXTS.willBe} ${there}.`;
    }

    let options = {
      body: body,
      icon: "/android-chrome-192x192.png",
      tag: "thrsqr",
      renotify: true,
      vibrate: [67, 33, 67],
      data: {
        clickURL: `/event/${data.eventId}`
      }
    };
    console.log("Trying to show notification:", title, body);
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.preventDefault();
  event.notification.close();
  // eslint-disable-next-line no-undef
  event.waitUntil(clients.openWindow(event.notification.data.clickURL));
});
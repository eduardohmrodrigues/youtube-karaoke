// ==UserScript==
// @name         YouTube Karaoke Lyrics Overlay (Substring Timing)
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  Karaoke subtitles with per-substring highlighting and draggable overlay (TrustedHTML-safe version)
// @author       You
// @match        https://www.youtube.com/watch*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const lyrics = [
    {
      start: 2.0,
      end: 6.0,
      parts: [
          { text: 'ね', time: 2.0 },
          { text: 'が', time: 2.3 },
          { text: 'い', time: 2.5 },
          { text: 'を ', time: 2.8 },
          { text: 'こめて', time: 3.0 }
      ]
    },
    {
      start: 6.1,
      end: 10.0,
      parts: [
        { text: 'Living ', time: 6.1 },
        { text: 'in ', time: 6.6 },
        { text: 'a ', time: 7.0 },
        { text: 'lonely ', time: 7.2 },
        { text: 'world', time: 7.7 }
      ]
    },
    // Add more lines here...
  ];

  let subtitleDiv = null;

  function createSubtitleDiv() {
    subtitleDiv = document.createElement('div');
    subtitleDiv.id = 'karaoke-subtitles';
    subtitleDiv.style.position = 'fixed';
    subtitleDiv.style.bottom = '15%';
    subtitleDiv.style.left = '0';
    subtitleDiv.style.width = '100%';
    subtitleDiv.style.textAlign = 'center';
    subtitleDiv.style.fontSize = '2.5em';
    subtitleDiv.style.color = '#ffffff';
    subtitleDiv.style.textShadow = '2px 2px 4px #000000';
    subtitleDiv.style.zIndex = '9999';
    subtitleDiv.style.pointerEvents = 'auto';
    subtitleDiv.style.opacity = '0';
    subtitleDiv.style.transition = 'opacity 0.2s ease';
    subtitleDiv.style.fontWeight = 'bold';
    subtitleDiv.style.fontFamily = 'sans-serif';
    subtitleDiv.style.cursor = 'grab';
    subtitleDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
    subtitleDiv.style.borderRadius = '10px';
    subtitleDiv.style.padding = '10px';
    subtitleDiv.style.maxWidth = '90%';
    subtitleDiv.style.margin = '0 auto';

    makeDraggable(subtitleDiv);

    document.body.appendChild(subtitleDiv);
  }

  function makeDraggable(element) {
    let offsetX = 0, offsetY = 0, initialX = 0, initialY = 0;
    let isDragging = false;

    element.addEventListener('mousedown', (e) => {
      isDragging = true;
      element.style.cursor = 'grabbing';
      initialX = e.clientX;
      initialY = e.clientY;
      const rect = element.getBoundingClientRect();
      offsetX = initialX - rect.left;
      offsetY = initialY - rect.top;
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const x = e.clientX - offsetX;
      const y = e.clientY - offsetY;
      element.style.left = x + 'px';
      element.style.top = y + 'px';
      element.style.bottom = 'unset';
      element.style.right = 'unset';
      element.style.position = 'fixed';
    });

    window.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        element.style.cursor = 'grab';
      }
    });
  }

  function getCurrentVideo() {
    return document.querySelector('video');
  }

  function buildTimedLine(parts, currentTime) {
    subtitleDiv.textContent = ''; // Clear old content

    for (const part of parts) {
      const span = document.createElement('span');
      span.textContent = part.text;
      span.style.color = currentTime >= part.time ? 'yellow' : 'white';
      subtitleDiv.appendChild(span);
    }
  }

  function updateSubtitles() {
    const video = getCurrentVideo();
    if (!video) return;

    const currentTime = video.currentTime;
    const active = lyrics.find(line => currentTime >= line.start && currentTime <= line.end);

    if (active) {
      buildTimedLine(active.parts, currentTime);
      subtitleDiv.style.opacity = '1';
    } else {
      subtitleDiv.textContent = '';
      subtitleDiv.style.opacity = '0';
    }
  }

  function startInterval() {
    setInterval(updateSubtitles, 50); // More precise now
  }

  function waitForVideoAndInit() {
    const checkExist = setInterval(() => {
      const video = getCurrentVideo();
      if (video) {
        clearInterval(checkExist);
        if (!document.getElementById('karaoke-subtitles')) {
          createSubtitleDiv();
        }
        startInterval();
      }
    }, 500);
  }

  window.addEventListener('load', waitForVideoAndInit);
})();


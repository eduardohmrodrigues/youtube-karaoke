// ==UserScript==
// @name         YouTube Karaoke Lyrics Overlay
// @namespace    http://tampermonkey.net/
// @version      1.6
// @description  Load karaoke lyrics from external JSON file with timed substrings, draggable, TrustedHTML-safe overlay for YouTube karaoke syncing 🎤✨
// @author       Edu
// @match        https://www.youtube.com/watch*
// @grant        GM_xmlhttpRequest
// @connect      localhost
// ==/UserScript==

(function () {
  'use strict';

  // Currently I have to open a python server in my project folder
  const LYRICS_URL = 'http://localhost:8000/lyrics/sample.json';

  let lyrics = [];
  let subtitleDiv = null;

  function fetchLyrics(callback) {
    GM_xmlhttpRequest({
      method: 'GET',
      url: LYRICS_URL,
      onload: function (response) {
        try {
          const data = JSON.parse(response.responseText);
          if (Array.isArray(data)) {
            lyrics = data;
            callback();
          } else {
            console.error('Invalid lyrics format.');
          }
        } catch (err) {
          console.error('Failed to parse lyrics JSON:', err);
        }
      },
      onerror: function (err) {
        console.error('Failed to load lyrics:', err);
      }
    });
  }

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
    subtitleDiv.textContent = '';

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
    setInterval(updateSubtitles, 50);
  }

  function waitForVideoAndInit() {
    const checkExist = setInterval(() => {
      const video = getCurrentVideo();
      if (video && lyrics.length > 0) {
        clearInterval(checkExist);
        if (!document.getElementById('karaoke-subtitles')) {
          createSubtitleDiv();
        }
        startInterval();
      }
    }, 500);
  }

  fetchLyrics(waitForVideoAndInit);
})();
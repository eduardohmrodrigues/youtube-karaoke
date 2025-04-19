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
  const BASE_URL = 'http://localhost:8000/lyrics/';
  let lyrics = [];
  let subtitleDiv = null;
  let controlBox = null;

  function pauseAndPrompt() {
    const video = document.querySelector('video');
    if (video) {
      video.pause();
      createControlBox();
    }
  }

  function createControlBox() {
    controlBox = document.createElement('div');
    controlBox.style.position = 'fixed';
    controlBox.style.top = '20%';
    controlBox.style.left = '50%';
    controlBox.style.transform = 'translateX(-50%)';
    controlBox.style.backgroundColor = 'white';
    controlBox.style.border = '2px solid #ccc';
    controlBox.style.padding = '20px';
    controlBox.style.borderRadius = '10px';
    controlBox.style.zIndex = '10000';
    controlBox.style.textAlign = 'center';
    controlBox.style.fontSize = '1.2em';
    controlBox.style.boxShadow = '0px 0px 10px rgba(0,0,0,0.4)';
    controlBox.style.fontFamily = 'sans-serif';

    const title = document.createElement('div');
    title.textContent = '🎤 Choose Playback Mode';
    title.style.marginBottom = '10px';
    title.style.fontWeight = 'bold';
    controlBox.appendChild(title);

    const playBtn = document.createElement('button');
    playBtn.textContent = '▶️ Play Video';
    playBtn.onclick = () => {
      removeControlBox();
      document.querySelector('video')?.play();
    };
    playBtn.style.margin = '5px';

    const karaokeBtn = document.createElement('button');
    karaokeBtn.textContent = '🎶 Play Karaoke';
    karaokeBtn.onclick = loadLyricsFileList;
    karaokeBtn.style.margin = '5px';

    controlBox.appendChild(playBtn);
    controlBox.appendChild(karaokeBtn);

    document.body.appendChild(controlBox);
  }

  function removeControlBox() {
    if (controlBox) {
      controlBox.remove();
      controlBox = null;
    }
  }

  function loadLyricsFileList() {
    GM_xmlhttpRequest({
      method: 'GET',
      url: BASE_URL,
      onload: function (response) {
        const fileNames = [...response.responseText.matchAll(/href="([^"]+\.json)"/g)].map(m => m[1]);

        if (fileNames.length === 0) {
          alert('No lyrics files found.');
          return;
        }

        showFileSelector(fileNames);
      },
      onerror: function () {
        alert('Could not load lyrics folder.');
      }
    });
  }

  function showFileSelector(files) {
    // Clear the control box by removing existing children
    while (controlBox.firstChild) {
      controlBox.removeChild(controlBox.firstChild);
    }

    const title = document.createElement('div');
    title.textContent = '🎵 Select a Lyrics File:';
    title.style.marginBottom = '10px';
    controlBox.appendChild(title);

    const list = document.createElement('ul');
    list.style.listStyle = 'none';
    list.style.padding = '0';

    files.forEach(filename => {
      const li = document.createElement('li');
      li.textContent = filename;
      li.style.cursor = 'pointer';
      li.style.padding = '5px 10px';
      li.style.border = '1px solid #ccc';
      li.style.marginBottom = '5px';
      li.style.borderRadius = '5px';
      li.style.backgroundColor = '#f9f9f9';
      li.onmouseenter = () => li.style.backgroundColor = '#eee';
      li.onmouseleave = () => li.style.backgroundColor = '#f9f9f9';

      li.onclick = () => {
        const fullURL = BASE_URL + filename;
        fetchLyrics(fullURL, () => {
          removeControlBox();
          initSubtitles();
          document.querySelector('video')?.play();
        });
      };

      list.appendChild(li);
    });

    controlBox.appendChild(list);
  }

  function fetchLyrics(url, callback) {
    GM_xmlhttpRequest({
      method: 'GET',
      url,
      onload: function (response) {
        try {
          const data = JSON.parse(response.responseText);
          if (Array.isArray(data)) {
            lyrics = data;
            callback();
          } else {
            alert('Invalid lyrics file format.');
          }
        } catch (e) {
          alert('Error parsing lyrics file.');
        }
      },
      onerror: function () {
        alert('Could not load the lyrics file.');
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

  function makeDraggable(el) {
    let offsetX = 0, offsetY = 0, isDragging = false;

    el.addEventListener('mousedown', (e) => {
      isDragging = true;
      el.style.cursor = 'grabbing';
      offsetX = e.clientX - el.getBoundingClientRect().left;
      offsetY = e.clientY - el.getBoundingClientRect().top;
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      el.style.left = `${e.clientX - offsetX}px`;
      el.style.top = `${e.clientY - offsetY}px`;
      el.style.bottom = 'unset';
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
      el.style.cursor = 'grab';
    });
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
    const video = document.querySelector('video');
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

  function initSubtitles() {
    if (!document.getElementById('karaoke-subtitles')) {
      createSubtitleDiv();
    }
    setInterval(updateSubtitles, 50);
  }

  function waitForVideoAndStart() {
    const check = setInterval(() => {
      const video = document.querySelector('video');
      if (video) {
        clearInterval(check);
        pauseAndPrompt();
      }
    }, 500);
  }

  waitForVideoAndStart();
})();

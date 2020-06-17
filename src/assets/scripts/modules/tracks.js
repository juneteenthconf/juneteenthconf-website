const Handlebars = require('handlebars');
import moment from 'moment';
import 'moment-timezone';

const tracks = {
  currentTimezone: moment.tz.guess(),
  defaultTimezone: 'Europe/Amsterdam',
  liveObject: {},
  liveUrl: '/live.json',
  livePollingInterval: 50 * 1000,
  isLoaded: false,
  currentlyPlaying: false,

  init() {
    // console.log('tracks.init()');

    if (!document.querySelector('#browser-wrapper')) {
      console.log('No trackbrowser available');
      return;
    }

    this.fetchData();
    this.startPolling();
  },

  buildTracks() {
    console.log('buildTracks()');

    this.renderTrackBrowser();
    this.formatUpNextDuration();
    this.bind();
    this.setActivePlayer();

    if (!this.isLoaded) {
      this.isLoaded = true;
    }
  },

  fetchData() {
    console.log('fetchData()');

    // Wait for talks data to load
    this.loadLive().then((data) => {
      this.liveObject = data;
      this.buildTracks();
    });
  },

  startPolling() {
    console.log('startPolling()');

    setInterval(() => {
      this.fetchData();
    }, this.livePollingInterval);
  },

  async loadLive() {
    console.log('loadLive()');

    // this should load the talks json from a remote location
    return await fetch(this.liveUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  },

  bind() {
    // console.log('tracks.bind()');

    const $toggles = $('[data-toggle-track]');

    const video = document.querySelector('#video');
    const chat = document.querySelector('#chat');
    const translationLink = document.querySelector('[data-translation-link]');

    // Remove all active classes
    $toggles.removeClass('active');

    $toggles.click((e) => {
      e.preventDefault();

      const $elem = $(e.currentTarget)[0];
      const trackId = parseInt($elem.dataset.toggleTrack);
      const data = this.liveObject.trackData.tracks[trackId - 1];

      // Update iframe attributes
      // autoplay=1&controls=0
      video.setAttribute('src', data.youtubeCode);
      chat.setAttribute('src', data.chat);

      this.currentlyPlaying = trackId;
      this.setActivePlayer();

      // Set subtitles link if available
      if (data.translationCode) {
        translationLink.setAttribute('href', 'https://translate.it/' + data.translationCode);
        translationLink.style = 'display: inline';
      } else {
        translationLink.setAttribute('href', '');
        translationLink.style = 'display: none';
      }
    });

    // Select first track by default
    if (!this.isLoaded) {
      $toggles[0].click();
      this.currentlyPlaying = 1;
    }
  },

  renderTrackBrowser() {
    // console.log('tracks.renderTrackBrowser()');

    const targetElement = document.querySelector('#browser-wrapper');
    const source = document.querySelector('#browser-template').innerHTML;

    const data = this.liveObject.trackData;

    const template = Handlebars.compile(source);
    targetElement.innerHTML = template(data);
  },

  setActivePlayer() {
    // console.log('tracks.setActivePlayer()');

    // Loop through all tracks, set currentlyPlaying id to active
    const $allTracks = document.querySelectorAll('.track-item');
    $allTracks.forEach((track) => {
      if (track.classList.contains('track' + this.currentlyPlaying)) {
        track.classList.add('active');
      } else {
        track.classList.remove('active');
      }
    });
  },

  formatUpNextDuration() {
    // console.log('tracks.formatUpNextDuration()');

    const talkTimestamp = document.querySelectorAll('[data-talk-duration-diff]');
    const now = moment();

    talkTimestamp.forEach((time) => {
      const timestamp = time.getAttribute('datetime');
      const timeObject = moment.tz(timestamp, this.defaultTimezone);
      let duration = moment.duration(timeObject.diff(now));

      time.innerHTML = duration.humanize();
    });
  },
};

export default tracks;

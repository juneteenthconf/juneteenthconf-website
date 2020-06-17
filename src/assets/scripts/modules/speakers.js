const Handlebars = require('handlebars');
import moment from 'moment';
import 'moment-timezone';

const speakers = {
  currentTimezone: moment.tz.guess(),
  defaultTimezone: 'Europe/Amsterdam',
  talksObject: {},
  genericData: {},
  availableTracks: ['track1', 'track2'],
  talksUrl: '/talks.json',
  talksPollingInterval: 300 * 1000,

  init() {
    // console.log('init()');
    if (!document.querySelector('#speaker-template-output')) {
      console.log('No speaker output available');
      return;
    }

    this.fetchData();
    this.startPolling();
  },

  async loadTalks() {
    // console.log('loadTalks()');

    // this should load the talks json from a remote location
    return await fetch(this.talksUrl)
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

  startPolling() {
    setInterval(() => {
      this.fetchData();
    }, this.talksPollingInterval);
  },

  fetchData() {
    // Wait for talks data to load
    this.loadTalks().then((data) => {
      this.parseSpeakers(data);
    });
  },

  parseSpeakers(data) {
    let speakersCollection = {};

    if (data.sessions) {
      data.sessions.forEach((session) => {
        if (session.speakers) {
          session.speakers.forEach((speaker) => {
            speakersCollection[speaker.fullName] = speaker;
          })
        }
        
        var sortedList = {};
        Object.keys(speakersCollection).sort().forEach((key) => {
          sortedList[key] = speakersCollection[key];
        });
        speakersCollection = sortedList;
      });
  
      var source   = document.querySelector('#speaker-template').innerHTML;
      var target =  document.querySelector('#speaker-template-output');
      
      var template = Handlebars.compile(source);
      var wrapper  = {speakers: speakersCollection};
      
      target.innerHTML = template(wrapper);

    }

  }
};

export default speakers;

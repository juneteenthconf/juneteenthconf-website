const Handlebars = require('handlebars');
import moment from 'moment';
import 'moment-timezone';

const schedule = {
  currentTimezone: moment.tz.guess(),
  defaultTimezone: 'Europe/Amsterdam',
  talksObject: {},
  genericData: {},
  availableTracks: ['track1', 'track2'],
  talksUrl: '/talks.json',
  talksPollingInterval: 300 * 1000,

  init() {
    // console.log('init()');
    if (!document.querySelector('#schedule-container')) {
      console.log('No schedule available');
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

  buildSchedule(daydata) {
    console.log('buildSchedule() '+daydata.id);
    //console.log(daydata)

    this.genericData = daydata.generic;
    this.talksObject = daydata;


    this.genericData.eventStartsAtTimestamp = moment
      .tz(this.genericData.eventStartsAt, this.defaultTimezone)
      .tz(this.currentTimezone);
    this.genericData.eventEndsAtTimestamp = moment
      .tz(this.genericData.eventEndsAt, this.defaultTimezone)
      .tz(this.currentTimezone);

    this.genericData.eventStartsAtHour = parseInt(this.genericData.eventStartsAtTimestamp.format('k'));
    this.genericData.eventEndsAtHour = parseInt(this.genericData.eventEndsAtTimestamp.format('k'));

    this.createTracks();
    this.createTimeline();
    this.formatDates(); 


    this.renderTimezoneSelect();
    this.bindTimezoneSelect();

    this.bindModalHash();
    this.openModalOnLoad();
  },

  startPolling() {
    // console.log('startPolling()');

    setInterval(() => {
      this.fetchData();
    }, this.talksPollingInterval);
  },

  fetchData() {
    // Wait for talks data to load
    this.loadTalks().then((data) => {

      this.createDaySchedule(data);

      data.Days.forEach((day) => {
        //this.talksObject = day;
        //this.genericData = day.generic;
        this.buildSchedule(day);
      });


    });
  },

  createDaySchedule(data) {
    console.log("Createing schedule holders")
    var source   = document.querySelector('#schedule-template').innerHTML;
    var target =  document.querySelector('#schedule-container');
    
    var template = Handlebars.compile(source);
    var wrapper  = {Days: data.Days};
    
    target.innerHTML = template(wrapper);

  },



  createTracks() {
    // console.log('createTracks()');

    const targetElement = document.querySelector('#schedule-wrapper-'+this.talksObject.id);
    targetElement.innerHTML = '';

    this.availableTracks.forEach((track) => {
      const trackData = this.createSingleTrack(this.talksObject[track]);
      targetElement.innerHTML += this.renderTrack(trackData);
    });
  },

  createSingleTrack(trackData) {
    // console.log('createSingleTrack()');

    // Get start and end of track
    const talks = trackData.talks;
    const trackid = trackData.id;

    let talkArrays = [];

    // Add breaks and trackid to talk
    talks.forEach((talk, i) => {
      if (talk.isBreak) {
        talkArrays[i] = {
          isBreak: true,
          height: (200/60*talk.duration),
        };
      } else {
        talkArrays[i] = {
          ...talk,
          trackid: trackid,
          isBreak: false,
          height: (200/60*talk.duration),
          smallBlock:  false //((200/60*talk.duration) < 200)
        };
      }
    });
    trackData.talks = talkArrays;
    return trackData;
  },

  createTimeline() {
    // console.log('createTimeline()');

    let timelineArray = [];

    // Start timestamp object
    let startTimestamp = moment(this.genericData.eventStartsAt);

    const timeframe = this.genericData.eventEndsAtTimestamp.diff(this.genericData.eventStartsAtTimestamp, 'hours');

    // Timeline array
    for (let i = 0; i <= timeframe; i++) {
      // Format time display timestamp
      const timeObject = moment.tz(startTimestamp, this.defaultTimezone);
      const timestamp = timeObject.format('YYYY-MM-DD[T]HH:mm:ss');

      const time = {
        time: i + ':00',
        timestamp: timestamp,
      };
      timelineArray[i] = time;
      startTimestamp.add(1, 'h');
    }

    const data = {
      item: timelineArray,
    };
    //console.log('#timeline-wrapper-'+this.talksObject.id)
    const targetElement = document.querySelector('#timeline-wrapper-'+this.talksObject.id);
    const source = document.querySelector('#timeline-template').innerHTML;

    const template = Handlebars.compile(source);
    targetElement.innerHTML = template(data);
  },

  // Render schedule template
  renderTrack(data) {
    const source = document.querySelector('#track-template').innerHTML;

    const trackData = data;
    const template = Handlebars.compile(source);
    return template(trackData);
  },

  // Format dates with momentjs according to selected timezone
  formatDates() {
    // console.log('formatDates()');
    const talkTimestamp = document.querySelectorAll('[data-talk-timestamp]');
    const timezone = this.currentTimezone;
    talkTimestamp.forEach((time) => {
      const timestamp = time.getAttribute('datetime');
      const format = time.dataset.talkTimestamp;

      const timeObject = moment.tz(timestamp, this.defaultTimezone);
      time.innerHTML = timeObject.tz(timezone).format(format);
    });
  },

  // Render timezone select element
  renderTimezoneSelect() {
    // Users timezone
    const userTimezone = {
      [this.currentTimezone]:
        'Your timezone: (GMT' + moment.tz(this.currentTimezone).format('Z') + ') ' + this.currentTimezone,
    };

    // List with common timezones
    const commonTimezones = {
      'Pacific/Honolulu': '(GMT-10:00) Hawaiian/Aleutian Time',
      'America/Anchorage': '(GMT-08:00) Alaska Time',
      'America/Los_Angeles': '(GMT-07:00) Pacific Time (US)',
      'America/Phoenix': '(GMT-07:00) Mountain Time (Arizona)',
      'America/Denver': '(GMT-06:00) Mountain Time (US)',
      'America/Chicago': '(GMT-05:00) Central Time (US)',
      'America/New_York': '(GMT-04:00) Eastern Time (US)',
      'America/Indiana/Knox': '(GMT-05:00) Central Time (Indiana)',
      'America/Indiana/Indianapolis': '(GMT-04:00) Eastern Time (Indiana)',
      'America/Regina': '(GMT-06:00) Central Time (Saskatchewan)',
      'America/Monterrey': '(GMT-05:00) Central Time (Mexico City, Monterey)',
      'America/Lima': '(GMT-05:00) UTC/GMT -5 hours',
      'America/Manaus': '(GMT-04:00) Atlantic Time',
      'America/Montevideo': '(GMT-03:00) Uruguay',
      'America/Puerto_Rico': '(GMT-04:00) Atlantic Time (Puerto Rico)',
      'America/Thule': '(GMT-03:00) Western Greenland Time',
      'America/Sao_Paulo': '(GMT-03:00) Eastern Brazil',
      'America/St_Johns': '(GMT-02:30) Newfoundland Time',
      'America/Godthab': '(GMT-02:00) Central Greenland Time',
      'Etc/GMT+2': '(GMT-02:00) GMT-2:00',
      'America/Scoresbysund': '(GMT+00:00) Eastern Greenland Time',
      'Atlantic/Reykjavik': '(GMT+00:00) Western European Time (Iceland)',
      UTC: '(GMT+00:00) UTC',
      'Europe/London': '(GMT+01:00) British Time (London)',
      'Etc/GMT-1': '(GMT+01:00) GMT+1:00',
      'Europe/Lisbon': '(GMT+01:00) Western European Time (Lisbon)',
      'Europe/Paris': '(GMT+02:00) Western European Time',
      'Europe/Berlin': '(GMT+02:00) Central European Time',
      'Europe/Bucharest': '(GMT+03:00) Eastern European Time',
      'Africa/Johannesburg': '(GMT+02:00) South Africa Standard Time',
      'Africa/Kampala': '(GMT+03:00) Eastern Africa Time',
      'Etc/GMT-3': '(GMT+03:00) Moscow',
      'Asia/Tehran': '(GMT+04:30) Iran Standard Time',
      'Asia/Dubai': '(GMT+04:00) UAE (Dubai)',
      'Asia/Karachi': '(GMT+05:00) Pakistan Standard Time (Karachi)',
      'Asia/Calcutta': '(GMT+05:30) India',
      'Asia/Dhaka': '(GMT+06:00) Bangladesh Standard Time',
      'Asia/Jakarta': '(GMT+07:00) Western Indonesian Time (Jakarta)',
      'Asia/Bangkok': '(GMT+07:00) Thailand (Bangkok)',
      'Asia/Hong_Kong': '(GMT+08:00) Hong Kong',
      'Asia/Singapore': '(GMT+08:00) Singapore',
      'Australia/West': '(GMT+08:00) Australian Western Time',
      'Asia/Tokyo': '(GMT+09:00) Tokyo',
      'Australia/North': '(GMT+09:30) Australian Central Time (Northern Territory)',
      'Australia/Adelaide': '(GMT+09:30) Australian Central Time (Adelaide)',
      'Australia/Queensland': '(GMT+10:00) Australian Eastern Time (Queensland)',
      'Australia/Sydney': '(GMT+10:00) Australian Eastern Time (Sydney)',
      'Pacific/Noumea': '(GMT+11:00) Noumea, New Caledonia',
      'Pacific/Norfolk': '(GMT+11:00) Norfolk Island (Australia)',
      'Pacific/Tarawa': '(GMT+12:00) Tarawa',
      'Pacific/Auckland': '(GMT+12:00) New Zealand Time',
      'Pacific/Apia': '(GMT+13:00) Apia, Samoa',
    };

    const selectOptions = {
      options: Object.assign(userTimezone, commonTimezones),
    };

    // Parse select html
    const $select = document.querySelector('#timezone-select');
    const source = document.querySelector('#timezone-template').innerHTML;
    const template = Handlebars.compile(source);
    $select.innerHTML = template(selectOptions);
  },

  // Bind event for timezone select
  bindTimezoneSelect() {
    const $select = document.querySelector('#timezone-select');
    $select.addEventListener('change', (e) => {
      this.currentTimezone = e.target.value;
      this.formatDates();
    });
  },

  // Automagically opens a model when hash is set in url
  openModalOnLoad() {
    // console.log('schedule.openModalOnLoad()');
    const hash = window.location.hash;

    // Check for hash
    if (!hash) {
      return;
    }

    // Check for talk hash
    let hasTalkHash = hash.indexOf('#talk-') !== -1;
    if (!hasTalkHash) {
      return;
    }

    // Parse ID from hash
    const talkID = hash.substring(6);

    // Remove backdrop if it exists
    const $backdrop = document.querySelector('.modal-backdrop');
    if ($backdrop) {
      $backdrop.parentNode.removeChild($backdrop);
    }

    // Get and open modal
    const modal = document.querySelector('#talk-' + talkID);
    $(modal).modal('show');
  },

  // Set URL hash on modal clicks
  bindModalHash() {
    const triggers = document.querySelectorAll('[data-talk-modal]');

    triggers.forEach((trigger) => {
      const modalID = trigger.dataset.talkModal;

      $(trigger).on('show.bs.modal', () => {
        // console.log('add to URL');
        window.location.hash = 'talk-' + modalID;
      });
      $(trigger).on('hide.bs.modal', () => {
        // console.log('remove from URL');

        history.replaceState(null, null, ' ');
      });
    });
  },
};

export default schedule;

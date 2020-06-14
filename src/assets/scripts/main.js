import schedule from './modules/schedule';
import tracks from './modules/tracks';
import persons from './modules/persons';

import 'bootstrap/js/src/util';
import 'bootstrap/js/src/modal';

// Require jQuery
const jquery = require('jquery');
$ = window.$ = window.jQuery = jquery;

document.addEventListener('DOMContentLoaded', () => {
  schedule.init();
  tracks.init();
  persons.init();
});

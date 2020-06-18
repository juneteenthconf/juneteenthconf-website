const Handlebars = require('handlebars');

import stalksData from './../../../stalks.json';

const stalks = {

  init() {


    if (!document.querySelector('#stalks-template')) {
      console.log('No supporting talks template available');
      return;
    }

    var source   = document.querySelector('#stalks-template').innerHTML;
    var target =  document.querySelector('#stalks-template-output');

    var template = Handlebars.compile(source);
    var wrapper  = {stalks: stalksData};

    target.innerHTML = template(wrapper);

  },

};

export default stalks;
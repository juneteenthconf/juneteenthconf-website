const Handlebars = require('handlebars');

import peopleData from './../../../people.json';

const persons = {

  init() {


    if (!document.querySelector('#persons-template')) {
      console.log('No persons template available');
      return;
    }

    

    var source   = document.querySelector('#persons-template').innerHTML;
    var target =  document.querySelector('#persons-template-output');
    
    var template = Handlebars.compile(source);
    var wrapper  = {persons: peopleData};
    
    target.innerHTML = template(wrapper);

  },



};

export default persons;

'use strict'

const axios = require('axios');

const instance = axios.create({
  baseURL: 'http://localhost:3000/api'
});

export default {
  appuser: {
    create: function(name, email, zip, age, account_id) {
      return instance.post('appuser/create', {
        name, email, zip, age, account_id
      });
    }
  },
  dailywalk: {

  },
  intentionalwalk: {

  },
};

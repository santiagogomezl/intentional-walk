'use strict'

const axios = require('axios');

const instance = axios.create({
  baseURL: 'https://iwalk-test.c4sf.me/api'
});

export default {
  appUser: {
    create: function(name, email, zip, age, account_id) {
      return instance.post('appuser/create', {
        name, email, zip, age, account_id
      });
    },
  },
  contest: {
    current: function() {
      return instance.get('contest/current');
    }
  },
  dailyWalk: {
    create: function(daily_walks, account_id) {
      return instance.post('dailywalk/create', {
        daily_walks, account_id
      });
    },
  },
  intentionalWalk: {
    create: function(intentional_walks, account_id) {
      return instance.post('intentionalwalk/create', {
        intentional_walks, account_id
      });
    },
    get: function(account_id) {
      return instance.post('intentionalwalk/get', {account_id});
    },
  },
};

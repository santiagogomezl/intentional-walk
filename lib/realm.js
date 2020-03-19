'use strict'

import Realm from 'realm';
import moment from 'moment';

class AppUser {

};

AppUser.schema = {
  name: 'AppUser',
  primaryKey: 'id',
  properties: {
    id: 'string',
    name: 'string',
    email: 'string',
    zip: 'string',
    age: 'int',
  }
};

class IntentionalWalk {
  get elapsedTime() {
    if (this.start && this.end) {
      let dt = moment(this.end).diff(this.start, 'seconds');
      if (this.pause) {
        dt -= this.pause;
      }
      return dt;
    }
    return 0;
  }
};

IntentionalWalk.schema = {
  name: 'IntentionalWalk',
  primaryKey: 'id',
  properties: {
    id: 'string',
    start: 'date',
    end: 'date?',
    pause: 'int?',
    steps: 'int?',
    distance: 'double?',
  }
}

const open = function() {
  return Realm.open({
    schema: [AppUser, IntentionalWalk],
    deleteRealmIfMigrationNeeded: true // TODO: remove after schema stabilizes
  });
};

export default {
  open
};

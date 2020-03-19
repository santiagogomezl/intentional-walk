'use strict'

const Realm = require('realm');

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

};

IntentionalWalk.schema = {
  name: 'IntentionalWalk',
  primaryKey: 'id',
  properties: {
    id: 'string',
    start: 'date',
    end: 'date?',
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

'use strict'

import Realm from 'realm';
import 'react-native-get-random-values';
import {v4 as uuidv4} from 'uuid';
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

function startWalk() {
  return new Promise((resolve, reject) => {
    getCurrentWalk().then(walk => {
      if (!walk) {
        open().then(realm => {
          realm.write(() => {
            const walk = realm.create('IntentionalWalk', {
              id: uuidv4(),
              start: new Date()
            });
            resolve(walk)
          });
        }).catch(error => {
          reject(error);
        });
      } else {
        resolve(walk);
      }
    });
  });
}

function getCurrentWalk() {
  return new Promise((resolve, reject) => {
    open().then(realm => {
      const results = realm.objects('IntentionalWalk').filtered('end=null');
      resolve(results.length > 0 ? results[0] : false);
    });
  });
}

function updateCurrentWalk(data) {
  return new Promise((resolve, reject) => {
    getCurrentWalk().then(walk => {
      open().then(realm => {
        realm.write(() => {
          walk.steps = data ? (data.numberOfSteps || 0) : 0;
          walk.distance = data ? (data.distance || 0) * 0.000621371 : 0;
          resolve(walk);
        });
      }).catch(error => {
        reject(error);
      });
    });
  });
}

function stopWalk(end, data) {
  return new Promise((resolve, reject) => {
    getCurrentWalk().then(walk => {
      if (walk) {
        open().then(realm => {
          realm.write(() => {
            walk.end = end;
            walk.steps = data ? (data.numberOfSteps || 0) : 0;
            walk.distance = data ? (data.distance || 0) * 0.000621371 : 0;
            resolve(walk);
          });
        }).catch(error => {
          reject(error);
        });
      }
    });
  });
}

export default {
  open,
  startWalk,
  getCurrentWalk,
  updateCurrentWalk,
  stopWalk
};

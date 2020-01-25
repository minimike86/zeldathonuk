// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import {HttpHeaders} from "@angular/common/http";

export const environment = {
  production: false,
  firebase: {
    apiKey: "AIzaSyDeG1Vk7Ui80KOnTsj2C7iU04hsLO0eUHM",
    authDomain: "zeldathonuk.firebaseapp.com",
    databaseURL: "https://zeldathonuk.firebaseio.com",
    projectId: "zeldathonuk",
    storageBucket: "zeldathonuk.appspot.com",
    messagingSenderId: "828201836447"
  }
};

export const jgEnvironment = {
  production: false,
  justgiving: {
    pageShortName: 'zeldathonuk-gameblast-2020',
    baseUri: 'https://api.staging.justgiving.com/v1',
    httpOptions: {
      headers: new HttpHeaders({
        'Accept': 'application/json',
        'x-api-key': '6cb44e17'
      })
    },
    testCreditCard: {
      type: 'Master Card',
      number: '4111111111111111',
      expiry: '01/2020',
      cv2: '123',
      verifyStepPswd: '12345'
    },
    testPayPal: {
      username: 'paypalsandboxapi@justgiving.com',
      password: 'letmeinplease'
    }
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.

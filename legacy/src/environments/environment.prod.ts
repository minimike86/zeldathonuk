import {HttpHeaders} from '@angular/common/http';

export const environment = {
  production: true,
  firebase: {
    apiKey: 'AIzaSyDeG1Vk7Ui80KOnTsj2C7iU04hsLO0eUHM',
    authDomain: 'zeldathonuk.firebaseapp.com',
    databaseURL: 'https://zeldathonuk.firebaseio.com',
    projectId: 'zeldathonuk',
    storageBucket: 'zeldathonuk.appspot.com',
    messagingSenderId: '828201836447'
  }
};

export const fbEnvironment = {
  fundraisingId: 855003971855785,
};

export const jgEnvironment = {
  production: true,
  justgiving: {
    pageShortName: 'zeldathonuk-gameblast2022',
    baseUri: 'https://api.justgiving.com/v1',
    httpOptions: {
      headers: new HttpHeaders({
        'Accept': 'application/json',
        'x-api-key': '6cb44e17'
      })
    }
  }
};

export const tiltifyEnvironment = {
  production: true,
  accessToken: '',
};

export const twitchEnvironment = {
  production: true,
  accessToken: '',
  clientId: '',
};

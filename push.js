window.addEventListener('load', registerServiceWorker, false);

var addressIp = 'https://message-push-up-205517.appspot.com';

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').then(initialiseState);
    } else {
        console.warn('Service workers are not supported in this browser.');
    }
}

function initialiseState() {
    if (!('showNotification' in ServiceWorkerRegistration.prototype)) {
        console.warn('Notifications aren\'t supported.');
        return;
    }

    if (Notification.permission === 'denied') {
        console.warn('The user has blocked notifications.');
        return;
    }

    if (!('PushManager' in window)) {
        console.warn('Push messaging isn\'t supported.');
        return;
    }

    navigator.serviceWorker.ready.then(function (serviceWorkerRegistration) {
        serviceWorkerRegistration.pushManager.getSubscription().then(function (subscription) {
            if (!subscription) {
                subscribe();

                return;
            }

            // Keep your server in sync with the latest subscriptionId
            sendSubscriptionToServer(subscription);
        })
        .catch(function(err) {
            console.warn('Error during getSubscription()', err);
        });
    });
}

function subscribe() {
    const publicKey = base64UrlToUint8Array('BAPGG2IY3Vn48d_H8QNuVLRErkBI0L7oDOOCAMUBqYMTMTzukaIAuB5OOcmkdeRICcyQocEwD-oxVc81YXXZPRY');

    navigator.serviceWorker.ready.then(function (serviceWorkerRegistration) {
        serviceWorkerRegistration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: publicKey
        })
        .then(function (subscription) {
            return sendSubscriptionToServer(subscription);
        })
        .catch(function (e) {
            if (Notification.permission === 'denied') {
                console.warn('Permission for Notifications was denied');
            } else {
                console.error('Unable to subscribe to push.', e);
            }
        });
    });
}

function sendSubscriptionToServer(subscription) {
    var key = subscription.getKey ? subscription.getKey('p256dh') : '';
    var auth = subscription.getKey ? subscription.getKey('auth') : '';

    document.getElementById('subscription').value = JSON.stringify(subscription);

    console.log({
        endpoint: subscription.endpoint,
        key: key ? btoa(String.fromCharCode.apply(null, new Uint8Array(key))) : '',
        auth: auth ? btoa(String.fromCharCode.apply(null, new Uint8Array(auth))) : ''
    });

    var dataSuscription = JSON.parse(document.getElementById('subscription').value);
    fetch(addressIp+'/registration', {
      method: 'POST',
      body: JSON.stringify(dataSuscription),
      headers: new Headers({'content-type': 'application/json'})
    });

    return Promise.resolve();
}

function base64UrlToUint8Array(base64UrlData) {
    const padding = '='.repeat((4 - base64UrlData.length % 4) % 4);
    const base64 = (base64UrlData + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = atob(base64);
    const buffer = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        buffer[i] = rawData.charCodeAt(i);
    }

    return buffer;
}

function sendData(suscription) {
  var form = document.getElementById('form-push');
  let formData = new FormData(form);
  if ( !!suscription ) {
    var element = document.getElementById(suscription);
    var data = element.value;
    formData.delete('suscription');
    formData.append('suscription', data);
  }
  fetch(addressIp+'/send', {
    method: 'POST',
    body: formData
  });
}

window.addEventListener('load', function () {
    var button = document.getElementById('send');
    var form = document.getElementById('form-push');
    var refresh = document.getElementById('refresh');
    button.addEventListener('click', function () {
      sendData();
    });
  form.addEventListener('submit', function(e) {
    e.preventDefault();
  });
  refresh.addEventListener('click', function(e) {
    fetch(addressIp+'/findAll', {
      method: 'get'
    }).then( (result) => result.json())
      .then( (result) => {
      if ( !!result ) {
        var suscriptions = result;
        var tableAll = document.getElementById('tableAll');
        tableAll.innerHTML = '';
        var rows = '';
        var i = 1;
        suscriptions.forEach( (element) => {
          rows+= "<tr>";
          rows+= "<td>" + JSON.stringify(element) +"</td>";
          rows+= `<td><button id='${i}' value='${JSON.stringify(element)}' onclick='sendData(${i})'>Enviar Notificacion</button></td>`;
          rows+="</tr>";
          i++;
        });
        tableAll.innerHTML = `<table>${rows}</table>`;
      }
    });
  });
  refresh.click();
});


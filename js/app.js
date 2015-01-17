/*
 * (C) Copyright 2015 Makoto Kato.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var wispr = null;

function showLoginProgressDialog()
{
  var form = document.createElement('form');
  form.setAttribute('role', 'dialog');
  form.setAttribute('data-type', 'confirm');
  form.setAttribute('id', 'login_form');
  form.innerHTML = '<section><h1>Login...</h1><p style="text-align: center;"><progress></progress></p></section><menu><button class="full" id="login_cancel">Cancel</button></menu>';
  document.getElementById('dialogs').appendChild(form);

  document.getElementById('login_cancel').addEventListener('click', function() {
    wispr.abort();
  });
}

function closeLoginProgressDialog()
{
    document.getElementById('dialogs').removeChild(document.getElementById('login_form'));
}

function showLoginMessage(aText)
{
  document.getElementById('messages').innerHTML = '<section role="status" id="loginmessage"><p>' + aText + '</p></section>';
  window.setTimeout(function() {
    document.getElementById('loginmessage').setAttribute('class', 'fade-out');
  }, 3000);
}

window.addEventListener('DOMContentLoaded', function() {

  document.getElementById('auwifi').style.display = 'none';

  wispr = new WISPr;

  document.getElementById('username').value = localStorage.getItem('username');
  document.getElementById('password').value = localStorage.getItem('password');

  document.getElementById('login').removeAttribute('disabled');
  document.getElementById('logout').setAttribute('disabled', '1');

  document.getElementById('register').addEventListener('click', () => {
    // navigator.mozWifiManager.macAddress
    var auauth = new AuOneAuthByBrowser;
    auauth.registerMacAddress(document.getElementById('macaddress').value);
  });
  document.getElementById('login').addEventListener('click', () => {
      document.getElementById('messages').innerHTML = '';

    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;

    localStorage.setItem('username', username);
    localStorage.setItem('password', password);

    var promise = wispr.login(username, password);
    document.getElementById('login').setAttribute('disabled', '1');
    document.getElementById('logout').setAttribute('disabled', '1');
    showLoginProgressDialog();
    promise.then(function() {
      document.getElementById('logout').removeAttribute('disabled');
      closeLoginProgressDialog();
      showLoginMessage('Login Successful');
    }, function() {
      document.getElementById('login').removeAttribute('disabled');
      closeLoginProgressDialog();
      showLoginMessage('Login Failed');
    });
  });
  document.getElemeion = ntById('logout').addEventListener('click', function() {
    wispr.logout();
    document.getElementById('login').removeAttribute('disabled');
    document.getElementById('logout').setAttribute('disabled', '1');
  });
});

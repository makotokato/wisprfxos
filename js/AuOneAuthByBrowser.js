/*
 * (C) Copyright 2015 Makoto Kato <m_kato@ga2.so-net.ne.jp>
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

"use strict";

function AuOneAuthByBrowser() {
}

AuOneAuthByBrowser.prototype = {
  registerMacAddress: function(aMACAddress) {
    var self = this;
    // If this app is certified, mac address can get by
    // navigator.mozWifiManager.macAddress
    var xhr = new XMLHttpRequest({mozSystem: true});
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4) {
        // au will show login authentication form.
        // So we open browser app via Web activities.
        console.log('Open au ID login by browser. url: ' + xhr.responseURL);
        self._authByBrowser(xhr.responseURL);
      }
    };

    var hardwareInfo = {
      'request_type': '0',
      'mac_addrs': [aMACAddress],
      'manufacturer': 'LGE',
      'model': 'Fx0'
    };

    xhr.open('POST', this.url, true);
    xhr.responseType = 'document';
    xhr.withCredentials = true;
    xhr.send(JSON.stringify(hardwareInfo));
  },

  get url() {
    return 'https://auwifi-signup.auone.jp/su2/';
  },

  _authByBrowser: function(aURL) {
    new MozActivity({
      name: 'view',
      data: {
        type: 'url',
        url: aURL
      }
    });
  },
};

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

function WISPr() {
}

WISPr.prototype = {
  login: function(aUsername, aPassword) {
    var self = this;
    var promise = new Promise(function(resolve, reject) {
      var xhr = new XMLHttpRequest({mozSystem: true});
      self._xhr = xhr;
      xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
          // <WISPAccessGatewayParam>
          //  <Redirect>
          //   <ResponseCode>0</ResponseCode>
          //   <LoginURL>...</LoginURL>
          //   ...
          //  </Redirect>
          // </WISPAccessGatewayParam>
          if (xhr.status != 200) {
            console.log('HTTP Stuats: ' + xhr.status);
            reject();
            return;
          }
          try {
            var xmlDoc = self._getWISPrXML(xhr.responseText);
            var responseCode =
              self._getResponseCode(xmlDoc, '/WISPAccessGatewayParam/Redirect');
            console.log('ResponseCode: ' + responseCode);
            if (responseCode != 0) {
              console.log('Cannot parse WISPr XML');
              reject();
              return;
            }

            self._loginViaWISPr(xmlDoc, aUsername, aPassword, resolve, reject);
          } catch (e) {
            //console.log(e);
            reject();
            return;
          }
        }
      };
      xhr.onerror = function() {
        console.log('error');
        reject();
      };
      xhr.onabort = function() {
        console.log('abort');
        reject();
      };
      xhr.open('GET', 
               'http://www.au.kddi.com/au_wifi_spot/certification2/', true);
      xhr.responseType = "text";
      xhr.send();
    });
    return promise;
  },

  logout: function() {
  },

  abort: function() {
    if (this._xhr) {
      this._xhr.abort();
    }
  },

  _loginViaWISPr: function(aXmlDoc, aUsername, aPassword, aResolve, aReject) {
    var self = this;
    var loginURL =
      aXmlDoc.evaluate('/WISPAccessGatewayParam/Redirect/LoginURL',
                       aXmlDoc, null, XPathResult.ANY_TYPE,
                       null).iterateNext().textContent;

    var xhrLogin = new XMLHttpRequest({mozSystem: true});
    this._xhr = xhrLogin;
    xhrLogin.onreadystatechange = function() {
      if (xhrLogin.readyState == 4) {
        // au WIFI returns invalid XML format
        var result = xhrLogin.responseText.replace(/<WISPAccessGatewayParam[^>]*>/,
                                                   '<WISPAccessGatewayParam>', 'm');

        // <WISPAccessGatewayParam>
        //  <AuthenticationReply>
        //  
        //  </AuthenticationReply>
        // </WISPAccessGatewayParam>
        try {
          var xmlDoc = self._getWISPrXML(result);
          var responseCode =
            self._getResponseCode(xmlDoc,
                                  '/WISPAccessGatewayParam/AuthenticationReply');
          console.log('ResponseCode: ' + responseCode);
          if (responseCode == 201) {
            // pending request
            self._checkPendingStatus(
              xmlDoc.evaluate(
                '/WISPAccessGatewayParam/AuthenticationReply/LoginResultsURL',
                xmlDoc, null, XPathResult.ANY_TYPE,
                null).iteratorNext().textContent, aResolve, aReject);
            return;
          } else if (responseCode == 50) {
            aResolve();
            return;
          }
        } catch (e) {
          console.log(e);
        }
        aReject();
      }
    };
    xhrLogin.onerror = function() {
      aReject();
    };
    xhrLogin.onabort = function() {
      aReject();
    };
    var loginForm = new URLSearchParams();
    loginForm.append('UserName', aUsername);
    loginForm.append('Password', aPassword);
 
    //console.log('Sending login information');
    xhrLogin.open('POST', loginURL, true);
    xhrLogin.setRequestHeader('Content-Type',
                              'application/x-www-form-urlencoded');
    xhrLogin.responseType = "text";
    xhrLogin.send(loginForm.toString());
  },

  _checkPendingStatus: function(aUrl, aResolve, aReject) {
    var xhr = new XMLHttpRequest({mozSystem: true});
    this._xhr = xhr;
    var self = this;
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4) {
        // <PollNotification>
        //  <ResponseCode>...</ResponseCode>
        //  <LoginResultsURL>...</LoginResultsURL>
        // </PollNotification>
        try {
          var xmlDoc = self._getWISPrXML(xhr.responseText);
          var responseCode = self._getResponseCode(xmlDoc,
                                                   '/WISPAccessGatewayParam/AuthenticationReply');
          console.log('ResponseCode: ' + responseCode);
          if (responseCode == 201) {
            var delay = 10;
            try {
              delay = parseInt(xmlDoc.getElementByTagName('Delay')[0].childNodes[0]) + 1;
            } catch (e) {
            }
            window.setTimeout(self._checkPendingStatus(aUrl, aResolve, aReject),
                              delay * 1000);
            return;
          }

          if (responseCode == 50) {
            aResolve();
            return;
          }
        } catch (e) {
          console.log(e);
        }
        aReject();
      }
    };
    xhr.onerror = function() {
      aReject();
    };
    xhr.onabort = function() {
      aReject();
    };
    xhr.open('POST', aURL);
    xhr.setRequestHeader('Content-Type',
                         'application/x-www-form-urlencoded');
    xhr.responseType = "text";
    xhr.send();
  },

  _getResponseCode: function(aXmlDoc, aPath) {
    return parseInt(aXmlDoc.evaluate(aPath + '/ResponseCode', aXmlDoc, null,
                                     XPathResult.ANY_TYPE,
                                     null).iterateNext().textContent);
  },

  _getWISPrXML: function(aText) {
    console.log('parsing...  Original HTML/XML: ' + aText);
    // WISPr's XML may be into HTML's commnet
    var regex = new RegExp('(<WISPAccessGatewayParam[<>a-zA-Z0-9.\\-=?:"/ \r\n]*</WISPAccessGatewayParam>)', "m");
    var result = regex.exec(aText)[1];
    console.log('Found WISPr XML: ' + result);
    var parser = new DOMParser();
    return parser.parseFromString(result, 'text/xml');
  }
};

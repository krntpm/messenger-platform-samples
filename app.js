/**
 * Copyright 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 * Starter Project for Messenger Platform Webview Tutorial
 *
 * Use this project as the starting point for following the
 * Messenger Platform webview tutorial.
 *
 * https://blog.messengerdevelopers.com/using-the-webview-to-create-richer-bot-to-user-interactions-ed8a789523c6
 *
 */

'use strict';
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
// Imports dependencies and set up http server
const
    request = require('request'),
    express = require('express'),
    body_parser = require('body-parser'),
    dotenv = require('dotenv').config();
    

var app = express();
var _axios = require('axios');

var _https = require('https');

var _https2 = _interopRequireDefault(_https);

var _axios2 = _interopRequireDefault(_axios);
_axios2.default.defaults.timeout = 6000;

_axios2.default.interceptors.request.use(function (config) {
    config.requestTime = new Date().getTime();
    return config;
}, function (err) {
    return Promise.reject(err);
});

_axios2.default.interceptors.response.use(function (res) {
   // logger.logService({}, res.config, res, res.request.connection);
    return res;
}, function (err) {
    //logger.logService(err, err.config, {}, err.request.connection);
    return Promise.reject(err);
});

app.set('port', process.env.PORT || 5000);
app.use(body_parser.json());
app.use(express.static('public'));

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const SERVER_URL = process.env.SERVER_URL;
const APP_SECRET = process.env.APP_SECRET;

app.listen(app.get('port'), () => {
    console.log('Node app is running on port', app.get('port'));
});

module.exports = app;

// Serve the options path and set required headers
app.get('/options', (req, res, next) => {
    let referer = req.get('Referer');
    if (referer) {
        if (referer.indexOf('www.messenger.com') >= 0) {
            res.setHeader('X-Frame-Options', 'ALLOW-FROM https://www.messenger.com/');
        } else if (referer.indexOf('www.facebook.com') >= 0) {
            res.setHeader('X-Frame-Options', 'ALLOW-FROM https://www.facebook.com/');
        }
        res.sendFile('public/options.html', {root: __dirname});
    }
});

app.get('/test',testRes);

async function testRes(req,res){
 var body ={
    channel: "Google_Assistant",
    term: "เช็คยอดเงิน",
    intent: "display",
    method: "message",
    timeout: 10000,
    userId:  "111111111111111111111111111"
  };
  var agent = new _https2.default.Agent({
    rejectUnauthorized: false
  });
  var header={};
  var randomNumber = Math.floor(Math.random() * 1000000 + 1).toString();
  //header['x-api-request-id'] = "QWlzQEFvZy1ham9pYWRwd2Vpdm5wT2g5U0xrZFZKdzYwSkZjOXBpd2VqdmIycG93bg==";
  header['x-api-request-id'] = 'self-' + new Date().getTime() + randomNumber;
  var response = await _axios.post('https://dev-askaunjai.ais.co.th:8443/social-adapter-fe/chatbot', body,{
    httpsAgent: agent,
    headers: header
   })
   console.log(JSON.stringify(response['data']));
   res.json(response['data']['params']['intent']);
} 
// Handle postback from webview
app.get('/optionspostback', (req, res) => {
    let body = req.query;
    let response = {
        "text": `Great, I will book you a ${body.bed} bed, with ${body.pillows} pillows and a ${body.view} view.`
    };

    res.status(200).send('Please close this window to return to the conversation thread.');
    callSendAPI(body.psid, response);
});

// Accepts POST requests at the /webhook endpoint
app.post('/webhook', (req, res) => {

    // Parse the request body from the POST
    let body = req.body;

    // Check the webhook event is from a Page subscription
    if (body.object === 'page') {

        body.entry.forEach(entry => {

            // Gets the body of the webhook event
            let webhook_event = entry.messaging[0];
            console.log(webhook_event);

            // Get the sender PSID
            let sender_psid = webhook_event.sender.id;
            console.log(`Sender PSID: ${sender_psid}`);

            // Check if the event is a message or postback and
            // pass the event to the appropriate handler function
            if (webhook_event.message) {
                handleMessage(sender_psid, webhook_event.message);
               // let message = webhook_event.message.text;

            } else if (webhook_event.postback) {
                handlePostback(sender_psid, webhook_event.postback);
            }

        });

        // Return a '200 OK' response to all events
        res.status(200).send('EVENT_RECEIVED');

    } else {
        // Return a '404 Not Found' if event is not from a page subscription
        res.sendStatus(404);
    }

});

// Accepts GET requests at the /webhook endpoint
app.get('/webhook', (req, res) => {

    const VERIFY_TOKEN = process.env.TOKEN;

    // Parse params from the webhook verification request
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    // Check if a token and mode were sent
    if (mode && token) {

        // Check the mode and token sent are correct
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {

            // Respond with 200 OK and challenge token from the request
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);

        } else {
            // Responds with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403);
        }
    }
});


// Handles messages events
async function handleMessage(sender_psid, received_message) {
    let response;
    var text = '';
    // Checks if the message contains text
    if (received_message.text) {
        switch (received_message.text.replace(/[^\w\s]/gi, '').trim().toLowerCase()) {
            case "room preferences":
                response = setRoomPreferences(sender_psid);
                break;
            default:
            let resApi = await callApi('https://dev-askaunjai.ais.co.th:8443/social-adapter-fe/chatbot',{
                channel: "Google_Assistant",
                term: received_message.text,
                intent: "display",
                method: "message",
                timeout: 10000,
                userId: '11111111111111'
              });
                console.log(JSON.stringify(resApi['data']['data']['message'][0]));
                            
                
              
                let responseData = resApi.data;
                let responseStatusCode = responseData['statusCode'];
                console.info(`Status Code ${responseStatusCode}`);
                if(responseStatusCode === '20000'){
                    let responseParams = responseData['params'];
                    let messageDataObj = responseData['data'];
                    let intentData  =responseParams['intent'];
                   
                    console.info(`intent : ${responseParams['intent']}  and method : ${responseParams['method']}`);
                    var intentTagData = responseParams['intentTag'];
                    if(intentTagData.toLocaleUpperCase().indexOf("CHECK")>-1){
                        intentData = 'check';
                    }
                    switch (intentData) {
                        case 'display':
                            text = replyDisplay(messageDataObj);
                            break;
                        case 'ir':
                             console.info("in ir intent");
                             text = "Ir";  
                             break;
                        case 'ontop':
                            console.info("in ontop intent");
                            text = "อุ่นใจยังไม่ได้ให้บริการผ่านช่องทางนี้ครับ สามารถใช้ผ่านช่องทางอื่นได้ที่นี่ www.ais.co.th";  
                            break;
                        case 'check':
                              var methodName = intentTagData.split('_').pop();
                              if(methodName.toLocaleUpperCase()==='BALANCE'){
                                     text = "อุ่นใจยังไม่ได้ให้บริการผ่านช่องทางนี้ครับ สามารถใช้ผ่านช่องทางอื่นได้ที่นี่ www.ais.co.th";  
                              }else if(methodName.toLocaleUpperCase()==='BALANCEINTERNET'){
                                     text = "อุ่นใจยังไม่ได้ให้บริการผ่านช่องทางนี้ครับ สามารถใช้ผ่านช่องทางอื่นได้ที่นี่ www.ais.co.th";  
                              }else{
                                 this.replyDisplay(messageDataObj);
                                 //conv.ask(this.TEXT.SERVICE_ERROR);
                              }
                            break;
                        // case 'gsso':
                        //     break;
                        case 'authenticate':
                            break;
                        default:
                            console.info("in default switch case");
                            this.replyDisplay(messageDataObj);
                            break;
                    }
                }else{
                    text = "Error Something wrong";
                }

                
                response = {
                 //   "text": `${urlify(resApi['data']['data']['message'][0])}.`
                   "text": `${text}` 
                };
                break;
        }
    } else {
        response = {
            "text": `Sorry, I don't understand what you mean.`
        }
    }

    // Send the response message
    callSendAPI(sender_psid, response);
}

async function callApi(url,objParams){
   return  _axios.post(url, getBody(objParams),getHeader());  
} 
function modifyMessage(messages){
            let results = {};
           for(var message of messages){
                if(message.indexOf("{{msgSelect:")>-1){
                    results['msgSelect']= message.substring(message.indexOf('{{msgSelect:') +
                                  12, message.indexOf('}}')).replace(/<[^>]+>/g, '');
                    console.info(results['msgSelect']);
                }else if(message.indexOf('{{msgMore:') > -1 ){
                            results['msgMore']  = message.substring(message.indexOf('{{msgMore:') +
                                          10, message.indexOf('}}')).replace(/<[^>]+>/g, '');
                            console.info(results['msgMore']);
                      }else{
                             results['message'] = message.replace(/<[^>]+>/g, '');
                             console.info(results['message']);
                           }
            }
            return results;    
}
function replyDisplay(messageDataObj){
             var text = '';
             let messageObj = modifyMessage(messageDataObj['message']);
             if(messageDataObj['msgParam'] !== undefined && 
                messageDataObj['msgParam']['msgSelect'] !== undefined &&
                messageObj['msgSelect']!==undefined){
                    let msgSelects = [];
                    for(var msgSelectObj of messageDataObj['msgParam']['msgSelect']){
                        text += msgSelectObj['title'];
                    }                   
                   
                    return text +' ' + messageObj['msgSelect'];   
             }else if(messageDataObj['msgParam'] !== undefined && 
                      messageDataObj['msgParam']['msgMore'] !== undefined &&
                      messageObj['msgMore']!==undefined){
                         return messageObj['msgMore'];   
            }else if(messageObj['message']!==undefined){
                      return messageObj['message'];
            }else{
                      return 'อุ่นใจไม่ตอบสนองกรุณาลองใหม่ภายหลัง';
            }
}


function getBody(objParams){
    return {
        channel: objParams.channel,
        term: objParams.term,
        intent: objParams.intent,
        method: objParams.method,
        timeout: objParams.timeout,
        userId: objParams.userId
      };
}

function getHeader(){
      var agent = new _https2.default.Agent({
        rejectUnauthorized: false
      });
      var header={};
      var randomNumber = Math.floor(Math.random() * 1000000 + 1).toString();
      header['x-api-request-id'] = 'self-' + new Date().getTime() + randomNumber;
    return {
        httpsAgent: agent,
        headers: header
    }
}

// Define the template and webview
function setRoomPreferences(sender_psid) {
    let response = {
        attachment: {
            type: "template",
            payload: {
                template_type: "button",
                text: "OK, let's set your room preferences so I won't need to ask for them in the future.",
                buttons: [{
                    type: "web_url",
                    url: SERVER_URL + "/options",
                    title: "Set preferences",
                    webview_height_ratio: "compact",
                    messenger_extensions: true
                }]
            }
        }
    };

    return response;
}

// Sends response messages via the Send API

function urlify(text) {
  //  var urlRegex = /(http|https|ftp|ftps)\:\/\/[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,3}(\/\S*)?/g;
   // var urlRegex =/(^|[^\/])(www\.[\S]+(\b|$))/gim;
   var urlRegex = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s\=\""]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9]\.[^\s]{2,})/g
    var urlFull = '';
    return  text.replace(urlRegex, function(url) {
        urlFull = url;
        return   url;
    }).concat(' '+urlFull).replace(/<[^>]+>/g, '')
}

function callSendAPI(sender_psid, response) {
    // Construct the message body
    
    let request_body = {
        "recipient": {
            "id": sender_psid
        },
        "message": response
    };
    console.log(request_body);
    // Send the HTTP request to the Messenger Platform
    request({
        "uri": "https://graph.facebook.com/v2.6/me/messages",
        "qs": {"access_token": PAGE_ACCESS_TOKEN},
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        if (!err) {
            console.log('message sent!')
        } else {
            console.error("Unable to send message:" + err);
        }
    });
}

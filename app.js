app.post('/webhook', (req, res) => {

    // Parse the request body from the POST
    let body = req.body;
        console.log(req);
     const webhook_events = body.entry[0];
    // Check the webhook event is from a Page subscription
    if (body.object === 'page') {
        console.log(webhook_events);
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

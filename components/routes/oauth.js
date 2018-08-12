var debug = require('debug')('botkit:oauth');

module.exports = function(webserver, controller) {

    var handler = {
        login: function(req, res) {
            res.redirect(controller.getAuthorizeURL());
        },
        install: function(req, res) {
            res.redirect(controller.getAuthorizeURL());
        },
        oauth: function(req, res) {
            var code = req.query.code;
            var state = req.query.state;

            // we need to use the Slack API, so spawn a generic bot with no token
            var slackapi = controller.spawn({});

            var opts = {
                client_id: controller.config.clientId,
                client_secret: controller.config.clientSecret,
                code: code
            };

            slackapi.api.oauth.access(opts, function(err, auth) {

                if (err) {
                    debug('Error confirming oauth', err);
                    return res.redirect('/login_error.html');
                }

                // what scopes did we get approved for?
                var scopes = auth.scope.split(/\,/);

                // use the token we got from the oauth
                // to call auth.test to make sure the token is valid
                // but also so that we reliably have the team_id field!
                slackapi.api.auth.test({token: auth.access_token}, function(err, identity) {

                    if (err) {
                        debug('Error fetching user identity', err);
                        return res.redirect('/login_error.html');
                    }

                    // Now we've got all we need to connect to this user's team
                    // spin up a bot instance, and start being useful!
                    // We just need to make sure this information is stored somewhere
                    // and handled with care!

                    // In order to do this in the most flexible way, we fire
                    // a botkit event here with the payload so it can be handled
                    // by the developer without meddling with the actual oauth route.

                    auth.identity = identity;
                    controller.trigger('oauth:success', [auth]);

                    res.cookie('team_id', auth.team_id);
                    res.cookie('bot_user_id', auth.bot.bot_user_id);
                    res.redirect('/login_success.html');
                });


            });
        },
        signin: function(req, res) {
            var code = req.query.code;
            var state = req.query.state;

            // we need to use the Slack API, so spawn a generic bot with no token
            var slackapi = controller.spawn({});
            var redirect_uri = process.env.redirectUri || 'http://localhost:3001/signin';
            var opts = {
                client_id: controller.config.clientId,
                client_secret: controller.config.clientSecret,
                redirect_uri: redirect_uri,
                code: code
            };

            slackapi.api.oauth.access(opts, function(err, auth) {

                if (err) {
                    debug('Error confirming oauth', err);
                    return res.redirect('/login_error.html');
                }

                // what scopes did we get approved for?
                var scopes = auth.scope.split(/\,/);

                // use the token we got from the oauth
                // to call auth.test to make sure the token is valid
                // but also so that we reliably have the team_id field!
                slackapi.api.auth.test({token: auth.access_token}, function(err, identity) {

                    if (err) {
                        debug('Error fetching user identity', err);
                        return res.redirect('/login_error.html');
                    }

                    // Now we've got all we need to connect to this user's team
                    // spin up a bot instance, and start being useful!
                    // We just need to make sure this information is stored somewhere
                    // and handled with care!

                    // In order to do this in the most flexible way, we fire
                    // a botkit event here with the payload so it can be handled
                    // by the developer without meddling with the actual oauth route.

                    auth.identity = identity;
                    debug('identity', identity);

                    // controller.trigger('oauth:success', [auth]);
                    var admin = require('firebase-admin');
                    var uid = identity.user_id;
                    var additionalClaims = {
                        team_id: identity.team_id
                    };

                    controller.storage.users.save({
                        id: identity.user_id,
                        user_id: identity.user_id,
                        team_id: identity.team_id,
                        auth: auth
                    }, function(err, id) {
                        if (err) {
                            debug('Error: could not save team record:', err);
                        }
                    });
                    var redirect_app_uri = process.env.redirectAppUri || 'http://localhost:3000/';
                    admin.auth().createCustomToken(uid, additionalClaims)
                        .then(function(customToken) {
                            debug('customToken', customToken);
                            // Send token back to client
                            // res.cookie('team_id', auth.team_id);
                            // res.cookie('bot_user_id', auth.bot.bot_user_id);
                            res.redirect(redirect_app_uri + '#access_token=' + customToken + '&state=' + state); 
                            res.end();
                            return;
                        })
                        .catch(function(error) {
                            console.log("Error creating custom token:", error);
                        });
                });

            });
        }
    };


    // Create a /login link
    // This link will send user's off to Slack to authorize the app
    // See: https://github.com/howdyai/botkit/blob/master/readme-slack.md#custom-auth-flows
    debug('Configured /install url');
    webserver.get('/install', handler.install);

    // Create a /oauth link
    // This is the link that receives the postback from Slack's oauth system
    // So in Slack's config, under oauth redirect urls,
    // your value should be https://<my custom domain or IP>/oauth
    debug('Configured /oauth url');
    webserver.get('/oauth', handler.oauth);



    // Create a /login link
    // This link will send user's off to Slack to authorize the app
    // See: https://github.com/howdyai/botkit/blob/master/readme-slack.md#custom-auth-flows
    debug('Configured /login url');
    webserver.get('/login', handler.login);

    // Create a /oauth link
    // This is the link that receives the postback from Slack's oauth system
    // So in Slack's config, under oauth redirect urls,
    // your value should be https://<my custom domain or IP>/oauth
    debug('Configured /signin url');
    webserver.get('/signin', handler.signin);

    return handler;
}

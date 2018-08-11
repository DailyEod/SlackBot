const uuidv4 = require('uuid/v4');
const { DateTime } = require('luxon');

var debug = require('debug')('botkit:slash_commands');
// var dashbot = require('dashbot')(process.env.DASHBOT_API_KEY).slack;

module.exports = function(controller) {
    // Get the `FieldValue` object
    var Firestore = require('firebase-admin').firestore;
    var FieldValue = Firestore.FieldValue;

    controller.on('slash_command', function(bot, message) {

        // dashbot.logIncoming(bot.identity, bot.team_info, message);

        if (message.channel_name == 'directmessage') {
            bot.replyPrivate(message, "Uh oh! That didn't work. Try that command in a channel.");
            return;
        }

        debug('slash command: ', JSON.stringify(message));
        let utils = require(__dirname + '/utils.js')(controller, bot, message);

        var slash_commands = {
            '/eod': function() {
                bot.replyAcknowledge();
                let user_id = message.user;
                let team_id = message.team_id;

                utils.withUser(user_id, (err, user) => {
                    let zone = user.tz || "America/Los_Angeles",
                        now = DateTime.local().setZone(zone),
                        today = now.startOf('day').toISODate(),
                        timestamp = now.toMillis();
                    debug('now', now);
                    // today = now.startOf('day').toMillis();
                    // today = now.startOf('day').toISODate();

                    if(message.text === '') {
                        utils.showEod(user_id, team_id, today, (err, reply) => {
                            bot.replyPrivateDelayed(message, reply);
                        });
                    } else {
                        controller.storage.eods.ref.where(
                            'timestamp', '==', today
                        ).where(
                            'team_id', '==', message.team_id
                        ).where(
                            'user_id', '==', user_id
                        ).get().then(doc => {
                            let eod, id;
                            if(!doc.empty) {
                                let queryDocumentSnapshot = doc.docs[0];
                                id = queryDocumentSnapshot.id;
                                eod = queryDocumentSnapshot.data();
                                debug('Doc found', id, JSON.stringify(eod));
                            } else {
                                debug('Doc not found');
                                eod = {};
                                eod.user_id = message.user;
                                eod.channel_id = message.channel_id;
                                eod.team_id = message.team_id;
                                eod.timestamp = today;
                                eod.created_at = timestamp;
                                eod.updated_at = timestamp;
                                eod.report = [];
                            }
                            if(!eod.report) {
                                eod.report = [];
                            }
                            let report = message.text.replace('\r', '');
                            eod.report = eod.report.concat(report.split('\n'));
                            eod.updated_at = timestamp;

                            debug('Adding eod', eod);
                            if(!id) {
                                controller.storage.eods.ref.add(eod).then(function(saved) {
                                    bot.replyPrivateDelayed(message, 'Added your EOD: ' + message.text);
                                    // bot.api.reactions.add({
                                    //     name: 'thumbsup',
                                    //     channel: message.channel,
                                    //     timestamp: message.ts
                                    // });
                                }).catch(function(err) {
                                    debug('Error adding task', err);
                                    bot.replyPrivateDelayed(message, 'I experienced an error adding your task: ' + err.messkage);
                                });
                            } else {
                                controller.storage.eods.ref.doc(id).set(eod, { merge: true }).then(function(saved) {
                                    bot.replyPrivateDelayed(message, 'Added your EOD: ' + message.text);
                                    // bot.api.reactions.add({
                                    //     name: 'thumbsup',
                                    //     channel: message.channel,
                                    //     timestamp: message.ts
                                    // });
                                }).catch(function(err) {
                                    debug('Error adding task', err);
                                    bot.replyPrivateDelayed(message, 'I experienced an error adding your task: ' + err.message);
                                });
                            }
                        });
                    }
                });
            },
            'default': function(){}
        };
        (slash_commands[message.command.split('_')[0]]|| slash_commands['default'])();

    });

    // simple function to generate the text of the task list so that
    // it can be used in various places


    // // simple function to generate the text of the task list so that
    // // it can be used in various places
    // function generateTaskList(user) {

    //     var text = '';

    //     for (var t = 0; t < user.tasks.length; t++) {
    //         text = text + '> ' + '•' + ' ' +  user.tasks[t] + '\n';
    //     }

    //     return text;
    // }
};

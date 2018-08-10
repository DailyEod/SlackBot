const uuidv4 = require('uuid/v4');
const { DateTime } = require('luxon');

var debug = require('debug')('botkit:slash_commands');
// var dashbot = require('dashbot')(process.env.DASHBOT_API_KEY).slack;

module.exports = function(controller) {
    // Get the `FieldValue` object
    var FieldValue = require('firebase-admin').firestore.FieldValue;

    controller.on('slash_command', function(bot, message) {
        // dashbot.logIncoming(bot.identity, bot.team_info, message);

        if (message.channel_name == 'directmessage') {
            bot.replyPrivate(message, "Uh oh! That didn't work. Try that command in a channel.");
            return;
        }

        debug('slash command: ', JSON.stringify(message));

        var slash_commands = {
            '/eod': function() {
                bot.replyAcknowledge();

                if(message.text === '') {
                    controller.storage.users.get(message.user, function(err, user) {

                        if (!user) {
                            user = {};
                            user.id = message.user;
                            user.tasks = [];
                        }

                        var text = 'Here are your current tasks: \n' +
                            generateTaskList(user) +
                            '.';

                        bot.replyPrivateDelayed(message, text);

                    });
                } else {
                    let user_id = message.user;
                    let now = DateTime.local(),
                        today = now.startOf('day').toISODate();

                    controller.storage.eods.ref.doc(
                        message.team_id
                    ).where(
                        'user_id', '==', user_id
                    ).where(
                        'timestamp', '>', 
                    ).get().then(eod => {

                        if (!user) {
                            user = {};
                            user.id = message.user;
                            user.tasks = [];
                        }
                        if(!user.tasks) {
                            user.tasks = [];
                        }
                        message.text.replace('\r', '');
                        user.tasks = user.tasks.concat(message.text.split('\n'));

                        controller.storage.users.save(user, function(err, saved) {

                            if (err) {
                                debug('Error adding task', err);
                                bot.replyPrivateDelayed(message, 'I experienced an error adding your task: ' + err.message);
                            } else {
                                bot.replyPrivateDelayed(message, 'Added your EOD: ' + message.text);

                                // bot.api.reactions.add({
                                //     name: 'thumbsup',
                                //     channel: message.channel,
                                //     timestamp: message.ts
                                // });
                            }

                        });
                    });
                }
            },
            'default': function(){}
        };
        (slash_commands[message.command.split('_')[0]]|| slash_commands['default'])();

    });

    // simple function to generate the text of the task list so that
    // it can be used in various places
    function generateTaskList(user) {

        var text = '';

        for (var t = 0; t < user.tasks.length; t++) {
            text = text + '> ' + '•' + ' ' +  user.tasks[t] + '\n';
        }

        return text;

    }

}

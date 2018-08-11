const { DateTime } = require('luxon');

var debug = require('debug')('botkit:interactive_messages');

module.exports = function(controller) {

    // create special handlers for certain actions in buttons
    // if the button action is 'say', act as if user said that thing
    // controller.middleware.receive.use(function(bot, message, next) {

    // });

    controller.on('interactive_message_callback', function(bot, message) {
        // if (message.actions[0].name.match(/^say$/)) {
        //     var reply = message.original_message;

        //     for (var a = 0; a < reply.attachments.length; a++) {
        //         reply.attachments[a].actions = null;
        //     }

        //     var person = '<@' + message.user + '>';
        //     if (message.channel[0] == 'D') {
        //         person = 'You';
        //     }

        //     reply.attachments.push(
        //         {
        //             text: person + ' said, ' + message.actions[0].value,
        //         }
        //     );

        //     bot.replyInteractive(message, reply);
        //  }
        // next();

        let team_id = message.team_id;
        // var channelId = message.channel;
        let channel_id = message.channel_id;
        let action_payload;
        if (message.actions[0].type === 'select') {
            action_payload = JSON.parse(message.actions[0].selected_options[0].value);
        } else {
            action_payload = JSON.parse(message.actions[0].value);
        }

        var imcbs = {
            show_eod: function() {
                debug('interactive_message_callback', 'show_eod', JSON.stringify(message));
                let utils = require(__dirname + '/utils.js')(controller, bot, message);
                let day = DateTime.fromISO(action_payload.date).minus({days: 1}).startOf('day').toISODate();
                utils.showEod(action_payload.user_id, action_payload.team_id, day, (err, reply) => {
                    bot.replyInteractive(message, reply);
                });
            },
            default: function() {
                bot.replyInteractive(message, {
                    text: "Oops, I didn't understand this. Please report this or try again."
                });
            }
        };

        if (imcbs[message.callback_id]) {
            imcbs[message.callback_id]();
        } else {
            // This elaborate method is the handle slack's select source users.
            // Which does not have any custom values
            // slackUsersRef.child(message.callback_id).once('value', (snapshot) => {
            //     logger.debug('Custom callback_id', message.callback_id);
            //     debug(message);
            //     let payload = snapshot.val();
            //     debug('payload', payload);

            //     let action_payload;
            //     if( payload ) {
            //         if (message.actions[0].type === 'select') {
            //             try {
            //                 action_payload = JSON.parse(message.actions[0].selected_options[0].value);
            //                 logger.debug('Users Callback without payload ', action_payload);
            //             } catch (e) {
            //                 logger.debug('Users Callback without payload ', message);
            //                 action_payload = payload;
            //                 action_payload['action'] = 'assign_to_user';
            //                 action_payload['param'] = message.actions[0].selected_options[0].value;
            //             }
            //             message.action_payload = action_payload;
            //             imcbs[payload.callback_id]();
            //         } else if(message.actions[0].type === 'button') {
            //             try {
            //                 action_payload = JSON.parse(message.actions[0].value);
            //                 logger.debug('Users Callback without payload ', action_payload);
            //             } catch (e) {
            //                 logger.debug('Users Callback without payload ', message);
            //                 action_payload = payload;
            //             }
            //             message.action_payload = action_payload;
            //             imcbs[payload.callback_id]();
            //         } else {
            //             imcbs[payload.callback_id]();
            //         }
            //     } else {
            //         (imcbs['default'])();
            //     }
            // });
        }

    });

}

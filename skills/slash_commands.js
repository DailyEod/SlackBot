const uuidv4 = require('uuid/v4');

var debug = require('debug')('botkit:slash_commands');
// var dashbot = require('dashbot')(process.env.DASHBOT_API_KEY).slack;

module.exports = function(controller) {

    controller.on('slash_command', function(bot, message) {
        // dashbot.logIncoming(bot.identity, bot.team_info, message);

        if (message.channel_name == 'directmessage') {
            bot.replyPrivate(message, "Uh oh! That didn't work. Try that command in a channel.");
            return;
        }

        debug('slash command: ', message);

        var slash_commands = {
            '/eod': function() {
                // load user from storage...
                // controller.storage.users.get(message.user, function(err, user) {

                //     // user object can contain arbitary keys. we will store tasks in .tasks
                //     if (!user || !user.tasks || user.tasks.length == 0) {
                //         bot.reply(message, 'There are no tasks on your list. Say `add _task_` to add something.');
                //     } else {

                //         // var text = 'Here are your current tasks: \n' +
                //         //     generateTaskList(user) +
                //         //     'Reply with `done _number_` to mark a task completed.';

                //         // bot.reply(message, text);
                //         // bot.replyPublic(message, "Ok, I am staring a stand up <!here> in the channel.");

                //     }

                // });
                bot.reply(message, 'Thanks');
                return;
            },
            '/pointstory': function() {
                console.log('playing pointing poker');
                // console.log(message);
                let value = {};
                let replyMessage = {
                    "text": `@${message.user_name} wants you to point story '${message.text}'`,
                    "attachments": [
                        {
                            "fallback": "Pre-filled because you have actions in your attachment.",
                            "color": "#bdc3c7",
                            "mrkdwn_in": [
                                "text",
                                "pretext",
                                "fields"
                            ],
                            "callback_id": "select_point_action",
                            "attachment_type": "default",
                            "actions": [
                                {
                                    "name": "1",
                                    "text": "1",
                                    "type": "button",
                                    "style": "default",
                                    "value": "1"
                                },
                                {
                                    "name": "2",
                                    "text": "2",
                                    "type": "button",
                                    "style": "default",
                                    "value": "2"
                                },
                                {
                                    "name": "3",
                                    "text": "3",
                                    "type": "button",
                                    "style": "default",
                                    "value": "3"
                                },
                                {
                                    "name": "5",
                                    "text": "5",
                                    "type": "button",
                                    "style": "default",
                                    "value": "5"
                                },
                                {
                                    "name": "8",
                                    "text": "8",
                                    "type": "button",
                                    "style": "default",
                                    "value": "8"
                                }
                            ]
                        },
                        {
                            "fallback": "Pre-filled because you have actions in your attachment.",
                            "color": "#bdc3c7",
                            "mrkdwn_in": [
                                "text",
                                "pretext",
                                "fields"
                            ],
                            "callback_id": "select_point_action",
                            "attachment_type": "default",
                            "actions": [
                                {
                                    "name": "Select point",
                                    "text": "Select point",
                                    "type": "select",
                                    "value": "Select point",
                                    "data_source": "static",
                                    "options": [
                                        {
                                            "text": "0",
                                            "value": "0"
                                        },
                                        {
                                            "text": "1",
                                            "value": "1"
                                        },
                                        {
                                            "text": "2",
                                            "value": "2"
                                        },
                                        {
                                            "text": "3",
                                            "value": "3"
                                        },
                                        {
                                            "text": "5",
                                            "value": "5"
                                        },
                                        {
                                            "text": "8",
                                            "value": "8"
                                        },
                                        {
                                            "text": "13",
                                            "value": "13"
                                        },
                                        {
                                            "text": "21",
                                            "value": "21"
                                        },
                                        {
                                            "text": "34",
                                            "value": "34"
                                        },
                                        {
                                            "text": "55",
                                            "value": "55"
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            "fallback": "Pre-filled because you have actions in your attachment.",
                            "color": "#bdc3c7",
                            "mrkdwn_in": [
                                "text",
                                "pretext",
                                "fields"
                            ],
                            "callback_id": "select_poker_action",
                            "attachment_type": "default",
                            "actions": [
                                {
                                    "name": "Reveal",
                                    "text": "Reveal",
                                    "type": "button",
                                    "style": "default",
                                    "value": `${JSON.stringify(value)}`
                                },
                                {
                                    "name": "Repoint",
                                    "text": "Repoint",
                                    "type": "button",
                                    "style": "default",
                                    "value": `${JSON.stringify(value)}`
                                },
                                {
                                    "name": "Dismiss",
                                    "text": "Dismiss",
                                    "type": "button",
                                    "style": "default",
                                    "value": "Dismiss"
                                }
                            ]
                        }
                    ],
                    "response_type": "ephemeral",
                    "delete_original": true,
                    "replace_original": true
                };

                replyMessage.channel = message.channel;
                // dashbot.logOutgoing(bot.identity, bot.team_info, replyMessage);
                bot.replyPublic(message, replyMessage);
            },
            'default': function(){}
        };
        (slash_commands[message.command.split('_')[0]]|| slash_commands['default'])();

    });

}

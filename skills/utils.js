const { DateTime } = require('luxon');

var debug = require('debug')('botkit:utils');

module.exports = function(controller, bot, message) {

    let withUser = function (user, cb) {
        controller.storage.users.get(message.user, function(err, user) {
            if (user) {
                cb(null, user);
            } else {
                bot.api.users.info({
                    user: message.user,
                    include_locale:	true
                }, (err, user) => {
                    if(err) {
                        debug('error withUser', err);
                        cb(err);
                    } else {
                        debug('user', user);
                        controller.storage.users.save(user.user, function(err, user) {
                            cb(null, user);
                        });
                    }
                });
            }
        });
    };

    let withAllUsers = function (team_id, cb) {
        controller.storage.users.ref.where(
            'team_id', '==', team_id
        ).get().then(function(snap) {
            const someCollection = {};
            snap.forEach((docSnapshot) => {
                let data = docSnapshot.data();
                data['id'] = docSnapshot.id;
                someCollection[docSnapshot.id] = data;
            });
            cb(null, someCollection);
        }).catch(err => {
            cb(err);
        });
    };

    let showEod = function(user_id, team_id, today, cb) {
        withAllUsers(team_id, (err, allUsers) => {
            controller.storage.eods.ref.where(
                'timestamp', '==', today
            ).where(
                'team_id', '==', team_id
            ).get().then(eodsQS => {
                let eods;
                if(!eodsQS.empty) {
                    eods = eodsQS.docs.map(d => d.data());
                    debug('Doc found', JSON.stringify(eods));
                } else {
                    debug('Doc not found');
                    eods = [];
                }
                let attachments = generateEod(eods, allUsers);
                attachments.push({
                    fallback: 'Pre-filled because you have actions in your attachment.',
                    color: '#d2dde1',
                    mrkdwn_in: [
                        'text',
                        'pretext',
                        'fields'
                    ],
                    callback_id: 'show_eod',
                    attachment_type: 'default',
                    actions: [{
                        name: 'Previous',
                        text: '← Previous',
                        type: 'button',
                        style: 'default',
                        value: JSON.stringify({
                            date: today,
                            user_id: user_id,
                            team_id: team_id
                        })
                    }]
                });
                let reply = {
                    text: `*EOD Report* (_${today}_):`,
                    attachments: attachments
                };
                // bot.replyPrivateDelayed(message, reply);
                cb(null, reply);
            });
        });
    };

    function generateEod(eods, allUser) {

        var text = '';
        let attachments = [];
        for (var i = 0; i < eods.length; i++) {
            let eod = eods[i];
            let user_id = eod.user_id;
            let user = allUser[user_id] || {};
            let profile = user.profile || {};
            let attachment = {
                color: '#d2dde1',
                text: '\n • ' + eod.report.join('\n • '),
                // author_link: 'http://google.com',
                mrkdwn_in: [
                    'text',
                    'pretext',
                    'fields'
                ],
                attachment_type: 'default',
                author_subname: 'EOD',
                author_name: profile.real_name || user.name,
            };
            if(eod.updated_at) {
                attachment.footer = 'Updated';
                attachment.ts = parseInt(eod.updated_at)/1000;
            }
            if(profile) {
                attachment.author_icon = profile.image_192;
            }
            // text = text + `*<@${eods[i].user_id}>*:` + '\n> • ' + eod.report.join('\n> • ') + '\n';
            attachments.push(attachment);
        }

        return attachments;
    }

    return {
        withUser,
        withAllUsers,
        showEod
    };
};

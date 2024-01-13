'use strict';

module.exports = (client, { d: data }) => {
  let msg;
  switch (data.required_action) {
    case undefined:
    case null: {
      msg = 'All required actions have been completed.';
      break;
    }
    case 'AGREEMENTS': {
      msg = 'You need to accept the new Terms of Service and Privacy Policy.';
      // https://discord.com/api/v9/users/@me/agreements
      client.api
        .users('@me')
        .agreements.patch({
          data: {
            terms: true,
            privacy: true,
          },
        })
        .then(() => {
          client.emit(
            'debug',
            '[USER_REQUIRED_ACTION] Successfully accepted the new Terms of Service and Privacy Policy.',
          );
        })
        .catch(e => {
          client.emit(
            'debug',
            `[USER_REQUIRED_ACTION] Failed to accept the new Terms of Service and Privacy Policy: ${e}`,
          );
        });
      break;
    }
    case 'REQUIRE_CAPTCHA': {
      msg = 'You need to complete a captcha.';
      break;
    }
    case 'REQUIRE_VERIFIED_EMAIL': {
      msg = 'You need to verify your email.';
      break;
    }
    case 'REQUIRE_REVERIFIED_EMAIL': {
      msg = 'You need to reverify your email.';
      break;
    }
    case 'REQUIRE_VERIFIED_PHONE': {
      msg = 'You need to verify your phone number.';
      break;
    }
    case 'REQUIRE_REVERIFIED_PHONE': {
      msg = 'You need to reverify your phone number.';
      break;
    }
    case 'REQUIRE_VERIFIED_EMAIL_OR_VERIFIED_PHONE': {
      msg = 'You need to verify your email or verify your phone number.';
      break;
    }
    case 'REQUIRE_REVERIFIED_EMAIL_OR_VERIFIED_PHONE': {
      msg = 'You need to reverify your email or verify your phone number.';
      break;
    }
    case 'REQUIRE_VERIFIED_EMAIL_OR_REVERIFIED_PHONE': {
      msg = 'You need to verify your email or reverify your phone number.';
      break;
    }
    case 'REQUIRE_REVERIFIED_EMAIL_OR_REVERIFIED_PHONE': {
      msg = 'You need to reverify your email or reverify your phone number.';
      break;
    }
    default: {
      msg = `Unknown required action: ${data.required_action}`;
      break;
    }
  }
  client.emit('debug', `[USER_REQUIRED_ACTION] ${msg}`);
};

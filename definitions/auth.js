const ADMIN = { id: 'admin', sa: true, name: 'Admin', permissions: [] };
const BOT = { id: 'bot', sa: true, name: 'Bot', permissions: [] };

AUTH(function($) {
	var path = $.req.split[0];
	if (path === 'admin') {
		var token = $.headers['x-token'];
		if (token) {

			if (BLOCKED($, 10)) {
				$.invalid();
				return;
			}

			if (token === CONF.token) {
				BLOCKED($, -1);
				$.success(BOT);
			}

		} else if (CONF.op_reqtoken && CONF.op_restoken)
			OpenPlatform.auth($);
		else if (FUNC.authadmin)
			FUNC.authadmin($);
		else
			$.success(ADMIN);

	} else {
		if (FUNC.auth)
			FUNC.auth($);
		else
			$.invalid();
	}
});
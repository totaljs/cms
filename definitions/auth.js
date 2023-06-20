var BLACKLIST = {};

AUTH(function($) {

	if (CONF.op_reqtoken && CONF.op_restoken) {
		OpenPlatform.auth($);
		return;
	}

	var token = $.cookie(CONF.cookie);
	if (token) {
		var session = DECRYPTREQ($.req, token, CONF.cookie_secret);
		if (session && session.id === PREF.user.id && session.expire > NOW) {
			$.success({ sa: true });
			return;
		} else
			BLACKLIST[$.ip] = (BLACKLIST[$.ip] || 0) + 1;
	}

	$.invalid();
});

ON('service', function(counter) {
	if (counter % 15 === 0)
		BLACKLIST = {};
});
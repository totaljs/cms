if (window.DEF)
	window.DEF.fallback = '/cdn/j-{0}.html';

// Online statistics for visitors
(function() {

	var W = window;
	var N = navigator;
	var LS = W.localStorage;

	if ((N.onLine != null && !N.onLine) || !LS)
		return;

	var key = 'cmsvisitor';
	var options = {};
	var ticks = LS.getItem('cmsvisitor') || '';

	options.method = 'GET';
	options.headers = { 'x-ping': location.pathname, 'x-referrer': document.referrer, 'content-type': 'application/json' };

	var url = '/$visitors/';

	try {
		var key2 = key + 'test';
		localStorage.setItem(key2, '1');
		var is = LS.getItem(key2) === '1';
		LS.removeItem(key2);
		if (!is)
			return;

	} catch (e) {
		// disabled localStorage (skip user)
		return;
	}

	var callback = function(r) {

		r.text().then(function(data) {
			ticks = data;
			ticks && LS.setItem(key, ticks);
		});

		if (W.$visitorscounter)
			W.$visitorscounter++;
		else
			W.$visitorscounter = 1;

		// 3 minutes
		if (W.$visitorscounter === 6)
			clearInterval(W.$visitorsinterval);

	};

	var callback_error = () => clearInterval(W.$visitorsinterval);

	var params = '?id=' + ticks;
	var arr = location.search.split('&');
	var query = {};
	var un;

	for (var m of arr) {
		var tmp = m.split('=');
		query[tmp[0]] = decodeURIComponent(tmp[1]);
	}

	if (query.utm_medium || query.utm_source || query.campaign_id)
		params += '&utm_medium=1';

	if (W.user) {
		if (W.user.name)
			un = W.user.name + '';
		else if (W.user.nick)
			un = W.user.nick + '';
	} else if (W.username)
		un = W.username + '';
	else if (query.utm_user)
		un = query.utm_user;

	if (un)
		params += '&utm_user=' + encodeURIComponent(un);

	W.$visitorsinterval = setInterval(function() {
		if (document.hasFocus()) {
			options.headers['x-ping'] = location.pathname;
			options.headers['x-reading'] = '1';
			fetch(url + '?id=' + ticks + (un ? ('&utm_user=' + encodeURIComponent(un)) : ''), options).then(callback).catch(callback_error);
		}
	}, 30000);

	fetch('/$visitors/', options).then(callback).catch(callback_error);

})();
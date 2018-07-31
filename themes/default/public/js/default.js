UPTODATE('1 day');

var common = {};

$(document).ready(function() {
	$('.emailencode').each(function() {
		var el = $(this);
		el.html('<a href="mailto:{0}">{0}</a>'.format(el.html().replace(/\(at\)/g, '@').replace(/\(dot\)/g, '.')));
	});
});

$(document).on('click', '#mainmenubutton', function() {
	$('body').tclass('mainmenuvisible');
	$(this).tclass('mainmenubutton-visible');
});

// Link tracking
$(document).on('mousedown touchstart', 'a[data-cms-track]', function(e) {
	var target;
	if (e.target.nodeName !== 'A')
		target = $(e.target).closest('a');
	else
		target = $(e.target);
	var id = target.attrd('cms-track');
	id && AJAX('GET /api/track/{0}/'.format(id), NOOP);
});

// Online statistics for visitors
(function() {

	if (navigator.onLine != null && !navigator.onLine)
		return;

	var options = {};
	options.type = 'GET';
	options.headers = { 'x-ping': location.pathname, 'x-cookies': navigator.cookieEnabled ? '1' : '0', 'x-referrer': document.referrer };

	options.success = function(r) {
		if (r) {
			try {
				(new Function(r))();
			} catch (e) {}
		}
	};

	options.error = function() {
		setTimeout(function() {
			location.reload(true);
		}, 2000);
	};

	if (window.$visitorscounter)
		window.$visitorscounter++;
	else
		window.$visitorscounter = 1;

	// 5 minutes
	if (window.$visitorscounter === 10) {
		// It waits 1 hour and then reloads the site
		setTimeout(function() {
			location.reload(true);
		}, (1000 * 60) * 60);
		clearInterval(window.$visitorsinterval);
		return;
	} else if (!document.hasFocus())
		return;

	var url = '/$visitors/';
	var param = READPARAMS();

	$.ajax(url + (param.utm_medium || param.utm_source || param.campaign_id ? '?utm_medium=1' : ''), options);

	window.$visitorsinterval = setInterval(function() {
		options.headers['x-reading'] = '1';
		$.ajax(url, options);
	}, 30000);

})();
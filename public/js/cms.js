// Link tracking
$(document).on('mousedown touchstart', 'a[data-cms-track]', function(e) {
	var target = $(e.target);
	if (e.target.nodeName !== 'A')
		target = target.closest('a');
	var id = target.attrd('cms-track');
	id && AJAX('GET /api/track/' + id, NOOP);
});

$(document).on('click', '#mobilemenu', function() {
	$('body').tclass('mobilemenu-visible');
});

// Online statistics for visitors
(function() {

	if (W.top !== W || (navigator.onLine != null && !navigator.onLine && W.top))
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

	if (W.$visitorscounter)
		W.$visitorscounter++;
	else
		W.$visitorscounter = 1;

	// 5 minutes
	if (W.$visitorscounter === 10) {
		// It waits 1 hour and then reloads the site
		setTimeout(function() {
			location.reload(true);
		}, (1000 * 60) * 60);
		clearInterval(W.$visitorsinterval);
		return;
	} else if (!document.hasFocus())
		return;

	var url = '/$visitors/';

	$.ajax(url + (NAV.query.utm_medium || NAV.query.utm_source || NAV.query.campaign_id ? '?utm_medium=1' : ''), options);

	W.$visitorsinterval = setInterval(function() {
		options.headers['x-reading'] = '1';
		$.ajax(url, options);
	}, 30000);

})();

COMPONENT('exec', function(self, config) {
	self.readonly();
	self.blind();
	self.make = function() {

		var scope = null;

		var scopepath = function(el, val) {
			if (!scope)
				scope = el.scope();
			return scope ? scope.makepath ? scope.makepath(val) : val.replace(/\?/g, el.scope().path) : val;
		};

		var fn = function(plus) {
			return function(e) {

				var el = $(this);
				var attr = el.attrd('exec' + plus);
				var path = el.attrd('path' + plus);
				var href = el.attrd('href' + plus);
				var def = el.attrd('def' + plus);
				var reset = el.attrd('reset' + plus);

				scope = null;

				var prevent = el.attrd('prevent' + plus);

				if (prevent === 'true' || prevent === '1') {
					e.preventDefault();
					e.stopPropagation();
				}

				if (attr) {
					if (attr.indexOf('?') !== -1)
						attr = scopepath(el, attr);
					EXEC(attr, el, e);
				}

				href && NAV.redirect(href);

				if (def) {
					if (def.indexOf('?') !== -1)
						def = scopepath(el, def);
					DEFAULT(def);
				}

				if (reset) {
					if (reset.indexOf('?') !== -1)
						reset = scopepath(el, reset);
					RESET(reset);
				}

				if (path) {
					var val = el.attrd('value');
					if (val) {
						if (path.indexOf('?') !== -1)
							path = scopepath(el, path);
						var v = GET(path);
						SET(path, new Function('value', 'return ' + val)(v), true);
					}
				}
			};
		};

		self.event('dblclick', config.selector2 || '.exec2', fn('2'));
		self.event('click', config.selector || '.exec', fn(''));
	};
});
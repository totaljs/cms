// MIT License
// Copyright 2017-2023 (c) Peter Širka <petersirka@gmail.com>

const CONCAT = [];
const DBNAME = 'visitors';
const REG_ROBOT = /search|agent|bot|crawler/i;
const TIMEOUT_VISITORS = 1200; // 20 MINUTES
const Fs = require('fs');
const REGIP = /\d+\.\d+\.\d+|localhost/i;

var FILE_CACHE = 'visitors.cache';
var W = {};
var VISITOR;

W.stats = { pages: 0, day: 0, month: 0, year: 0, hits: 0, unique: 0, uniquemonth: 0, count: 0, search: 0, direct: 0, social: 0, unknown: 0, advert: 0, mobile: 0, desktop: 0, visitors: 0, robots: 0, hours: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] };
W.online = 0;
W.arr = [0, 0];
W.interval = 0;
W.index = 0;
W.current = Date.now();
W.last = 0;
W.lastvisit = null;
W.social = ['plus.url.google', 'plus.google', 'twitter', 'facebook', 'linkedin', 'tumblr', 'flickr', 'instagram', 'vkontakte', 'snapchat', 'skype', 'whatsapp', 'wechat'];
W.search = ['google', 'bing', 'yahoo', 'duckduckgo', 'yandex', 'seznam'];
W.visitors = [];
W.cache = {};
W.cache.browsers = {};
W.cache.referers = {};

W.$blacklist = null;
W.$blacklistlength = 0;

W.blacklist = function(path) {
	!W.$blacklist && (W.$blacklist = []);
	W.$blacklist.push(path);
	W.$blacklistlength = W.$blacklist.length;
	return W;
};

W.clean = function() {

	W.index++;

	if (W.index % 2 === 0) {
		W.save();
		W.hostname = getHostname(CONF.url);
	}

	NOW = new Date();
	W.current = NOW.getTime();

	var stats = W.stats;
	var day = NOW.getDate();
	var month = NOW.getMonth() + 1;
	var year = NOW.getFullYear();

	if (stats.day !== day || stats.month !== month || stats.year !== year) {
		if (stats.day || stats.month || stats.year) {
			W.append();
			var visitors = stats.visitors;
			var keys = Object.keys(stats);
			for (var i = 0, length = keys.length; i < length; i++) {
				if (keys[i] === 'hours') {
					for (var j = 0; j < stats.hours.length; j++)
						stats.hours[j] = 0;
				} else
					stats[keys[i]] = 0;
			}
			stats.visitors = visitors;
		}
		stats.day = day;
		stats.month = month;
		stats.year = year;
		W.index = 0;
		W.save();
	}

	var arr = W.arr;
	var tmp1 = arr[1];
	var tmp0 = arr[0];

	arr[1] = 0;
	arr[0] = tmp1;

	if (tmp0 !== arr[0] || tmp1 !== arr[1]) {
		let online = arr[0];
		if (online != W.last)
			W.last = online;
	}

	if (W.index % 5 === 0) {

		var date = +NOW.format('yyyyMM');
		var year = NOW.getFullYear();
		var month = NOW.getMonth() + 1;

		for (let key in W.cache.browsers) {
			let id = date + key.makeid();
			DATA.modify('nosql/browsers', { id: id, name: key, '+count': W.cache.browsers[key], date: date, year: year, month: month }, true).id(id);
		}

		W.cache.browsers = {};

		for (let key in W.cache.referers) {
			let id = date + key.makeid();
			DATA.modify('nosql/referers', { id: id, name: key, '+count': W.cache.referers[key], date: date, year: year, month: month }, true).id(id);
		}

		W.cache.referers = {};
	}

};

W.increment = W.inc = function(type) {
	if (W.stats[type])
		W.stats[type]++;
	else
		W.stats[type] = 1;
	return W;
};

W.checksum = function(value) {
	return value + ((value + CONF.secret).hash(true) + '').substring(0, 5);
};

W.counter = function($) {

	var h = $.headers;
	var agent = h['user-agent'];

	if (!agent)
		return false;

	// Custom header defined on client-side:
	var url = h['x-ping'];
	if (!url)
		return '';

	if (!agent || (W.$blacklist && isBlacklist(url)))
		return '';

	if (REG_ROBOT.test(agent)) {
		W.stats.robots++;
		return '';
	}

	if (!h.accept || !h['accept-language'])
		return '';

	NOW = new Date();

	var meta = ($.query.id || '');

	var metats = meta.substring(0, meta.length - 10);
	var metaid = meta.substring(meta.length - 10, meta.length - 5);

	// Not valid checksum
	if (meta !== W.checksum(metats + metaid)) {
		metats = '';
		metaid = '';
	}

	$.visitorid = metaid || Math.random().toString(16).substring(2, 7);
	var user = metats ? parseInt(metats, 16) : 0;
	var ticks = NOW.getTime();
	var sum = user ? (ticks - user) / 1000 : 1000;

	if (!(user > 0))
		user = 0;

	// More than 30 days
	// Reset
	if (sum > 2419200) {
		sum = 1000;
		user = 0;
	}

	var exists = sum < 91;

	$.visited = user;

	if (user)
		sum = Math.abs(W.current - user) / 1000;

	var isHits = user ? sum >= TIMEOUT_VISITORS : true;
	if (isHits)
		W.stats.hits++;

	VISITOR = {};
	VISITOR.id = $.visitorid;
	VISITOR.unique = false;
	VISITOR.ping = h['x-reading'] === '1';
	VISITOR.browser = $.ua;

	if (exists) {
		W.emitvisitor('browse', $);
		return meta;
	}

	if (user) {

		// 20 minutes
		if (sum < TIMEOUT_VISITORS) {
			W.arr[1]++;
			W.lastvisit = NOW;
			W.emitvisitor('visitor', $);
			return W.checksum(ticks.toString(16) + $.visitorid);
		}

		var date = new Date(user);
		if (date.getDate() !== NOW.getDate() || date.getMonth() !== NOW.getMonth() || date.getFullYear() !== NOW.getFullYear())
			VISITOR.unique = true;

		date.diff('months') < 0 && (W.stats.uniquemonth++);

	} else {
		VISITOR.unique = true;
		W.stats.uniquemonth++;
	}

	if (VISITOR.unique) {
		W.stats.unique++;
		if ($.mobile)
			W.stats.mobile++;
		else
			W.stats.desktop++;
	}

	W.arr[1]++;
	W.lastvisit = NOW;

	var online = W.arr[0] + W.arr[1];
	var hours = NOW.getHours();

	if (W.stats.hours[hours] < online)
		W.stats.hours[hours] = online;

	if (W.last !== online)
		W.last = online;

	W.stats.count++;
	W.stats.visitors++;

	if ($.query.utm_medium || $.query.utm_source) {
		W.stats.advert++;
		W.emitvisitor('advert', $);
		return W.checksum(ticks.toString(16) + $.visitorid);
	}

	VISITOR.referer = getHostname(h['x-referrer'] || h['x-referer'] || h.referer);

	if (!VISITOR.referer || (W.hostname && VISITOR.referer.indexOf(W.hostname) !== -1)) {
		W.stats.direct++;
		W.emitvisitor('direct', $);
		if (VISITOR.unique && VISITOR.browser) {
			if (W.cache.browsers[VISITOR.browser])
				W.cache.browsers[VISITOR.browser]++;
			else
				W.cache.browsers[VISITOR.browser] = 1;
		}
		return W.checksum(ticks.toString(16) + $.visitorid);
	}

	if (VISITOR.referer && VISITOR.unique) {
		if (W.cache.referers[VISITOR.referer])
			W.cache.referers[VISITOR.referer]++;
		else
			W.cache.referers[VISITOR.referer] = 1;

		if (W.cache.browsers[VISITOR.browser])
			W.cache.browsers[VISITOR.browser]++;
		else
			W.cache.browsers[VISITOR.browser] = 1;
	}

	for (var i = 0, length = W.social.length; i < length; i++) {
		if (VISITOR.referer.indexOf(W.social[i]) !== -1) {
			W.stats.social++;
			W.emitvisitor('social', $);
			return W.checksum(ticks.toString(16) + $.visitorid);
		}
	}

	for (var i = 0, length = W.search.length; i < length; i++) {
		if (VISITOR.referer.indexOf(W.search[i]) !== -1) {
			W.stats.search++;
			W.emitvisitor('search', $);
			return W.checksum(ticks.toString(16) + $.visitorid);
		}
	}

	W.stats.unknown++;
	W.emitvisitor('unknown', $);
	return W.checksum(ticks.toString(16) + $.visitorid);
};

W.emitvisitor = function(type, $) {

	VISITOR.url = $.headers['x-ping'] || $.url;
	VISITOR.ip = $.ip;
	VISITOR.type = type;
	VISITOR.online = W.arr[0] + W.arr[1];
	VISITOR.mobile = $.mobile;
	VISITOR.user = $.user ? ($.user.name || $.user.nick || $.user.alias) : $.query.utm_user;
	VISITOR.dtcreated = NOW = new Date();
	PUBLISH('visitor', VISITOR);

	W.visitors.unshift(VISITOR);

	if (W.visitors.length > 20)
		W.visitors.pop();

	F.$events.visitor && EMIT('visitor', VISITOR);
};

W.save = function() {
	var filename = PATH.databases(FILE_CACHE);
	var stats = U.copy(W.stats);
	stats.pages = stats.hits && stats.count ? (stats.hits / stats.count).floor(2) : 0;
	Fs.writeFile(filename, JSON.stringify(stats), NOOP);
};

W.load = function() {

	if (F.isCluster && F.id)
		FILE_CACHE = FILE_CACHE.replace('.', F.id + '.');

	var filename = PATH.databases(FILE_CACHE);

	Fs.readFile(filename, function(err, data) {

		if (err)
			return;

		U.copy(data.toString('utf8').parseJSON(true), W.stats);

		Object.keys(W.stats).forEach(function(key) {
			if (key !== 'hours' && W.stats[key] == null)
				W.stats[key] = 0;
		});

		if (!W.stats.hours || W.stats.hours.length !== 24) {
			W.stats.hours = [];
			for (var i = 0; i < 24; i++)
				W.stats.hours.push(0);
		}
	});
};

W.append = function() {
	var stats = CLONE(W.stats);
	var keys = Object.keys(stats);
	var data = {};

	for (var i = 0; i < keys.length; i++) {
		var key = keys[i];
		if (key !== 'year' && key !== 'month' && key !== 'day' && key !== 'hours')
			data['+' + key] = stats[key] || 0;
		else
			data[key] = stats[key];
	}

	if (!Object.keys(stats).length)
		console.log('ERROR VISITORS --->', data, stats);

	DB().modify('nosql/' + DBNAME, data, true).where('year', stats.year).where('month', stats.month).where('day', stats.day);
};

W.daily = function(callback) {
	W.statistics(function(arr) {

		if (!arr.length)
			return callback(EMPTYARRAY);

		var output = [];
		var value;

		for (var m of arr) {
			if (m) {
				value = m.parseJSON(true);
				value && output.push(value);
			}
		}

		callback(output);
	});
	return W;
};

W.monthly = function(callback) {
	W.statistics(function(arr) {

		if (!arr.length)
			return callback({});

		var stats = {};

		for (var m of arr) {

			if (!m)
				continue;

			var value = m.parseJSON(true);
			if (!value)
				continue;

			var key = value.month + '-' + value.year;

			if (stats[key])
				sum(stats[key], value);
			else
				stats[key] = value;
		}

		callback(stats);
	});
	return W;
};

W.yearly = function(callback) {
	W.statistics(function(arr) {

		if (!arr.length)
			return callback(EMPTYOBJECT);

		var stats = {};

		for (var m of arr) {

			if (!m)
				continue;

			var value = m.parseJSON(true);
			if (!value)
				continue;

			var key = value.year.toString();

			if (stats[key])
				sum(stats[key], value);
			else
				stats[key] = value;
		}

		callback(stats);
	});
	return W;
};

W.statistics = function(callback) {
	var filename = PATH.databases(DBNAME + '.nosql');
	var stream = Fs.createReadStream(filename);
	var data = Buffer.alloc(0);
	stream.on('error', () => callback(EMPTYARRAY));
	stream.on('data', function(chunk) {
		CONCAT[0] = data;
		CONCAT[1] = chunk;
		data = Buffer.concat(CONCAT);
	});
	stream.on('end', () => callback(data.toString('utf8').split('\n')));
	return W;
};

function sum(a, b) {

	var keys = Object.keys(b);

	for (var i = 0; i < keys.length; i++) {
		var o = keys[i];

		if (o === 'day' || o === 'year' || o === 'month')
			continue;

		if (o === 'hours') {
			a[o] = undefined;
			continue;
		}

		if (o === 'visitors') {
			a[o] = Math.max(a[o] || 0, b[o] || 0);
			continue;
		}

		if (a[o] === undefined)
			a[o] = 0;
		if (b[o] !== undefined)
			a[o] += b[o];
	}
}

function getHostname(host) {
	if (!host)
		return null;
	var beg = host.indexOf('/') + 2;
	var end = host.indexOf('/', beg);
	if (end === -1)
		end = host.length;
	return REGIP.test(host) ? null : host.substring(beg, end).toLowerCase();
}

exports.version = 'v1.1.0';
exports.instance = W;

exports.install = function() {
	setTimeout(refresh_hostname, 10000);
	ON('service', counter => counter % 120 === 0 && refresh_hostname());
	ROUTE('GET /$visitors/', function($) {
		var r = W.counter($);
		if (r)
			$.text(r);
		else
			$.empty();
	});
};

function isBlacklist(url) {
	for (var i = 0; i < W.$blacklistlength; i++) {
		if (url.indexOf(W.$blacklist[i]) !== -1)
			return true;
	}
}

function refresh_hostname() {
	var url = CONF.url || CONF.hostname;
	W.hostname = getHostname(url);
}

exports.usage = function() {
	var stats = CLONE(W.stats);
	stats.online = W.arr[0] + W.arr[1];
	return stats;
};

exports.online = function() {
	return W.arr[0] + W.arr[1];
};

exports.today = function() {
	var stats = CLONE(W.stats);
	stats.last = W.lastvisit;
	stats.online = W.arr[0] + W.arr[1];
	stats.pages = stats.hits && stats.count ? (stats.hits / stats.count).floor(2) : 0;
	return stats;
};

exports.blacklist = function(path) {
	return W.blacklist(path);
};

exports.increment = exports.inc = function(type) {
	return W.increment(type);
};

exports.monthly = function(callback) {
	return W.monthly(callback);
};

exports.yearly = function(callback) {
	return W.yearly(callback);
};

exports.daily = function(callback) {
	return W.daily(callback);
};

// every 45 seconds
W.interval = setInterval(W.clean, 45000);
W.load();

ON('ready', function() {
	W.hostname = getHostname(CONF.url);
});
var common = {};

SETTER(true, 'avatar', 'register', 'widget', 'size:80');

ON('ready', function() {
	refresh_height();
	refresh_dependencies();
	setTimeout(refresh_height, 100);
});

function refresh_dependencies() {
	AJAX('GET [url]api/dependencies/', 'common.dependencies');
}

function refresh_height() {
	var h = $(window).height();
	var el = $('.fullheight');

	setTimeout2('resize', function() {

		el.length && el.each(function() {
			var el = $(this);
			var t = el.offset().top;
			t && el.css('height', h - (t + 20 + (+(el.attrd('margin') || ''))));
		});

		EMIT('resize');
		SETTER('grid', 'resize');
	}, 50);
}

function refresh_filebrowser(target, type, clear) {

	var item = filebrowser;
	item.target = target;
	item.id = '';
	item.filename = null;
	item.type = type;

	if (clear === true)
		item.clear = clear;

	AJAXCACHE('GET [url]api/files/', function(response, is) {

		item.clear = false;

		if (!is) {
			response.quicksort('ctime', false);
			for (var i = 0, length = response.length; i < length; i++) {
				var file = response[i];
				file.id = file.id + file.name.substring(file.name.lastIndexOf('.'));
			}
		}

		SET('filebrowser.files', response);
		SET('common.form3', 'filebrowser');
	}, 'session', item.clear);
}

$(window).on('resize', refresh_height);

// Tangular helpers
Thelpers.join = function(value, delimiter) {
	return value instanceof Array ? value.join(delimiter || ', ') : '';
};

Thelpers.filesize = function(value, decimals, type) {
	return value ? value.filesize(decimals, type) : '...';
};

Number.prototype.filesize = function(decimals, type) {

	if (typeof(decimals) === 'string') {
		var tmp = type;
		type = decimals;
		decimals = tmp;
	}

	var value;

	// this === bytes
	switch (type) {
		case 'bytes':
			value = this;
			break;
		case 'KB':
			value = this / 1024;
			break;
		case 'MB':
			value = filesizehelper(this, 2);
			break;
		case 'GB':
			value = filesizehelper(this, 3);
			break;
		case 'TB':
			value = filesizehelper(this, 4);
			break;
		default:

			type = 'bytes';
			value = this;

			if (value > 1023) {
				value = value / 1024;
				type = 'KB';
			}

			if (value > 1023) {
				value = value / 1024;
				type = 'MB';
			}

			if (value > 1023) {
				value = value / 1024;
				type = 'GB';
			}

			if (value > 1023) {
				value = value / 1024;
				type = 'TB';
			}

			break;
	}

	type = ' ' + type;
	return (decimals === undefined ? value.format(2).replace('.00', '') : value.format(decimals)) + type;
};

function filesizehelper(number, count) {
	while (count--) {
		number = number / 1024;
		if (number.toFixed(3) === '0.000')
			return 0;
	}
	return number;
}

Thelpers.counter = function(value) {
	if (value > 999999)
		return (value / 1000000).format(2) + ' M';
	if (value > 9999)
		return (value / 10000).format(2) + ' K';
	return value.format(0);
};

Thelpers.default = function(value, def) {
	return value == null || value === '' ? def : value;
};

Thelpers.language = function(value) {
	if (!value)
		return '';
	var colors = ['#1abc9c','#2ecc71','#3498db','#9b59b6','#34495e','#16a085','#2980b9','#8e44ad','#2c3e50','#f1c40f','#e67e22','#e74c3c','#d35400','#c0392b'];
	var num = 0;
	for (var i = 0; i < value.length; i++)
		num += value.charCodeAt(i);
	return '<span class="badge badge-small mr5" style="background-color:{0}">{1}</span>'.format(colors[num % colors.length], value);
};
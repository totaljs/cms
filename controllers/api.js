exports.install = function() {

	// Enable CORS for API
	CORS();

	// Operations
	ROUTE('POST /api/subscribers/',              ['*Subscriber --> @save']);
	ROUTE('POST /api/contact/',                  ['*Contact --> @save']);
	ROUTE('GET  /api/track/{id}/',               ['*Tracking --> @exec']);
	ROUTE('GET  /api/unsubscribe/', unsubscribe, ['*Subscriber']);

	// Newsletter view
	FILE('/newsletter.gif', file_newsletterviewstats);
	FILE('/sitemap.xml', file_sitemap);
};

function file_newsletterviewstats(req, res) {
	NOSQL('newsletters').counter.hit('all');
	req.query.id && NOSQL('newsletters').counter.hit(req.query.id);
	res.binary('R0lGODdhAQABAIAAAAAAAAAAACH5BAEAAAEALAAAAAABAAEAAAICTAEAOw==', 'image/gif', 'base64');
}

function unsubscribe() {
	var self = this;
	self.$workflow('unsubscribe', () => self.plain(TRANSLATOR(self.language, '@(You have been successfully unsubscribed.\nThank you)')));
}

function file_sitemap(req, res) {

	var arr = F.global.pages;
	var builder = ['<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'];
	var lng = F.onLocale ? F.onLocale(req, res) : null;

	for (var i = 0; i < arr.length; i++) {
		var item = arr[i];
		if (!lng || item.language === lng)
			builder.push('<url><loc>{0}</loc><lastmod>{1}</lastmod></url>'.format(F.config.url + item.url, (item.dateupdated ? item.dateupdated : item.datecreated).format('yyyy-MM-dd')));
	}

	OPERATION('sitemap.xml', builder, function() {
		builder.push('</urlset>');
		res.content(200, builder.join(''), 'text/xml');
	});
}
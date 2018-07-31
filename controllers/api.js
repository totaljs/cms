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
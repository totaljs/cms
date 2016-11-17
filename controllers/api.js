// API for e.g. Mobile application
// This API uses the website

exports.install = function() {
	// COMMON
	F.route('/api/ping/',        json_ping);

	// NEWSLETTER
	F.route('/api/newsletter/',  json_save, ['post', '*Newsletter']);

	// CONTACTFORM
	F.route('/api/contact/',     json_save, ['post', '*Contact']);
};

// ==========================================================================
// COMMON
// ==========================================================================

function json_ping() {
	var self = this;
	self.plain('null');
}

// ==========================================================================
// NEWSLETTER & CONTACT
// ==========================================================================

// Appends a new email into the newsletter list
function json_save() {
	var self = this;
	self.body.language = self.language || '';
	self.body.ip = self.ip;
	self.body.$save(self.callback());
}
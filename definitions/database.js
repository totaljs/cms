// This file creates a simple helper for storing content from Pages, Posts and Newsletters
// Reduces size of main DB for listing (for Pages, Posts, Newsletters) and increases the performance

// DECLARATION
CONF.table_pagesdata = 'id:string|body:string|dtcreated:date';
CONF.table_partsdata = 'id:string|body:string|dtcreated:date';
CONF.table_postsdata = 'id:string|body:string|dtcreated:date';
CONF.table_newslettersdata = 'id:string|body:string|dtcreated:date';

TABLE('pagesdata').memory(1);
// TABLE('partsdata').memory(1);
// TABLE('postsdata').memory(1);
// TABLE('newslettersdata').memory(1);

// Pages, Posts, Parts and Newsletter us .write() and .read() functions
FUNC.write = function(type, id, content, callback, exists) {

	if (typeof(callback) === 'boolean') {
		exists = callback;
		callback = null;
	}

	var db = TABLE(type + 'data');
	if (exists) {
		db.modify({ body: content }, true).where('id', id).insert(function(doc) {
			doc.id = id;
			doc.dtcreated = NOW;
		}).callback(callback);
	} else
		db.insert({ id: id, body: content, dtcreated: NOW }).callback(callback);
};

FUNC.read = function(type, id, callback) {
	TABLE(type + 'data').read().where('id', id).fields('body').callback(function(err, doc) {
		callback(null, doc ? doc.body : '');
	});
};

FUNC.remove = function(type, id) {
	// if id == null there is need to clear all content
	var builder = TABLE(type + 'data').remove();
	id && builder.search('id', id);
};
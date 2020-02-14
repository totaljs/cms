// This file creates a simple helper for storing content from Pages, Posts and Newsletters
// Reduces size of main DB for listing (for Pages, Posts, Newsletters) and increases the performance

// DECLARATION
CONF['table.pagesdata'] = 'id:string|body:string|datecreated:date';
CONF['table.partsdata'] = 'id:string|body:string|datecreated:date';
CONF['table.postsdata'] = 'id:string|body:string|datecreated:date';
CONF['table.newslettersdata'] = 'id:string|body:string|datecreated:date';

TABLE('pagesdata').memory(1);
TABLE('partsdata').memory(1);
TABLE('postsdata').memory(1);
TABLE('newslettersdata').memory(1);

// Pages, Posts, Parts and Newsletter us .write() and .read() functions
FUNC.write = function(type, id, content, callback, exists) {

	if (typeof(callback) === 'boolean') {
		exists = callback;
		callback = null;
	}

	var db = TABLE(type + 'data');
	if (exists) {
		db.modify({ body: content }, true).repository('id', id).where('id', id).insert(function(doc, repository) {
			doc.id = repository.id;
			doc.datecreated = NOW;
		}).callback(callback);
	} else
		db.insert({ id: id, body: content, datecreated: NOW }).callback(callback);
};

FUNC.read = function(type, id, callback) {
	TABLE(type + 'data').one2().first().where('id', id).fields('body').callback(function(err, doc) {
		callback(null, doc ? doc.body : '');
	});
};

FUNC.remove = function(type, id) {
	// if id == null there is need to clear all content
	var builder = TABLE(type + 'data').remove();
	id && builder.like('id', id);
};
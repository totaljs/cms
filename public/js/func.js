FUNC.code = function(opt, callback) {
	SET('common.form2', 'formcode');
	EXEC(true, 'formcode/init', opt, callback);
};

FUNC.sitemap = function(items, skip) {

	var arr = [];

	for (var i = 0; i < items.length; i++) {
		var item = items[i];
		var builder = [item.name];
		var tmp = item;
		while (true) {
			if (tmp.parentid) {
				var parent = items.findItem('id', tmp.parentid);
				if (parent) {
					builder.push(parent.name);
					tmp = parent;
				} else
					break;
			} else
				break;
		}

		builder.reverse();

		if (skip && builder.length > 1)
			builder.splice(0, skip);

		arr.push({ id: item.id, parentid: item.parentid, url: item.url, name: builder.join(' / ') });
	}

	arr.quicksort('name');
	return arr;
};

(function() {

	var cache = {};

	FUNC.diff = function(id, items, pk) {

		if (items == null) {
			delete cache[id];
			return;
		}

		if (!pk)
			pk = 'id';

		var meta = cache[id];

		if (meta) {

			for (var item of items) {
				delete item.newbie;
				delete item.changed;
				var checksum = HASH(item);
				var uid = item[pk];
				var is = meta.checksum.indexOf(checksum) === -1;
				if (uid && meta.changes.indexOf(uid) !== -1) {
					item.modified = is;
				} else {
					item.newbie = is;
					meta.changes.push(uid);
				}
				meta.checksum.push(checksum);
			}

		} else {
			cache[id] = { checksum: [], changes: [] };
			for (var item of items) {
				var uid = item[pk];
				var checksum = HASH(item);
				cache[id].checksum.push(checksum);
				uid && cache[id].changes.push(uid);
			}
		}

		return items;
	};

})();
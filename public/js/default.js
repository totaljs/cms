Thelpers.color2 = function(val) {
	return Thelpers.color(HASH(val + val).toString(36));
};

Thelpers.colorize = function(value) {
	if (!value)
		return '';
	var colors = ['#1abc9c','#2ecc71','#3498db','#9b59b6','#34495e','#16a085','#2980b9','#8e44ad','#2c3e50','#f1c40f','#e67e22','#e74c3c','#d35400','#c0392b'];
	var num = 0;
	for (var i = 0; i < value.length; i++)
		num += value.charCodeAt(i);
	return '<span class="badge badge-small mr5" style="background-color:{0}">{1}</span>'.format(colors[num % colors.length], value);
};

function onImageError(img) {
	img.onerror = null;
	img.src = img.getAttribute('data-empty');
	return true;
}
COMPONENT('enter', 'validate:true', function(self, config) {
	self.readonly();
	self.make = function() {
		self.event('keydown', 'input', function(e) {
			if (e.which === 13 && (!config.validate || CAN(self.path))) {
				if (config.trigger)
					self.find(config.trigger).trigger('click');
				else
					EXEC(config.exec, self);
			}
		});
	};
});

COMPONENT('exec', function(self, config) {
	self.readonly();
	self.blind();
	self.make = function() {
		self.event('click', config.selector || '.exec', function(e) {
			var el = $(this);

			var attr = el.attrd('exec');
			var path = el.attrd('path');
			var href = el.attrd('href');

			if (el.attrd('prevent') === 'true') {
				e.preventDefault();
				e.stopPropagation();
			}

			attr && EXEC(attr, el, e);
			href && NAV.redirect(href);

			if (path) {
				var val = el.attrd('value');
				if (val == null) {
					var a = new Function('return ' + el.attrd('value-a'))();
					var b = new Function('return ' + el.attrd('value-b'))();
					var v = GET(path);
					if (v === a)
						SET(path, b, true);
					else
						SET(path, a, true);
				} else
					SET(path, new Function('return ' + val)(), true);
			}
		});
	};
});

COMPONENT('checkbox', function(self, config) {

	self.nocompile();

	self.validate = function(value) {
		return (config.disabled || !config.required) ? true : (value === true || value === 'true' || value === 'on');
	};

	self.configure = function(key, value, init) {
		if (init)
			return;
		switch (key) {
			case 'label':
				self.find('span').html(value);
				break;
			case 'required':
				self.find('span').tclass('ui-checkbox-label-required', value);
				break;
			case 'disabled':
				self.tclass('ui-disabled', value);
				break;
			case 'checkicon':
				self.find('i').rclass2('fa-').aclass('fa-' + value);
				break;
		}
	};

	self.make = function() {
		self.aclass('ui-checkbox');
		self.html('<div><i class="fa fa-{2}"></i></div><span{1}>{0}</span>'.format(config.label || self.html(), config.required ? ' class="ui-checkbox-label-required"' : '', config.checkicon || 'check'));
		config.disabled && self.aclass('ui-disabled');
		self.event('click', function() {
			if (config.disabled)
				return;
			self.dirty(false);
			self.getter(!self.get());
		});
	};

	self.setter = function(value) {
		self.tclass('ui-checkbox-checked', !!value);
	};
});

COMPONENT('textarea', function(self, config) {

	var input, container, content = null;

	self.nocompile();

	self.validate = function(value) {
		if (config.disabled || !config.required)
			return true;
		if (value == null)
			value = '';
		else
			value = value.toString();
		return value.length > 0;
	};

	self.configure = function(key, value, init) {
		if (init)
			return;

		var redraw = false;

		switch (key) {
			case 'disabled':
				self.tclass('ui-disabled', value);
				self.find('input').prop('disabled', value);
				break;
			case 'required':
				self.noValid(!value);
				!value && self.state(1, 1);
				self.find('.ui-textarea-label').tclass('ui-textarea-label-required', value);
				break;
			case 'placeholder':
				input.prop('placeholder', value || '');
				break;
			case 'maxlength':
				input.prop('maxlength', value || 1000);
				break;
			case 'label':
				redraw = true;
				break;
			case 'autofocus':
				input.focus();
				break;
			case 'monospace':
				self.tclass('ui-textarea-monospace', value);
				break;
			case 'icon':
				redraw = true;
				break;
			case 'format':
				self.format = value;
				self.refresh();
				break;
		}

		redraw && setTimeout2('redraw' + self.id, function() {
			self.redraw();
			self.refresh();
		}, 100);
	};

	self.redraw = function() {

		var attrs = [];
		var builder = [];

		self.tclass('ui-disabled', config.disabled === true);
		self.tclass('ui-textarea-monospace', config.monospace === true);

		config.placeholder && attrs.attr('placeholder', config.placeholder);
		config.maxlength && attrs.attr('maxlength', config.maxlength);
		config.error && attrs.attr('error');
		attrs.attr('data-jc-bind', '');
		config.height && attrs.attr('style', 'height:{0}px'.format(config.height));
		config.autofocus === 'true' && attrs.attr('autofocus');
		config.disabled && attrs.attr('disabled');
		builder.push('<textarea {0}></textarea>'.format(attrs.join(' ')));

		var label = config.label || content;

		if (!label.length) {
			config.error && builder.push('<div class="ui-textarea-helper"><i class="fa fa-warning" aria-hidden="true"></i> {0}</div>'.format(config.error));
			self.aclass('ui-textarea ui-textarea-container');
			self.html(builder.join(''));
			input = self.find('textarea');
			container = self.element;
			return;
		}

		var html = builder.join('');

		builder = [];
		builder.push('<div class="ui-textarea-label{0}">'.format(config.required ? ' ui-textarea-label-required' : ''));
		config.icon && builder.push('<i class="fa fa-{0}"></i>'.format(config.icon));
		builder.push(label);
		builder.push(':</div><div class="ui-textarea">{0}</div>'.format(html));
		config.error && builder.push('<div class="ui-textarea-helper"><i class="fa fa-warning" aria-hidden="true"></i> {0}</div>'.format(config.error));

		self.html(builder.join(''));
		self.rclass('ui-textarea');
		self.aclass('ui-textarea-container');
		input = self.find('textarea');
		container = self.find('.ui-textarea');
	};

	self.make = function() {
		content = self.html();
		self.type = config.type;
		self.format = config.format;
		self.redraw();
	};

	self.state = function(type) {
		if (!type)
			return;
		var invalid = config.required ? self.isInvalid() : false;
		if (invalid === self.$oldstate)
			return;
		self.$oldstate = invalid;
		container.tclass('ui-textarea-invalid', invalid);
		config.error && self.find('.ui-textarea-helper').tclass('ui-textarea-helper-show', invalid);
	};
});

COMPONENT('validation', 'delay:100;flags:visible', function(self, config) {

	var path, elements = null;
	var def = 'button[name="submit"]';
	var flags = null;

	self.readonly();

	self.make = function() {
		elements = self.find(config.selector || def);
		path = self.path.replace(/\.\*$/, '');
		setTimeout(function() {
			self.watch(self.path, self.state, true);
		}, 50);
	};

	self.configure = function(key, value, init) {
		switch (key) {
			case 'selector':
				if (!init)
					elements = self.find(value || def);
				break;
			case 'flags':
				if (value) {
					flags = value.split(',');
					for (var i = 0; i < flags.length; i++)
						flags[i] = '@' + flags[i];
				} else
					flags = null;
				break;
		}
	};

	self.state = function() {
		setTimeout2(self.id, function() {
			var disabled = DISABLED(path, flags);
			if (!disabled && config.if)
				disabled = !EVALUATE(self.path, config.if);
			elements.prop('disabled', disabled);
		}, config.delay);
	};
});

COMPONENT('dropdown', function(self, config) {

	var select, condition, content = null;
	var render = '';

	self.nocompile();

	self.validate = function(value) {

		if (!config.required || config.disabled)
			return true;

		var type = typeof(value);
		if (type === 'undefined' || type === 'object')
			value = '';
		else
			value = value.toString();

		EMIT('reflow', self.name);

		switch (self.type) {
			case 'currency':
			case 'number':
				return value > 0;
		}

		return value.length > 0;
	};

	self.configure = function(key, value, init) {

		if (init)
			return;

		var redraw = false;

		switch (key) {
			case 'type':
				self.type = value;
				break;
			case 'items':

				if (value instanceof Array) {
					self.bind('', value);
					return;
				}

				var items = [];

				value.split(',').forEach(function(item) {
					item = item.trim().split('|');
					var obj = { id: item[1] == null ? item[0] : item[1], name: item[0] };
					items.push(obj);
				});

				self.bind('', items);
				break;
			case 'if':
				condition = value ? FN(value) : null;
				break;
			case 'required':
				self.tclass('ui-dropdown-required', value === true);
				self.state(1, 1);
				break;
			case 'datasource':
				self.datasource(value, self.bind);
				break;
			case 'label':
				content = value;
				redraw = true;
				break;
			case 'icon':
				redraw = true;
				break;
			case 'disabled':
				self.tclass('ui-disabled', value);
				self.find('select').prop('disabled', value);
				self.reset();
				break;
		}

		redraw && setTimeout2(self.id + '.redraw', 100);
	};

	self.bind = function(path, arr) {

		if (!arr)
			arr = EMPTYARRAY;

		var builder = [];
		var value = self.get();
		var template = '<option value="{0}"{1}>{2}</option>';
		var propText = config.text || 'name';
		var propValue = config.value || 'id';

		config.empty !== undefined && builder.push('<option value="">{0}</option>'.format(config.empty));

		var type = typeof(arr[0]);
		var notObj = type === 'string' || type === 'number';

		for (var i = 0, length = arr.length; i < length; i++) {
			var item = arr[i];
			if (condition && !condition(item))
				continue;
			if (notObj)
				builder.push(template.format(item, value === item ? ' selected="selected"' : '', item));
			else
				builder.push(template.format(item[propValue], value === item[propValue] ? ' selected="selected"' : '', item[propText]));
		}

		render = builder.join('');
		select.html(render);
	};

	self.redraw = function() {
		var html = '<div class="ui-dropdown"><select data-jc-bind="">{0}</select></div>'.format(render);
		var builder = [];
		var label = content || config.label;
		if (label) {
			builder.push('<div class="ui-dropdown-label">{0}{1}:</div>'.format(config.icon ? '<span class="fa fa-{0}"></span> '.format(config.icon) : '', label));
			builder.push('<div class="ui-dropdown-values">{0}</div>'.format(html));
			self.html(builder.join(''));
		} else
			self.html(html).aclass('ui-dropdown-values');
		select = self.find('select');
		render && self.refresh();
		config.disabled && self.reconfigure('disabled:true');
		self.tclass('ui-dropdown-required', config.required === true);
	};

	self.make = function() {
		self.type = config.type;
		content = self.html();
		self.aclass('ui-dropdown-container');
		self.redraw();
		config.if && (condition = FN(config.if));
		config.items && self.reconfigure({ items: config.items });
		config.datasource && self.reconfigure('datasource:' + config.datasource);
	};

	self.state = function(type) {
		if (!type)
			return;
		var invalid = config.required ? self.isInvalid() : false;
		if (invalid === self.$oldstate)
			return;
		self.$oldstate = invalid;
		self.tclass('ui-dropdown-invalid', invalid);
	};
});

COMPONENT('textbox', function(self, config) {

	var input, container, content = null;

	self.nocompile();

	self.validate = function(value) {

		if (!config.required || config.disabled)
			return true;

		if (self.type === 'date')
			return value instanceof Date && !isNaN(value.getTime());

		if (value == null)
			value = '';
		else
			value = value.toString();

		EMIT('reflow', self.name);

		if (config.minlength && value.length < config.minlength)
			return false;

		switch (self.type) {
			case 'email':
				return value.isEmail();
			case 'url':
				return value.isURL();
			case 'currency':
			case 'number':
				return value > 0;
		}

		return config.validation ? !!self.evaluate(value, config.validation, true) : value.length > 0;
	};

	self.make = function() {

		content = self.html();

		self.type = config.type;
		self.format = config.format;

		self.event('click', '.fa-calendar', function(e) {
			if (config.disabled)
				return;
			if (config.type === 'date') {
				e.preventDefault();
				window.$calendar && window.$calendar.toggle(self.element, self.get(), function(date) {
					self.set(date);
				});
			}
		});

		self.event('click', '.fa-caret-up,.fa-caret-down', function() {
			if (config.disabled)
				return;
			if (config.increment) {
				var el = $(this);
				var inc = el.hclass('fa-caret-up') ? 1 : -1;
				self.change(true);
				self.inc(inc);
			}
		});

		self.event('click', '.ui-textbox-control-icon', function() {
			if (config.disabled)
				return;
			if (self.type === 'search') {
				self.$stateremoved = false;
				$(this).rclass('fa-times').aclass('fa-search');
				self.set('');
			} else if (config.icon2click)
				EXEC(config.icon2click, self);
		});

		self.event('focus', 'input', function() {
			config.autocomplete && EXEC(config.autocomplete, self);
		});

		self.redraw();
	};

	self.redraw = function() {

		var attrs = [];
		var builder = [];
		var tmp = 'text';

		switch (config.type) {
			case 'password':
				tmp = config.type;
				break;
			case 'number':
				isMOBILE && (tmp = 'tel');
				break;
		}

		self.tclass('ui-disabled', config.disabled === true);
		self.type = config.type;
		attrs.attr('type', tmp);
		config.placeholder && attrs.attr('placeholder', config.placeholder);
		config.maxlength && attrs.attr('maxlength', config.maxlength);
		config.keypress != null && attrs.attr('data-jc-keypress', config.keypress);
		config.delay && attrs.attr('data-jc-keypress-delay', config.delay);
		config.disabled && attrs.attr('disabled');
		config.error && attrs.attr('error');
		attrs.attr('data-jc-bind', '');

		config.autofill && attrs.attr('name', self.path.replace(/\./g, '_'));
		config.align && attrs.attr('class', 'ui-' + config.align);
		!isMOBILE && config.autofocus && attrs.attr('autofocus');

		builder.push('<div class="ui-textbox-input"><input {0} /></div>'.format(attrs.join(' ')));

		var icon = config.icon;
		var icon2 = config.icon2;

		if (!icon2 && self.type === 'date')
			icon2 = 'calendar';
		else if (self.type === 'search') {
			icon2 = 'search';
			self.setter2 = function(value) {
				if (self.$stateremoved && !value)
					return;
				self.$stateremoved = !value;
				self.find('.ui-textbox-control-icon').tclass('fa-times', !!value).tclass('fa-search', !value);
			};
		}

		icon2 && builder.push('<div class="ui-textbox-control"><span class="fa fa-{0} ui-textbox-control-icon"></span></div>'.format(icon2));
		config.increment && !icon2 && builder.push('<div class="ui-textbox-control"><span class="fa fa-caret-up"></span><span class="fa fa-caret-down"></span></div>');

		if (config.label)
			content = config.label;

		if (content.length) {
			var html = builder.join('');
			builder = [];
			builder.push('<div class="ui-textbox-label{0}">'.format(config.required ? ' ui-textbox-label-required' : ''));
			icon && builder.push('<span class="fa fa-{0}"></span> '.format(icon));
			builder.push(content);
			builder.push(':</div><div class="ui-textbox">{0}</div>'.format(html));
			config.error && builder.push('<div class="ui-textbox-helper"><i class="fa fa-warning" aria-hidden="true"></i> {0}</div>'.format(config.error));
			self.html(builder.join(''));
			self.aclass('ui-textbox-container');
			input = self.find('input');
			container = self.find('.ui-textbox');
		} else {
			config.error && builder.push('<div class="ui-textbox-helper"><i class="fa fa-warning" aria-hidden="true"></i> {0}</div>'.format(config.error));
			self.aclass('ui-textbox ui-textbox-container');
			self.html(builder.join(''));
			input = self.find('input');
			container = self.element;
		}
	};

	self.configure = function(key, value, init) {

		if (init)
			return;

		var redraw = false;

		switch (key) {
			case 'disabled':
				self.tclass('ui-disabled', value);
				self.find('input').prop('disabled', value);
				break;
			case 'format':
				self.format = value;
				self.refresh();
				break;
			case 'required':
				self.noValid(!value);
				!value && self.state(1, 1);
				self.find('.ui-textbox-label').tclass('ui-textbox-label-required', value);
				break;
			case 'placeholder':
				input.prop('placeholder', value || '');
				break;
			case 'maxlength':
				input.prop('maxlength', value || 1000);
				break;
			case 'autofill':
				input.prop('name', value ? self.path.replace(/\./g, '_') : '');
				break;
			case 'label':
				content = value;
				redraw = true;
				break;
			case 'type':
				self.type = value;
				if (value === 'password')
					value = 'password';
				else
					self.type = 'text';
				redraw = true;
				break;
			case 'align':
				input.rclass(input.attr('class')).aclass('ui-' + value || 'left');
				break;
			case 'autofocus':
				input.focus();
				break;
			case 'icon':
			case 'icon2':
			case 'increment':
				redraw = true;
				break;
		}

		redraw && setTimeout2('redraw.' + self.id, function() {
			self.redraw();
			self.refresh();
		}, 100);
	};

	self.formatter(function(path, value) {
		return config.type === 'date' ? (value ? value.format(config.format || 'yyyy-MM-dd') : value) : value;
	});

	self.state = function(type) {
		if (!type)
			return;
		var invalid = config.required ? self.isInvalid() : false;
		if (invalid === self.$oldstate)
			return;
		self.$oldstate = invalid;
		container.tclass('ui-textbox-invalid', invalid);
		config.error && self.find('.ui-textbox-helper').tclass('ui-textbox-helper-show', invalid);
	};
});

COMPONENT('error', function(self, config) {

	self.readonly();
	self.nocompile();

	self.make = function() {
		self.aclass('ui-error hidden');
	};

	self.setter = function(value) {

		if (!(value instanceof Array) || !value.length) {
			self.tclass('hidden', true);
			return;
		}

		var builder = [];
		for (var i = 0, length = value.length; i < length; i++)
			builder.push('<div><span class="fa {1}"></span>{0}</div>'.format(value[i].error, 'fa-' + (config.icon || 'times-circle')));

		self.html(builder.join(''));
		self.tclass('hidden', false);
	};
});

COMPONENT('loading', function(self) {

	var pointer;

	self.readonly();
	self.singleton();
	self.nocompile();

	self.make = function() {
		self.aclass('ui-loading');
		self.append('<div></div>');
	};

	self.show = function() {
		clearTimeout(pointer);
		self.rclass('hidden');
		return self;
	};

	self.hide = function(timeout) {
		clearTimeout(pointer);
		pointer = setTimeout(function() {
			self.aclass('hidden');
		}, timeout || 1);
		return self;
	};
});

COMPONENT('disable', function(self, config) {

	var validate = null;
	self.readonly();

	self.configure = function(key, value) {
		if (key === 'validate')
			validate = value.split(',').trim();
	};

	self.setter = function(value) {
		var is = true;

		if (config.if)
			is = EVALUATE(self.path, config.if);
		else
			is = !value;

		self.find(config.selector || '[data-jc]').each(function() {
			var com = $(this).component();
			com && com.reconfigure('disabled:' + is);
		});

		validate && validate.forEach(FN('n => RESET({0}n)'.format(self.pathscope ? '\'' + self.pathscope + '.\'+' : '')));
	};

	self.state = function() {
		self.update();
	};
});

COMPONENT('message', function(self, config) {

	var is, visible = false;
	var timer = null;

	self.readonly();
	self.singleton();
	self.nocompile();

	self.make = function() {
		self.aclass('ui-message hidden');

		self.event('click', 'button', function() {
			self.hide();
		});

		$(window).on('keyup', function(e) {
			visible && e.which === 27 && self.hide();
		});
	};

	self.warning = function(message, icon, fn) {
		if (typeof(icon) === 'function') {
			fn = icon;
			icon = undefined;
		}
		self.callback = fn;
		self.content('ui-message-warning', message, icon || 'fa-warning');
	};

	self.success = function(message, icon, fn) {

		if (typeof(icon) === 'function') {
			fn = icon;
			icon = undefined;
		}

		self.callback = fn;
		self.content('ui-message-success', message, icon || 'fa-check-circle');
	};

	self.hide = function() {
		self.callback && self.callback();
		self.rclass('ui-message-visible');
		timer && clearTimeout(timer);
		timer = setTimeout(function() {
			visible = false;
			self.aclass('hidden');
		}, 1000);
	};

	self.content = function(cls, text) {
		!is && self.html('<div><div class="ui-message-body"><div class="text"></div><hr /><button>' + (config.button || 'Close') + '</button></div></div>');
		timer && clearTimeout(timer);
		visible = true;
		is = true;
		self.find('.ui-message-body').rclass().aclass('ui-message-body ' + cls);
		self.find('.text').html(text);
		self.rclass('hidden');
		setTimeout(function() {
			self.aclass('ui-message-visible');
		}, 5);
	};
});

COMPONENT('mobilecarousel,mobilecarousel@1', 'count:1;selector:.col-sm-4;margin:15;snapping:true;animate:5000', function(self, config) {

	var width = 0;
	var count = 0;
	var index = 0;
	var increment = 1;
	var skip = false;
	var move = false;
	var anim;
	var container;
	var old;

	self.readonly();
	self.blind();

	self.make = function() {
		self.element.wrapInner('<div class="ui-mobilecarousel-container"><div class="ui-mobilecarousel-body"></div></div>');
		$(window).on('resize', self.resize);
		setTimeout(self.resize, 50);
		setTimeout(self.resize, 500);
		setTimeout(self.resize, 2000);
		CSS('.ui-mobilecarousel .ui-mobilecarousel-{0} {1}{margin:0 0 0 {2}px;padding:0;float:left;vertical-align:top;display:inline-block}.ui-mobilecarousel .ui-mobilecarousel-{0} {1}:first-child{margin-left:0}'.format(self.id, config.selector, config.margin));
		container = self.find('.ui-mobilecarousel-container').aclass('ui-mobilecarousel-' + self.id);
		config.snapping && container.on('scroll', function() {
			!skip && setTimeout2(self.id, self.snap, 200);
		}).on('touchmove', function() {
			clearTimeout(anim);
		});
		config.animate && (anim = setTimeout(self.animate, config.animate));
	};

	self.animate = function() {

		if (!count || move)
			return;

		index += increment;

		if (index === count - 1)
			increment = -1;
		else if (index === 0)
			increment = 1;

		skip = true;
		anim = true;
		container.animate({ scrollLeft: index * (width + config.margin) }, 200);
		setTimeout(function() {
			skip = false;
			anim = false;
		}, 400);

		anim = setTimeout(self.animate, 2000);
	};

	self.snap = function() {
		var x = container.prop('scrollLeft');
		var off = Math.round(x / width);
		skip = true;
		move = true;
		container.stop().animate({ scrollLeft: off * (width + config.margin) }, 200);
		setTimeout(function() {
			skip = false;
		}, 500);
	};

	self.resize = function() {

		if (WIDTH() !== 'xs') {

			if (old === '1')
				return;

			old = '1';
			count = 0;
			width = 0;
			self.rclass('ui-mobilecarousel');
			self.css('height', '');
			self.find('.ui-mobilecarousel-body').css('width', '');
			self.find(config.selector).css('width', '');
			return;
		}

		self.aclass('ui-mobilecarousel');

		self.width(function(w) {

			var sum = 0;
			var height = 0;

			width = w / config.count;
			count = 0;

			self.find(config.selector).each(function(index) {
				var el = $(this);
				sum += width + (index ? 15 : 0);
				height = Math.max(el.innerHeight(), height);
				el.css('width', width);
				count++;
			});

			var k = sum + 'x' + height;
			if (old === k)
				return;

			old = k;
			self.css('height', (height >> 0) + 15);
			self.find('.ui-mobilecarousel-body').css('width', sum);
		});
	};
});
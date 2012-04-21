var darkside = require('../../');
var fs = require('fs');


module.exports.parse = function (path, type_handlers) {
	type_handlers = type_handlers || {};

	var data;
	try {
		data = fs.readFileSync(path, 'utf8');
	} catch (err) {
		throw new Error('Missing source file');
	}

	var result = {};
	var current_indent = -1;
	var current_branch = [ result ]; // The currently open branch of the declaration tree

	var indentation = data.match(/\n([ \t]+)\S/);
	indentation = indentation ? indentation[1].length : 1;

	var lines = data.split(/\r?\n/);
	lines.forEach(function (line, i) {
		// Count lines from 1 rather than from 0
		i += 1;

		// Skip empty lines
		if (/^\s*$/.test(line)) return;

		// Get the indentation level
		var indent = line.match(/^\s*/)[0].length / indentation;
		if (indent > current_indent + 1 || !current_branch[indent]) {
			throw new Error('Parse error on line ' + i + ' (indentation)');
		}

		// Get raw line content
		line = line.substr(indent * indentation);
		// Skip comments
		if (line[0] === '#') return;

		// Parse the line
		var key = line.split(' = ')[0];

		if (line.substr(0, 2) === '- ') {
			// Special handling for array items
			var items = current_branch[indent];
			if (!/[^-]/.test(Object.keys(items).join(''))) {
				key = Object.keys(items).length.toString();
			}
			// Strip the dash and any trailing whitespace
			line = line.substr(2).trimRight();

		} else {
			// Strip the key and any trailing whitespace
			line = line.substr(key.length + 3).trimRight();
		}

		var value;
		if (line) { // Leaf, no children
			// Look for value such as
			// - type 'value'
			// - type value
			// - 'value'
			// - value
			line = line.match(/^(?:([a-zA-Z0-9\-]+) )?((')?.*\3)$/);
			if (!line) {
				throw new Error('Parse error on line ' + i + ' (value)');
			}

			var type = line[1] || null;
			value = eval(line[2]);

			if (type) {
				// Special handler for typed values
				var type_handler = type_handlers[type];
				if (!type_handler) {
					throw new Error('Handler for the type \'' + type + '\' not specified');
				}
				value = type_handler(value);
			}
		} else { // Namespace, ready for children
			value = {};
		}

		// Store the final value
		current_branch[indent][key] = value;

		// Update the branch items
		current_branch[indent + 1] = !line ? value : undefined;

		current_indent = indent;
	});

	// Convert Array-like objects to real Array instances
	var consolidateLevel = function (items) {
		if (Array.isArray(items)) {
			return items;
		}

		var keys = Object.keys(items);
		var is_array = keys.every(function (key, i) {
			return (key == i);
		});

		if (is_array) {
			var arr = [];
			keys.forEach(function (key, i) {
				var item = items[key];
				arr[i] = (typeof item === 'object') ? consolidateLevel(item) : item;
			});
			return arr;
		}

		keys.forEach(function (key) {
			var item = items[key];
			items[key] = (typeof item === 'object') ? consolidateLevel(item) : item;
		});
		return items;
	};

	result = consolidateLevel(result);

	return result;
};

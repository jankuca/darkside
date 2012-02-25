var darkside = require('../../');
var fs = require('fs');


module.exports.parse = function (path, type_handlers) {
	type_handlers = type_handlers || {};

	var data;
	try {
		data = fs.readFileSync(path, 'utf8').split(/\r?\n/);
	} catch (err) {
		throw new Error('Missing source file');
	}

	var result = {};
	var current_indent = -1;
	var current_branch = [ result ]; // The currently open branch of the declaration tree

	data.forEach(function (line, i) {
		// Count lines from 1 rather than from 0
		i += 1;

		// Skip empty lines
		if (/^\s*$/.test(line)) return;

		// Get the indentation level
		var indent = line.match(/^\s*/)[0].length;
		if (indent > current_indent + 1 || !current_branch[indent]) {
			throw new Error('Parse error on line ' + i + ' (indentation)');
		}

		// Get raw line content
		line = line.substr(indent);
		// Skip comments
		if (line[0] === '#') return;

		// Parse the line
		var key = line.split(' = ')[0]; 

		var value;
		// Strip the key and any trailing whitespace
		line = line.substr(key.length + 3).trimRight();
		if (line) { // Leaf, no children
			// Look for value such as
			// - type 'value'
			// - type value
			// - 'value'
			// - value
			line = line.match(/^(?:([a-zA-Z][a-zA-Z0-9\-]*) )?((')?.*\3)$/);
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

	return result;
};

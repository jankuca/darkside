var mongodb = require('mongodb-lite');


/**
 * An entity
 * @constructor
 * @extends {lighter.events.EventEmitter}
 * @param {Object=} doc A document with which to initialize the entity.
 */
var Entity = function (doc) {
  doc = doc || {};

  /**
   * The entity ID
   */
  this.id = undefined;

  /**
   * Whether the entity is stored (either locally or remotely)
   * @type {boolean}
   */
  this.stored = false;

  /**
   * The current document against which to calculate diffs
   * @type {!Object}
   */
  this.doc_ = {};

  /**
   * Keys to leave out of the document when storing
   * @type {!Array.<string>}
   */
  this.unlisted_keys_ = [];
  this.unlisted_keys_ = Object.keys(this).concat([ '_id' ]);

  this.update(doc);
  this.merge(doc);
};


Entity.prototype.toJSON = function () {
  return this.getDocument();
};


/**
 * Replaces the current document with another one.
 * @param {!Object} doc The new document.
 */
Entity.prototype.setDocument = function (doc) {
  this.id = null;
  this.stored = false;

  var unlisted = this.unlisted_keys_;

  // Remove old document keys
  Object.keys(this).forEach(function (key) {
    if (unlisted.indexOf(key) === -1) {
      delete this[key];
    }
  }, this);

  this.update(doc);
};

/**
 * Returns the current document of the entity
 * @return {!Object} The current document.
 */
Entity.prototype.getDocument = function () {
  var unlisted = this.unlisted_keys_;

  var doc = {};
  Object.keys(this).forEach(function (key) {
    if (unlisted.indexOf(key) === -1) {
      doc[key] = this[key];
    }
  }, this);

  if (this.id) {
    doc['_id'] = this.getObjectId();
	}

  return doc;
};

/**
 * Returns the diff since the last merge.
 * @return {!Object} The document diff.
 */
Entity.prototype.getDocumentDiff = function () {
	var diff = {};

	var old = this.doc_;
	var current = this.getDocument();
	var removed_keys = Object.keys(old);

	Object.keys(current).forEach(function (key) {
		if (current[key] !== old[key]) {
			diff[key] = current[key];
		}

		var old_index = removed_keys.indexOf(key);
		if (old_index !== -1) {
			delete removed_keys[old_index];
		}
	});

	removed_keys.forEach(function (key) {
		diff[key] = undefined;
	});

  if (this.id !== old['_id']) {
    diff['_id'] = this.getObjectId();
  }

	return diff;
};

/**
 * Get the object ID of the entity.
 * A BSON ObjectId is returned if the ID is 24-char long.
 * @return {mongodb.ObjectId|string|number|null}
 */
Entity.prototype.getObjectId = function () {
  if (typeof this.id === 'string' && this.id.length === 24) {
    return new mongodb.ObjectId(this.id);
  }
  return this.id;
};

/**
 * Sets (some) new document key values
 * @param {!Object} info The (parital) new document.
 */
Entity.prototype.update = function (doc) {
  var unlisted = this.unlisted_keys_;

  Object.keys(doc).forEach(function (key) {
    if (unlisted.indexOf(key) === -1) {
      this[key] = doc[key];
    }
  }, this);

  if (doc['_id']) {
    this.id = doc['_id'];
    this.stored = !!this.id;
  }
};

/**
 * Replaces the stored document with the current state
 * Diffs calculated from this point are relative to the current state.
 */
Entity.prototype.merge = function (diff) {
  var unlisted = this.unlisted_keys_;
  var doc = this.doc_;

  Object.keys(diff).forEach(function (key) {
    if (unlisted.indexOf(key) === -1) {
      doc[key] = diff[key];
    }
  });
};


module.exports = Entity;

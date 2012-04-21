var assert = require('assert');

var Entity = require('../lib/models/Entity.js');


var it  = {};
exports['Entity'] = it;


it['should return an empty document when empty'] = function () {
  var entity = new Entity();
  assert.deepEqual(entity.getDocument(), {});
};

it['should not have an ID (the ID should be null) when empty'] = function () {
  var entity = new Entity();
  assert.equal(entity.id, null);
};

it['should be marked as not stored when empty'] = function () {
  var entity = new Entity();
  assert.equal(entity.stored, false);
};

it['should have the correct ID'] = function () {
  var doc = {
    '_id': 123
  };
  var entity = new Entity(doc);
  assert.equal(entity.id, doc['_id']);
};

it['should be marked as stored when the initial document features an ID'] = function () {
  var doc = {
    '_id': 123
  };
  var entity = new Entity(doc);
  assert.equal(entity.stored, true);
};

it['should return the initial document when no changes are made'] = function () {
  var doc = {
    '_id': 123,
    'a': 'Abc',
    'bc:def': 'Def'
  };
  var entity = new Entity(doc);
  assert.deepEqual(entity.getDocument(), doc);
};

it['should not reference the initial document but copy it instead'] = function () {
  var doc = {
    '_id': 123,
    'a': 'Abc',
    'bc:def': 'Def'
  };
  var entity = new Entity(doc);
  assert.notEqual(entity.getDocument(), doc);
};

it['should accept a new document'] = function () {
  var doc = {
    '_id': 123,
    'a': 'Abc',
    'bc:def': 'Def'
  };
  var entity = new Entity();
  entity.setDocument(doc);
  assert.deepEqual(entity.getDocument(), doc);
};

it['should accept a partial document update'] = function () {
  var doc = {
    '_id': 123,
    'a': 'Abc',
    'bc:def': 'Def'
  };
  var update = {
    'a': 'Updated',
    'b': 'New'
  };
  var entity = new Entity(doc);
  entity.update(update);
  assert.equal(entity['a'], update['a']);
  assert.equal(entity['b'], update['b']);
  var d = entity.getDocument();
  assert.equal(d['a'], update['a']);
  assert.equal(d['b'], update['b']);
};

it['should update its stored mark and ID on a new document'] = function () {
  var doc = {
    '_id': 123,
    'a': 'Abc',
    'bc:def': 'Def'
  };
  var entity = new Entity();
  entity.setDocument(doc);
  assert.equal(entity.stored, true);
  assert.equal(entity.id, doc['_id']);
};

it['should correctly calculate a diff against the initial document'] = function () {
  var doc = {
    'a': 'A',
    'b': 'B',
    'c': 1,
    'd': 2
  };
  var update = {
    'a': 'Modified',
    'b': undefined,
    'd': 4,
    'e': 'Added'
  };

  var entity = new Entity(doc);
  entity.update(update);
  assert.deepEqual(entity.getDocumentDiff(), update);
};

it['should correctly calculate a diff when there are multiple updates'] = function () {
  var doc = {
    'a': 'A',
    'b': 'B',
    'c': 1,
    'd': 2
  };
  var update1 = {
    'a': 'Modified',
    'b': undefined
  };
  var update2 = {
    'd': 4,
    'e': 'Added'
  };

  var update = {};
  Object.keys(update1).forEach(function (key) {
    update[key] = update1[key];
  });
  Object.keys(update2).forEach(function (key) {
    update[key] = update2[key];
  });

  var entity = new Entity(doc);
  entity.update(update1);
  entity.update(update2);
  assert.deepEqual(entity.getDocumentDiff(), update);
};

it['should correctly calculate a diff against a merge'] = function () {
  var doc = {
    'a': 'A',
    'b': 'B',
    'c': 1,
    'd': 2
  };
  var update = {
    'a': 'Modified',
    'b': undefined,
    'd': 4,
    'e': 'Added'
  };

  var entity = new Entity();

  entity.update(doc);
  entity.merge();
  assert.deepEqual(entity.getDocumentDiff(), {});

  entity.update(update);
  assert.deepEqual(entity.getDocumentDiff(), update);
};

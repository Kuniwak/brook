/* global Namespace:false, test:false, expect:false, ok:false, equal:false, stop:false, start:false */

Namespace.use('brook.dom.compat getDatasetValue,getDatasetValues')
.apply(function(ns) {
  'use strict';

  var ELEM_HAS_NO_DATASETS = document.getElementById('empty-dataset');
  var ELEM_HAS_DATASETS = document.getElementById('dataset');

  module('getDatasetValue');

  test('should be exposed', function() {
    ok('getDatasetValue' in ns);
  });

  test('should return an undefined when the attribute unexists', function() {
    equal(ns.getDatasetValue(ELEM_HAS_NO_DATASETS, 'unexistentKey'), undefined);
  });

  test('should return an attribute value when the attribute exists', function() {
    equal(ns.getDatasetValue(ELEM_HAS_DATASETS, 'attrA'), 'AAA');
    equal(ns.getDatasetValue(ELEM_HAS_DATASETS, 'attrB'), 'BBB');
  });


  module('getDatasetValues');

  test('should be exposed', function() {
    ok('getDatasetValues' in ns);
  });

  test('should return an empty object when no data attributes required', function() {
    propEqual(ns.getDatasetValues(ELEM_HAS_NO_DATASETS, []), {});
    propEqual(ns.getDatasetValues(ELEM_HAS_DATASETS, []), {});
  });

  test('should return an empty object when an attribute unexisted required', function() {
    propEqual(ns.getDatasetValues(ELEM_HAS_NO_DATASETS, ['attrA']), {});
  });

  test('should return an object when an attribute existed required', function() {
    propEqual(ns.getDatasetValues(ELEM_HAS_DATASETS, ['attrA']), {attrA: 'AAA'});
  });

  test('should return an object when several attributes existed required', function() {
    propEqual(ns.getDatasetValues(ELEM_HAS_DATASETS, ['attrA', 'attrB']), {attrA: 'AAA', attrB: 'BBB'});
  });

  test('should return an enpty object when several attribute unexisted required', function() {
    propEqual(ns.getDatasetValues(ELEM_HAS_NO_DATASETS, ['attrA', 'attrB']), {});
  });

  test('should return an object when attributes existed and unexisted required', function() {
    propEqual(ns.getDatasetValues(ELEM_HAS_DATASETS, ['attrA', 'unexistentKey']), {attrA: 'AAA'});
  });
});

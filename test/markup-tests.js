(function() {
	module('markup tests');

	test('text node binding', function() {
		
		var template = '<div id="template"><ul><li>{{name}}</li></ul></div>',
			modelA = {name: 'one'},
			modelB = {name: 'two'};

		runTest(template, modelA, modelB);
	});

	test('multiple text node binding', function() {

		var template = '<div id="template"><ul><li>{{name}}, {{lastname}}</li></ul></div>',
			modelA = {name: 'Jim', lastname: 'West'},
			modelB = {name: 'Bob', lastname: 'West'};

		runTest(template, modelA, modelB);
	});

	test('multiple child nodes', function() {
		
		var template = '<div id="template"><ul><li>{{name}}</li><li>three</li><li>four</li></ul></div>',
			modelA = {name: 'one'},
			modelB = {name: 'two'};

		runTest(template, modelA, modelB);
	});

	test('multiple child nodes, multiple values', function() {
		
		var template = '<div id="template"><ul><li>{{name}}</li><li>three</li><li>{{another}}</li></ul></div>',
			modelA = {name: 'one', another: 'three'},
			modelB = {name: 'two', another: 'four'};

		runTest(template, modelA, modelB);
	});

	test('Simple attribute test', function() {
		
		var template = '<div id="template"><ul class="{{name}}"><li>Jim</li></ul></div>',
			modelA = {name: 'one'},
			modelB = {name: 'two'};

		runTest(template, modelA, modelB);
	});

	test('Multiple attribute test', function() {
		
		var template = '<div id="template"><ul class="{{name}}"><li class="{{name}}">Jim</li></ul></div>',
			modelA = {name: 'one'},
			modelB = {name: 'two'};

		runTest(template, modelA, modelB);
	});

	test('Main node test', function() {
		
		var template = '<div id="{{name}}"><ul class=""><li class="">Jim</li></ul></div>',
			modelA = {name: 'one'},
			modelB = {name: 'two'};

		runTest(template, modelA, modelB);
	});

	test('Inline text node test', function() {
		
		var template = '<p>This is an <b>{{name}}</b> test.',
			modelA = {name: 'important'},
			modelB = {name: 'very important'};

		runTest(template, modelA, modelB);
	});

	test('Blank inline text node test', function() {
		
		var template = '<p>This is an <b>{{name}}</b> test.',
			modelA = {name: 'important'},
			modelB = {name: ''};

		runTest(template, modelA, modelB);
	});

	test('dom element simple append test ', function() {
		
		var template = '<div id="template"><ul>{{#names}}<li>{{name}}</li>{{/names}}</ul></div>',
			modelA = {names: [{name:'one'}]},
			modelB = {names: [{name:'one'}, {name:'two'}]};

		runTest(template, modelA, modelB);
	});

	test('dom element prepend test', function() {
		
		var template = '<div id="template"><ul>{{#names}}<li>{{name}}</li>{{/names}}</ul></div>',
			modelA = {names: [{name:'one'}]},
			modelB = {names: [{name:'two'}, {name:'one'}]};

		runTest(template, modelA, modelB);
	});

	test('dom element remove test ', function() {
		
		var template = '<div id="template"><ul>{{#names}}<li>{{name}}</li>{{/names}}</ul></div>',
			modelA = {names: [{name:'one'}, {name:'two'}]},
			modelB = {names: [{name:'one'}]};

		runTest(template, modelA, modelB);
	});

	test('dom element middle remove test ', function() {
		
		var template = '<div id="template"><ul>{{#names}}<li>{{name}}</li>{{/names}}</ul></div>',
			modelA = {names: [{name:'one'}, {name:'two'}, {name:'three'}]},
			modelB = {names: [{name:'one'}, {name:'three'}]};

		runTest(template, modelA, modelB);
	});

	test('dom element multiple remove test ', function() {
		
		var template = '<div id="template"><ul>{{#names}}<li>{{name}}</li>{{/names}}</ul></div>',
			modelA = {names: [{name:'one'}, {name:'two'}, {name:'three'}, {name:'four'}]},
			modelB = {names: [{name:'one'}, {name:'four'}]};

		runTest(template, modelA, modelB);
	});

	test('dom element add remove test ', function() {
		
		var template = '<div id="template"><ul>{{#names}}<li>{{name}}</li>{{/names}}</ul></div>',
			modelA = {names: [{name:'one'}, {name:'two'}, {name:'three'}]},
			modelB = {names: [{name:'zero'}, {name:'one'}, {name:'two'}]};

		runTest(template, modelA, modelB);
	});

	test('dom element text remove test', function() {
		
		var template = '<div id="template">{{text}}<ul><li>{{text2}}</li></ul></div>',
			modelA = {text: 'hello world', text2: 'bob'},
			modelB = {text: '', text2: 'bob'};

		runTest(template, modelA, modelB);
	});

	test('text node swap test', function() {
		
		var template = '<div id="template">{{text}}<p>Some text here</p>{{text2}}</div>',
			modelA = {text: 'hello world', text2: ''},
			modelB = {text: '', text2: 'joe'};

		runTest(template, modelA, modelB);
	});

	test('text node change test', function() {
		
		var template = '<div id="template">{{text}}<b>{{text3}}</b>{{text2}}</div>',
			modelA = {text: 'hello world', text2: 'joe', text3:'ho hum'},
			modelB = {text: 'hello world', text2: 'joe', text3:''};

		runTest(template, modelA, modelB);
	});

	test('tagname change test', function() {
		
		var template = '<div id="template"><{{tagname}}>hello world</{{tagname}}></div>',
			modelA = {tagname: 'b'},
			modelB = {tagname: 'i'};

		runTest(template, modelA, modelB);
	});

	test('comment change test', function() {
		
		var template = '<div id="template"><!--{{comment}}--></div>',
			modelA = {comment: 'hello world'},
			modelB = {comment: 'hello again'};

		runTest(template, modelA, modelB);
	});

	test('conditional enabled test', function() {
		
		var template = '<div id="template">{{#include}}<p>{{comment}}</p>{{/include}}</div>',
			modelA = {comment: 'hello world', include: true},
			modelB = {comment: 'hello again', include: true};

		runTest(template, modelA, modelB);
	});

	test('conditional switch test', function() {
		
		var template = '<div id="template">{{#include}}<p>{{comment}}</p>{{/include}}</div>',
			modelA = {comment: 'hello world', include: true},
			modelB = {comment: 'hello again', include: false};

		runTest(template, modelA, modelB);
	});


	function runTest(template, modelA, modelB) {

		var writer = new rebind.Writer(),
			tokens = writer.parse(template);

		//Ninject control flow comment tokens
		rebind.inject(tokens);

		//Create contexts around the two views provided
		var contextA = new Mustache.Context(modelA),
			contextB = new Mustache.Context(modelB);

		//Create two document gragments to render into
		var fragmentA = document.createDocumentFragment(),
			fragmentB = document.createDocumentFragment(),
			divA = document.createElement('div'),
			divB = document.createElement('div');

		//Document fragments require a parent node to use innerHTML
		fragmentA.appendChild(divA);
		fragmentB.appendChild(divB);

		//Now manually render both views into the document fragments
		divA.innerHTML = writer.renderTokens(tokens, contextA, null, template);
		divB.innerHTML = writer.renderTokens(tokens, contextB, null, template);
		
		console.log('');
		console.log('[[ node A:' + divA.innerHTML + ' ]]');
		console.log('[[ node B:' + divB.innerHTML + ' ]]');

		//Now merge and test (the newer markup is the source)
		rebind.mergeNodes(divB.firstChild, divA.firstChild, divA, 0, 0);

		console.log('--> source: ' + divA.innerHTML);
		console.log('--> target: ' + divB.innerHTML);

		//For now we will ok the output, but in future we will apply the changes in the DOM too
		ok(divA.isEqualNode(divB), 'Nodes match.');
	}
})();
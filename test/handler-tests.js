(function() {
	module('handler tests');

	test('normal lambda', function() {
		
		var template = '<p id="template">{{#exec}}argument1 argument2{{/exec}}</p>',
			modelA = {exec: getFunction, arguments: 'one'},
			modelB = {exec: getFunction, arguments: 'two'};

		var writer = new rebind.Writer(),
			tokens = writer.parse(template);

		//Ninject control flow comment tokens
		rebind.inject(tokens);

		//Create contexts around the two views provided
		var contextA = new Mustache.Context(modelA),
			contextB = new Mustache.Context(modelB);

		//Now manually render both views into the document fragments
		var outputA = writer.renderTokens(tokens, contextA, null, template),
			outputB = writer.renderTokens(tokens, contextB, null, template);

		ok(tokens);

		//Called with no arguments
		function getFunction() {
			return doExecute;
		}

		function doExecute(text, render) {
			return text;
		}
	});

	test('simple handler', function() {
		
		var template = '<p id="template">{{exec argument}}</p>',
			modelA = {argument: 'one'},
			modelB = {argument: 'two'};

		var writer = new rebind.Writer(),
			tokens = writer.parse(template);

		//Register the helper before the tokeniser runs
		rebind.registerHelper('exec', function(arg, render) {
			return arg.toUpperCase();
		});

		//Compile the template
		rebind.inject(tokens);

		var contextA = rebind.getContext(modelA),
			contextB = rebind.getContext(modelB);

		//Now manually render both views into the document fragments
		var outputA = writer.renderTokens(tokens, contextA, null, template),
			outputB = writer.renderTokens(tokens, contextB, null, template);

		ok(outputA === '<p id="template">ONE</p>', outputA);
		ok(outputB === '<p id="template">TWO</p>', outputB);
	});

	test('literal handler', function() {
		
		var template = '<p id="template">{{exec argument "hello"}}</p>',
			modelA = {argument: 'one'},
			modelB = {argument: 'two'};

		var writer = new rebind.Writer(),
			tokens = writer.parse(template);

		//Register the helper before the tokeniser runs
		rebind.registerHelper('exec', function(arg, text, render) {
			return text + ' ' + arg.toUpperCase();
		});

		//Compile the template
		rebind.inject(tokens);

		var contextA = rebind.getContext(modelA),
			contextB = rebind.getContext(modelB);

		//Now manually render both views into the document fragments
		var outputA = writer.renderTokens(tokens, contextA, null, template),
			outputB = writer.renderTokens(tokens, contextB, null, template);

		ok(outputA === '<p id="template">hello ONE</p>', outputA);
		ok(outputB === '<p id="template">hello TWO</p>', outputB);
	});

	test('Unknown argument', function() {
		
		var template = '<p id="template">{{exec unknown}}</p>',
			modelA = {argument: 'one'},
			modelB = {argument: 'two'};

		var writer = new rebind.Writer(),
			tokens = writer.parse(template);

		//Register the helper before the tokeniser runs
		rebind.registerHelper('exec', function(arg, render) {
			return arg;
		});

		//Compile the template
		rebind.inject(tokens);

		var contextA = rebind.getContext(modelA),
			contextB = rebind.getContext(modelB);

		//Now manually render both views into the document fragments
		var outputA = writer.renderTokens(tokens, contextA, null, template),
			outputB = writer.renderTokens(tokens, contextB, null, template);

		ok(outputA === '<p id="template"></p>', outputA);
		ok(outputB === '<p id="template"></p>', outputB);
	});

	test('section handler', function() {
		
		var template = '<ul id="template">{{#items}}<li>{{exec argument}}</li>{{/items}}</ul>',
			modelA = {items: [{argument: 'one'}, {argument: 'two'}, {argument: 'three'}]},
			modelB = {items: [{argument: 'one'}, {argument: 'four'}, {argument: 'seven'}]};

		var writer = new rebind.Writer(),
			tokens = writer.parse(template);

		//Register the helper before the tokeniser runs
		rebind.registerHelper('exec', function(arg, render) {
			return arg.toUpperCase();
		});

		//Compile the template
		rebind.inject(tokens);

		var contextA = rebind.getContext(modelA),
			contextB = rebind.getContext(modelB);

		//Now manually render both views into the document fragments
		var outputA = writer.renderTokens(tokens, contextA, null, template),
			outputB = writer.renderTokens(tokens, contextB, null, template);

		var fixture = document.getElementById('qunit-fixture'),
			sections,
			sectionValues;

		$(fixture).html(outputA);
		writer.postRender(fixture, sections, sectionValues);

		ok($(fixture).html() === '<ul id="template"><li>ONE</li><li>TWO</li><li>THREE</li></ul>', $(fixture).html());

		$(fixture).html(outputB);
		writer.postRender(fixture, sections, sectionValues);
		
		ok($(fixture).html() === '<ul id="template"><li>ONE</li><li>FOUR</li><li>SEVEN</li></ul>', $(fixture).html());
	});


})();

(function() {
	module('handler tests');

	test('normal lambda', function() {
		
		var template = '<p id="template">{{#exec}}argument1 argument2{{/exec}}</p>',
			modelA = {exec: getFunction, arguments: 'one'},
			modelB = {exec: getFunction, arguments: 'two'};

		var writer = new Mustache.Writer(),
			tokens = writer.parse(template);

		//Ninject control flow comment tokens
		Rebind.ninject(tokens);

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

		var writer = new Mustache.Writer(),
			tokens = writer.parse(template);

		//Register the helper before the tokeniser runs
		Rebind.registerHelper('exec', function(arg, render) {
			return arg.toUpperCase();
		});

		//Compile the template
		Rebind.ninject(tokens);

		var contextA = Rebind.getContext(modelA),
			contextB = Rebind.getContext(modelB);

		//Now manually render both views into the document fragments
		var outputA = writer.renderTokens(tokens, contextA, null, template),
			outputB = writer.renderTokens(tokens, contextB, null, template);

		ok(outputA === '<p id="template">ONE</p>', outputA);
		ok(outputB === '<p id="template">TWO</p>', outputB);
	});

})();

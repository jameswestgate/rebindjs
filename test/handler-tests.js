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

		console.log('Lambda -> outputA:' + outputA);
		console.log('Lambda -> outputB:' + outputB);

		ok(tokens);
	});

	test('simple handler', function() {
		
		var template = '<p id="template">{{exec argument1 argument2}}</p>',
			modelA = {arguments: 'one'},
			modelB = {arguments: 'two'};

		var writer = new Mustache.Writer(),
			tokens = writer.parse(template);

		//Ninject control flow comment tokens
		Rebind.ninject(tokens);

		var contextA = new Mustache.Context(modelA),
			contextB = new Mustache.Context(modelB);

		contextA.view.exec = getFunction;
		contextB.view.exec = getFunction;

		//Now manually render both views into the document fragments
		var outputA = writer.renderTokens(tokens, contextA, null, template),
			outputB = writer.renderTokens(tokens, contextB, null, template);

		console.log('Handler -> outputA:' + outputA);
		console.log('Handler -> outputB:' + outputB);

		ok(tokens);
	});

	//Called with no arguments
	function getFunction() {
		return doExecute;
	}

	function doExecute(text, render) {
		return text;
	}
})();

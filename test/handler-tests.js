module('handler tests');

test('normal lambda', function() {
	
	var template = '<p id="template">{{#exec}}{{arguments}}{{/exec}}</p>',
		modelA = {exec: execute, arguments: 'one'},
		modelB = {exec: execute, arguments: 'two'};

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

	function execute() {
		return function() {
			console.log('FUNCTION EXECUTED: ' + arguments[0]);
			return 'Hello world';
		}
	}
});

test('simple handler', function() {
	
	var template = '<p id="template">{{exec arguments}}</li></ul></p>',
		modelA = {name: 'one'},
		modelB = {name: 'two'};

	var writer = new Mustache.Writer(),
		tokens = writer.parse(template);

	//Ninject control flow comment tokens
	Rebind.ninject(tokens);

	ok(tokens);
});


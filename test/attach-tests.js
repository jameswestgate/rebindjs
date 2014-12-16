(function(){

	module('attach tests');

	test('simple attach', function() {
		
		var template = '<form><input type="text" value="{{field}}" name="field"/></form>',
			model = {field: 'one'};

		//Take template and add as-is to the dom
		var fixture = document.getElementById('qunit-fixture');

		$(fixture).html(template);

		//Reset because qunit-fixture is always the same id
		rebind.reset();
		rebind.bind(fixture, model);
		rebind.attach(fixture, model);

		//Should automatically update the model
		var input = $(fixture).find('input');
		ok(input.val() === 'one', 'Input value populated.');
		
		input.val('two');

		//You have to manually trigger a change event
		var evt = new Event('change', { bubbles: true, cancelable: true });
		input[0].dispatchEvent(evt);

		ok(model.field === 'two', 'Model value updated');
	});

	test('attach to different field', function() {
		
		var template = '<form><input type="text" value="{{field}}" name="out"/></form>',
			model = {field: 'one', out: ''};

		//Take template and add as-is to the dom
		var fixture = document.getElementById('qunit-fixture');

		$(fixture).html(template);

		//Reset because qunit-fixture is always the same id
		rebind.reset();
		rebind.bind(fixture, model);
		rebind.attach(fixture, model);

		//Should automatically update the model
		var input = $(fixture).find('input');
		ok(input.val() === 'one', 'Input value populated.');
		
		input.val('two');

		//You have to manually trigger a change event
		var evt = new Event('change', { bubbles: true, cancelable: true });
		input[0].dispatchEvent(evt);

		ok(model.field === 'one', 'Model value not updated');
		ok(model.out === 'two', 'Model value updated');
	});

	// test('use data field', function() {
		
	// 	var template = '<form><input type="text" value="{{field}}" data-name="field"/></form>',
	// 		model = {field: 'one'};

	// 	//Take template and add as-is to the dom
	// 	var fixture = document.getElementById('qunit-fixture');

	// 	$(fixture).html(template);

	// 	//Reset because qunit-fixture is always the same id
	// 	rebind.reset();
	// 	rebind.bind(fixture, model);
	// 	rebind.attach(fixture, model);
		
	// 	//Should automatically update the model
	// 	var input = $(fixture).find('input');
	// 	ok(input.val() === 'one', 'Input value populated.');
		
	// 	input.val('two');

	// 	//You have to manually trigger a change event
	// 	var evt = new Event('change', { bubbles: true, cancelable: true });
	// 	input[0].dispatchEvent(evt);

	// 	ok(model.field === 'two', 'Model value updated');
	// });


	// test('use data field different binding', function() {
		
	// 	var template = '<form><input type="text" value="{{field}}" data-name="out"/></form>',
	// 		model = {field: 'one', out: ''};

	// 	//Take template and add as-is to the dom
	// 	var fixture = document.getElementById('qunit-fixture');

	// 	$(fixture).html(template);

	// 	//Reset because qunit-fixture is always the same id
	// 	rebind.reset();
	// 	rebind.bind(fixture, model);

	// 	//Should automatically update the model
	// 	var input = $(fixture).find('input');
	// 	ok(input.val() === 'one', 'Input value populated.');
		
	// 	input.val('two');

	// 	//You have to manually trigger a change event
	// 	var evt = new Event('change', { bubbles: true, cancelable: true });
	// 	input[0].dispatchEvent(evt);

	// 	ok(model.field === 'one', 'Model value not updated');
	// 	ok(model.out === 'two', 'Model value updated');
	// });

	// test('array binding', function() {
		
	// 	var template = '<ul id ="tasks-list" class="tasks">{{#tasks}}' +
	// 		'<li><label for="id{{id}}">{{name}}</label><input id="id{{id}}" type="text" value="{{desc}}" name="desc"/></li>' +
	// 		'{{/tasks}}</ul>';

	// 	var model = {tasks: [
	// 		{id:1, name:'task1', desc:'do task1'},
	// 		{id:2, name:'task2', desc:'do task2'},
	// 		{id:3, name:'task3', desc:'do task3'}
	// 	]};

	// 	//Take template and add as-is to the dom
	// 	var fixture = document.getElementById('qunit-fixture');

	// 	$(fixture).html(template);

	// 	//Reset because qunit-fixture is always the same id
	// 	rebind.reset();
	// 	rebind.bind(fixture, model);

	// 	//Attach to the tasks
	// 	var tasks = document.getElementById('tasks-list');
	// 	rebind.attach(tasks, model.tasks);

	// 	//Should automatically update the model
	// 	var input = $(fixture).find('input');

	// 	ok(input.eq(0).val() === 'do task1', 'Input value 1 populated: ' + input.eq(0).val());
	// 	ok(input.eq(1).val() === 'do task2', 'Input value 2 populated: ' + input.eq(1).val());
	// 	ok(input.eq(2).val() === 'do task3', 'Input value 3 populated: ' + input.eq(2).val());
		
	// 	input.eq(1).val('updated');

	// 	//You have to manually trigger a change event
	// 	var evt = new Event('change', {bubbles: true, cancelable: true });
	// 	input[1].dispatchEvent(evt);

	// 	ok(model.tasks[1].desc === 'updated', 'Model value updated');
	// });

	
})();
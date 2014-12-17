/*!
 * rebind.js - Databinding for mustache.js templates 
 * https://github.com/jameswestgate/rebindjs
 * Released under the MIT license
 */

this.rebind = this.rebind || {};

(function(o) {

	//TODO: refactor a seperate ViewModel class
	var writer,
		helpers,
		helpersContext;

	o.reset = function() {
		writer = new Mustache.Writer();
		helpers = {};
		helpersContext = new Mustache.Context(helpers);
	}


	//-- Define the ViewModel class

	o.ViewModel = function(element) {
		
		if (typeof element === 'string') element = document.getElementById(element);

		this.element = element;
		this.handled = [];
	}

	//Extract the template from the element, 
	o.ViewModel.prototype.render = function(model) {
		
		this.template = this.element.innerHTML;
		this.tokens = writer.parse(this.template);

		//Add control flow comment tokens
		o.inject(this.tokens);

		//Create context, injecting helpers as the parent
		var context = o.getContext(model, helpers),
			div = document.createElement('div');

		document.createDocumentFragment().appendChild(div);

		//Render markup and apply to target element
		this.element.innerHTML = writer.renderTokens(this.tokens, context, null, this.template);
	}
	
	o.ViewModel.prototype.merge = function(model) {

		var div = document.createElement('div');

		//Document fragments require a child node to add innerHTML
		document.createDocumentFragment().appendChild(div);

		//It is easiest to get a new context rather than clear the cache.
		//Render the model into the div
		div.innerHTML = writer.renderTokens(this.tokens, o.getContext(model), null, this.template);

		//Now merge and test (the newer markup is the source)
		o.mergeNodes(div.firstChild, this.element.firstChild);
 	}

 	//Determine if the element template has been rendered yet and call appropriately
 	o.ViewModel.prototype.bind = function(model) {

 		var	method = this.template && this.tokens ? 'merge' : 'render';

		this[method](model);
		this.attach(this.element, model);
 	}

 	//Watch for change events and update model accordingly
 	//The element originating the change event must have a 'name' or 'data-name' attribute
 	//TODO: add syntax for nested loops eg people > addresses
 	o.ViewModel.prototype.attach = function(el, model) {

 		var self = this;

 		//Clear list of handled events.
 		//TODO: change event may not bubble in IE8.
 		//We'll add a handler for each viewmodel to avoid caching elements / viewmodels
 		document.body.addEventListener('change', function() {
 			self.handled.length = 0;
 		});
 		
 		//Modern browsers should clean these handlers up automatically
 		el.addEventListener('change', function(e) {

 			//Check the event target to see if it has a name or data-name attribute
 			var target = e.target || e.srcElement || e.originalTarget,
 				name = target.getAttribute('name') || target.getAttribute('data-name');

 			if (!name) return;

 			//Check if this has already been handled
 			for (var i=0, len=self.handled.length; i<len; i++) {
 				if (self.handled[i] === target) {
 					return;
 				}
 			}

 			//Check if the name is repeated in sibling nodes [name=currentName] ie to use array syntax
 			var nodes = el.querySelectorAll('[name=' + name + ']');
 			if (nodes.length < 2) nodes = el.querySelectorAll('[data-name=' + name + ']');

 			//No array so just update
 			if (nodes.length < 2) {
 				
 				model[name] = target.value;
 				self.handled.push(target);
 				
 				return;
 			}

 			//Get current index and update
 			for (var i=0, len=nodes.length; i<len; i++) {
 				if (nodes[i] === target) {
 					
 					if (model[i]) {
 						model[i][name] = target.value;
 						self.handled.push(target);
 					}
 				
 					return;
 				}
 			} 			
 		});
 	}

 	//Register a helper function with rebind. 
 	//The tokeniser will use this to create a lambda function and to bind helpers to views
 	o.registerHelper = function(name, fn) {
 		
 		helpers[name] = function() {

 			return function() {
 				
 				var parameters = arguments[0].split(' '),
 					argsArray = [];

 				//Lookup each argument in the view context
 				for (var i=0, len=parameters.length; i<len; i++) {

 					//Check for literal syntax
					var parameter = parameters[i],
						first = parameter.slice(0, 1),
						last = parameter.slice(-1);

 					argsArray.push((first === '"' && last === '"') || (first === "'" && last === "'") ? parameter.slice(1,-1): this[parameter]);
 				}

 				//Add subrender as last argument
 				argsArray.push(arguments[1]);

 				return fn.apply(this, argsArray);
 			}
 		};
 	}

 	//Get a context that includes the registered helpers
 	o.getContext = function(view) {
 		
		return new Mustache.Context(view, helpersContext);
 	}

 	o.create = function(element) {
 		return new o.ViewModel(element);
 	}

 	//Inject Helpers into template by expanding name tokens with spaces into lambdas
 	//eg {{format x y z}} to {{#format}}x y z{{/format}}
	o.inject = function(branch) {

		var i = 0;

		while (i < branch.length) {
			
			var token = branch[i],
				isSection = (token[0] === '#' || token[0] === '^'),
				isHandler = (token[0] === 'name' && token[1].indexOf(' ') > 0);

			//Handler
			if (isHandler) {

				//Rewrite token as a lambda function call
				var values = token[1].split(' '),
					end = token[3],
					bound = token[2] + values[0].length + 3, //{{+
					func = values.shift(),
					args = values.join(' ');

				token[0] = '#';
				token[1] = func;
				token[3] = bound; 
				token.push(['name', args, bound, end - 2]);
				token.push(end - 2);
			}

			//recurse subtree
			if (isSection) o.inject(token[4]);
 
 			i++;
		}
	}


	//Recurse through the source dom tree and apply changes to the target
	o.mergeNodes = function(source, target) {

		//Update comments and text nodes
		if ((source.nodeType  === 3 && target.nodeType === 3) || (source.nodeType === 8 && target.nodeType === 8)) {
			
			//Compare and update		
			if (target.nodeValue !== source.nodeValue) {
				console.log('> Updating comment/text value - source:' + source.nodeValue + ', target:' + target.nodeValue);

				target.nodeValue = source.nodeValue;
			}
			
			//No attributes or child elements, so we are done
			return;
		}

		//Update any attributes
		if (source.attributes && target.attributes) { 
		
			var attributes = source.attributes,
				value,
				name;

			//Add / update attributes
			for (var i=0, len=attributes.length; i<len; i++) {

				value = attributes[i].nodeValue;
				name = attributes[i].nodeName;

				if (target.getAttribute(name) !== value) {
					
					console.log('+ Set attribute value for:' + name + ' - source:'+ attributes[i].nodeValue + ', target:' + target.attributes[i].nodeValue);
					target.setAttribute(name, value);
				}
			}

			//Remove attributes
			attributes = target.attributes;

			for (var i=0, len=attributes.length; i<len; i++) {

				name = attributes[i].nodeName;

				if (source.getAttribute(name) === null) {
					
					console.log('- remove target attribute:' + name);
					target.removeAttribute(name);
				}
			}
		}

		//Return if equal after attribute update
		if (source.isEqualNode(target)) return;

		//Insert, delete and move child nodes based on predicted id
		if (source.childNodes && target.childNodes) {
			
			var	map = mapElements(target.childNodes),
				tags = {},
				nodes = source.childNodes;

			//Now loop through each source node and get the relevant target node
			for (var i=0, len=nodes.length; i<len; i++) {

				var node = nodes[i],
					bound = target.childNodes[i],
					id = (node.id) ? node.id : generateId(node, tags);

				//Check if the node has an id
				//If exists in target map, then move that node to the correct position 
				//This will usually be the same node, which means no dom move is necessary
				//Otherwise clone the node from the source (ie new inserts)
				var existing = map[id];
				
				if (existing) {

					if (existing !== bound) {

						console.log('^ Move mode with id:' + id + ' before:' + bound);
						target.insertBefore(existing, bound);
					}
				}
				else {

					console.log('+ Clone and added node with id: ' + id);
					target.insertBefore(node.cloneNode(true), bound);
				}
			}

			//Remove any tail nodes in the target
			while (target.childNodes.length > source.childNodes.length) {
				
				var remove = target.childNodes[target.childNodes.length -1];
				
				console.log('- Remove node: ' + remove);
				
				target.removeChild(remove);
			}
		}

		//Return if equal after child nodes update
		if (source.isEqualNode(target)) return;

		//Iterate through any child nodes
		var length = source.childNodes.length;

		if (length) {

			for (var i = 0; i<length; i++) {
				o.mergeNodes(source.childNodes[i], target.childNodes[i]);
			}
		}
	}


	//Return a map of live elements and their ids, or generate a predicatable id if one does not exist
	function mapElements(nodes) {

		var map = {},
			tags = {},
			node;

		for (var i=0, len=nodes.length; i<len; i++) {
			
			node = nodes[i];

			//Use the id provided or generate and id based on existing usage
			map[(node.id) ? node.id : generateId(node, tags)] = node;
		}

		return map;
	}

	//Create a unique id, using the tags collection for disambiguation
	function generateId(node, tags) {

		//Get the tag or create one from other node types
		var tag = (node.tagName) ? node.tagName : 'x' + node.nodeType;

		//Set the counter to zero
		if (!tags[tag]) tags[tag] = 0;

		//Increment the counter for that tag
		tags[tag]++;

		return tag + tags[tag];
	}

	o.reset();

 })(this.rebind);
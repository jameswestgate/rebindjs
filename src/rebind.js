/*!
 * rebind.js - Databinding for mustache.js templates 
 * https://github.com/jameswestgate/rebindjs
 * Released under the MIT license
 */

this.Rebind = this.Rebind || {};

(function(o) {

	var writer = new Mustache.Writer(),
		cache = {},
		helpers = {},
		helpersContext = new Mustache.Context(helpers);
		id = 0;

	o.reset = function() {
		cache = {};
		id = 0;
		helpers = {};
		helpersContext = new Mustache.Context(helpers);
	}

	//Extract the template from the element, 
	o.render = function(element, view) {
		
		var template = element.innerHTML,
			tokens = writer.parse(template);

		//Add control flow comment tokens
		Rebind.ninject(tokens);

		//Create context, injecting helpers as the parent
		var context = o.getContext(view, helpers);

		//Render markup and apply to target element
		element.innerHTML = writer.renderTokens(tokens, context, null, template);

		//Get or generate a cache key
		var key = element.id;

		if (!key || !key.length) {
			key = 'id' + id;
			element._rebindId = 'id' + id;

			id++;
		}

		//Cache template and token for future merges
		cache[key] = {template: template, tokens: tokens};
	}
	
	o.merge = function(element, view) {

		var div = document.createElement('div'),
			key = element._rebindId || element.id;

		//Document fragments require a child node to add innerHTML
		document.createDocumentFragment().appendChild(div);

		//It is easiest to get a new context rather than clear the cache.
		//Render the view into the div
		div.innerHTML = writer.renderTokens(cache[key].tokens, o.getContext(view), null, cache[key].template);
	
		//Now merge and test (the newer markup is the source)
		o.mergeNodes(div.firstChild, element.firstChild, element, 0, 0);
 	}

 	//Determine if the element template has been rendered yet and call appropriately
 	o.bind = function(element, view) {

 		var key = element.id || element._rebindId,
 			method = cache[key] ? 'merge' : 'render';

		o[method](element, view);
 	}

 	//Register a helper function with Rebind. 
 	//The tokeniser will use this to create a lambda function and to bind helpers to views
 	o.registerHelper = function(name, fn) {
 		
 		helpers[name] = function() {

 			return function() {
 				
 				var parameters = arguments[0].split(' '),
 					argsArray = [];

 				//Lookup each argument in the view context
 				for (var i=0, len=parameters.length; i<len; i++) {

					//TODO: Check string literal syntax
					//TODO: Check nested mustaches

 					argsArray.push(this[parameters[i]]);
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

 	//Inject section tokens (as comments) to allow us to pick up dom changes accurately

 	//Helpers - expand name tokens with spaces into lambdas
 	//eg {{format x y z}} to {{#format}}x y z{{/format}}
	o.ninject = function(branch) {

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

			//Control token
			if (isSection) {

				branch.splice(i, 0, ['text', '<!--' + token[0] + '-->', token[2], token[3]]);
				i++;

				//recurse subtree
				o.ninject(token[4]);
			}

			i++;

			//Close control token
			if (isSection) {
				
				branch.splice(i, 0, inject = ['text', '<!--/-->', token[2], token[3]]);
				i++;
			}
		}
	}

	//Recurse through the source dom tree and apply changes to the target
	o.mergeNodes = function(source, target, targetParent, level, index) {

		//Source and target can be null if text node was removed
		if (!source && !target) return;

		//Cahce node types
		var sourceType = source && source.nodeType,
			targetType = target && target.nodeType;

		//Text node insertion
		if (sourceType === 3 && (!target || targetType !==3)) {
			
			//Text node insertion
			if (!target) {
				console.log('+ Cloned and inserted text node for empty target.');
				targetParent.appendChild(source.cloneNode(false));
			}
			else {
				console.log('+ Cloned and inserted text node before target.');
				targetParent.insertBefore(source.cloneNode(false), target);
			}
			return;
		}
			
		//Text node removal
		if (targetType === 3  && (!source || sourceType !==3)) {

			console.log('- Remove text node from target.');
			targetParent.removeChild(target);

			if (!source) return;

			//Continue
			target = targetParent.childNodes[index];
		}

		//Detect if we have hit the start of a section
		if (sourceType === 8 && targetType === 8) {
			
			if (source.nodeValue === '#') {
				
				//Get the index of the next end marker
				var sourceIdx = getSectionEnd(source),
					targetIdx = getSectionEnd(target);

				//Some kind of failure, return
				if (!sourceIdx || !targetIdx) {
					console.log('rebind.js: Could not find end of section.');/*RemoveLogging:skip*/
				}

				//Load all elements in the target between source and targetidx's into an associative array by id
				//elements without an id get p1, p2 etc
				var map = mapElements(targetParent, index + 1, targetIdx);

				//Now loop through each source node and get the relevant target node
				var idx = index + 1,
					count = 0;

				while (idx < sourceIdx){

					var node = source.parentNode.childNodes[idx],
						bound = targetParent.childNodes[idx],
						id = node.id;

					if (!id) {
						id = 'p' + count;
						count++;
					}

					//Check if the node has an id
					//If exists in target map, then move that node to the correct position 
					//This will usually be the same node, which means no dom move is necessary
					//Otherwise clone the node from the source (ie new inserts)
					var existing = map[id];
					if (existing) {

						if (existing !== bound) {

							console.log('^ Move mode with id:' + id + ' before:' + bound);
							targetParent.insertBefore(existing, bound);
						}
					}
					else {

						console.log('+ Clone and added node with id: ' + id);
						targetParent.insertBefore(node.cloneNode(true), bound);

						targetIdx++;
					}

					idx++;
				}

				//Remove any tail nodes in the target
				while (sourceIdx < targetIdx) {
					
					console.log('- Removed node at index:' + idx);
					targetParent.removeChild(targetParent.childNodes[idx]);

					sourceIdx ++;
				}
			}
			else {
				//Normal comments, just update
				target.nodeValue = source.nodeValue
			}

			return;
		}

		//Now we have compared comment nodes, we can compare branch equality
		if (source.isEqualNode(target)) return;

		//Compare text nodes
		if (sourceType === 3 && targetType === 3) {
			
			console.log('> Push text values - source:' + source.nodeValue + ', target:' + target.nodeValue);
			target.nodeValue = source.nodeValue;

			return;
		}

		//Element tagName changes ie <{{name}} ... >
		if (source.tagName !== target.tagName) {
			
			console.log('> Tag replacement: ' + target.tagName + ' -> ' + source.tagName);
			targetParent.replaceChild(source.cloneNode(true), target);
			return;
		}

		//Iterate through any child nodes
		var length = (source.childNodes.length < target.childNodes.length) ? target.childNodes.length : source.childNodes.length;

		if (length) {

			//Now loop recursively.
			for (var i = 0; i<length; i++) {
				o.mergeNodes(source.childNodes[i], target.childNodes[i], target, level + 1, i);
			}

			if (source.isEqualNode(target)) return;
		}

		//Update any attributes
		if (source.attributes && target.attributes) { 
		
			var attributes = source.attributes;

			for (var i=0, len=attributes.length; i<len; i++) {

				var value = attributes[i].nodeValue,
					name = attributes[i].nodeName;

				if (target.getAttribute(name) !== value) {
					
					console.log('+ Push attribute values for:' + name + ' - source:'+ attributes[i].nodeValue + ', target:' + target.attributes[i].nodeValue);
					target.setAttribute(name, value);
				}
			}
		}		
	}


	//Starting with the comment node 
	function getSectionEnd(node) {
		var count = 0,
			index = 0;

		while (node) {
			
			if (node.nodeType === 8) {
				if (node.nodeValue === '#') {
					count ++
				} 
				else if (node.nodeValue === '/') {
					count --;
					if (count === 0) return index;
				}
			}

			index ++;
			node = node.nextSibling;
		}

		return null;
	}

	//Return a map of live elements and their ids, or generate a predicatable id if one does not exists
	function mapElements(parent, start, end) {
		var nodes = parent.childNodes,
			map = {},
			count = 0;

		for (var i=start; i<end; i++) {
			var node = nodes[i];

			if (node.id) {
				map[node.id] = node;
			}
			else {
				map['p' + count] = node;
				count++;
			}
		}

		return map;
	}

 })(this.Rebind);
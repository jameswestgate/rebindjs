/*!
 * rebind.js - Databinding for mustache.js templates (http://github.com/janl/mustache.js)
 */

this.Rebind = this.Rebind || {};

(function(o) {

	//Recurse through the source dom tree and compare to target, generating all required changes
	o.merge = function(source, target) {

 		//Begin recursive call into source making changes to target
 		mergeNodes(source, target, target.parentNode, 0, 0);
 	}

 	//Inject section tokens (as comments) to allow us to pick up dom changes accurately
 	//This allows us to leave mustache.js as is without modifications
 	//And still get the extra semantics needed to work out dom insertions and deletions

 	//TODO: check mustache names with spaces are preserved in the tree
 	//if so, expand {{format x y z}} to
 	//{{#format}}x y z{{/format}}
 	//And create a helper class that handle the lookup of "x y z" 
	o.ninject = function(branch) {

		var i = 0;

		while (i < branch.length) {
			
			var token = branch[i],
				isSection = (token[0] === '#' || token[0] === '^'),
				isHandler = (token[0] === 'name' && token[1].indexOf(' ') > 0);

			//Handler
			if (isHandler) {

				//Rewrite token as a lambda function call
				
			}

			//Control token
			if (isSection) {

				var inject = ['text', '<!--' + token[0] + '-->', token[2], token[3]];
				branch.splice(i, 0, inject);

				i++;

				//recurse subtree
				o.ninject(token[4]);
			}

			i++;

			//Close control token
			if (isSection) {
				var inject = ['text', '<!--/-->', branch[i][2], branch[i][3]];
				branch.splice(i, 0, inject);

				i++;
			}
		}
	}

	//Apply changes in source to target as a list of memoized actions
	function mergeNodes(source, target, targetParent, level, index) {

		console.log('Comparing nodes - source:' + (source && source.tagName) + ', target:' + (target && target.tagName) + ' at level: ' + level + ', index: ' + index);

		//Source and target can be null if text node was removed
		if (!source && !target) return;

		//Text node insertion
		if (source && source.nodeType === 3 && (!target || target.nodeType !==3)) {
			
			//Text node insertion
			var clone = source.cloneNode(false);

			if (!target) {
				console.log('+ Cloned and inserted text node for empty target.');
				targetParent.appendChild(clone); //problem - we dont have a target
			}
			else {
				console.log('+ Cloned and inserted text node before target.');
				targetParent.insertBefore(clone, target);
			}
			return;
		}
			
		//Text node removal
		if (target && target.nodeType === 3  && (!source || source.nodeType !==3)) {

			console.log('- Remove text node from target.');
			targetParent.removeChild(target);

			if (!source) return;

			//Continue
			target = targetParent.childNodes[index];
		}

		//Detect if we have hit the start of a section
		if (source.nodeType === 8 && target.nodeType === 8) {
			
			if (source.nodeValue === '#') {
				
				//Get the index of the next end marker
				var sourceIdx = getSectionEnd(source),
					targetIdx = getSectionEnd(target);

				//Some kind of failure, return
				if (!sourceIdx || !targetIdx) {
					console.warn('rebind.js: Could not find end of section.');
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
					if (map[id]) {

						if (map[id] !== bound) {

							console.log('^ Move mode with id:' + id + ' before:' + bound);
							targetParent.insertBefore(map[id], bound);
						}
					}
					else {

						var clone = node.cloneNode(true);

						console.log('+ Clone and added node with id: ' + id);
						targetParent.insertBefore(clone, bound);
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

			return;
		}

		//Now we have compared comment nodes, we can compare branch equality
		if (source.isEqualNode(target)) return;

		//Compare text nodes
		if (source.nodeType === 3 && target.nodeType === 3) {
			
			console.log('> Push text values - source:' + source.nodeValue + ', target:' + target.nodeValue);
			target.nodeValue = source.nodeValue;

			return;
		}

		//TODO: element tagName changes here


		//Iterate through any child nodes
		var length = (source.childNodes.length < target.childNodes.length) ? target.childNodes.length : source.childNodes.length;

		if (length) {

			console.log('Looping child nodes:');

			//Now loop recursively.
			for (var i = 0; i<length; i++) {
				mergeNodes(source.childNodes[i], target.childNodes[i], target, level + 1, i);
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

	//-- Implementation --

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
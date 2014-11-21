/*!
 * mustache.js - Logic-less {{mustache}} templates with JavaScript
 * http://github.com/janl/mustache.js
 * MIT Licence
 * Copyright (c) 2010-2014 Jan Lehnardt (JavaScript)
 */

/*global define: false*/

(function(l,q){if("object"===typeof exports&&exports)q(exports);else{var u={};q(u);"function"===typeof define&&define.amd?define(u):l.Mustache=u}})(this,function(l){function q(a){return"function"===typeof a}function u(a){return a.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g,"\\$&")}function z(a){if(!x(a)||2!==a.length)throw Error("Invalid tags: "+a);return[new RegExp(u(a[0])+"\\s*"),new RegExp("\\s*"+u(a[1]))]}function w(a){this.tail=this.string=a;this.pos=0}function m(a,b){this.view=null==a?{}:a;this.cache=
{".":this.view};this.parent=b}function r(){this.cache={}}var C=RegExp.prototype.test,D=/\S/,E=Object.prototype.toString,x=Array.isArray||function(a){return"[object Array]"===E.call(a)},F={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;","/":"&#x2F;"},G=/\s*/,A=/\s+/,B=/\s*=/,H=/\s*\}/,I=/#|\^|\/|>|\{|&|=|!/;w.prototype.eos=function(){return""===this.tail};w.prototype.scan=function(a){return(a=this.tail.match(a))&&0===a.index?(a=a[0],this.tail=this.tail.substring(a.length),this.pos+=a.length,
a):""};w.prototype.scanUntil=function(a){a=this.tail.search(a);var b;switch(a){case -1:b=this.tail;this.tail="";break;case 0:b="";break;default:b=this.tail.substring(0,a),this.tail=this.tail.substring(a)}this.pos+=b.length;return b};m.prototype.push=function(a){return new m(a,this)};m.prototype.lookup=function(a){var b;if(a in this.cache)b=this.cache[a];else{for(var g=this;g;){if(0<a.indexOf(".")){b=g.view;for(var e=a.split("."),l=0;null!=b&&l<e.length;)b=b[e[l++]]}else b=g.view[a];if(null!=b)break;
g=g.parent}this.cache[a]=b}q(b)&&(b=b.call(this.view));return b};r.prototype.clearCache=function(){this.cache={}};r.prototype.parse=function(a,b){var g=this.cache,e=g[a];if(null==e){var n;n=b||l.tags;e=a||"";"string"===typeof n&&(n=n.split(A));for(var c=z(n),f=new w(e),k=[],e=[],d=[],q=!1,m=!1,p,h,s,v;!f.eos();){p=f.pos;if(s=f.scanUntil(c[0])){v=0;for(var r=s.length;v<r;++v)if(h=s.charAt(v),C.call(D,h)?m=!0:d.push(e.length),e.push(["text",h,p,p+1]),p+=1,"\n"===h){if(q&&!m)for(;d.length;)delete e[d.pop()];
else d=[];m=q=!1}}if(!f.scan(c[0]))break;q=!0;h=f.scan(I)||"name";f.scan(G);"="===h?(s=f.scanUntil(B),f.scan(B),f.scanUntil(c[1])):"{"===h?(s=f.scanUntil(new RegExp("\\s*"+u("}"+n[1]))),f.scan(H),f.scanUntil(c[1]),h="&"):s=f.scanUntil(c[1]);if(!f.scan(c[1]))throw Error("Unclosed tag at "+f.pos);v=[h,s,p,f.pos];e.push(v);if("#"===h||"^"===h)k.push(v);else if("/"===h){h=k.pop();if(!h)throw Error('Unopened section "'+s+'" at '+p);if(h[1]!==s)throw Error('Unclosed section "'+h[1]+'" at '+p);}else"name"===
h||"{"===h||"&"===h?m=!0:"="===h&&(c=z(n=s.split(A)))}if(h=k.pop())throw Error('Unclosed section "'+h[1]+'" at '+f.pos);n=[];for(var t,f=0,k=e.length;f<k;++f)if(c=e[f])"text"===c[0]&&t&&"text"===t[0]?(t[1]+=c[1],t[3]=c[3]):(n.push(c),t=c);d=t=[];e=[];f=0;for(k=n.length;f<k;++f)switch(c=n[f],c[0]){case "#":case "^":d.push(c);e.push(c);d=c[4]=[];break;case "/":d=e.pop();d[5]=c[2];d=0<e.length?e[e.length-1][4]:t;break;default:d.push(c)}e=g[a]=t}return e};r.prototype.render=function(a,b,g){var e=this.parse(a);
b=b instanceof m?b:new m(b);return this.renderTokens(e,b,g,a)};r.prototype.renderTokens=function(a,b,g,e){function n(a){return f.render(a,b,g)}for(var c="",f=this,k,d,m=0,r=a.length;m<r;++m)switch(k=a[m],k[0]){case "#":d=b.lookup(k[1]);if(!d)continue;if(x(d))for(var p=0,h=d.length;p<h;++p)c+=this.renderTokens(k[4],b.push(d[p]),g,e);else if("object"===typeof d||"string"===typeof d)c+=this.renderTokens(k[4],b.push(d),g,e);else if(q(d)){if("string"!==typeof e)throw Error("Cannot use higher-order sections without the original template");
d=d.call(b.view,e.slice(k[3],k[5]),n);null!=d&&(c+=d)}else c+=this.renderTokens(k[4],b,g,e);break;case "^":d=b.lookup(k[1]);if(!d||x(d)&&0===d.length)c+=this.renderTokens(k[4],b,g,e);break;case ">":if(!g)continue;d=q(g)?g(k[1]):g[k[1]];null!=d&&(c+=this.renderTokens(this.parse(d),b,g,d));break;case "&":d=b.lookup(k[1]);null!=d&&(c+=d);break;case "name":d=b.lookup(k[1]);null!=d&&(c+=l.escape(d));break;case "text":c+=k[1]}return c};l.name="mustache.js";l.version="0.8.1";l.tags=["{{","}}"];var y=new r;
l.clearCache=function(){return y.clearCache()};l.parse=function(a,b){return y.parse(a,b)};l.render=function(a,b,g){return y.render(a,b,g)};l.to_html=function(a,b,g,e){a=l.render(a,b,g);if(q(e))e(a);else return a};l.escape=function(a){return String(a).replace(/[&<>"'\/]/g,function(a){return F[a]})};l.Scanner=w;l.Context=m;l.Writer=r});


/*!
 * rebind.js - Databinding for mustache.js templates 
 * https://github.com/jameswestgate/rebindjs
 * Released under the MIT license
 */

this.Rebind = this.Rebind || {};

(function(o) {

 	//Inject section tokens (as comments) to allow us to pick up dom changes accurately
 	//This allows us to leave the mustache.js source as is without modifications
 	//And still get the extra semantics needed to work out dom insertions and deletions

 	//Check mustache names with spaces are preserved in the tree
 	//if so, expand {{format x y z}} to {{#format}}x y z{{/format}} - if helper registered
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
				var inject = ['text', '<!--/-->', token[2], token[3]];
				branch.splice(i, 0, inject);

				i++;
			}
		}
	}

	//Recurse through the source dom tree and apply changes to the target
	o.mergeNodes = function(source, target, targetParent, level, index) {

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
		if (source.nodeType === 3 && target.nodeType === 3) {
			
			console.log('> Push text values - source:' + source.nodeValue + ', target:' + target.nodeValue);
			target.nodeValue = source.nodeValue;

			return;
		}

		//Element tagName changes ie <{{name}} ... >
		if (source.tagName !== target.tagName) {
			targetParent.replaceChild(source.cloneNode(true), target);
			return;
		}

		//Iterate through any child nodes
		var length = (source.childNodes.length < target.childNodes.length) ? target.childNodes.length : source.childNodes.length;

		if (length) {

			console.log('Looping child nodes:');

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
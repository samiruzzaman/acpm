(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.ecsmfModule = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

// Logging Options
var logTree = false;
var logMatch = false;
var logResult = true;





//////////////////////////////////
/////          Queue         /////
//////////////////////////////////

/*
Queue Class created by Stephen Morley - http://code.stephenmorley.org/ -
and released under the terms of the CC0 1.0 Universal legal code:

http://creativecommons.org/publicdomain/zero/1.0/legalcode
*/

module.exports = ecsmfModule; function ecsmfModule() {};

var rmq = require("range-minimum-query")

// Queue Class
function Queue() {

    // initialise the queue and offset
    var queue = [];
    var offset = 0;

    // Returns the length of the queue.
    this.getLength = function() {
    	return (queue.length - offset);
    }

    // Returns true if the queue is empty, and false otherwise.
    this.isEmpty = function() {
 	   return (queue.length == 0);
    }

    /* Enqueues the specified item. The parameter is:
     *
     * item - the item to enqueue
     */
    this.enqueue = function(item) {
  	 	queue.push(item);
    }

    /* Dequeues an item and returns it. If the queue is empty, the value
     * 'undefined' is returned.
     */
    this.dequeue = function() {
    	// if the queue is empty, return immediately
    	if (queue.length == 0) return undefined;
    		// store the item at the front of the queue
    		var item = queue[offset];

    		// increment the offset and remove the free space if necessary
    		if (++ offset * 2 >= queue.length){
    			queue  = queue.slice(offset);
     			offset = 0;
    		}

    		// return the dequeued item
    		return item;
    	}

    /* Returns the item at the front of the queue (without dequeuing it).
     * If the queue is empty then undefined is returned.
     */
    this.peek = function() {
    	return (queue.length > 0 ? queue[offset] : undefined);
    }
}





//////////////////////////////////
/////          Node          /////
//////////////////////////////////

// Node Class
var Node = function(word, totalWordCount) {
	this.word = new Array(totalWordCount); // References to strings used to determine label
	this.word[0] = word;
	this.currentWordCount = 1; // Counts number of words used to determine label currently stored
	this.isFullWord = false; // True if node label occurs in word list
	this.parent = undefined; // Reference to parent node
	this.children = new Array(256); // Array of references to child nodes

	this.depth = Infinity; // Depth of node in tree (also length of label)
	this.suffixLink = undefined; // Reference to suffix link node
	this.dictSuffixLink = undefined; // Reference to dict suffix link node
}

// Method for Node Class: Return string representation of node label
Node.prototype.label = function() {
	label = "";

	for (var i = 0; i < this.depth; ++i) {
		label += this.word[0][i];
	}

	return label;
}

// Method for Node Class: Print data associated with node
Node.prototype.print = function() {
	console.log("\n");

	// Label
	console.log("label: " + this.label());

	// Word
	if (this.word[0]) {
		var words = ""
		for (var i = 0; i < this.currentWordCount; ++i) {
			words += this.word[i].join('') + " "
		}
		console.log("word: " + words);
	}
	else {
		console.log("word: " + "undefined");
	}
	
	// Depth
	console.log("depth: " + this.depth);

	// isFullWord
	console.log("isFullWord: " + this.isFullWord);

	// Parent
	if (this.parent) {
		console.log("parent: " + this.parent.label());
	}
	else {
		console.log("parent: " + undefined);
	}
	
	// Children
	childrenList = [];

	for (var i = 0; i < this.children.length; ++i) {
		if (this.children[i]) {
			childrenList.push(String.fromCharCode(i)); 
		}
	}

	console.log("children: " + childrenList);

	// suffixLink
	if (this.suffixLink) {
		console.log("suffixLink: " + this.suffixLink.label());
	}
	else {
		console.log("suffixLink: " + undefined);
	}

	// dictSuffixLine
	if (this.dictSuffixLink) {
		console.log("dictSuffixLink: " + this.dictSuffixLink.label());
	}
	else {
		console.log("dictSuffixLink: " + undefined);
	}

	console.log("\n");
}





//////////////////////////////////
/////    Aho–Corasick Trie   /////
//////////////////////////////////

// Trie Class
var Trie = function(wordList) {
	this.root = new Node(undefined);
	this.wordCount = wordList.length;

	// Build basic Trie by adding them to a rood node
	var position = 0;
	for (var i = 0; i < wordList.length; ++i) {
		// Store fragment position within x
		wordList[i].px = position;
		position += wordList[i].length;

		// Add word to trie
		this.add(wordList[i]);
	}

	// Perform breadth first search of Trie and assign
	// values to depth, suffixLink and dictSuffixLink
	var Q = new Queue();

	this.root.depth = 0;
	this.root.suffixLink = undefined;
	this.root.dictSuffixLink = undefined;

	if (logTree) {this.root.print();}

	Q.enqueue(this.root);

	while (Q.getLength() > 0) {
		var current = Q.dequeue();

		for (var i = 0; i < current.children.length; ++i) {
			var child = current.children[i];

			if (child) {
				if (child.depth === Infinity) {
					child.depth = current.depth + 1;
					Q.enqueue(child);

					// Node is accessed by DFS:
					// suffixLink and dictSuffixLink are calculated here

					// Calculating suffixLink
					var traverseNode = child.parent.suffixLink;
					var incomingCharCode = child.word[0][child.depth - 1].charCodeAt(0);

					while (traverseNode && !traverseNode.children[incomingCharCode]) {
						traverseNode = traverseNode.suffixLink;
					}

					if (traverseNode) {
						child.suffixLink = traverseNode.children[incomingCharCode];
					}
					else {
						child.suffixLink = this.root;
					}
					
					// Calculating dictDuffixLink
					traverseNode = child.suffixLink;

					while (traverseNode && !traverseNode.isFullWord) {
						traverseNode = traverseNode.suffixLink;
					}

					child.dictSuffixLink = traverseNode;

					if (logTree) {child.print();}
				}
			}
		}
	}
}

// Method for Node Class: Add word (in the form of a character array) to tree
Trie.prototype.add = function(word) {
	var currentParent = this.root;
	var currentChild = undefined;

	for (var i = 0; i < word.length; ++i) {
		var charCode = word[i].charCodeAt(0);
		currentChild = currentParent.children[charCode];

		if (!currentChild) {
			currentChild = new Node(word, this.wordCount);
			currentChild.parent = currentParent;
			currentParent.children[charCode] = currentChild;
		}
		else {
			// Maintain word associated with a node to be
			// shortest possible word
			if (word.length < currentChild.word[0].length) {
				currentChild.word[0] = word;
				currentChild.currentWordCount = 1;
			}
			else if (word.length = currentChild.word[0].length) {
				currentChild.word[currentChild.currentWordCount] = word;
				currentChild.currentWordCount++;
			}
		}

		currentParent = currentChild;
	}

	currentParent.isFullWord = true;
}

// Method for Trie Class: Print data associated with node
Trie.prototype.query = function(text) {
	var	matches = new Queue();

	var traverseNode = this.root;

	for (var i = 0; i < text.length; ++i) {
		var charCode = text[i].charCodeAt(0);

		// Traverse the tree
		while (traverseNode && !traverseNode.children[charCode]) {
			traverseNode = traverseNode.suffixLink;
		}

		if (traverseNode) {
			traverseNode = traverseNode.children[charCode];
		}
		else {
			traverseNode = this.root;
		}

		// Print any matches at current node
		var reportNode = traverseNode

		do {
			if (reportNode.isFullWord) {
				for (var j = 0; j < reportNode.currentWordCount; ++j) {
					matches.enqueue({"px"   : reportNode.word[j].px,
						             "l"    : reportNode.word[j].length,
						             "pt"   : i - reportNode.word[j].length + 1,
					                 "word" : reportNode.word[j],});
				}
			}
			reportNode = reportNode.dictSuffixLink;
		} while (reportNode)
	}

	return matches;
}





//////////////////////////////////
/////    ECSMF Algorithm     /////
//////////////////////////////////

// Node Class
ecsmfModule.prototype.ecsmf = function(text, pattern) {

	// Construct string x = text[0 ... m-1]text[0 ... m-2]
	// Then split x into 4 fragments
	var m = pattern.length;

	// Initialise space for 4 fragments
	var fragmentList = new Array(4);
	var minorLength = Math.floor((2 * m - 1) / 4);
	var majorLength = minorLength + 1;

	// Function fills 'destination' array with 'length' characters from source
	// starting at index 'start'. If end of 'source' is reached, copying resumes
	// from beginning of 'source'.
	var fillArray = function(destination, source, start, length) {
		for (var i = 0; i < length; ++i) {
			destination[i] = source[(start + i) % source.length];
		}
	}

	// Determine lengths of fragments of x
	var fragmentLengths;

	// Even pattern length
	if (pattern.length % 2 === 0) {
		fragmentLengths = [majorLength, minorLength, majorLength, majorLength];
	}
	// Odd pattern length
	else {
		fragmentLengths = [majorLength, minorLength, minorLength, minorLength];
	}

	// Fill 4 fragments
	var start = 0;
	for (var i = 0; i < 4; ++i) {
		var length = fragmentLengths[i];
		fragmentList[i] = new Array(length);
		fillArray(fragmentList[i], pattern, start, length);
		start += length;
	}

	if (logTree) {
		console.log(fragmentList[0]);
		console.log(fragmentList[1]);
		console.log(fragmentList[2]);
		console.log(fragmentList[3]);
 	}

	// Match 4 fragments against Aho-Corasick Algorithm
	var t = new Trie(fragmentList);
	var matches = t.query(text);


	// Compute SA, iSA, LCP, RMQ for x't and reverse of tx'
	var K = 255;
	var n = text.length;
	var extendedLength = n + m + (m - 1);


	var T = new Array(extendedLength + 3)

	for (var i = 0; i < m; ++i) {
		T[i] = pattern[i].charCodeAt(0);
	}
	for (var i = m; i < m + (m - 1); ++i) {
		T[i] = pattern[i - m].charCodeAt(0);
	}
	for (var i = m + (m - 1); i < m + (m - 1) + n; ++i) {
		T[i] = text[i - (m + (m - 1))].charCodeAt(0);
	}
	T[extendedLength] = 0;
	T[extendedLength + 1] = 0;
	T[extendedLength + 2] = 0;


	var Tr = new Array(extendedLength + 3)

	for (var i = 0; i < (m - 1); ++i) {
		Tr[i] = pattern[(m - 2) - i].charCodeAt(0);
	}
	for (var i = (m - 1); i < (m - 1) + m; ++i) {
		Tr[i] = pattern[(m - 1) + (m - 1) - i].charCodeAt(0);
	}
	for (var i = (m - 1) + m; i < (m - 1) + m + n; ++i) {
		Tr[i] = text[(n - 1) + ((m - 1) + m) - i].charCodeAt(0);
	}
	Tr[extendedLength] = 0;
	Tr[extendedLength + 1] = 0;
	Tr[extendedLength + 2] = 0;

	if (logMatch) {
		console.log("T", T)
		console.log("Tr", Tr)
	}

	// Building SA, iSA, lcp, rmq for T
	var T_SA = new Array(extendedLength);
	suffixArray(T, T_SA, extendedLength, K);

	var T_iSA = new Array(extendedLength);
	invertArray(T_SA, T_iSA);

	var T_lcp = new Array(extendedLength);
	lcpArray(T_lcp, T, T_SA, T_iSA)

	var T_rmq = rmq(T_lcp);

	// Building SA, iSA, lcp, rmq for Tr
	var Tr_SA = new Array(extendedLength);
	suffixArray(Tr, Tr_SA, extendedLength, K);

	var Tr_iSA = new Array(extendedLength);
	invertArray(Tr_SA, Tr_iSA);

	var Tr_lcp = new Array(extendedLength);
	lcpArray(Tr_lcp, Tr, Tr_SA, Tr_iSA)

	var Tr_rmq = rmq(Tr_lcp);


	if (logMatch) {
		var s = "";
		for (var i = 0; i < T_SA.length; ++i) {
			s += T_SA[i] + ", ";
		}
		if (logMatch) {console.log("T_SA", s);}

		s = "";
		for (var i = 0; i < T_iSA.length; ++i) {
			s += T_iSA[i] + ", ";
		}
		if (logMatch) {console.log("T_iSA", s);}

		s = "";
		for (var i = 0; i < T_lcp.length; ++i) {
			s += T_lcp[i] + ", ";
		}
		if (logMatch) {console.log("T_lcp", s);}


		s = "";
		for (var i = 0; i < Tr_SA.length; ++i) {
			s += Tr_SA[i] + ", ";
		}
		if (logMatch) {console.log("Tr_SA", s);}

		s = "";
		for (var i = 0; i < Tr_iSA.length; ++i) {
			s += Tr_iSA[i] + ", ";
		}
		if (logMatch) {console.log("Tr_iSA", s);}

		s = "";
		for (var i = 0; i < Tr_lcp.length; ++i) {
			s += Tr_lcp[i] + ", ";
		}
		console.log("Tr_lcp", s);
	}

	// Longest Common Extension function for T
	var T_lce = function(p, q) {
		var T_length = (2 * m) - 1 + n;

		if (p === T_length || q === T_length) {
			if (logMatch) {console.log("Large p, q return 0");}
			return 0;
		}

		var p_iSA = T_iSA[p];
		var q_iSA = T_iSA[q];

		if (logMatch) {console.log("T: p_iSA, q_iSA", p_iSA, q_iSA);}

		if (logMatch) {
			if (p_iSA < q_iSA) {
				console.log("T: no reorder");
			}
			else {
				console.log("T: reorder");
			}
		}

		// Order p_iSA and q_iSA so smallest on left and largest on right
		var lower = Math.min(p_iSA, q_iSA);
		var upper = Math.max(p_iSA, q_iSA);

		if (logMatch) {
			console.log("lower, upper", lower, upper);
			console.log("T_rmq(lower + 1, upper + 1)", T_rmq(lower + 1, upper + 1));
			console.log("T_lcp[T_rmq(lower + 1, upper + 1)]", T_lcp[T_rmq(lower + 1, upper + 1)]);
		}

		return T_lcp[T_rmq(lower + 1, upper + 1)]; // Use upper + 1 so RMQ includes final index in range
	}

	// Longest Common Extension function for Tr
	var Tr_lce = function(p, q) {
		var Tr_length = (2 * m) - 1 + n;

		if (p === Tr_length || q === Tr_length) {
			if (logMatch) {console.log("Large p, q return 0");}
			return 0;
		}

		var p_iSA = Tr_iSA[p];
		var q_iSA = Tr_iSA[q];

		if (logMatch) {console.log("Tr: p_iSA, q_iSA", p_iSA, q_iSA);}

		if (logMatch) {
			if (p_iSA < q_iSA) {
				console.log("Tr: no reorder");
			}
			else {
				console.log("Tr: reorder");
			}
		}

		// Order p_iSA and q_iSA so smallest on left and largest on right
		var lower = Math.min(p_iSA, q_iSA);
		var upper = Math.max(p_iSA, q_iSA);

		if (logMatch) {
			console.log("lower, upper", lower, upper);
			console.log("Tr_rmq(lower + 1, upper + 1)", Tr_rmq(lower + 1, upper + 1));
			console.log("Tr_lcp[Tr_rmq(lower + 1, upper + 1)]", Tr_lcp[Tr_rmq(lower + 1, upper + 1)]);
		}

		return Tr_lcp[Tr_rmq(lower + 1, upper + 1)]; // Use upper + 1 so RMQ includes final index in range
	}
	
	// Initialise queue to store final match locations
	var finalQueue = new Queue();

	// Determine final match locations
	while (!matches.isEmpty()) {
		if (logMatch) {console.log("\n\nNEXTMATCH\n\n");}

		var match = matches.dequeue();

		if (logMatch) {console.log("px:" + match["px"] + " | " + "l:" + match["l"] + " | " + "pt:" + match["pt"] + " | " + match["word"].join(''));}

		var px = match.px;
		var l = match.l;
		var pt = match.pt;

		if (logMatch) {console.log("px, l, pt", px, l, pt);}

		var a = px + l;
		var b = (2 * m) - 1 + pt + l;

		if (logMatch) {
			console.log("\nT: px + l", a);
			console.log("T: (2 * m) - 1 + pt + l", b);
			console.log("CALCULATING epsilon_r: DO T_lce on", a, b);
		}

		//var epsilon_r = T_lce(a, b); 
		var epsilon_r = Math.min(T_lce(a, b), (2 * m) - 1 - px - l);

		var a = (2 * m) - 1 - px;
		var b = (2 * m) - 1 + n - pt;

		if (logMatch) {
			console.log("\nTr: (2 * m) - 1 - px", a);
			console.log("Tr: (2 * m) - 1 + n - pt", b);
			console.log("CALCULATING epsilon_l: DO Tr_lce on", a, b);
		}

		//var epsilon_l = Tr_lce(a, b);
		var epsilon_l = Math.min(Tr_lce(a, b), px);
		var checkValue = epsilon_l + l + epsilon_r;

		if (logMatch) {
			console.log("\nepsilon_r, epsilon_l", "[", epsilon_r, epsilon_l, "]");
			console.log("checkValue eps_l + l + eps_r:", checkValue);
		}

		if (checkValue >= m) {
			var maximum = Math.max(pt - epsilon_l, pt + l - m);
			var minimum = Math.min(pt + l - m + epsilon_r, pt);

			if (logMatch) {
				console.log("checkValue >= m (", m, ")");
				console.log("maximum, minimum", maximum, minimum);
			}

			for (var i = maximum; i <= minimum; ++i) {
				finalQueue.enqueue(i);
			}
		}
	}

	var finalArray = new Array(finalQueue.getLength());
	var finalUniqueQueue = new Queue();

	var i = 0
	while (!finalQueue.isEmpty()) {
		finalArray[i] = finalQueue.dequeue();
		i++;
	}

	var uniqueArray = finalArray.filter(function(elem, pos) {
	  	return finalArray.indexOf(elem) == pos;
	});

	if (logResult) {
		var s = "[";

		for (var i = 0; i < uniqueArray.length; ++i) {
			s += uniqueArray[i] + ", ";
		}

		s = s.substring(0, s.length - 2);
		s += "]";

		console.log("FINAL MATCH LOCATIONS:", s);
	}

	for (var i = 0; i < uniqueArray.length; ++i) {
		finalUniqueQueue.enqueue(uniqueArray[i]);
	}

	return finalUniqueQueue;
}





//////////////////////////////////
/////      SA Algorithm      /////
//////////////////////////////////

/*
SA Algorithm based on a C algorithm created by Juha Kärkkäinen and Peter Sanders
as described in their paper Simple Linear Work Suffix Array Construction -
http://www.mpi-sb.mpg.de/~sanders/programs/suffix/drittel.C
*/

var leqPair = function(a1, a2, b1, b2) {
	return (a1 < b1 || (a1 === b1 && a2 <= b2));
}

var leqTriple = function(a1, a2, a3, b1, b2, b3) {
	return (a1 < b1 || (a1 === b1 && leqPair(a2, a3, b2, b3)));
}

var radixPass = function(a, b, r, start, n, K) {
	var c = new Array(K + 1);
	for (var i = 0; i <= K; ++i) { c[i] = 0; }
	for (var i = 0; i < n; ++i) { c[r[start + a[i]]]++; }

	var sum = 0;
	for (var i = 0; i <= K; ++i) {
		var t = c[i];
		c[i] = sum;
		sum += t;
	}

	for (var i = 0; i < n; ++i) { b[c[r[start + a[i]]]++] = a[i]; }

	c = null;
}

var suffixArray = function(s, SA, n, K) {

	var n0 = Math.floor((n + 2) / 3);
	var n1 = Math.floor((n + 1) / 3);
	var n2 = Math.floor(n / 3);
	n02 = n0 + n2

	var s12 = new Array(n02 + 3);
	s12[n02] = 0;
	s12[n02 + 1] = 0;
	s12[n02 + 2] = 0;

	var SA12 = new Array(n02 + 3);
	SA12[n02] = 0;
	SA12[n02 + 1] = 0;
	SA12[n02 + 2] = 0;

	var s0 = new Array(n0);
	var SA0 = new Array(n0);

	// Generate positions of mod 1 and mod 2 suffixes
	// The "+ (n0 - n1)" adds a dummy mod 1 suffix if (n % 3) === 1
	var j = 0;
	for (var i = 0; i < n + (n0 - n1); ++i) {
		if (i % 3 != 0) {
			s12[j++] = i;
		}
	}

	// LSB radix sort the mod 1 and mod 2 triples
  	radixPass(s12 , SA12, s, 2, n02, K);
  	radixPass(SA12, s12 , s, 1, n02, K);  
  	radixPass(s12 , SA12, s, 0, n02, K);

	// Find lexicographic names of triples
	var name = 0;
	var c0 = -1;
	var c1 = -1;
	var c2 = -1;

  	for (var i = 0; i < n02; ++i) {
    	if (s[SA12[i]] != c0 || s[SA12[i] + 1] != c1 || s[SA12[i] + 2] != c2) { 
      		name++;
      		c0 = s[SA12[i]];
      		c1 = s[SA12[i] + 1];
      		c2 = s[SA12[i] + 2];
	    }
	    if (SA12[i] % 3 === 1) {
	    	s12[Math.floor(SA12[i] / 3)] = name;
	    } // Left half
	    else {
	    	s12[Math.floor(SA12[i] / 3 + n0)] = name;
	    } // Right half
	}

	// Recurse if names are not yet unique
  	if (name < n02) {
		var temp = n02;
    	suffixArray(s12, SA12, n02, name);
    	n02 = temp;

    	// Store unique names in s12 using the suffix array 
    	for (var i = 0; i < n02; ++i) {
    		s12[SA12[i]] = i + 1;
    	}
  	}
  	else {
  		// Generate the suffix array of s12 directly
		for (var i = 0; i < n02; ++i) {
			SA12[s12[i] - 1] = i;
		}
  	}

	// Stably sort the mod 0 suffixes from SA12 by their first character
	var j = 0;
  	for (var i = 0; i < n02; ++i) {
  		if (SA12[i] < n0) {
  			s0[j++] = 3 * SA12[i];
  		}
  	}
  	
  	radixPass(s0, SA0, s, 0, n0, K);
    
	// Helper function
	var getI = function(SA12, n0, t) {
		if (SA12[t] < n0) {
			return SA12[t] * 3 + 1
		}
		else {
			return (SA12[t] - n0) * 3 + 2;
		}
	}

	// Merge sorted SA0 suffixes and sorted SA12 suffixes
	var p = 0;
	var t = n0 - n1;
    for (var k = 0; k < n; k++) {
		var i = getI(SA12, n0, t); // Pos of current offset 12 suffix
		var j = SA0[p]; // Pos of current offset 0  suffix

		var condition;
		if (SA12[t] < n0) {
			condition = leqPair(s[i], s12[SA12[t] + n0],
				                s[j], s12[Math.floor(j / 3)]);
		}
		else {
			condition = leqTriple(s[i], s[i + 1], s12[SA12[t] - n0 + 1],
				                  s[j], s[j + 1], s12[Math.floor(j / 3 + n0)]);
		}

		if (condition) {
			// Suffix from SA12 is smaller
		  	SA[k] = i;
		  	t++;
		  	if (t === n02) {
		  		// Done --- only SA0 suffixes left
		    	for (k++; p < n0; p++, k++) {
		    		SA[k] = SA0[p];
		    	}
		  	}
		}
		else { 
			SA[k] = j;
			p++; 
			if (p === n0) {
				// Done --- only SA12 suffixes left
		    	for (k++; t < n02; t++, k++) {
		    		SA[k] = getI(SA12, n0, t);
		    	}
			}
		}  
    }

    s12 = null;
    SA12 = null;
    SA0 = null;
    s0 = null;
}





//////////////////////////////////
/////     LCP Algorithm      /////
//////////////////////////////////

var lcpArray = function(lcp, s, SA, iSA) {
	var n = s.length;

	var l = 0;
	for (var i = 0; i < n; ++i) {
		var k = iSA[i];
		var j = SA[k - 1];

		while (s[i + l] === s[j + l]) {
			l++;
		}

		lcp[k] = l;

		if (l > 0) {
			l--;
		}
	}
}





//////////////////////////////////
/////    Helper Functions    /////
//////////////////////////////////

var invertArray = function(originalArray, inverseArray) {
	for (var i = 0; i < originalArray.length; ++i) {
		inverseArray[originalArray[i]] = i;
	}
}

var logArray = function(array, name, n) {
	var s = "\n" + name + ": ";
	for (var i = 0; i < n; ++i) {
		s += array[i] + ", ";
	}
	s += "\n";
	console.log(s);
}

},





//////////////////////////////////
/////  Range Minimum Query   /////
//////////////////////////////////

/*
Range Minimum Query functions from Mikola Lysenko -
https://github.com/mikolalysenko/range-minimum-query 
*/

{"range-minimum-query":7}],2:[function(require,module,exports){
"use strict"

module.exports = makeCartesianTree

function CartesianTreeNode(value, index) {
  this.value = value
  this.index = index
}

function makeCartesianTree(array, compare) {
  if(array.length === 0) {
    return {
      root: null,
      nodes: []
    }
  }

  var count = array.length
  var spine = []
  var nodes = new Array(count)

  compare = compare || function defaultCompare(a,b) {
    if(a < b) { return -1 }
    if(a > b) { return 1 }
    return 0
  }

  for(var i=0; i<count; ++i) {
    var node = new CartesianTreeNode(array[i], i)
    nodes[i] = node
    var last = null
    while(spine.length > 0) {
      var top = spine[spine.length-1]
      if(compare(top.value, node.value) >= 0) {
        last = spine.pop()
      } else {
        break
      }
    }
    if(last) {
      node.left = last
    }
    if(spine.length > 0) {
      spine[spine.length-1].right = node
    }
    spine.push(node)
  }

  return {
    root: spine[0],
    nodes: nodes
  }
}
},{}],3:[function(require,module,exports){
"use strict"

module.exports = preprocessTree

var dup = require("dup")
var bits = require("bit-twiddle")
var weakMap = typeof WeakMap === "undefined" ? require("weakmap") : WeakMap

function buildIntervals(depths, nodes) {
  var n = depths.length
  var maxHeight = bits.log2(n)+1
  var result = dup([n, maxHeight], 0)
  for(var i=n-1; i>=0; --i) {
    var levels = result[i]
    levels[0] = i
    var h = depths[i]
    for(var j=1; j<maxHeight; ++j) {
      var d = i + (1<<(j-1))
      if(d >= n) {
        for(; j<maxHeight; ++j) {
          levels[j] = levels[j-1]
        }
        break
      }
      var x = result[d][j-1]
      var hx = depths[x]
      if(hx < h) {
        h = hx
        levels[j] = x
      } else {
        levels[j] = levels[j-1]
      }
    }
  }
  return result
}

function preprocessTree(root, filter) {
  var depths, intervals, nodes, lcaData

  function rebuildDataStructure() {
    depths = []
    nodes = []
    if(lcaData && lcaData.clear) {
      lcaData.clear()
    } else {
      lcaData = new weakMap()
    }
    function visit(node, depth) {
      lcaData.set(node, depths.length)
      depths.push(depth)
      nodes.push(node)
      var keys = Object.keys(node)
      for(var i=0; i<keys.length; ++i) {
        var child = node[keys[i]]
        if((typeof child === "object") && (child !== null)) {
          if(filter && !filter(node, keys[i])) {
            continue
          }
          visit(child, depth+1)
          depths.push(depth)
          nodes.push(node)
        }
      }
    }
    visit(root, 0)
    intervals = buildIntervals(depths, nodes)
  }

  function leastCommonAncestor(a, b) {
    var aIndex = lcaData.get(a)
    var bIndex = lcaData.get(b)
    var lo = Math.min(aIndex, bIndex)
    var hi = Math.max(aIndex, bIndex)
    var d = hi - lo
    if(d === 0) {
      return a
    }
    var l = bits.log2(d)
    var x = intervals[lo][l]
    var y = intervals[hi - (1<<l) + 1][l]
    if(depths[x] < depths[y]) {
      return nodes[x]
    } else {
      return nodes[y]
    }
  }
  leastCommonAncestor.rebuild = rebuildDataStructure

  rebuildDataStructure()
  return leastCommonAncestor
}
},{"bit-twiddle":4,"dup":5,"weakmap":6}],4:[function(require,module,exports){
/**
 * Bit twiddling hacks for JavaScript.
 *
 * Author: Mikola Lysenko
 *
 * Ported from Stanford bit twiddling hack library:
 *    http://graphics.stanford.edu/~seander/bithacks.html
 */

"use strict"; "use restrict";

//Number of bits in an integer
var INT_BITS = 32;

//Constants
exports.INT_BITS  = INT_BITS;
exports.INT_MAX   =  0x7fffffff;
exports.INT_MIN   = -1<<(INT_BITS-1);

//Returns -1, 0, +1 depending on sign of x
exports.sign = function(v) {
  return (v > 0) - (v < 0);
}

//Computes absolute value of integer
exports.abs = function(v) {
  var mask = v >> (INT_BITS-1);
  return (v ^ mask) - mask;
}

//Computes minimum of integers x and y
exports.min = function(x, y) {
  return y ^ ((x ^ y) & -(x < y));
}

//Computes maximum of integers x and y
exports.max = function(x, y) {
  return x ^ ((x ^ y) & -(x < y));
}

//Checks if a number is a power of two
exports.isPow2 = function(v) {
  return !(v & (v-1)) && (!!v);
}

//Computes log base 2 of v
exports.log2 = function(v) {
  var r, shift;
  r =     (v > 0xFFFF) << 4; v >>>= r;
  shift = (v > 0xFF  ) << 3; v >>>= shift; r |= shift;
  shift = (v > 0xF   ) << 2; v >>>= shift; r |= shift;
  shift = (v > 0x3   ) << 1; v >>>= shift; r |= shift;
  return r | (v >> 1);
}

//Computes log base 10 of v
exports.log10 = function(v) {
  return  (v >= 1000000000) ? 9 : (v >= 100000000) ? 8 : (v >= 10000000) ? 7 :
          (v >= 1000000) ? 6 : (v >= 100000) ? 5 : (v >= 10000) ? 4 :
          (v >= 1000) ? 3 : (v >= 100) ? 2 : (v >= 10) ? 1 : 0;
}

//Counts number of bits
exports.popCount = function(v) {
  v = v - ((v >>> 1) & 0x55555555);
  v = (v & 0x33333333) + ((v >>> 2) & 0x33333333);
  return ((v + (v >>> 4) & 0xF0F0F0F) * 0x1010101) >>> 24;
}

//Counts number of trailing zeros
function countTrailingZeros(v) {
  var c = 32;
  v &= -v;
  if (v) c--;
  if (v & 0x0000FFFF) c -= 16;
  if (v & 0x00FF00FF) c -= 8;
  if (v & 0x0F0F0F0F) c -= 4;
  if (v & 0x33333333) c -= 2;
  if (v & 0x55555555) c -= 1;
  return c;
}
exports.countTrailingZeros = countTrailingZeros;

//Rounds to next power of 2
exports.nextPow2 = function(v) {
  v += v === 0;
  --v;
  v |= v >>> 1;
  v |= v >>> 2;
  v |= v >>> 4;
  v |= v >>> 8;
  v |= v >>> 16;
  return v + 1;
}

//Rounds down to previous power of 2
exports.prevPow2 = function(v) {
  v |= v >>> 1;
  v |= v >>> 2;
  v |= v >>> 4;
  v |= v >>> 8;
  v |= v >>> 16;
  return v - (v>>>1);
}

//Computes parity of word
exports.parity = function(v) {
  v ^= v >>> 16;
  v ^= v >>> 8;
  v ^= v >>> 4;
  v &= 0xf;
  return (0x6996 >>> v) & 1;
}

var REVERSE_TABLE = new Array(256);

(function(tab) {
  for(var i=0; i<256; ++i) {
    var v = i, r = i, s = 7;
    for (v >>>= 1; v; v >>>= 1) {
      r <<= 1;
      r |= v & 1;
      --s;
    }
    tab[i] = (r << s) & 0xff;
  }
})(REVERSE_TABLE);

//Reverse bits in a 32 bit word
exports.reverse = function(v) {
  return  (REVERSE_TABLE[ v         & 0xff] << 24) |
          (REVERSE_TABLE[(v >>> 8)  & 0xff] << 16) |
          (REVERSE_TABLE[(v >>> 16) & 0xff] << 8)  |
           REVERSE_TABLE[(v >>> 24) & 0xff];
}

//Interleave bits of 2 coordinates with 16 bits.  Useful for fast quadtree codes
exports.interleave2 = function(x, y) {
  x &= 0xFFFF;
  x = (x | (x << 8)) & 0x00FF00FF;
  x = (x | (x << 4)) & 0x0F0F0F0F;
  x = (x | (x << 2)) & 0x33333333;
  x = (x | (x << 1)) & 0x55555555;

  y &= 0xFFFF;
  y = (y | (y << 8)) & 0x00FF00FF;
  y = (y | (y << 4)) & 0x0F0F0F0F;
  y = (y | (y << 2)) & 0x33333333;
  y = (y | (y << 1)) & 0x55555555;

  return x | (y << 1);
}

//Extracts the nth interleaved component
exports.deinterleave2 = function(v, n) {
  v = (v >>> n) & 0x55555555;
  v = (v | (v >>> 1))  & 0x33333333;
  v = (v | (v >>> 2))  & 0x0F0F0F0F;
  v = (v | (v >>> 4))  & 0x00FF00FF;
  v = (v | (v >>> 16)) & 0x000FFFF;
  return (v << 16) >> 16;
}


//Interleave bits of 3 coordinates, each with 10 bits.  Useful for fast octree codes
exports.interleave3 = function(x, y, z) {
  x &= 0x3FF;
  x  = (x | (x<<16)) & 4278190335;
  x  = (x | (x<<8))  & 251719695;
  x  = (x | (x<<4))  & 3272356035;
  x  = (x | (x<<2))  & 1227133513;

  y &= 0x3FF;
  y  = (y | (y<<16)) & 4278190335;
  y  = (y | (y<<8))  & 251719695;
  y  = (y | (y<<4))  & 3272356035;
  y  = (y | (y<<2))  & 1227133513;
  x |= (y << 1);
  
  z &= 0x3FF;
  z  = (z | (z<<16)) & 4278190335;
  z  = (z | (z<<8))  & 251719695;
  z  = (z | (z<<4))  & 3272356035;
  z  = (z | (z<<2))  & 1227133513;
  
  return x | (z << 2);
}

//Extracts nth interleaved component of a 3-tuple
exports.deinterleave3 = function(v, n) {
  v = (v >>> n)       & 1227133513;
  v = (v | (v>>>2))   & 3272356035;
  v = (v | (v>>>4))   & 251719695;
  v = (v | (v>>>8))   & 4278190335;
  v = (v | (v>>>16))  & 0x3FF;
  return (v<<22)>>22;
}

//Computes next combination in colexicographic order (this is mistakenly called nextPermutation on the bit twiddling hacks page)
exports.nextCombination = function(v) {
  var t = v | (v - 1);
  return (t + 1) | (((~t & -~t) - 1) >>> (countTrailingZeros(v) + 1));
}


},{}],5:[function(require,module,exports){
"use strict"

function dupe_array(count, value, i) {
  var c = count[i]|0
  if(c <= 0) {
    return []
  }
  var result = new Array(c), j
  if(i === count.length-1) {
    for(j=0; j<c; ++j) {
      result[j] = value
    }
  } else {
    for(j=0; j<c; ++j) {
      result[j] = dupe_array(count, value, i+1)
    }
  }
  return result
}

function dupe_number(count, value) {
  var result, i
  result = new Array(count)
  for(i=0; i<count; ++i) {
    result[i] = value
  }
  return result
}

function dupe(count, value) {
  if(typeof value === "undefined") {
    value = 0
  }
  switch(typeof count) {
    case "number":
      if(count > 0) {
        return dupe_number(count|0, value)
      }
    break
    case "object":
      if(typeof (count.length) === "number") {
        return dupe_array(count, value, 0)
      }
    break
  }
  return []
}

module.exports = dupe
},{}],6:[function(require,module,exports){
/* (The MIT License)
 *
 * Copyright (c) 2012 Brandon Benvie <http://bbenvie.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
 * associated documentation files (the 'Software'), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge, publish, distribute,
 * sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included with all copies or
 * substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
 * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY  CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

// Original WeakMap implementation by Gozala @ https://gist.github.com/1269991
// Updated and bugfixed by Raynos @ https://gist.github.com/1638059
// Expanded by Benvie @ https://github.com/Benvie/harmony-collections

void function(global, undefined_, undefined){
  var getProps = Object.getOwnPropertyNames,
      defProp  = Object.defineProperty,
      toSource = Function.prototype.toString,
      create   = Object.create,
      hasOwn   = Object.prototype.hasOwnProperty,
      funcName = /^\n?function\s?(\w*)?_?\(/;


  function define(object, key, value){
    if (typeof key === 'function') {
      value = key;
      key = nameOf(value).replace(/_$/, '');
    }
    return defProp(object, key, { configurable: true, writable: true, value: value });
  }

  function nameOf(func){
    return typeof func !== 'function'
          ? '' : 'name' in func
          ? func.name : toSource.call(func).match(funcName)[1];
  }

  // ############
  // ### Data ###
  // ############

  var Data = (function(){
    var dataDesc = { value: { writable: true, value: undefined } },
        datalock = 'return function(k){if(k===s)return l}',
        uids     = create(null),

        createUID = function(){
          var key = Math.random().toString(36).slice(2);
          return key in uids ? createUID() : uids[key] = key;
        },

        globalID = createUID(),

        storage = function(obj){
          if (hasOwn.call(obj, globalID))
            return obj[globalID];

          if (!Object.isExtensible(obj))
            throw new TypeError("Object must be extensible");

          var store = create(null);
          defProp(obj, globalID, { value: store });
          return store;
        };

    // common per-object storage area made visible by patching getOwnPropertyNames'
    define(Object, function getOwnPropertyNames(obj){
      var props = getProps(obj);
      if (hasOwn.call(obj, globalID))
        props.splice(props.indexOf(globalID), 1);
      return props;
    });

    function Data(){
      var puid = createUID(),
          secret = {};

      this.unlock = function(obj){
        var store = storage(obj);
        if (hasOwn.call(store, puid))
          return store[puid](secret);

        var data = create(null, dataDesc);
        defProp(store, puid, {
          value: new Function('s', 'l', datalock)(secret, data)
        });
        return data;
      }
    }

    define(Data.prototype, function get(o){ return this.unlock(o).value });
    define(Data.prototype, function set(o, v){ this.unlock(o).value = v });

    return Data;
  }());


  var WM = (function(data){
    var validate = function(key){
      if (key == null || typeof key !== 'object' && typeof key !== 'function')
        throw new TypeError("Invalid WeakMap key");
    }

    var wrap = function(collection, value){
      var store = data.unlock(collection);
      if (store.value)
        throw new TypeError("Object is already a WeakMap");
      store.value = value;
    }

    var unwrap = function(collection){
      var storage = data.unlock(collection).value;
      if (!storage)
        throw new TypeError("WeakMap is not generic");
      return storage;
    }

    var initialize = function(weakmap, iterable){
      if (iterable !== null && typeof iterable === 'object' && typeof iterable.forEach === 'function') {
        iterable.forEach(function(item, i){
          if (item instanceof Array && item.length === 2)
            set.call(weakmap, iterable[i][0], iterable[i][1]);
        });
      }
    }


    function WeakMap(iterable){
      if (this === global || this == null || this === WeakMap.prototype)
        return new WeakMap(iterable);

      wrap(this, new Data);
      initialize(this, iterable);
    }

    function get(key){
      validate(key);
      var value = unwrap(this).get(key);
      return value === undefined_ ? undefined : value;
    }

    function set(key, value){
      validate(key);
      // store a token for explicit undefined so that "has" works correctly
      unwrap(this).set(key, value === undefined ? undefined_ : value);
    }

    function has(key){
      validate(key);
      return unwrap(this).get(key) !== undefined;
    }

    function delete_(key){
      validate(key);
      var data = unwrap(this),
          had = data.get(key) !== undefined;
      data.set(key, undefined);
      return had;
    }

    function toString(){
      unwrap(this);
      return '[object WeakMap]';
    }

    try {
      var src = ('return '+delete_).replace('e_', '\\u0065'),
          del = new Function('unwrap', 'validate', src)(unwrap, validate);
    } catch (e) {
      var del = delete_;
    }

    var src = (''+Object).split('Object');
    var stringifier = function toString(){
      return src[0] + nameOf(this) + src[1];
    };

    define(stringifier, stringifier);

    var prep = { __proto__: [] } instanceof Array
      ? function(f){ f.__proto__ = stringifier }
      : function(f){ define(f, stringifier) };

    prep(WeakMap);

    [toString, get, set, has, del].forEach(function(method){
      define(WeakMap.prototype, method);
      prep(method);
    });

    return WeakMap;
  }(new Data));

  var defaultCreator = Object.create
    ? function(){ return Object.create(null) }
    : function(){ return {} };

  function createStorage(creator){
    var weakmap = new WM;
    creator || (creator = defaultCreator);

    function storage(object, value){
      if (value || arguments.length === 2) {
        weakmap.set(object, value);
      } else {
        value = weakmap.get(object);
        if (value === undefined) {
          value = creator(object);
          weakmap.set(object, value);
        }
      }
      return value;
    }

    return storage;
  }


  if (typeof module !== 'undefined') {
    module.exports = WM;
  } else if (typeof exports !== 'undefined') {
    exports.WeakMap = WM;
  } else if (!('WeakMap' in global)) {
    global.WeakMap = WM;
  }

  WM.createStorage = createStorage;
  if (global.WeakMap)
    global.WeakMap.createStorage = createStorage;
}((0, eval)('this'));

},{}],7:[function(require,module,exports){
"use strict"

module.exports = preprocessRangeMinimumQuery

var makeCartesianTree = require("cartesian-tree")
var preprocessLCA = require("least-common-ancestor")

function preprocessRangeMinimumQuery(array, compare) {

  if(array.length === 0) {
    return function() { return -1 }
  }

  var cartesianTree = makeCartesianTree(array, compare)
  var lca = preprocessLCA(cartesianTree.root, function(node, child) {
    return child !== "value"
  })

  function rangeMinimumQuery(i, j) {
    if(i < 0) {
      i = 0
    }
    if((j <= i) || (i>=array.length)) {
       return -1
    }
    var a = cartesianTree.nodes[i]
    var b = cartesianTree.nodes[Math.min(array.length-1, j-1)]
    var ancestor = lca(a,b)
    return ancestor.index
  }

  return rangeMinimumQuery
}
},{"cartesian-tree":2,"least-common-ancestor":3}]},{},[1])(1)
});
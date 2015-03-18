var global = Function("return this;")();
/*!
  * Ender: open module JavaScript framework (client-lib)
  * copyright Dustin Diaz & Jacob Thornton 2011 (@ded @fat)
  * http://ender.no.de
  * License MIT
  */
!function (context) {

  // a global object for node.js module compatiblity
  // ============================================

  context['global'] = context

  // Implements simple module system
  // losely based on CommonJS Modules spec v1.1.1
  // ============================================

  var modules = {}
    , old = context.$

  function require (identifier) {
    // modules can be required from ender's build system, or found on the window
    var module = modules[identifier] || window[identifier]
    if (!module) throw new Error("Requested module '" + identifier + "' has not been defined.")
    return module
  }

  function provide (name, what) {
    return (modules[name] = what)
  }

  context['provide'] = provide
  context['require'] = require

  function aug(o, o2) {
    for (var k in o2) k != 'noConflict' && k != '_VERSION' && (o[k] = o2[k])
    return o
  }

  function boosh(s, r, els) {
    // string || node || nodelist || window
    if (typeof s == 'string' || s.nodeName || (s.length && 'item' in s) || s == window) {
      els = ender._select(s, r)
      els.selector = s
    } else els = isFinite(s.length) ? s : [s]
    return aug(els, boosh)
  }

  function ender(s, r) {
    return boosh(s, r)
  }

  aug(ender, {
      _VERSION: '0.3.6'
    , fn: boosh // for easy compat to jQuery plugins
    , ender: function (o, chain) {
        aug(chain ? boosh : ender, o)
      }
    , _select: function (s, r) {
        return (r || document).querySelectorAll(s)
      }
  })

  aug(boosh, {
    forEach: function (fn, scope, i) {
      // opt out of native forEach so we can intentionally call our own scope
      // defaulting to the current item and be able to return self
      for (i = 0, l = this.length; i < l; ++i) i in this && fn.call(scope || this[i], this[i], i, this)
      // return self for chaining
      return this
    },
    $: ender // handy reference to self
  })

  ender.noConflict = function () {
    context.$ = old
    return this
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = ender
  // use subscript notation as extern for Closure compilation
  context['ender'] = context['$'] = context['ender'] || ender

}(this);
// pakmanager:http-https
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  var http = exports.http = require('http')
    var https = exports.https = require('https')
    var url = require('url')
    
    exports.get = function(opt, cb) {
      return getMod(opt).get(opt, cb)
    }
    
    exports.request = function(opt, cb) {
      return getMod(opt).request(opt, cb)
    }
    
    exports.getModule = getMod
    function getMod(opt) {
      if (typeof opt === 'string')
        opt = url.parse(opt)
    
      return opt.protocol === 'https:' ? https : http
    }
    
  provide("http-https", module.exports);
}(global));

// pakmanager:oboe
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  // this file is the concatenation of several js files. See http://github.com/jimhigson/oboe.js
    // for the unconcatenated source
    
    module.exports = (function  () {
       
       // v2.1.0-1-gce46063
    
    /*
    
    Copyright (c) 2013, Jim Higson
    
    All rights reserved.
    
    Redistribution and use in source and binary forms, with or without
    modification, are permitted provided that the following conditions are
    met:
    
    1.  Redistributions of source code must retain the above copyright
        notice, this list of conditions and the following disclaimer.
    
    2.  Redistributions in binary form must reproduce the above copyright
        notice, this list of conditions and the following disclaimer in the
        documentation and/or other materials provided with the distribution.
    
    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
    IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
    TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
    PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
    HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
    SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
    TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
    PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
    LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
    NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
    SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
    
    */
    
    /** 
     * Partially complete a function.
     * 
     *  var add3 = partialComplete( function add(a,b){return a+b}, 3 );
     *  
     *  add3(4) // gives 7
     *  
     *  function wrap(left, right, cen){return left + " " + cen + " " + right;}
     *  
     *  var pirateGreeting = partialComplete( wrap , "I'm", ", a mighty pirate!" );
     *  
     *  pirateGreeting("Guybrush Threepwood"); 
     *  // gives "I'm Guybrush Threepwood, a mighty pirate!"
     */
    var partialComplete = varArgs(function( fn, args ) {
    
          // this isn't the shortest way to write this but it does
          // avoid creating a new array each time to pass to fn.apply,
          // otherwise could just call boundArgs.concat(callArgs)       
    
          var numBoundArgs = args.length;
    
          return varArgs(function( callArgs ) {
             
             for (var i = 0; i < callArgs.length; i++) {
                args[numBoundArgs + i] = callArgs[i];
             }
             
             args.length = numBoundArgs + callArgs.length;         
                         
             return fn.apply(this, args);
          }); 
       }),
    
    /**
     * Compose zero or more functions:
     * 
     *    compose(f1, f2, f3)(x) = f1(f2(f3(x))))
     * 
     * The last (inner-most) function may take more than one parameter:
     * 
     *    compose(f1, f2, f3)(x,y) = f1(f2(f3(x,y))))
     */
       compose = varArgs(function(fns) {
    
          var fnsList = arrayAsList(fns);
       
          function next(params, curFn) {  
             return [apply(params, curFn)];   
          }
                
          return varArgs(function(startParams){
            
             return foldR(next, startParams, fnsList)[0];
          });
       });
    
    /**
     * A more optimised version of compose that takes exactly two functions
     * @param f1
     * @param f2
     */
    function compose2(f1, f2){
       return function(){
          return f1.call(this,f2.apply(this,arguments));
       }
    }
    
    /**
     * Generic form for a function to get a property from an object
     * 
     *    var o = {
     *       foo:'bar'
     *    }
     *    
     *    var getFoo = attr('foo')
     *    
     *    fetFoo(o) // returns 'bar'
     * 
     * @param {String} key the property name
     */
    function attr(key) {
       return function(o) { return o[key]; };
    }
            
    /**
     * Call a list of functions with the same args until one returns a 
     * truthy result. Similar to the || operator.
     * 
     * So:
     *      lazyUnion([f1,f2,f3 ... fn])( p1, p2 ... pn )
     *      
     * Is equivalent to: 
     *      apply([p1, p2 ... pn], f1) || 
     *      apply([p1, p2 ... pn], f2) || 
     *      apply([p1, p2 ... pn], f3) ... apply(fn, [p1, p2 ... pn])  
     *  
     * @returns the first return value that is given that is truthy.
     */
       var lazyUnion = varArgs(function(fns) {
    
          return varArgs(function(params){
       
             var maybeValue;
       
             for (var i = 0; i < len(fns); i++) {
       
                maybeValue = apply(params, fns[i]);
       
                if( maybeValue ) {
                   return maybeValue;
                }
             }
          });
       });   
    
    /**
     * This file declares various pieces of functional programming.
     * 
     * This isn't a general purpose functional library, to keep things small it
     * has just the parts useful for Oboe.js.
     */
    
    
    /**
     * Call a single function with the given arguments array.
     * Basically, a functional-style version of the OO-style Function#apply for 
     * when we don't care about the context ('this') of the call.
     * 
     * The order of arguments allows partial completion of the arguments array
     */
    function apply(args, fn) {
       return fn.apply(undefined, args);
    }
    
    /**
     * Define variable argument functions but cut out all that tedious messing about 
     * with the arguments object. Delivers the variable-length part of the arguments
     * list as an array.
     * 
     * Eg:
     * 
     * var myFunction = varArgs(
     *    function( fixedArgument, otherFixedArgument, variableNumberOfArguments ){
     *       console.log( variableNumberOfArguments );
     *    }
     * )
     * 
     * myFunction('a', 'b', 1, 2, 3); // logs [1,2,3]
     * 
     * var myOtherFunction = varArgs(function( variableNumberOfArguments ){
     *    console.log( variableNumberOfArguments );
     * })
     * 
     * myFunction(1, 2, 3); // logs [1,2,3]
     * 
     */
    function varArgs(fn){
    
       var numberOfFixedArguments = fn.length -1,
           slice = Array.prototype.slice;          
             
                       
       if( numberOfFixedArguments == 0 ) {
          // an optimised case for when there are no fixed args:   
       
          return function(){
             return fn.call(this, slice.call(arguments));
          }
          
       } else if( numberOfFixedArguments == 1 ) {
          // an optimised case for when there are is one fixed args:
       
          return function(){
             return fn.call(this, arguments[0], slice.call(arguments, 1));
          }
       }
       
       // general case   
    
       // we know how many arguments fn will always take. Create a
       // fixed-size array to hold that many, to be re-used on
       // every call to the returned function
       var argsHolder = Array(fn.length);   
                                 
       return function(){
                                
          for (var i = 0; i < numberOfFixedArguments; i++) {
             argsHolder[i] = arguments[i];         
          }
    
          argsHolder[numberOfFixedArguments] = 
             slice.call(arguments, numberOfFixedArguments);
                                    
          return fn.apply( this, argsHolder);      
       }       
    }
    
    
    /**
     * Swap the order of parameters to a binary function
     * 
     * A bit like this flip: http://zvon.org/other/haskell/Outputprelude/flip_f.html
     */
    function flip(fn){
       return function(a, b){
          return fn(b,a);
       }
    }
    
    
    /**
     * Create a function which is the intersection of two other functions.
     * 
     * Like the && operator, if the first is truthy, the second is never called,
     * otherwise the return value from the second is returned.
     */
    function lazyIntersection(fn1, fn2) {
    
       return function (param) {
                                                                  
          return fn1(param) && fn2(param);
       };   
    }
    
    /**
     * A function which does nothing
     */
    function noop(){}
    
    /**
     * A function which is always happy
     */
    function always(){return true}
    
    /**
     * Create a function which always returns the same
     * value
     * 
     * var return3 = functor(3);
     * 
     * return3() // gives 3
     * return3() // still gives 3
     * return3() // will always give 3
     */
    function functor(val){
       return function(){
          return val;
       }
    }
    
    /**
     * This file defines some loosely associated syntactic sugar for 
     * Javascript programming 
     */
    
    
    /**
     * Returns true if the given candidate is of type T
     */
    function isOfType(T, maybeSomething){
       return maybeSomething && maybeSomething.constructor === T;
    }
    
    var len = attr('length'),    
        isString = partialComplete(isOfType, String);
    
    /** 
     * I don't like saying this:
     * 
     *    foo !=== undefined
     *    
     * because of the double-negative. I find this:
     * 
     *    defined(foo)
     *    
     * easier to read.
     */ 
    function defined( value ) {
       return value !== undefined;
    }
    
    /**
     * Returns true if object o has a key named like every property in 
     * the properties array. Will give false if any are missing, or if o 
     * is not an object.
     */
    function hasAllProperties(fieldList, o) {
    
       return      (o instanceof Object) 
                &&
                   all(function (field) {         
                      return (field in o);         
                   }, fieldList);
    }
    /**
     * Like cons in Lisp
     */
    function cons(x, xs) {
       
       /* Internally lists are linked 2-element Javascript arrays.
              
          Ideally the return here would be Object.freeze([x,xs])
          so that bugs related to mutation are found fast.
          However, cons is right on the critical path for
          performance and this slows oboe-mark down by
          ~25%. Under theoretical future JS engines that freeze more
          efficiently (possibly even use immutability to
          run faster) this should be considered for
          restoration.
       */
       
       return [x,xs];
    }
    
    /**
     * The empty list
     */
    var emptyList = null,
    
    /**
     * Get the head of a list.
     * 
     * Ie, head(cons(a,b)) = a
     */
        head = attr(0),
    
    /**
     * Get the tail of a list.
     * 
     * Ie, head(cons(a,b)) = a
     */
        tail = attr(1);
    
    
    /** 
     * Converts an array to a list 
     * 
     *    asList([a,b,c])
     * 
     * is equivalent to:
     *    
     *    cons(a, cons(b, cons(c, emptyList))) 
     **/
    function arrayAsList(inputArray){
    
       return reverseList( 
          inputArray.reduce(
             flip(cons),
             emptyList 
          )
       );
    }
    
    /**
     * A varargs version of arrayAsList. Works a bit like list
     * in LISP.
     * 
     *    list(a,b,c) 
     *    
     * is equivalent to:
     * 
     *    cons(a, cons(b, cons(c, emptyList)))
     */
    var list = varArgs(arrayAsList);
    
    /**
     * Convert a list back to a js native array
     */
    function listAsArray(list){
    
       return foldR( function(arraySoFar, listItem){
          
          arraySoFar.unshift(listItem);
          return arraySoFar;
               
       }, [], list );
       
    }
    
    /**
     * Map a function over a list 
     */
    function map(fn, list) {
    
       return list
                ? cons(fn(head(list)), map(fn,tail(list)))
                : emptyList
                ;
    }
    
    /**
     * foldR implementation. Reduce a list down to a single value.
     * 
     * @pram {Function} fn     (rightEval, curVal) -> result 
     */
    function foldR(fn, startValue, list) {
          
       return list 
                ? fn(foldR(fn, startValue, tail(list)), head(list))
                : startValue
                ;
    }
    
    /**
     * foldR implementation. Reduce a list down to a single value.
     * 
     * @pram {Function} fn     (rightEval, curVal) -> result 
     */
    function foldR1(fn, list) {
          
       return tail(list) 
                ? fn(foldR1(fn, tail(list)), head(list))
                : head(list)
                ;
    }
    
    
    /**
     * Return a list like the one given but with the first instance equal 
     * to item removed 
     */
    function without(list, test, removedFn) {
     
       return withoutInner(list, removedFn || noop);
     
       function withoutInner(subList, removedFn) {
          return subList  
             ?  ( test(head(subList)) 
                      ? (removedFn(head(subList)), tail(subList)) 
                      : cons(head(subList), withoutInner(tail(subList), removedFn))
                )
             : emptyList
             ;
       }               
    }
    
    /** 
     * Returns true if the given function holds for every item in 
     * the list, false otherwise 
     */
    function all(fn, list) {
       
       return !list || 
              ( fn(head(list)) && all(fn, tail(list)) );
    }
    
    /**
     * Call every function in a list of functions with the same arguments
     * 
     * This doesn't make any sense if we're doing pure functional because 
     * it doesn't return anything. Hence, this is only really useful if the
     * functions being called have side-effects. 
     */
    function applyEach(fnList, args) {
    
       if( fnList ) {  
          head(fnList).apply(null, args);
          
          applyEach(tail(fnList), args);
       }
    }
    
    /**
     * Reverse the order of a list
     */
    function reverseList(list){ 
    
       // js re-implementation of 3rd solution from:
       //    http://www.haskell.org/haskellwiki/99_questions/Solutions/5
       function reverseInner( list, reversedAlready ) {
          if( !list ) {
             return reversedAlready;
          }
          
          return reverseInner(tail(list), cons(head(list), reversedAlready))
       }
    
       return reverseInner(list, emptyList);
    }
    
    function first(test, list) {
       return   list &&
                   (test(head(list)) 
                      ? head(list) 
                      : first(test,tail(list))); 
    }
    
    /* 
       This is a slightly hacked-up browser only version of clarinet 
       
          *  some features removed to help keep browser Oboe under 
             the 5k micro-library limit
          *  plug directly into event bus
       
       For the original go here:
          https://github.com/dscape/clarinet
    
       We receive the events:
          STREAM_DATA
          STREAM_END
          
       We emit the events:
          SAX_KEY
          SAX_VALUE_OPEN
          SAX_VALUE_CLOSE      
          FAIL_EVENT      
     */
    
    function clarinet(eventBus) {
      "use strict";
       
      var 
          // shortcut some events on the bus
          emitSaxKey           = eventBus(SAX_KEY).emit,
          emitValueOpen        = eventBus(SAX_VALUE_OPEN).emit,
          emitValueClose       = eventBus(SAX_VALUE_CLOSE).emit,
          emitFail             = eventBus(FAIL_EVENT).emit,
                  
          MAX_BUFFER_LENGTH = 64 * 1024
      ,   stringTokenPattern = /[\\"\n]/g
      ,   _n = 0
      
          // states
      ,   BEGIN                = _n++
      ,   VALUE                = _n++ // general stuff
      ,   OPEN_OBJECT          = _n++ // {
      ,   CLOSE_OBJECT         = _n++ // }
      ,   OPEN_ARRAY           = _n++ // [
      ,   CLOSE_ARRAY          = _n++ // ]
      ,   STRING               = _n++ // ""
      ,   OPEN_KEY             = _n++ // , "a"
      ,   CLOSE_KEY            = _n++ // :
      ,   TRUE                 = _n++ // r
      ,   TRUE2                = _n++ // u
      ,   TRUE3                = _n++ // e
      ,   FALSE                = _n++ // a
      ,   FALSE2               = _n++ // l
      ,   FALSE3               = _n++ // s
      ,   FALSE4               = _n++ // e
      ,   NULL                 = _n++ // u
      ,   NULL2                = _n++ // l
      ,   NULL3                = _n++ // l
      ,   NUMBER_DECIMAL_POINT = _n++ // .
      ,   NUMBER_DIGIT         = _n   // [0-9]
    
          // setup initial parser values
      ,   bufferCheckPosition  = MAX_BUFFER_LENGTH
      ,   latestError                
      ,   c                    
      ,   p                    
      ,   textNode             = ""
      ,   numberNode           = ""     
      ,   slashed              = false
      ,   closed               = false
      ,   state                = BEGIN
      ,   stack                = []
      ,   unicodeS             = null
      ,   unicodeI             = 0
      ,   depth                = 0
      ,   position             = 0
      ,   column               = 0  //mostly for error reporting
      ,   line                 = 1
      ;
    
      function checkBufferLength () {
         
        var maxActual = 0;
         
        if (textNode.length > MAX_BUFFER_LENGTH) {
          emitError("Max buffer length exceeded: textNode");
          maxActual = Math.max(maxActual, textNode.length);
        }
        if (numberNode.length > MAX_BUFFER_LENGTH) {
          emitError("Max buffer length exceeded: numberNode");
          maxActual = Math.max(maxActual, numberNode.length);
        }
         
        bufferCheckPosition = (MAX_BUFFER_LENGTH - maxActual)
                                   + position;
      }
    
      eventBus(STREAM_DATA).on(handleData);
    
       /* At the end of the http content close the clarinet 
        This will provide an error if the total content provided was not 
        valid json, ie if not all arrays, objects and Strings closed properly */
      eventBus(STREAM_END).on(handleStreamEnd);   
    
      function emitError (errorString) {
         if (textNode) {
            emitValueOpen(textNode);
            emitValueClose();
            textNode = "";
         }
    
         latestError = Error(errorString + "\nLn: "+line+
                                           "\nCol: "+column+
                                           "\nChr: "+c);
         
         emitFail(errorReport(undefined, undefined, latestError));
      }
    
      function handleStreamEnd() {
        if( state == BEGIN ) {
          // Handle the case where the stream closes without ever receiving
          // any input. This isn't an error - response bodies can be blank,
          // particularly for 204 http responses
          
          // Because of how Oboe is currently implemented, we parse a
          // completely empty stream as containing an empty object.
          // This is because Oboe's done event is only fired when the
          // root object of the JSON stream closes.
          
          // This should be decoupled and attached instead to the input stream
          // from the http (or whatever) resource ending.
          // If this decoupling could happen the SAX parser could simply emit
          // zero events on a completely empty input.
          emitValueOpen({});
          emitValueClose();
    
          closed = true;
          return;
        }
      
        if (state !== VALUE || depth !== 0)
          emitError("Unexpected end");
     
        if (textNode) {
          emitValueOpen(textNode);
          emitValueClose();
          textNode = "";
        }
         
        closed = true;
      }
    
      function whitespace(c){
         return c == '\r' || c == '\n' || c == ' ' || c == '\t';
      }
       
      function handleData (chunk) {
             
        // this used to throw the error but inside Oboe we will have already
        // gotten the error when it was emitted. The important thing is to
        // not continue with the parse.
        if (latestError)
          return;
          
        if (closed) {
           return emitError("Cannot write after close");
        }
    
        var i = 0;
        c = chunk[0]; 
    
        while (c) {
          p = c;
          c = chunk[i++];
          if(!c) break;
    
          position ++;
          if (c == "\n") {
            line ++;
            column = 0;
          } else column ++;
          switch (state) {
    
            case BEGIN:
              if (c === "{") state = OPEN_OBJECT;
              else if (c === "[") state = OPEN_ARRAY;
              else if (!whitespace(c))
                return emitError("Non-whitespace before {[.");
            continue;
    
            case OPEN_KEY:
            case OPEN_OBJECT:
              if (whitespace(c)) continue;
              if(state === OPEN_KEY) stack.push(CLOSE_KEY);
              else {
                if(c === '}') {
                  emitValueOpen({});
                  emitValueClose();
                  state = stack.pop() || VALUE;
                  continue;
                } else  stack.push(CLOSE_OBJECT);
              }
              if(c === '"')
                 state = STRING;
              else
                 return emitError("Malformed object key should start with \" ");
            continue;
    
            case CLOSE_KEY:
            case CLOSE_OBJECT:
              if (whitespace(c)) continue;
    
              if(c===':') {
                if(state === CLOSE_OBJECT) {
                  stack.push(CLOSE_OBJECT);
    
                   if (textNode) {
                      // was previously (in upstream Clarinet) one event
                      //  - object open came with the text of the first
                      emitValueOpen({});
                      emitSaxKey(textNode);
                      textNode = "";
                   }
                   depth++;
                } else {
                   if (textNode) {
                      emitSaxKey(textNode);
                      textNode = "";
                   }
                }
                 state  = VALUE;
              } else if (c==='}') {
                 if (textNode) {
                    emitValueOpen(textNode);
                    emitValueClose();
                    textNode = "";
                 }
                 emitValueClose();
                depth--;
                state = stack.pop() || VALUE;
              } else if(c===',') {
                if(state === CLOSE_OBJECT)
                  stack.push(CLOSE_OBJECT);
                 if (textNode) {
                    emitValueOpen(textNode);
                    emitValueClose();
                    textNode = "";
                 }
                 state  = OPEN_KEY;
              } else 
                 return emitError('Bad object');
            continue;
    
            case OPEN_ARRAY: // after an array there always a value
            case VALUE:
              if (whitespace(c)) continue;
              if(state===OPEN_ARRAY) {
                emitValueOpen([]);
                depth++;             
                state = VALUE;
                if(c === ']') {
                  emitValueClose();
                  depth--;
                  state = stack.pop() || VALUE;
                  continue;
                } else {
                  stack.push(CLOSE_ARRAY);
                }
              }
                   if(c === '"') state = STRING;
              else if(c === '{') state = OPEN_OBJECT;
              else if(c === '[') state = OPEN_ARRAY;
              else if(c === 't') state = TRUE;
              else if(c === 'f') state = FALSE;
              else if(c === 'n') state = NULL;
              else if(c === '-') { // keep and continue
                numberNode += c;
              } else if(c==='0') {
                numberNode += c;
                state = NUMBER_DIGIT;
              } else if('123456789'.indexOf(c) !== -1) {
                numberNode += c;
                state = NUMBER_DIGIT;
              } else               
                return emitError("Bad value");
            continue;
    
            case CLOSE_ARRAY:
              if(c===',') {
                stack.push(CLOSE_ARRAY);
                 if (textNode) {
                    emitValueOpen(textNode);
                    emitValueClose();
                    textNode = "";
                 }
                 state  = VALUE;
              } else if (c===']') {
                 if (textNode) {
                    emitValueOpen(textNode);
                    emitValueClose();
                    textNode = "";
                 }
                 emitValueClose();
                depth--;
                state = stack.pop() || VALUE;
              } else if (whitespace(c))
                  continue;
              else 
                 return emitError('Bad array');
            continue;
    
            case STRING:
              // thanks thejh, this is an about 50% performance improvement.
              var starti              = i-1;
               
              STRING_BIGLOOP: while (true) {
    
                // zero means "no unicode active". 1-4 mean "parse some more". end after 4.
                while (unicodeI > 0) {
                  unicodeS += c;
                  c = chunk.charAt(i++);
                  if (unicodeI === 4) {
                    // TODO this might be slow? well, probably not used too often anyway
                    textNode += String.fromCharCode(parseInt(unicodeS, 16));
                    unicodeI = 0;
                    starti = i-1;
                  } else {
                    unicodeI++;
                  }
                  // we can just break here: no stuff we skipped that still has to be sliced out or so
                  if (!c) break STRING_BIGLOOP;
                }
                if (c === '"' && !slashed) {
                  state = stack.pop() || VALUE;
                  textNode += chunk.substring(starti, i-1);
                  if(!textNode) {
                     emitValueOpen("");
                     emitValueClose();
                  }
                  break;
                }
                if (c === '\\' && !slashed) {
                  slashed = true;
                  textNode += chunk.substring(starti, i-1);
                   c = chunk.charAt(i++);
                  if (!c) break;
                }
                if (slashed) {
                  slashed = false;
                       if (c === 'n') { textNode += '\n'; }
                  else if (c === 'r') { textNode += '\r'; }
                  else if (c === 't') { textNode += '\t'; }
                  else if (c === 'f') { textNode += '\f'; }
                  else if (c === 'b') { textNode += '\b'; }
                  else if (c === 'u') {
                    // \uxxxx. meh!
                    unicodeI = 1;
                    unicodeS = '';
                  } else {
                    textNode += c;
                  }
                  c = chunk.charAt(i++);
                  starti = i-1;
                  if (!c) break;
                  else continue;
                }
    
                stringTokenPattern.lastIndex = i;
                var reResult = stringTokenPattern.exec(chunk);
                if (!reResult) {
                  i = chunk.length+1;
                  textNode += chunk.substring(starti, i-1);
                  break;
                }
                i = reResult.index+1;
                c = chunk.charAt(reResult.index);
                if (!c) {
                  textNode += chunk.substring(starti, i-1);
                  break;
                }
              }
            continue;
    
            case TRUE:
              if (!c)  continue; // strange buffers
              if (c==='r') state = TRUE2;
              else
                 return emitError( 'Invalid true started with t'+ c);
            continue;
    
            case TRUE2:
              if (!c)  continue;
              if (c==='u') state = TRUE3;
              else
                 return emitError('Invalid true started with tr'+ c);
            continue;
    
            case TRUE3:
              if (!c) continue;
              if(c==='e') {
                emitValueOpen(true);
                emitValueClose();
                state = stack.pop() || VALUE;
              } else
                 return emitError('Invalid true started with tru'+ c);
            continue;
    
            case FALSE:
              if (!c)  continue;
              if (c==='a') state = FALSE2;
              else
                 return emitError('Invalid false started with f'+ c);
            continue;
    
            case FALSE2:
              if (!c)  continue;
              if (c==='l') state = FALSE3;
              else
                 return emitError('Invalid false started with fa'+ c);
            continue;
    
            case FALSE3:
              if (!c)  continue;
              if (c==='s') state = FALSE4;
              else
                 return emitError('Invalid false started with fal'+ c);
            continue;
    
            case FALSE4:
              if (!c)  continue;
              if (c==='e') {
                emitValueOpen(false);
                emitValueClose();
                state = stack.pop() || VALUE;
              } else
                 return emitError('Invalid false started with fals'+ c);
            continue;
    
            case NULL:
              if (!c)  continue;
              if (c==='u') state = NULL2;
              else
                 return emitError('Invalid null started with n'+ c);
            continue;
    
            case NULL2:
              if (!c)  continue;
              if (c==='l') state = NULL3;
              else
                 return emitError('Invalid null started with nu'+ c);
            continue;
    
            case NULL3:
              if (!c) continue;
              if(c==='l') {
                emitValueOpen(null);
                emitValueClose();
                state = stack.pop() || VALUE;
              } else 
                 return emitError('Invalid null started with nul'+ c);
            continue;
    
            case NUMBER_DECIMAL_POINT:
              if(c==='.') {
                numberNode += c;
                state       = NUMBER_DIGIT;
              } else 
                 return emitError('Leading zero not followed by .');
            continue;
    
            case NUMBER_DIGIT:
              if('0123456789'.indexOf(c) !== -1) numberNode += c;
              else if (c==='.') {
                if(numberNode.indexOf('.')!==-1)
                   return emitError('Invalid number has two dots');
                numberNode += c;
              } else if (c==='e' || c==='E') {
                if(numberNode.indexOf('e')!==-1 ||
                   numberNode.indexOf('E')!==-1 )
                   return emitError('Invalid number has two exponential');
                numberNode += c;
              } else if (c==="+" || c==="-") {
                if(!(p==='e' || p==='E'))
                   return emitError('Invalid symbol in number');
                numberNode += c;
              } else {
                if (numberNode) {
                  emitValueOpen(parseFloat(numberNode));
                  emitValueClose();
                  numberNode = "";
                }
                i--; // go back one
                state = stack.pop() || VALUE;
              }
            continue;
    
            default:
              return emitError("Unknown state: " + state);
          }
        }
        if (position >= bufferCheckPosition)
          checkBufferLength();
      }
    }
    
    
    /** 
     * A bridge used to assign stateless functions to listen to clarinet.
     * 
     * As well as the parameter from clarinet, each callback will also be passed
     * the result of the last callback.
     * 
     * This may also be used to clear all listeners by assigning zero handlers:
     * 
     *    ascentManager( clarinet, {} )
     */
    function ascentManager(oboeBus, handlers){
       "use strict";
       
       var listenerId = {},
           ascent;
    
       function stateAfter(handler) {
          return function(param){
             ascent = handler( ascent, param);
          }
       }
       
       for( var eventName in handlers ) {
    
          oboeBus(eventName).on(stateAfter(handlers[eventName]), listenerId);
       }
       
       oboeBus(NODE_SWAP).on(function(newNode) {
          
          var oldHead = head(ascent),
              key = keyOf(oldHead),
              ancestors = tail(ascent),
              parentNode;
    
          if( ancestors ) {
             parentNode = nodeOf(head(ancestors));
             parentNode[key] = newNode;
          }
       });
    
       oboeBus(NODE_DROP).on(function() {
    
          var oldHead = head(ascent),
              key = keyOf(oldHead),
              ancestors = tail(ascent),
              parentNode;
    
          if( ancestors ) {
             parentNode = nodeOf(head(ancestors));
     
             delete parentNode[key];
          }
       });
    
       oboeBus(ABORTING).on(function(){
          
          for( var eventName in handlers ) {
             oboeBus(eventName).un(listenerId);
          }
       });   
    }
    
    var httpTransport = functor(require('http-https'));
    
    /**
     * A wrapper around the browser XmlHttpRequest object that raises an 
     * event whenever a new part of the response is available.
     * 
     * In older browsers progressive reading is impossible so all the 
     * content is given in a single call. For newer ones several events
     * should be raised, allowing progressive interpretation of the response.
     *      
     * @param {Function} oboeBus an event bus local to this Oboe instance
     * @param {XMLHttpRequest} transport the http implementation to use as the transport. Under normal
     *          operation, will have been created using httpTransport() above
     *          and therefore be Node's http
     *          but for tests a stub may be provided instead.
     * @param {String} method one of 'GET' 'POST' 'PUT' 'PATCH' 'DELETE'
     * @param {String} contentSource the url to make a request to, or a stream to read from
     * @param {String|Null} data some content to be sent with the request.
     *                      Only valid if method is POST or PUT.
     * @param {Object} [headers] the http request headers to send                       
     */  
    function streamingHttp(oboeBus, transport, method, contentSource, data, headers) {
       "use strict";
       
       /* receiving data after calling .abort on Node's http has been observed in the
          wild. Keep aborted as state so that if the request has been aborted we
          can ignore new data from that point on */
       var aborted = false;
    
       function readStreamToEventBus(readableStream) {
             
          // use stream in flowing mode   
          readableStream.on('data', function (chunk) {
    
             // avoid reading the stream after aborting the request
             if( !aborted ) {
                oboeBus(STREAM_DATA).emit(chunk.toString());
             }
          });
          
          readableStream.on('end', function() {
    
             // avoid reading the stream after aborting the request
             if( !aborted ) {
                oboeBus(STREAM_END).emit();
             }
          });
       }
       
       function readStreamToEnd(readableStream, callback){
          var content = '';
       
          readableStream.on('data', function (chunk) {
                                                 
             content += chunk.toString();
          });
          
          readableStream.on('end', function() {
                   
             callback( content );
          });
       }
       
       function openUrlAsStream( url ) {
          
          var parsedUrl = require('url').parse(url);
               
          return transport.request({
             hostname: parsedUrl.hostname,
             port: parsedUrl.port, 
             path: parsedUrl.path,
             method: method,
             headers: headers,
             protocol: parsedUrl.protocol
          });
       }
       
       function fetchUrl() {
          if( !contentSource.match(/https?:\/\//) ) {
             throw new Error(
                'Supported protocols when passing a URL into Oboe are http and https. ' +
                'If you wish to use another protocol, please pass a ReadableStream ' +
                '(http://nodejs.org/api/stream.html#stream_class_stream_readable) like ' + 
                'oboe(fs.createReadStream("my_file")). I was given the URL: ' +
                contentSource
             );
          }
          
          var req = openUrlAsStream(contentSource);
          
          req.on('response', function(res){
             var statusCode = res.statusCode,
                 successful = String(statusCode)[0] == 2;
                                                       
             oboeBus(HTTP_START).emit( res.statusCode, res.headers);
                                    
             if( successful ) {          
                   
                readStreamToEventBus(res)
                
             } else {
                readStreamToEnd(res, function(errorBody){
                   oboeBus(FAIL_EVENT).emit( 
                      errorReport( statusCode, errorBody )
                   );
                });
             }      
          });
          
          req.on('error', function(e) {
             oboeBus(FAIL_EVENT).emit( 
                errorReport(undefined, undefined, e )
             );
          });
          
          oboeBus(ABORTING).on( function(){
             aborted = true;
             req.abort();
          });
             
          if( data ) {
             req.write(data);
          }
          
          req.end();         
       }
       
       if( isString(contentSource) ) {
          fetchUrl(contentSource);
       } else {
          // contentsource is a stream
          readStreamToEventBus(contentSource);   
       }
    
    }
    
    var jsonPathSyntax = (function() {
     
       var
       
       /** 
        * Export a regular expression as a simple function by exposing just 
        * the Regex#exec. This allows regex tests to be used under the same 
        * interface as differently implemented tests, or for a user of the
        * tests to not concern themselves with their implementation as regular
        * expressions.
        * 
        * This could also be expressed point-free as:
        *   Function.prototype.bind.bind(RegExp.prototype.exec),
        *   
        * But that's far too confusing! (and not even smaller once minified 
        * and gzipped)
        */
           regexDescriptor = function regexDescriptor(regex) {
                return regex.exec.bind(regex);
           }
           
       /**
        * Join several regular expressions and express as a function.
        * This allows the token patterns to reuse component regular expressions
        * instead of being expressed in full using huge and confusing regular
        * expressions.
        */       
       ,   jsonPathClause = varArgs(function( componentRegexes ) {
    
                // The regular expressions all start with ^ because we 
                // only want to find matches at the start of the 
                // JSONPath fragment we are inspecting           
                componentRegexes.unshift(/^/);
                
                return   regexDescriptor(
                            RegExp(
                               componentRegexes.map(attr('source')).join('')
                            )
                         );
           })
           
       ,   possiblyCapturing =           /(\$?)/
       ,   namedNode =                   /([\w-_]+|\*)/
       ,   namePlaceholder =             /()/
       ,   nodeInArrayNotation =         /\["([^"]+)"\]/
       ,   numberedNodeInArrayNotation = /\[(\d+|\*)\]/
       ,   fieldList =                      /{([\w ]*?)}/
       ,   optionalFieldList =           /(?:{([\w ]*?)})?/
        
    
           //   foo or *                  
       ,   jsonPathNamedNodeInObjectNotation   = jsonPathClause( 
                                                    possiblyCapturing, 
                                                    namedNode, 
                                                    optionalFieldList
                                                 )
                                                 
           //   ["foo"]   
       ,   jsonPathNamedNodeInArrayNotation    = jsonPathClause( 
                                                    possiblyCapturing, 
                                                    nodeInArrayNotation, 
                                                    optionalFieldList
                                                 )  
    
           //   [2] or [*]       
       ,   jsonPathNumberedNodeInArrayNotation = jsonPathClause( 
                                                    possiblyCapturing, 
                                                    numberedNodeInArrayNotation, 
                                                    optionalFieldList
                                                 )
    
           //   {a b c}      
       ,   jsonPathPureDuckTyping              = jsonPathClause( 
                                                    possiblyCapturing, 
                                                    namePlaceholder, 
                                                    fieldList
                                                 )
       
           //   ..
       ,   jsonPathDoubleDot                   = jsonPathClause(/\.\./)                  
       
           //   .
       ,   jsonPathDot                         = jsonPathClause(/\./)                    
       
           //   !
       ,   jsonPathBang                        = jsonPathClause(
                                                    possiblyCapturing, 
                                                    /!/
                                                 )  
       
           //   nada!
       ,   emptyString                         = jsonPathClause(/$/)                     
       
       ;
       
      
       /* We export only a single function. When called, this function injects 
          into another function the descriptors from above.             
        */
       return function (fn){      
          return fn(      
             lazyUnion(
                jsonPathNamedNodeInObjectNotation
             ,  jsonPathNamedNodeInArrayNotation
             ,  jsonPathNumberedNodeInArrayNotation
             ,  jsonPathPureDuckTyping 
             )
          ,  jsonPathDoubleDot
          ,  jsonPathDot
          ,  jsonPathBang
          ,  emptyString 
          );
       }; 
    
    }());
    /**
     * Get a new key->node mapping
     * 
     * @param {String|Number} key
     * @param {Object|Array|String|Number|null} node a value found in the json
     */
    function namedNode(key, node) {
       return {key:key, node:node};
    }
    
    /** get the key of a namedNode */
    var keyOf = attr('key');
    
    /** get the node from a namedNode */
    var nodeOf = attr('node');
    /** 
     * This file provides various listeners which can be used to build up
     * a changing ascent based on the callbacks provided by Clarinet. It listens
     * to the low-level events from Clarinet and emits higher-level ones.
     *  
     * The building up is stateless so to track a JSON file
     * ascentManager.js is required to store the ascent state
     * between calls.
     */
    
    
    
    /** 
     * A special value to use in the path list to represent the path 'to' a root 
     * object (which doesn't really have any path). This prevents the need for 
     * special-casing detection of the root object and allows it to be treated 
     * like any other object. We might think of this as being similar to the 
     * 'unnamed root' domain ".", eg if I go to 
     * http://en.wikipedia.org./wiki/En/Main_page the dot after 'org' deliminates 
     * the unnamed root of the DNS.
     * 
     * This is kept as an object to take advantage that in Javascript's OO objects 
     * are guaranteed to be distinct, therefore no other object can possibly clash 
     * with this one. Strings, numbers etc provide no such guarantee. 
     **/
    var ROOT_PATH = {};
    
    
    /**
     * Create a new set of handlers for clarinet's events, bound to the emit 
     * function given.  
     */ 
    function incrementalContentBuilder( oboeBus ) {
    
       var emitNodeOpened = oboeBus(NODE_OPENED).emit,
           emitNodeClosed = oboeBus(NODE_CLOSED).emit,
           emitRootOpened = oboeBus(ROOT_PATH_FOUND).emit,
           emitRootClosed = oboeBus(ROOT_NODE_FOUND).emit;
    
       function arrayIndicesAreKeys( possiblyInconsistentAscent, newDeepestNode) {
       
          /* for values in arrays we aren't pre-warned of the coming paths 
             (Clarinet gives no call to onkey like it does for values in objects) 
             so if we are in an array we need to create this path ourselves. The 
             key will be len(parentNode) because array keys are always sequential 
             numbers. */
    
          var parentNode = nodeOf( head( possiblyInconsistentAscent));
          
          return      isOfType( Array, parentNode)
                   ?
                      keyFound(  possiblyInconsistentAscent, 
                                  len(parentNode), 
                                  newDeepestNode
                      )
                   :  
                      // nothing needed, return unchanged
                      possiblyInconsistentAscent 
                   ;
       }
                     
       function nodeOpened( ascent, newDeepestNode ) {
          
          if( !ascent ) {
             // we discovered the root node,         
             emitRootOpened( newDeepestNode);
                        
             return keyFound( ascent, ROOT_PATH, newDeepestNode);         
          }
    
          // we discovered a non-root node
                     
          var arrayConsistentAscent  = arrayIndicesAreKeys( ascent, newDeepestNode),      
              ancestorBranches       = tail( arrayConsistentAscent),
              previouslyUnmappedName = keyOf( head( arrayConsistentAscent));
              
          appendBuiltContent( 
             ancestorBranches, 
             previouslyUnmappedName, 
             newDeepestNode 
          );
                                                                                                             
          return cons( 
                   namedNode( previouslyUnmappedName, newDeepestNode ), 
                   ancestorBranches
          );                                                                          
       }
    
    
       /**
        * Add a new value to the object we are building up to represent the
        * parsed JSON
        */
       function appendBuiltContent( ancestorBranches, key, node ){
         
          nodeOf( head( ancestorBranches))[key] = node;
       }
    
         
       /**
        * For when we find a new key in the json.
        * 
        * @param {String|Number|Object} newDeepestName the key. If we are in an 
        *    array will be a number, otherwise a string. May take the special 
        *    value ROOT_PATH if the root node has just been found
        *    
        * @param {String|Number|Object|Array|Null|undefined} [maybeNewDeepestNode] 
        *    usually this won't be known so can be undefined. Can't use null 
        *    to represent unknown because null is a valid value in JSON
        **/  
       function keyFound(ascent, newDeepestName, maybeNewDeepestNode) {
    
          if( ascent ) { // if not root
          
             // If we have the key but (unless adding to an array) no known value
             // yet. Put that key in the output but against no defined value:      
             appendBuiltContent( ascent, newDeepestName, maybeNewDeepestNode );
          }
       
          var ascentWithNewPath = cons( 
                                     namedNode( newDeepestName, 
                                                maybeNewDeepestNode), 
                                     ascent
                                  );
    
          emitNodeOpened( ascentWithNewPath);
     
          return ascentWithNewPath;
       }
    
    
       /**
        * For when the current node ends.
        */
       function nodeClosed( ascent ) {
    
          emitNodeClosed( ascent);
           
          return tail( ascent) ||
                 // If there are no nodes left in the ascent the root node
                 // just closed. Emit a special event for this: 
                 emitRootClosed(nodeOf(head(ascent)));
       }      
    
       var contentBuilderHandlers = {};
       contentBuilderHandlers[SAX_VALUE_OPEN] = nodeOpened;
       contentBuilderHandlers[SAX_VALUE_CLOSE] = nodeClosed;
       contentBuilderHandlers[SAX_KEY] = keyFound;
       return contentBuilderHandlers;
    }
    
    /**
     * The jsonPath evaluator compiler used for Oboe.js. 
     * 
     * One function is exposed. This function takes a String JSONPath spec and 
     * returns a function to test candidate ascents for matches.
     * 
     *  String jsonPath -> (List ascent) -> Boolean|Object
     *
     * This file is coded in a pure functional style. That is, no function has 
     * side effects, every function evaluates to the same value for the same 
     * arguments and no variables are reassigned.
     */  
    // the call to jsonPathSyntax injects the token syntaxes that are needed 
    // inside the compiler
    var jsonPathCompiler = jsonPathSyntax(function (pathNodeSyntax, 
                                                    doubleDotSyntax, 
                                                    dotSyntax,
                                                    bangSyntax,
                                                    emptySyntax ) {
    
       var CAPTURING_INDEX = 1;
       var NAME_INDEX = 2;
       var FIELD_LIST_INDEX = 3;
    
       var headKey  = compose2(keyOf, head),
           headNode = compose2(nodeOf, head);
                       
       /**
        * Create an evaluator function for a named path node, expressed in the
        * JSONPath like:
        *    foo
        *    ["bar"]
        *    [2]   
        */
       function nameClause(previousExpr, detection ) {
         
          var name = detection[NAME_INDEX],
                
              matchesName = ( !name || name == '*' ) 
                               ?  always
                               :  function(ascent){return headKey(ascent) == name};
         
    
          return lazyIntersection(matchesName, previousExpr);
       }
    
       /**
        * Create an evaluator function for a a duck-typed node, expressed like:
        * 
        *    {spin, taste, colour}
        *    .particle{spin, taste, colour}
        *    *{spin, taste, colour}
        */
       function duckTypeClause(previousExpr, detection) {
    
          var fieldListStr = detection[FIELD_LIST_INDEX];
    
          if (!fieldListStr) 
             return previousExpr; // don't wrap at all, return given expr as-is      
    
          var hasAllrequiredFields = partialComplete(
                                        hasAllProperties, 
                                        arrayAsList(fieldListStr.split(/\W+/))
                                     ),
                                     
              isMatch =  compose2( 
                            hasAllrequiredFields, 
                            headNode
                         );
    
          return lazyIntersection(isMatch, previousExpr);
       }
    
       /**
        * Expression for $, returns the evaluator function
        */
       function capture( previousExpr, detection ) {
    
          // extract meaning from the detection      
          var capturing = !!detection[CAPTURING_INDEX];
    
          if (!capturing)          
             return previousExpr; // don't wrap at all, return given expr as-is      
          
          return lazyIntersection(previousExpr, head);
                
       }            
          
       /**
        * Create an evaluator function that moves onto the next item on the 
        * lists. This function is the place where the logic to move up a 
        * level in the ascent exists. 
        * 
        * Eg, for JSONPath ".foo" we need skip1(nameClause(always, [,'foo']))
        */
       function skip1(previousExpr) {
       
       
          if( previousExpr == always ) {
             /* If there is no previous expression this consume command 
                is at the start of the jsonPath.
                Since JSONPath specifies what we'd like to find but not 
                necessarily everything leading down to it, when running
                out of JSONPath to check against we default to true */
             return always;
          }
    
          /** return true if the ascent we have contains only the JSON root,
           *  false otherwise
           */
          function notAtRoot(ascent){
             return headKey(ascent) != ROOT_PATH;
          }
          
          return lazyIntersection(
                   /* If we're already at the root but there are more 
                      expressions to satisfy, can't consume any more. No match.
    
                      This check is why none of the other exprs have to be able 
                      to handle empty lists; skip1 is the only evaluator that 
                      moves onto the next token and it refuses to do so once it 
                      reaches the last item in the list. */
                   notAtRoot,
                   
                   /* We are not at the root of the ascent yet.
                      Move to the next level of the ascent by handing only 
                      the tail to the previous expression */ 
                   compose2(previousExpr, tail) 
          );
                                                                                                                   
       }   
       
       /**
        * Create an evaluator function for the .. (double dot) token. Consumes
        * zero or more levels of the ascent, the fewest that are required to find
        * a match when given to previousExpr.
        */   
       function skipMany(previousExpr) {
    
          if( previousExpr == always ) {
             /* If there is no previous expression this consume command 
                is at the start of the jsonPath.
                Since JSONPath specifies what we'd like to find but not 
                necessarily everything leading down to it, when running
                out of JSONPath to check against we default to true */            
             return always;
          }
              
          var 
              // In JSONPath .. is equivalent to !.. so if .. reaches the root
              // the match has succeeded. Ie, we might write ..foo or !..foo
              // and both should match identically.
              terminalCaseWhenArrivingAtRoot = rootExpr(),
              terminalCaseWhenPreviousExpressionIsSatisfied = previousExpr,
              recursiveCase = skip1(function(ascent) {
                 return cases(ascent);
              }),
    
              cases = lazyUnion(
                         terminalCaseWhenArrivingAtRoot
                      ,  terminalCaseWhenPreviousExpressionIsSatisfied
                      ,  recursiveCase  
                      );
          
          return cases;
       }      
       
       /**
        * Generate an evaluator for ! - matches only the root element of the json
        * and ignores any previous expressions since nothing may precede !. 
        */   
       function rootExpr() {
          
          return function(ascent){
             return headKey(ascent) == ROOT_PATH;
          };
       }   
             
       /**
        * Generate a statement wrapper to sit around the outermost 
        * clause evaluator.
        * 
        * Handles the case where the capturing is implicit because the JSONPath
        * did not contain a '$' by returning the last node.
        */   
       function statementExpr(lastClause) {
          
          return function(ascent) {
       
             // kick off the evaluation by passing through to the last clause
             var exprMatch = lastClause(ascent);
                                                         
             return exprMatch === true ? head(ascent) : exprMatch;
          };
       }      
                              
       /**
        * For when a token has been found in the JSONPath input.
        * Compiles the parser for that token and returns in combination with the
        * parser already generated.
        * 
        * @param {Function} exprs  a list of the clause evaluator generators for
        *                          the token that was found
        * @param {Function} parserGeneratedSoFar the parser already found
        * @param {Array} detection the match given by the regex engine when 
        *                          the feature was found
        */
       function expressionsReader( exprs, parserGeneratedSoFar, detection ) {
                         
          // if exprs is zero-length foldR will pass back the 
          // parserGeneratedSoFar as-is so we don't need to treat 
          // this as a special case
          
          return   foldR( 
                      function( parserGeneratedSoFar, expr ){
             
                         return expr(parserGeneratedSoFar, detection);
                      }, 
                      parserGeneratedSoFar, 
                      exprs
                   );                     
    
       }
    
       /** 
        *  If jsonPath matches the given detector function, creates a function which
        *  evaluates against every clause in the clauseEvaluatorGenerators. The
        *  created function is propagated to the onSuccess function, along with
        *  the remaining unparsed JSONPath substring.
        *  
        *  The intended use is to create a clauseMatcher by filling in
        *  the first two arguments, thus providing a function that knows
        *  some syntax to match and what kind of generator to create if it
        *  finds it. The parameter list once completed is:
        *  
        *    (jsonPath, parserGeneratedSoFar, onSuccess)
        *  
        *  onSuccess may be compileJsonPathToFunction, to recursively continue 
        *  parsing after finding a match or returnFoundParser to stop here.
        */
       function generateClauseReaderIfTokenFound (
         
                            tokenDetector, clauseEvaluatorGenerators,
                             
                            jsonPath, parserGeneratedSoFar, onSuccess) {
                            
          var detected = tokenDetector(jsonPath);
    
          if(detected) {
             var compiledParser = expressionsReader(
                                     clauseEvaluatorGenerators, 
                                     parserGeneratedSoFar, 
                                     detected
                                  ),
             
                 remainingUnparsedJsonPath = jsonPath.substr(len(detected[0]));                
                                   
             return onSuccess(remainingUnparsedJsonPath, compiledParser);
          }         
       }
                     
       /**
        * Partially completes generateClauseReaderIfTokenFound above. 
        */
       function clauseMatcher(tokenDetector, exprs) {
            
          return   partialComplete( 
                      generateClauseReaderIfTokenFound, 
                      tokenDetector, 
                      exprs 
                   );
       }
    
       /**
        * clauseForJsonPath is a function which attempts to match against 
        * several clause matchers in order until one matches. If non match the
        * jsonPath expression is invalid and an error is thrown.
        * 
        * The parameter list is the same as a single clauseMatcher:
        * 
        *    (jsonPath, parserGeneratedSoFar, onSuccess)
        */     
       var clauseForJsonPath = lazyUnion(
    
          clauseMatcher(pathNodeSyntax   , list( capture, 
                                                 duckTypeClause, 
                                                 nameClause, 
                                                 skip1 ))
                                                         
       ,  clauseMatcher(doubleDotSyntax  , list( skipMany))
           
           // dot is a separator only (like whitespace in other languages) but 
           // rather than make it a special case, use an empty list of 
           // expressions when this token is found
       ,  clauseMatcher(dotSyntax        , list() )  
                                                                                          
       ,  clauseMatcher(bangSyntax       , list( capture,
                                                 rootExpr))
                                                              
       ,  clauseMatcher(emptySyntax      , list( statementExpr))
       
       ,  function (jsonPath) {
             throw Error('"' + jsonPath + '" could not be tokenised')      
          }
       );
    
    
       /**
        * One of two possible values for the onSuccess argument of 
        * generateClauseReaderIfTokenFound.
        * 
        * When this function is used, generateClauseReaderIfTokenFound simply 
        * returns the compiledParser that it made, regardless of if there is 
        * any remaining jsonPath to be compiled.
        */
       function returnFoundParser(_remainingJsonPath, compiledParser){ 
          return compiledParser 
       }     
                  
       /**
        * Recursively compile a JSONPath expression.
        * 
        * This function serves as one of two possible values for the onSuccess 
        * argument of generateClauseReaderIfTokenFound, meaning continue to
        * recursively compile. Otherwise, returnFoundParser is given and
        * compilation terminates.
        */
       function compileJsonPathToFunction( uncompiledJsonPath, 
                                           parserGeneratedSoFar ) {
    
          /**
           * On finding a match, if there is remaining text to be compiled
           * we want to either continue parsing using a recursive call to 
           * compileJsonPathToFunction. Otherwise, we want to stop and return 
           * the parser that we have found so far.
           */
          var onFind =      uncompiledJsonPath
                         ?  compileJsonPathToFunction 
                         :  returnFoundParser;
                       
          return   clauseForJsonPath( 
                      uncompiledJsonPath, 
                      parserGeneratedSoFar, 
                      onFind
                   );                              
       }
    
       /**
        * This is the function that we expose to the rest of the library.
        */
       return function(jsonPath){
            
          try {
             // Kick off the recursive parsing of the jsonPath 
             return compileJsonPathToFunction(jsonPath, always);
             
          } catch( e ) {
             throw Error( 'Could not compile "' + jsonPath + 
                          '" because ' + e.message
             );
          }
       }
    
    });
    
    /** 
     * A pub/sub which is responsible for a single event type. A 
     * multi-event type event bus is created by pubSub by collecting
     * several of these.
     * 
     * @param {String} eventType                   
     *    the name of the events managed by this singleEventPubSub
     * @param {singleEventPubSub} [newListener]    
     *    place to notify of new listeners
     * @param {singleEventPubSub} [removeListener] 
     *    place to notify of when listeners are removed
     */
    function singleEventPubSub(eventType, newListener, removeListener){
    
       /** we are optimised for emitting events over firing them.
        *  As well as the tuple list which stores event ids and
        *  listeners there is a list with just the listeners which 
        *  can be iterated more quickly when we are emitting
        */
       var listenerTupleList,
           listenerList;
    
       function hasId(id){
          return function(tuple) {
             return tuple.id == id;      
          };  
       }
                  
       return {
    
          /**
           * @param {Function} listener
           * @param {*} listenerId 
           *    an id that this listener can later by removed by. 
           *    Can be of any type, to be compared to other ids using ==
           */
          on:function( listener, listenerId ) {
             
             var tuple = {
                listener: listener
             ,  id:       listenerId || listener // when no id is given use the
                                                 // listener function as the id
             };
    
             if( newListener ) {
                newListener.emit(eventType, listener, tuple.id);
             }
             
             listenerTupleList = cons( tuple,    listenerTupleList );
             listenerList      = cons( listener, listenerList      );
    
             return this; // chaining
          },
         
          emit:function () {                                                                                           
             applyEach( listenerList, arguments );
          },
          
          un: function( listenerId ) {
                 
             var removed;             
                  
             listenerTupleList = without(
                listenerTupleList,
                hasId(listenerId),
                function(tuple){
                   removed = tuple;
                }
             );    
             
             if( removed ) {
                listenerList = without( listenerList, function(listener){
                   return listener == removed.listener;
                });
             
                if( removeListener ) {
                   removeListener.emit(eventType, removed.listener, removed.id);
                }
             }
          },
          
          listeners: function(){
             // differs from Node EventEmitter: returns list, not array
             return listenerList;
          },
          
          hasListener: function(listenerId){
             var test = listenerId? hasId(listenerId) : always;
          
             return defined(first( test, listenerTupleList));
          }
       };
    }
    /**
     * pubSub is a curried interface for listening to and emitting
     * events.
     * 
     * If we get a bus:
     *    
     *    var bus = pubSub();
     * 
     * We can listen to event 'foo' like:
     * 
     *    bus('foo').on(myCallback)
     *    
     * And emit event foo like:
     * 
     *    bus('foo').emit()
     *    
     * or, with a parameter:
     * 
     *    bus('foo').emit('bar')
     *     
     * All functions can be cached and don't need to be 
     * bound. Ie:
     * 
     *    var fooEmitter = bus('foo').emit
     *    fooEmitter('bar');  // emit an event
     *    fooEmitter('baz');  // emit another
     *    
     * There's also an uncurried[1] shortcut for .emit and .on:
     * 
     *    bus.on('foo', callback)
     *    bus.emit('foo', 'bar')
     * 
     * [1]: http://zvon.org/other/haskell/Outputprelude/uncurry_f.html
     */
    function pubSub(){
    
       var singles = {},
           newListener = newSingle('newListener'),
           removeListener = newSingle('removeListener'); 
          
       function newSingle(eventName) {
          return singles[eventName] = singleEventPubSub(
             eventName, 
             newListener, 
             removeListener
          );   
       }      
    
       /** pubSub instances are functions */
       function pubSubInstance( eventName ){   
          
          return singles[eventName] || newSingle( eventName );   
       }
    
       // add convenience EventEmitter-style uncurried form of 'emit' and 'on'
       ['emit', 'on', 'un'].forEach(function(methodName){
       
          pubSubInstance[methodName] = varArgs(function(eventName, parameters){
             apply( parameters, pubSubInstance( eventName )[methodName]);
          });   
       });
             
       return pubSubInstance;
    }
    
    /**
     * This file declares some constants to use as names for event types.
     */
    
    var // the events which are never exported are kept as 
        // the smallest possible representation, in numbers:
        _S = 1,
    
        // fired whenever a new node starts in the JSON stream:
        NODE_OPENED     = _S++,
    
        // fired whenever a node closes in the JSON stream:
        NODE_CLOSED     = _S++,
    
        // called if a .node callback returns a value - 
        NODE_SWAP       = _S++,
        NODE_DROP       = _S++,
    
        FAIL_EVENT      = 'fail',
       
        ROOT_NODE_FOUND = _S++,
        ROOT_PATH_FOUND = _S++,
       
        HTTP_START      = 'start',
        STREAM_DATA     = 'data',
        STREAM_END      = 'end',
        ABORTING        = _S++,
    
        // SAX events butchered from Clarinet
        SAX_KEY          = _S++,
        SAX_VALUE_OPEN   = _S++,
        SAX_VALUE_CLOSE  = _S++;
        
    function errorReport(statusCode, body, error) {
       try{
          var jsonBody = JSON.parse(body);
       }catch(e){}
    
       return {
          statusCode:statusCode,
          body:body,
          jsonBody:jsonBody,
          thrown:error
       };
    }    
    
    /** 
     *  The pattern adaptor listens for newListener and removeListener
     *  events. When patterns are added or removed it compiles the JSONPath
     *  and wires them up.
     *  
     *  When nodes and paths are found it emits the fully-qualified match 
     *  events with parameters ready to ship to the outside world
     */
    
    function patternAdapter(oboeBus, jsonPathCompiler) {
    
       var predicateEventMap = {
          node:oboeBus(NODE_CLOSED)
       ,  path:oboeBus(NODE_OPENED)
       };
         
       function emitMatchingNode(emitMatch, node, ascent) {
             
          /* 
             We're now calling to the outside world where Lisp-style 
             lists will not be familiar. Convert to standard arrays. 
       
             Also, reverse the order because it is more common to 
             list paths "root to leaf" than "leaf to root"  */
          var descent     = reverseList(ascent);
                    
          emitMatch(
             node,
             
             // To make a path, strip off the last item which is the special
             // ROOT_PATH token for the 'path' to the root node          
             listAsArray(tail(map(keyOf,descent))),  // path
             listAsArray(map(nodeOf, descent))       // ancestors    
          );         
       }
    
       /* 
        * Set up the catching of events such as NODE_CLOSED and NODE_OPENED and, if 
        * matching the specified pattern, propagate to pattern-match events such as 
        * oboeBus('node:!')
        * 
        * 
        * 
        * @param {Function} predicateEvent 
        *          either oboeBus(NODE_CLOSED) or oboeBus(NODE_OPENED).
        * @param {Function} compiledJsonPath          
        */
       function addUnderlyingListener( fullEventName, predicateEvent, compiledJsonPath ){
       
          var emitMatch = oboeBus(fullEventName).emit;
       
          predicateEvent.on( function (ascent) {
    
             var maybeMatchingMapping = compiledJsonPath(ascent);
    
             /* Possible values for maybeMatchingMapping are now:
    
              false: 
              we did not match 
    
              an object/array/string/number/null: 
              we matched and have the node that matched.
              Because nulls are valid json values this can be null.
    
              undefined:
              we matched but don't have the matching node yet.
              ie, we know there is an upcoming node that matches but we 
              can't say anything else about it. 
              */
             if (maybeMatchingMapping !== false) {
    
                emitMatchingNode(
                   emitMatch, 
                   nodeOf(maybeMatchingMapping), 
                   ascent
                );
             }
          }, fullEventName);
         
          oboeBus('removeListener').on( function(removedEventName){
    
             // if the fully qualified match event listener is later removed, clean up 
             // by removing the underlying listener if it was the last using that pattern:
          
             if( removedEventName == fullEventName ) {
             
                if( !oboeBus(removedEventName).listeners(  )) {
                   predicateEvent.un( fullEventName );
                }
             }
          });   
       }
    
       oboeBus('newListener').on( function(fullEventName){
    
          var match = /(node|path):(.*)/.exec(fullEventName);
          
          if( match ) {
             var predicateEvent = predicateEventMap[match[1]];
                        
             if( !predicateEvent.hasListener( fullEventName) ) {  
                      
                addUnderlyingListener(
                   fullEventName,
                   predicateEvent, 
                   jsonPathCompiler( match[2] )
                );
             }
          }    
       })
    
    }
    
    /** 
     * The instance API is the thing that is returned when oboe() is called.
     * it allows:
     * 
     *    - listeners for various events to be added and removed
     *    - the http response header/headers to be read
     */
    function instanceApi(oboeBus, contentSource){
    
       var oboeApi,
           fullyQualifiedNamePattern = /^(node|path):./,
           rootNodeFinishedEvent = oboeBus(ROOT_NODE_FOUND),
           emitNodeDrop = oboeBus(NODE_DROP).emit,
           emitNodeSwap = oboeBus(NODE_SWAP).emit,
    
           /**
            * Add any kind of listener that the instance api exposes 
            */          
           addListener = varArgs(function( eventId, parameters ){
                 
                if( oboeApi[eventId] ) {
           
                   // for events added as .on(event, callback), if there is a 
                   // .event() equivalent with special behaviour , pass through
                   // to that: 
                   apply(parameters, oboeApi[eventId]);                     
                } else {
           
                   // we have a standard Node.js EventEmitter 2-argument call.
                   // The first parameter is the listener.
                   var event = oboeBus(eventId),
                       listener = parameters[0];
           
                   if( fullyQualifiedNamePattern.test(eventId) ) {
                    
                      // allow fully-qualified node/path listeners 
                      // to be added                                             
                      addForgettableCallback(event, listener);                  
                   } else  {
           
                      // the event has no special handling, pass through 
                      // directly onto the event bus:          
                      event.on( listener);
                   }
                }
                    
                return oboeApi; // chaining
           }),
     
           /**
            * Remove any kind of listener that the instance api exposes 
            */ 
           removeListener = function( eventId, p2, p3 ){
                 
                if( eventId == 'done' ) {
                
                   rootNodeFinishedEvent.un(p2);
                   
                } else if( eventId == 'node' || eventId == 'path' ) {
          
                   // allow removal of node and path 
                   oboeBus.un(eventId + ':' + p2, p3);          
                } else {
          
                   // we have a standard Node.js EventEmitter 2-argument call.
                   // The second parameter is the listener. This may be a call
                   // to remove a fully-qualified node/path listener but requires
                   // no special handling
                   var listener = p2;
    
                   oboeBus(eventId).un(listener);                  
                }
                   
                return oboeApi; // chaining      
           };                               
                            
       /** 
        * Add a callback, wrapped in a try/catch so as to not break the
        * execution of Oboe if an exception is thrown (fail events are 
        * fired instead)
        * 
        * The callback is used as the listener id so that it can later be
        * removed using .un(callback)
        */
       function addProtectedCallback(eventName, callback) {
          oboeBus(eventName).on(protectedCallback(callback), callback);
          return oboeApi; // chaining            
       }
    
       /**
        * Add a callback where, if .forget() is called during the callback's
        * execution, the callback will be de-registered
        */
       function addForgettableCallback(event, callback, listenerId) {
          
          // listnerId is optional and if not given, the original
          // callback will be used
          listenerId = listenerId || callback;
          
          var safeCallback = protectedCallback(callback);
       
          event.on( function() {
          
             var discard = false;
                 
             oboeApi.forget = function(){
                discard = true;
             };           
             
             apply( arguments, safeCallback );         
                   
             delete oboeApi.forget;
             
             if( discard ) {
                event.un(listenerId);
             }
          }, listenerId);
          
          return oboeApi; // chaining         
       }
          
       /** 
        *  wrap a callback so that if it throws, Oboe.js doesn't crash but instead
        *  handles it like a normal error
        */
       function protectedCallback( callback ) {
          return function() {
             try{      
                return callback.apply(oboeApi, arguments);   
             }catch(e)  {
             
                // An error occured during the callback, publish it on the event bus 
                oboeBus(FAIL_EVENT).emit( errorReport(undefined, undefined, e));
             }      
          }   
       }
    
       /**
        * Return the fully qualified event for when a pattern matches
        * either a node or a path
        * 
        * @param type {String} either 'node' or 'path'
        */      
       function fullyQualifiedPatternMatchEvent(type, pattern) {
          return oboeBus(type + ':' + pattern);
       }
    
       function wrapCallbackToSwapNodeIfSomethingReturned( callback ) {
          return function() {
             var returnValueFromCallback = callback.apply(this, arguments);
    
             if( defined(returnValueFromCallback) ) {
                
                if( returnValueFromCallback == oboe.drop ) {
                   emitNodeDrop();
                } else {
                   emitNodeSwap(returnValueFromCallback);
                }
             }
          }
       }
    
       function addSingleNodeOrPathListener(eventId, pattern, callback) {
    
          var effectiveCallback;
    
          if( eventId == 'node' ) {
             effectiveCallback = wrapCallbackToSwapNodeIfSomethingReturned(callback);
          } else {
             effectiveCallback = callback;
          }
          
          addForgettableCallback(
             fullyQualifiedPatternMatchEvent(eventId, pattern),
             effectiveCallback,
             callback
          );
       }
    
       /**
        * Add several listeners at a time, from a map
        */
       function addMultipleNodeOrPathListeners(eventId, listenerMap) {
       
          for( var pattern in listenerMap ) {
             addSingleNodeOrPathListener(eventId, pattern, listenerMap[pattern]);
          }
       }    
             
       /**
        * implementation behind .onPath() and .onNode()
        */       
       function addNodeOrPathListenerApi( eventId, jsonPathOrListenerMap, callback ){
             
          if( isString(jsonPathOrListenerMap) ) {
             addSingleNodeOrPathListener(eventId, jsonPathOrListenerMap, callback);
    
          } else {
             addMultipleNodeOrPathListeners(eventId, jsonPathOrListenerMap);
          }
          
          return oboeApi; // chaining
       }
          
       
       // some interface methods are only filled in after we receive
       // values and are noops before that:          
       oboeBus(ROOT_PATH_FOUND).on( function(rootNode) {
          oboeApi.root = functor(rootNode);   
       });
    
       /**
        * When content starts make the headers readable through the
        * instance API
        */
       oboeBus(HTTP_START).on( function(_statusCode, headers) {
       
          oboeApi.header =  function(name) {
                               return name ? headers[name] 
                                           : headers
                                           ;
                            }
       });
                                                                   
       /**
        * Construct and return the public API of the Oboe instance to be 
        * returned to the calling application
        */       
       return oboeApi = {
          on             : addListener,
          addListener    : addListener, 
          removeListener : removeListener,
          emit           : oboeBus.emit,                
                    
          node           : partialComplete(addNodeOrPathListenerApi, 'node'),
          path           : partialComplete(addNodeOrPathListenerApi, 'path'),
          
          done           : partialComplete(addForgettableCallback, rootNodeFinishedEvent),            
          start          : partialComplete(addProtectedCallback, HTTP_START ),
          
          // fail doesn't use protectedCallback because 
          // could lead to non-terminating loops
          fail           : oboeBus(FAIL_EVENT).on,
          
          // public api calling abort fires the ABORTING event
          abort          : oboeBus(ABORTING).emit,
          
          // initially return nothing for header and root
          header         : noop,
          root           : noop,
          
          source         : contentSource
       };   
    }
        
    
    /**
     * This file sits just behind the API which is used to attain a new
     * Oboe instance. It creates the new components that are required
     * and introduces them to each other.
     */
    
    function wire (httpMethodName, contentSource, body, headers, withCredentials){
    
       var oboeBus = pubSub();
       
       // Wire the input stream in if we are given a content source.
       // This will usually be the case. If not, the instance created
       // will have to be passed content from an external source.
      
       if( contentSource ) {
    
          streamingHttp( oboeBus,
                         httpTransport(), 
                         httpMethodName,
                         contentSource,
                         body,
                         headers,
                         withCredentials
          );
       }
    
       clarinet(oboeBus);
    
       ascentManager(oboeBus, incrementalContentBuilder(oboeBus));
          
       patternAdapter(oboeBus, jsonPathCompiler);      
          
       return instanceApi(oboeBus, contentSource);
    }
    
    function applyDefaults( passthrough, url, httpMethodName, body, headers, withCredentials, cached ){
    
       headers = headers ?
          // Shallow-clone the headers array. This allows it to be
          // modified without side effects to the caller. We don't
          // want to change objects that the user passes in.
          JSON.parse(JSON.stringify(headers))
          : {};
    
       if( body ) {
          if( !isString(body) ) {
    
             // If the body is not a string, stringify it. This allows objects to
             // be given which will be sent as JSON.
             body = JSON.stringify(body);
    
             // Default Content-Type to JSON unless given otherwise.
             headers['Content-Type'] = headers['Content-Type'] || 'application/json';
          }
       } else {
          body = null;
       }
    
       // support cache busting like jQuery.ajax({cache:false})
       function modifiedUrl(baseUrl, cached) {
    
          if( cached === false ) {
    
             if( baseUrl.indexOf('?') == -1 ) {
                baseUrl += '?';
             } else {
                baseUrl += '&';
             }
    
             baseUrl += '_=' + new Date().getTime();
          }
          return baseUrl;
       }
    
       return passthrough( httpMethodName || 'GET', modifiedUrl(url, cached), body, headers, withCredentials || false );
    }
    
    // export public API
    function oboe(arg1) {
    
       var nodeStreamMethodNames = list('resume', 'pause', 'pipe', 'unpipe', 'unshift'),
           isStream = partialComplete(
                         hasAllProperties
                      ,  nodeStreamMethodNames
                      );
       
       if( arg1 ) {
          if (isStream(arg1) || isString(arg1)) {
    
             //  simple version for GETs. Signature is:
             //    oboe( url )
             //  or, under node:
             //    oboe( readableStream )
             return applyDefaults(
                wire,
                arg1 // url
             );
    
          } else {
    
             // method signature is:
             //    oboe({method:m, url:u, body:b, headers:{...}})
    
             return applyDefaults(
                wire,
                arg1.url,
                arg1.method,
                arg1.body,
                arg1.headers,
                arg1.withCredentials,
                arg1.cached
             );
             
          }
       } else {
          // wire up a no-AJAX, no-stream Oboe. Will have to have content 
          // fed in externally and using .emit.
          return wire();
       }
    }
    
    /* oboe.drop is a special value. If a node callback returns this value the
       parsed node is deleted from the JSON
     */
    oboe.drop = function() {
       return oboe.drop;
    };
    
    
       return oboe;
    })();
    
  provide("oboe", module.exports);
}(global));

// pakmanager:q
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  // vim:ts=4:sts=4:sw=4:
    /*!
     *
     * Copyright 2009-2012 Kris Kowal under the terms of the MIT
     * license found at http://github.com/kriskowal/q/raw/master/LICENSE
     *
     * With parts by Tyler Close
     * Copyright 2007-2009 Tyler Close under the terms of the MIT X license found
     * at http://www.opensource.org/licenses/mit-license.html
     * Forked at ref_send.js version: 2009-05-11
     *
     * With parts by Mark Miller
     * Copyright (C) 2011 Google Inc.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     * http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     *
     */
    
    (function (definition) {
        "use strict";
    
        // This file will function properly as a <script> tag, or a module
        // using CommonJS and NodeJS or RequireJS module formats.  In
        // Common/Node/RequireJS, the module exports the Q API and when
        // executed as a simple <script>, it creates a Q global instead.
    
        // Montage Require
        if (typeof bootstrap === "function") {
            bootstrap("promise", definition);
    
        // CommonJS
        } else if (typeof exports === "object" && typeof module === "object") {
            module.exports = definition();
    
        // RequireJS
        } else if (typeof define === "function" && define.amd) {
            define(definition);
    
        // SES (Secure EcmaScript)
        } else if (typeof ses !== "undefined") {
            if (!ses.ok()) {
                return;
            } else {
                ses.makeQ = definition;
            }
    
        // <script>
        } else if (typeof self !== "undefined") {
            self.Q = definition();
    
        } else {
            throw new Error("This environment was not anticipated by Q. Please file a bug.");
        }
    
    })(function () {
    "use strict";
    
    var hasStacks = false;
    try {
        throw new Error();
    } catch (e) {
        hasStacks = !!e.stack;
    }
    
    // All code after this point will be filtered from stack traces reported
    // by Q.
    var qStartingLine = captureLine();
    var qFileName;
    
    // shims
    
    // used for fallback in "allResolved"
    var noop = function () {};
    
    // Use the fastest possible means to execute a task in a future turn
    // of the event loop.
    var nextTick =(function () {
        // linked list of tasks (single, with head node)
        var head = {task: void 0, next: null};
        var tail = head;
        var flushing = false;
        var requestTick = void 0;
        var isNodeJS = false;
    
        function flush() {
            /* jshint loopfunc: true */
    
            while (head.next) {
                head = head.next;
                var task = head.task;
                head.task = void 0;
                var domain = head.domain;
    
                if (domain) {
                    head.domain = void 0;
                    domain.enter();
                }
    
                try {
                    task();
    
                } catch (e) {
                    if (isNodeJS) {
                        // In node, uncaught exceptions are considered fatal errors.
                        // Re-throw them synchronously to interrupt flushing!
    
                        // Ensure continuation if the uncaught exception is suppressed
                        // listening "uncaughtException" events (as domains does).
                        // Continue in next event to avoid tick recursion.
                        if (domain) {
                            domain.exit();
                        }
                        setTimeout(flush, 0);
                        if (domain) {
                            domain.enter();
                        }
    
                        throw e;
    
                    } else {
                        // In browsers, uncaught exceptions are not fatal.
                        // Re-throw them asynchronously to avoid slow-downs.
                        setTimeout(function() {
                           throw e;
                        }, 0);
                    }
                }
    
                if (domain) {
                    domain.exit();
                }
            }
    
            flushing = false;
        }
    
        nextTick = function (task) {
            tail = tail.next = {
                task: task,
                domain: isNodeJS && process.domain,
                next: null
            };
    
            if (!flushing) {
                flushing = true;
                requestTick();
            }
        };
    
        if (typeof process !== "undefined" && process.nextTick) {
            // Node.js before 0.9. Note that some fake-Node environments, like the
            // Mocha test runner, introduce a `process` global without a `nextTick`.
            isNodeJS = true;
    
            requestTick = function () {
                process.nextTick(flush);
            };
    
        } else if (typeof setImmediate === "function") {
            // In IE10, Node.js 0.9+, or https://github.com/NobleJS/setImmediate
            if (typeof window !== "undefined") {
                requestTick = setImmediate.bind(window, flush);
            } else {
                requestTick = function () {
                    setImmediate(flush);
                };
            }
    
        } else if (typeof MessageChannel !== "undefined") {
            // modern browsers
            // http://www.nonblocking.io/2011/06/windownexttick.html
            var channel = new MessageChannel();
            // At least Safari Version 6.0.5 (8536.30.1) intermittently cannot create
            // working message ports the first time a page loads.
            channel.port1.onmessage = function () {
                requestTick = requestPortTick;
                channel.port1.onmessage = flush;
                flush();
            };
            var requestPortTick = function () {
                // Opera requires us to provide a message payload, regardless of
                // whether we use it.
                channel.port2.postMessage(0);
            };
            requestTick = function () {
                setTimeout(flush, 0);
                requestPortTick();
            };
    
        } else {
            // old browsers
            requestTick = function () {
                setTimeout(flush, 0);
            };
        }
    
        return nextTick;
    })();
    
    // Attempt to make generics safe in the face of downstream
    // modifications.
    // There is no situation where this is necessary.
    // If you need a security guarantee, these primordials need to be
    // deeply frozen anyway, and if you don’t need a security guarantee,
    // this is just plain paranoid.
    // However, this **might** have the nice side-effect of reducing the size of
    // the minified code by reducing x.call() to merely x()
    // See Mark Miller’s explanation of what this does.
    // http://wiki.ecmascript.org/doku.php?id=conventions:safe_meta_programming
    var call = Function.call;
    function uncurryThis(f) {
        return function () {
            return call.apply(f, arguments);
        };
    }
    // This is equivalent, but slower:
    // uncurryThis = Function_bind.bind(Function_bind.call);
    // http://jsperf.com/uncurrythis
    
    var array_slice = uncurryThis(Array.prototype.slice);
    
    var array_reduce = uncurryThis(
        Array.prototype.reduce || function (callback, basis) {
            var index = 0,
                length = this.length;
            // concerning the initial value, if one is not provided
            if (arguments.length === 1) {
                // seek to the first value in the array, accounting
                // for the possibility that is is a sparse array
                do {
                    if (index in this) {
                        basis = this[index++];
                        break;
                    }
                    if (++index >= length) {
                        throw new TypeError();
                    }
                } while (1);
            }
            // reduce
            for (; index < length; index++) {
                // account for the possibility that the array is sparse
                if (index in this) {
                    basis = callback(basis, this[index], index);
                }
            }
            return basis;
        }
    );
    
    var array_indexOf = uncurryThis(
        Array.prototype.indexOf || function (value) {
            // not a very good shim, but good enough for our one use of it
            for (var i = 0; i < this.length; i++) {
                if (this[i] === value) {
                    return i;
                }
            }
            return -1;
        }
    );
    
    var array_map = uncurryThis(
        Array.prototype.map || function (callback, thisp) {
            var self = this;
            var collect = [];
            array_reduce(self, function (undefined, value, index) {
                collect.push(callback.call(thisp, value, index, self));
            }, void 0);
            return collect;
        }
    );
    
    var object_create = Object.create || function (prototype) {
        function Type() { }
        Type.prototype = prototype;
        return new Type();
    };
    
    var object_hasOwnProperty = uncurryThis(Object.prototype.hasOwnProperty);
    
    var object_keys = Object.keys || function (object) {
        var keys = [];
        for (var key in object) {
            if (object_hasOwnProperty(object, key)) {
                keys.push(key);
            }
        }
        return keys;
    };
    
    var object_toString = uncurryThis(Object.prototype.toString);
    
    function isObject(value) {
        return value === Object(value);
    }
    
    // generator related shims
    
    // FIXME: Remove this function once ES6 generators are in SpiderMonkey.
    function isStopIteration(exception) {
        return (
            object_toString(exception) === "[object StopIteration]" ||
            exception instanceof QReturnValue
        );
    }
    
    // FIXME: Remove this helper and Q.return once ES6 generators are in
    // SpiderMonkey.
    var QReturnValue;
    if (typeof ReturnValue !== "undefined") {
        QReturnValue = ReturnValue;
    } else {
        QReturnValue = function (value) {
            this.value = value;
        };
    }
    
    // long stack traces
    
    var STACK_JUMP_SEPARATOR = "From previous event:";
    
    function makeStackTraceLong(error, promise) {
        // If possible, transform the error stack trace by removing Node and Q
        // cruft, then concatenating with the stack trace of `promise`. See #57.
        if (hasStacks &&
            promise.stack &&
            typeof error === "object" &&
            error !== null &&
            error.stack &&
            error.stack.indexOf(STACK_JUMP_SEPARATOR) === -1
        ) {
            var stacks = [];
            for (var p = promise; !!p; p = p.source) {
                if (p.stack) {
                    stacks.unshift(p.stack);
                }
            }
            stacks.unshift(error.stack);
    
            var concatedStacks = stacks.join("\n" + STACK_JUMP_SEPARATOR + "\n");
            error.stack = filterStackString(concatedStacks);
        }
    }
    
    function filterStackString(stackString) {
        var lines = stackString.split("\n");
        var desiredLines = [];
        for (var i = 0; i < lines.length; ++i) {
            var line = lines[i];
    
            if (!isInternalFrame(line) && !isNodeFrame(line) && line) {
                desiredLines.push(line);
            }
        }
        return desiredLines.join("\n");
    }
    
    function isNodeFrame(stackLine) {
        return stackLine.indexOf("(module.js:") !== -1 ||
               stackLine.indexOf("(node.js:") !== -1;
    }
    
    function getFileNameAndLineNumber(stackLine) {
        // Named functions: "at functionName (filename:lineNumber:columnNumber)"
        // In IE10 function name can have spaces ("Anonymous function") O_o
        var attempt1 = /at .+ \((.+):(\d+):(?:\d+)\)$/.exec(stackLine);
        if (attempt1) {
            return [attempt1[1], Number(attempt1[2])];
        }
    
        // Anonymous functions: "at filename:lineNumber:columnNumber"
        var attempt2 = /at ([^ ]+):(\d+):(?:\d+)$/.exec(stackLine);
        if (attempt2) {
            return [attempt2[1], Number(attempt2[2])];
        }
    
        // Firefox style: "function@filename:lineNumber or @filename:lineNumber"
        var attempt3 = /.*@(.+):(\d+)$/.exec(stackLine);
        if (attempt3) {
            return [attempt3[1], Number(attempt3[2])];
        }
    }
    
    function isInternalFrame(stackLine) {
        var fileNameAndLineNumber = getFileNameAndLineNumber(stackLine);
    
        if (!fileNameAndLineNumber) {
            return false;
        }
    
        var fileName = fileNameAndLineNumber[0];
        var lineNumber = fileNameAndLineNumber[1];
    
        return fileName === qFileName &&
            lineNumber >= qStartingLine &&
            lineNumber <= qEndingLine;
    }
    
    // discover own file name and line number range for filtering stack
    // traces
    function captureLine() {
        if (!hasStacks) {
            return;
        }
    
        try {
            throw new Error();
        } catch (e) {
            var lines = e.stack.split("\n");
            var firstLine = lines[0].indexOf("@") > 0 ? lines[1] : lines[2];
            var fileNameAndLineNumber = getFileNameAndLineNumber(firstLine);
            if (!fileNameAndLineNumber) {
                return;
            }
    
            qFileName = fileNameAndLineNumber[0];
            return fileNameAndLineNumber[1];
        }
    }
    
    function deprecate(callback, name, alternative) {
        return function () {
            if (typeof console !== "undefined" &&
                typeof console.warn === "function") {
                console.warn(name + " is deprecated, use " + alternative +
                             " instead.", new Error("").stack);
            }
            return callback.apply(callback, arguments);
        };
    }
    
    // end of shims
    // beginning of real work
    
    /**
     * Constructs a promise for an immediate reference, passes promises through, or
     * coerces promises from different systems.
     * @param value immediate reference or promise
     */
    function Q(value) {
        // If the object is already a Promise, return it directly.  This enables
        // the resolve function to both be used to created references from objects,
        // but to tolerably coerce non-promises to promises.
        if (value instanceof Promise) {
            return value;
        }
    
        // assimilate thenables
        if (isPromiseAlike(value)) {
            return coerce(value);
        } else {
            return fulfill(value);
        }
    }
    Q.resolve = Q;
    
    /**
     * Performs a task in a future turn of the event loop.
     * @param {Function} task
     */
    Q.nextTick = nextTick;
    
    /**
     * Controls whether or not long stack traces will be on
     */
    Q.longStackSupport = false;
    
    // enable long stacks if Q_DEBUG is set
    if (typeof process === "object" && process && process.env && process.env.Q_DEBUG) {
        Q.longStackSupport = true;
    }
    
    /**
     * Constructs a {promise, resolve, reject} object.
     *
     * `resolve` is a callback to invoke with a more resolved value for the
     * promise. To fulfill the promise, invoke `resolve` with any value that is
     * not a thenable. To reject the promise, invoke `resolve` with a rejected
     * thenable, or invoke `reject` with the reason directly. To resolve the
     * promise to another thenable, thus putting it in the same state, invoke
     * `resolve` with that other thenable.
     */
    Q.defer = defer;
    function defer() {
        // if "messages" is an "Array", that indicates that the promise has not yet
        // been resolved.  If it is "undefined", it has been resolved.  Each
        // element of the messages array is itself an array of complete arguments to
        // forward to the resolved promise.  We coerce the resolution value to a
        // promise using the `resolve` function because it handles both fully
        // non-thenable values and other thenables gracefully.
        var messages = [], progressListeners = [], resolvedPromise;
    
        var deferred = object_create(defer.prototype);
        var promise = object_create(Promise.prototype);
    
        promise.promiseDispatch = function (resolve, op, operands) {
            var args = array_slice(arguments);
            if (messages) {
                messages.push(args);
                if (op === "when" && operands[1]) { // progress operand
                    progressListeners.push(operands[1]);
                }
            } else {
                Q.nextTick(function () {
                    resolvedPromise.promiseDispatch.apply(resolvedPromise, args);
                });
            }
        };
    
        // XXX deprecated
        promise.valueOf = function () {
            if (messages) {
                return promise;
            }
            var nearerValue = nearer(resolvedPromise);
            if (isPromise(nearerValue)) {
                resolvedPromise = nearerValue; // shorten chain
            }
            return nearerValue;
        };
    
        promise.inspect = function () {
            if (!resolvedPromise) {
                return { state: "pending" };
            }
            return resolvedPromise.inspect();
        };
    
        if (Q.longStackSupport && hasStacks) {
            try {
                throw new Error();
            } catch (e) {
                // NOTE: don't try to use `Error.captureStackTrace` or transfer the
                // accessor around; that causes memory leaks as per GH-111. Just
                // reify the stack trace as a string ASAP.
                //
                // At the same time, cut off the first line; it's always just
                // "[object Promise]\n", as per the `toString`.
                promise.stack = e.stack.substring(e.stack.indexOf("\n") + 1);
            }
        }
    
        // NOTE: we do the checks for `resolvedPromise` in each method, instead of
        // consolidating them into `become`, since otherwise we'd create new
        // promises with the lines `become(whatever(value))`. See e.g. GH-252.
    
        function become(newPromise) {
            resolvedPromise = newPromise;
            promise.source = newPromise;
    
            array_reduce(messages, function (undefined, message) {
                Q.nextTick(function () {
                    newPromise.promiseDispatch.apply(newPromise, message);
                });
            }, void 0);
    
            messages = void 0;
            progressListeners = void 0;
        }
    
        deferred.promise = promise;
        deferred.resolve = function (value) {
            if (resolvedPromise) {
                return;
            }
    
            become(Q(value));
        };
    
        deferred.fulfill = function (value) {
            if (resolvedPromise) {
                return;
            }
    
            become(fulfill(value));
        };
        deferred.reject = function (reason) {
            if (resolvedPromise) {
                return;
            }
    
            become(reject(reason));
        };
        deferred.notify = function (progress) {
            if (resolvedPromise) {
                return;
            }
    
            array_reduce(progressListeners, function (undefined, progressListener) {
                Q.nextTick(function () {
                    progressListener(progress);
                });
            }, void 0);
        };
    
        return deferred;
    }
    
    /**
     * Creates a Node-style callback that will resolve or reject the deferred
     * promise.
     * @returns a nodeback
     */
    defer.prototype.makeNodeResolver = function () {
        var self = this;
        return function (error, value) {
            if (error) {
                self.reject(error);
            } else if (arguments.length > 2) {
                self.resolve(array_slice(arguments, 1));
            } else {
                self.resolve(value);
            }
        };
    };
    
    /**
     * @param resolver {Function} a function that returns nothing and accepts
     * the resolve, reject, and notify functions for a deferred.
     * @returns a promise that may be resolved with the given resolve and reject
     * functions, or rejected by a thrown exception in resolver
     */
    Q.Promise = promise; // ES6
    Q.promise = promise;
    function promise(resolver) {
        if (typeof resolver !== "function") {
            throw new TypeError("resolver must be a function.");
        }
        var deferred = defer();
        try {
            resolver(deferred.resolve, deferred.reject, deferred.notify);
        } catch (reason) {
            deferred.reject(reason);
        }
        return deferred.promise;
    }
    
    promise.race = race; // ES6
    promise.all = all; // ES6
    promise.reject = reject; // ES6
    promise.resolve = Q; // ES6
    
    // XXX experimental.  This method is a way to denote that a local value is
    // serializable and should be immediately dispatched to a remote upon request,
    // instead of passing a reference.
    Q.passByCopy = function (object) {
        //freeze(object);
        //passByCopies.set(object, true);
        return object;
    };
    
    Promise.prototype.passByCopy = function () {
        //freeze(object);
        //passByCopies.set(object, true);
        return this;
    };
    
    /**
     * If two promises eventually fulfill to the same value, promises that value,
     * but otherwise rejects.
     * @param x {Any*}
     * @param y {Any*}
     * @returns {Any*} a promise for x and y if they are the same, but a rejection
     * otherwise.
     *
     */
    Q.join = function (x, y) {
        return Q(x).join(y);
    };
    
    Promise.prototype.join = function (that) {
        return Q([this, that]).spread(function (x, y) {
            if (x === y) {
                // TODO: "===" should be Object.is or equiv
                return x;
            } else {
                throw new Error("Can't join: not the same: " + x + " " + y);
            }
        });
    };
    
    /**
     * Returns a promise for the first of an array of promises to become settled.
     * @param answers {Array[Any*]} promises to race
     * @returns {Any*} the first promise to be settled
     */
    Q.race = race;
    function race(answerPs) {
        return promise(function(resolve, reject) {
            // Switch to this once we can assume at least ES5
            // answerPs.forEach(function(answerP) {
            //     Q(answerP).then(resolve, reject);
            // });
            // Use this in the meantime
            for (var i = 0, len = answerPs.length; i < len; i++) {
                Q(answerPs[i]).then(resolve, reject);
            }
        });
    }
    
    Promise.prototype.race = function () {
        return this.then(Q.race);
    };
    
    /**
     * Constructs a Promise with a promise descriptor object and optional fallback
     * function.  The descriptor contains methods like when(rejected), get(name),
     * set(name, value), post(name, args), and delete(name), which all
     * return either a value, a promise for a value, or a rejection.  The fallback
     * accepts the operation name, a resolver, and any further arguments that would
     * have been forwarded to the appropriate method above had a method been
     * provided with the proper name.  The API makes no guarantees about the nature
     * of the returned object, apart from that it is usable whereever promises are
     * bought and sold.
     */
    Q.makePromise = Promise;
    function Promise(descriptor, fallback, inspect) {
        if (fallback === void 0) {
            fallback = function (op) {
                return reject(new Error(
                    "Promise does not support operation: " + op
                ));
            };
        }
        if (inspect === void 0) {
            inspect = function () {
                return {state: "unknown"};
            };
        }
    
        var promise = object_create(Promise.prototype);
    
        promise.promiseDispatch = function (resolve, op, args) {
            var result;
            try {
                if (descriptor[op]) {
                    result = descriptor[op].apply(promise, args);
                } else {
                    result = fallback.call(promise, op, args);
                }
            } catch (exception) {
                result = reject(exception);
            }
            if (resolve) {
                resolve(result);
            }
        };
    
        promise.inspect = inspect;
    
        // XXX deprecated `valueOf` and `exception` support
        if (inspect) {
            var inspected = inspect();
            if (inspected.state === "rejected") {
                promise.exception = inspected.reason;
            }
    
            promise.valueOf = function () {
                var inspected = inspect();
                if (inspected.state === "pending" ||
                    inspected.state === "rejected") {
                    return promise;
                }
                return inspected.value;
            };
        }
    
        return promise;
    }
    
    Promise.prototype.toString = function () {
        return "[object Promise]";
    };
    
    Promise.prototype.then = function (fulfilled, rejected, progressed) {
        var self = this;
        var deferred = defer();
        var done = false;   // ensure the untrusted promise makes at most a
                            // single call to one of the callbacks
    
        function _fulfilled(value) {
            try {
                return typeof fulfilled === "function" ? fulfilled(value) : value;
            } catch (exception) {
                return reject(exception);
            }
        }
    
        function _rejected(exception) {
            if (typeof rejected === "function") {
                makeStackTraceLong(exception, self);
                try {
                    return rejected(exception);
                } catch (newException) {
                    return reject(newException);
                }
            }
            return reject(exception);
        }
    
        function _progressed(value) {
            return typeof progressed === "function" ? progressed(value) : value;
        }
    
        Q.nextTick(function () {
            self.promiseDispatch(function (value) {
                if (done) {
                    return;
                }
                done = true;
    
                deferred.resolve(_fulfilled(value));
            }, "when", [function (exception) {
                if (done) {
                    return;
                }
                done = true;
    
                deferred.resolve(_rejected(exception));
            }]);
        });
    
        // Progress propagator need to be attached in the current tick.
        self.promiseDispatch(void 0, "when", [void 0, function (value) {
            var newValue;
            var threw = false;
            try {
                newValue = _progressed(value);
            } catch (e) {
                threw = true;
                if (Q.onerror) {
                    Q.onerror(e);
                } else {
                    throw e;
                }
            }
    
            if (!threw) {
                deferred.notify(newValue);
            }
        }]);
    
        return deferred.promise;
    };
    
    Q.tap = function (promise, callback) {
        return Q(promise).tap(callback);
    };
    
    /**
     * Works almost like "finally", but not called for rejections.
     * Original resolution value is passed through callback unaffected.
     * Callback may return a promise that will be awaited for.
     * @param {Function} callback
     * @returns {Q.Promise}
     * @example
     * doSomething()
     *   .then(...)
     *   .tap(console.log)
     *   .then(...);
     */
    Promise.prototype.tap = function (callback) {
        callback = Q(callback);
    
        return this.then(function (value) {
            return callback.fcall(value).thenResolve(value);
        });
    };
    
    /**
     * Registers an observer on a promise.
     *
     * Guarantees:
     *
     * 1. that fulfilled and rejected will be called only once.
     * 2. that either the fulfilled callback or the rejected callback will be
     *    called, but not both.
     * 3. that fulfilled and rejected will not be called in this turn.
     *
     * @param value      promise or immediate reference to observe
     * @param fulfilled  function to be called with the fulfilled value
     * @param rejected   function to be called with the rejection exception
     * @param progressed function to be called on any progress notifications
     * @return promise for the return value from the invoked callback
     */
    Q.when = when;
    function when(value, fulfilled, rejected, progressed) {
        return Q(value).then(fulfilled, rejected, progressed);
    }
    
    Promise.prototype.thenResolve = function (value) {
        return this.then(function () { return value; });
    };
    
    Q.thenResolve = function (promise, value) {
        return Q(promise).thenResolve(value);
    };
    
    Promise.prototype.thenReject = function (reason) {
        return this.then(function () { throw reason; });
    };
    
    Q.thenReject = function (promise, reason) {
        return Q(promise).thenReject(reason);
    };
    
    /**
     * If an object is not a promise, it is as "near" as possible.
     * If a promise is rejected, it is as "near" as possible too.
     * If it’s a fulfilled promise, the fulfillment value is nearer.
     * If it’s a deferred promise and the deferred has been resolved, the
     * resolution is "nearer".
     * @param object
     * @returns most resolved (nearest) form of the object
     */
    
    // XXX should we re-do this?
    Q.nearer = nearer;
    function nearer(value) {
        if (isPromise(value)) {
            var inspected = value.inspect();
            if (inspected.state === "fulfilled") {
                return inspected.value;
            }
        }
        return value;
    }
    
    /**
     * @returns whether the given object is a promise.
     * Otherwise it is a fulfilled value.
     */
    Q.isPromise = isPromise;
    function isPromise(object) {
        return object instanceof Promise;
    }
    
    Q.isPromiseAlike = isPromiseAlike;
    function isPromiseAlike(object) {
        return isObject(object) && typeof object.then === "function";
    }
    
    /**
     * @returns whether the given object is a pending promise, meaning not
     * fulfilled or rejected.
     */
    Q.isPending = isPending;
    function isPending(object) {
        return isPromise(object) && object.inspect().state === "pending";
    }
    
    Promise.prototype.isPending = function () {
        return this.inspect().state === "pending";
    };
    
    /**
     * @returns whether the given object is a value or fulfilled
     * promise.
     */
    Q.isFulfilled = isFulfilled;
    function isFulfilled(object) {
        return !isPromise(object) || object.inspect().state === "fulfilled";
    }
    
    Promise.prototype.isFulfilled = function () {
        return this.inspect().state === "fulfilled";
    };
    
    /**
     * @returns whether the given object is a rejected promise.
     */
    Q.isRejected = isRejected;
    function isRejected(object) {
        return isPromise(object) && object.inspect().state === "rejected";
    }
    
    Promise.prototype.isRejected = function () {
        return this.inspect().state === "rejected";
    };
    
    //// BEGIN UNHANDLED REJECTION TRACKING
    
    // This promise library consumes exceptions thrown in handlers so they can be
    // handled by a subsequent promise.  The exceptions get added to this array when
    // they are created, and removed when they are handled.  Note that in ES6 or
    // shimmed environments, this would naturally be a `Set`.
    var unhandledReasons = [];
    var unhandledRejections = [];
    var trackUnhandledRejections = true;
    
    function resetUnhandledRejections() {
        unhandledReasons.length = 0;
        unhandledRejections.length = 0;
    
        if (!trackUnhandledRejections) {
            trackUnhandledRejections = true;
        }
    }
    
    function trackRejection(promise, reason) {
        if (!trackUnhandledRejections) {
            return;
        }
    
        unhandledRejections.push(promise);
        if (reason && typeof reason.stack !== "undefined") {
            unhandledReasons.push(reason.stack);
        } else {
            unhandledReasons.push("(no stack) " + reason);
        }
    }
    
    function untrackRejection(promise) {
        if (!trackUnhandledRejections) {
            return;
        }
    
        var at = array_indexOf(unhandledRejections, promise);
        if (at !== -1) {
            unhandledRejections.splice(at, 1);
            unhandledReasons.splice(at, 1);
        }
    }
    
    Q.resetUnhandledRejections = resetUnhandledRejections;
    
    Q.getUnhandledReasons = function () {
        // Make a copy so that consumers can't interfere with our internal state.
        return unhandledReasons.slice();
    };
    
    Q.stopUnhandledRejectionTracking = function () {
        resetUnhandledRejections();
        trackUnhandledRejections = false;
    };
    
    resetUnhandledRejections();
    
    //// END UNHANDLED REJECTION TRACKING
    
    /**
     * Constructs a rejected promise.
     * @param reason value describing the failure
     */
    Q.reject = reject;
    function reject(reason) {
        var rejection = Promise({
            "when": function (rejected) {
                // note that the error has been handled
                if (rejected) {
                    untrackRejection(this);
                }
                return rejected ? rejected(reason) : this;
            }
        }, function fallback() {
            return this;
        }, function inspect() {
            return { state: "rejected", reason: reason };
        });
    
        // Note that the reason has not been handled.
        trackRejection(rejection, reason);
    
        return rejection;
    }
    
    /**
     * Constructs a fulfilled promise for an immediate reference.
     * @param value immediate reference
     */
    Q.fulfill = fulfill;
    function fulfill(value) {
        return Promise({
            "when": function () {
                return value;
            },
            "get": function (name) {
                return value[name];
            },
            "set": function (name, rhs) {
                value[name] = rhs;
            },
            "delete": function (name) {
                delete value[name];
            },
            "post": function (name, args) {
                // Mark Miller proposes that post with no name should apply a
                // promised function.
                if (name === null || name === void 0) {
                    return value.apply(void 0, args);
                } else {
                    return value[name].apply(value, args);
                }
            },
            "apply": function (thisp, args) {
                return value.apply(thisp, args);
            },
            "keys": function () {
                return object_keys(value);
            }
        }, void 0, function inspect() {
            return { state: "fulfilled", value: value };
        });
    }
    
    /**
     * Converts thenables to Q promises.
     * @param promise thenable promise
     * @returns a Q promise
     */
    function coerce(promise) {
        var deferred = defer();
        Q.nextTick(function () {
            try {
                promise.then(deferred.resolve, deferred.reject, deferred.notify);
            } catch (exception) {
                deferred.reject(exception);
            }
        });
        return deferred.promise;
    }
    
    /**
     * Annotates an object such that it will never be
     * transferred away from this process over any promise
     * communication channel.
     * @param object
     * @returns promise a wrapping of that object that
     * additionally responds to the "isDef" message
     * without a rejection.
     */
    Q.master = master;
    function master(object) {
        return Promise({
            "isDef": function () {}
        }, function fallback(op, args) {
            return dispatch(object, op, args);
        }, function () {
            return Q(object).inspect();
        });
    }
    
    /**
     * Spreads the values of a promised array of arguments into the
     * fulfillment callback.
     * @param fulfilled callback that receives variadic arguments from the
     * promised array
     * @param rejected callback that receives the exception if the promise
     * is rejected.
     * @returns a promise for the return value or thrown exception of
     * either callback.
     */
    Q.spread = spread;
    function spread(value, fulfilled, rejected) {
        return Q(value).spread(fulfilled, rejected);
    }
    
    Promise.prototype.spread = function (fulfilled, rejected) {
        return this.all().then(function (array) {
            return fulfilled.apply(void 0, array);
        }, rejected);
    };
    
    /**
     * The async function is a decorator for generator functions, turning
     * them into asynchronous generators.  Although generators are only part
     * of the newest ECMAScript 6 drafts, this code does not cause syntax
     * errors in older engines.  This code should continue to work and will
     * in fact improve over time as the language improves.
     *
     * ES6 generators are currently part of V8 version 3.19 with the
     * --harmony-generators runtime flag enabled.  SpiderMonkey has had them
     * for longer, but under an older Python-inspired form.  This function
     * works on both kinds of generators.
     *
     * Decorates a generator function such that:
     *  - it may yield promises
     *  - execution will continue when that promise is fulfilled
     *  - the value of the yield expression will be the fulfilled value
     *  - it returns a promise for the return value (when the generator
     *    stops iterating)
     *  - the decorated function returns a promise for the return value
     *    of the generator or the first rejected promise among those
     *    yielded.
     *  - if an error is thrown in the generator, it propagates through
     *    every following yield until it is caught, or until it escapes
     *    the generator function altogether, and is translated into a
     *    rejection for the promise returned by the decorated generator.
     */
    Q.async = async;
    function async(makeGenerator) {
        return function () {
            // when verb is "send", arg is a value
            // when verb is "throw", arg is an exception
            function continuer(verb, arg) {
                var result;
    
                // Until V8 3.19 / Chromium 29 is released, SpiderMonkey is the only
                // engine that has a deployed base of browsers that support generators.
                // However, SM's generators use the Python-inspired semantics of
                // outdated ES6 drafts.  We would like to support ES6, but we'd also
                // like to make it possible to use generators in deployed browsers, so
                // we also support Python-style generators.  At some point we can remove
                // this block.
    
                if (typeof StopIteration === "undefined") {
                    // ES6 Generators
                    try {
                        result = generator[verb](arg);
                    } catch (exception) {
                        return reject(exception);
                    }
                    if (result.done) {
                        return Q(result.value);
                    } else {
                        return when(result.value, callback, errback);
                    }
                } else {
                    // SpiderMonkey Generators
                    // FIXME: Remove this case when SM does ES6 generators.
                    try {
                        result = generator[verb](arg);
                    } catch (exception) {
                        if (isStopIteration(exception)) {
                            return Q(exception.value);
                        } else {
                            return reject(exception);
                        }
                    }
                    return when(result, callback, errback);
                }
            }
            var generator = makeGenerator.apply(this, arguments);
            var callback = continuer.bind(continuer, "next");
            var errback = continuer.bind(continuer, "throw");
            return callback();
        };
    }
    
    /**
     * The spawn function is a small wrapper around async that immediately
     * calls the generator and also ends the promise chain, so that any
     * unhandled errors are thrown instead of forwarded to the error
     * handler. This is useful because it's extremely common to run
     * generators at the top-level to work with libraries.
     */
    Q.spawn = spawn;
    function spawn(makeGenerator) {
        Q.done(Q.async(makeGenerator)());
    }
    
    // FIXME: Remove this interface once ES6 generators are in SpiderMonkey.
    /**
     * Throws a ReturnValue exception to stop an asynchronous generator.
     *
     * This interface is a stop-gap measure to support generator return
     * values in older Firefox/SpiderMonkey.  In browsers that support ES6
     * generators like Chromium 29, just use "return" in your generator
     * functions.
     *
     * @param value the return value for the surrounding generator
     * @throws ReturnValue exception with the value.
     * @example
     * // ES6 style
     * Q.async(function* () {
     *      var foo = yield getFooPromise();
     *      var bar = yield getBarPromise();
     *      return foo + bar;
     * })
     * // Older SpiderMonkey style
     * Q.async(function () {
     *      var foo = yield getFooPromise();
     *      var bar = yield getBarPromise();
     *      Q.return(foo + bar);
     * })
     */
    Q["return"] = _return;
    function _return(value) {
        throw new QReturnValue(value);
    }
    
    /**
     * The promised function decorator ensures that any promise arguments
     * are settled and passed as values (`this` is also settled and passed
     * as a value).  It will also ensure that the result of a function is
     * always a promise.
     *
     * @example
     * var add = Q.promised(function (a, b) {
     *     return a + b;
     * });
     * add(Q(a), Q(B));
     *
     * @param {function} callback The function to decorate
     * @returns {function} a function that has been decorated.
     */
    Q.promised = promised;
    function promised(callback) {
        return function () {
            return spread([this, all(arguments)], function (self, args) {
                return callback.apply(self, args);
            });
        };
    }
    
    /**
     * sends a message to a value in a future turn
     * @param object* the recipient
     * @param op the name of the message operation, e.g., "when",
     * @param args further arguments to be forwarded to the operation
     * @returns result {Promise} a promise for the result of the operation
     */
    Q.dispatch = dispatch;
    function dispatch(object, op, args) {
        return Q(object).dispatch(op, args);
    }
    
    Promise.prototype.dispatch = function (op, args) {
        var self = this;
        var deferred = defer();
        Q.nextTick(function () {
            self.promiseDispatch(deferred.resolve, op, args);
        });
        return deferred.promise;
    };
    
    /**
     * Gets the value of a property in a future turn.
     * @param object    promise or immediate reference for target object
     * @param name      name of property to get
     * @return promise for the property value
     */
    Q.get = function (object, key) {
        return Q(object).dispatch("get", [key]);
    };
    
    Promise.prototype.get = function (key) {
        return this.dispatch("get", [key]);
    };
    
    /**
     * Sets the value of a property in a future turn.
     * @param object    promise or immediate reference for object object
     * @param name      name of property to set
     * @param value     new value of property
     * @return promise for the return value
     */
    Q.set = function (object, key, value) {
        return Q(object).dispatch("set", [key, value]);
    };
    
    Promise.prototype.set = function (key, value) {
        return this.dispatch("set", [key, value]);
    };
    
    /**
     * Deletes a property in a future turn.
     * @param object    promise or immediate reference for target object
     * @param name      name of property to delete
     * @return promise for the return value
     */
    Q.del = // XXX legacy
    Q["delete"] = function (object, key) {
        return Q(object).dispatch("delete", [key]);
    };
    
    Promise.prototype.del = // XXX legacy
    Promise.prototype["delete"] = function (key) {
        return this.dispatch("delete", [key]);
    };
    
    /**
     * Invokes a method in a future turn.
     * @param object    promise or immediate reference for target object
     * @param name      name of method to invoke
     * @param value     a value to post, typically an array of
     *                  invocation arguments for promises that
     *                  are ultimately backed with `resolve` values,
     *                  as opposed to those backed with URLs
     *                  wherein the posted value can be any
     *                  JSON serializable object.
     * @return promise for the return value
     */
    // bound locally because it is used by other methods
    Q.mapply = // XXX As proposed by "Redsandro"
    Q.post = function (object, name, args) {
        return Q(object).dispatch("post", [name, args]);
    };
    
    Promise.prototype.mapply = // XXX As proposed by "Redsandro"
    Promise.prototype.post = function (name, args) {
        return this.dispatch("post", [name, args]);
    };
    
    /**
     * Invokes a method in a future turn.
     * @param object    promise or immediate reference for target object
     * @param name      name of method to invoke
     * @param ...args   array of invocation arguments
     * @return promise for the return value
     */
    Q.send = // XXX Mark Miller's proposed parlance
    Q.mcall = // XXX As proposed by "Redsandro"
    Q.invoke = function (object, name /*...args*/) {
        return Q(object).dispatch("post", [name, array_slice(arguments, 2)]);
    };
    
    Promise.prototype.send = // XXX Mark Miller's proposed parlance
    Promise.prototype.mcall = // XXX As proposed by "Redsandro"
    Promise.prototype.invoke = function (name /*...args*/) {
        return this.dispatch("post", [name, array_slice(arguments, 1)]);
    };
    
    /**
     * Applies the promised function in a future turn.
     * @param object    promise or immediate reference for target function
     * @param args      array of application arguments
     */
    Q.fapply = function (object, args) {
        return Q(object).dispatch("apply", [void 0, args]);
    };
    
    Promise.prototype.fapply = function (args) {
        return this.dispatch("apply", [void 0, args]);
    };
    
    /**
     * Calls the promised function in a future turn.
     * @param object    promise or immediate reference for target function
     * @param ...args   array of application arguments
     */
    Q["try"] =
    Q.fcall = function (object /* ...args*/) {
        return Q(object).dispatch("apply", [void 0, array_slice(arguments, 1)]);
    };
    
    Promise.prototype.fcall = function (/*...args*/) {
        return this.dispatch("apply", [void 0, array_slice(arguments)]);
    };
    
    /**
     * Binds the promised function, transforming return values into a fulfilled
     * promise and thrown errors into a rejected one.
     * @param object    promise or immediate reference for target function
     * @param ...args   array of application arguments
     */
    Q.fbind = function (object /*...args*/) {
        var promise = Q(object);
        var args = array_slice(arguments, 1);
        return function fbound() {
            return promise.dispatch("apply", [
                this,
                args.concat(array_slice(arguments))
            ]);
        };
    };
    Promise.prototype.fbind = function (/*...args*/) {
        var promise = this;
        var args = array_slice(arguments);
        return function fbound() {
            return promise.dispatch("apply", [
                this,
                args.concat(array_slice(arguments))
            ]);
        };
    };
    
    /**
     * Requests the names of the owned properties of a promised
     * object in a future turn.
     * @param object    promise or immediate reference for target object
     * @return promise for the keys of the eventually settled object
     */
    Q.keys = function (object) {
        return Q(object).dispatch("keys", []);
    };
    
    Promise.prototype.keys = function () {
        return this.dispatch("keys", []);
    };
    
    /**
     * Turns an array of promises into a promise for an array.  If any of
     * the promises gets rejected, the whole array is rejected immediately.
     * @param {Array*} an array (or promise for an array) of values (or
     * promises for values)
     * @returns a promise for an array of the corresponding values
     */
    // By Mark Miller
    // http://wiki.ecmascript.org/doku.php?id=strawman:concurrency&rev=1308776521#allfulfilled
    Q.all = all;
    function all(promises) {
        return when(promises, function (promises) {
            var pendingCount = 0;
            var deferred = defer();
            array_reduce(promises, function (undefined, promise, index) {
                var snapshot;
                if (
                    isPromise(promise) &&
                    (snapshot = promise.inspect()).state === "fulfilled"
                ) {
                    promises[index] = snapshot.value;
                } else {
                    ++pendingCount;
                    when(
                        promise,
                        function (value) {
                            promises[index] = value;
                            if (--pendingCount === 0) {
                                deferred.resolve(promises);
                            }
                        },
                        deferred.reject,
                        function (progress) {
                            deferred.notify({ index: index, value: progress });
                        }
                    );
                }
            }, void 0);
            if (pendingCount === 0) {
                deferred.resolve(promises);
            }
            return deferred.promise;
        });
    }
    
    Promise.prototype.all = function () {
        return all(this);
    };
    
    /**
     * Returns the first resolved promise of an array. Prior rejected promises are
     * ignored.  Rejects only if all promises are rejected.
     * @param {Array*} an array containing values or promises for values
     * @returns a promise fulfilled with the value of the first resolved promise,
     * or a rejected promise if all promises are rejected.
     */
    Q.any = any;
    
    function any(promises) {
        if (promises.length === 0) {
            return Q.resolve();
        }
    
        var deferred = Q.defer();
        var pendingCount = 0;
        array_reduce(promises, function(prev, current, index) {
            var promise = promises[index];
    
            pendingCount++;
    
            when(promise, onFulfilled, onRejected, onProgress);
            function onFulfilled(result) {
                deferred.resolve(result);
            }
            function onRejected() {
                pendingCount--;
                if (pendingCount === 0) {
                    deferred.reject(new Error(
                        "Can't get fulfillment value from any promise, all " +
                        "promises were rejected."
                    ));
                }
            }
            function onProgress(progress) {
                deferred.notify({
                    index: index,
                    value: progress
                });
            }
        }, undefined);
    
        return deferred.promise;
    }
    
    Promise.prototype.any = function() {
        return any(this);
    };
    
    /**
     * Waits for all promises to be settled, either fulfilled or
     * rejected.  This is distinct from `all` since that would stop
     * waiting at the first rejection.  The promise returned by
     * `allResolved` will never be rejected.
     * @param promises a promise for an array (or an array) of promises
     * (or values)
     * @return a promise for an array of promises
     */
    Q.allResolved = deprecate(allResolved, "allResolved", "allSettled");
    function allResolved(promises) {
        return when(promises, function (promises) {
            promises = array_map(promises, Q);
            return when(all(array_map(promises, function (promise) {
                return when(promise, noop, noop);
            })), function () {
                return promises;
            });
        });
    }
    
    Promise.prototype.allResolved = function () {
        return allResolved(this);
    };
    
    /**
     * @see Promise#allSettled
     */
    Q.allSettled = allSettled;
    function allSettled(promises) {
        return Q(promises).allSettled();
    }
    
    /**
     * Turns an array of promises into a promise for an array of their states (as
     * returned by `inspect`) when they have all settled.
     * @param {Array[Any*]} values an array (or promise for an array) of values (or
     * promises for values)
     * @returns {Array[State]} an array of states for the respective values.
     */
    Promise.prototype.allSettled = function () {
        return this.then(function (promises) {
            return all(array_map(promises, function (promise) {
                promise = Q(promise);
                function regardless() {
                    return promise.inspect();
                }
                return promise.then(regardless, regardless);
            }));
        });
    };
    
    /**
     * Captures the failure of a promise, giving an oportunity to recover
     * with a callback.  If the given promise is fulfilled, the returned
     * promise is fulfilled.
     * @param {Any*} promise for something
     * @param {Function} callback to fulfill the returned promise if the
     * given promise is rejected
     * @returns a promise for the return value of the callback
     */
    Q.fail = // XXX legacy
    Q["catch"] = function (object, rejected) {
        return Q(object).then(void 0, rejected);
    };
    
    Promise.prototype.fail = // XXX legacy
    Promise.prototype["catch"] = function (rejected) {
        return this.then(void 0, rejected);
    };
    
    /**
     * Attaches a listener that can respond to progress notifications from a
     * promise's originating deferred. This listener receives the exact arguments
     * passed to ``deferred.notify``.
     * @param {Any*} promise for something
     * @param {Function} callback to receive any progress notifications
     * @returns the given promise, unchanged
     */
    Q.progress = progress;
    function progress(object, progressed) {
        return Q(object).then(void 0, void 0, progressed);
    }
    
    Promise.prototype.progress = function (progressed) {
        return this.then(void 0, void 0, progressed);
    };
    
    /**
     * Provides an opportunity to observe the settling of a promise,
     * regardless of whether the promise is fulfilled or rejected.  Forwards
     * the resolution to the returned promise when the callback is done.
     * The callback can return a promise to defer completion.
     * @param {Any*} promise
     * @param {Function} callback to observe the resolution of the given
     * promise, takes no arguments.
     * @returns a promise for the resolution of the given promise when
     * ``fin`` is done.
     */
    Q.fin = // XXX legacy
    Q["finally"] = function (object, callback) {
        return Q(object)["finally"](callback);
    };
    
    Promise.prototype.fin = // XXX legacy
    Promise.prototype["finally"] = function (callback) {
        callback = Q(callback);
        return this.then(function (value) {
            return callback.fcall().then(function () {
                return value;
            });
        }, function (reason) {
            // TODO attempt to recycle the rejection with "this".
            return callback.fcall().then(function () {
                throw reason;
            });
        });
    };
    
    /**
     * Terminates a chain of promises, forcing rejections to be
     * thrown as exceptions.
     * @param {Any*} promise at the end of a chain of promises
     * @returns nothing
     */
    Q.done = function (object, fulfilled, rejected, progress) {
        return Q(object).done(fulfilled, rejected, progress);
    };
    
    Promise.prototype.done = function (fulfilled, rejected, progress) {
        var onUnhandledError = function (error) {
            // forward to a future turn so that ``when``
            // does not catch it and turn it into a rejection.
            Q.nextTick(function () {
                makeStackTraceLong(error, promise);
                if (Q.onerror) {
                    Q.onerror(error);
                } else {
                    throw error;
                }
            });
        };
    
        // Avoid unnecessary `nextTick`ing via an unnecessary `when`.
        var promise = fulfilled || rejected || progress ?
            this.then(fulfilled, rejected, progress) :
            this;
    
        if (typeof process === "object" && process && process.domain) {
            onUnhandledError = process.domain.bind(onUnhandledError);
        }
    
        promise.then(void 0, onUnhandledError);
    };
    
    /**
     * Causes a promise to be rejected if it does not get fulfilled before
     * some milliseconds time out.
     * @param {Any*} promise
     * @param {Number} milliseconds timeout
     * @param {Any*} custom error message or Error object (optional)
     * @returns a promise for the resolution of the given promise if it is
     * fulfilled before the timeout, otherwise rejected.
     */
    Q.timeout = function (object, ms, error) {
        return Q(object).timeout(ms, error);
    };
    
    Promise.prototype.timeout = function (ms, error) {
        var deferred = defer();
        var timeoutId = setTimeout(function () {
            if (!error || "string" === typeof error) {
                error = new Error(error || "Timed out after " + ms + " ms");
                error.code = "ETIMEDOUT";
            }
            deferred.reject(error);
        }, ms);
    
        this.then(function (value) {
            clearTimeout(timeoutId);
            deferred.resolve(value);
        }, function (exception) {
            clearTimeout(timeoutId);
            deferred.reject(exception);
        }, deferred.notify);
    
        return deferred.promise;
    };
    
    /**
     * Returns a promise for the given value (or promised value), some
     * milliseconds after it resolved. Passes rejections immediately.
     * @param {Any*} promise
     * @param {Number} milliseconds
     * @returns a promise for the resolution of the given promise after milliseconds
     * time has elapsed since the resolution of the given promise.
     * If the given promise rejects, that is passed immediately.
     */
    Q.delay = function (object, timeout) {
        if (timeout === void 0) {
            timeout = object;
            object = void 0;
        }
        return Q(object).delay(timeout);
    };
    
    Promise.prototype.delay = function (timeout) {
        return this.then(function (value) {
            var deferred = defer();
            setTimeout(function () {
                deferred.resolve(value);
            }, timeout);
            return deferred.promise;
        });
    };
    
    /**
     * Passes a continuation to a Node function, which is called with the given
     * arguments provided as an array, and returns a promise.
     *
     *      Q.nfapply(FS.readFile, [__filename])
     *      .then(function (content) {
     *      })
     *
     */
    Q.nfapply = function (callback, args) {
        return Q(callback).nfapply(args);
    };
    
    Promise.prototype.nfapply = function (args) {
        var deferred = defer();
        var nodeArgs = array_slice(args);
        nodeArgs.push(deferred.makeNodeResolver());
        this.fapply(nodeArgs).fail(deferred.reject);
        return deferred.promise;
    };
    
    /**
     * Passes a continuation to a Node function, which is called with the given
     * arguments provided individually, and returns a promise.
     * @example
     * Q.nfcall(FS.readFile, __filename)
     * .then(function (content) {
     * })
     *
     */
    Q.nfcall = function (callback /*...args*/) {
        var args = array_slice(arguments, 1);
        return Q(callback).nfapply(args);
    };
    
    Promise.prototype.nfcall = function (/*...args*/) {
        var nodeArgs = array_slice(arguments);
        var deferred = defer();
        nodeArgs.push(deferred.makeNodeResolver());
        this.fapply(nodeArgs).fail(deferred.reject);
        return deferred.promise;
    };
    
    /**
     * Wraps a NodeJS continuation passing function and returns an equivalent
     * version that returns a promise.
     * @example
     * Q.nfbind(FS.readFile, __filename)("utf-8")
     * .then(console.log)
     * .done()
     */
    Q.nfbind =
    Q.denodeify = function (callback /*...args*/) {
        var baseArgs = array_slice(arguments, 1);
        return function () {
            var nodeArgs = baseArgs.concat(array_slice(arguments));
            var deferred = defer();
            nodeArgs.push(deferred.makeNodeResolver());
            Q(callback).fapply(nodeArgs).fail(deferred.reject);
            return deferred.promise;
        };
    };
    
    Promise.prototype.nfbind =
    Promise.prototype.denodeify = function (/*...args*/) {
        var args = array_slice(arguments);
        args.unshift(this);
        return Q.denodeify.apply(void 0, args);
    };
    
    Q.nbind = function (callback, thisp /*...args*/) {
        var baseArgs = array_slice(arguments, 2);
        return function () {
            var nodeArgs = baseArgs.concat(array_slice(arguments));
            var deferred = defer();
            nodeArgs.push(deferred.makeNodeResolver());
            function bound() {
                return callback.apply(thisp, arguments);
            }
            Q(bound).fapply(nodeArgs).fail(deferred.reject);
            return deferred.promise;
        };
    };
    
    Promise.prototype.nbind = function (/*thisp, ...args*/) {
        var args = array_slice(arguments, 0);
        args.unshift(this);
        return Q.nbind.apply(void 0, args);
    };
    
    /**
     * Calls a method of a Node-style object that accepts a Node-style
     * callback with a given array of arguments, plus a provided callback.
     * @param object an object that has the named method
     * @param {String} name name of the method of object
     * @param {Array} args arguments to pass to the method; the callback
     * will be provided by Q and appended to these arguments.
     * @returns a promise for the value or error
     */
    Q.nmapply = // XXX As proposed by "Redsandro"
    Q.npost = function (object, name, args) {
        return Q(object).npost(name, args);
    };
    
    Promise.prototype.nmapply = // XXX As proposed by "Redsandro"
    Promise.prototype.npost = function (name, args) {
        var nodeArgs = array_slice(args || []);
        var deferred = defer();
        nodeArgs.push(deferred.makeNodeResolver());
        this.dispatch("post", [name, nodeArgs]).fail(deferred.reject);
        return deferred.promise;
    };
    
    /**
     * Calls a method of a Node-style object that accepts a Node-style
     * callback, forwarding the given variadic arguments, plus a provided
     * callback argument.
     * @param object an object that has the named method
     * @param {String} name name of the method of object
     * @param ...args arguments to pass to the method; the callback will
     * be provided by Q and appended to these arguments.
     * @returns a promise for the value or error
     */
    Q.nsend = // XXX Based on Mark Miller's proposed "send"
    Q.nmcall = // XXX Based on "Redsandro's" proposal
    Q.ninvoke = function (object, name /*...args*/) {
        var nodeArgs = array_slice(arguments, 2);
        var deferred = defer();
        nodeArgs.push(deferred.makeNodeResolver());
        Q(object).dispatch("post", [name, nodeArgs]).fail(deferred.reject);
        return deferred.promise;
    };
    
    Promise.prototype.nsend = // XXX Based on Mark Miller's proposed "send"
    Promise.prototype.nmcall = // XXX Based on "Redsandro's" proposal
    Promise.prototype.ninvoke = function (name /*...args*/) {
        var nodeArgs = array_slice(arguments, 1);
        var deferred = defer();
        nodeArgs.push(deferred.makeNodeResolver());
        this.dispatch("post", [name, nodeArgs]).fail(deferred.reject);
        return deferred.promise;
    };
    
    /**
     * If a function would like to support both Node continuation-passing-style and
     * promise-returning-style, it can end its internal promise chain with
     * `nodeify(nodeback)`, forwarding the optional nodeback argument.  If the user
     * elects to use a nodeback, the result will be sent there.  If they do not
     * pass a nodeback, they will receive the result promise.
     * @param object a result (or a promise for a result)
     * @param {Function} nodeback a Node.js-style callback
     * @returns either the promise or nothing
     */
    Q.nodeify = nodeify;
    function nodeify(object, nodeback) {
        return Q(object).nodeify(nodeback);
    }
    
    Promise.prototype.nodeify = function (nodeback) {
        if (nodeback) {
            this.then(function (value) {
                Q.nextTick(function () {
                    nodeback(null, value);
                });
            }, function (error) {
                Q.nextTick(function () {
                    nodeback(error);
                });
            });
        } else {
            return this;
        }
    };
    
    // All code before this point will be filtered from stack traces.
    var qEndingLine = captureLine();
    
    return Q;
    
    });
    
  provide("q", module.exports);
}(global));

// pakmanager:oboe-q
(function (context) {
  
  var module = { exports: {} }, exports = module.exports
    , $ = require("ender")
    ;
  
  'use strict';
    
    var oboe = require('oboe');
    var Q = require('q');
    
    function oq(data) {
    
        if (typeof data !== "object") {
            throw new Error('data is undefined');
        }
    
        var defered = Q.defer();
    
        var xhrObj = {
                url: data.url,
                method: data.method || 'GET',
                cached: data.cached || false,
                withCredentials: data.withCredentials || false
            };
    
        // Headers
        if (data.headers) {
            xhrObj.headers = data.headers;
        }
    
        // Body
        if (data.body) {
            xhrObj.body = data.body;
        }
    
        oboe(xhrObj)
            .done(function (payload) {
    
                if (data.callback) {
                    payload = data.callback(payload);
                }
    
                defered.resolve(payload);
            })
            .fail(function () {
                defered.reject(new Error("Query failed"));
            });
    
        return defered.promise;
    }
    
    module.exports = oq;
    
  provide("oboe-q", module.exports);
}(global));
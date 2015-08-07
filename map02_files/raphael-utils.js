/*
 * Raphael SVG Import 0.1.0 - Extension to Raphael JS
 *
 * Copyright (c) 2009 Wout Fierens
 * Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license.
 *
 * 2013-10-20 modifications by Darío Macchi
 * - matrix issue (getMatrixFromStr)
 *
 * 2013-10-15 modifications by Darío Macchi
 * - line SVG tag support
 *
 * 2013-09-30 modifications by Darío Macchi
 * - Groups IDs
 * - getById for groups
 * - Text and tspan support
 *
 *
 *
 * 2013-03-14 modifications by Darío Macchi
 * - bug fixed in bindEvents (change paper for this)
 * - bug fixed in ScaleRaphael (some duplicated id's)
 *
 * 2012-12-13 modifications by Darío Macchi
 * - added moveScaledTo function
 * - added moveTo function
 * - added bindEvents function
 * - added getLikeId function
 * - added chrome function
 * - added beforeFn and afterFn events to be executed in each shape
 *
 *
 * - a lot of small fixes for each supported shape
 *
 * 2011-12-08 modifications by Jonas Olmstead
 * - added support for radial and linear gradients
 * - added support for paths
 * - removed prototype.js dependencies (I can't read that stuff)
 * - changed input parameter to svg xml file
 * - added support for text elements
 * - added support for nested groups
 * - added support for transforms and scaling applied to groups
 * - svg elements returned as a set
 *
 */
Raphael.fn.importSVG = function (elSVG, options) {
    try {
		if (!options)
			options = {};

        //create a set to return (the complete svg image will be inside this set)
        var fullSvgSet = this.set();
		var groupCounter = 0;
        var strSupportedShapes = '|rect|circle|ellipse|path|image|text|polygon|g|tspan|line|';

        // collect all gradient colors
        var linGrads = elSVG.getElementsByTagName('linearGradient');
        var radGrads = elSVG.getElementsByTagName('radialGradient');

		var elShape;
        //elSVG.normalize();

        this.init = function(){
        	this.sets = [];
        	for (var i = 0; i < elSVG.childNodes.length; i++) {
	            elShape = elSVG.childNodes.item(i);
				this.parseElement(elShape, fullSvgSet);
	        }
        }

        this.parseElement = function (elShape, myNewSet, moreAttr) {
            var node = elShape.nodeName.toLowerCase();
			var shape;

            if (node && strSupportedShapes.indexOf('|' + node + '|') >= 0) {
				var attr = $.extend(null, {
						/* attributes to override in each shape*/
					}, options[node], moreAttr);

                //Execute the before shape processing event
                if (options[node] && options[node].beforeFn != null)
                	options[node].beforeFn.apply(elShape,[attr]);

                var m_font = '';
                var matrix = attr['matrix'] || Raphael.matrix();
                var mPrimitives = matrix.split();

                for (var k = 0; k < elShape.attributes.length; k++) {
                    var attrNode = elShape.attributes[k];

                    //if don't have any attribute
					if (attr[attrNode.nodeName] != undefined) 
						continue;

					//if there is an attribute of the SVG to be overriden, override it.
                    switch (attrNode.nodeName) {
                    	case 'transform':
                    		if (attrNode.nodeValue.indexOf('matrix')==0){
	                    		matrix = this.getMatrixFromStr(this.getMatrixStrFromAttr(attrNode.nodeValue));
	                    		mPrimitives = matrix.split();
                    		}
                    		else
                    			attr[attrNode.nodeName] = attrNode.nodeValue;
                    		
                    		break;
						case 'stroke-dasharray':
							attr[attrNode.nodeName] = "- ";
							break;
						case 'style':
							// TODO: handle gradient fills within a style
							var style = attrNode.nodeValue.split(';');
							for (var l = 0; l < style.length; l++)
								if (style[l].split(':')[0] == 'fill')
									this.doFill(node, attr, style[l].split(':')[0], style[l].split(':')[1]);
								else
									attr[style[l].split(':')[0]] = style[l].split(':')[1];
							break;
						case 'fill':
							this.doFill(node, attr, attrNode.nodeName, attrNode.nodeValue);
							break;
						// case 'font-size':
						// 	m_font = attrNode.nodeValue + 'px ' + m_font;
						// 	attr[attrNode.nodeName] = attrNode.nodeValue;
						// 	break;
						// case 'font-family':
						// 	var nodeValue = attrNode.nodeValue.match(/'(.*?)'/);

						// 	if (nodeValue != null && nodeValue.length > 1)
						// 		nodeValue = nodeValue[1];
						// 	else
						// 		nodeValue = attrNode.nodeValue;

						// 	m_font = m_font + nodeValue;
						//	break;
						case 'x':
						case 'cx':
						case 'rx':
							// use numbers for location coords
							attr[attrNode.nodeName] = parseFloat(attrNode.nodeValue) + mPrimitives.dx;
							break;
						case 'y':
						case 'cy':
						case 'ry':
							// use numbers for location coords
							attr[attrNode.nodeName] = parseFloat(attrNode.nodeValue) + mPrimitives.dy;
							break;
						case 'text-anchor':
							// skip these due to bug in text scaling
							break;
						default:
							attr[attrNode.nodeName] = attrNode.nodeValue;
							break;
                    }
                }

                switch (node) {
					case "tspan":
					case "text":
						if (elShape.firstChild.nodeType == 3){ //This is a text tag with simple text or tspan
							shape = this.text(attr["x"] || mPrimitives.dx, attr["y"] || mPrimitives.dy, elShape.text || elShape.textContent || elShape.innerText);
							
							shape.attr('stroke', 'none');
							//shape.origFontPt = parseInt(attr["font-size"]);
						}
						else{
							var textSet = this.set();

							for (var o = 0; o < elShape.childNodes.length; o++)
								this.parseElement(elShape.childNodes.item(o), textSet, {'matrix': matrix});

							// textSet.data('tag', 'text');
							shape = textSet;
						}

						break;
					case 'g':
						// this is a group, parse the children and add to set
						var groupSet = this.set();

						for (var o = 0; o < elShape.childNodes.length; o++){
							this.parseElement(elShape.childNodes.item(o), groupSet, {'setId': attr['id']});
						}

						// groupSet.data('tag', 'g');
						shape = groupSet;

						break;
					case "rect":
						if (attr["rx"])
							shape = this.rect(attr["x"], attr["y"], elShape.getAttribute("width"), elShape.getAttribute("height"), attr["rx"]);
						else
							shape = this.rect();

						break;
					case "circle":
						// changed to ellipse, we are not doing circles today
						shape = this.ellipse();
						attr["rx"] = attr["r"];
						attr["ry"] = attr["r"];

						break;
					case "ellipse":
						shape = this.ellipse();

						break;
					case "path":
						shape = this.path(attr["d"]);//this.convertToAbsolute(this.path(attr["d"]));

						break;
					case "line":
						shape = this.path('M' + attr['x1'] + ' ' + attr['y1'] + 'L' + attr['x2'] + ' ' + attr['y2']);
						
						break;
					case "polygon":
						// convert polygon to a path
						var point_string = attr["points"].trim();
						var aryPoints = point_string.split(" ");
						var strNewPoints = "M";
						for (var i in aryPoints) {
							if (i > 0)
								strNewPoints += "L";
							strNewPoints += aryPoints[i];
						}
						strNewPoints += "Z";
						shape = this.path(strNewPoints);

						break;
					case "image":
						shape = this.image();

						break;
                }

				// set shape id
				this.setShapeId(shape, attr);

				if (attr['setId'])
					shape.data('setId', attr['setId']);

                // apply attributes (if node is a set it will override child values)
				if (node != 'g')
					shape.attr(attr);

				// apply transforms
				if (attr['transform']){
					if(transformAttr.indexOf('matrix')==0)
						shape.transform(Raphael.matrix(matrix.a, matrix.b, matrix.c, matrix.d, 0, 0).toTransformString());
					else
						eval('shape.' + transformAttr);
                }

				//this was under afterFn (2012-03-14)
				for(var evNames in attr.events){
					this.bindEvents(shape, evNames, attr.events[evNames]);
				}

				//Execute the after shape created (I've moved from line after "set shape id") (2012-03-14)
                if (options[node] && options[node].afterFn != null)
                	options[node].afterFn.apply(shape,[elShape, attr]);

				// put shape into set
                myNewSet.push(shape);
            }

			return shape;
        };

        this.getMatrixStrFromAttr = function(transformAttr){
        	return transformAttr.match(/matrix\((.*?)\)/)[1];
        }

        this.getMatrixFromStr = function(str){
        	var splitChar = ' ';
        	if (str.indexOf(',')>-1)
        		splitChar = ',';

        	var matrix = str.split(splitChar);
			return Raphael.matrix(parseFloat(matrix[0]), parseFloat(matrix[1]), parseFloat(matrix[2]), parseFloat(matrix[3]), parseFloat(matrix[4]), parseFloat(matrix[5]));
        }

        this.doFill = function (strNode, attr, mNodeName, mNodeValue) {
			//override fill value with default if it present
			mNodeValue = attr[mNodeName]?attr[mNodeName]:mNodeValue;
            // check if linear gradient
            if (mNodeValue.indexOf("url") == 0) {
                var opacity;
                var gradID = mNodeValue.substring("url(#".length, mNodeValue.length - 1);
                for (var l = 0; l < radGrads.length; l++)
                if (radGrads.item(l).getAttribute("id") == gradID) {
                    // get stops
                    var stop1, stop2;
                    for (var st = 0; st < radGrads.item(l).childNodes.length; st++)
                    if (radGrads.item(l).childNodes.item(st).nodeName == "stop") {
                        if (stop1)
							stop2 = radGrads.item(l).childNodes.item(st);
                        else
							stop1 = radGrads.item(l).childNodes.item(st);
                    }

                    if (!stop1)
						return; // could not parse stops

                    // TODO: implement radial offset
                    // radial gradients not supported for paths, so do linear
                    if (strNode == "path") 
                    	attr[mNodeName] = 90 + "-" + stop1.getAttribute("stop-color") + "-" + stop2.getAttribute("stop-color") + ":50-" + stop1.getAttribute("stop-color");
                    else 
                    	attr[mNodeName] = "r(" + radGrads.item(l).getAttribute("fx") + "," + radGrads.item(l).getAttribute("fx") + ")" + stop1.getAttribute("stop-color") + "-" + stop2.getAttribute("stop-color");

                    if (stop1.getAttribute("stop-opacity")) opacity = stop1.getAttribute("stop-opacity")
                }

                for (var l = 0; l < linGrads.length; l++){
					if (linGrads.item(l).getAttribute("id") == gradID) {
						// get angle
						var x1 = parseFloat(linGrads.item(l).getAttribute("x1"));
						var x2 = parseFloat(linGrads.item(l).getAttribute("x2"));
						var y1 = parseFloat(linGrads.item(l).getAttribute("y1"));
						var y2 = parseFloat(linGrads.item(l).getAttribute("y2"));
						var b = y2 - y1;
						var c = x2 - x1;

						angle = Math.atan2(b,c)*(180/Math.PI);
						if(angle < 0)
							angle = Math.abs(angle);
						else
							angle = 360 - angle;

						// get stops
						var stop1, stop2;
						for (var st = 0; st < linGrads.item(l).childNodes.length; st++)
							if (linGrads.item(l).childNodes.item(st).nodeName == "stop") {
								if (stop1) stop2 = linGrads.item(l).childNodes.item(st);
								else stop1 = linGrads.item(l).childNodes.item(st);
							}

						if (!stop1) return; // could not parse stops

						// TODO: hardcoded offset value of 50
						var stop1Color = stop1.getAttribute("stop-color");
						if (stop1Color == null)
							stop1Color = stop1.style['stop-color'];

						var stop2Color = stop2.getAttribute("stop-color");
						if (stop2Color == null)
							stop2Color = stop2.style['stop-color'];

						var offseta = 0;//Math.sqrt( (-y1*-y1) + (-x1*-x1) );
						var offsetb = 100;//Math.sqrt( (-y2*-y2) + (-x2*-x2) );

						attr[mNodeName] = angle + "-" + stop1Color + ":" + offseta + "-" + stop2Color + ":" + offsetb;
						if (stop1.getAttribute("stop-opacity"))
							opacity = stop1.getAttribute("stop-opacity");
					}
				}
                if (opacity)
					attr["opacity"] = opacity;
            } 
            else{
                attr[mNodeName] = mNodeValue;
            }
        };

		this.setShapeId = function(shape, attr){
			var tagId = attr['id'];

			if (typeof tagId != 'undefined') {
				if (this.getById(tagId) != null) {
					throw new Error('ID <' + tagId + '> already defined in SVG data. The ID value must be unique.');
				}
				shape.id = tagId;
				// sets don't have node
				if (shape.type != 'set'){
					shape.node.id = shape.id;
				}
				else
					if(!this.sets[attr['id']])
						this.sets[attr['id']] = shape;
			}
		};

        this.convertToAbsolute = function(path){
          var oldPath = path;
          path = path.node;
		  var x0,y0,x1,y1,x2,y2,segs = path.pathSegList;
		  for (var x=0,y=0,i=0,len=segs.numberOfItems;i<len;++i){
		    var seg = segs.getItem(i), c=seg.pathSegTypeAsLetter;
		    if (/[MLHVCSQTA]/.test(c)){
		      if ('x' in seg) x=seg.x;
		      if ('y' in seg) y=seg.y;
		    }else{
		      if ('x1' in seg) x1=x+seg.x1;
		      if ('x2' in seg) x2=x+seg.x2;
		      if ('y1' in seg) y1=y+seg.y1;
		      if ('y2' in seg) y2=y+seg.y2;
		      if ('x'  in seg) x+=seg.x;
		      if ('y'  in seg) y+=seg.y;
		      switch(c){
		        case 'm': segs.replaceItem(path.createSVGPathSegMovetoAbs(x,y),i);                   break;
		        case 'l': segs.replaceItem(path.createSVGPathSegLinetoAbs(x,y),i);                   break;
		        case 'h': segs.replaceItem(path.createSVGPathSegLinetoHorizontalAbs(x),i);           break;
		        case 'v': segs.replaceItem(path.createSVGPathSegLinetoVerticalAbs(y),i);             break;
		        case 'c': segs.replaceItem(path.createSVGPathSegCurvetoCubicAbs(x,y,x1,y1,x2,y2),i); break;
		        case 's': segs.replaceItem(path.createSVGPathSegCurvetoCubicSmoothAbs(x,y,x2,y2),i); break;
		        case 'q': segs.replaceItem(path.createSVGPathSegCurvetoQuadraticAbs(x,y,x1,y1),i);   break;
		        case 't': segs.replaceItem(path.createSVGPathSegCurvetoQuadraticSmoothAbs(x,y),i);   break;
		        case 'a': segs.replaceItem(path.createSVGPathSegArcAbs(x,y,seg.r1,seg.r2,seg.angle,seg.largeArcFlag,seg.sweepFlag),i);   break;
		        case 'z': case 'Z': x=x0; y=y0; break;
		      }
		    }
		    // Record the start of a subpath
		    if (c=='M' || c=='m') x0=x, y0=y;
		  }
		  oldPath.node = path;
		  return oldPath;
		};

		var oldGetById = this.getById;
		this.getById = function(id){
			var bot = this.bottom;
	        while (bot) {
	            if (bot.id == id) {
	                return bot;
	            }
	            bot = bot.next;
	        }
	        
			return this.sets[id];
		}

		this.init();
    } 
    catch (error) {
        alert("The SVG data you entered was invalid! (" + error + ")");
    }

    // return our new set
    return fullSvgSet;
};

//Raphael canvas extension to fix small issue with texts in chrome
Raphael.fn.chrome = function(){
	//if google chrome
	$('text > tspan').attr('dy',0);
};

//Raphael canvas extension to bind different events to a shape.
//Usage: paper.bindEvents(elShape, 'click, mouseover', function (el) { /*...*/ });
Raphael.fn.bindEvents = function(shape, eventNames, eventFn){
	$.each(eventNames.split(','), function(i, evName){
		shape[evName.trim()].apply(shape,[eventFn]);
	});
};

//Raphael canvas extension to move a shape and scale it too.
//Usage: paper.moveScaledTo(elShape, newX, newY, 1.5); //scale 1.5 times
Raphael.fn.moveScaledTo = function(el, x, y, scale){
	x = x - (el.getBBox().x + (el.getBBox().width/2));
	y = y - (el.getBBox().y + (el.getBBox().height/2));

	el.transform('t' + x + ',' + y + (scale != undefined?'s'+scale:''));

	return el;
};

//Raphael canvas extension to move a shape (keeping the same scale).
//Usage: paper.moveTo(elShape, newX, newY);
Raphael.fn.moveTo = function(el, x, y){
	return this.moveScaledTo(el, x, y, 1);
};

//Raphael canvas extension to returns you element by its internal ID (using like instead of equals as getById).
//Usage: paper.getLikeId(id);
Raphael.fn.getLikeId = function(id){
	var bot = this.bottom;
    while (bot) {
        if (String(bot.id).indexOf(id) > -1) {
            return bot;
        }
        bot = bot.next;
    }
    return null;
};

Raphael.el.bringForward = function(el){
	if (this.paper.top === this) {
        return;
    }
    
    if (this.paper.bottom != this)
    	this.prev.next = this.next;

    this.next.prev = this.prev;
    this.prev = null;
    this.next = null;

    this.prev = el;
    this.next = el.next;
    if (el.next == null)
    	this.paper.top = this;
    else
    	el.next.prev = this;
    el.next = this;
};

/*
 * raphael.backward-forward 0.0.3
 *
 * Copyright (c) 2010 Wout Fierens
 * Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license.
 */

// get all elements in the paper
Raphael.fn.elements = function() {
  var b = this.bottom,
      r = []; 
  while (b) { 
    r.push(b); 
    b = b.next; 
  }
  return r;
};

// move an element in the stack
Raphael.fn.arrange = function(shape, steps, scope) {
  if (!parseInt(steps)) return;
  var elements  = scope || this.elements(),
      pos       = $.inArray(elements,shape),
      lastPos   = elements.length - 1,
      newPos    = pos + steps;
  if (newPos > lastPos)
    newPos = lastPos;
  if (newPos <= 0)
    newPos = 0;
  if (steps > 0)
    shape.insertAfter(elements[newPos]);
  else if (steps < 0)
    shape.insertBefore(elements[newPos]);
  if (scope) {
    scope.splice(pos, 1);
    scope.splice(newPos, 0, shape);
  }
};

// move an element one step backward in the stack
Raphael.el.backward = function(steps, scope) {
  steps = parseInt(steps) || 1;
  this.paper.arrange(this, -steps, scope);
  return this;
};

// move an element one step forward in the stack
Raphael.el.forward = function(steps, scope) {
  steps = parseInt(steps) || 1;
  this.paper.arrange(this, steps, scope);
  return this;
};

/*
 * ScaleRaphael 0.8 by Zevan Rosser 2010
 * For use with Raphael library : www.raphaeljs.com
 * Licensed under the MIT license.
 *
 * www.shapevent.com/scaleraphael/
 */ (function () {
    window.ScaleRaphael = function (container, width, height) {
        var wrapper = document.getElementById(container);
        if (!wrapper.style.position) wrapper.style.position = "relative";
        wrapper.style.width = width + "px";
        wrapper.style.height = height + "px";
        wrapper.style.overflow = "hidden";

        var nestedWrapper;

        if (Raphael.type == "VML") {
            wrapper.innerHTML = "<rvml:group style='position : absolute; width: 1000px; height: 1000px; top: 0px; left: 0px' coordsize='1000,1000' class='rvml' id='vmlgroup-" + container + "'><\/rvml:group>";
            nestedWrapper = document.getElementById("vmlgroup-" + container);
        } else {
            wrapper.innerHTML = "<div id='svggroup-" + container + "'><\/div>";
            nestedWrapper = document.getElementById("svggroup-" + container);
        }

        var paper = new Raphael(nestedWrapper, width, height);
        var vmlDiv;

        if (Raphael.type == "SVG") {
            paper.canvas.setAttribute("viewBox", "0 0 " + width + " " + height);
        } else {
            vmlDiv = wrapper.getElementsByTagName("div")[0];
        }

        paper.changeSize = function (w, h, center, clipping) {
            clipping = !clipping;

            var ratioW = w / width;
            var ratioH = h / height;
            var scale = ratioW < ratioH ? ratioW : ratioH;

            var newHeight = parseInt(height * scale);
            var newWidth = parseInt(width * scale);

            if (Raphael.type == "VML") {
                // scale the textpaths
                var txt = document.getElementsByTagName("textpath");
                for (var i in txt) {
                    var curr = txt[i];
                    if (curr.style) {
                        if (!curr._fontSize) {
                            var mod = curr.style.fontSize.split("px"); //curr.style.font.split("px");
                            curr._fontSize = parseInt(mod[0]);
                            curr._font = curr.style.fontFamily; //mod[1];
                        }
                        curr.style.font = curr._fontSize * scale + "px" + curr._font;
                    }
                }
                var newSize;
                if (newWidth < newHeight) {
                    newSize = newWidth * 1000 / width;
                } else {
                    newSize = newHeight * 1000 / height;
                }
                newSize = parseInt(newSize);
                nestedWrapper.style.width = newSize + "px";
                nestedWrapper.style.height = newSize + "px";
                if (clipping) {
                    nestedWrapper.style.left = parseInt((w - newWidth) / 2) + "px";
                    nestedWrapper.style.top = parseInt((h - newHeight) / 2) + "px";
                }
                vmlDiv.style.overflow = "visible";
            }

            if (clipping) {
                newWidth = w;
                newHeight = h;
            }

            wrapper.style.width = newWidth + "px";
            wrapper.style.height = newHeight + "px";
            paper.setSize(newWidth, newHeight);

            if (center) {
                wrapper.style.position = "absolute";
                wrapper.style.left = parseInt((w - newWidth) / 2) + "px";
                wrapper.style.top = parseInt((h - newHeight) / 2) + "px";
            }
        }

        paper.scaleAll = function (amount) {
            paper.changeSize(width * amount, height * amount);
        }

        paper.changeSize(width, height);

        paper.w = width;
        paper.h = height;

        return paper;
    }
})();

if(!String.prototype.trim) {
	String.prototype.trim = function() {
		return this.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
	}
}

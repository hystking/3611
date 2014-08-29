
!function(){
var IceOverlay = function(canvas, dom){
	this.canvas = canvas;
	this.dom = dom;
};
var Polygon = function(points){
	this.points = points;
};
Polygon.prototype.draw = function(ctx){
	ctx.beginPath();
	ctx.moveTo(
		this.points[0].x,
		this.points[0].y
		);
	for(var i=1; i<this.points.length; i++){
		ctx.lineTo(
			this.points[i].x,
			this.points[i].y
			);
	}
	ctx.closePath();
	ctx.fill();
}
var createPolygon = function(points){
	if(points.length > 2){
		return new Polygon(points);
	}
}
var fade = function(dom, fps, anim_count_max){
	var fade_aux = function(){
		if(anim_count < anim_count_max){
			dom.style.opacity = 1-anim_count/anim_count_max;
			setTimeout(fade_aux, 1000/fps);
		}else{
			kill(dom);
		}
		anim_count++;
	};
	var anim_count = 0;
	fade_aux();
};
var kill = function(dom){
	dom.display = "none";
	dom.parentNode.removeChild(dom);
};
IceOverlay.prototype.hahenAnimationStart = function(x, y, polygons){
	var ctx = this.canvas.getContext("2d");
	var width = this.canvas.width;
	var height = this.canvas.height;

	var fps = 30;
	var anim_max = 30;
	var anim_count = 0;


	var vy = [];
	var vx = [];
	for(var i=0; i<polygons.length; i++){
		vy[i] = Math.random()*10;
		vx[i] = 50/(polygons[i].points[0].x-x);
		//console.log(vx[i]);
	}

	var imageMask = this.imageMask;

	var aux = function(){
		ctx.clearRect(0, 0, width, height);
		ctx.save();
		for(var i=0; i<polygons.length; i++){
			ctx.fillStyle = "white";
			for(var j=0; j<polygons[i].points.length; j++){
				polygons[i].points[j].y += vy[i];
				polygons[i].points[j].x += vx[i];
			}
			vy[i] += 1;
			polygons[i].draw(ctx);
		}
		anim_count++;
		if(anim_count < anim_max){
			setTimeout(aux, 1000/fps);
		}
	ctx.globalCompositeOperation = "destination-in";
	ctx.drawImage(imageMask, 0, 0);
	ctx.restore();

	};
	aux();
};
IceOverlay.prototype.init = function(){
	this.left = parseInt(this.canvas.style.left.match(/-?[\d\.]+/)[0]);
	this.top = parseInt(this.canvas.style.top.match(/-?[\d\.]+/)[0]);
	this.width = this.canvas.width;
	this.height = this.canvas.height;
	this.clickCount = 0;
	this.frozen = false;

	var this2 = this;

	var addShibuki = function(x, y){
		var shibuki_img = SHIBUKI_TEXTURE_IMG.cloneNode();
		var img_obj = new Image();
		img_obj.src = shibuki_img.src;
		img_obj.onload = function(){
			shibuki_img.src = img_obj.src;
		};
		shibuki_img.style.left = x-150 + "px";
		shibuki_img.style.top = y-150 + "px";
		document.body.appendChild(shibuki_img);
		fade(shibuki_img, 40, 10);
	};
	this.canvas.onclick = function(e){
		var canvas = this2.canvas;
		if(this2.frozen){
			console.log("clicked");
			this2.clickCount++;
			var mouseX = e.pageX - this2.left;
			var mouseY = e.pageY - this2.top;
			addShibuki(e.pageX, e.pageY);
			var fps = 30;
			var anim_count_max = 5;
			var anim_count = 0;
			var reset = function(){
					canvas.style.left = this2.left + "px";
					canvas.style.top = this2.top + "px";
			}
			var tremble = function(){
				if(anim_count < anim_count_max){
					var mag = 10/anim_count;
					canvas.style.left = this2.left + Math.random()*mag -mag/2 + "px";
					canvas.style.top = this2.top + Math.random()*mag  + "px";
					setTimeout(tremble, 1000/fps);
				}else{
					reset();
				}
				anim_count ++;
			}
			var polygons = this2.hibi(mouseX, mouseY);
			tremble();
			if(this2.clickCount >= 4){
				this2.hahenAnimationStart(mouseX, mouseY, polygons);
				fade(canvas, 20, 15);
				canvas.onclick = null;
			}
		}
	};
};
IceOverlay.prototype.hibi = function(x, y){
	var ctx = this.canvas.getContext("2d");
	var width = this.canvas.width;
	var height = this.canvas.height;
	var step_max = 8;
	var line_connect_max = 6;
	var points = [];
	var lineWidthBase = 2;
	var lines = 20;
	var r_d = Math.random()*Math.PI*2

	var hibi_white = "rgba(255, 255, 255, 0.8)";
	var hibi_shadow = "rgba(0, 0, 0, 0.5)";

	var polygons = [];

	var line = function(th){
		ctx.beginPath();
		var line_points = [{x:x, y:y}];
		var aux = function(px, py, r, th, step){
			var r2 = r*(Math.random()/8+1.6);
			var th2 = th + Math.random()*Math.PI/32-Math.PI/64;
			var nx = x+Math.cos(th2)*r2;
			var ny = y+Math.sin(th2)*r2;
			if(step < step_max){
				line_points.push({x:nx, y:ny});
			}
			if(nx >= 0 && nx < width && ny >= 0 && ny < height){
				aux(nx, ny, r2, th2, step+1);
			}else{
				line_points.push({x:nx, y:ny});
			}
		};
		aux(x, y, 4, th, 0);
		points.push(line_points);
	}
	ctx.save();
	ctx.globalCompositeOperation = "source-over";
	for(var i=0; i<lines; i++){
		line(r_d+i/lines*Math.PI*2);
	}
	for(var i=0; i<lines; i++){
		var line_points = points[i];
		var line_points_next = points[(i+1)%lines];
		var k = line_points.length-1;
		var k2 = line_points_next.length-1;
		var polygon_points = [];
		for(var j=0; j<k; j++){
			var a = (step_max-j)/step_max;
			var px = line_points[j].x;
			var py = line_points[j].y;
			var nx = line_points[j+1].x;
			var ny = line_points[j+1].y;

			ctx.lineWidth = lineWidthBase*a*(1+Math.random()*0.3);
			ctx.strokeStyle = hibi_shadow;
			ctx.beginPath();
			ctx.moveTo(px+0.3, py+0.3);
			ctx.lineTo(nx+0.3, ny+0.3);
			ctx.stroke();

			ctx.strokeStyle = hibi_white;
			ctx.beginPath();
			ctx.moveTo(px, py);
			ctx.lineTo(nx, ny);
			ctx.stroke();

			polygon_points.unshift({x:px, y:py});
			if(j < k2){
				nx2 = line_points_next[j].x;
				ny2 = line_points_next[j].y;
				polygon_points.push({x:nx2, y:ny2});
				if(j < line_connect_max && Math.random() < 0.6){

					ctx.strokeStyle = hibi_shadow;
					ctx.beginPath();
					ctx.moveTo(px+0.3, py+0.3);
					ctx.lineTo(nx2+0.3, ny2+0.3);
					ctx.stroke();

					ctx.strokeStyle = hibi_white;
					ctx.beginPath();
					ctx.moveTo(px, py);
					ctx.lineTo(nx2, ny2);
					ctx.stroke();

					var polygon = createPolygon(polygon_points);
					if(polygon){
						polygons.push(polygon);
					}
					polygon_points = [{x:px, y:py}, {x:nx2, y:ny2}];
				}
			}
		}

		var px = line_points[k].x;
		var py = line_points[k].y;
		nx2 = line_points_next[k2].x;
		ny2 = line_points_next[k2].y;
		polygon_points.unshift({x:px, y:py});
		polygon_points.push({x:nx2, y:ny2});
		var polygon = createPolygon(polygon_points);
		if(polygon){
			polygons.push(polygon);
		}
	}

	for(var i=0; i<polygons.length; i++){
		ctx.fillStyle = "rgba(255,255,255,"+(0.05+Math.random()*0.1)+")";
		//ctx.fillStyle = ["red","blue","yellow"][Math.random()*3|0];
		polygons[i].draw(ctx);
	}

	var grad = ctx.createRadialGradient(x, y, 0, x, y, 100);
	grad.addColorStop(0,"rgba(255,255,255,0.3)");
	grad.addColorStop(1,"rgba(255,255,255,0.0)");
	ctx.fillStyle = grad;
	ctx.rect(0, 0, width, height);
	ctx.fill();
	ctx.globalCompositeOperation = "destination-in";
	ctx.drawImage(this.imageMask, 0, 0);
	ctx.restore();

	return polygons;
};
IceOverlay.prototype.checkDrawn = function(){
	var ctx = this.canvas.getContext("2d");
	var width = this.canvas.width;
	var height = this.canvas.height;
	var imageData = ctx.getImageData(0, 0, width, height);
	var data = imageData.data;
	var k=0;
	for(var y=0; y<height; y++){
		for(var x=0; x<width; x++){
			var i=((y*width)+x)*4+3;
			if(data[i] !== 0){
				//console.log(width*height+":"+k);
				return true;
			}
			k++;
		}
	}
	return false;
};
IceOverlay.prototype.renderEffected = function(a){
	var ctx = this.canvas.getContext("2d");
	var width = this.canvas.width;
	var height = this.canvas.height;

	var dx = 10;
	var y_base = (1-a)*height;


	ctx.putImageData(this.imageDataEffected, 0, 0);
	
	ctx.save();
	/*
	ctx.rect(0, (1-a)*height, width, a*height);
	*/
	var points = [{x:0, y:y_base+Math.random()*10-5}];
	for(var x=dx; x<width; x+=dx){
		points.push({x:x, y:y_base+Math.random()*10-5});
	}
	points.push({x:width, y:y_base+Math.random()*10-5});
	points.push({x:width, y:height});
	points.push({x:0, y:height});

	ctx.globalCompositeOperation = "source-atop";
	ctx.strokeStyle = "white";
	ctx.lineWidth = 10;
	ctx.beginPath();
	ctx.moveTo(points[0].x, points[0].y);
	for(var i=1; i<points.length; i++){
		ctx.lineTo(points[i].x, points[i].y);
	}
	ctx.closePath();
	ctx.stroke();

	ctx.globalCompositeOperation = "destination-in";
	ctx.fillStyle = "red";
	ctx.beginPath();
	ctx.moveTo(points[0].x, points[0].y);
	for(var i=1; i<points.length; i++){
		ctx.lineTo(points[i].x, points[i].y);
	}
	ctx.closePath();

	ctx.fill();
	

	ctx.globalCompositeOperation = "source-atop";
	ctx.drawImage(ICE_TEXTURE_IMG, 0, 0, ICE_TEXTURE_IMG.width, ICE_TEXTURE_IMG.height);
	ctx.restore();
};
IceOverlay.prototype.startAnimation = function(){
	var this2 = this;
	var canvas = this.canvas;
	var anim_time = 1*canvas.height;
	var anim_fps = 3;
	for(var i=anim_fps; i<=anim_time; i+=anim_time/anim_fps){
		!function(i){
			setTimeout(function(){
				this2.renderEffected(i/anim_time);
			}, i);
		}(i);
	}
	setTimeout(function(){
		this2.renderEffected(1.0);
		this2.frozen = true;
	}, i+anim_fps);
};
IceOverlay.prototype.effect = function(){
	var ctx = this.canvas.getContext("2d");
	var width = this.canvas.width;
	var height = this.canvas.height;

	ctx.putImageData(this.imageDataOrigin, 0, 0);

	var rect_r = 5;
	ctx.lineWidth = 5.0;
	ctx.strokeStyle = TURARA_COLOR;
	ctx.fillStyle = TURARA_COLOR;

	var turara = function(){
		var imageDataOrigin = ctx.getImageData(0, 0, width, height);
		var imageData = ctx.getImageData(0, 0, width, height);
		var dataOrigin = imageDataOrigin.data;
		var data = imageData.data;
		for(var x=1; x<width; x++){
			var s = false;
			for(var y=0; y<height; y++){
				var i = (y*width+x)*4;
				var j = (y*width+x-1)*4;
				var diff_op = dataOrigin[j+3] - dataOrigin[i+3];
				if((s || diff_op > 128) && Math.random()>0.2){
					data[i] = TURARA_COLOR_R;
					data[i+1] = TURARA_COLOR_G;
					data[i+2] = TURARA_COLOR_B;
					data[i+3] = TURARA_COLOR_A;
					s = true;
				}else{
					s = false;
				}
			}
		}
		ctx.putImageData(imageData, 0, 0);
	};
	var erode=function(){
		var imageDataOrigin = ctx.getImageData(0, 0, width, height);
		var imageData = ctx.getImageData(0, 0, width, height);
		var dataOrigin = imageDataOrigin.data;
		var data = imageData.data;
		for(var x=1; x<width-1; x++){
			for(var y=1; y<height-1; y++){
				var i0 = ((y-1)*width+x-1)*4;
				var i1 = ((y-1)*width+x)*4;
				var i2 = ((y-1)*width+x+1)*4;
				var i3 = (y*width+x-1)*4;
				var i4 = (y*width+x)*4;
				var i5 = (y*width+x+1)*4;
				var i6 = ((y+1)*width+x-1)*4;
				var i7 = ((y+1)*width+x)*4;
				var i8 = ((y+1)*width+x+1)*4;
				if(dataOrigin[i4+3]>0){
					//data[i0+0] = TURARA_COLOR_R;
					data[i1+0] = TURARA_COLOR_R;
					//data[i2+0] = TURARA_COLOR_R;
					data[i3+0] = TURARA_COLOR_R;
					data[i4+0] = TURARA_COLOR_R;
					data[i5+0] = TURARA_COLOR_R;
					//data[i6+0] = TURARA_COLOR_R;
					data[i7+0] = TURARA_COLOR_R;
					//data[i8+0] = TURARA_COLOR_R;
					//data[i0+1] = TURARA_COLOR_G;
					data[i1+1] = TURARA_COLOR_G;
					//data[i2+1] = TURARA_COLOR_G;
					data[i3+1] = TURARA_COLOR_G;
					data[i4+1] = TURARA_COLOR_G;
					data[i5+1] = TURARA_COLOR_G;
					//data[i6+1] = TURARA_COLOR_G;
					data[i7+1] = TURARA_COLOR_G;
					//data[i8+1] = TURARA_COLOR_G;
					//data[i0+2] = TURARA_COLOR_B;
					data[i1+2] = TURARA_COLOR_B;
					//data[i2+2] = TURARA_COLOR_B;
					data[i3+2] = TURARA_COLOR_B;
					data[i4+2] = TURARA_COLOR_B;
					data[i5+2] = TURARA_COLOR_B;
					//data[i6+2] = TURARA_COLOR_B;
					data[i7+2] = TURARA_COLOR_B;
					//data[i8+2] = TURARA_COLOR_B;
					//data[i0+3] = TURARA_COLOR_A;
					data[i1+3] = TURARA_COLOR_A;
					//data[i2+3] = TURARA_COLOR_A;
					data[i3+3] = TURARA_COLOR_A;
					data[i4+3] = TURARA_COLOR_A;
					data[i5+3] = TURARA_COLOR_A;
					//data[i6+3] = TURARA_COLOR_A;
					data[i7+3] = TURARA_COLOR_A;
					//data[i8+3] = TURARA_COLOR_A;
				}
			}
		}
		ctx.putImageData(imageData, 0, 0);
	};
	var edgeY=function(dataOrigin, data){
		for(var x=0; x<width; x++){
			for(var y=1; y<height-1; y++){
				var i4 = (y*width+x)*4;
				var i7 = ((y+1)*width+x)*4;
				if(dataOrigin[i4+3] === 0 && dataOrigin[i7+3] !== 0){
					data[i4] = OUTLINE_COLOR_R;
					data[i4+1] = OUTLINE_COLOR_G;
					data[i4+2] = OUTLINE_COLOR_B;
					data[i4+3] = OUTLINE_COLOR_A;
					data[i7+3] = 255;
				}
				if(dataOrigin[i4+3] !== 0 && dataOrigin[i7+3] === 0){
					data[i7] = OUTLINE_COLOR_R;
					data[i7+1] = OUTLINE_COLOR_G;
					data[i7+2] = OUTLINE_COLOR_B;
					data[i7+3] = OUTLINE_COLOR_A;
					data[i4+3] = 255;
				}
			}
		}
	};
	var edgeX=function(dataOrigin, data){
		for(var y=0; y<height; y++){
			for(var x=1; x<width-1; x++){
				var i4 = (y*width+x)*4;
				var i5 = (y*width+x+1)*4;
				if(dataOrigin[i4+3] === 0 && dataOrigin[i5+3] !== 0){
					data[i4] = OUTLINE_COLOR_R;
					data[i4+1] = OUTLINE_COLOR_G;
					data[i4+2] = OUTLINE_COLOR_B;
					data[i4+3] = OUTLINE_COLOR_A;
					data[i5+3] = 255;
				}
				if(dataOrigin[i4+3] !== 0 &&  dataOrigin[i5+3] === 0){
					data[i5] = OUTLINE_COLOR_R;
					data[i5+1] = OUTLINE_COLOR_G;
					data[i5+2] = OUTLINE_COLOR_B;
					data[i5+3] = OUTLINE_COLOR_A;
					data[i4+3] = 255;
				}
			}
		}
	};
	var edgeBoth = function(){
		var imageDataOrigin = ctx.getImageData(0, 0, width, height);
		var dataOrigin = imageDataOrigin.data;
		var imageData = ctx.getImageData(0, 0, width, height);
		var data = imageData.data;

		edgeX(dataOrigin, data);
		edgeY(dataOrigin, data);

		ctx.putImageData(imageData, 0, 0);
	};

	erode();
	turara();
	erode();
	erode();

	this.imageDataMask = ctx.getImageData(0, 0, width, height);
	this.imageMask = new Image();
	this.imageMask.src = this.canvas.toDataURL();

	ctx.save();
	ctx.globalCompositeOperation = "source-in";
	ctx.fillStyle=ICE_GRADATION;
	ctx.rect(0, 0, width, height);
	ctx.fill();
	
	edgeBoth();
	this.imageDataEffected = ctx.getImageData(0, 0, width, height);
	ctx.restore();

	ctx.clearRect(0, 0, width, height);
	this.startAnimation();
};
IceOverlay.prototype.renderDefault = function(){
	var canvas = this.canvas;
	var ctx = this.canvas.getContext("2d");
	var width = this.canvas.width;
	var height = this.canvas.height;
	var domWidth = this.dom.offsetWidth;
	var domHeight = this.dom.offsetHeight;
	var this2 = this;
	/*
	ctx.moveTo(0, 0);
	ctx.lineTo(width, height);
	ctx.stroke();
	*/
	var end = function(){
		var imageData = null;
		try{
			imageData = ctx.getImageData(0, 0, width, height);
			if(!this2.checkDrawn()){
				canvas.style.display = "none";
			}
		}catch(e){
			console.log(e);
			var canvas2 = this2.canvas.cloneNode();
			canvas2.onclick = this2.canvas.onclick;
			var ctx2 = canvas2.getContext("2d");
			ctx2.fillStyle = "red";
			ctx2.rect(CANVAS_PADDING_X, CANVAS_PADDING_Y, domWidth, domHeight);
			ctx2.fill();
			this2.canvas = canvas2;
			imageData = ctx2.getImageData(0, 0, width, height);
			canvas.style.display = "none";
			canvas.parentNode.appendChild(canvas2);
			canvas.parentNode.removeChild(canvas);
			ctx = ctx2;
		}
		this2.imageDataOrigin = ctx.getImageData(0, 0, width, height);
		ctx.clearRect(0, 0, width, height);
		this2.effect();
	}

	if(checkTag(this.dom)){
		if(this.dom.tagName === "IMG"){
			ctx.drawImage(this.dom, CANVAS_PADDING_X, CANVAS_PADDING_Y, domWidth, domHeight);
		}else if(this.dom.tagName === "CANVAS"){
			ctx.putImageData(
				this.dom.getContext("2d").getImageData(0, 0, domWidth, domHeight),
				CANVAS_PADDING_X, CANVAS_PADDING_Y
				);
		}else{
			ctx.fillStyle = "red";
			ctx.rect(CANVAS_PADDING_X, CANVAS_PADDING_Y, domWidth, domHeight);
			ctx.fill();
		}
		end();
		return;
	}

	var getSpreadedStyleHTML = function(dom, root, depth){
		if(!dom.tagName){
			return dom.nodeValue || dom.innerHTML || "";
		}
		if(dom.tagName === "BR"){
			return "<br />";
		}
		var children = dom.childNodes;
		var spreadedInnerHTML = "";
		var styles = dom.currentStyle || window.getComputedStyle(dom, null);
		var styles_text = "";
		var i;
		var domDist = null;
		domDist = dom.cloneNode(false);
		if(styles){
			for(i=0; i<styles.length; i++){
				var styleName = styles[i];
				if(root && (
					styleName.match(/^margin/) ||
					styleName === "top" ||
					styleName === "left" ||
					styleName === "bottom" ||
					styleName === "right"
					)){
				}else if(styles.getPropertyValue(styleName)){
					styles_text += styleName+":"+styles.getPropertyValue(styleName).replace(/\"/g,"\'")+";";
				}
			}
		}
		var classes = domDist.getAttribute("class");
		if(!root && classes && classes.match(/ice_overlayed/)){
			styles_text += "visibility: hidden;";
			children = [];
		}
		if(checkTag(dom) && styles.getPropertyValue("display") === "inline"){
			styles_text += "display: inline-block;";
		}
		domDist.setAttribute("style", styles_text);
		var spreadedInnerHTML = "";
		if(children){
			if(children.length > 0){
				for(i=0; i<children.length; i++){
					spreadedInnerHTML += getSpreadedStyleHTML(children[i], false);
				}
			}else{
				spreadedInnerHTML = dom.innerHTML;
			}
		}
		var attributes = domDist.attributes;
		var attributes_text = "";
		for(i=0; i<attributes.length; i++){
			var attr = attributes[i];
			if(attr.nodeName && attr.value){
				attributes_text += attr.nodeName+"=\""+attr.value+"\" ";
			}
		}
		var html = null;
		if(checkTag(domDist)){
			domDist.setAttribute("src", "");
			var html = "<IFRAME "+attributes_text+" />";
		}else{
			var html = "<"+domDist.tagName+" "+attributes_text+">"+spreadedInnerHTML+"</"+domDist.tagName+">";
		}
		return html;
	};
	var html = getSpreadedStyleHTML(this.dom, true);

	var data = "<svg xmlns='http://www.w3.org/2000/svg' width='"+width+"px' height='"+height+"px'>" +
		"<foreignObject width='"+width+"px' height='"+height+"px'>" +
		"<div xmlns='http://www.w3.org/1999/xhtml'>"+
		html+
		"</div>" +
		"</foreignObject>" +
		"</svg>";
	var img = new Image();
	var svg = new Blob([data], {type: "image/svg+xml;charset=utf-8"});
	var domurl = self.URL || self.webkitURL || self;
	var url = domurl.createObjectURL(svg);
	img.onload = function(){
		domurl.revokeObjectURL(url);
		ctx.drawImage(img, CANVAS_PADDING_X, CANVAS_PADDING_Y, width, height);
		end();
	};
	img.onerror = function(){
		domurl.revokeObjectURL(url);
		end();
	}
	img.src = url;
};
var checkTag=function(dom){
	if(dom.tagName === "IMG" ||
		dom.tagName === "IFRAME" ||
		dom.tagName === "CANVAS"){
		return true;
	}
	return false;
};
var frozenJsMain = function(d, w){
	var overlayCanvas = function(dom, zIndex){
		if(!checkTag(dom)){
			var text = dom.nodeValue || dom.innerHTML || "";
			if(text.replace(/^\s*(.*?)\s*$/, "$1") === ""){
				return true;
			}
			if(!dom.getBoundingClientRect){
				return false;
			}
		}
		var rect = dom.getBoundingClientRect();
		var scrollLeft = document.body.scrollLeft || document.documentElement.scrollLeft ||window.scrollLeft||0;
		var scrollTop  = document.body.scrollTop || document.documentElement.scrollTop ||window.scrollTop||0;
		var style = window.getComputedStyle(dom, null);
		var children = dom.childNodes;
		var allChildrenReplaced = true;

		if(style && style.display === "none" || style.visibility === "hidden" || style.position === "fixed"){
			return true;
		}
		if(children.length > 0){
			for(var i=0; i<children.length; i++){
				var child=children[i];
				if(!overlayCanvas(child, zIndex+1000)){
					allChildrenReplaced = false;
				}
			}
		}else{
			allChildrenReplaced = false;
		}

		if(rect.height <= 0 || rect.width <= 0){
			return true;
		}
		if(rect.height > HEIGHT_MAX || rect.width > WIDTH_MAX){
			return true;
		}
		if(allChildrenReplaced){
			return true;
		}else if(style && style.display === "block" || checkTag(dom)){
			var canvas = document.createElement("canvas");
			canvas.style.position = "absolute";
			canvas.style.top = rect.top + scrollTop - CANVAS_PADDING_Y + "px";
			canvas.style.left = rect.left + scrollLeft - CANVAS_PADDING_X + "px";
			canvas.style.zIndex = zIndex;
			canvas.setAttribute("height", rect.height + CANVAS_PADDING_Y*2);
			canvas.setAttribute("width", rect.width + CANVAS_PADDING_X*2);
			overlayDiv.appendChild(canvas);
			overlays.push({canvas:canvas, dom:dom});
			dom.className += " ice_overlayed";
			return true;
		}else{
			return false;
		}
	};
	console.log("runnning");
	var body = document.body;
	var overlayDiv = document.createElement("div");
	overlayDiv.setAttribute("style", "position:absolute; top:0px; left:0px;");
	overlays = [];
	overlayCanvas(body, 10000);
	body.appendChild(overlayDiv);
	for(var i=0; i<overlays.length; i++){
		!function(){
			var ol = new IceOverlay(
				overlays[i].canvas,
				overlays[i].dom
				);
			ol.init();
			var delay = Math.sqrt(
				Math.pow(ol.top+ol.height/2-CENTER_Y,2)
				+Math.pow(ol.left+ol.width/2-CENTER_X,2)
				)*3;
			setTimeout(function(){
				ol.renderDefault();
			}, delay);
		}();
	}
	var white_overlay = document.createElement("div");
	white_overlay.style.position = "fixed";
	white_overlay.style.background = "white";
	white_overlay.style.width = "100%";
	white_overlay.style.height = "100%";
	white_overlay.style.left = "0px";
	white_overlay.style.top = "0px";
	white_overlay.style.zIndex = "99999999999999999999";
	body.appendChild(white_overlay);
	fade(white_overlay, 10, 35);
};
var CANVAS_WORKSPACE = document.createElement("canvas");
var CTX_WORKSPACE = CANVAS_WORKSPACE.getContext("2d");
var CENTER_X = 0;
var CENTER_Y = 0;
var WIDTH_MAX = 1000;
var HEIGHT_MAX = 1000;
var CANVAS_PADDING_X = 5;
var CANVAS_PADDING_Y = 20;
var TURARA_COLOR_R = 255;
var TURARA_COLOR_G = 0;
var TURARA_COLOR_B = 0;
var TURARA_COLOR_A = 255;
var TURARA_COLOR = "rgba("+TURARA_COLOR_R+","+TURARA_COLOR_G+","+TURARA_COLOR_B+","+(TURARA_COLOR_A/255)+")";
var OUTLINE_COLOR_R = 0;
var OUTLINE_COLOR_G = 0;
var OUTLINE_COLOR_B = 0;
var OUTLINE_COLOR_A = 255;
var OUTLINE_COLOR = "rgba("+OUTLINE_COLOR_R+","+OUTLINE_COLOR_G+","+OUTLINE_COLOR_B+","+(OUTLINE_COLOR_A/255)+")";
var ICE_GRADATION = CTX_WORKSPACE.createLinearGradient(0, 0, WIDTH_MAX, HEIGHT_MAX);
var GRADATION_LOOP = [
	"rgba(235, 230, 255, 0.6)",
	"rgba(230, 230, 255, 0.4)",
	"rgba(180, 180, 230, 0.3)",
	"rgba(220, 220, 220, 0.5)"
];
var ICE_TEXTURE_IMG = document.createElement("img");
var SHIBUKI_TEXTURE_IMG = document.createElement("img");
var init = function(){
	var thres = WIDTH_MAX > HEIGHT_MAX ? WIDTH_MAX : HEIGHT_MAX;
	var freq = 50;
	for(var i=0; i*freq<thres; i++){
		var a = i*freq/thres;
		var color = GRADATION_LOOP[i%GRADATION_LOOP.length];
		ICE_GRADATION.addColorStop(a, color);
	}
	ICE_TEXTURE_IMG.src = frozenJsDomain+"img/ice_texture3.jpg";
	SHIBUKI_TEXTURE_IMG.src = frozenJsDomain+"img/shibuki.gif";
	SHIBUKI_TEXTURE_IMG.style.position = "absolute";
	SHIBUKI_TEXTURE_IMG.style.zIndex = "99999999999999999999999";
	ICE_TEXTURE_IMG.onload = function(){
	  var btn_samuiine = document.createElement("div");
    /*--------------*/
    btn_samuiine.style.position = "fixed";
    btn_samuiine.style.width = "180px";
    btn_samuiine.style.height = "50px";
    btn_samuiine.style.margin = "-25px 0 0 -90px";
    btn_samuiine.style.lineHeight = "50px";
    btn_samuiine.style.left = "50%";
    btn_samuiine.style.top = "50%";
    btn_samuiine.style.zIndex = "99999";
    btn_samuiine.style.backgroundColor = "rgba(98, 189, 255, 0.9)";
    //btn_samuiine.style.backgroundImage = "url("+frozenJsDomain+"img/ice_texture3.jpg)";
    btn_samuiine.style.borderRadius = "30px";
    btn_samuiine.style.color = "#fafafa";
    btn_samuiine.style.cursor = "pointer";
    btn_samuiine.style.fontSize = "26px";
    btn_samuiine.style.textShadow = "0px 0px 3px #004";
    btn_samuiine.style.textAlign = "center";
    btn_samuiine.style.border = "solid 4px rgba(0, 0, 0, 0.2)";
    btn_samuiine.innerHTML = "寒いいね！"
    document.body.appendChild(btn_samuiine);
    /*--------------*/
		document.body.onclick = function(e){
      btn_samuiine.style.display = "none";
			console.log(e);
			CENTER_X = e.pageX;
			CENTER_Y = e.pageY;
			frozenJsMain(document, window);
			document.body.onclick = null;
		};
	};

};
init();
}();

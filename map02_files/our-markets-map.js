// JavaScript Document

		var paper;
		var hSpotTexts = {
			'gc_pacific': 'Group 1',
			'gc_sanfrancisco': 'Group 1',
			'gc_sanjose': 'Group 1',
			'gc_southern': 'Group 1',
			'gc_rockies': 'Group 1',
			'gc_northtexas': 'Group 1',
			'gc_greaterhouston': 'Group 1',
			'gc_missouri': 'Group 2',
			'gc_minneapolis': 'Wide Body',
			'gc_greaterchicago': 'Group 2',
			'gc_greatermichigan': 'Group 2',
			'gc_ohio': 'Group 2',
			'gc_lakeerie': 'Group 2',
			'gc_greateratlanta': 'Group 3',
			'gc_newyorkmetro': 'Group 4',
			'gc_washington': 'Group 3',
			'gc_carolinas': 'Group 3',
			'gc_philadelphia': 'Group 3',
			'gc_florida': 'Group 3',
			'gc_northeast': 'Group 3'
		};

		var rpHover;
		var hoverSet;
		var currHSpotId;
		var coloredDot;

		$(function() {
			jQuery.ajax({
				type: "GET",
				//url: "our-markets-map.svg",
				url: "rojo.svg",
				dataType: "xml",
				success: function(svgXML) {
					var svgTag = svgXML.getElementsByTagName('svg')[0];
					var root = svgXML.getElementsByTagName('svg')[0].getAttribute('viewBox').split(' ');
					var width = root[2], height = root[3];

					paper = ScaleRaphael('board', width, height);
					$('#board').css('width', '100%');
					paper.changeSize($('#board').width(), $('#board').width(), false, true);

					var svg = svgXML.getElementsByTagName('svg')[0];
					paper.importSVG(svg, {
						polygon: {
							'stroke-width': 1,
							'stroke': '#fff'
						},
						path: {
							'stroke-width': 1
						},
						circle: {
							'stroke-width': 1
						},
						text:{
							'text-anchor': 'start'
						}
					});

					$.each($('*[id^="c"]', $('#board')), function(i,v){
						$v = $(v);
						var rpEl = paper.getById($v.attr('id'));
						rpEl.attr('cursor', 'pointer');

						/*
						rpEl.attr({
							'stroke-width': 0,
							'rx': 5.708,
							'ry': 5.708,
							'stroke': '#000',
							'fill': '#fff'
						});
						*/

						//paper.bindEvents(rpEl, 'mouseover,touchstart', function(el){
							if (coloredDot != null){
								paper.getById('insert_place').attr('text', ' ');
								
								if (rpHover){
									rpHover.remove();
									hoverSet.remove();
								}
								/*
								coloredDot.attr({
									'stroke-width': 0,
									'rx': 5.708,
									'ry': 5.708,
									'stroke': '#000',
									'fill': '#fff'
								});*/
							}

							//coloredDot = this;

							hoverSet = paper.set();
							/*
							hoverSet.push(
								paper.circle(parseFloat(coloredDot.attr('cx')), parseFloat(coloredDot.attr('cy')), 7).attr({
									'stroke-width': 4,
									'stroke': '#fff',
									'fill': '#eb8c00'
								}),
								paper.circle(parseFloat(coloredDot.attr('cx')), parseFloat(coloredDot.attr('cy')), 3).attr({
									'stroke-width': 0,
									'fill': '#fff'
								})
							);
							hoverSet.attr('cursor', 'pointer');
							*/
							$.each(hoverSet.items, function(i,v){
								v.id = 'hover_' + coloredDot.id;
							});

							currHSpotId = 'gc_' + this.id.substring(1, this.id.length);
							rpHover = paper.importSVG($.parseXML( $('#' + currHSpotId)[0].innerHTML ),{
								text:{
									'text-anchor': 'start',
									'opacity': 0.0
								},
								polygon: {
									'stroke-width': 1,
									'stroke': '#fff',
									'opacity': 0.0
								},
								rect: {
									'stroke-width': 0
								}
							});
							rpHover.translate(0,-5);
							rpHover.animate({'opacity': 1.0}, 200);
							paper.chrome();

							paper.getById('insert_place').attr('text', hSpotTexts[currHSpotId]);
						//});
					});
					//rpHover.remove();
					//hoverSet.remove();
					paper.getById('insert_place').attr('text', hSpotTexts[currHSpotId]);
					/*
					$('path').mousemove(function(el){
						paper.getById('insert_place').attr('text', ' ');
						if (rpHover){
							rpHover.remove();
							hoverSet.remove();
						}
					});
					*/

					function resizePaper(){
						var win = $(this);
						paper.changeSize($('#board').width(), $('#board').width(), false, true);
					}
					$(window).resize(resizePaper);

					paper.chrome();
					paper.safari();
					paper.renderfix();

					//paper.getById('c14_2').remove();
					if (Raphael.type == "SVG") {
						paper.getById('insert_place').attr({'font-style': 'italic'});
					}
				}
			});
		});

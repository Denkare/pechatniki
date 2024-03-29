define([
    'worker/utils/require-ymaps',
    'utils/geom'
], function(
    requireYmaps,
    geomUtils
) {
	return function(x, y, z, purpose) {
		var global = this,
			cache = global.tilePixelLinesCache,
			cachedLines = global.tilePixelLinesCache.get(x, y, z);

		return new Promise(function(resolve) {
			if(cachedLines) {
				resolve(cachedLines);
				return;
			}

			requireYmaps([
				'projection.wgs84Mercator',
				'graphics.generator.stroke.outline'
			], function(
				projection,
				generator
			) {
				var res = [],
					zoomWidthFactor = getZoomFactor(z);

				var tilePixelLines = getObjectIdsByTile(projection, x, y, z, zoomWidthFactor * global.maxWidth).reduce(function(lines, id) {
					var segmentData = global.data.segments[id],
						segmentUnshiftedCoords = segmentData.map(function(geoPoint) {
							return geoPointToTilePixels(projection, geoPoint, x, y, z);
						});

					var routes = global.actualRoutes[id] || [],
						widths = global.actualWidths,
						colors = global.actualColors,
						segmentOutlines = global.actualSegmentOutlines,
						totalWidth = routes.reduce(function(s, route) {
							return s + (widths[route.replace(/^[-<>]/, '')] || 0);
						}, 0) * zoomWidthFactor,
						curPosition = -totalWidth / 2;

					// Generate segment overall outline
					if(segmentOutlines[id] || purpose == 'hotspots') {
						var opaqueOffsetLeft = 0; 
						routes.some(function(route) {
							if(route.indexOf('-') == -1) {
								return true;
							} else {
								opaqueOffsetLeft += (widths[route.replace(/^-/, '')] || 0);
							}
						});
						opaqueOffsetLeft = opaqueOffsetLeft * zoomWidthFactor;

						var opaqueOffsetRight = 0; 
						routes.slice(0).reverse().some(function(route) {
							if(route.indexOf('-') == -1) {
								return true;
							} else {
								opaqueOffsetRight += (widths[route.replace(/^-/, '')] || 0);
							}
						});
						opaqueOffsetRight = opaqueOffsetRight * zoomWidthFactor;

						var opaqueOffset = (opaqueOffsetLeft - opaqueOffsetRight) / 2;

						var outlinePath = offsetLine(generator, segmentUnshiftedCoords, opaqueOffset);

						segmentOutlines[id] && Object.keys(segmentOutlines[id]).forEach(function(width) {
							var outlineDescription = segmentOutlines[id][width];
							if(!outlineDescription.color) {
								outlineDescription = { color : outlineDescription, offset : 0 };
							}
 							lines.push({
								coords : outlineDescription.offset? offsetLine(generator, segmentUnshiftedCoords, opaqueOffset + outlineDescription.offset * zoomWidthFactor) : outlinePath,
								color : outlineDescription.color,
								data : { id : id },
								width : totalWidth - opaqueOffsetLeft - opaqueOffsetRight + 2 * width * zoomWidthFactor,
								dashStyle : [],
								dashOffset : 0
							});
 						});

 						purpose == 'hotspots' && lines.push({
							coords : outlinePath,
							color : '#000',
							data : { id : id },
							width : totalWidth - opaqueOffsetLeft - opaqueOffsetRight,
							dashStyle : [],
							dashOffset : 0
						});
					}

					// Generate route lines
					(purpose != 'hotspots') && routes.forEach(function(route) {
						var width = widths[route.replace(/^[-<>]/, '')] * zoomWidthFactor || 0,
							direction,
							dashLines = [];

						curPosition += width/2;

						if(width == 0) { return; }

						switch(route[0]) {
							case '-':
								break;

							case '>':
								direction = 1;
							case '<':
								direction = direction || -1;

				                var arrowSteps = Math.max(Math.ceil(width / 2), 2);
           						for(var j = 1; j > 0; j -= 1/arrowSteps) {
           							dashLines.push({
           								width : j * width,
           								dashStyle : [width * (4 - j), width * (j + 0.5)],
           								dashOffset : direction == 1? 0 : -width * j
                    				});
           						}
		
							default:
								if(!dashLines.length) {
									dashLines = [{
										width : width,
										dashStyle : [],
										dashOffset : 0
									}];
								}

								var resPath = offsetLine(generator, segmentUnshiftedCoords, curPosition);

								lines = lines.concat(dashLines.map(function(line) {
									return Object.assign({
										coords : resPath,
										color : colors[route.replace(/^[-<>]/, '')] || '#ccc',
										data : { id : id, route : route.replace(/^[-<>]/, '') }
									}, line);
								}));
						}

						curPosition += width/2;
					});

					return lines;
				}, []);

				cache.set(x, y, z, purpose, tilePixelLines);
				resolve(tilePixelLines);
			});
		});
	};

    function getObjectIdsByTile(projection, x, y, z, margin) {
        var bounds = tileToGeoBounds(projection, x, y, z, margin);
    	return global.tree.search({
            minX : bounds[0][0],
            minY : bounds[0][1],
            maxX : bounds[1][0],
            maxY : bounds[1][1]
        }).map(function(item) {
        	return item.id;
        });
    }

    function offsetLine(generator, sourceCoords, offset) {
		return geomUtils.cut(
			generator.sides(
				sourceCoords,
				Math.abs(offset)
			)[offset > 0? 'leftSide' : 'rightSide'],
			Math.abs(offset),
			Math.abs(offset)
		);
	}
});

var TILE_SIZE = 256;

function getZoomFactor(z) {
	return 1 / (z > 15? 0.5 : (16 - z));
}

function tileToGlobalPixelBounds(x, y, z) {
	var zf = TILE_SIZE;
	return [x * TILE_SIZE, y * TILE_SIZE, (x + 1) * TILE_SIZE, (y + 1) * TILE_SIZE];
}

function geoPointToTilePixels(projection, point, x, y, z) {
	var globalPixelPoint = projection.toGlobalPixels(point.slice().reverse(), z);
	return [globalPixelPoint[0] - (x * TILE_SIZE), globalPixelPoint[1] - (y * TILE_SIZE)];
}

function tileToGeoBounds(projection, x, y, z, margin) {
	margin = margin || 0;
	var globalPixelBounds = tileToGlobalPixelBounds(x, y, z);

	var res = [
		projection.fromGlobalPixels([globalPixelBounds[0] - margin, globalPixelBounds[3] + margin], z).reverse(), 
		projection.fromGlobalPixels([globalPixelBounds[2] + margin, globalPixelBounds[1] - margin], z).reverse()
	];
	return res;
}
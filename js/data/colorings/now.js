define(['data/trolley'], function(trolleyUtils) {
    return {
        getRouteColor : function(route, data, state) {
            if(route.indexOf('Тм') != -1) {
                return '#f84';
            }
            if(route.indexOf('Тб') != -1) {
                return '#1bf';
            }
            return '#528';
        },
        getSegmentOutlines : function(segmentId, data, state, actuals) {
            if(state.selectedRoutes.length == 1) {
                var selectedRoute = state.selectedRoutes[0];

            return trolleyUtils.isSegmentInRoute(segmentId, selectedRoute, actuals.actualRoutes)?
                trolleyUtils.isSegmentTrolleyForRoute(segmentId, selectedRoute, actuals.actualRoutes, data.trolleyWires)?
                    { 10 : '#6f0' } : 
                    { 10 : '#999' } :
                null;
            }
        },
        shouldRecalcColorsOn : ['timeSettings'],
        shouldRecalcOutlinesOn : ['timeSettings', 'selectedRoutes']
    };
});
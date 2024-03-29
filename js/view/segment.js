define([
    'jquery',
], function(
    $
) {

return function(id, routes, colors) {
    return $('<div/>')
        .addClass('segment')
        .attr('segment-id', id)
        .append(
            routes
                .filter(function(route) {
                    return route.indexOf('-') !== 0;
                })
                .map(function(route) {
                    route = route.replace(/^[<>]/, '');

                    var type = route.indexOf('Тб')? route.indexOf('Тм')? 'bus' : 'tram' : 'trolley',
                        routeCleared = route.replace(/^(Тб|Тм) /, ''),
                        div = $('<div/>').addClass(type).css('backgroundColor', colors[route]).html(routeCleared);

                    return div;
                }, this)
        )
        /*.append($('<div/>')
            .addClass('segment-button select-segment-routes')
            .html('Показать эти маршруты')
        )*/
        [0];
};

});
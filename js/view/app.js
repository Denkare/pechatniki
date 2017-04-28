define([
    'ymaps',
    'jquery',
    'utils/extend',
    'view/route',
    'vow',
    'utils/date',
    'utils/events-emitter'
], function(
    ymaps,
    $,
    extend,
    routeView,
    vow,
    dateUtils,
    eventsEmitter
) {

var AppView = function(map, dataManager, stateManager, worker) {
    this._map = map;
    this._stateManager = stateManager;
    this._dataManager = dataManager;
    this._worker = worker;

    this._init();
};

extend(AppView.prototype, eventsEmitter);

extend(AppView.prototype, {
    _init : function() {
        this._createTopPane();
        this._createControls();
        
        $(document)
            //.on('click', '.segment .save-segment', this._onSaveSegment.bind(this))
            //.on('click', '.segment .select-segment-routes', this._onSelectSegmentRoutes.bind(this))
            //.on('click', '.segment .reverse-segment', this._onReverseSegment.bind(this))
            //.on('click', '.segment .edit-segment-geometry', this._onEditSegmentGeometry.bind(this))
            .on('click', '.segment .bus, .segment .trolley, .segment .tram', this._onSelectRoute.bind(this))
            .on('mouseover', '.segment .bus, .segment .trolley, .segment .tram', this._onRouteMouseOver.bind(this))
            .on('mouseout', '.segment .bus, .segment .trolley, .segment .tram', this._onRouteMouseOut.bind(this))
            .on('click', '.route-card .close', this._onDeselectRoute.bind(this))
            .on('click', '.mayor-option', this._onChangeColoring.bind(this))

            //.on('click', '.deselect-all', this._onDeselectAllRoutes.bind(this));

        this._map
            .on('highlight-routes', this._onRoutesHighlightedOnMap, this)
            .on('unhighlight-routes', this._onRoutesUnhighlightedOnMap, this);


        this._worker
            .on('busy', this._onWorkerBusy, this)
            .on('ready', this._onWorkerReady, this);
    },

    _createTopPane : function() {
        var yMap = this._map.getMap();

        this._topPane = $('<div class="top-pane"><h1>Сколько троллейбусов должно быть в Москве?</h1></div>');
        yMap.panes.append('top-pane', new ymaps.pane.StaticPane(yMap, {
            css : {
                left: 0,
                right: 0
            },
            zIndex : 203
        }));
        yMap.panes.get('top-pane').getElement().appendChild(this._topPane[0]);

        vow.all([
            this._dataManager.getWholeTrollNumber(),
            this._dataManager.getWholeBusNumber(),
            this._dataManager.getEcoBusNumber(),
        ]).spread(function(trolls, buses, ecobuses) {
            $('.counter-temp').remove();
            $('.counters').append([
                $('<span/>').addClass('counter-sobyanin').append([
                    $('<div/>').addClass('counter trolley').html(0),
                    $('<div/>').addClass('counter bus').html(trolls + buses)
                ]),
                $('<span/>').addClass('counter-now').append([
                    $('<div/>').addClass('counter trolley').html(trolls),
                    $('<div/>').addClass('counter bus').html(buses)
                ]),
                $('<span/>').addClass('counter-katz').append([
                    $('<div/>').addClass('counter trolley').html(trolls + ecobuses),
                    $('<div/>').addClass('counter bus').html(buses - ecobuses)
                ])
            ]);
        });


    },
    
    _createControls : function() {
        var timeSettings = this._stateManager.getTimeSettings();

        this._selectedRouteViews = {};          
    
        /*this._createListControl(
            ({ 6 : 'суббота', 0 : 'воскресенье' })[(new Date()).getDay()] || 'будни',
            {
                float : 'right'
            },
            {
                1 : 'будни',
                32 : 'суббота',
                64 : 'воскресенье'
            }, function(val) {
                this.trigger('time-settings-updated', { dow : +val });
            },
            this
        );

        this._createListControl((new Date()).getHours() + ':00', {
            position : {
                top : 45,
                right : 90
            }
        }, Array.apply([], Array(24)).reduce(function(res, _, i) {
            res[i + 4] = (i + 4) % 24 + ':00';
            return res;
        }, {}), function(val) {
            this.trigger('time-settings-updated', { fromHour : +val });
        }, this);

        this._createListControl(((new Date()).getHours() + 1) + ':00', {
            position : {
                top : 45,
                right : 10
            }
        }, Array.apply([], Array(24)).reduce(function(res, _, i) {
            res[i + 4] = (i + 5) % 24 + ':00';
            return res;
        }, {}), function(val) {
            this.trigger('time-settings-updated', { toHour : +val });
        }, this);

        this._createListControl('x1', {
            position : {
                top : 80,
                right : 10
            }
        }, {
            "0.25" : 'x0.25',
            "0.5" : 'x0.5',
            "1" : 'x1',
            "2" : 'x2',
            "3" : 'x3',
            "5" : 'x5'
        },
        function(val) {
            this.trigger('width-factor-updated', +val);
        }, this);

        var colorings = {
            "" : 'обычная',
            "vendor" : 'по перевозчику',
            "type" : 'по типу',
            "black" : 'все чёрные'
        }

        this._createListControl(colorings[this._stateManager.getCustomColoringId() || ''] || this._stateManager.getCustomColoringId(), {
            position : {
                top : 150,
                right : 10
            }
        }, colorings,
        function(val) {
            this.trigger('coloring-updated', val);
        }, this);
        
        var _this = this;
        
        $('#dateForm').find('input')
        .val((new Date()).toISOString().substr(0, 10))
        .change(function() {
            if(this.value) {
                _this.trigger('time-settings-updated', { date : +new Date(this.value) });
            }
        });*/

        this.updateSelectedRoutes();
    },

    /*_createListControl : function(content, options, items, onItemSelected, ctx) {
        var control = new ymaps.control.ListBox({
                data: {
                    content: content
                },
                items: Object.keys(items).map(function(itemKey) {
                    return new ymaps.control.ListBoxItem(items[itemKey]);
                })
            }),
            createEventListener = function(i) {
                return function() {
                    Object.keys(items).forEach(function(itemKey, j) {
                        if(j != i) {
                            control.get(j).deselect();
                        }
                    });
                    control.data.set('content', items[Object.keys(items)[i]]);
                    onItemSelected.call(ctx || this, Object.keys(items)[i]);
                };
            };
        Object.keys(items).forEach(function(itemKey, i) {
            control.get(i).events.add('click', createEventListener(i));
        });
        this._map.getMap().controls.add(control, options);
    },*/
    
    /*_onSaveSegment : function(e) {
        if(!this._stateManager.isAdminMode()) return;

        var segment = $(e.target).parent('.segment'),
            id = segment.attr('segment-id'),
            yesterday = segment.find('.routes-editor.yesterday').text(),
            today = segment.find('.routes-editor.today').text(),
            allRoutes = JSON.parse(decodeURIComponent(segment.attr('all-routes-json-encoded'))),

            yesterdayRoutes = unjoinRoutes(yesterday),
            todayRoutes = unjoinRoutes(today),

            todayDate = this._stateManager.getTimeSettings().date,
            todayKey = new Date(todayDate).toISOString().substr(0, 10),
            yesterdayKey = dateUtils.findNearestDate(Object.keys(allRoutes), todayDate, true)

        if(todayKey in allRoutes && JSON.stringify(yesterdayRoutes) == JSON.stringify(todayRoutes)) {
            delete allRoutes[todayKey];
        }

        if(!(todayKey in allRoutes) && JSON.stringify(yesterdayRoutes) != JSON.stringify(todayRoutes)) {
            allRoutes[todayKey] = {};
        }

        (yesterdayKey in allRoutes) && (allRoutes[yesterdayKey] = yesterdayRoutes);
        (todayKey in allRoutes) && (allRoutes[todayKey] = todayRoutes);

        segment.attr('all-routes-json-encoded', encodeURIComponent(JSON.stringify(allRoutes)));
        this.trigger('save-segment', { id : id, routes : allRoutes });
    }, */

    /*_onReverseSegment : function(e) {
        if(!this._stateManager.isAdminMode()) return;
        this.trigger('reverse-segment', $(e.target).parent('.segment').attr('segment-id'));
    }, 
    
    _onEditSegmentGeometry : function(e) {
        if(!this._stateManager.isAdminMode()) return;
        this.trigger('edit-segment-geometry', $(e.target).parent('.segment').attr('segment-id'));
    },*/

    /*_onSelectSegmentRoutes : function(e) {
        this.trigger('select-segment-routes', $(e.target).parent('.segment').attr('segment-id'));
    },*/ 

    _routeElemToRouteId : function(elem) {
        var elem = $(elem);
            routeNumber = elem.text(),
            routeType = elem.hasClass('trolley')? 'trolley': elem.hasClass('tram')? 'tram' : 'bus';

        return { trolley: 'Тб ', bus: '', tram : 'Тм ' }[routeType] + routeNumber;
    },
    
    _onSelectRoute : function(e) {
        this.trigger('route-selected', this._routeElemToRouteId(e.target));
    },

    _onRouteMouseOver : function(e) {
        this._map.highlightRoutes([this._routeElemToRouteId(e.target)]);
    },

    _onRouteMouseOut : function(e) {
        this._map.unhighlightRoutes();
    },

    _onRoutesHighlightedOnMap : function(e, data) {
        if(!data.routes || !data.routes.length) { 
            return;
        }

        var elementsToHighLight = $('.segment .bus, .segment .trolley, .segment .tram'); 

        data.routes.forEach(function(route) { 
            var type = route.indexOf('Тб')? route.indexOf('Тм')? 'bus' : 'tram' : 'trolley',
                routeCleared = route.replace(/^(Тб|Тм) /, '');

            elementsToHighLight = elementsToHighLight.not($('.segment').find('.' + type).filter(function(_, el) {
                return el.textContent == routeCleared;
            }));
        });

        elementsToHighLight.addClass('dimmed');
    },

    _onRoutesUnhighlightedOnMap : function(e) {
        $('.segment .dimmed').removeClass('dimmed');
    },

    /*_onDeselectRoute : function(e) {
        var target = $(e.target).closest('.current-route');
            routeNumber = target.text(),
            routeTypeElem = target.find('.bus,.tram,.trolley')[0],
            routeType = routeTypeElem && routeTypeElem.className,
            route = { trolley: 'Тб ', bus: '', tram : 'Тм ' }[routeType] + routeNumber;

        routeType && this.trigger('routes-deselected', { routes : [route] });
    },*/

    _onDeselectRoute : function(e) {
        this.trigger('route-deselected');
    },

    _createSelectedRouteView : function(route) {
        return routeView(route, this._dataManager).appendTo('.sidebar');

        /*var type = route.indexOf('Тб')? route.indexOf('Тм')? 'bus' : 'tram' : 'trolley',
            routeCleared = route.replace(/^(Тб|Тм) /, ''),
            view = $('<div/>')
                .addClass('current-route')
                .append($('<div/>')
                    .addClass(type)
                    .css('background-color', 'inherit')
                    .html(routeCleared)
                )
                .appendTo('.current-routes');

        this._dataManager.getBusColor(route).done(function(color) { 
            view.css('background-color', color);
        });*/

        //return view;
    },

    updateSelectedRoutes : function() {
        this._map.closeBalloon();
        var selectedRoutes = this._stateManager.getSelectedRoutes();
        Object.keys(this._selectedRouteViews).forEach(function(route) {
            //if(selectedRoutes.indexOf(route) == -1) {
                this._selectedRouteViews[route].remove();
                delete this._selectedRouteViews[route];
            //}
        }, this);
        selectedRoutes.forEach(function(route) {
            if(!this._selectedRouteViews[route]) {
                this._selectedRouteViews[route] = this._createSelectedRouteView(route);
            }
        }, this)
    },

    refreshColors : function() {
        /*var dataManager = this._dataManager,
            selectedRouteViews = this._selectedRouteViews;

        Object.keys(selectedRouteViews).forEach(function(route) {
            dataManager.getBusColor(route).then(function(color) {
                selectedRouteViews[route].css('background-color', color);
            });
        });*/
        this.updateSelectedRoutes();
    },

    _onChangeColoring : function(e) {
        var option = e.target,
            newColoring = e.target.className.split(' ')[1];

        $('body').removeClass('sobyanin katz now').addClass(newColoring);
        $('#spinner').addClass('visible');

        setTimeout(function() {
            this._stateManager.setCustomColoringId(newColoring);
        }.bind(this), 200);
    },

    _onWorkerReady : function(e) {
        $('#spinner').removeClass('visible');
    },

    _onWorkerBusy : function(e) {
        $('#spinner').addClass('visible');
    }
});

function unjoinRoutes(routes) {
    var re = /([-<>]?)((?:Тм |Тб |)(?:[А-я-0-9]+))/g, 
        m = true,
        res = [];
    while(m) {
        m = re.exec(routes);
        m && res.push(m[0]);
    }
    return res;
}

return AppView;

});
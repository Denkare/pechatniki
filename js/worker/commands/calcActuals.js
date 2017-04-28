define([
    'data/calc-actuals'
], function(
    calcActuals
) {
    return function(params) {
        postMessage({ state : 'busy' });

        var state = params.state,
            oldState = this.state,
            data = this.data,
            changedStateFields = Object.keys(state).reduce(function(changeds, propId) {
                if(JSON.stringify(oldState[propId]) != JSON.stringify(state[propId])) {
                    changeds.push(propId);
                }
                return changeds;
            }, []);

        return calcActuals(
            data,
            state,
            changedStateFields, 
            {
                actualRoutes : this.actualRoutes,
                actualWidths : this.actualWidths,
                actualColors : this.actualColors,
                actualSegmentOutlines : this.actualSegmentOutlines
            }
        );
    };
});

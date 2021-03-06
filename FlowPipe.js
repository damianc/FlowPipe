class FlowingValue {
    constructor (val) {
        this.get = function () {
            return val;
        };

        return new Proxy(this, {
            get (target, property, receiver) {
                if (property == 'pipe') {
                    flow.$ = val;

                    return function (input, ...args) {
                        var res;
                        var lastArg = args[args.length-1];
                        var returnOrig = false, returnBoth = false;
                        if (lastArg === flow.$orig) {
                            returnOrig = true;
                        } else if (lastArg === flow.$both) {
                            returnBoth = true;
                        }

                        function isFunctionCallSpec(obj) {
                            var propNum = Object.keys(obj).length;
                            var doesMatchSpec = (
                                (propNum == 2 && (!!obj.this || obj.this === null) && !!obj.args) ||
                                (propNum == 1 && ((!!obj.this || obj.this === null) || !!obj.args))
                            );

                            return doesMatchSpec;
                        }

                        if (typeof input == 'function') {
                            let ndArg;
                            if ((ndArg = args[0]) && typeof ndArg == 'object' && isFunctionCallSpec(ndArg)) {
                                let callThisRef = ndArg.this || null;
                                let callArgs = ndArg.args || [];
                                res = input.apply(callThisRef, callArgs);
                            } else {
                                res = input(val, ...args);
                            }
                        } else {
                            res = input;
                        }

                        var newFlowing = res;
                        if (returnOrig) newFlowing = val;
                        if (returnBoth) newFlowing = [res, val];
                        return new FlowingValue(newFlowing);
                    };
                }

                return Reflect.get(target, property, receiver);
            }
        });
    }
}

function flow(val) {
    return new FlowingValue(val);
}

flow.$ = undefined;
flow.$orig = Symbol('FlowReturnOrigValue');
flow.$both = Symbol('FlowReturnBothValues');

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var util = require("afpl/lib/util");
var polate = require("@quenk/polate");
/**
 * Failure means a precondition did not go so well.
 */
var Failure = /** @class */ (function () {
    function Failure(message, value, context) {
        if (context === void 0) { context = {}; }
        this.message = message;
        this.value = value;
        this.context = context;
    }
    Failure.prototype.explain = function (templates, c) {
        if (templates === void 0) { templates = {}; }
        if (c === void 0) { c = {}; }
        var combined = (typeof c['$key'] === 'string') ?
            c.$key + "." + this.message :
            this.message;
        var key = c.$key;
        var $value = this.value;
        //@todo: fix stairway to hell
        return polate.polate(((templates[combined]) ?
            templates[combined] :
            (templates[key]) ?
                templates[key] :
                (templates[this.message.split('.')[0]]) ?
                    templates[this.message.split('.')[0]] :
                    (templates[this.message]) ?
                        templates[this.message] :
                        this.message), util.merge(this.context, c, { $value: $value }));
    };
    return Failure;
}());
exports.Failure = Failure;
//# sourceMappingURL=Failure.js.map
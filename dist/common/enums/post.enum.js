"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactionEnum = exports.AvailabilityEnum = void 0;
var AvailabilityEnum;
(function (AvailabilityEnum) {
    AvailabilityEnum[AvailabilityEnum["PUBLIC"] = 0] = "PUBLIC";
    AvailabilityEnum[AvailabilityEnum["FRIENDS"] = 1] = "FRIENDS";
    AvailabilityEnum[AvailabilityEnum["ONLY_ME"] = 2] = "ONLY_ME";
})(AvailabilityEnum || (exports.AvailabilityEnum = AvailabilityEnum = {}));
var ReactionEnum;
(function (ReactionEnum) {
    ReactionEnum["LIKE"] = "LIKE";
    ReactionEnum["LOVE"] = "LOVE";
    ReactionEnum["HAHA"] = "HAHA";
    ReactionEnum["WOW"] = "WOW";
    ReactionEnum["SAD"] = "SAD";
    ReactionEnum["ANGRY"] = "ANGRY";
})(ReactionEnum || (exports.ReactionEnum = ReactionEnum = {}));

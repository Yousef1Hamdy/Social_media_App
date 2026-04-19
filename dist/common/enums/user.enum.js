"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudienceEnum = exports.LogoutEnum = exports.TokenTypeEnum = exports.ProviderEnum = exports.RoleEnum = exports.GenderEnum = void 0;
var GenderEnum;
(function (GenderEnum) {
    GenderEnum[GenderEnum["MALE"] = 0] = "MALE";
    GenderEnum[GenderEnum["FEMALE"] = 1] = "FEMALE";
})(GenderEnum || (exports.GenderEnum = GenderEnum = {}));
var RoleEnum;
(function (RoleEnum) {
    RoleEnum[RoleEnum["USER"] = 0] = "USER";
    RoleEnum[RoleEnum["ADMIN"] = 1] = "ADMIN";
})(RoleEnum || (exports.RoleEnum = RoleEnum = {}));
var ProviderEnum;
(function (ProviderEnum) {
    ProviderEnum[ProviderEnum["System"] = 0] = "System";
    ProviderEnum[ProviderEnum["Google"] = 1] = "Google";
})(ProviderEnum || (exports.ProviderEnum = ProviderEnum = {}));
var TokenTypeEnum;
(function (TokenTypeEnum) {
    TokenTypeEnum[TokenTypeEnum["access"] = 0] = "access";
    TokenTypeEnum[TokenTypeEnum["refresh"] = 1] = "refresh";
})(TokenTypeEnum || (exports.TokenTypeEnum = TokenTypeEnum = {}));
var LogoutEnum;
(function (LogoutEnum) {
    LogoutEnum[LogoutEnum["All"] = 0] = "All";
    LogoutEnum[LogoutEnum["Only"] = 1] = "Only";
})(LogoutEnum || (exports.LogoutEnum = LogoutEnum = {}));
var AudienceEnum;
(function (AudienceEnum) {
    AudienceEnum[AudienceEnum["System"] = 0] = "System";
    AudienceEnum[AudienceEnum["User"] = 1] = "User";
})(AudienceEnum || (exports.AudienceEnum = AudienceEnum = {}));
;

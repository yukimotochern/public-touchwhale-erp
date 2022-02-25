"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var ErrorResponse = /** @class */ (function (_super) {
    __extends(ErrorResponse, _super);
    function ErrorResponse(msg, statusCode, errorData, messageArray) {
        if (msg === void 0) { msg = 'Unspecified Error Message'; }
        if (statusCode === void 0) { statusCode = 500; }
        var _this = _super.call(this, msg) || this;
        _this.statusCode = statusCode;
        _this.errorData = errorData;
        _this.messageArray = messageArray;
        _this.name = 'CustomError';
        return _this;
        // Object.setPrototypeOf(this, ErrorResponse.prototype)
    }
    return ErrorResponse;
}(Error));
exports.default = ErrorResponse;
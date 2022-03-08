"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Models
var twItemModel_1 = require("../features/twItem/twItemModel");
var twItemModel_2 = require("../features/twItem/twItemModel");
// Util module
var errorResponse_1 = __importDefault(require("../utils/errorResponse"));
// itemOwnerMiddleware will make sure that the accessing user owns that particular resource.
// If the access right is proved, it will set 'res.item' and 'res.itemElement'.
// The latter, 'res.itemElement', will be set only if 'res.item' represents a set.
// res.item => is one of TwItem document
// res.itemElement => is one of TwItemSetDetail document
var itemOwnerMiddleware = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var itemId, populate, query, item, itemSetElement;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (!((_a = req.userJWT) === null || _a === void 0 ? void 0 : _a.id)) return [3 /*break*/, 4];
                itemId = req.params.id;
                populate = req.query.populate;
                query = twItemModel_1.TwItem.findById(itemId);
                if (populate) {
                    query = query.populate('setOfElement', 'element');
                }
                return [4 /*yield*/, query
                    // Ensure that item must exist and user have ownership with this item
                ];
            case 1:
                item = _b.sent();
                // Ensure that item must exist and user have ownership with this item
                if (!item || item.user.toString() !== req.userJWT.id) {
                    return [2 /*return*/, next(new errorResponse_1.default('Item not found', 404))];
                }
                if (!(item.item_type === 'set')) return [3 /*break*/, 3];
                return [4 /*yield*/, twItemModel_2.TwItemSetDetail.findOne({
                        parentItem: item.id,
                    })];
            case 2:
                itemSetElement = _b.sent();
                if (itemSetElement) {
                    res.itemSetElement = itemSetElement;
                }
                _b.label = 3;
            case 3:
                res.item = item;
                next();
                return [3 /*break*/, 5];
            case 4: return [2 /*return*/, next(new errorResponse_1.default('Server Error', 500))];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.default = itemOwnerMiddleware;
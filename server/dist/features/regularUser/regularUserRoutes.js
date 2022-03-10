"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var passport_1 = __importDefault(require("passport"));
var regularUserController_1 = require("./regularUserController");
// Middleware
var authMiddleware_1 = __importDefault(require("../../middlewares/authMiddleware"));
var errorCatcher_1 = __importDefault(require("../../middlewares/errorCatcher"));
var router = express_1.default.Router();
router.route('/signUp').post((0, errorCatcher_1.default)(regularUserController_1.regularUserSignUp));
router.route('/signUp/verify').post((0, errorCatcher_1.default)(regularUserController_1.regularUserVerify)); // Use signIn to implement new user verification
router
    .route('/signUp/setPassword')
    .post(authMiddleware_1.default, (0, errorCatcher_1.default)(regularUserController_1.changePassword)); // Use changePassword to implement new user setPassword
router
    .route('/googleOAuth')
    .get(passport_1.default.authenticate('google', { scope: ['profile', 'email'] }));
router.route('/googleOAuth/callback').get(passport_1.default.authenticate('google', {
    failureRedirect: process.env.NODE_ENV === 'production'
        ? '/signIn'
        : "".concat(process.env.FRONTEND_DEV_URL, "signIN"),
}), //failureRedirect need to be changed
(0, errorCatcher_1.default)(regularUserController_1.OAuthCallback));
router.route('/signIn').post((0, errorCatcher_1.default)(regularUserController_1.regularUserSignIn));
router.route('/signOut').get(authMiddleware_1.default, (0, errorCatcher_1.default)(regularUserController_1.regularUserSignOut));
router
    .route('/')
    .get(authMiddleware_1.default, (0, errorCatcher_1.default)(regularUserController_1.getRegularUser))
    .put(authMiddleware_1.default, (0, errorCatcher_1.default)(regularUserController_1.updateRegularUser));
router
    .route('/avatar')
    .get(authMiddleware_1.default, (0, errorCatcher_1.default)(regularUserController_1.getAvatarUploadUrl))
    .delete(authMiddleware_1.default, (0, errorCatcher_1.default)(regularUserController_1.deleteAvatar));
router
    .route('/changePassword')
    .put(authMiddleware_1.default, (0, errorCatcher_1.default)(regularUserController_1.changePassword));
router.route('/forgetPassword').post((0, errorCatcher_1.default)(regularUserController_1.forgetPassword));
router.route('/forgetPassword/:resetToken').put((0, errorCatcher_1.default)(regularUserController_1.resetPassword));
exports.default = router;

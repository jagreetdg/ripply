/**
 * Auth Controllers Index
 *
 * Central export point for all authentication related controllers
 */

const authController = require("./authController");
const universalOAuthController = require("./universalOAuthController");

module.exports = {
	authController,
	universalOAuthController,
};

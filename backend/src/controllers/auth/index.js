/**
 * Auth Controllers Index
 *
 * Central export point for all authentication related controllers
 */

const authController = require("./authController");
const socialAuthController = require("./socialAuthController");

module.exports = {
	authController,
	socialAuthController,
};

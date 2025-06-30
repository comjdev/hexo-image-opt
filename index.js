"use strict";
/* global hexo */

// Only run in production mode (when hexo generate is called)
// Skip in development mode (when hexo server is called)
if (process.argv.includes("server") || process.argv.includes("--draft")) {
	console.log(
		"[hexo-image-opt] Skipping in development mode - only runs in production",
	);
	return;
}

// Import modular components
const Config = require("./lib/config");
const Logger = require("./lib/logger");
const ImageProcessor = require("./lib/image-processor");
const HtmlProcessor = require("./lib/html-processor");
const Hooks = require("./lib/hooks");

/**
 * Hexo Image Optimization Plugin
 * Automatically optimizes images during the build process
 */
class HexoImageOpt {
	constructor(hexo) {
		this.hexo = hexo;

		// Initialize components
		this.config = new Config(hexo).getConfig();
		this.logger = new Logger(hexo, this.config);
		this.imageProcessor = new ImageProcessor(this.config, this.logger);
		this.htmlProcessor = new HtmlProcessor(this.config, this.logger);
		this.hooks = new Hooks(
			hexo,
			this.imageProcessor,
			this.htmlProcessor,
			this.logger,
		);

		this.logger.info("Plugin constructor called");
	}

	/**
	 * Initialize the plugin
	 */
	init() {
		this.logger.info("Plugin init() called");

		if (!this.config.enable) {
			this.logger.info("Plugin disabled in configuration");
			return;
		}

		// Register all hooks
		this.hooks.register();
	}
}

// Check if hexo is available before initializing
if (typeof hexo !== "undefined") {
	try {
		const plugin = new HexoImageOpt(hexo);
		plugin.init();
	} catch (error) {
		console.error(
			"[hexo-image-opt] Plugin initialization failed:",
			error.message,
		);
	}
} else {
	console.error("[hexo-image-opt] Hexo object not available");
}

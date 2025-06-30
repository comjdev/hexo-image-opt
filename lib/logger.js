"use strict";

/**
 * Logging utility for Hexo Image Optimization Plugin
 */
class Logger {
	constructor(hexo, config) {
		this.hexo = hexo;
		this.config = config;
	}

	/**
	 * Log a message with the specified level
	 */
	log(message, level = "info") {
		// Check if hexo and hexo.log are available
		if (!this.hexo || !this.hexo.log) {
			console.log(`[hexo-image-opt] ${message}`);
			return;
		}

		// Check if config is available and has verbose setting
		const shouldLog = (this.config && this.config.verbose) || level === "error";

		if (shouldLog) {
			const prefix = "[hexo-image-opt]";
			switch (level) {
				case "error":
					this.hexo.log.error(`${prefix} ${message}`);
					break;
				case "warn":
					this.hexo.log.warn(`${prefix} ${message}`);
					break;
				default:
					this.hexo.log.info(`${prefix} ${message}`);
			}
		}
	}

	/**
	 * Log info message
	 */
	info(message) {
		this.log(message, "info");
	}

	/**
	 * Log warning message
	 */
	warn(message) {
		this.log(message, "warn");
	}

	/**
	 * Log error message
	 */
	error(message) {
		this.log(message, "error");
	}
}

module.exports = Logger;

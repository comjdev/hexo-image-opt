"use strict";

/**
 * Configuration management for Hexo Image Optimization Plugin
 */
class Config {
	constructor(hexo) {
		this.hexo = hexo;
	}

	/**
	 * Get plugin configuration with defaults
	 */
	getConfig() {
		const defaultConfig = {
			enable: true,
			quality: 80,
			formats: ["webp", "jpeg"],
			sizes: [800, 1280, 1920],
			sourceDirs: ["source"],
			skipExisting: true,
			verbose: false,
			replaceImgTags: true,
		};

		// Check if hexo.config exists and has image_opt
		const userConfig =
			this.hexo.config && this.hexo.config.image_opt
				? this.hexo.config.image_opt
				: {};
		const config = { ...defaultConfig, ...userConfig };

		// Add theme images directory if theme is configured
		if (this.hexo.config && this.hexo.config.theme) {
			const themeImagesDir = `themes/${this.hexo.config.theme}/source`;
			if (!config.sourceDirs.includes(themeImagesDir)) {
				config.sourceDirs.push(themeImagesDir);
			}
		}

		return config;
	}
}

module.exports = Config;

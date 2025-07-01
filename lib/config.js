"use strict";

/**
 * Configuration manager for hexo-image-opt plugin
 */
class Config {
	constructor(hexo) {
		this.hexo = hexo;
		this.optimizedImages = new Set();
	}

	/**
	 * Get plugin configuration with defaults
	 */
	getConfig() {
		const defaultConfig = {
			enable: true,
			sizes: [800, 1280, 1920],
			formats: ["webp", "jpeg"],
			quality: 80,
			skipExisting: true,
			optimizedImages: this.optimizedImages,
		};

		const userConfig = this.hexo.config.hexo_image_opt || {};
		const mergedConfig = { ...defaultConfig, ...userConfig };

		return mergedConfig;
	}

	/**
	 * Check if the plugin is enabled
	 */
	isEnabled() {
		const config = this.getConfig();
		return config.enable === true;
	}

	/**
	 * Add an optimized image to the tracking set
	 */
	addOptimizedImage(imagePath) {
		this.optimizedImages.add(imagePath);
	}
}

// Singleton instance
let sharedConfigInstance = null;

function getSharedConfigInstance(hexo) {
	if (!sharedConfigInstance) {
		sharedConfigInstance = new Config(hexo);
	} else if (hexo && !sharedConfigInstance.hexo) {
		// Update hexo instance if not already set
		sharedConfigInstance.hexo = hexo;
	}
	return sharedConfigInstance;
}

module.exports = getSharedConfigInstance;

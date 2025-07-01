"use strict";

const ImageProcessor = require("./image-processor");

/**
 * Main generator for hexo-image-opt plugin
 */
class ImageOptGenerator {
	constructor(hexo, configInstance) {
		this.hexo = hexo;
		this.configInstance = configInstance;
		this.config = this.configInstance.getConfig();
		this.imageProcessor = new ImageProcessor(hexo);
	}

	/**
	 * Main generator function
	 */
	async generate() {
		try {
			// Process all images and return them directly as Hexo output files
			const outputs = await this.imageProcessor.processAllImages();
			return outputs.map(({ path, data }) => {
				let publicPath = path;
				if (publicPath.startsWith("_posts/")) {
					publicPath = publicPath.replace(/^_posts\//, "");
				}
				return {
					path: publicPath,
					data: () => data,
				};
			});
		} catch (error) {
			return [];
		}
	}
}

module.exports = ImageOptGenerator;

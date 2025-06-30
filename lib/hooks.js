"use strict";

/**
 * Hexo filter hooks for Image Optimization Plugin
 */
class Hooks {
	constructor(hexo, imageGenerator, htmlProcessor, logger) {
		this.hexo = hexo;
		this.imageGenerator = imageGenerator;
		this.htmlProcessor = htmlProcessor;
		this.logger = logger;
	}

	/**
	 * Register all hooks
	 */
	register() {
		// Register the image generator
		this.hexo.extend.generator.register(
			"image-opt",
			this.generateImages.bind(this),
		);

		// Hook into HTML rendering to replace img tags
		this.hexo.extend.filter.register(
			"after_render:html",
			this.afterRenderHtml.bind(this),
		);

		// Hook into the development server process
		this.hexo.extend.filter.register(
			"after_post_render",
			this.afterPostRender.bind(this),
		);

		// Hook into page rendering for development mode
		this.hexo.extend.filter.register(
			"after_render",
			this.afterRender.bind(this),
		);

		this.logger.info("Hexo Image Optimization Plugin hooks registered");
	}

	/**
	 * Image generator - generates optimized images for public folder
	 */
	async generateImages(locals) {
		this.logger.info("Image generator called!");
		try {
			const outputs = await this.imageGenerator.generate();
			this.logger.info(
				`Generated ${outputs.length} optimized images for public folder`,
			);
			return outputs;
		} catch (error) {
			this.logger.error(`Error in image generator: ${error.message}`);
			return [];
		}
	}

	/**
	 * After HTML render hook - for processing HTML content
	 */
	async afterRenderHtml(str, data) {
		if (!this.imageGenerator.config.replaceImgTags) {
			return str;
		}

		try {
			this.logger.info(`Processing HTML content for ${data.path || "unknown"}`);
			const processedContent = await this.htmlProcessor.replaceImgTagsInContent(
				str,
			);
			return processedContent;
		} catch (error) {
			this.logger.error(`Error in after_render:html: ${error.message}`);
			return str;
		}
	}

	/**
	 * After post render hook (for all content types)
	 */
	async afterPostRender(data) {
		if (!this.imageGenerator.config.replaceImgTags) {
			return data;
		}

		try {
			// Replace img tags in the content
			if (data.content && typeof data.content === "string") {
				this.logger.info(
					`Processing content for ${data.path || "unknown"} (type: ${
						data.layout || "unknown"
					})`,
				);
				data.content = await this.htmlProcessor.replaceImgTagsInContent(
					data.content,
				);
			}

			return data;
		} catch (error) {
			this.logger.error(`Error in after_post_render: ${error.message}`);
			return data;
		}
	}

	/**
	 * After render hook (for both development and production)
	 */
	async afterRender(data) {
		if (!this.imageGenerator.config.replaceImgTags) {
			return data;
		}

		try {
			// Replace img tags in the rendered content
			if (data.content && typeof data.content === "string") {
				// Only process HTML content
				if (
					data.content.includes("<html") ||
					data.content.includes("<!DOCTYPE html")
				) {
					this.logger.info(
						`Processing HTML content for ${data.path || "unknown"}`,
					);
					data.content = await this.htmlProcessor.replaceImgTagsInContent(
						data.content,
					);
				}
			}

			return data;
		} catch (error) {
			this.logger.error(`Error in after_render: ${error.message}`);
			return data;
		}
	}
}

module.exports = Hooks;

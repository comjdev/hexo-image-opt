"use strict";

/**
 * Hexo filter hooks for Image Optimization Plugin
 */
class Hooks {
	constructor(hexo, imageProcessor, htmlProcessor, logger) {
		this.hexo = hexo;
		this.imageProcessor = imageProcessor;
		this.htmlProcessor = htmlProcessor;
		this.logger = logger;
	}

	/**
	 * Register all hooks
	 */
	register() {
		// Hook into the generation process for image optimization
		this.hexo.extend.filter.register(
			"after_generate",
			this.afterGenerate.bind(this),
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
	 * After HTML render hook - for processing HTML content
	 */
	async afterRenderHtml(str, data) {
		if (!this.imageProcessor.config.replaceImgTags) {
			return str;
		}

		try {
			// Process images if not already done
			if (!this.imageProcessor.hasProcessedImages()) {
				await this.imageProcessor.processImages();
			}

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
	 * After generation hook - for image optimization only
	 */
	async afterGenerate() {
		this.logger.info("after_generate hook called!");
		try {
			await this.imageProcessor.processImages();
			this.logger.info(
				`Processed ${this.imageProcessor.getProcessedCount()} images`,
			);
		} catch (error) {
			this.logger.error(`Error in after_generate: ${error.message}`);
		}
	}

	/**
	 * After post render hook (for all content types)
	 */
	async afterPostRender(data) {
		if (!this.imageProcessor.config.replaceImgTags) {
			return data;
		}

		try {
			// Process images if not already done
			if (!this.imageProcessor.hasProcessedImages()) {
				await this.imageProcessor.processImages();
			}

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
		if (!this.imageProcessor.config.replaceImgTags) {
			return data;
		}

		try {
			// Process images if not already done
			if (!this.imageProcessor.hasProcessedImages()) {
				await this.imageProcessor.processImages();
			}

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

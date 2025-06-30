"use strict";
/* global hexo */

const sharp = require("sharp");
const glob = require("glob");
const fs = require("fs-extra");
const path = require("path");

/**
 * Hexo Image Optimization Plugin
 * Automatically optimizes images during the build process
 */
class HexoImageOpt {
	constructor(hexo) {
		this.hexo = hexo;
		this.config = this.getConfig();
		this.processedImages = new Set();
		this.log("Plugin constructor called");
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

		this.log(`Configuration loaded: ${JSON.stringify(config)}`);
		return config;
	}

	/**
	 * Initialize the plugin
	 */
	init() {
		this.log("Plugin init() called");

		if (!this.config.enable) {
			this.log("Plugin disabled in configuration");
			return;
		}

		// Hook into the generation process
		this.hexo.extend.filter.register(
			"after_generate",
			this.afterGenerate.bind(this),
		);

		this.log(
			"Hexo Image Optimization Plugin initialized and after_generate hook registered",
		);
	}

	/**
	 * After generation hook
	 */
	async afterGenerate() {
		this.log("after_generate hook called!");
		try {
			await this.processImages();
			this.log(`Processed ${this.processedImages.size} images`);
		} catch (error) {
			this.log(`Error in after_generate: ${error.message}`, "error");
		}
	}

	/**
	 * Process images during generation
	 */
	async processImages() {
		try {
			for (const sourceDir of this.config.sourceDirs) {
				const imagePattern = path.join(sourceDir, "**/*.{jpg,jpeg,png,gif}");
				this.log(`Looking for images with pattern: ${imagePattern}`);

				const imageFiles = glob.sync(imagePattern, { nodir: true });

				this.log(
					`Found ${imageFiles.length} images in ${sourceDir}: ${imageFiles.join(
						", ",
					)}`,
				);

				for (const imagePath of imageFiles) {
					await this.optimizeImage(imagePath, sourceDir);
				}
			}

			this.log("Image optimization completed");
		} catch (error) {
			this.log(`Error processing images: ${error.message}`, "error");
		}
	}

	/**
	 * Optimize a single image
	 */
	async optimizeImage(imagePath, sourceDir) {
		try {
			const relativePath = path.relative(sourceDir, imagePath);
			const outputBasePath = path.dirname(imagePath);
			const baseName = path.basename(imagePath, path.extname(imagePath));

			// Create output directory if it doesn't exist
			await fs.ensureDir(outputBasePath);

			// Process each format
			for (const format of this.config.formats) {
				await this.generateFormat(imagePath, outputBasePath, baseName, format);
			}

			// Generate responsive sizes
			for (const size of this.config.sizes) {
				await this.generateResponsive(
					imagePath,
					outputBasePath,
					baseName,
					size,
				);
			}

			this.processedImages.add(imagePath);
			this.log(`Optimized: ${relativePath}`);
		} catch (error) {
			this.log(`Error optimizing ${imagePath}: ${error.message}`, "error");
		}
	}

	/**
	 * Generate image in specific format
	 */
	async generateFormat(inputPath, outputPath, baseName, format) {
		const outputFile = path.join(outputPath, `${baseName}.${format}`);

		if (this.config.skipExisting && (await fs.pathExists(outputFile))) {
			return;
		}

		let sharpInstance = sharp(inputPath);

		switch (format) {
			case "webp":
				sharpInstance = sharpInstance.webp({ quality: this.config.quality });
				break;
			case "jpeg":
				sharpInstance = sharpInstance.jpeg({ quality: this.config.quality });
				break;
			case "png":
				sharpInstance = sharpInstance.png({ quality: this.config.quality });
				break;
			case "avif":
				sharpInstance = sharpInstance.avif({ quality: this.config.quality });
				break;
		}

		await sharpInstance.toFile(outputFile);
	}

	/**
	 * Generate responsive image sizes
	 */
	async generateResponsive(inputPath, outputPath, baseName, size) {
		const outputFile = path.join(outputPath, `${baseName}-${size}w.webp`);

		if (this.config.skipExisting && (await fs.pathExists(outputFile))) {
			return;
		}

		await sharp(inputPath)
			.resize(size, null, { withoutEnlargement: true })
			.webp({ quality: this.config.quality })
			.toFile(outputFile);
	}

	/**
	 * Logging utility
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

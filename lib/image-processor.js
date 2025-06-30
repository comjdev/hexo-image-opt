"use strict";

const sharp = require("sharp");
const glob = require("glob");
const fs = require("fs-extra");
const path = require("path");

/**
 * Image processing functionality for Hexo Image Optimization Plugin
 */
class ImageProcessor {
	constructor(config, logger) {
		this.config = config;
		this.logger = logger;
		this.processedImages = new Set();
	}

	/**
	 * Process all images in configured source directories
	 */
	async processImages() {
		try {
			for (const sourceDir of this.config.sourceDirs) {
				const imagePattern = path.join(sourceDir, "**/*.{jpg,jpeg,png,gif}");
				this.logger.info(`Looking for images with pattern: ${imagePattern}`);

				const imageFiles = glob.sync(imagePattern, { nodir: true });

				this.logger.info(
					`Found ${imageFiles.length} images in ${sourceDir}: ${imageFiles.join(
						", ",
					)}`,
				);

				for (const imagePath of imageFiles) {
					await this.optimizeImage(imagePath, sourceDir);
				}
			}

			this.logger.info("Image optimization completed");
		} catch (error) {
			this.logger.error(`Error processing images: ${error.message}`);
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
			this.logger.info(`Optimized: ${relativePath}`);
		} catch (error) {
			this.logger.error(`Error optimizing ${imagePath}: ${error.message}`);
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
	 * Get the number of processed images
	 */
	getProcessedCount() {
		return this.processedImages.size;
	}

	/**
	 * Check if images have been processed
	 */
	hasProcessedImages() {
		return this.processedImages.size > 0;
	}

	/**
	 * Clean optimized images from source directories
	 */
	async cleanOptimizedImages() {
		try {
			for (const sourceDir of this.config.sourceDirs) {
				// Find all optimized image files (WebP, responsive sizes, etc.)
				const optimizedPatterns = [
					path.join(sourceDir, "**/*.webp"),
					path.join(sourceDir, "**/*-*w.webp"), // Responsive sizes
					path.join(sourceDir, "**/*-*w.jpeg"), // Responsive sizes
					path.join(sourceDir, "**/*-*w.jpg"), // Responsive sizes
					path.join(sourceDir, "**/*-*w.png"), // Responsive sizes
					path.join(sourceDir, "**/*.avif"), // AVIF format
				];

				for (const pattern of optimizedPatterns) {
					const files = glob.sync(pattern, { nodir: true });

					for (const file of files) {
						try {
							await fs.remove(file);
							this.logger.info(
								`Removed optimized image: ${path.relative(sourceDir, file)}`,
							);
						} catch (error) {
							this.logger.error(`Error removing ${file}: ${error.message}`);
						}
					}
				}
			}

			// Clear the processed images set
			this.processedImages.clear();
		} catch (error) {
			this.logger.error(`Error cleaning optimized images: ${error.message}`);
		}
	}
}

module.exports = ImageProcessor;

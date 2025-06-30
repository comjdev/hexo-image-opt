"use strict";

const sharp = require("sharp");
const glob = require("glob");
const fs = require("fs-extra");
const path = require("path");

/**
 * Generator for Hexo Image Optimization Plugin
 * Generates optimized images in memory and returns them for public folder
 */
class ImageGenerator {
	constructor(config, logger) {
		this.config = config;
		this.logger = logger;
		this.processedImages = new Set();
	}

	/**
	 * Generate optimized images for Hexo
	 * Returns an array of { path, data } objects for Hexo to write to public/
	 */
	async generate() {
		try {
			const outputs = [];

			for (const sourceDir of this.config.sourceDirs) {
				const imagePattern = path.join(sourceDir, "**/*.{jpg,jpeg,png,gif}");
				this.logger.info(`Looking for images with pattern: ${imagePattern}`);

				const imageFiles = glob.sync(imagePattern, { nodir: true });

				this.logger.info(`Found ${imageFiles.length} images in ${sourceDir}`);

				for (const imagePath of imageFiles) {
					const imageOutputs = await this.generateOptimizedVersions(
						imagePath,
						sourceDir,
					);
					outputs.push(...imageOutputs);
				}
			}

			this.logger.info(`Generated ${outputs.length} optimized images`);
			return outputs;
		} catch (error) {
			this.logger.error(`Error generating images: ${error.message}`);
			return [];
		}
	}

	/**
	 * Generate all optimized versions of a single image
	 */
	async generateOptimizedVersions(imagePath, sourceDir) {
		try {
			const relativePath = path.relative(sourceDir, imagePath);
			const baseName = path.basename(imagePath, path.extname(imagePath));
			const outputDir = path.dirname(relativePath);
			const outputs = [];

			// Read the original image
			const imageBuffer = await fs.readFile(imagePath);

			// Generate each format
			for (const format of this.config.formats) {
				const formatOutput = await this.generateFormat(
					imageBuffer,
					outputDir,
					baseName,
					format,
				);
				if (formatOutput) {
					outputs.push(formatOutput);
				}
			}

			// Generate responsive sizes
			for (const size of this.config.sizes) {
				const responsiveOutput = await this.generateResponsive(
					imageBuffer,
					outputDir,
					baseName,
					size,
				);
				if (responsiveOutput) {
					outputs.push(responsiveOutput);
				}
			}

			this.processedImages.add(imagePath);
			this.logger.info(`Generated optimized versions for: ${relativePath}`);

			return outputs;
		} catch (error) {
			this.logger.error(
				`Error generating versions for ${imagePath}: ${error.message}`,
			);
			return [];
		}
	}

	/**
	 * Generate image in specific format (in memory)
	 */
	async generateFormat(imageBuffer, outputDir, baseName, format) {
		try {
			let sharpInstance = sharp(imageBuffer);

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
				default:
					return null;
			}

			const optimizedBuffer = await sharpInstance.toBuffer();
			const outputPath = path.join(outputDir, `${baseName}.${format}`);

			return {
				path: outputPath,
				data: optimizedBuffer,
			};
		} catch (error) {
			this.logger.error(`Error generating ${format} format: ${error.message}`);
			return null;
		}
	}

	/**
	 * Generate responsive image size (in memory)
	 */
	async generateResponsive(imageBuffer, outputDir, baseName, size) {
		try {
			const optimizedBuffer = await sharp(imageBuffer)
				.resize(size, null, { withoutEnlargement: true })
				.webp({ quality: this.config.quality })
				.toBuffer();

			const outputPath = path.join(outputDir, `${baseName}-${size}w.webp`);

			return {
				path: outputPath,
				data: optimizedBuffer,
			};
		} catch (error) {
			this.logger.error(
				`Error generating responsive size ${size}: ${error.message}`,
			);
			return null;
		}
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
}

module.exports = ImageGenerator;

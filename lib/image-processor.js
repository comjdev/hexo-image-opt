"use strict";

const glob = require("glob");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const getSharedConfigInstance = require("./config");

/**
 * Image processor for hexo-image-opt plugin
 */
class ImageProcessor {
	constructor(hexo) {
		this.configInstance = getSharedConfigInstance(hexo);
	}

	/**
	 * Find all image files in source directories
	 */
	findImageFiles() {
		const config = this.configInstance.getConfig();
		const imageFiles = [];
		const sourceDirs = ["source"];

		// Try to get theme name from multiple sources
		let themeName = null;

		// First try: from hexo config if available
		if (config.hexo && config.hexo.config.theme) {
			themeName = config.hexo.config.theme;
		}

		// Second try: read from _config.yml directly
		if (!themeName) {
			try {
				const configPath = path.join(process.cwd(), "_config.yml");
				if (fs.existsSync(configPath)) {
					const configContent = fs.readFileSync(configPath, "utf8");
					const themeMatch = configContent.match(/^theme:\s*(.+)$/m);
					if (themeMatch) {
						themeName = themeMatch[1].trim();
					}
				}
			} catch (error) {
				// Silently continue if config file can't be read
			}
		}

		// Third try: check if themes directory exists and find the first theme
		if (!themeName) {
			try {
				const themesDir = path.join(process.cwd(), "themes");
				if (fs.existsSync(themesDir)) {
					const themeDirs = fs.readdirSync(themesDir).filter((dir) => {
						const themePath = path.join(themesDir, dir);
						return fs.statSync(themePath).isDirectory();
					});
					if (themeDirs.length > 0) {
						themeName = themeDirs[0]; // Use the first theme found
					}
				}
			} catch (error) {
				// Silently continue if theme directory can't be read
			}
		}

		// Add theme source dir if theme name is found
		if (themeName) {
			const themeSourceDir = `themes/${themeName}/source`;
			if (fs.existsSync(themeSourceDir)) {
				sourceDirs.push(themeSourceDir);
			}
		}

		for (const sourceDir of sourceDirs) {
			if (!fs.existsSync(sourceDir)) continue;

			// Find all image files, excluding opt-images directory
			const patterns = [
				`${sourceDir}/**/*.jpg`,
				`${sourceDir}/**/*.jpeg`,
				`${sourceDir}/**/*.png`,
				`${sourceDir}/**/*.webp`,
			];

			for (const pattern of patterns) {
				const files = glob.sync(pattern, {
					nodir: true,
					ignore: [`${sourceDir}/opt-images/**`],
				});
				imageFiles.push(...files);
			}
		}

		return imageFiles;
	}

	/**
	 * Process a single image
	 */
	async processImage(imagePath) {
		const config = this.configInstance.getConfig();
		const sizes = config.sizes || [800, 1280, 1920];
		const quality = config.quality || 80;
		const skipExisting = config.skipExisting !== false;

		const outputs = [];

		try {
			// Load the image
			const image = sharp(imagePath);
			const metadata = await image.metadata();
			const originalExt = path.extname(imagePath).toLowerCase();
			const baseName = path.basename(imagePath, originalExt);

			// Create opt-images directory if it doesn't exist
			const optImagesDir = "source/opt-images";
			if (!fs.existsSync(optImagesDir)) {
				fs.mkdirSync(optImagesDir, { recursive: true });
			}

			// Create ONE optimized fallback (original format, compressed)
			const fallbackFilename = `${baseName}-optimized${originalExt}`;
			const fallbackPath = path.join(optImagesDir, fallbackFilename);

			if (!skipExisting || !fs.existsSync(fallbackPath)) {
				let fallbackImage = image.resize(metadata.width, metadata.height, {
					withoutEnlargement: true,
					fit: "inside",
				});

				// Apply format-specific processing for fallback
				if (originalExt === ".jpg" || originalExt === ".jpeg") {
					fallbackImage = fallbackImage.jpeg({ quality });
				} else if (originalExt === ".png") {
					fallbackImage = fallbackImage.png({ quality });
				} else if (originalExt === ".webp") {
					fallbackImage = fallbackImage.webp({ quality });
				}

				const fallbackBuffer = await fallbackImage.toBuffer();
				fs.writeFileSync(fallbackPath, fallbackBuffer);

				outputs.push({
					path: `opt-images/${fallbackFilename}`,
					data: fallbackBuffer,
				});

				this.configInstance.addOptimizedImage(`opt-images/${fallbackFilename}`);
			} else {
				outputs.push({
					path: `opt-images/${fallbackFilename}`,
					data: fs.readFileSync(fallbackPath),
				});
			}

			// Create WebP versions for all sizes
			for (const size of sizes) {
				const webpFilename = `${baseName}-${size}w.webp`;
				const webpPath = path.join(optImagesDir, webpFilename);

				if (!skipExisting || !fs.existsSync(webpPath)) {
					// Resize and optimize the image
					let processedImage = image.resize(size, null, {
						withoutEnlargement: true,
						fit: "inside",
					});

					// Convert to WebP
					processedImage = processedImage.webp({ quality });

					// Generate the optimized image
					const buffer = await processedImage.toBuffer();

					// Save to file system
					fs.writeFileSync(webpPath, buffer);

					// Add to outputs
					outputs.push({
						path: `opt-images/${webpFilename}`,
						data: buffer,
					});

					// Track the optimized image
					this.configInstance.addOptimizedImage(`opt-images/${webpFilename}`);
				} else {
					outputs.push({
						path: `opt-images/${webpFilename}`,
						data: fs.readFileSync(webpPath),
					});
				}
			}

			return outputs;
		} catch (error) {
			console.error(`Error processing image ${imagePath}:`, error.message);
			return [];
		}
	}

	/**
	 * Process all images
	 */
	async processAllImages() {
		const imageFiles = this.findImageFiles();
		const allOutputs = [];

		console.log(`Found ${imageFiles.length} images to process`);

		for (const imagePath of imageFiles) {
			const outputs = await this.processImage(imagePath);
			allOutputs.push(...outputs);
		}

		console.log(`Generated ${allOutputs.length} optimized images`);
		return allOutputs;
	}

	/**
	 * Delete optimized images from source directories
	 */
	deleteOptimizedImages() {
		const patterns = [
			"source/opt-images/**/*.webp",
			"source/opt-images/**/*.jpeg",
			"source/opt-images/**/*.jpg",
			"source/opt-images/**/*.png",
		];

		let deletedCount = 0;

		for (const pattern of patterns) {
			const files = glob.sync(pattern, { nodir: true });
			for (const file of files) {
				try {
					fs.unlinkSync(file);
					deletedCount++;
				} catch (error) {
					console.error(`Error deleting ${file}:`, error.message);
				}
			}
		}

		// Try to remove the opt-images directory if it's empty
		try {
			const optImagesDir = "source/opt-images";
			if (fs.existsSync(optImagesDir)) {
				const files = fs.readdirSync(optImagesDir);
				if (files.length === 0) {
					fs.rmdirSync(optImagesDir);
				}
			}
		} catch (error) {
			// Directory not empty or other error, ignore
		}

		if (deletedCount > 0) {
			console.log(`Deleted ${deletedCount} optimized images`);
		}
	}
}

module.exports = ImageProcessor;

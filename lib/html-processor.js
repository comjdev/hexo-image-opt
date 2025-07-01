"use strict";

const path = require("path");
const fs = require("fs");
const getSharedConfigInstance = require("./config");

/**
 * HTML processor for hexo-image-opt plugin
 */
class HtmlProcessor {
	constructor(config) {
		this.config = getSharedConfigInstance();
	}

	/**
	 * Generate base name for optimized image lookup
	 */
	generateBaseName(originalPath) {
		const ext = path.extname(originalPath);
		const baseName = path.basename(originalPath, ext);
		return baseName;
	}

	/**
	 * Generate sizes attribute for responsive images
	 */
	generateSizesAttribute(sizes) {
		// Sort sizes in ascending order
		const sortedSizes = [...sizes].sort((a, b) => a - b);

		// Create responsive sizes string
		const sizeBreakpoints = [];

		// Add breakpoints for each size
		for (let i = 0; i < sortedSizes.length; i++) {
			const size = sortedSizes[i];
			const nextSize = sortedSizes[i + 1];

			if (i === 0) {
				// Smallest size: use for screens up to the next breakpoint
				const maxWidth = nextSize ? `${nextSize - 1}px` : "100vw";
				sizeBreakpoints.push(`(max-width: ${maxWidth}) ${size}px`);
			} else if (nextSize) {
				// Middle sizes: use for screens between breakpoints
				const minWidth = `${size}px`;
				const maxWidth = `${nextSize - 1}px`;
				sizeBreakpoints.push(
					`(min-width: ${minWidth}) and (max-width: ${maxWidth}) ${size}px`,
				);
			} else {
				// Largest size: use for screens larger than the largest breakpoint
				sizeBreakpoints.push(`(min-width: ${size}px) ${size}px`);
			}
		}

		// Default fallback
		const largestSize = sortedSizes[sortedSizes.length - 1];
		sizeBreakpoints.push(`${largestSize}px`);

		return sizeBreakpoints.join(", ");
	}

	/**
	 * Check if optimized images exist for a given image path
	 */
	checkOptimizedImagesExist(originalPath) {
		const config = this.config.getConfig();
		const sizes = config.sizes || [800, 1280, 1920];
		const baseName = this.generateBaseName(originalPath);
		const originalExt = path.extname(originalPath).toLowerCase();

		// Check for optimized fallback
		const fallbackPath = `source/opt-images/${baseName}-optimized${originalExt}`;
		if (fs.existsSync(fallbackPath)) {
			return true;
		}

		// Check for WebP versions
		for (const size of sizes) {
			const webpPath = `source/opt-images/${baseName}-${size}w.webp`;
			if (fs.existsSync(webpPath)) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Generate picture element HTML using regex-based approach
	 */
	generatePictureElementFromRegex(imgTag, originalPath) {
		const config = this.config.getConfig();
		const sizes = config.sizes || [800, 1280, 1920];
		const baseName = this.generateBaseName(originalPath);
		const originalExt = path.extname(originalPath).toLowerCase();

		// Load stored dimensions
		let storedDimensions = {};
		const dimensionsFile = "source/opt-images/dimensions.json";
		if (fs.existsSync(dimensionsFile)) {
			try {
				storedDimensions = JSON.parse(fs.readFileSync(dimensionsFile, "utf8"));
			} catch (error) {
				storedDimensions = {};
			}
		}

		// Extract attributes from img tag using regex
		const srcMatch = imgTag.match(/src=["']([^"']+)["']/);
		const altMatch = imgTag.match(/alt=["']([^"']*)["']/);
		const classMatch = imgTag.match(/class=["']([^"']*)["']/);
		const widthMatch = imgTag.match(/width=["']([^"']*)["']/);
		const heightMatch = imgTag.match(/height=["']([^"']*)["']/);

		const src = srcMatch ? srcMatch[1] : "";
		const alt = altMatch ? altMatch[1] : "";
		const className = classMatch ? classMatch[1] : "";
		const width = widthMatch ? widthMatch[1] : "";
		const height = heightMatch ? heightMatch[1] : "";

		// Extract other attributes (excluding src, alt, class, width, height)
		const otherAttrs = {};
		const attrRegex = /(\w+)=["']([^"']*)["']/g;
		let attrMatch;
		while ((attrMatch = attrRegex.exec(imgTag)) !== null) {
			const attrName = attrMatch[1];
			const attrValue = attrMatch[2];
			if (!["src", "alt", "class", "width", "height"].includes(attrName)) {
				otherAttrs[attrName] = attrValue;
			}
		}

		// Build sources
		const sources = [];
		const webpSources = [];

		// Add WebP sources for all sizes
		for (const size of sizes) {
			const webpPath = `opt-images/${baseName}-${size}w.webp`;
			if (fs.existsSync(`source/${webpPath}`)) {
				webpSources.push(`${webpPath} ${size}w`);
			}
		}

		// Add WebP source if available
		if (webpSources.length > 0) {
			// Generate sizes attribute based on available sizes
			const sizesAttr = this.generateSizesAttribute(sizes);
			sources.push(
				`<source type="image/webp" srcset="${webpSources.join(
					", ",
				)}" sizes="${sizesAttr}">`,
			);
		}

		// Build picture HTML
		let pictureHtml = '<picture data-optimized="true"';
		if (className) pictureHtml += ` class="${className}"`;
		pictureHtml += ">";
		pictureHtml += sources.join("");
		pictureHtml += "<img";

		// Use optimized fallback if available, otherwise use original
		const fallbackPath = `opt-images/${baseName}-optimized${originalExt}`;
		if (fs.existsSync(`source/${fallbackPath}`)) {
			pictureHtml += ` src="${fallbackPath}"`;
		} else {
			pictureHtml += ` src="${src}"`;
		}

		if (alt) pictureHtml += ` alt="${alt}"`;

		// Check for object-fit classes that might conflict with width/height
		const hasObjectFit =
			className.includes("object-cover") ||
			className.includes("object-contain") ||
			className.includes("object-fill") ||
			className.includes("object-scale-down") ||
			className.includes("object-none");

		// Add width and height attributes to prevent layout shifts
		// Only add if:
		// 1. Original img tag had width/height, OR
		// 2. No object-fit classes are present (to avoid conflicts)
		if (width || height || !hasObjectFit) {
			// Use original width/height if present, otherwise use stored dimensions
			const finalWidth =
				width ||
				(storedDimensions[baseName] ? storedDimensions[baseName].width : "");
			const finalHeight =
				height ||
				(storedDimensions[baseName] ? storedDimensions[baseName].height : "");

			if (finalWidth) pictureHtml += ` width="${finalWidth}"`;
			if (finalHeight) pictureHtml += ` height="${finalHeight}"`;
		}

		// Add lazy loading attribute
		pictureHtml += ` loading="lazy"`;

		// Apply other attributes to img tag (excluding class since it's on picture)
		Object.entries(otherAttrs).forEach(([name, value]) => {
			pictureHtml += ` ${name}="${value}"`;
		});

		pictureHtml += ">";
		pictureHtml += "</picture>";

		return pictureHtml;
	}

	/**
	 * Process HTML content and replace img tags with picture elements using regex
	 */
	processHtmlContent(htmlContent) {
		try {
			// Regex to match img tags with src attribute
			const imgRegex = /<img([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi;
			let hasChanges = false;
			let processedHtml = htmlContent;

			// Replace each img tag
			processedHtml = processedHtml.replace(
				imgRegex,
				(match, beforeSrc, src, afterSrc) => {
					// Check if optimized images exist for this image
					if (this.checkOptimizedImagesExist(src)) {
						// Generate picture element using regex-based approach
						const pictureHtml = this.generatePictureElementFromRegex(
							match,
							src,
						);
						hasChanges = true;
						return pictureHtml;
					}
					return match; // Keep original if no optimized images
				},
			);

			return processedHtml;
		} catch (error) {
			// Return original content if processing fails
			return htmlContent;
		}
	}
}

module.exports = HtmlProcessor;

"use strict";

const glob = require("glob");
const fs = require("fs-extra");
const path = require("path");
const { parse } = require("node-html-parser");

/**
 * HTML processing functionality for Hexo Image Optimization Plugin
 */
class HtmlProcessor {
	constructor(config, logger) {
		this.config = config;
		this.logger = logger;
	}

	/**
	 * Replace img tags with picture elements in HTML files
	 */
	async replaceImgTagsInHtml() {
		try {
			const htmlPattern = path.join("public", "**/*.html");
			this.logger.info(`Looking for HTML files with pattern: ${htmlPattern}`);

			const htmlFiles = glob.sync(htmlPattern, { nodir: true });
			this.logger.info(`Found ${htmlFiles.length} HTML files to process`);

			let totalReplacements = 0;

			for (const htmlFile of htmlFiles) {
				const replacements = await this.processHtmlFile(htmlFile);
				totalReplacements += replacements;
			}

			this.logger.info(
				`Replaced ${totalReplacements} img tags with picture elements`,
			);
		} catch (error) {
			this.logger.error(`Error replacing img tags: ${error.message}`);
		}
	}

	/**
	 * Process a single HTML file
	 */
	async processHtmlFile(htmlFile) {
		try {
			const content = await fs.readFile(htmlFile, "utf8");
			const root = parse(content);
			const imgTags = root.querySelectorAll("img");

			let replacements = 0;

			for (const imgTag of imgTags) {
				const src = imgTag.getAttribute("src");
				if (!src) continue;

				// Skip img tags that are already inside picture elements
				const parent = imgTag.parent;
				if (parent && parent.tagName === "picture") {
					continue;
				}

				const pictureElement = await this.createPictureElement(
					imgTag,
					htmlFile,
				);
				if (pictureElement) {
					imgTag.replaceWith(pictureElement);
					replacements++;
				}
			}

			// Replace inline background-image styles
			const allElements = root.querySelectorAll("*");
			for (const el of allElements) {
				const style = el.getAttribute && el.getAttribute("style");
				if (
					style &&
					/background-image\s*:\s*url\(['\"]?([^'\")]+)['\"]?\)/.test(style)
				) {
					const match = style.match(
						/background-image\s*:\s*url\(['\"]?([^'\")]+)['\"]?\)/,
					);
					if (match) {
						const bgUrl = match[1];
						const htmlDir = path.dirname(htmlFile);
						const originalImagePath = await this.findOriginalImage(
							bgUrl,
							htmlDir,
						);
						if (!originalImagePath) continue;
						const webpVersions = await this.getWebpVersions(originalImagePath);
						if (webpVersions.length === 0) continue;

						// Build image-set() CSS
						const webpRel = path.relative(htmlDir, webpVersions[0]);
						const origRel = bgUrl;
						const ext = path.extname(bgUrl).replace(".", "");
						const imageSet = `image-set(url('${webpRel}') type('image/webp'), url('${origRel}') type('image/${ext}'))`;
						const newStyle = style.replace(
							/background-image\s*:\s*url\(['\"]?([^'\")]+)['\"]?\)/,
							`background-image: ${imageSet}`,
						);
						el.setAttribute("style", newStyle);
						replacements++;
					}
				}
			}

			if (replacements > 0) {
				await fs.writeFile(htmlFile, root.toString());
				this.logger.info(
					`Updated ${htmlFile} with ${replacements} picture elements and/or background images`,
				);
			}

			return replacements;
		} catch (error) {
			this.logger.error(`Error processing ${htmlFile}: ${error.message}`);
			return 0;
		}
	}

	/**
	 * Create a picture element for an img tag
	 */
	async createPictureElement(imgTag, htmlFile) {
		try {
			const src = imgTag.getAttribute("src");
			const alt = imgTag.getAttribute("alt") || "";

			// Get the directory of the HTML file to resolve relative paths
			const htmlDir = path.dirname(htmlFile);

			// Try to find the original image file
			const originalImagePath = await this.findOriginalImage(src, htmlDir);
			if (!originalImagePath) {
				return null;
			}

			// Check if WebP versions exist
			const webpVersions = await this.getWebpVersions(originalImagePath);
			if (webpVersions.length === 0) {
				return null;
			}

			// Create picture element
			const picture = parse("<picture></picture>").querySelector("picture");

			// Add source elements for responsive images
			for (const size of this.config.sizes) {
				const webpVersion = webpVersions.find((w) =>
					w.includes(`-${size}w.webp`),
				);
				if (webpVersion) {
					const relativePath = path.relative(htmlDir, webpVersion);
					const source = parse(
						`<source media="(min-width:${size}px)" srcset="${relativePath}"></source>`,
					).querySelector("source");
					picture.appendChild(source);
				}
			}

			// Add fallback img tag
			const fallbackImg = parse(
				`<img src="${src}" alt="${alt}">`,
			).querySelector("img");
			// Copy all attributes from original img tag
			const attributes = imgTag.attributes;
			for (const attrName in attributes) {
				if (attrName !== "src") {
					// src is already set
					fallbackImg.setAttribute(attrName, attributes[attrName]);
				}
			}
			picture.appendChild(fallbackImg);

			return picture;
		} catch (error) {
			this.logger.error(`Error creating picture element: ${error.message}`);
			return null;
		}
	}

	/**
	 * Find the original image file from a src path
	 */
	async findOriginalImage(src, htmlDir) {
		// Try different possible locations
		const possiblePaths = [
			path.join(htmlDir, src),
			path.join("public", src),
			path.join("source", src.replace(/^\//, "")),
		];

		for (const possiblePath of possiblePaths) {
			if (await fs.pathExists(possiblePath)) {
				return possiblePath;
			}
		}

		return null;
	}

	/**
	 * Get WebP versions of an image
	 */
	async getWebpVersions(originalImagePath) {
		const dir = path.dirname(originalImagePath);
		const baseName = path.basename(
			originalImagePath,
			path.extname(originalImagePath),
		);

		const webpPattern = path.join(dir, `${baseName}*.webp`);
		const webpFiles = glob.sync(webpPattern, { nodir: true });

		return webpFiles;
	}

	/**
	 * Replace img tags in HTML content
	 */
	async replaceImgTagsInContent(content) {
		try {
			const root = parse(content);
			const imgTags = root.querySelectorAll("img");

			for (const imgTag of imgTags) {
				const src = imgTag.getAttribute("src");
				if (!src) continue;

				// Skip img tags that are already inside picture elements
				const parent = imgTag.parent;
				if (parent && parent.tagName === "picture") {
					continue;
				}

				const pictureElement = await this.createPictureElement(
					imgTag,
					"source",
				);
				if (pictureElement) {
					imgTag.replaceWith(pictureElement);
				}
			}

			return root.toString();
		} catch (error) {
			this.logger.error(
				`Error replacing img tags in content: ${error.message}`,
			);
			return content;
		}
	}
}

module.exports = HtmlProcessor;

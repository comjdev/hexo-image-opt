"use strict";

const ImageOptGenerator = require("./lib/generator");
const getSharedConfigInstance = require("./lib/config");
const HtmlProcessor = require("./lib/html-processor");

// Create a shared config instance with hexo instance
const configInstance = getSharedConfigInstance(hexo);

// Check if the plugin is enabled
if (!configInstance.isEnabled()) {
	return;
}

// Set up HTML processing filter during rendering (so we can process HTML content directly)
hexo.extend.filter.register("after_render:html", (str, data) => {
	// Skip if no content
	if (!str || str.length === 0) {
		return str;
	}

	const config = configInstance.getConfig();
	const htmlProcessor = new HtmlProcessor(config);

	const processedHtml = htmlProcessor.processHtmlContent(str);

	// Always return the original HTML if processing fails or returns a falsy value
	return processedHtml || str;
});

// Register the generator
hexo.extend.generator.register("image-opt", function (locals) {
	const generator = new ImageOptGenerator(this, configInstance);
	return generator.generate();
});

// Register clean hook to remove optimized images
hexo.extend.filter.register("after_clean", () => {
	const config = configInstance.getConfig();
	const imageProcessor = new (require("./lib/image-processor"))(hexo);
	imageProcessor.deleteOptimizedImages();
});

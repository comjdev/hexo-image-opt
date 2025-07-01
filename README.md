# hexo-image-opt

A Hexo plugin for automatic image optimization and responsive images with WebP support.

## Overview

This plugin automatically optimizes your images and generates responsive `<picture>` elements for better performance and browser compatibility. It creates:

- **ONE optimized fallback** per image (original format, compressed)
- **WebP versions** for all responsive sizes (400w, 800w, 1200w, 1600w)
- **Responsive `<picture>` elements** with lazy loading and layout shift prevention

## Installation

```bash
npm install hexo-image-opt --save
```

## Usage

Just install the plugin and run:

```bash
hexo generate
```

The plugin will:

1. Find all images in your `source/` and theme directories
2. Generate optimized images in `source/opt-images/`
3. Replace `<img>` tags with responsive `<picture>` elements in generated HTML

## Configuration

Add your configuration under `image_opt` in your Hexo `_config.yml`:

```yaml
image_opt:
  quality: 80
  sizes: [400, 800, 1280, 1920]
  skipExisting: true
```

### Options

- `quality`: Image quality for optimization (default: 80)
- `sizes`: Responsive widths for WebP generation (default: [400, 800, 1280, 1920])
- `skipExisting`: Skip processing if optimized images already exist (default: true)

## Features

### 🎯 **Efficient Image Generation**

- **One optimized fallback** per image (original format, compressed)
- **WebP versions** for all responsive sizes
- **No duplicate formats** - only what you need

### 🖼️ **Responsive Picture Elements**

- Automatically replaces `<img>` tags with `<picture>` elements
- **WebP sources** for modern browsers with `sizes` attribute
- **Optimized fallback** for older browsers
- **CSS classes preserved** on the `<picture>` element
- **Lazy loading** for better performance

### 📐 **Layout Shift Prevention**

- **Width and height attributes** automatically added to prevent Cumulative Layout Shift (CLS)
- **Smart object-fit detection** - skips width/height when CSS classes like `object-cover` are present
- **Automatic dimension extraction** from original images when attributes are missing
- **Dimensions stored** in `source/opt-images/dimensions.json` for future use

### 🔍 **Smart Image Discovery**

- Scans `source/` directory for site images
- **Auto-detects theme directory** (works with any theme name)
- Excludes `opt-images/` to prevent recursion
- Supports JPG, JPEG, PNG, and WebP formats

### 🧹 **Clean Source Environment**

- Optimized images stored in dedicated `source/opt-images/` folder
- Original images remain untouched
- Clean separation between source and optimized assets

## Generated HTML Structure

The plugin transforms:

```html
<img src="images/my-image.jpg" class="w-full h-48" alt="My Image" />
```

Into:

```html
<picture data-optimized="true" class="w-full h-48">
	<source
		type="image/webp"
		srcset="
			opt-images/my-image-400w.webp   400w,
			opt-images/my-image-800w.webp   800w,
			opt-images/my-image-1200w.webp 1200w,
			opt-images/my-image-1600w.webp 1600w
		"
		sizes="(max-width: 799px) 400px, (min-width: 800px) and (max-width: 1199px) 800px, (min-width: 1200px) and (max-width: 1599px) 1200px, (min-width: 1600px) 1600px, 1600px"
	/>
	<img
		src="opt-images/my-image-optimized.jpg"
		alt="My Image"
		loading="lazy"
		width="1920"
		height="1080"
	/>
</picture>
```

## File Naming Convention

Generated files follow this pattern:

- **Fallback**: `{basename}-optimized.{original-extension}`
- **WebP sizes**: `{basename}-{size}w.webp`
- **Dimensions**: `dimensions.json` (stores original image dimensions)

Examples:

- `hero-pool-optimized.jpg` (fallback)
- `hero-pool-400w.webp`, `hero-pool-800w.webp`, etc. (WebP sizes)
- `dimensions.json` (image dimensions for layout shift prevention)

## Browser Support

- **Modern browsers**: Use WebP for smaller file sizes
- **Older browsers**: Fall back to optimized JPEG/PNG
- **Universal compatibility**: Works everywhere
- **Lazy loading**: Supported in all modern browsers

## Performance Benefits

- **Smaller file sizes**: WebP is 25-35% smaller than JPEG
- **Responsive loading**: Browser downloads only the size it needs
- **Lazy loading**: Images load only when needed
- **Layout shift prevention**: Width/height attributes prevent CLS
- **Better Core Web Vitals**: Faster loading and better user experience
- **Reduced bandwidth**: Especially beneficial for mobile users

## Layout Shift Prevention

The plugin automatically handles layout shift prevention:

### **With Original Width/Height**

If your original `<img>` tag has width and height attributes, they're preserved.

### **Without Original Width/Height**

If no width/height attributes are present, the plugin:

1. Extracts actual dimensions from the image file
2. Stores them in `source/opt-images/dimensions.json`
3. Adds width/height attributes to the generated `<img>` tag

### **Smart Object-Fit Detection**

If CSS classes like `object-cover`, `object-contain`, etc. are detected, width/height attributes are omitted to avoid conflicts with the intended styling.

## Development Workflow

1. **Add images** to your `source/` or theme directories
2. **Run `hexo generate`** - plugin automatically optimizes and creates responsive HTML
3. **Deploy** - optimized images and responsive HTML are ready

## Clean Command

The plugin integrates with Hexo's clean command:

```bash
hexo clean
```

This removes all optimized images from `source/opt-images/` to keep your source environment clean.

## License

MIT

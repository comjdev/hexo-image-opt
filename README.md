# Hexo Image Optimization Plugin

A comprehensive Hexo plugin that automatically optimizes images, converts them to WebP format, generates responsive sizes, and enhances HTML with modern `<picture>` elements for better performance and SEO.

## ✨ Features

- **🖼️ Automatic Image Optimization**: Converts images to WebP and JPEG formats with configurable quality
- **📱 Responsive Images**: Generates multiple sizes (800w, 1200w, 1600w) for responsive design
- **🎨 HTML Enhancement**: Replaces `<img>` tags with responsive `<picture>` elements
- **🎯 Background Image Support**: Optimizes inline background images with `image-set()`
- **⚡ Production Only**: Only runs during `hexo generate`, skipped during development
- **🏗️ Modular Architecture**: Clean, maintainable code split into focused modules
- **🔧 Configurable**: Extensive configuration options for quality, formats, and sizes

## 📦 Installation

```bash
npm install hexo-image-opt
```

## ⚙️ Configuration

Add the following configuration to your Hexo `_config.yml`:

```yaml
# Image Optimization Plugin Configuration
image_opt:
  enable: true # Enable/disable the plugin
  quality: 80 # Image quality (1-100)
  formats: ["webp", "jpeg"] # Output formats
  sizes: [800, 1280, 1920] # Responsive image sizes
  sourceDirs: ["source"] # Source directories to scan
  skipExisting: true # Skip already optimized images
  verbose: false # Enable verbose logging
  replaceImgTags: true # Replace img tags with picture elements
```

### Advanced Configuration

```yaml
image_opt:
  enable: true
  quality: 85
  formats: ["webp", "jpeg", "png"]
  sizes: [400, 800, 1200, 1600, 2400]
  sourceDirs:
    - "source"
    - "themes/my-theme/source"
  skipExisting: true
  verbose: true
  replaceImgTags: true
```

## 🚀 Usage

### Basic Setup

1. **Install the plugin**:

   ```bash
   npm install hexo-image-opt
   ```

2. **Add configuration** to your `_config.yml`:

   ```yaml
   image_opt:
     enable: true
   ```

3. **Generate your site**:
   ```bash
   hexo generate
   ```

The plugin will automatically:

- Scan your source directories for images
- Generate optimized WebP and JPEG versions
- Create responsive sizes for different screen sizes
- Replace `<img>` tags with `<picture>` elements
- Optimize inline background images

### Example Output

**Before** (original HTML):

```html
<img src="/images/hero.jpg" alt="Hero Image" class="hero-image" />
```

**After** (optimized HTML):

```html
<picture>
	<source media="(min-width:800px)" srcset="/images/hero-800w.webp" />
	<source media="(min-width:1200px)" srcset="/images/hero-1200w.webp" />
	<source media="(min-width:1600px)" srcset="/images/hero-1600w.webp" />
	<img src="/images/hero.jpg" alt="Hero Image" class="hero-image" />
</picture>
```

## 📁 Project Structure

```
hexo-image-opt/
├── index.js                 # Main entry point
├── lib/
│   ├── config.js           # Configuration management
│   ├── logger.js           # Logging utilities
│   ├── image-processor.js  # Image optimization logic
│   ├── html-processor.js   # HTML manipulation
│   └── hooks.js            # Hexo filter hooks
├── README.md               # Documentation
├── LICENSE                 # MIT License
└── package.json           # NPM package configuration
```

## 🔧 Configuration Options

| Option           | Type    | Default             | Description                            |
| ---------------- | ------- | ------------------- | -------------------------------------- |
| `enable`         | boolean | `true`              | Enable/disable the plugin              |
| `quality`        | number  | `80`                | Image quality (1-100)                  |
| `formats`        | array   | `["webp", "jpeg"]`  | Output formats                         |
| `sizes`          | array   | `[800, 1280, 1920]` | Responsive image sizes                 |
| `sourceDirs`     | array   | `["source"]`        | Source directories to scan             |
| `skipExisting`   | boolean | `true`              | Skip already optimized images          |
| `verbose`        | boolean | `false`             | Enable verbose logging                 |
| `replaceImgTags` | boolean | `true`              | Replace img tags with picture elements |

## 🎯 Supported Image Formats

- **Input**: JPG, JPEG, PNG, GIF
- **Output**: WebP, JPEG, PNG (configurable)

## 📱 Responsive Image Sizes

The plugin generates multiple image sizes for responsive design:

- **800w**: Tablets and small laptops
- **1200w**: Desktop screens
- **1600w**: Large screens and high-DPI displays

## 🔍 How It Works

1. **Image Discovery**: Scans configured source directories for images
2. **Optimization**: Converts images to WebP and JPEG formats using Sharp
3. **Responsive Generation**: Creates multiple sizes for different screen sizes
4. **HTML Processing**: Replaces `<img>` tags with `<picture>` elements
5. **Background Optimization**: Enhances inline background images with `image-set()`

## 🛠️ Development

### Prerequisites

- Node.js >= 14.0.0
- Hexo >= 5.0.0

### Local Development

1. **Clone the repository**:

   ```bash
   git clone https://github.com/seaspraypools/hexo-image-opt.git
   cd hexo-image-opt
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Run tests**:

   ```bash
   npm test
   ```

4. **Lint code**:
   ```bash
   npm run lint
   ```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Sharp](https://sharp.pixelplumbing.com/) for image processing
- Uses [node-html-parser](https://github.com/taoqf/node-html-parser) for HTML manipulation
- Inspired by modern web performance best practices

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/seaspraypools/hexo-image-opt/issues)
- **Email**: sales@seaspraypools.com.au
- **Website**: [Seaspray Pools](https://seaspraypools.com.au)

---

Made with ❤️ by [Seaspray Pools](https://seaspraypools.com.au)

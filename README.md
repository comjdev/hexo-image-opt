# hexo-image-opt

A powerful Hexo plugin for automatic image optimization and processing. This plugin automatically optimizes images during the Hexo build process, generating multiple formats (WebP, JPEG, PNG, AVIF) and responsive sizes for better performance.

## Features

- 🚀 **Automatic Optimization**: Processes images during Hexo generation
- 🖼️ **Multiple Formats**: Generate WebP, JPEG, PNG, and AVIF formats
- 📱 **Responsive Images**: Create multiple sizes for different screen sizes
- ⚡ **Performance**: Uses Sharp for fast image processing
- 🔧 **Configurable**: Customize quality, formats, and sizes
- 📊 **Logging**: Detailed logging with configurable verbosity

## Installation

```bash
npm install hexo-image-opt --save
```

## Configuration

Add the following configuration to your `_config.yml`:

```yaml
# Image Optimization Plugin
image_opt:
  enable: true # Enable/disable the plugin
  quality: 80 # Image quality (1-100)
  formats: ["webp", "jpeg"] # Output formats
  sizes: [800, 1200, 1600] # Responsive image sizes
  sourceDir: "source/images" # Source images directory
  outputDir: "public/images" # Output directory
  skipExisting: true # Skip existing optimized images
  verbose: false # Enable verbose logging
```

### Configuration Options

| Option         | Type    | Default             | Description                                   |
| -------------- | ------- | ------------------- | --------------------------------------------- |
| `enable`       | boolean | `true`              | Enable or disable the plugin                  |
| `quality`      | number  | `80`                | Image quality (1-100)                         |
| `formats`      | array   | `['webp', 'jpeg']`  | Output formats: `webp`, `jpeg`, `png`, `avif` |
| `sizes`        | array   | `[800, 1200, 1600]` | Responsive image widths                       |
| `sourceDir`    | string  | `'source/images'`   | Source images directory                       |
| `outputDir`    | string  | `'public/images'`   | Output directory                              |
| `skipExisting` | boolean | `true`              | Skip processing existing optimized images     |
| `verbose`      | boolean | `false`             | Enable verbose logging                        |

## Usage

### Basic Usage

1. Place your images in the `source/images` directory
2. Run `hexo generate` or `hexo build`
3. The plugin will automatically optimize your images

### Example Directory Structure

```
source/
  images/
    hero.jpg
    gallery/
      image1.png
      image2.jpg
```

After generation, you'll have:

```
public/
  images/
    hero.webp
    hero.jpeg
    hero-800w.webp
    hero-1200w.webp
    hero-1600w.webp
    gallery/
      image1.webp
      image1.jpeg
      image1-800w.webp
      image1-1200w.webp
      image1-1600w.webp
      image2.webp
      image2.jpeg
      image2-800w.webp
      image2-1200w.webp
      image2-1600w.webp
```

### Using Optimized Images in Templates

```html
<!-- Responsive image with multiple formats -->
<picture>
	<source srcset="/images/hero-800w.webp" media="(max-width: 800px)" />
	<source srcset="/images/hero-1200w.webp" media="(max-width: 1200px)" />
	<source srcset="/images/hero-1600w.webp" media="(min-width: 1201px)" />
	<img src="/images/hero.jpeg" alt="Hero Image" loading="lazy" />
</picture>
```

## Advanced Configuration

### Custom Formats

```yaml
image_opt:
  formats: ["webp", "avif", "jpeg"] # Generate WebP, AVIF, and JPEG
```

### Custom Sizes

```yaml
image_opt:
  sizes: [480, 768, 1024, 1440] # Mobile-first responsive sizes
```

### High Quality Output

```yaml
image_opt:
  quality: 95
  formats: ["webp", "avif"]
```

## Performance Tips

1. **Use WebP and AVIF**: These formats provide better compression
2. **Optimize Quality**: Balance between quality and file size
3. **Skip Existing**: Keep `skipExisting: true` for faster builds
4. **Responsive Sizes**: Choose sizes that match your breakpoints

## Troubleshooting

### Common Issues

1. **Sharp Installation**: If you encounter Sharp installation issues:

   ```bash
   npm rebuild sharp
   ```

2. **Memory Issues**: For large images, consider reducing quality or sizes

3. **Build Performance**: Use `skipExisting: true` to avoid reprocessing

### Debug Mode

Enable verbose logging to see detailed information:

```yaml
image_opt:
  verbose: true
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Changelog

### 1.0.0

- Initial release
- Basic image optimization
- Multiple format support
- Responsive image generation
- Configurable options

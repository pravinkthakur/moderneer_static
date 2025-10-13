# Moderneer Assessment Tool

A modern, maintainable web application for assessing engineering maturity using the Moderneer Outcome Engineering framework.

## Features

- **Modular Architecture**: Clean separation of concerns with ES6 modules
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Accessible**: WCAG compliant with proper ARIA attributes
- **Modern CSS**: Utility-first design system with CSS custom properties
- **Type-safe**: JSDoc annotations for better developer experience
- **Build System**: Modern toolchain with rollup, postcss, and development server

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open in browser:**
   Navigate to `http://localhost:3000`

## Development

### Project Structure

```
assessment/
├── css/                    # Modular CSS architecture
│   ├── variables.css      # Design tokens
│   ├── base.css           # Base styles and reset
│   ├── layout.css         # Grid and layout utilities
│   ├── buttons.css        # Button components
│   ├── forms.css          # Form components
│   ├── cards.css          # Card components
│   ├── components.css     # UI components
│   ├── header.css         # Header styles
│   └── main.css           # Main stylesheet (imports all)
├── js/                     # JavaScript modules
│   ├── models.js          # Data models and definitions
│   ├── assessment-engine.js # Core scoring logic
│   ├── ui-renderer.js     # DOM rendering
│   ├── report-generator.js # Report generation
│   └── main.js            # Application entry point
├── index-new.html         # Clean, semantic HTML
└── package.json           # Build configuration
```

### Available Scripts

- `npm run dev` - Start development server with live reload
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run validate` - Validate HTML

### Architecture Principles

1. **Separation of Concerns**: Each module has a single responsibility
2. **Progressive Enhancement**: Works without JavaScript
3. **Mobile First**: Responsive design starting from mobile
4. **Accessibility First**: WCAG 2.1 AA compliance
5. **Performance**: Optimized assets and lazy loading

## Build & Deploy

1. **Build for production:**
   ```bash
   npm run build
   ```

2. **Test production build:**
   ```bash
   npm run serve
   ```

3. **Deploy to static hosting:**
   Upload the `dist/` folder to your hosting provider

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Follow the existing code style
2. Run `npm run lint` and `npm run format` before committing
3. Ensure accessibility standards are maintained
4. Test on multiple devices and browsers

## License

MIT License - see LICENSE file for details.
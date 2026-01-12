import { defineConfig, Plugin } from 'vite';
import solid from 'vite-plugin-solid';
import UnoCSS from 'unocss/vite';
import { createHash } from 'crypto';

// Plugin to add query string cache busting to asset URLs
function cacheBustPlugin(): Plugin {
  return {
    name: 'cache-bust',
    enforce: 'post',
    generateBundle(_, bundle) {
      const hashes: Record<string, string> = {};

      // Compute short hash for each asset
      for (const [name, chunk] of Object.entries(bundle)) {
        if (chunk.type === 'chunk' || chunk.type === 'asset') {
          const content = chunk.type === 'chunk' ? chunk.code : chunk.source;
          const hash = createHash('md5')
            .update(content)
            .digest('hex')
            .slice(0, 8);
          hashes[name] = hash;
        }
      }

      // Update HTML with query strings
      const html = bundle['index.html'];
      if (html && html.type === 'asset' && typeof html.source === 'string') {
        let content = html.source;
        for (const [name, hash] of Object.entries(hashes)) {
          // Match src="/app.js" or href="/app.css"
          const pattern = new RegExp(`((?:src|href)="/)${name.replace('.', '\\.')}(")`,'g');
          content = content.replace(pattern, `$1${name}?v=${hash}$2`);
        }
        html.source = content;
      }
    },
  };
}

export default defineConfig({
  plugins: [UnoCSS(), solid(), cacheBustPlugin()],
  build: {
    minify: 'esbuild',
    target: 'esnext',
    assetsDir: '',
    rollupOptions: {
      output: {
        // Fixed filenames for embedded firmware serving
        entryFileNames: 'app.js',
        chunkFileNames: 'app.js',
        assetFileNames: 'app.[ext]',
      },
    },
  },
});

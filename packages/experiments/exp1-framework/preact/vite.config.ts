import { defineConfig, Plugin } from 'vite';
import preact from '@preact/preset-vite';
import { createHash } from 'crypto';

// Plugin to add query string cache busting to asset URLs
function cacheBustPlugin(): Plugin {
  return {
    name: 'cache-bust',
    enforce: 'post',
    generateBundle(_, bundle) {
      const hashes: Record<string, string> = {};

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

      const html = bundle['index.html'];
      if (html && html.type === 'asset' && typeof html.source === 'string') {
        let content = html.source;
        for (const [name, hash] of Object.entries(hashes)) {
          const pattern = new RegExp(
            `((?:src|href)="/)${name.replace('.', '\\.')}(")`,
            'g'
          );
          content = content.replace(pattern, `$1${name}?v=${hash}$2`);
        }
        html.source = content;
      }
    },
  };
}

export default defineConfig({
  plugins: [preact(), cacheBustPlugin()],
  build: {
    target: 'es2022',
    minify: 'esbuild',
    assetsDir: '',
    rollupOptions: {
      output: {
        entryFileNames: 'app.js',
        chunkFileNames: 'app.js',
        assetFileNames: 'app.[ext]',
        manualChunks: undefined,
      },
    },
  },
});

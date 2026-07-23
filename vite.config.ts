import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, Plugin } from 'vite';

function saveProjectFilesPlugin(): Plugin {
  return {
    name: 'save-project-files',
    configureServer(server) {
      server.middlewares.use('/api/save-animations', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => (body += chunk));
          req.on('end', () => {
            try {
              const { clips, poses, standingPose } = JSON.parse(body);
              const targetPath = path.resolve(__dirname, 'src/data/defaultAnimations.ts');

              const fileContent = `import { AnimationClip, StandingPoseConfig, PosePreset } from '../types/animation';\n\n` +
                `export const DEFAULT_STANDING_POSE: StandingPoseConfig = ${JSON.stringify(standingPose, null, 2)};\n\n` +
                `export const POSE_PRESETS: PosePreset[] = ${JSON.stringify(poses || [], null, 2)};\n\n` +
                `export const DEFAULT_CLIPS: AnimationClip[] = ${JSON.stringify(clips || [], null, 2)};\n`;

              fs.writeFileSync(targetPath, fileContent, 'utf8');
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, message: 'Saved to src/data/defaultAnimations.ts' }));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err?.message || 'Failed to save' }));
            }
          });
        } else {
          res.statusCode = 405;
          res.end();
        }
      });
    },
  };
}

function zaiApiProxyPlugin(): Plugin {
  return {
    name: 'zai-api-proxy',
    configureServer(server) {
      server.middlewares.use('/api/zai-chat', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => (body += chunk));
          req.on('end', async () => {
            try {
              const parsed = JSON.parse(body);
              const apiKey = parsed.apiKey || '24c2579bc417433796ec7043de22fa7b.doaVgFuwK69cvmLO';
              
              const endpoints = [
                'https://open.bigmodel.cn/api/paas/v4/chat/completions',
                'https://api.z.ai/api/paas/v4/chat/completions'
              ];

              let lastErr = null;
              for (const url of endpoints) {
                try {
                  const zaiResponse = await fetch(url, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Accept-Language': 'en-US,en',
                      'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                      model: 'glm-4.5-flash',
                      messages: parsed.messages,
                      temperature: 0.7,
                      max_tokens: 150
                    })
                  });

                  if (zaiResponse.ok) {
                    const text = await zaiResponse.text();
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(text);
                    return;
                  }
                } catch (e) {
                  lastErr = e;
                }
              }

              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Failed to reach Z.AI endpoints', details: String(lastErr) }));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err?.message || 'Z.AI Proxy Error' }));
            }
          });
        } else {
          res.statusCode = 405;
          res.end();
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    base: '/AI-GIRL-FRIEND/',
    plugins: [react(), tailwindcss(), saveProjectFilesPlugin(), zaiApiProxyPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

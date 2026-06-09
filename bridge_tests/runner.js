import express from 'express';
import { spawn } from 'child_process';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 4000;

app.use(express.static(path.join(__dirname, 'runner-ui')));

app.get('/api/run', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const { tag, headed } = req.query;
  const reporterPath = path.join(__dirname, 'reporter.js');
  const args = [
    'playwright', 'test',
    `--reporter=${reporterPath}`,
    '--project=chromium',
  ];
  if (tag) args.push('--grep', tag);
  if (headed) args.push('--headed');

  const pw = spawn('npx', args, { cwd: __dirname });
  const rl = readline.createInterface({ input: pw.stdout });

  rl.on('line', (line) => {
    try {
      JSON.parse(line);
      res.write(`data: ${line}\n\n`);
    } catch {
      // skip non-JSON lines (e.g. Playwright startup banner)
    }
  });

  pw.on('close', () => res.end());
  req.on('close', () => pw.kill());
});

app.listen(PORT, () => {
  console.log(`Bridge Test Lab → http://localhost:${PORT}`);
});

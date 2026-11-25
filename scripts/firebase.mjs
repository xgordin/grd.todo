import { existsSync, readdirSync } from 'node:fs';
import { delimiter, dirname, join } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const projectDirectory = fileURLToPath(new URL('../', import.meta.url));
const toolsDirectory = join(projectDirectory, '.firebase', 'tools');
const environment = { ...process.env };
const args = process.argv.slice(2);
const pathKey = Object.keys(environment).find((key) => key.toLowerCase() === 'path') ?? 'PATH';
environment[pathKey] = `${dirname(process.execPath)}${delimiter}${environment[pathKey] ?? ''}`;

environment.FIREBASE_EMULATORS_PATH = join(projectDirectory, '.firebase', 'cache');

// Prefer the project-local Java runtime when it is available.
if (existsSync(toolsDirectory)) {
  const javaExecutable = process.platform === 'win32' ? 'java.exe' : 'java';
  const runtime = readdirSync(toolsDirectory, { withFileTypes: true }).find(
    (entry) => entry.isDirectory() && existsSync(join(toolsDirectory, entry.name, 'bin', javaExecutable)),
  );

  if (runtime) {
    environment.JAVA_HOME = join(toolsDirectory, runtime.name);
    environment[pathKey] = `${join(environment.JAVA_HOME, 'bin')}${delimiter}${environment[pathKey]}`;
  }
}

if (
  args[0] === 'emulators:start' &&
  !args.some((arg) => arg.startsWith('--import')) &&
  existsSync(join(projectDirectory, '.firebase', 'data', 'firebase-export-metadata.json'))
) {
  args.push('--import=.firebase/data');
}

const cli = spawn(
  process.execPath,
  [join(projectDirectory, 'node_modules', 'firebase-tools', 'lib', 'bin', 'firebase.js'), ...args],
  { cwd: projectDirectory, env: environment, stdio: 'inherit', windowsHide: true },
);

cli.on('error', (error) => {
  console.error(error.message);
  process.exitCode = 1;
});

cli.on('exit', (code) => {
  process.exitCode = code ?? 1;
});

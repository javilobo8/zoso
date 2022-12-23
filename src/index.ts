import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import mkdirp from 'mkdirp';
import Handlebars from 'handlebars';
import { program } from 'commander';

import {
  decrypt,
  encrypt,
  encryptAdvanced,
  decryptAdvanced,
} from './cypher';
import { joinText, splitText } from './utils';

const currentDir = process.cwd();

const HOSTS_FILE = path.join(currentDir, 'variables/hosts.yml');
const SECRETS_FILE = path.join(currentDir, 'variables/secrets.yml');
const CONFIGS_DIR = path.join(currentDir, 'configs');
const TEMPLATES_DIR = path.join(currentDir, 'templates');

const CONFIGMAPS_DIR = path.join(currentDir, 'configmaps');
const CONFIGTEMPLATES_DIR = path.join(currentDir, 'configtemplates');

function isContentEncrypted(content: string) {
  return content.split(':').length === 2 && /^[a-f0-9]{32}:{1}[a-f0-9\r\n]+$/.test(content);
}

function renderCommand(str: string) {
  console.log('renderCommand', str);
}

function encryptCommand(str: string) {
  const decryptedSecretsContent = fs.readFileSync(SECRETS_FILE, 'utf8');
  if (isContentEncrypted(decryptedSecretsContent)) {
    throw new Error('Secrets file already encrypted');
  }
  const encryptedContent = encrypt(decryptedSecretsContent);
  const finalText = splitText(encryptedContent);
  fs.writeFileSync(SECRETS_FILE, finalText);
  console.log(`File ${SECRETS_FILE} encrypted`);
}

function decryptCommand(str: string) {
  const encryptedSecretsContent = fs.readFileSync(SECRETS_FILE).toString('utf-8');
  if (!isContentEncrypted(encryptedSecretsContent)) throw new Error('File is already decrypted');
  const content = joinText(encryptedSecretsContent);
  fs.writeFileSync(SECRETS_FILE, decrypt(content));
  console.log(`File ${SECRETS_FILE} decrypted`);
}

program
  .name('zoso')
  .description('generate configmaps and secrets from yaml files');

program.command('render')
  .description('render a configmap')
  .argument('[service]', 'service name')
  .action(renderCommand);

program.command('encrypt')
  .description('encrypt secrets.yml')
  .action(encryptCommand);

program.command('decrypt')
  .description('decrypt secrets.yml')
  .action(decryptCommand);

program.parse();
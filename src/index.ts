#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import Handlebars from 'handlebars';
import { program } from 'commander';

import {
  decrypt,
  encrypt,
  encryptAdvanced,
} from './cypher';
import { joinText, splitText, isContentEncrypted } from './utils';

const currentDir = process.cwd();

const HOSTS_FILE = path.join(currentDir, 'variables/hosts.yml');
const SECRETS_FILE = path.join(currentDir, 'variables/secrets.yml');
const CONFIGMAPS_DIR = path.join(currentDir, 'configmaps');
const CONFIGTEMPLATES_DIR = path.join(currentDir, 'configtemplates');

Handlebars.registerHelper('encryptNode', (value, context) => {
  if (value === undefined) {
    throw new Error('Handlebars variable is undefined');
  }
  return `ENC(${encryptAdvanced(value, context.data.root.servicePassword)})`;
});

function getSecrets(): any {
  const fileContent = fs.readFileSync(SECRETS_FILE).toString('utf-8');
  if (!isContentEncrypted(fileContent)) {
    throw new Error('Secrets file is decrypted');
  }
  const decrypted = decrypt(joinText(fileContent));
  return yaml.load(decrypted);
}

function getHosts(): any {
  const fileContent = fs.readFileSync(HOSTS_FILE).toString('utf-8');
  return yaml.load(fileContent);
}

function indentText(text: string, indent = 6) {
  const lines = text.split('\r\n');
  return lines.map((line) => `${' '.repeat(indent)}${line}`).join('\n');
}

function generateConfigTemplate(serviceName: string) {
  const configTemplateFilePath = path.join(CONFIGTEMPLATES_DIR, `${serviceName}.config.yml.hbs`);
  const configMapTemplateFilePath = path.join(CONFIGTEMPLATES_DIR, `${serviceName}.configmap.yml.hbs`);
  const configMapTargetFilePath = path.join(CONFIGMAPS_DIR, `${serviceName}.configmap.yml`);
  const secretTargetFilePath = path.join(CONFIGMAPS_DIR, `${serviceName}.secret.yml`);

  const variables: any = {
    ...getSecrets(),
    ...getHosts(),
  };

  if (!variables.service_secrets[serviceName]) {
    throw new Error(`Service "${serviceName}" does not have service_secret`);
  }

  const configTemplateFile = fs.readFileSync(configTemplateFilePath).toString('utf-8');
  const configMapTemplateFile = fs.readFileSync(configMapTemplateFilePath).toString('utf-8');

  const renderedConfig = Handlebars.compile(configTemplateFile)({
    ...variables,
    servicePassword: variables.service_secrets[serviceName],
  });

  const renderedConfigTemplate = Handlebars.compile(configMapTemplateFile)({
    config: indentText(renderedConfig),
  });

  fs.writeFileSync(configMapTargetFilePath, renderedConfigTemplate);

  console.log(`[secrets] Rendering secrets file for service "${serviceName}"`);
  const secretsYaml = yaml.dump({
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: {
      name: serviceName,
    },
    stringData: {
      password: variables.service_secrets[serviceName],
    },
  }, { lineWidth: -1 });
  fs.writeFileSync(secretTargetFilePath, secretsYaml);
  console.log(`[secrets] Done rendering secrets file for service "${serviceName}"`);
}

function renderCommand(serviceName: string) {
  if (serviceName) {
    generateConfigTemplate(serviceName);
  }
}

function encryptCommand() {
  const decryptedSecretsContent = fs.readFileSync(SECRETS_FILE, 'utf8');
  if (isContentEncrypted(decryptedSecretsContent)) {
    throw new Error('Secrets file already encrypted');
  }
  const encryptedContent = encrypt(decryptedSecretsContent);
  const finalText = splitText(encryptedContent);
  fs.writeFileSync(SECRETS_FILE, finalText);
  console.log(`File ${SECRETS_FILE} encrypted`);
}

function decryptCommand() {
  const encryptedSecretsContent = fs.readFileSync(SECRETS_FILE).toString('utf-8');
  if (!isContentEncrypted(encryptedSecretsContent)) {
    throw new Error('Secrets file already decrypted');
  }
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

program.command('version')
  .description('show version')
  .action(() => console.log(require('../package.json').version));

program.parse();
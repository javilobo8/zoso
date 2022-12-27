# @javilobo8/zoso

Disclaimer: I've created this package for personal use, is not intented to be maintained for public use.

## Description

## Installation

```
npm i -S -g @javilobo8/zoso
```

## Usage

Decrypt secrets
```
zoso decrypt
```

Encrypt secrets
```
zoso encrypt
```

Render single template
```
zoso render <service-name>
```

## Project structure

This package is intended to be used in a project with the following structure:

```
.
├─ configmaps
│  ├─ service-1-api.configmap.yml
│  └─ service-2-api.configmap.yml
├─ configtemplates
│  ├─ service-1-api.config.yml.hbs
│  ├─ service-1-api.configmap.yml.hbs
│  ├─ service-2-api.config.yml.hbs
│  └─ service-2-api.configmap.yml.hbs
└─ variables
   ├─ hosts.yml
   ├─ general.yml
   └─ secrets.yml
```

Needed files:

`configtemplates/service-1-api.config.yml.hbs`
```
port: 80
clienthost: https://testhost.com
mongo:
  uri: 'mongodb://{{ encryptNode secrets.mongo.user }}:{{ encryptNode secrets.pass }}@{{ hosts.mongo_primary }}:27017/dbname'
```

`configtemplates/service-1-api.configmap.yml.hbs`
```yml
apiVersion: v1
kind: ConfigMap
metadata:
  name: service-1-api
  namespace: production
data:
  config.yml: |-
{{{ config }}}
```

`variables/general.yml`
```yml
general:
  some-general-var: 'value'
```

`variables/hosts.yml`
```yml
hosts:
  mongo_primary: '10.10.10.10'
```

`variables/secrets.yml`
```yml
service_secrets:
  service-1-api: XXXXXXXXXXXXXXXX
  service-2-api: YYYYYYYYYYYYYYYY
secrets:
  mongo:
    user: test
    pass: XXXXYYYZZZZ
```
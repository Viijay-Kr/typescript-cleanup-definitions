# Typescript CleanUp Definitions

-   [Typescript CleanUp Definitions](#typescript-cleanup-definitions)
    -   [What is it ?](#what-is-it-)
    -   [Installation](#installation)
    -   [Usage](#usage)
        -   [TS Config](#ts-config)
        -   [VS Code Extension](#vs-code-extension)
    -   [Settings](#settings)

## What is it ?

`typescript-cleanup-defs` is a simple typescript plugin that filters out [Go to definition](https://code.visualstudio.com/Docs/editor/editingevolved#_go-to-type-definition) results from any given set of declaration files

## Installation

`npm install typescript-cleanup-defs`

or

`yarn add typescript-cleanup-defs`

## Usage

### TS Config

Add the plugin to the `tsconfig.json`'s `compilerOptions`

```json
{
    "compilerOptions": {
        "plugins": [
            {
                "name": "typescript-cleanup-defs",
                "enable": true,
                "modules": ["*.module.css", "*.client.d.ts"]
            }
        ]
    }
}
```

### VS Code Extension

Add it as a typescript server plugin to the `package.json` `contributes` section

```json
  "contributes":{
    ...config
    "typescriptServerPlugins": [
     {
       "enableForWorkspaceTypeScriptVersions": true,
       "name": "typescript-cleanup-definitions"
     }
   ]
  }
```

To configure the plugin at time of activation of your extension , follow this [guide](https://code.visualstudio.com/api/references/contribution-points#contributes.typescriptServerPlugins)

## Settings

-   `enable`
    -   Enable or disable this plugin. Defaults to `true`
-   `modules`
    -   List of module extensions the plugin should omit the definitions from

## Typescript CleanUp Definitions

`typescript-cleanup-defs` is a simple typescript plugin that filters out [Go to definition](https://code.visualstudio.com/Docs/editor/editingevolved#_go-to-type-definition) results from any given declration file

## Installation
`npm install typescript-cleanup-defs` 

or 

`yarn add typescript-cleanup-defs`

## Usage

Add it as plugin to `tsconfig.json`

```json
 {
   "compilerOptions":{
    "plugins":[{
        "name":"typescript-cleanup-defs",
        "enable":true,
        "modules":[
            "node_modules/vite/client.d.ts", // all definition results from this declration module will be filtered out
            ...
        ]
    }]
   }
 }
 ```

 ## Settings
 #### `enable`
 Enable or disable this plugin. Defaults to `true`
 #### `modules`
 List of modules the plugin should omit the definitions from
# vue-codemirror@6.1.1

> CodeMirror code editor component for Vue

## Package Info

- **Install:** `npm install vue-codemirror`
- **License:** MIT
- **Repository:** https://github.com/surmon-china/vue-codemirror
- **Homepage:** https://github.surmon.me/vue-codemirror

## README

vue-codemirror

 

 

 

 

CodeMirror(6) component for Vue(3).
vue-codemirror v5/v6 has been released. This is a new version based on CodeMirror@6 and is available to Vue3 only. Since CodeMirror@6 is developed with native ES Modules, the new version will no longer support direct browser references to UMD modules. In short, the new version is ⚠️ completely NOT compatible with previous versions. If you wish to continue using Vue2 or a lower version of CodeMirror, please refer to the legacy versions below.
This example site contains most of what you want.
Legacy version

examples (Vue2)
vue-codemirror@4.x (Vue2 / CodeMirror5)

Documentation

CodeMirror6 Guide
CodeMirror6 APIs
CodeMirror6 Examples
CodeMirror6 Example: Writing a Language Package
CodeMirror6 Example: Styling
CodeMirror Forum

CodeMirror packages

CodeMirror6 Languages
CodeMirror6 Themes

Usage
Install
yarn add codemirror vue-codemirrornpm install codemirror vue-codemirror --saveDepending on your actual needs, you may need to install more CodeMirror packages

# CodeMirror languages...

yarn add @codemirror/lang-html
yarn add @codemirror/lang-json
yarn add @codemirror/lang-javascript

# CodeMirror themes...

yarn add @codemirror/theme-one-dark

# more CodeMirror packages...If you need import API/interface from codemirror, you need to make codemirror explicitly dependent in your package.json

e.g.
"dependencies": {
"@codemirror/state": "6.x"
}import { EditorState } from '@codemirror/state'Local component
<template>
<codemirror
v-model="code"
placeholder="Code goes here..."
:style="{ height: '400px' }"
:autofocus="true"
:indent-with-tab="true"
:tab-size="2"
:extensions="extensions"
@ready="handleReady"
@change="log('change', $event)"
@focus="log('focus', $event)"
@blur="log('blur', $event)"
/>
</template>

<script>
  import { defineComponent } from 'vue'
  import { Codemirror } from 'vue-codemirror'
  import { javascript } from '@codemirror/lang-javascript'
  import { oneDark } from '@codemirror/theme-one-dark'

  export default defineComponent({
    components: {
      Codemirror
    },
    setup() {
      const code = ref(`console.log('Hello, world!')`)
      const extensions = [javascript(), oneDark]

      // Codemirror EditorView instance ref
      const view = shallowRef()
      const handleReady = (payload) => {
        view.value = payload.view
      }

      // Status is available at all times via Codemirror EditorView
      const getCodemirrorStates = () => {
        const state = view.value.state
        const ranges = state.selection.ranges
        const selected = ranges.reduce((r, range) => r + range.to - range.from, 0)
        const cursor = ranges[0].anchor
        const length = state.doc.length
        const lines = state.doc.lines
        // more state info ...
        // return ...
      }

      return {
        code,
        extensions,
        handleReady,
        log: console.log
      }
    }
  })
</script>Global component

import { createApp } from 'vue'
import { basicSetup } from 'codemirror'
import VueCodemirror from 'vue-codemirror'

const app = createApp()

app.use(VueCodemirror, {
// optional default global options
autofocus: true,
disabled: false,
indentWithTab: true,
tabSize: 2,
placeholder: 'Code goes here...',
extensions: [basicSetup]
// ...
})Component Props

prop
description
type
default

modelValue
The input values accepted by the component also support two-way binding.
String
''

autofocus
Focus editor immediately after mounted.
Boolean
false

disabled
Disable input behavior and disable change state.
Boolean
false

indentWithTab
Bind keyboard Tab key event.
Boolean
true

tabSize
Specify the indent when the Tab key is pressed.
Number
2

placeholder
Display when empty.
String
''

style
The CSS style object that acts on the CodeMirror itself.
Object
{}

phrases
Codemirror internationalization phrases.
Object
{}

autoDestroy
Auto destroy the CodeMirror instance before the component unmount.
Boolean
true

extensions
Passed to CodeMirror EditorState.create({ extensions })
Extension
[]

selection
Passed to CodeMirror EditorState.create({ selection })
EditorSelection

-

root
Passed to CodeMirror new EditorView({ root })
ShadowRoot | Document

-

Component Events

event
description
params

update:modelValue
Only when the CodeMirror content (doc) has changed.
(value: string, viewUpdate: ViewUpdate)

change
ditto
ditto

update
When any state of CodeMirror changes.
(viewUpdate: ViewUpdate)

focus
When CodeMirror focused.
(viewUpdate: ViewUpdate)

blur
When CodeMirror blurred.
(viewUpdate: ViewUpdate)

ready
When edirot component mounted.
(payload: { view: EditorView; state: EditorState; container: HTMLDivElement })

Basic Setup
The basic-setup extension is integrated by default in the vue-codemirror configuration and is intended as a handy helper to quickly set up CodeMirror without having to install and import a lot of standalone packages. If you want to override the default behavior of the config, just pass the empty array when installing the component globally.
app.use(VueCodemirror, {
// keep the global default extensions empty
extensions: []
})Changelog
Detailed changes for each release are documented in the release notes.
License
Licensed under the MIT License.

/* tslint:disable */
/**
 * @license MirrorMark v0.1
 * (c) 2015 Musicbed http://www.musicbed.com
 * (c) SquidDev https://github.com/SquidDev/MirrorMark
 * License: MIT
 */

import * as CodeMirror from 'codemirror'
import * as Markdown from 'pagedown'

import './styles.css'

class MirrorMark {

  constructor(element, options) {
    this.element = element
    this.options = options
    this.isEdit = true

    this.tools = [
      {name: 'bold', action: 'bold', className: 'fa fa-bold'},
      {name: 'italicize', action: 'italicize', className: 'fa fa-italic'},
      {name: 'blockquote', action: 'blockquote', className: 'fa fa-quote-left'},
      {name: 'link', action: 'link', className: 'fa fa-link'},
      {name: 'nodelink', action: 'nodelink', className: 'fa fa-connectdevelop'},
      {name: 'image', action: 'image', className: 'fa fa-image'},
      {name: 'unorderedList', action: 'unorderedList', className: 'fa fa-list'},
      {name: 'orderedList', action: 'orderedList', className: 'fa fa-list-ol'},
      {name: 'fullScreen', action: 'fullScreen', className: 'fa fa-expand', toggleClass: "fa fa-compress"},
      {name: 'preview', action: 'preview', className: 'fa fa-file', toggleClass: 'fa fa-file-o'}
    ]

    this.keyMaps = {
      // NOTE: For now remember to register Mac (Cmd-) versions too
      'Ctrl-B': 'bold',
      'Ctrl-I': 'italicize',
      'Ctrl-\'': 'blockquote',
      'Ctrl-Alt-L': 'orderedList',
      'Ctrl-L': 'unorderedList',
      'Ctrl-Alt-I': 'image',
      'Ctrl-H': 'hr',
      'Ctrl-K': 'link',
      // TODO: Reduce this duplication and automate setup of both Ctrl and Cmd prefixes
      'Cmd-B': 'bold',
      'Cmd-I': 'italicize',
      'Cmd-\'': 'blockquote',
      'Cmd-Alt-L': 'orderedList',
      'Cmd-L': 'unorderedList',
      'Cmd-Alt-I': 'image',
      'Cmd-H': 'hr',
      'Cmd-K': 'link',
    }

    this.actions = {
      bold: function () {
        this.insertAround('**', '**')
      },
      italicize: function () {
        this.insertAround('*', '*')
      },
      code: function () {
        this.insertAround('```\r\n', '\r\n```')
      },
      blockquote: function () {
        this.insertBefore('> ', 2)
      },
      orderedList: function () {
        this.insertBefore('1. ', 3)
      },
      unorderedList: function () {
        this.insertBefore('* ', 2)
      },
      image: function () {
        this.insertBefore('![](http://)', 2)
      },
      link: function () {
        this.insertAround('[', '](http://)')
      },
      nodelink: function() {
        this.insertAround('[', '](note:)')
      },
      hr: function () {
        this.insert('---')
      },
      fullScreen: function () {
        const el = this.cm.getWrapperElement()

        // https://developer.mozilla.org/en-US/docs/DOM/Using_fullscreen_mode
        const doc = document
        const isFull = (doc.fullscreenElement || doc.webkitFullscreenElement 
          || doc.mozFullScreenElement || doc.msFullscreenElement)
        const request = function() {
          if (el.requestFullscreen) {
            el.requestFullscreen()
          } else if (el.webkitRequestFullscreen) {
            el.webkitRequestFullscreen()
          } else if (el.mozRequestFullScreen) {
            el.mozRequestFullScreen()
          } else if (el.msRequestFullscreen) {
            el.msRequestFullscreen()
          }
        }
        const exit = function() {
          if (doc.exitFullscreen) {
            doc.exitFullscreen()
          } else if (doc.webkitExitFullscreen) {
            doc.webkitExitFullscreen()
          } else if (doc.mozExitFullScreen) {
            doc.mozExitFullScreen()
          } else if (doc.msExitFullscreen) {
            doc.msExitFullscreen()
          }
        }
        const cancel = function() {
          if (doc.cancelFullScreen) {
            doc.cancelFullScreen()
          } else if (doc.mozCancelFullScreen) {
            doc.mozCancelFullScreen()
          } else if (doc.webkitCancelFullScreen) {
            doc.webkitCancelFullScreen()
          }
        }
        if (!isFull) {
          request()
        } else if (isFull) {
          exit()
        } else if (cancel) {
          cancel()
        }
      },
      preview: function() {
        const setPreviewMode = function(cm) {
          var converter = new Markdown.Converter()
          var wrap = cm.getWrapperElement()
          wrap.className += ' CodeMirror-has-preview'
          var previewNodes = wrap.getElementsByClassName("CodeMirror-preview")
          var previewNode

          if(previewNodes.length == 0) {
            var previewNode = document.createElement('div')
            previewNode.className = "CodeMirror-preview"
            wrap.appendChild(previewNode)
          } else {
            previewNode = previewNodes[0]
          }

          previewNode.innerHTML = converter.makeHtml(cm.getValue())
          var anchors = document.getElementsByTagName("a")
          for(var i = 0; i < anchors.length; i++){
            var anchor = anchors[i]

            // If the anchor is not a redirection link, the skip.
            if(anchor.href === ""){
              continue
            }

            anchor.onclick = (el) => {
              var hyperlink = el.target.href
              if(hyperlink.substring(0,5) === "note:"){
                var noteId = hyperlink.substring(5)
                var textEditor = document.getElementById("editor-container")
                var event = new CustomEvent("reference", {detail: noteId})
                textEditor.dispatchEvent(event)
                return false
              }
              return true
            }
          }
        }
        const setEditMode = function(cm) {
          var wrap = cm.getWrapperElement()
          wrap.className = wrap.className.replace(/\s*CodeMirror-has-preview\b/, "")
          cm.refresh()
        }
        this.isEdit ? setPreviewMode(this.cm) : setEditMode(this.cm)
        this.isEdit = !this.isEdit
      }
    }
  }

  /**
   * Render the component
   */
  render() {
    this.registerKeyMaps(this.keyMaps)
    this.cm = CodeMirror.fromTextArea(this.element, this.options)

    if (this.options.showToolbar) {
      this.setToolbar(this.tools)
    }
  }

  /**
   * Set the editor's content
   */
  setValue(data) {
    return this.cm.getDoc().setValue(data)
  }

  /**
   * Get the editor's content
   */
  getValue(data) {
    return this.cm.getDoc().getValue()
  }

  /**
   * Setup the toolbar
   */
  setToolbar(tools) {
    const toolbar = document.createElement('ul')
    toolbar.className = this.options.theme + '-toolbar'

    this.generateToolList(tools)
      .forEach(function(tool) {
        toolbar.appendChild(tool)
      })

    const cmWrapper = this.cm.getWrapperElement()
    cmWrapper.insertBefore(toolbar, cmWrapper.firstChild)
  }

  /**
   * Register Keymaps by extending the extraKeys object
   * @param {Object} keyMaps
   */
  registerKeyMaps(keyMaps) {
    for (const name in keyMaps) {
      if (typeof(this.actions[keyMaps[name]]) !== 'function')
        throw 'MirrorMark - \'' + keyMaps[name] + '\' is not a registered action'

      const obj = {}
      obj[name] = this.actions[keyMaps[name]].bind(this)
      Object.assign(this.options.extraKeys, obj)
    }
  }

  /**
   * Register actions by extending the default actions
   * @param  {Object} actions [description]
   */
  registerActions(actions) {
    return Object.assign(this.actions, actions)
  }

  /**
   * Register tools by extending and overwriting the default tools
   * @param  {Array} tools
   * @param  {Bool} replace - replace the default tools with the ones provided. Defaults
   *   to false.
   */
  registerTools(tools, replace) {
    for (const action in tools) {
      if (this.actions[tools[action].action]
          && typeof(this.actions[tools[action].action]) !== 'function')
        throw 'MirrorMark - \'' + tools[action].action + '\' is not a registered action'
    }

    if (replace) {
      this.tools = tools
      return
    }

    this.tools = this.tools.concat(tools)
  }

  /**
   * A recursive function to generate and return an unordered list of tools
   * @param  {Object}
   */
  generateToolList(tools) {
    return tools.map(function(tool) {
      const item = document.createElement('li'),
        anchor = document.createElement('a')

      item.className = tool.name

      if (tool.className) {
        anchor.className = tool.className
      }

      if (tool.showName) {
        const text = document.createTextNode(tool.name)
        anchor.appendChild(text)
      }

      if (tool.action) {
        anchor.onclick = function(e) {
          this.cm.focus()
          this.actions[tool.action].call(this)
          if(tool.toggleClass) {
            var classes = anchor.className.split(" "),
            remove = tool.className.split(" "),
            add = tool.toggleClass.split(" ")
            add.push("active")
            if(classes.indexOf("active") >= 0) {
              var temp = add
              add = remove
              remove = temp
            }
            classes = classes.filter(function(item) { return remove.indexOf(item) === -1 });
            [].push.apply(classes, add)
            anchor.className = classes.join(" ")
          }
        }.bind(this)
      }

      item.appendChild(anchor)

      if (tool.nested) {
        item.className += ' has-nested'
        const ul = document.createElement('ul')
        ul.className = this.options.theme + '-toolbar-list'
        const nested = generateToolList.call(this, tool.nested)
        nested.forEach(function(nestedItem) {
          ul.appendChild(nestedItem)
        })

        item.appendChild(ul)
      }

      return item

    }.bind(this))
  }

  /**
   * Insert a string at cursor position
   * @param  {String} insertion
   */
  insert(insertion) {
    const doc = this.cm.getDoc()
    const cursor = doc.getCursor()

    doc.replaceRange(insertion, { line: cursor.line, ch: cursor.ch })
  }

  /**
   * Insert a string at the start and end of a selection
   * @param  {String} start
   * @param  {String} end
   */
  insertAround(start, end) {
    const doc = this.cm.getDoc()
    const cursor = doc.getCursor()

    if (doc.somethingSelected()) {
      const selection = doc.getSelection()
      doc.replaceSelection(start + selection + end)
    } else {
      // If no selection then insert start and end args and set cursor position
      // between the two.
      doc.replaceRange(start + end, {line: cursor.line, ch: cursor.ch})
      doc.setCursor({line: cursor.line, ch: cursor.ch + start.length})
    }
  }

  /**
   * Insert a string before a selection
   * @param  {String} insertion
   */
  insertBefore(insertion, cursorOffset) {
    const doc = this.cm.getDoc()
    const cursor = doc.getCursor()

    if (doc.somethingSelected()) {
      const selections = doc.listSelections()
      selections.forEach(function(selection) {
        const pos = [selection.head.line, selection.anchor.line].sort()

        for (const i = pos[0]; i <= pos[1]; i++) {
          doc.replaceRange(insertion, { line: i, ch: 0 })
        }

        doc.setCursor({ line: pos[0], ch: cursorOffset || 0 })
      })
    } else {
      doc.replaceRange(insertion, { line: cursor.line, ch: 0 })
      doc.setCursor({ line: cursor.line, ch: cursorOffset || 0 })
    }
  }

}

/**
 * Factory
 * @param  {Object} element
 * @param  {Object} options
 * @return {Object}
 */
export default function mirrorMark(element, options) {
  // Defaults
  const defaults = {
    theme: 'mirrormark',
    tabSize: '2',
    indentWithTabs: true,
    lineWrapping: true,
    extraKeys: {
      'Enter': 'newlineAndIndentContinueMarkdownList',
    },
    mode: 'markdown',
  }

  return new MirrorMark(
    element,
    {
      // Extend our defaults with the options provided
      ...defaults,
      ...options,
    },
  )
}

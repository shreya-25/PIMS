import React, { useRef, useState } from "react";
import "./RichTextEditor.css";

const RichTextEditor = () => {
  const editorRef = useRef(null);
  const codeRef = useRef(null);
  const [showCode, setShowCode] = useState(false);
  const [displayContent, setDisplayContent] = useState("");

  const execCmd = (command, value = null) => {
    document.execCommand(command, false, value);
  };

  const toggleCodeView = () => {
    const editor = editorRef.current;
    const code = codeRef.current;

    if (!showCode) {
      code.value = formatHTML(editor.innerHTML);
    } else {
      editor.innerHTML = code.value;
    }

    setShowCode(!showCode);
  };

  const formatHTML = (html) => {
    return html
      .replace(/<br>/g, "<br/>")
      .replace(/<hr>/g, "<hr/>")
      .replace(/<img(.*?)>/g, "<img$1/>")
      .replace(/<input(.*?)>/g, "<input$1/>")
      .replace(/<meta(.*?)>/g, "<meta$1/>")
      .replace(/<link(.*?)>/g, "<link$1/>");
  };

  const handlePreview = () => {
    const content = editorRef.current.innerHTML;
    setDisplayContent(formatHTML(content));
  };

  return (
    <div>
      <div className="editor-container">
        <div className="toolbar">
          <button title="Bold" onClick={() => execCmd("bold")}><b>B</b></button>
          <button title="Italic" onClick={() => execCmd("italic")}><i>I</i></button>
          <button title="Underline" onClick={() => execCmd("underline")}><u>U</u></button>
          <button title="Strikethrough" onClick={() => execCmd("strikeThrough")}><s>S</s></button>
          <select onChange={(e) => execCmd("fontName", e.target.value)}>
            <option value="Arial">Arial</option>
            <option value="Courier">Courier</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Georgia">Georgia</option>
          </select>
          <select onChange={(e) => execCmd("formatBlock", e.target.value)}>
            <option value="p">Normal</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
          </select>
          <input type="color" onChange={(e) => execCmd("foreColor", e.target.value)} />
          <button onClick={() => execCmd("justifyLeft")}>⯇</button>
          <button onClick={() => execCmd("justifyCenter")}>≡</button>
          <button onClick={() => execCmd("justifyRight")}>⯈</button>
          <button onClick={() => execCmd("createLink", prompt("Enter URL", "http://"))}>🔗</button>
          <button onClick={() => execCmd("insertImage", prompt("Enter image URL", "http://"))}>🖼</button>
          <button onClick={toggleCodeView}>{"</>"}</button>
        </div>

        <div className="editor-wrapper">
          {!showCode ? (
            <div id="editor" ref={editorRef} contentEditable={true}></div>
          ) : (
            <textarea id="code-view" ref={codeRef}></textarea>
          )}
        </div>

        <button className="preview-button" onClick={handlePreview}>Preview</button>
      </div>

      <div className="display-container">
        <h3>Content Preview</h3>
        <div id="display-content" dangerouslySetInnerHTML={{ __html: displayContent }}></div>
      </div>
    </div>
  );
};

export default RichTextEditor;

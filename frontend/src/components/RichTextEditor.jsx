import React, { useState, useRef, useEffect } from 'react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

const RichTextEditor = ({ 
  value = '', 
  onChange, 
  placeholder = 'Masukkan deskripsi tugas...',
  readOnly = false,
  height = '200px'
}) => {
  const quillRef = useRef(null)
  const [editorValue, setEditorValue] = useState(value)

  // Update internal state when external value changes
  useEffect(() => {
    if (value !== editorValue) {
      setEditorValue(value || '')
    }
  }, [value])

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ]
  }

  const formats = [
    'header',
    'bold', 'italic', 'underline',
    'list', 'bullet',
    'link'
  ]

  const handleChange = (content) => {
    setEditorValue(content)
    if (onChange) {
      onChange(content)
    }
  }

  if (readOnly) {
    return (
      <div className="rich-text-editor-readonly">
        <div 
          className="prose max-w-none p-4 bg-gray-50 rounded-lg border"
          dangerouslySetInnerHTML={{ __html: editorValue || '<p class="text-gray-500 italic">No description provided.</p>' }}
        />
      </div>
    )
  }

  return (
    <div className="rich-text-editor">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={editorValue}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={readOnly}
        style={{ 
          height: height,
          marginBottom: '42px'
        }}
      />
    </div>
  )
}

export default RichTextEditor
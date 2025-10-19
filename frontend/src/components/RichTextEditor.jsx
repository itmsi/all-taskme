import React, { useState, useRef } from 'react'
import MDEditor from '@uiw/react-md-editor'

const RichTextEditor = ({ 
  value = '', 
  onChange, 
  placeholder = 'Masukkan deskripsi tugas...',
  readOnly = false,
  height = '200px'
}) => {
  const [markdown, setMarkdown] = useState(value)

  const handleChange = (val) => {
    const newValue = val || ''
    setMarkdown(newValue)
    if (onChange) {
      onChange(newValue)
    }
  }

  // Update internal state when external value changes
  React.useEffect(() => {
    if (value !== markdown) {
      setMarkdown(value || '')
    }
  }, [value])

  if (readOnly) {
    return (
      <div className="rich-text-editor">
        <div className="wmde-markdown-var" data-color-mode="light">
          <MDEditor.Markdown 
            source={markdown} 
            style={{ 
              height: height,
              backgroundColor: 'transparent',
              padding: '16px'
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="rich-text-editor">
      <MDEditor
        value={markdown}
        onChange={handleChange}
        height={height}
        data-color-mode="light"
        placeholder={placeholder}
        preview="edit"
        hideToolbar={false}
        textareaProps={{
          placeholder: placeholder,
          style: {
            fontSize: 14,
            fontFamily: 'inherit',
          },
        }}
        toolbarHeight={40}
        toolbarBottom={false}
      />
    </div>
  )
}

export default RichTextEditor
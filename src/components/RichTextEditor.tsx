import { onMount, createSignal, Component, createEffect } from 'solid-js';

interface RichTextEditorProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
}

const RichTextEditor: Component<RichTextEditorProps> = (props) => {
  let editorRef: HTMLDivElement | undefined;
  const [content, setContent] = createSignal(props.initialContent || '');
  const [isBold, setIsBold] = createSignal(false);
  const [isItalic, setIsItalic] = createSignal(false);
  const [isUnderline, setIsUnderline] = createSignal(false);
  const [isStrikethrough, setIsStrikethrough] = createSignal(false);
  const [currentBlock, setCurrentBlock] = createSignal('p');

  // Check if an element or any of its parents has a specific tag name
  const hasParentWithTag = (element: HTMLElement | null, tagNames: string[]): boolean => {
    while (element) {
      if (tagNames.includes(element.tagName.toLowerCase())) {
        return true;
      }
      element = element.parentElement;
    }
    return false;
  };

  // Check if current selection has a specific style
  const hasStyle = (styleProp: string, value: string): boolean => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;
    
    const range = selection.getRangeAt(0);
    if (range.collapsed) {
      // If selection is collapsed, check the computed style of the parent element
      const node = range.startContainer;
      const element = node.nodeType === Node.TEXT_NODE ? node.parentElement : node as HTMLElement;
      if (element) {
        const computedStyle = window.getComputedStyle(element);
        return computedStyle[styleProp as any] === value;
      }
    } else {
      // For non-collapsed selection, check if any text has the style
      const tempDiv = document.createElement('div');
      tempDiv.appendChild(range.cloneContents());
      return tempDiv.querySelector(`[style*="${styleProp}:${value}"]`) !== null;
    }
    return false;
  };

  // Update editor content and selection state
  const updateEditorState = () => {
    if (!editorRef) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container as HTMLElement;
    
    if (element) {
      // Update text formatting states using modern DOM APIs
      const isBold = hasParentWithTag(element, ['b', 'strong']) || 
                    hasStyle('font-weight', 'bold') || 
                    hasStyle('font-weight', '700');
      
      const isItalic = hasParentWithTag(element, ['i', 'em']) || 
                      hasStyle('font-style', 'italic');
      
      const isUnderline = hasParentWithTag(element, ['u']) || 
                         hasStyle('text-decoration', 'underline');
      
      const isStrikethrough = hasParentWithTag(element, ['s', 'strike', 'del']) || 
                             hasStyle('text-decoration', 'line-through');
      
      setIsBold(isBold);
      setIsItalic(isItalic);
      setIsUnderline(isUnderline);
      setIsStrikethrough(isStrikethrough);
      
      // Update block element
      const blockElement = element.closest('h1, h2, h3, p, div, li, ul, ol');
      if (blockElement) {
        setCurrentBlock(blockElement.tagName.toLowerCase());
      }
    }
    
    // Update content
    const newContent = editorRef.innerHTML;
    setContent(newContent);
    props.onContentChange?.(newContent);
  };

  // Handle text formatting
  const toggleFormat = (format: string) => {
    if (!editorRef) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    // Save the current selection
    const range = selection.getRangeAt(0);
    
    // Apply formatting using modern APIs
    switch (format) {
      case 'bold':
        document.getSelection()?.getRangeAt(0).surroundContents(
          Object.assign(document.createElement('strong'), {
            style: 'font-weight: bold;',
          })
        );
        break;
      case 'italic':
        document.getSelection()?.getRangeAt(0).surroundContents(
          Object.assign(document.createElement('em'), {
            style: 'font-style: italic;',
          })
        );
        break;
      case 'underline':
        document.getSelection()?.getRangeAt(0).surroundContents(
          Object.assign(document.createElement('u'), {
            style: 'text-decoration: underline;',
          })
        );
        break;
      case 'strikeThrough':
        document.getSelection()?.getRangeAt(0).surroundContents(
          Object.assign(document.createElement('s'), {
            style: 'text-decoration: line-through;',
          })
        );
        break;
    }
    
    // Restore selection and update state
    selection.removeAllRanges();
    selection.addRange(range);
    updateEditorState();
  };

  const handleCreateLink = () => {
    const selection = window.getSelection();
    if (!selection?.toString().trim()) {
      alert('Please select text to create a link');
      return;
    }
    
    const url = prompt('Enter URL:');
    if (!url) return;
    
    const range = selection.getRangeAt(0);
    const link = document.createElement('a');
    link.href = url.startsWith('http') ? url : `https://${url}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    
    range.surroundContents(link);
    updateEditorState();
  };

  const handleHeadingChange = (e: Event) => {
    const select = e.target as HTMLSelectElement;
    const value = select.value || 'p';
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const blockElement = range.commonAncestorContainer.parentElement?.closest('h1, h2, h3, p, div');
    
    if (blockElement) {
      const newElement = document.createElement(value);
      newElement.innerHTML = blockElement.innerHTML;
      blockElement.parentNode?.replaceChild(newElement, blockElement);
    } else {
      // If no block element is selected, wrap the current selection
      const newElement = document.createElement(value);
      range.surroundContents(newElement);
    }
    
    updateEditorState();
  };

  const handleFontSizeChange = (e: Event) => {
    const select = e.target as HTMLSelectElement;
    const size = select.value;
    if (!size) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.style.fontSize = `${parseInt(size) * 4 + 12}px`;
    
    range.surroundContents(span);
    updateEditorState();
  };

  const updateContent = () => {
    if (!editorRef) return;
    const newContent = editorRef.innerHTML;
    setContent(newContent);
    props.onContentChange?.(newContent);
  };

  const handlePaste = (e: ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData?.getData('text/plain') || '';
    
    // Insert text at the current cursor position
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    range.deleteContents();
    
    // Create a text node and insert it
    const textNode = document.createTextNode(text);
    range.insertNode(textNode);
    
    // Move the cursor to the end of the inserted text
    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    
    selection.removeAllRanges();
    selection.addRange(range);
    
    updateEditorState();
  };

  const formatAlignment = (alignment: 'left' | 'center' | 'right') => {
    if (!editorRef) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const blockElement = range.commonAncestorContainer.nodeType === Node.TEXT_NODE
      ? range.commonAncestorContainer.parentElement
      : range.commonAncestorContainer as HTMLElement;
    
    if (blockElement) {
      // Remove existing alignment classes
      blockElement.classList.remove('text-left', 'text-center', 'text-right');
      
      // Apply new alignment
      switch (alignment) {
        case 'left':
          blockElement.classList.add('text-left');
          blockElement.style.textAlign = 'left';
          break;
        case 'center':
          blockElement.classList.add('text-center');
          blockElement.style.textAlign = 'center';
          break;
        case 'right':
          blockElement.classList.add('text-right');
          blockElement.style.textAlign = 'right';
          break;
      }
      
      updateEditorState();
    }
  };

  const toggleList = (type: 'ul' | 'ol') => {
    if (!editorRef) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const listItem = range.commonAncestorContainer.nodeType === Node.TEXT_NODE
      ? range.commonAncestorContainer.parentElement?.closest('li')
      : (range.commonAncestorContainer as HTMLElement).closest('li');
    
    if (listItem) {
      // If already in a list, toggle the list type or remove list
      const list = listItem.parentElement;
      if (list && (list.tagName.toLowerCase() === type)) {
        // Convert list item to paragraph
        const p = document.createElement('p');
        p.innerHTML = listItem.innerHTML;
        listItem.parentNode?.replaceChild(p, listItem);
      } else {
        // Change list type
        const newList = document.createElement(type);
        newList.innerHTML = listItem.innerHTML;
        listItem.parentNode?.replaceChild(newList, listItem);
        const newItem = document.createElement('li');
        newList.appendChild(newItem);
        newItem.innerHTML = listItem.innerHTML;
      }
    } else {
      // Create new list
      const list = document.createElement(type);
      const listItem = document.createElement('li');
      list.appendChild(listItem);
      
      // If there's a selection, wrap it in the list item
      if (!selection.isCollapsed) {
        const content = range.extractContents();
        listItem.appendChild(content);
      }
      
      range.insertNode(list);
      
      // Move cursor inside the new list item
      const newRange = document.createRange();
      newRange.selectNodeContents(listItem);
      newRange.collapse(false);
      selection.removeAllRanges();
      selection.addRange(newRange);
    }
    
    updateEditorState();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      
      switch (e.key.toLowerCase()) {
        case 'b':
          toggleFormat('bold');
          break;
        case 'i':
          toggleFormat('italic');
          break;
        case 'u':
          toggleFormat('underline');
          break;
        case 'z':
          document.execCommand('undo');
          break;
        case 'y':
          document.execCommand('redo');
          break;
        default:
          // Allow default behavior for other shortcuts
          return;
      }
    }
  };

  onMount(() => {
    if (editorRef) {
      editorRef.innerHTML = content();
    }
  });

  return (
    <div class="max-w-4xl mx-auto my-8 bg-white rounded-lg shadow-md overflow-hidden">
      <div class="flex flex-wrap gap-1 p-2 bg-gray-50 border-b border-gray-200">
        <button 
          onClick={() => toggleFormat('bold')} 
          title="Bold (Ctrl+B)"
          class="p-2 rounded hover:bg-gray-200 transition-colors"
        ><b>B</b></button>
        
        <button 
          onClick={() => toggleFormat('italic')} 
          title="Italic (Ctrl+I)"
          class="p-2 rounded hover:bg-gray-200 transition-colors"
        ><i>I</i></button>
        
        <button 
          onClick={() => toggleFormat('underline')} 
          title="Underline (Ctrl+U)"
          class="p-2 rounded hover:bg-gray-200 transition-colors"
        ><u>U</u></button>
        
        <button 
          onClick={() => toggleFormat('strikeThrough')} 
          title="Strikethrough"
          class="p-2 rounded hover:bg-gray-200 transition-colors"
        ><s>S</s></button>
        
        <div class="h-8 w-px bg-gray-300 mx-1"></div>
        
        <select 
          onChange={handleHeadingChange} 
          title="Text Style"
          class="p-1 text-sm rounded border border-gray-300 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Normal Text</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>
        
        <select 
          onChange={handleFontSizeChange} 
          title="Font Size"
          class="p-1 text-sm rounded border border-gray-300 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Size</option>
          <option value="1">Small</option>
          <option value="3">Normal</option>
          <option value="5">Large</option>
          <option value="7">Huge</option>
        </select>
        
        <div class="h-8 w-px bg-gray-300 mx-1"></div>
        
        <button 
          onClick={() => formatAlignment('left')} 
          title="Align Left"
          class="p-2 rounded hover:bg-gray-200 transition-colors"
        >◧</button>
        
        <button 
          onClick={() => formatAlignment('center')} 
          title="Center"
          class="p-2 rounded hover:bg-gray-200 transition-colors"
        >☰</button>
        
        <button 
          onClick={() => formatAlignment('right')} 
          title="Align Right"
          class="p-2 rounded hover:bg-gray-200 transition-colors"
        >◨</button>
        
        <div class="h-8 w-px bg-gray-300 mx-1"></div>
        
        <button 
          onClick={() => toggleList('ul')} 
          title="Bullet List"
          class="p-2 rounded hover:bg-gray-200 transition-colors"
        >•</button>
        
        <button 
          onClick={() => toggleList('ol')} 
          title="Numbered List"
          class="p-2 rounded hover:bg-gray-200 transition-colors"
        >1.</button>
        
        <div class="h-8 w-px bg-gray-300 mx-1"></div>
        
        <button 
          onClick={handleCreateLink} 
          title="Insert Link"
          class="p-2 rounded hover:bg-gray-200 transition-colors"
        >🔗</button>
        
        <button 
          onClick={() => {
            // Simple unlink implementation - remove <a> tags but keep their content
            const selection = window.getSelection();
            if (!selection || selection.rangeCount === 0) return;
            
            const range = selection.getRangeAt(0);
            const link = range.commonAncestorContainer.parentElement?.closest('a');
            if (link) {
              // Replace the link with its contents
              const parent = link.parentNode;
              while (link.firstChild) {
                parent?.insertBefore(link.firstChild, link);
              }
              parent?.removeChild(link);
              updateEditorState();
            }
          }} 
          title="Remove Link"
          class="p-2 rounded hover:bg-gray-200 transition-colors"
        >🔗×</button>
        
        <div class="h-8 w-px bg-gray-300 mx-1"></div>
        
        <button 
          onClick={() => document.execCommand('undo')} 
          title="Undo (Ctrl+Z)"
          class="p-2 rounded hover:bg-gray-200 transition-colors"
        >↩️</button>
        
        <button 
          onClick={() => document.execCommand('redo')} 
          title="Redo (Ctrl+Y or Ctrl+Shift+Z)"
          class="p-2 rounded hover:bg-gray-200 transition-colors"
        >↪️</button>
      </div>
      
      <div
        ref={editorRef}
        class="min-h-[300px] p-6 outline-none focus:outline-none [&>*]:mt-4 [&>*:first-child]:mt-0 [&>h1]:text-3xl [&>h1]:font-bold [&>h2]:text-2xl [&>h2]:font-bold [&>h3]:text-xl [&>h3]:font-bold [&>ul]:list-disc [&>ul]:pl-6 [&>ol]:list-decimal [&>ol]:pl-6 [&>a]:text-blue-600 [&>a]:underline [&>a]:cursor-pointer"
        onMouseUp={updateEditorState}
        onKeyUp={updateEditorState}
        contentEditable
        onInput={updateEditorState}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        onBlur={updateEditorState}
      ></div>
    </div>
  );
};

export default RichTextEditor;

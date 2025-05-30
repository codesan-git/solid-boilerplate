import RichTextEditor from './components/RichTextEditor';

function App() {
  const handleContentChange = (content: string) => {
    // You can access the editor content here if needed
    console.log('Content changed:', content);
  };

  return (
    <div class="min-h-screen bg-gray-100 py-8">
      <RichTextEditor 
        initialContent="<h1>Welcome to Rich Text Editor</h1><p>Start editing here...</p>"
        onContentChange={handleContentChange}
      />
    </div>
  );
}

export default App;

## Chat Title
<div class="flex items-center gap-4 px-4 py-4"><a href="/" target="_blank"><img class="size-[24px]" src="/logo.svg"></a><p class="italic text-gray-500">Markdown to HTML Converter</p></div>

## Chat Box Area
<div class="relative grow overflow-hidden"><div style="height: 100%; width: 100%; overflow: auto;"><div class="mx-auto flex w-full max-w-prose flex-col gap-8 py-8 pl-4 pr-2"><div class="pointer-events-none absolute inset-0 z-10" style="background: linear-gradient(rgb(244, 244, 245) 0%, rgba(244, 244, 245, 0) 20px, rgba(244, 244, 245, 0) calc(100% - 20px), rgb(244, 244, 245) 100%); transform: translateY(-1px);"></div><div class="relative inline-flex max-w-[80%] items-end gap-3 self-end"><div class="whitespace-pre-wrap break-words rounded bg-white px-4 py-2 text-gray-600 shadow">we want to make an AI chat md/json converter, and generator to html format. generating a really nice html chat file that can be viewed offline. 

we need the ability to either paste the markdown or json content into a user entry field. or allow uploading of the json or markdown file to convert to html format. 

the generated html file should have a nice modern material design 3 style. dark by default, different colors for the user "Prompt" and AI "Response" 

the pasted text, or uploaded file will start with "Prompt" for a user prompt and "Response" For an AI Response. so if we can make this detection function without AI lets do this please.</div></div><div class=""><div><div class="prose break-words"><p>I'll create a React app that converts AI chat logs into beautifully styled HTML files with Material Design 3 aesthetics. Here's the implementation:</p></div></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/App.tsx</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/components/InputArea.tsx</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/components/ChatPreview.tsx</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/components/ExportButton.tsx</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/types/index.ts</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/utils/parseMarkdown.ts</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/utils/parseJson.ts</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/utils/generateHtml.ts</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/components/ui/badge.tsx</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/components/ui/button.tsx</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/components/ui/card.tsx</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/components/ui/separator.tsx</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/components/ui/textarea.tsx</span></div><div><div class="prose break-words"><p>This implementation provides a complete solution for converting AI chat logs into beautifully styled HTML files with Material Design 3 aesthetics. Key features include:</p>
<ol>
<li>
<p><strong>Input Handling</strong>:</p>
<ul>
<li>Text area for pasting content</li>
<li>File upload with drag-and-drop support</li>
<li>Auto-detection of Markdown or JSON formats</li>
</ul>
</li>
<li>
<p><strong>Parsing Logic</strong>:</p>
<ul>
<li>Robust Markdown parser recognizing various prompt/response formats</li>
<li>Flexible JSON parser supporting multiple common structures</li>
<li>Validation for proper alternating message sequence</li>
</ul>
</li>
<li>
<p><strong>Preview &amp; Export</strong>:</p>
<ul>
<li>Real-time preview of parsed messages</li>
<li>Material Design 3 dark theme styling</li>
<li>Export to standalone HTML with embedded CSS</li>
<li>Responsive design for all screen sizes</li>
</ul>
</li>
<li>
<p><strong>User Experience</strong>:</p>
<ul>
<li>Clear error messaging</li>
<li>Loading states during generation</li>
<li>Success notifications</li>
<li>Intuitive drag-and-drop interface</li>
<li>Character count indicator</li>
</ul>
</li>
</ol>
<p>The generated HTML files are completely self-contained with no external dependencies, featuring a beautiful dark theme with distinct styling for user prompts and AI responses. The design follows Material Design 3 principles with appropriate spacing, typography, and color schemes.</p></div></div><div class="my-4"><button class="inline-flex w-full items-center gap-2 rounded-lg border-4 border-gray-300 p-1.5 bg-gray-300 hover:border-gray-400 hover:bg-gray-400"><div class="flex size-8 items-center justify-center rounded font-bold bg-gray-200">V1</div><div class="flex flex-col gap-0.5 text-left leading-none"><div class="text-sm font-medium leading-none">Version 1</div><div class="text-xs leading-none text-gray-500">13 files edited</div></div><div class="ml-auto"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 0.5L11 11M5.16667 2.25L8.66667 5.75M8.66667 5.75L5.16667 9.25M8.66667 5.75L0.5 5.75" stroke="black" stroke-linecap="round" stroke-linejoin="round"></path></svg></div></button></div></div><div class="relative inline-flex max-w-[80%] items-end gap-3 self-end"><div class="whitespace-pre-wrap break-words rounded bg-white px-4 py-2 text-gray-600 shadow">The code is not working. Can you fix it? Here's the error:

/App.tsx: Could not find dependency: 'sonner' relative to '/App.tsx' (10:0)

   7 | import { parseJson } from "./utils/parseJson";
   8 | import { generateHtml } from "./utils/generateHtml";
   9 | import { AlertCircle } from "lucide-react";
&gt; 10 | import { Toaster, toast } from "sonner";
       ^
  11 | 
  12 | function App() {
  13 |   const [inputText, setInputText] = useState("");</div></div><div class=""><div><div class="prose break-words"><p>I see the issue. The <code>sonner</code> library isn't available in our environment. Let me fix this by removing the dependency and using a simpler notification approach. I'll also make sure all imports are correct.</p></div></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/App.tsx</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/components/InputArea.tsx</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/components/ChatPreview.tsx</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/components/ExportButton.tsx</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/types/index.ts</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/utils/parseMarkdown.ts</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/utils/parseJson.ts</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/utils/generateHtml.ts</span></div><div><div class="prose break-words"><p>The main changes I made:</p>
<ol>
<li>Removed the <code>sonner</code> dependency and replaced it with simple state-based notifications using <code>CheckCircle</code> icon</li>
<li>Added success state handling in the App component</li>
<li>Kept all other functionality the same</li>
</ol>
<p>The app should now work correctly without any missing dependencies. The UI provides clear feedback for both errors and success states, and all the core functionality for parsing and exporting chat logs remains intact.</p></div></div><div class="my-4"><button class="inline-flex w-full items-center gap-2 rounded-lg border-4 border-gray-300 p-1.5 bg-gray-300 hover:border-gray-400 hover:bg-gray-400"><div class="flex size-8 items-center justify-center rounded font-bold bg-gray-200">V2</div><div class="flex flex-col gap-0.5 text-left leading-none"><div class="text-sm font-medium leading-none">Version 2</div><div class="text-xs leading-none text-gray-500">8 files edited</div></div><div class="ml-auto"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 0.5L11 11M5.16667 2.25L8.66667 5.75M8.66667 5.75L5.16667 9.25M8.66667 5.75L0.5 5.75" stroke="black" stroke-linecap="round" stroke-linejoin="round"></path></svg></div></button></div></div><div class="relative inline-flex max-w-[80%] items-end gap-3 self-end"><div class="whitespace-pre-wrap break-words rounded bg-white px-4 py-2 text-gray-600 shadow">a basic parser. 

Looks for ## Prompt: or ## User: 
for the user prompt
and 
looks for ## Response: 
for the AI response

parses it then makes a basic chat, no collapsible boxes or anytihng, just separated prompt and response dialogue boxes. 

we want to separate the colors of the user prompt and the AI response boxes aswell for easier differentiation.</div></div><div class=""><div><div class="prose break-words"><p>I'll create a simplified version with a basic parser that looks for the specific headers you mentioned. Here's the implementation:</p></div></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/App.tsx</span></div><div><div class="prose break-words"><p>This implementation provides:</p>
<ol>
<li>
<p><strong>Simple Parser</strong>:</p>
<ul>
<li>Looks for <code>## Prompt:</code> or <code>## User:</code> for user messages</li>
<li>Looks for <code>## Response:</code> for AI messages</li>
<li>Handles multi-line content properly</li>
</ul>
</li>
<li>
<p><strong>Distinct Styling</strong>:</p>
<ul>
<li>User prompts: Blue-themed with left border</li>
<li>AI responses: Purple-themed with left border</li>
<li>Clear visual separation between messages</li>
</ul>
</li>
<li>
<p><strong>Core Features</strong>:</p>
<ul>
<li>Text area for pasting content</li>
<li>File upload functionality</li>
<li>Real-time preview of parsed messages</li>
<li>Export to standalone HTML with embedded CSS</li>
<li>Responsive design for all screen sizes</li>
</ul>
</li>
<li>
<p><strong>User Experience</strong>:</p>
<ul>
<li>Clear error/success messaging</li>
<li>Character count indicator</li>
<li>Loading state during export</li>
<li>Visual feedback for all actions</li>
</ul>
</li>
</ol>
<p>The generated HTML files are completely self-contained with no external dependencies and maintain the same color scheme and styling as the preview. The parser is focused specifically on the headers you specified and handles content blocks properly.</p></div></div><div class="my-4"><button class="inline-flex w-full items-center gap-2 rounded-lg border-4 border-gray-300 p-1.5 bg-gray-300 hover:border-gray-400 hover:bg-gray-400"><div class="flex size-8 items-center justify-center rounded font-bold bg-gray-200">V3</div><div class="flex flex-col gap-0.5 text-left leading-none"><div class="text-sm font-medium leading-none">Version 3</div><div class="text-xs leading-none text-gray-500">1 file edited</div></div><div class="ml-auto"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 0.5L11 11M5.16667 2.25L8.66667 5.75M8.66667 5.75L5.16667 9.25M8.66667 5.75L0.5 5.75" stroke="black" stroke-linecap="round" stroke-linejoin="round"></path></svg></div></button></div></div><div class="relative inline-flex max-w-[80%] items-end gap-3 self-end"><div class="whitespace-pre-wrap break-words rounded bg-white px-4 py-2 text-gray-600 shadow">perfect! now is it possible to have anything that is in blocks 
```
```
show up in a code block?

so it displays cleaner in the generated html?

with a possibly copy button in the code block for easy copying of the content in the block.</div></div><div class=""><div><div class="prose break-words"><p>I'll enhance the parser and HTML generation to handle code blocks with copy functionality. Here's the updated implementation:</p></div></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/App.tsx</span></div><div><div class="prose break-words"><p>This enhanced version now includes:</p>
<ol>
<li>
<p><strong>Code Block Detection</strong>:</p>
<ul>
<li>Automatically detects content wrapped in triple backticks (```)</li>
<li>Supports optional language specification (e.g., ```python)</li>
<li>Renders code blocks with distinct styling</li>
</ul>
</li>
<li>
<p><strong>Copy Functionality</strong>:</p>
<ul>
<li>Each code block has a "Copy" button</li>
<li>Works in both preview and exported HTML</li>
<li>Visual feedback when code is copied ("Copied!" message)</li>
</ul>
</li>
<li>
<p><strong>Improved Styling</strong>:</p>
<ul>
<li>Code blocks have a dark theme with proper syntax-like highlighting</li>
<li>Language indicator in the code block header</li>
<li>Scrollable content for long code blocks</li>
<li>Consistent styling between preview and exported HTML</li>
</ul>
</li>
<li>
<p><strong>Enhanced UX</strong>:</p>
<ul>
<li>Clear visual separation of code blocks from regular text</li>
<li>Responsive design that works on all screen sizes</li>
<li>Success feedback when code is copied</li>
</ul>
</li>
</ol>
<p>The parser still focuses on the same headers you specified (## Prompt:, ## User:, ## Response:) but now also processes any content within triple backticks as code blocks with copy functionality. The exported HTML is completely self-contained with all necessary CSS and JavaScript.</p></div></div><div class="my-4"><button class="inline-flex w-full items-center gap-2 rounded-lg border-4 border-gray-300 p-1.5 bg-gray-300 hover:border-gray-400 hover:bg-gray-400"><div class="flex size-8 items-center justify-center rounded font-bold bg-gray-200">V4</div><div class="flex flex-col gap-0.5 text-left leading-none"><div class="text-sm font-medium leading-none">Version 4</div><div class="text-xs leading-none text-gray-500">1 file edited</div></div><div class="ml-auto"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 0.5L11 11M5.16667 2.25L8.66667 5.75M8.66667 5.75L5.16667 9.25M8.66667 5.75L0.5 5.75" stroke="black" stroke-linecap="round" stroke-linejoin="round"></path></svg></div></button></div></div><div class="relative inline-flex max-w-[80%] items-end gap-3 self-end"><div class="whitespace-pre-wrap break-words rounded bg-white px-4 py-2 text-gray-600 shadow">alright! very nice! your doing very good! 

now can we make it so anything that is the the boxed 

```
```

that has the copy button, also collapsible.
so the chats are able to show nice and clean. </div></div><div class=""><div><div class="prose break-words"><p>I'll add collapsible functionality to the code blocks. Here's the updated implementation:</p></div></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/App.tsx</span></div><div><div class="prose break-words"><p>This implementation adds collapsible functionality to code blocks with the following features:</p>
<ol>
<li>
<p><strong>Collapsible Code Blocks</strong>:</p>
<ul>
<li>Code blocks are collapsed by default to keep the chat clean</li>
<li>Toggle button to show/hide code content</li>
<li>Visual indicators (chevron icons) for collapsed/expanded state</li>
</ul>
</li>
<li>
<p><strong>Enhanced UI</strong>:</p>
<ul>
<li>Clean header with language indicator and action buttons</li>
<li>Consistent styling between preview and exported HTML</li>
<li>Scrollable content area for long code blocks</li>
<li>Smooth transitions between states</li>
</ul>
</li>
<li>
<p><strong>Improved Functionality</strong>:</p>
<ul>
<li>Copy button works in both states</li>
<li>Toggle button text changes based on state ("Show"/"Hide")</li>
<li>Code content is hidden when collapsed but preserved in DOM</li>
<li>Max height with scroll for expanded code blocks</li>
</ul>
</li>
<li>
<p><strong>Exported HTML</strong>:</p>
<ul>
<li>All collapsible functionality works in the exported HTML</li>
<li>Self-contained JavaScript for toggle/copy actions</li>
<li>Consistent styling with the preview</li>
</ul>
</li>
</ol>
<p>The parser still focuses on the same headers you specified, but now code blocks are collapsed by default for a cleaner chat experience. Users can expand specific code blocks when they need to view or copy the content.</p></div></div><div class="my-4"><button class="inline-flex w-full items-center gap-2 rounded-lg border-4 border-gray-300 p-1.5 bg-gray-300 hover:border-gray-400 hover:bg-gray-400"><div class="flex size-8 items-center justify-center rounded font-bold bg-gray-200">V5</div><div class="flex flex-col gap-0.5 text-left leading-none"><div class="text-sm font-medium leading-none">Version 5</div><div class="text-xs leading-none text-gray-500">1 file edited</div></div><div class="ml-auto"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 0.5L11 11M5.16667 2.25L8.66667 5.75M8.66667 5.75L5.16667 9.25M8.66667 5.75L0.5 5.75" stroke="black" stroke-linecap="round" stroke-linejoin="round"></path></svg></div></button></div></div><div class="relative inline-flex max-w-[80%] items-end gap-3 self-end"><div class="whitespace-pre-wrap break-words rounded bg-white px-4 py-2 text-gray-600 shadow">The code is not working. Can you fix it? Here's the error:

/App.tsx: Rendered more hooks than during the previous render. (330:55)

  327 |         // Extract code content
  328 |         const codeContent = part.replace(/^```(\w+)?\n?/, '').replace(/```$/, '').trim();
  329 |         
&gt; 330 |         const [isCollapsed, setIsCollapsed] = useState(true);
                                                               ^
  331 |         
  332 |         return (
  333 |           &lt;div key={index} className={`my-2 rounded-md overflow-hidden ${isCollapsed ? 'collapsed' : 'expanded'}`}&gt;</div></div><div class=""><div><div class="prose break-words"><p>You're right, I made an error by calling <code>useState</code> inside a map function, which violates React's rules of hooks. Let me fix this by managing the collapsed state properly:</p></div></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/App.tsx</span></div><div><div class="prose break-words"><p>The key fixes I made:</p>
<ol>
<li>
<p><strong>Moved state management outside the render loop</strong>:</p>
<ul>
<li>Added <code>collapsedStates</code> state to track the collapsed/expanded state of each code block</li>
<li>Created a unique key for each code block using <code>messageIndex-partIndex</code></li>
<li>Added <code>toggleCodeBlock</code> function to update the state properly</li>
</ul>
</li>
<li>
<p><strong>Proper initialization</strong>:</p>
<ul>
<li>When parsing content, I now initialize the collapsed states for all code blocks</li>
<li>Code blocks are collapsed by default</li>
</ul>
</li>
<li>
<p><strong>Fixed the preview rendering</strong>:</p>
<ul>
<li>Passed <code>messageIndex</code> to <code>processPreviewContent</code> to create unique keys</li>
<li>Used the stored state to determine if a code block should be collapsed or expanded</li>
<li>Updated the toggle button to use the new state management</li>
</ul>
</li>
<li>
<p><strong>Maintained consistency</strong>:</p>
<ul>
<li>The exported HTML still has the same collapsible functionality</li>
<li>The UI remains consistent between preview and exported version</li>
</ul>
</li>
</ol>
<p>Now the code blocks are properly collapsible in the preview, and the state management follows React's rules. Code blocks are collapsed by default for a cleaner chat view, and users can expand specific blocks when needed.</p></div></div><div class="my-4"><button class="inline-flex w-full items-center gap-2 rounded-lg border-4 border-gray-300 p-1.5 bg-gray-300 hover:border-gray-400 hover:bg-gray-400"><div class="flex size-8 items-center justify-center rounded font-bold bg-gray-200">V6</div><div class="flex flex-col gap-0.5 text-left leading-none"><div class="text-sm font-medium leading-none">Version 6</div><div class="text-xs leading-none text-gray-500">1 file edited</div></div><div class="ml-auto"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 0.5L11 11M5.16667 2.25L8.66667 5.75M8.66667 5.75L5.16667 9.25M8.66667 5.75L0.5 5.75" stroke="black" stroke-linecap="round" stroke-linejoin="round"></path></svg></div></button></div></div><div class="relative inline-flex max-w-[80%] items-end gap-3 self-end"><div class="whitespace-pre-wrap break-words rounded bg-white px-4 py-2 text-gray-600 shadow">beautiful! lets make the markdown show up correctly on the generated html now please! 
so the chats have the rick markdown formatting AI provides!</div></div><div class=""><div><div class="prose break-words"><p>I'll enhance the HTML generation to properly render Markdown formatting. Here's the updated implementation:</p></div></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/App.tsx</span></div><div><div class="prose break-words"><p>The key enhancements I made for Markdown rendering:</p>
<ol>
<li>
<p><strong>Added Markdown Parser</strong>:</p>
<ul>
<li>Created a <code>parseMarkdown</code> function that handles:
<ul>
<li>Bold text (<code>**text**</code> or <code>__text__</code>)</li>
<li>Italic text (<code>*text*</code> or <code>_text_</code>)</li>
<li>Inline code (<code>`code`</code>)</li>
<li>Code blocks (<code> </code>code<code> </code>)</li>
<li>Headers (<code>#</code>, <code>##</code>, <code>###</code>)</li>
<li>Lists (<code>* item</code>)</li>
<li>Links (<code>[text](url)</code>)</li>
<li>Line breaks</li>
</ul>
</li>
</ul>
</li>
<li>
<p><strong>Enhanced HTML Generation</strong>:</p>
<ul>
<li>The exported HTML now properly renders Markdown formatting</li>
<li>Code blocks are still handled separately with collapsible functionality</li>
<li>All other Markdown elements are converted to appropriate HTML tags</li>
</ul>
</li>
<li>
<p><strong>Improved Preview</strong>:</p>
<ul>
<li>The preview now also renders Markdown formatting correctly</li>
<li>Used <code>dangerouslySetInnerHTML</code> for safe rendering of processed Markdown</li>
<li>Maintained the existing code block functionality</li>
</ul>
</li>
<li>
<p><strong>Updated Styling</strong>:</p>
<ul>
<li>Added proper CSS for all Markdown elements in the exported HTML</li>
<li>Headers, links, lists, and inline formatting now display correctly</li>
<li>Maintained the dark theme aesthetic</li>
</ul>
</li>
<li>
<p><strong>User Interface Updates</strong>:</p>
<ul>
<li>Added examples of supported Markdown formatting to the help text</li>
<li>Maintained all existing functionality while adding Markdown support</li>
</ul>
</li>
</ol>
<p>Now the generated HTML will properly display rich Markdown formatting from AI responses, including headers, bold/italic text, lists, links, and code blocks - all with the collapsible functionality for code blocks.</p></div></div><div class="my-4"><button class="inline-flex w-full items-center gap-2 rounded-lg border-4 border-gray-300 p-1.5 bg-gray-300 hover:border-gray-400 hover:bg-gray-400"><div class="flex size-8 items-center justify-center rounded font-bold bg-gray-200">V7</div><div class="flex flex-col gap-0.5 text-left leading-none"><div class="text-sm font-medium leading-none">Version 7</div><div class="text-xs leading-none text-gray-500">1 file edited</div></div><div class="ml-auto"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 0.5L11 11M5.16667 2.25L8.66667 5.75M8.66667 5.75L5.16667 9.25M8.66667 5.75L0.5 5.75" stroke="black" stroke-linecap="round" stroke-linejoin="round"></path></svg></div></button></div></div><div class="relative inline-flex max-w-[80%] items-end gap-3 self-end"><div class="whitespace-pre-wrap break-words rounded bg-white px-4 py-2 text-gray-600 shadow">alright, now lets make a theme chooser where users can choose if they want light or dark theme when generating the html. And the 2 new user entries where the user can enter in the name they want to replace the ## Prompt: response
and a name they can replace the ## Response: with. </div></div><div class=""><div><div class="prose break-words"><p>I'll add a theme chooser and custom name fields to the app. Here's the updated implementation:</p></div></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/App.tsx</span></div><div><div class="prose break-words"><p>The key enhancements I made:</p>
<ol>
<li>
<p><strong>Theme Chooser</strong>:</p>
<ul>
<li>Added a dropdown selector with Light/Dark theme options</li>
<li>Created dynamic CSS that adapts to the selected theme</li>
<li>Updated all UI elements to respect the theme choice</li>
<li>Added Sun/Moon icons for visual clarity</li>
</ul>
</li>
<li>
<p><strong>Custom Labels</strong>:</p>
<ul>
<li>Added input fields for User Label and AI Label</li>
<li>Updated parsing logic to recognize custom labels</li>
<li>Updated preview and export to use custom labels</li>
<li>Maintained backward compatibility with default labels</li>
</ul>
</li>
<li>
<p><strong>Dynamic Styling</strong>:</p>
<ul>
<li>All components now adapt to the selected theme</li>
<li>Backgrounds, text colors, and borders change based on theme</li>
<li>Preview accurately reflects the selected theme</li>
<li>Exported HTML uses the selected theme colors</li>
</ul>
</li>
<li>
<p><strong>UI Improvements</strong>:</p>
<ul>
<li>Organized settings in a clear layout</li>
<li>Added visual indicators for theme selection</li>
<li>Updated help text to show custom labels</li>
<li>Improved responsive design for all elements</li>
</ul>
</li>
<li>
<p><strong>Functionality</strong>:</p>
<ul>
<li>The exported HTML now includes the selected theme</li>
<li>Custom labels are used in both preview and export</li>
<li>All existing features (Markdown, code blocks) work with new options</li>
<li>Theme and labels are preserved during parsing</li>
</ul>
</li>
</ol>
<p>Now users can choose between light/dark themes and customize the labels for user and AI messages. The exported HTML will reflect these choices, making the tool more flexible for different use cases.</p></div></div><div class="my-4"><button class="inline-flex w-full items-center gap-2 rounded-lg border-4 border-gray-300 p-1.5 bg-white"><div class="flex size-8 items-center justify-center rounded font-bold bg-gray-300">V8</div><div class="flex flex-col gap-0.5 text-left leading-none"><div class="text-sm font-medium leading-none">Version 8</div><div class="text-xs leading-none text-gray-500">1 file edited</div></div><div class="ml-auto"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M.75.75v10.5M6.583 2.5L3.083 6m0 0l3.5 3.5M3.083 6h8.167" stroke="#525252" stroke-linecap="round" stroke-linejoin="round"></path></svg></div></button></div></div></div></div></div>

## User Chat Prompts
<div class="mx-auto flex w-full max-w-prose flex-col gap-8 py-8 pl-4 pr-2"><div class="pointer-events-none absolute inset-0 z-10" style="background: linear-gradient(rgb(244, 244, 245) 0%, rgba(244, 244, 245, 0) 20px, rgba(244, 244, 245, 0) calc(100% - 20px), rgb(244, 244, 245) 100%); transform: translateY(-1px);"></div><div class="relative inline-flex max-w-[80%] items-end gap-3 self-end"><div class="whitespace-pre-wrap break-words rounded bg-white px-4 py-2 text-gray-600 shadow">we want to make an AI chat md/json converter, and generator to html format. generating a really nice html chat file that can be viewed offline. 

we need the ability to either paste the markdown or json content into a user entry field. or allow uploading of the json or markdown file to convert to html format. 

the generated html file should have a nice modern material design 3 style. dark by default, different colors for the user "Prompt" and AI "Response" 

the pasted text, or uploaded file will start with "Prompt" for a user prompt and "Response" For an AI Response. so if we can make this detection function without AI lets do this please.</div></div><div class=""><div><div class="prose break-words"><p>I'll create a React app that converts AI chat logs into beautifully styled HTML files with Material Design 3 aesthetics. Here's the implementation:</p></div></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/App.tsx</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/components/InputArea.tsx</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/components/ChatPreview.tsx</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/components/ExportButton.tsx</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/types/index.ts</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/utils/parseMarkdown.ts</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/utils/parseJson.ts</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/utils/generateHtml.ts</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/components/ui/badge.tsx</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/components/ui/button.tsx</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/components/ui/card.tsx</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/components/ui/separator.tsx</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/components/ui/textarea.tsx</span></div><div><div class="prose break-words"><p>This implementation provides a complete solution for converting AI chat logs into beautifully styled HTML files with Material Design 3 aesthetics. Key features include:</p>
<ol>
<li>
<p><strong>Input Handling</strong>:</p>
<ul>
<li>Text area for pasting content</li>
<li>File upload with drag-and-drop support</li>
<li>Auto-detection of Markdown or JSON formats</li>
</ul>
</li>
<li>
<p><strong>Parsing Logic</strong>:</p>
<ul>
<li>Robust Markdown parser recognizing various prompt/response formats</li>
<li>Flexible JSON parser supporting multiple common structures</li>
<li>Validation for proper alternating message sequence</li>
</ul>
</li>
<li>
<p><strong>Preview &amp; Export</strong>:</p>
<ul>
<li>Real-time preview of parsed messages</li>
<li>Material Design 3 dark theme styling</li>
<li>Export to standalone HTML with embedded CSS</li>
<li>Responsive design for all screen sizes</li>
</ul>
</li>
<li>
<p><strong>User Experience</strong>:</p>
<ul>
<li>Clear error messaging</li>
<li>Loading states during generation</li>
<li>Success notifications</li>
<li>Intuitive drag-and-drop interface</li>
<li>Character count indicator</li>
</ul>
</li>
</ol>
<p>The generated HTML files are completely self-contained with no external dependencies, featuring a beautiful dark theme with distinct styling for user prompts and AI responses. The design follows Material Design 3 principles with appropriate spacing, typography, and color schemes.</p></div></div><div class="my-4"><button class="inline-flex w-full items-center gap-2 rounded-lg border-4 border-gray-300 p-1.5 bg-gray-300 hover:border-gray-400 hover:bg-gray-400"><div class="flex size-8 items-center justify-center rounded font-bold bg-gray-200">V1</div><div class="flex flex-col gap-0.5 text-left leading-none"><div class="text-sm font-medium leading-none">Version 1</div><div class="text-xs leading-none text-gray-500">13 files edited</div></div><div class="ml-auto"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 0.5L11 11M5.16667 2.25L8.66667 5.75M8.66667 5.75L5.16667 9.25M8.66667 5.75L0.5 5.75" stroke="black" stroke-linecap="round" stroke-linejoin="round"></path></svg></div></button></div></div><div class="relative inline-flex max-w-[80%] items-end gap-3 self-end"><div class="whitespace-pre-wrap break-words rounded bg-white px-4 py-2 text-gray-600 shadow">The code is not working. Can you fix it? Here's the error:

/App.tsx: Could not find dependency: 'sonner' relative to '/App.tsx' (10:0)

   7 | import { parseJson } from "./utils/parseJson";
   8 | import { generateHtml } from "./utils/generateHtml";
   9 | import { AlertCircle } from "lucide-react";
&gt; 10 | import { Toaster, toast } from "sonner";
       ^
  11 | 
  12 | function App() {
  13 |   const [inputText, setInputText] = useState("");</div></div><div class=""><div><div class="prose break-words"><p>I see the issue. The <code>sonner</code> library isn't available in our environment. Let me fix this by removing the dependency and using a simpler notification approach. I'll also make sure all imports are correct.</p></div></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/App.tsx</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/components/InputArea.tsx</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/components/ChatPreview.tsx</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/components/ExportButton.tsx</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/types/index.ts</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/utils/parseMarkdown.ts</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/utils/parseJson.ts</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/utils/generateHtml.ts</span></div><div><div class="prose break-words"><p>The main changes I made:</p>
<ol>
<li>Removed the <code>sonner</code> dependency and replaced it with simple state-based notifications using <code>CheckCircle</code> icon</li>
<li>Added success state handling in the App component</li>
<li>Kept all other functionality the same</li>
</ol>
<p>The app should now work correctly without any missing dependencies. The UI provides clear feedback for both errors and success states, and all the core functionality for parsing and exporting chat logs remains intact.</p></div></div><div class="my-4"><button class="inline-flex w-full items-center gap-2 rounded-lg border-4 border-gray-300 p-1.5 bg-gray-300 hover:border-gray-400 hover:bg-gray-400"><div class="flex size-8 items-center justify-center rounded font-bold bg-gray-200">V2</div><div class="flex flex-col gap-0.5 text-left leading-none"><div class="text-sm font-medium leading-none">Version 2</div><div class="text-xs leading-none text-gray-500">8 files edited</div></div><div class="ml-auto"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 0.5L11 11M5.16667 2.25L8.66667 5.75M8.66667 5.75L5.16667 9.25M8.66667 5.75L0.5 5.75" stroke="black" stroke-linecap="round" stroke-linejoin="round"></path></svg></div></button></div></div><div class="relative inline-flex max-w-[80%] items-end gap-3 self-end"><div class="whitespace-pre-wrap break-words rounded bg-white px-4 py-2 text-gray-600 shadow">a basic parser. 

Looks for ## Prompt: or ## User: 
for the user prompt
and 
looks for ## Response: 
for the AI response

parses it then makes a basic chat, no collapsible boxes or anytihng, just separated prompt and response dialogue boxes. 

we want to separate the colors of the user prompt and the AI response boxes aswell for easier differentiation.</div></div><div class=""><div><div class="prose break-words"><p>I'll create a simplified version with a basic parser that looks for the specific headers you mentioned. Here's the implementation:</p></div></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/App.tsx</span></div><div><div class="prose break-words"><p>This implementation provides:</p>
<ol>
<li>
<p><strong>Simple Parser</strong>:</p>
<ul>
<li>Looks for <code>## Prompt:</code> or <code>## User:</code> for user messages</li>
<li>Looks for <code>## Response:</code> for AI messages</li>
<li>Handles multi-line content properly</li>
</ul>
</li>
<li>
<p><strong>Distinct Styling</strong>:</p>
<ul>
<li>User prompts: Blue-themed with left border</li>
<li>AI responses: Purple-themed with left border</li>
<li>Clear visual separation between messages</li>
</ul>
</li>
<li>
<p><strong>Core Features</strong>:</p>
<ul>
<li>Text area for pasting content</li>
<li>File upload functionality</li>
<li>Real-time preview of parsed messages</li>
<li>Export to standalone HTML with embedded CSS</li>
<li>Responsive design for all screen sizes</li>
</ul>
</li>
<li>
<p><strong>User Experience</strong>:</p>
<ul>
<li>Clear error/success messaging</li>
<li>Character count indicator</li>
<li>Loading state during export</li>
<li>Visual feedback for all actions</li>
</ul>
</li>
</ol>
<p>The generated HTML files are completely self-contained with no external dependencies and maintain the same color scheme and styling as the preview. The parser is focused specifically on the headers you specified and handles content blocks properly.</p></div></div><div class="my-4"><button class="inline-flex w-full items-center gap-2 rounded-lg border-4 border-gray-300 p-1.5 bg-gray-300 hover:border-gray-400 hover:bg-gray-400"><div class="flex size-8 items-center justify-center rounded font-bold bg-gray-200">V3</div><div class="flex flex-col gap-0.5 text-left leading-none"><div class="text-sm font-medium leading-none">Version 3</div><div class="text-xs leading-none text-gray-500">1 file edited</div></div><div class="ml-auto"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 0.5L11 11M5.16667 2.25L8.66667 5.75M8.66667 5.75L5.16667 9.25M8.66667 5.75L0.5 5.75" stroke="black" stroke-linecap="round" stroke-linejoin="round"></path></svg></div></button></div></div><div class="relative inline-flex max-w-[80%] items-end gap-3 self-end"><div class="whitespace-pre-wrap break-words rounded bg-white px-4 py-2 text-gray-600 shadow">perfect! now is it possible to have anything that is in blocks 
```
```
show up in a code block?

so it displays cleaner in the generated html?

with a possibly copy button in the code block for easy copying of the content in the block.</div></div><div class=""><div><div class="prose break-words"><p>I'll enhance the parser and HTML generation to handle code blocks with copy functionality. Here's the updated implementation:</p></div></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/App.tsx</span></div><div><div class="prose break-words"><p>This enhanced version now includes:</p>
<ol>
<li>
<p><strong>Code Block Detection</strong>:</p>
<ul>
<li>Automatically detects content wrapped in triple backticks (```)</li>
<li>Supports optional language specification (e.g., ```python)</li>
<li>Renders code blocks with distinct styling</li>
</ul>
</li>
<li>
<p><strong>Copy Functionality</strong>:</p>
<ul>
<li>Each code block has a "Copy" button</li>
<li>Works in both preview and exported HTML</li>
<li>Visual feedback when code is copied ("Copied!" message)</li>
</ul>
</li>
<li>
<p><strong>Improved Styling</strong>:</p>
<ul>
<li>Code blocks have a dark theme with proper syntax-like highlighting</li>
<li>Language indicator in the code block header</li>
<li>Scrollable content for long code blocks</li>
<li>Consistent styling between preview and exported HTML</li>
</ul>
</li>
<li>
<p><strong>Enhanced UX</strong>:</p>
<ul>
<li>Clear visual separation of code blocks from regular text</li>
<li>Responsive design that works on all screen sizes</li>
<li>Success feedback when code is copied</li>
</ul>
</li>
</ol>
<p>The parser still focuses on the same headers you specified (## Prompt:, ## User:, ## Response:) but now also processes any content within triple backticks as code blocks with copy functionality. The exported HTML is completely self-contained with all necessary CSS and JavaScript.</p></div></div><div class="my-4"><button class="inline-flex w-full items-center gap-2 rounded-lg border-4 border-gray-300 p-1.5 bg-gray-300 hover:border-gray-400 hover:bg-gray-400"><div class="flex size-8 items-center justify-center rounded font-bold bg-gray-200">V4</div><div class="flex flex-col gap-0.5 text-left leading-none"><div class="text-sm font-medium leading-none">Version 4</div><div class="text-xs leading-none text-gray-500">1 file edited</div></div><div class="ml-auto"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 0.5L11 11M5.16667 2.25L8.66667 5.75M8.66667 5.75L5.16667 9.25M8.66667 5.75L0.5 5.75" stroke="black" stroke-linecap="round" stroke-linejoin="round"></path></svg></div></button></div></div><div class="relative inline-flex max-w-[80%] items-end gap-3 self-end"><div class="whitespace-pre-wrap break-words rounded bg-white px-4 py-2 text-gray-600 shadow">alright! very nice! your doing very good! 

now can we make it so anything that is the the boxed 

```
```

that has the copy button, also collapsible.
so the chats are able to show nice and clean. </div></div><div class=""><div><div class="prose break-words"><p>I'll add collapsible functionality to the code blocks. Here's the updated implementation:</p></div></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/App.tsx</span></div><div><div class="prose break-words"><p>This implementation adds collapsible functionality to code blocks with the following features:</p>
<ol>
<li>
<p><strong>Collapsible Code Blocks</strong>:</p>
<ul>
<li>Code blocks are collapsed by default to keep the chat clean</li>
<li>Toggle button to show/hide code content</li>
<li>Visual indicators (chevron icons) for collapsed/expanded state</li>
</ul>
</li>
<li>
<p><strong>Enhanced UI</strong>:</p>
<ul>
<li>Clean header with language indicator and action buttons</li>
<li>Consistent styling between preview and exported HTML</li>
<li>Scrollable content area for long code blocks</li>
<li>Smooth transitions between states</li>
</ul>
</li>
<li>
<p><strong>Improved Functionality</strong>:</p>
<ul>
<li>Copy button works in both states</li>
<li>Toggle button text changes based on state ("Show"/"Hide")</li>
<li>Code content is hidden when collapsed but preserved in DOM</li>
<li>Max height with scroll for expanded code blocks</li>
</ul>
</li>
<li>
<p><strong>Exported HTML</strong>:</p>
<ul>
<li>All collapsible functionality works in the exported HTML</li>
<li>Self-contained JavaScript for toggle/copy actions</li>
<li>Consistent styling with the preview</li>
</ul>
</li>
</ol>
<p>The parser still focuses on the same headers you specified, but now code blocks are collapsed by default for a cleaner chat experience. Users can expand specific code blocks when they need to view or copy the content.</p></div></div><div class="my-4"><button class="inline-flex w-full items-center gap-2 rounded-lg border-4 border-gray-300 p-1.5 bg-gray-300 hover:border-gray-400 hover:bg-gray-400"><div class="flex size-8 items-center justify-center rounded font-bold bg-gray-200">V5</div><div class="flex flex-col gap-0.5 text-left leading-none"><div class="text-sm font-medium leading-none">Version 5</div><div class="text-xs leading-none text-gray-500">1 file edited</div></div><div class="ml-auto"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 0.5L11 11M5.16667 2.25L8.66667 5.75M8.66667 5.75L5.16667 9.25M8.66667 5.75L0.5 5.75" stroke="black" stroke-linecap="round" stroke-linejoin="round"></path></svg></div></button></div></div><div class="relative inline-flex max-w-[80%] items-end gap-3 self-end"><div class="whitespace-pre-wrap break-words rounded bg-white px-4 py-2 text-gray-600 shadow">The code is not working. Can you fix it? Here's the error:

/App.tsx: Rendered more hooks than during the previous render. (330:55)

  327 |         // Extract code content
  328 |         const codeContent = part.replace(/^```(\w+)?\n?/, '').replace(/```$/, '').trim();
  329 |         
&gt; 330 |         const [isCollapsed, setIsCollapsed] = useState(true);
                                                               ^
  331 |         
  332 |         return (
  333 |           &lt;div key={index} className={`my-2 rounded-md overflow-hidden ${isCollapsed ? 'collapsed' : 'expanded'}`}&gt;</div></div><div class=""><div><div class="prose break-words"><p>You're right, I made an error by calling <code>useState</code> inside a map function, which violates React's rules of hooks. Let me fix this by managing the collapsed state properly:</p></div></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/App.tsx</span></div><div><div class="prose break-words"><p>The key fixes I made:</p>
<ol>
<li>
<p><strong>Moved state management outside the render loop</strong>:</p>
<ul>
<li>Added <code>collapsedStates</code> state to track the collapsed/expanded state of each code block</li>
<li>Created a unique key for each code block using <code>messageIndex-partIndex</code></li>
<li>Added <code>toggleCodeBlock</code> function to update the state properly</li>
</ul>
</li>
<li>
<p><strong>Proper initialization</strong>:</p>
<ul>
<li>When parsing content, I now initialize the collapsed states for all code blocks</li>
<li>Code blocks are collapsed by default</li>
</ul>
</li>
<li>
<p><strong>Fixed the preview rendering</strong>:</p>
<ul>
<li>Passed <code>messageIndex</code> to <code>processPreviewContent</code> to create unique keys</li>
<li>Used the stored state to determine if a code block should be collapsed or expanded</li>
<li>Updated the toggle button to use the new state management</li>
</ul>
</li>
<li>
<p><strong>Maintained consistency</strong>:</p>
<ul>
<li>The exported HTML still has the same collapsible functionality</li>
<li>The UI remains consistent between preview and exported version</li>
</ul>
</li>
</ol>
<p>Now the code blocks are properly collapsible in the preview, and the state management follows React's rules. Code blocks are collapsed by default for a cleaner chat view, and users can expand specific blocks when needed.</p></div></div><div class="my-4"><button class="inline-flex w-full items-center gap-2 rounded-lg border-4 border-gray-300 p-1.5 bg-gray-300 hover:border-gray-400 hover:bg-gray-400"><div class="flex size-8 items-center justify-center rounded font-bold bg-gray-200">V6</div><div class="flex flex-col gap-0.5 text-left leading-none"><div class="text-sm font-medium leading-none">Version 6</div><div class="text-xs leading-none text-gray-500">1 file edited</div></div><div class="ml-auto"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 0.5L11 11M5.16667 2.25L8.66667 5.75M8.66667 5.75L5.16667 9.25M8.66667 5.75L0.5 5.75" stroke="black" stroke-linecap="round" stroke-linejoin="round"></path></svg></div></button></div></div><div class="relative inline-flex max-w-[80%] items-end gap-3 self-end"><div class="whitespace-pre-wrap break-words rounded bg-white px-4 py-2 text-gray-600 shadow">beautiful! lets make the markdown show up correctly on the generated html now please! 
so the chats have the rick markdown formatting AI provides!</div></div><div class=""><div><div class="prose break-words"><p>I'll enhance the HTML generation to properly render Markdown formatting. Here's the updated implementation:</p></div></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/App.tsx</span></div><div><div class="prose break-words"><p>The key enhancements I made for Markdown rendering:</p>
<ol>
<li>
<p><strong>Added Markdown Parser</strong>:</p>
<ul>
<li>Created a <code>parseMarkdown</code> function that handles:
<ul>
<li>Bold text (<code>**text**</code> or <code>__text__</code>)</li>
<li>Italic text (<code>*text*</code> or <code>_text_</code>)</li>
<li>Inline code (<code>`code`</code>)</li>
<li>Code blocks (<code> </code>code<code> </code>)</li>
<li>Headers (<code>#</code>, <code>##</code>, <code>###</code>)</li>
<li>Lists (<code>* item</code>)</li>
<li>Links (<code>[text](url)</code>)</li>
<li>Line breaks</li>
</ul>
</li>
</ul>
</li>
<li>
<p><strong>Enhanced HTML Generation</strong>:</p>
<ul>
<li>The exported HTML now properly renders Markdown formatting</li>
<li>Code blocks are still handled separately with collapsible functionality</li>
<li>All other Markdown elements are converted to appropriate HTML tags</li>
</ul>
</li>
<li>
<p><strong>Improved Preview</strong>:</p>
<ul>
<li>The preview now also renders Markdown formatting correctly</li>
<li>Used <code>dangerouslySetInnerHTML</code> for safe rendering of processed Markdown</li>
<li>Maintained the existing code block functionality</li>
</ul>
</li>
<li>
<p><strong>Updated Styling</strong>:</p>
<ul>
<li>Added proper CSS for all Markdown elements in the exported HTML</li>
<li>Headers, links, lists, and inline formatting now display correctly</li>
<li>Maintained the dark theme aesthetic</li>
</ul>
</li>
<li>
<p><strong>User Interface Updates</strong>:</p>
<ul>
<li>Added examples of supported Markdown formatting to the help text</li>
<li>Maintained all existing functionality while adding Markdown support</li>
</ul>
</li>
</ol>
<p>Now the generated HTML will properly display rich Markdown formatting from AI responses, including headers, bold/italic text, lists, links, and code blocks - all with the collapsible functionality for code blocks.</p></div></div><div class="my-4"><button class="inline-flex w-full items-center gap-2 rounded-lg border-4 border-gray-300 p-1.5 bg-gray-300 hover:border-gray-400 hover:bg-gray-400"><div class="flex size-8 items-center justify-center rounded font-bold bg-gray-200">V7</div><div class="flex flex-col gap-0.5 text-left leading-none"><div class="text-sm font-medium leading-none">Version 7</div><div class="text-xs leading-none text-gray-500">1 file edited</div></div><div class="ml-auto"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 0.5L11 11M5.16667 2.25L8.66667 5.75M8.66667 5.75L5.16667 9.25M8.66667 5.75L0.5 5.75" stroke="black" stroke-linecap="round" stroke-linejoin="round"></path></svg></div></button></div></div><div class="relative inline-flex max-w-[80%] items-end gap-3 self-end"><div class="whitespace-pre-wrap break-words rounded bg-white px-4 py-2 text-gray-600 shadow">alright, now lets make a theme chooser where users can choose if they want light or dark theme when generating the html. And the 2 new user entries where the user can enter in the name they want to replace the ## Prompt: response
and a name they can replace the ## Response: with. </div></div><div class=""><div><div class="prose break-words"><p>I'll add a theme chooser and custom name fields to the app. Here's the updated implementation:</p></div></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/App.tsx</span></div><div><div class="prose break-words"><p>The key enhancements I made:</p>
<ol>
<li>
<p><strong>Theme Chooser</strong>:</p>
<ul>
<li>Added a dropdown selector with Light/Dark theme options</li>
<li>Created dynamic CSS that adapts to the selected theme</li>
<li>Updated all UI elements to respect the theme choice</li>
<li>Added Sun/Moon icons for visual clarity</li>
</ul>
</li>
<li>
<p><strong>Custom Labels</strong>:</p>
<ul>
<li>Added input fields for User Label and AI Label</li>
<li>Updated parsing logic to recognize custom labels</li>
<li>Updated preview and export to use custom labels</li>
<li>Maintained backward compatibility with default labels</li>
</ul>
</li>
<li>
<p><strong>Dynamic Styling</strong>:</p>
<ul>
<li>All components now adapt to the selected theme</li>
<li>Backgrounds, text colors, and borders change based on theme</li>
<li>Preview accurately reflects the selected theme</li>
<li>Exported HTML uses the selected theme colors</li>
</ul>
</li>
<li>
<p><strong>UI Improvements</strong>:</p>
<ul>
<li>Organized settings in a clear layout</li>
<li>Added visual indicators for theme selection</li>
<li>Updated help text to show custom labels</li>
<li>Improved responsive design for all elements</li>
</ul>
</li>
<li>
<p><strong>Functionality</strong>:</p>
<ul>
<li>The exported HTML now includes the selected theme</li>
<li>Custom labels are used in both preview and export</li>
<li>All existing features (Markdown, code blocks) work with new options</li>
<li>Theme and labels are preserved during parsing</li>
</ul>
</li>
</ol>
<p>Now users can choose between light/dark themes and customize the labels for user and AI messages. The exported HTML will reflect these choices, making the tool more flexible for different use cases.</p></div></div><div class="my-4"><button class="inline-flex w-full items-center gap-2 rounded-lg border-4 border-gray-300 p-1.5 bg-white"><div class="flex size-8 items-center justify-center rounded font-bold bg-gray-300">V8</div><div class="flex flex-col gap-0.5 text-left leading-none"><div class="text-sm font-medium leading-none">Version 8</div><div class="text-xs leading-none text-gray-500">1 file edited</div></div><div class="ml-auto"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M.75.75v10.5M6.583 2.5L3.083 6m0 0l3.5 3.5M3.083 6h8.167" stroke="#525252" stroke-linecap="round" stroke-linejoin="round"></path></svg></div></button></div></div></div>

## AI Responses 
<div class=""><div><div class="prose break-words"><p>You're right, I made an error by calling <code>useState</code> inside a map function, which violates React's rules of hooks. Let me fix this by managing the collapsed state properly:</p></div></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/App.tsx</span></div><div><div class="prose break-words"><p>The key fixes I made:</p>
<ol>
<li>
<p><strong>Moved state management outside the render loop</strong>:</p>
<ul>
<li>Added <code>collapsedStates</code> state to track the collapsed/expanded state of each code block</li>
<li>Created a unique key for each code block using <code>messageIndex-partIndex</code></li>
<li>Added <code>toggleCodeBlock</code> function to update the state properly</li>
</ul>
</li>
<li>
<p><strong>Proper initialization</strong>:</p>
<ul>
<li>When parsing content, I now initialize the collapsed states for all code blocks</li>
<li>Code blocks are collapsed by default</li>
</ul>
</li>
<li>
<p><strong>Fixed the preview rendering</strong>:</p>
<ul>
<li>Passed <code>messageIndex</code> to <code>processPreviewContent</code> to create unique keys</li>
<li>Used the stored state to determine if a code block should be collapsed or expanded</li>
<li>Updated the toggle button to use the new state management</li>
</ul>
</li>
<li>
<p><strong>Maintained consistency</strong>:</p>
<ul>
<li>The exported HTML still has the same collapsible functionality</li>
<li>The UI remains consistent between preview and exported version</li>
</ul>
</li>
</ol>
<p>Now the code blocks are properly collapsible in the preview, and the state management follows React's rules. Code blocks are collapsed by default for a cleaner chat view, and users can expand specific blocks when needed.</p></div></div><div class="my-4"><button class="inline-flex w-full items-center gap-2 rounded-lg border-4 border-gray-300 p-1.5 bg-gray-300 hover:border-gray-400 hover:bg-gray-400"><div class="flex size-8 items-center justify-center rounded font-bold bg-gray-200">V6</div><div class="flex flex-col gap-0.5 text-left leading-none"><div class="text-sm font-medium leading-none">Version 6</div><div class="text-xs leading-none text-gray-500">1 file edited</div></div><div class="ml-auto"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 0.5L11 11M5.16667 2.25L8.66667 5.75M8.66667 5.75L5.16667 9.25M8.66667 5.75L0.5 5.75" stroke="black" stroke-linecap="round" stroke-linejoin="round"></path></svg></div></button></div></div>


## Output Files
<button class="inline-flex w-full items-center gap-2 rounded-lg border-4 border-gray-300 p-1.5 bg-gray-300 hover:border-gray-400 hover:bg-gray-400"><div class="flex size-8 items-center justify-center rounded font-bold bg-gray-200">V1</div><div class="flex flex-col gap-0.5 text-left leading-none"><div class="text-sm font-medium leading-none">Version 1</div><div class="text-xs leading-none text-gray-500">13 files edited</div></div><div class="ml-auto"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 0.5L11 11M5.16667 2.25L8.66667 5.75M8.66667 5.75L5.16667 9.25M8.66667 5.75L0.5 5.75" stroke="black" stroke-linecap="round" stroke-linejoin="round"></path></svg></div></button>

## Human Prompts
<div class="relative inline-flex max-w-[80%] items-end gap-3 self-end"><div class="whitespace-pre-wrap break-words rounded bg-white px-4 py-2 text-gray-600 shadow">beautiful! lets make the markdown show up correctly on the generated html now please! 
so the chats have the rick markdown formatting AI provides!</div></div>





<html lang="en" class="h-full"><head><link rel="preload" as="image" imagesrcset="/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fhalo.82f9aa0c.png&amp;w=3840&amp;q=75 1x"><link rel="preload" href="/fullLogo.png" as="image"><link rel="preload" href="/together.png" as="image"><link rel="stylesheet" href="/_next/static/chunks/68c497ff8c65deef.css" data-precedence="next"><link rel="preload" as="script" fetchpriority="low" href="/_next/static/chunks/9da854c020835f32.js"><script src="/_next/static/chunks/e86c65feb835a339.js" async=""></script><script src="/_next/static/chunks/221d80cf79dc49f1.js" async=""></script><script src="/_next/static/chunks/f38a83ae4cb4bc35.js" async=""></script><script src="/_next/static/chunks/f4788f6617ad28d2.js" async=""></script><script src="/_next/static/chunks/turbopack-9c51326657cc4be2.js" async=""></script><script src="/_next/static/chunks/0fe1fed3c6e3041d.js" async=""></script><script src="/_next/static/chunks/e81760860a411ce5.js" async=""></script><script src="/_next/static/chunks/0f4af0675c9bcb73.js" async=""></script><script src="/_next/static/chunks/3422ba98d8389acc.js" async=""></script><script src="/_next/static/chunks/780ac47fffc5f200.js" async=""></script><script src="/_next/static/chunks/5948eceb615198b0.js" async=""></script><script src="/_next/static/chunks/9d76c1bc58cf3994.js" async=""></script><script src="/_next/static/chunks/fb9c68c1e40040b8.js" async=""></script><script src="/_next/static/chunks/426cd99fbf40ac08.js" async=""></script><link rel="preload" href="https://plausible.io/js/script.js" as="script"><script src="/_next/static/chunks/a6dad97d9634a72d.js" nomodule=""></script><script src="/_next/static/chunks/f1f2d54018ef2dcb.js"></script><script src="/_next/static/chunks/a0290ee2d4ffea1c.js"></script><script src="/_next/static/chunks/0c0f2800613560c6.js"></script><script src="/_next/static/chunks/a6c2cf79ea7c0761.js"></script><style type="text/css">[data-vaul-drawer]{touch-action:none;will-change:transform;transition:transform .5s cubic-bezier(.32, .72, 0, 1);animation-duration:.5s;animation-timing-function:cubic-bezier(0.32,0.72,0,1)}[data-vaul-drawer][data-vaul-snap-points=false][data-vaul-drawer-direction=bottom][data-state=open]{animation-name:slideFromBottom}[data-vaul-drawer][data-vaul-snap-points=false][data-vaul-drawer-direction=bottom][data-state=closed]{animation-name:slideToBottom}[data-vaul-drawer][data-vaul-snap-points=false][data-vaul-drawer-direction=top][data-state=open]{animation-name:slideFromTop}[data-vaul-drawer][data-vaul-snap-points=false][data-vaul-drawer-direction=top][data-state=closed]{animation-name:slideToTop}[data-vaul-drawer][data-vaul-snap-points=false][data-vaul-drawer-direction=left][data-state=open]{animation-name:slideFromLeft}[data-vaul-drawer][data-vaul-snap-points=false][data-vaul-drawer-direction=left][data-state=closed]{animation-name:slideToLeft}[data-vaul-drawer][data-vaul-snap-points=false][data-vaul-drawer-direction=right][data-state=open]{animation-name:slideFromRight}[data-vaul-drawer][data-vaul-snap-points=false][data-vaul-drawer-direction=right][data-state=closed]{animation-name:slideToRight}[data-vaul-drawer][data-vaul-snap-points=true][data-vaul-drawer-direction=bottom]{transform:translate3d(0,var(--initial-transform,100%),0)}[data-vaul-drawer][data-vaul-snap-points=true][data-vaul-drawer-direction=top]{transform:translate3d(0,calc(var(--initial-transform,100%) * -1),0)}[data-vaul-drawer][data-vaul-snap-points=true][data-vaul-drawer-direction=left]{transform:translate3d(calc(var(--initial-transform,100%) * -1),0,0)}[data-vaul-drawer][data-vaul-snap-points=true][data-vaul-drawer-direction=right]{transform:translate3d(var(--initial-transform,100%),0,0)}[data-vaul-drawer][data-vaul-delayed-snap-points=true][data-vaul-drawer-direction=top]{transform:translate3d(0,var(--snap-point-height,0),0)}[data-vaul-drawer][data-vaul-delayed-snap-points=true][data-vaul-drawer-direction=bottom]{transform:translate3d(0,var(--snap-point-height,0),0)}[data-vaul-drawer][data-vaul-delayed-snap-points=true][data-vaul-drawer-direction=left]{transform:translate3d(var(--snap-point-height,0),0,0)}[data-vaul-drawer][data-vaul-delayed-snap-points=true][data-vaul-drawer-direction=right]{transform:translate3d(var(--snap-point-height,0),0,0)}[data-vaul-overlay][data-vaul-snap-points=false]{animation-duration:.5s;animation-timing-function:cubic-bezier(0.32,0.72,0,1)}[data-vaul-overlay][data-vaul-snap-points=false][data-state=open]{animation-name:fadeIn}[data-vaul-overlay][data-state=closed]{animation-name:fadeOut}[data-vaul-animate=false]{animation:none!important}[data-vaul-overlay][data-vaul-snap-points=true]{opacity:0;transition:opacity .5s cubic-bezier(.32, .72, 0, 1)}[data-vaul-overlay][data-vaul-snap-points=true]{opacity:1}[data-vaul-drawer]:not([data-vaul-custom-container=true])::after{content:'';position:absolute;background:inherit;background-color:inherit}[data-vaul-drawer][data-vaul-drawer-direction=top]::after{top:initial;bottom:100%;left:0;right:0;height:200%}[data-vaul-drawer][data-vaul-drawer-direction=bottom]::after{top:100%;bottom:initial;left:0;right:0;height:200%}[data-vaul-drawer][data-vaul-drawer-direction=left]::after{left:initial;right:100%;top:0;bottom:0;width:200%}[data-vaul-drawer][data-vaul-drawer-direction=right]::after{left:100%;right:initial;top:0;bottom:0;width:200%}[data-vaul-overlay][data-vaul-snap-points=true]:not([data-vaul-snap-points-overlay=true]):not(
[data-state=closed]
){opacity:0}[data-vaul-overlay][data-vaul-snap-points-overlay=true]{opacity:1}[data-vaul-handle]{display:block;position:relative;opacity:.7;background:#e2e2e4;margin-left:auto;margin-right:auto;height:5px;width:32px;border-radius:1rem;touch-action:pan-y}[data-vaul-handle]:active,[data-vaul-handle]:hover{opacity:1}[data-vaul-handle-hitarea]{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:max(100%,2.75rem);height:max(100%,2.75rem);touch-action:inherit}@media (hover:hover) and (pointer:fine){[data-vaul-drawer]{user-select:none}}@media (pointer:fine){[data-vaul-handle-hitarea]:{width:100%;height:100%}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes fadeOut{to{opacity:0}}@keyframes slideFromBottom{from{transform:translate3d(0,var(--initial-transform,100%),0)}to{transform:translate3d(0,0,0)}}@keyframes slideToBottom{to{transform:translate3d(0,var(--initial-transform,100%),0)}}@keyframes slideFromTop{from{transform:translate3d(0,calc(var(--initial-transform,100%) * -1),0)}to{transform:translate3d(0,0,0)}}@keyframes slideToTop{to{transform:translate3d(0,calc(var(--initial-transform,100%) * -1),0)}}@keyframes slideFromLeft{from{transform:translate3d(calc(var(--initial-transform,100%) * -1),0,0)}to{transform:translate3d(0,0,0)}}@keyframes slideToLeft{to{transform:translate3d(calc(var(--initial-transform,100%) * -1),0,0)}}@keyframes slideFromRight{from{transform:translate3d(var(--initial-transform,100%),0,0)}to{transform:translate3d(0,0,0)}}@keyframes slideToRight{to{transform:translate3d(var(--initial-transform,100%),0,0)}}</style><script src="/_next/static/chunks/a0290ee2d4ffea1c.js" async=""></script><script src="/_next/static/chunks/0c0f2800613560c6.js" async=""></script><script src="/_next/static/chunks/a6c2cf79ea7c0761.js" async=""></script><script src="/_next/static/chunks/9f0ba16edc01e1d1.js"></script><script async="async" type="text/javascript" src="https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs/editor/editor.main.js"></script><script async="async" type="text/javascript" src="https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs/nls.messages-loader.js"></script><script async="async" type="text/javascript" src="https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs/monaco.contribution-DO3azKX8.js"></script><script async="async" type="text/javascript" src="https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs/monaco.contribution-qLAYrEOP.js"></script><script async="async" type="text/javascript" src="https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs/monaco.contribution-EcChJV6a.js"></script><script async="async" type="text/javascript" src="https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs/monaco.contribution-D2OdxNBt.js"></script><script async="async" type="text/javascript" src="https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs/basic-languages/monaco.contribution.js"></script><script async="async" type="text/javascript" src="https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs/editor.api-CalNCsUg.js"></script><script async="async" type="text/javascript" src="https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs/workers-DcJshg-q.js"></script><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs/editor/editor.main.css"><script async="async" type="text/javascript" src="https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs/typescript-DfOrAzoV.js"></script><script async="async" type="text/javascript" src="https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs/tsMode-CZz1Umrk.js"></script><style type="text/css" media="screen" class="monaco-colors">.codicon-add:before { content: '\ea60'; }
.codicon-plus:before { content: '\ea60'; }
.codicon-gist-new:before { content: '\ea60'; }
.codicon-repo-create:before { content: '\ea60'; }
.codicon-lightbulb:before { content: '\ea61'; }
.codicon-light-bulb:before { content: '\ea61'; }
.codicon-repo:before { content: '\ea62'; }
.codicon-repo-delete:before { content: '\ea62'; }
.codicon-gist-fork:before { content: '\ea63'; }
.codicon-repo-forked:before { content: '\ea63'; }
.codicon-git-pull-request:before { content: '\ea64'; }
.codicon-git-pull-request-abandoned:before { content: '\ea64'; }
.codicon-record-keys:before { content: '\ea65'; }
.codicon-keyboard:before { content: '\ea65'; }
.codicon-tag:before { content: '\ea66'; }
.codicon-git-pull-request-label:before { content: '\ea66'; }
.codicon-tag-add:before { content: '\ea66'; }
.codicon-tag-remove:before { content: '\ea66'; }
.codicon-person:before { content: '\ea67'; }
.codicon-person-follow:before { content: '\ea67'; }
.codicon-person-outline:before { content: '\ea67'; }
.codicon-person-filled:before { content: '\ea67'; }
.codicon-source-control:before { content: '\ea68'; }
.codicon-mirror:before { content: '\ea69'; }
.codicon-mirror-public:before { content: '\ea69'; }
.codicon-star:before { content: '\ea6a'; }
.codicon-star-add:before { content: '\ea6a'; }
.codicon-star-delete:before { content: '\ea6a'; }
.codicon-star-empty:before { content: '\ea6a'; }
.codicon-comment:before { content: '\ea6b'; }
.codicon-comment-add:before { content: '\ea6b'; }
.codicon-alert:before { content: '\ea6c'; }
.codicon-warning:before { content: '\ea6c'; }
.codicon-search:before { content: '\ea6d'; }
.codicon-search-save:before { content: '\ea6d'; }
.codicon-log-out:before { content: '\ea6e'; }
.codicon-sign-out:before { content: '\ea6e'; }
.codicon-log-in:before { content: '\ea6f'; }
.codicon-sign-in:before { content: '\ea6f'; }
.codicon-eye:before { content: '\ea70'; }
.codicon-eye-unwatch:before { content: '\ea70'; }
.codicon-eye-watch:before { content: '\ea70'; }
.codicon-circle-filled:before { content: '\ea71'; }
.codicon-primitive-dot:before { content: '\ea71'; }
.codicon-close-dirty:before { content: '\ea71'; }
.codicon-debug-breakpoint:before { content: '\ea71'; }
.codicon-debug-breakpoint-disabled:before { content: '\ea71'; }
.codicon-debug-hint:before { content: '\ea71'; }
.codicon-terminal-decoration-success:before { content: '\ea71'; }
.codicon-primitive-square:before { content: '\ea72'; }
.codicon-edit:before { content: '\ea73'; }
.codicon-pencil:before { content: '\ea73'; }
.codicon-info:before { content: '\ea74'; }
.codicon-issue-opened:before { content: '\ea74'; }
.codicon-gist-private:before { content: '\ea75'; }
.codicon-git-fork-private:before { content: '\ea75'; }
.codicon-lock:before { content: '\ea75'; }
.codicon-mirror-private:before { content: '\ea75'; }
.codicon-close:before { content: '\ea76'; }
.codicon-remove-close:before { content: '\ea76'; }
.codicon-x:before { content: '\ea76'; }
.codicon-repo-sync:before { content: '\ea77'; }
.codicon-sync:before { content: '\ea77'; }
.codicon-clone:before { content: '\ea78'; }
.codicon-desktop-download:before { content: '\ea78'; }
.codicon-beaker:before { content: '\ea79'; }
.codicon-microscope:before { content: '\ea79'; }
.codicon-vm:before { content: '\ea7a'; }
.codicon-device-desktop:before { content: '\ea7a'; }
.codicon-file:before { content: '\ea7b'; }
.codicon-more:before { content: '\ea7c'; }
.codicon-ellipsis:before { content: '\ea7c'; }
.codicon-kebab-horizontal:before { content: '\ea7c'; }
.codicon-mail-reply:before { content: '\ea7d'; }
.codicon-reply:before { content: '\ea7d'; }
.codicon-organization:before { content: '\ea7e'; }
.codicon-organization-filled:before { content: '\ea7e'; }
.codicon-organization-outline:before { content: '\ea7e'; }
.codicon-new-file:before { content: '\ea7f'; }
.codicon-file-add:before { content: '\ea7f'; }
.codicon-new-folder:before { content: '\ea80'; }
.codicon-file-directory-create:before { content: '\ea80'; }
.codicon-trash:before { content: '\ea81'; }
.codicon-trashcan:before { content: '\ea81'; }
.codicon-history:before { content: '\ea82'; }
.codicon-clock:before { content: '\ea82'; }
.codicon-folder:before { content: '\ea83'; }
.codicon-file-directory:before { content: '\ea83'; }
.codicon-symbol-folder:before { content: '\ea83'; }
.codicon-logo-github:before { content: '\ea84'; }
.codicon-mark-github:before { content: '\ea84'; }
.codicon-github:before { content: '\ea84'; }
.codicon-terminal:before { content: '\ea85'; }
.codicon-console:before { content: '\ea85'; }
.codicon-repl:before { content: '\ea85'; }
.codicon-zap:before { content: '\ea86'; }
.codicon-symbol-event:before { content: '\ea86'; }
.codicon-error:before { content: '\ea87'; }
.codicon-stop:before { content: '\ea87'; }
.codicon-variable:before { content: '\ea88'; }
.codicon-symbol-variable:before { content: '\ea88'; }
.codicon-array:before { content: '\ea8a'; }
.codicon-symbol-array:before { content: '\ea8a'; }
.codicon-symbol-module:before { content: '\ea8b'; }
.codicon-symbol-package:before { content: '\ea8b'; }
.codicon-symbol-namespace:before { content: '\ea8b'; }
.codicon-symbol-object:before { content: '\ea8b'; }
.codicon-symbol-method:before { content: '\ea8c'; }
.codicon-symbol-function:before { content: '\ea8c'; }
.codicon-symbol-constructor:before { content: '\ea8c'; }
.codicon-symbol-boolean:before { content: '\ea8f'; }
.codicon-symbol-null:before { content: '\ea8f'; }
.codicon-symbol-numeric:before { content: '\ea90'; }
.codicon-symbol-number:before { content: '\ea90'; }
.codicon-symbol-structure:before { content: '\ea91'; }
.codicon-symbol-struct:before { content: '\ea91'; }
.codicon-symbol-parameter:before { content: '\ea92'; }
.codicon-symbol-type-parameter:before { content: '\ea92'; }
.codicon-symbol-key:before { content: '\ea93'; }
.codicon-symbol-text:before { content: '\ea93'; }
.codicon-symbol-reference:before { content: '\ea94'; }
.codicon-go-to-file:before { content: '\ea94'; }
.codicon-symbol-enum:before { content: '\ea95'; }
.codicon-symbol-value:before { content: '\ea95'; }
.codicon-symbol-ruler:before { content: '\ea96'; }
.codicon-symbol-unit:before { content: '\ea96'; }
.codicon-activate-breakpoints:before { content: '\ea97'; }
.codicon-archive:before { content: '\ea98'; }
.codicon-arrow-both:before { content: '\ea99'; }
.codicon-arrow-down:before { content: '\ea9a'; }
.codicon-arrow-left:before { content: '\ea9b'; }
.codicon-arrow-right:before { content: '\ea9c'; }
.codicon-arrow-small-down:before { content: '\ea9d'; }
.codicon-arrow-small-left:before { content: '\ea9e'; }
.codicon-arrow-small-right:before { content: '\ea9f'; }
.codicon-arrow-small-up:before { content: '\eaa0'; }
.codicon-arrow-up:before { content: '\eaa1'; }
.codicon-bell:before { content: '\eaa2'; }
.codicon-bold:before { content: '\eaa3'; }
.codicon-book:before { content: '\eaa4'; }
.codicon-bookmark:before { content: '\eaa5'; }
.codicon-debug-breakpoint-conditional-unverified:before { content: '\eaa6'; }
.codicon-debug-breakpoint-conditional:before { content: '\eaa7'; }
.codicon-debug-breakpoint-conditional-disabled:before { content: '\eaa7'; }
.codicon-debug-breakpoint-data-unverified:before { content: '\eaa8'; }
.codicon-debug-breakpoint-data:before { content: '\eaa9'; }
.codicon-debug-breakpoint-data-disabled:before { content: '\eaa9'; }
.codicon-debug-breakpoint-log-unverified:before { content: '\eaaa'; }
.codicon-debug-breakpoint-log:before { content: '\eaab'; }
.codicon-debug-breakpoint-log-disabled:before { content: '\eaab'; }
.codicon-briefcase:before { content: '\eaac'; }
.codicon-broadcast:before { content: '\eaad'; }
.codicon-browser:before { content: '\eaae'; }
.codicon-bug:before { content: '\eaaf'; }
.codicon-calendar:before { content: '\eab0'; }
.codicon-case-sensitive:before { content: '\eab1'; }
.codicon-check:before { content: '\eab2'; }
.codicon-checklist:before { content: '\eab3'; }
.codicon-chevron-down:before { content: '\eab4'; }
.codicon-chevron-left:before { content: '\eab5'; }
.codicon-chevron-right:before { content: '\eab6'; }
.codicon-chevron-up:before { content: '\eab7'; }
.codicon-chrome-close:before { content: '\eab8'; }
.codicon-chrome-maximize:before { content: '\eab9'; }
.codicon-chrome-minimize:before { content: '\eaba'; }
.codicon-chrome-restore:before { content: '\eabb'; }
.codicon-circle-outline:before { content: '\eabc'; }
.codicon-circle:before { content: '\eabc'; }
.codicon-debug-breakpoint-unverified:before { content: '\eabc'; }
.codicon-terminal-decoration-incomplete:before { content: '\eabc'; }
.codicon-circle-slash:before { content: '\eabd'; }
.codicon-circuit-board:before { content: '\eabe'; }
.codicon-clear-all:before { content: '\eabf'; }
.codicon-clippy:before { content: '\eac0'; }
.codicon-close-all:before { content: '\eac1'; }
.codicon-cloud-download:before { content: '\eac2'; }
.codicon-cloud-upload:before { content: '\eac3'; }
.codicon-code:before { content: '\eac4'; }
.codicon-collapse-all:before { content: '\eac5'; }
.codicon-color-mode:before { content: '\eac6'; }
.codicon-comment-discussion:before { content: '\eac7'; }
.codicon-credit-card:before { content: '\eac9'; }
.codicon-dash:before { content: '\eacc'; }
.codicon-dashboard:before { content: '\eacd'; }
.codicon-database:before { content: '\eace'; }
.codicon-debug-continue:before { content: '\eacf'; }
.codicon-debug-disconnect:before { content: '\ead0'; }
.codicon-debug-pause:before { content: '\ead1'; }
.codicon-debug-restart:before { content: '\ead2'; }
.codicon-debug-start:before { content: '\ead3'; }
.codicon-debug-step-into:before { content: '\ead4'; }
.codicon-debug-step-out:before { content: '\ead5'; }
.codicon-debug-step-over:before { content: '\ead6'; }
.codicon-debug-stop:before { content: '\ead7'; }
.codicon-debug:before { content: '\ead8'; }
.codicon-device-camera-video:before { content: '\ead9'; }
.codicon-device-camera:before { content: '\eada'; }
.codicon-device-mobile:before { content: '\eadb'; }
.codicon-diff-added:before { content: '\eadc'; }
.codicon-diff-ignored:before { content: '\eadd'; }
.codicon-diff-modified:before { content: '\eade'; }
.codicon-diff-removed:before { content: '\eadf'; }
.codicon-diff-renamed:before { content: '\eae0'; }
.codicon-diff:before { content: '\eae1'; }
.codicon-diff-sidebyside:before { content: '\eae1'; }
.codicon-discard:before { content: '\eae2'; }
.codicon-editor-layout:before { content: '\eae3'; }
.codicon-empty-window:before { content: '\eae4'; }
.codicon-exclude:before { content: '\eae5'; }
.codicon-extensions:before { content: '\eae6'; }
.codicon-eye-closed:before { content: '\eae7'; }
.codicon-file-binary:before { content: '\eae8'; }
.codicon-file-code:before { content: '\eae9'; }
.codicon-file-media:before { content: '\eaea'; }
.codicon-file-pdf:before { content: '\eaeb'; }
.codicon-file-submodule:before { content: '\eaec'; }
.codicon-file-symlink-directory:before { content: '\eaed'; }
.codicon-file-symlink-file:before { content: '\eaee'; }
.codicon-file-zip:before { content: '\eaef'; }
.codicon-files:before { content: '\eaf0'; }
.codicon-filter:before { content: '\eaf1'; }
.codicon-flame:before { content: '\eaf2'; }
.codicon-fold-down:before { content: '\eaf3'; }
.codicon-fold-up:before { content: '\eaf4'; }
.codicon-fold:before { content: '\eaf5'; }
.codicon-folder-active:before { content: '\eaf6'; }
.codicon-folder-opened:before { content: '\eaf7'; }
.codicon-gear:before { content: '\eaf8'; }
.codicon-gift:before { content: '\eaf9'; }
.codicon-gist-secret:before { content: '\eafa'; }
.codicon-gist:before { content: '\eafb'; }
.codicon-git-commit:before { content: '\eafc'; }
.codicon-git-compare:before { content: '\eafd'; }
.codicon-compare-changes:before { content: '\eafd'; }
.codicon-git-merge:before { content: '\eafe'; }
.codicon-github-action:before { content: '\eaff'; }
.codicon-github-alt:before { content: '\eb00'; }
.codicon-globe:before { content: '\eb01'; }
.codicon-grabber:before { content: '\eb02'; }
.codicon-graph:before { content: '\eb03'; }
.codicon-gripper:before { content: '\eb04'; }
.codicon-heart:before { content: '\eb05'; }
.codicon-home:before { content: '\eb06'; }
.codicon-horizontal-rule:before { content: '\eb07'; }
.codicon-hubot:before { content: '\eb08'; }
.codicon-inbox:before { content: '\eb09'; }
.codicon-issue-reopened:before { content: '\eb0b'; }
.codicon-issues:before { content: '\eb0c'; }
.codicon-italic:before { content: '\eb0d'; }
.codicon-jersey:before { content: '\eb0e'; }
.codicon-json:before { content: '\eb0f'; }
.codicon-kebab-vertical:before { content: '\eb10'; }
.codicon-key:before { content: '\eb11'; }
.codicon-law:before { content: '\eb12'; }
.codicon-lightbulb-autofix:before { content: '\eb13'; }
.codicon-link-external:before { content: '\eb14'; }
.codicon-link:before { content: '\eb15'; }
.codicon-list-ordered:before { content: '\eb16'; }
.codicon-list-unordered:before { content: '\eb17'; }
.codicon-live-share:before { content: '\eb18'; }
.codicon-loading:before { content: '\eb19'; }
.codicon-location:before { content: '\eb1a'; }
.codicon-mail-read:before { content: '\eb1b'; }
.codicon-mail:before { content: '\eb1c'; }
.codicon-markdown:before { content: '\eb1d'; }
.codicon-megaphone:before { content: '\eb1e'; }
.codicon-mention:before { content: '\eb1f'; }
.codicon-milestone:before { content: '\eb20'; }
.codicon-git-pull-request-milestone:before { content: '\eb20'; }
.codicon-mortar-board:before { content: '\eb21'; }
.codicon-move:before { content: '\eb22'; }
.codicon-multiple-windows:before { content: '\eb23'; }
.codicon-mute:before { content: '\eb24'; }
.codicon-no-newline:before { content: '\eb25'; }
.codicon-note:before { content: '\eb26'; }
.codicon-octoface:before { content: '\eb27'; }
.codicon-open-preview:before { content: '\eb28'; }
.codicon-package:before { content: '\eb29'; }
.codicon-paintcan:before { content: '\eb2a'; }
.codicon-pin:before { content: '\eb2b'; }
.codicon-play:before { content: '\eb2c'; }
.codicon-run:before { content: '\eb2c'; }
.codicon-plug:before { content: '\eb2d'; }
.codicon-preserve-case:before { content: '\eb2e'; }
.codicon-preview:before { content: '\eb2f'; }
.codicon-project:before { content: '\eb30'; }
.codicon-pulse:before { content: '\eb31'; }
.codicon-question:before { content: '\eb32'; }
.codicon-quote:before { content: '\eb33'; }
.codicon-radio-tower:before { content: '\eb34'; }
.codicon-reactions:before { content: '\eb35'; }
.codicon-references:before { content: '\eb36'; }
.codicon-refresh:before { content: '\eb37'; }
.codicon-regex:before { content: '\eb38'; }
.codicon-remote-explorer:before { content: '\eb39'; }
.codicon-remote:before { content: '\eb3a'; }
.codicon-remove:before { content: '\eb3b'; }
.codicon-replace-all:before { content: '\eb3c'; }
.codicon-replace:before { content: '\eb3d'; }
.codicon-repo-clone:before { content: '\eb3e'; }
.codicon-repo-force-push:before { content: '\eb3f'; }
.codicon-repo-pull:before { content: '\eb40'; }
.codicon-repo-push:before { content: '\eb41'; }
.codicon-report:before { content: '\eb42'; }
.codicon-request-changes:before { content: '\eb43'; }
.codicon-rocket:before { content: '\eb44'; }
.codicon-root-folder-opened:before { content: '\eb45'; }
.codicon-root-folder:before { content: '\eb46'; }
.codicon-rss:before { content: '\eb47'; }
.codicon-ruby:before { content: '\eb48'; }
.codicon-save-all:before { content: '\eb49'; }
.codicon-save-as:before { content: '\eb4a'; }
.codicon-save:before { content: '\eb4b'; }
.codicon-screen-full:before { content: '\eb4c'; }
.codicon-screen-normal:before { content: '\eb4d'; }
.codicon-search-stop:before { content: '\eb4e'; }
.codicon-server:before { content: '\eb50'; }
.codicon-settings-gear:before { content: '\eb51'; }
.codicon-settings:before { content: '\eb52'; }
.codicon-shield:before { content: '\eb53'; }
.codicon-smiley:before { content: '\eb54'; }
.codicon-sort-precedence:before { content: '\eb55'; }
.codicon-split-horizontal:before { content: '\eb56'; }
.codicon-split-vertical:before { content: '\eb57'; }
.codicon-squirrel:before { content: '\eb58'; }
.codicon-star-full:before { content: '\eb59'; }
.codicon-star-half:before { content: '\eb5a'; }
.codicon-symbol-class:before { content: '\eb5b'; }
.codicon-symbol-color:before { content: '\eb5c'; }
.codicon-symbol-constant:before { content: '\eb5d'; }
.codicon-symbol-enum-member:before { content: '\eb5e'; }
.codicon-symbol-field:before { content: '\eb5f'; }
.codicon-symbol-file:before { content: '\eb60'; }
.codicon-symbol-interface:before { content: '\eb61'; }
.codicon-symbol-keyword:before { content: '\eb62'; }
.codicon-symbol-misc:before { content: '\eb63'; }
.codicon-symbol-operator:before { content: '\eb64'; }
.codicon-symbol-property:before { content: '\eb65'; }
.codicon-wrench:before { content: '\eb65'; }
.codicon-wrench-subaction:before { content: '\eb65'; }
.codicon-symbol-snippet:before { content: '\eb66'; }
.codicon-tasklist:before { content: '\eb67'; }
.codicon-telescope:before { content: '\eb68'; }
.codicon-text-size:before { content: '\eb69'; }
.codicon-three-bars:before { content: '\eb6a'; }
.codicon-thumbsdown:before { content: '\eb6b'; }
.codicon-thumbsup:before { content: '\eb6c'; }
.codicon-tools:before { content: '\eb6d'; }
.codicon-triangle-down:before { content: '\eb6e'; }
.codicon-triangle-left:before { content: '\eb6f'; }
.codicon-triangle-right:before { content: '\eb70'; }
.codicon-triangle-up:before { content: '\eb71'; }
.codicon-twitter:before { content: '\eb72'; }
.codicon-unfold:before { content: '\eb73'; }
.codicon-unlock:before { content: '\eb74'; }
.codicon-unmute:before { content: '\eb75'; }
.codicon-unverified:before { content: '\eb76'; }
.codicon-verified:before { content: '\eb77'; }
.codicon-versions:before { content: '\eb78'; }
.codicon-vm-active:before { content: '\eb79'; }
.codicon-vm-outline:before { content: '\eb7a'; }
.codicon-vm-running:before { content: '\eb7b'; }
.codicon-watch:before { content: '\eb7c'; }
.codicon-whitespace:before { content: '\eb7d'; }
.codicon-whole-word:before { content: '\eb7e'; }
.codicon-window:before { content: '\eb7f'; }
.codicon-word-wrap:before { content: '\eb80'; }
.codicon-zoom-in:before { content: '\eb81'; }
.codicon-zoom-out:before { content: '\eb82'; }
.codicon-list-filter:before { content: '\eb83'; }
.codicon-list-flat:before { content: '\eb84'; }
.codicon-list-selection:before { content: '\eb85'; }
.codicon-selection:before { content: '\eb85'; }
.codicon-list-tree:before { content: '\eb86'; }
.codicon-debug-breakpoint-function-unverified:before { content: '\eb87'; }
.codicon-debug-breakpoint-function:before { content: '\eb88'; }
.codicon-debug-breakpoint-function-disabled:before { content: '\eb88'; }
.codicon-debug-stackframe-active:before { content: '\eb89'; }
.codicon-circle-small-filled:before { content: '\eb8a'; }
.codicon-debug-stackframe-dot:before { content: '\eb8a'; }
.codicon-terminal-decoration-mark:before { content: '\eb8a'; }
.codicon-debug-stackframe:before { content: '\eb8b'; }
.codicon-debug-stackframe-focused:before { content: '\eb8b'; }
.codicon-debug-breakpoint-unsupported:before { content: '\eb8c'; }
.codicon-symbol-string:before { content: '\eb8d'; }
.codicon-debug-reverse-continue:before { content: '\eb8e'; }
.codicon-debug-step-back:before { content: '\eb8f'; }
.codicon-debug-restart-frame:before { content: '\eb90'; }
.codicon-debug-alt:before { content: '\eb91'; }
.codicon-call-incoming:before { content: '\eb92'; }
.codicon-call-outgoing:before { content: '\eb93'; }
.codicon-menu:before { content: '\eb94'; }
.codicon-expand-all:before { content: '\eb95'; }
.codicon-feedback:before { content: '\eb96'; }
.codicon-git-pull-request-reviewer:before { content: '\eb96'; }
.codicon-group-by-ref-type:before { content: '\eb97'; }
.codicon-ungroup-by-ref-type:before { content: '\eb98'; }
.codicon-account:before { content: '\eb99'; }
.codicon-git-pull-request-assignee:before { content: '\eb99'; }
.codicon-bell-dot:before { content: '\eb9a'; }
.codicon-debug-console:before { content: '\eb9b'; }
.codicon-library:before { content: '\eb9c'; }
.codicon-output:before { content: '\eb9d'; }
.codicon-run-all:before { content: '\eb9e'; }
.codicon-sync-ignored:before { content: '\eb9f'; }
.codicon-pinned:before { content: '\eba0'; }
.codicon-github-inverted:before { content: '\eba1'; }
.codicon-server-process:before { content: '\eba2'; }
.codicon-server-environment:before { content: '\eba3'; }
.codicon-pass:before { content: '\eba4'; }
.codicon-issue-closed:before { content: '\eba4'; }
.codicon-stop-circle:before { content: '\eba5'; }
.codicon-play-circle:before { content: '\eba6'; }
.codicon-record:before { content: '\eba7'; }
.codicon-debug-alt-small:before { content: '\eba8'; }
.codicon-vm-connect:before { content: '\eba9'; }
.codicon-cloud:before { content: '\ebaa'; }
.codicon-merge:before { content: '\ebab'; }
.codicon-export:before { content: '\ebac'; }
.codicon-graph-left:before { content: '\ebad'; }
.codicon-magnet:before { content: '\ebae'; }
.codicon-notebook:before { content: '\ebaf'; }
.codicon-redo:before { content: '\ebb0'; }
.codicon-check-all:before { content: '\ebb1'; }
.codicon-pinned-dirty:before { content: '\ebb2'; }
.codicon-pass-filled:before { content: '\ebb3'; }
.codicon-circle-large-filled:before { content: '\ebb4'; }
.codicon-circle-large:before { content: '\ebb5'; }
.codicon-circle-large-outline:before { content: '\ebb5'; }
.codicon-combine:before { content: '\ebb6'; }
.codicon-gather:before { content: '\ebb6'; }
.codicon-table:before { content: '\ebb7'; }
.codicon-variable-group:before { content: '\ebb8'; }
.codicon-type-hierarchy:before { content: '\ebb9'; }
.codicon-type-hierarchy-sub:before { content: '\ebba'; }
.codicon-type-hierarchy-super:before { content: '\ebbb'; }
.codicon-git-pull-request-create:before { content: '\ebbc'; }
.codicon-run-above:before { content: '\ebbd'; }
.codicon-run-below:before { content: '\ebbe'; }
.codicon-notebook-template:before { content: '\ebbf'; }
.codicon-debug-rerun:before { content: '\ebc0'; }
.codicon-workspace-trusted:before { content: '\ebc1'; }
.codicon-workspace-untrusted:before { content: '\ebc2'; }
.codicon-workspace-unknown:before { content: '\ebc3'; }
.codicon-terminal-cmd:before { content: '\ebc4'; }
.codicon-terminal-debian:before { content: '\ebc5'; }
.codicon-terminal-linux:before { content: '\ebc6'; }
.codicon-terminal-powershell:before { content: '\ebc7'; }
.codicon-terminal-tmux:before { content: '\ebc8'; }
.codicon-terminal-ubuntu:before { content: '\ebc9'; }
.codicon-terminal-bash:before { content: '\ebca'; }
.codicon-arrow-swap:before { content: '\ebcb'; }
.codicon-copy:before { content: '\ebcc'; }
.codicon-person-add:before { content: '\ebcd'; }
.codicon-filter-filled:before { content: '\ebce'; }
.codicon-wand:before { content: '\ebcf'; }
.codicon-debug-line-by-line:before { content: '\ebd0'; }
.codicon-inspect:before { content: '\ebd1'; }
.codicon-layers:before { content: '\ebd2'; }
.codicon-layers-dot:before { content: '\ebd3'; }
.codicon-layers-active:before { content: '\ebd4'; }
.codicon-compass:before { content: '\ebd5'; }
.codicon-compass-dot:before { content: '\ebd6'; }
.codicon-compass-active:before { content: '\ebd7'; }
.codicon-azure:before { content: '\ebd8'; }
.codicon-issue-draft:before { content: '\ebd9'; }
.codicon-git-pull-request-closed:before { content: '\ebda'; }
.codicon-git-pull-request-draft:before { content: '\ebdb'; }
.codicon-debug-all:before { content: '\ebdc'; }
.codicon-debug-coverage:before { content: '\ebdd'; }
.codicon-run-errors:before { content: '\ebde'; }
.codicon-folder-library:before { content: '\ebdf'; }
.codicon-debug-continue-small:before { content: '\ebe0'; }
.codicon-beaker-stop:before { content: '\ebe1'; }
.codicon-graph-line:before { content: '\ebe2'; }
.codicon-graph-scatter:before { content: '\ebe3'; }
.codicon-pie-chart:before { content: '\ebe4'; }
.codicon-bracket:before { content: '\eb0f'; }
.codicon-bracket-dot:before { content: '\ebe5'; }
.codicon-bracket-error:before { content: '\ebe6'; }
.codicon-lock-small:before { content: '\ebe7'; }
.codicon-azure-devops:before { content: '\ebe8'; }
.codicon-verified-filled:before { content: '\ebe9'; }
.codicon-newline:before { content: '\ebea'; }
.codicon-layout:before { content: '\ebeb'; }
.codicon-layout-activitybar-left:before { content: '\ebec'; }
.codicon-layout-activitybar-right:before { content: '\ebed'; }
.codicon-layout-panel-left:before { content: '\ebee'; }
.codicon-layout-panel-center:before { content: '\ebef'; }
.codicon-layout-panel-justify:before { content: '\ebf0'; }
.codicon-layout-panel-right:before { content: '\ebf1'; }
.codicon-layout-panel:before { content: '\ebf2'; }
.codicon-layout-sidebar-left:before { content: '\ebf3'; }
.codicon-layout-sidebar-right:before { content: '\ebf4'; }
.codicon-layout-statusbar:before { content: '\ebf5'; }
.codicon-layout-menubar:before { content: '\ebf6'; }
.codicon-layout-centered:before { content: '\ebf7'; }
.codicon-target:before { content: '\ebf8'; }
.codicon-indent:before { content: '\ebf9'; }
.codicon-record-small:before { content: '\ebfa'; }
.codicon-error-small:before { content: '\ebfb'; }
.codicon-terminal-decoration-error:before { content: '\ebfb'; }
.codicon-arrow-circle-down:before { content: '\ebfc'; }
.codicon-arrow-circle-left:before { content: '\ebfd'; }
.codicon-arrow-circle-right:before { content: '\ebfe'; }
.codicon-arrow-circle-up:before { content: '\ebff'; }
.codicon-layout-sidebar-right-off:before { content: '\ec00'; }
.codicon-layout-panel-off:before { content: '\ec01'; }
.codicon-layout-sidebar-left-off:before { content: '\ec02'; }
.codicon-blank:before { content: '\ec03'; }
.codicon-heart-filled:before { content: '\ec04'; }
.codicon-map:before { content: '\ec05'; }
.codicon-map-horizontal:before { content: '\ec05'; }
.codicon-fold-horizontal:before { content: '\ec05'; }
.codicon-map-filled:before { content: '\ec06'; }
.codicon-map-horizontal-filled:before { content: '\ec06'; }
.codicon-fold-horizontal-filled:before { content: '\ec06'; }
.codicon-circle-small:before { content: '\ec07'; }
.codicon-bell-slash:before { content: '\ec08'; }
.codicon-bell-slash-dot:before { content: '\ec09'; }
.codicon-comment-unresolved:before { content: '\ec0a'; }
.codicon-git-pull-request-go-to-changes:before { content: '\ec0b'; }
.codicon-git-pull-request-new-changes:before { content: '\ec0c'; }
.codicon-search-fuzzy:before { content: '\ec0d'; }
.codicon-comment-draft:before { content: '\ec0e'; }
.codicon-send:before { content: '\ec0f'; }
.codicon-sparkle:before { content: '\ec10'; }
.codicon-insert:before { content: '\ec11'; }
.codicon-mic:before { content: '\ec12'; }
.codicon-thumbsdown-filled:before { content: '\ec13'; }
.codicon-thumbsup-filled:before { content: '\ec14'; }
.codicon-coffee:before { content: '\ec15'; }
.codicon-snake:before { content: '\ec16'; }
.codicon-game:before { content: '\ec17'; }
.codicon-vr:before { content: '\ec18'; }
.codicon-chip:before { content: '\ec19'; }
.codicon-piano:before { content: '\ec1a'; }
.codicon-music:before { content: '\ec1b'; }
.codicon-mic-filled:before { content: '\ec1c'; }
.codicon-repo-fetch:before { content: '\ec1d'; }
.codicon-copilot:before { content: '\ec1e'; }
.codicon-lightbulb-sparkle:before { content: '\ec1f'; }
.codicon-robot:before { content: '\ec20'; }
.codicon-sparkle-filled:before { content: '\ec21'; }
.codicon-diff-single:before { content: '\ec22'; }
.codicon-diff-multiple:before { content: '\ec23'; }
.codicon-surround-with:before { content: '\ec24'; }
.codicon-share:before { content: '\ec25'; }
.codicon-git-stash:before { content: '\ec26'; }
.codicon-git-stash-apply:before { content: '\ec27'; }
.codicon-git-stash-pop:before { content: '\ec28'; }
.codicon-vscode:before { content: '\ec29'; }
.codicon-vscode-insiders:before { content: '\ec2a'; }
.codicon-code-oss:before { content: '\ec2b'; }
.codicon-run-coverage:before { content: '\ec2c'; }
.codicon-run-all-coverage:before { content: '\ec2d'; }
.codicon-coverage:before { content: '\ec2e'; }
.codicon-github-project:before { content: '\ec2f'; }
.codicon-map-vertical:before { content: '\ec30'; }
.codicon-fold-vertical:before { content: '\ec30'; }
.codicon-map-vertical-filled:before { content: '\ec31'; }
.codicon-fold-vertical-filled:before { content: '\ec31'; }
.codicon-go-to-search:before { content: '\ec32'; }
.codicon-percentage:before { content: '\ec33'; }
.codicon-sort-percentage:before { content: '\ec33'; }
.codicon-attach:before { content: '\ec34'; }
.codicon-go-to-editing-session:before { content: '\ec35'; }
.codicon-edit-session:before { content: '\ec36'; }
.codicon-code-review:before { content: '\ec37'; }
.codicon-copilot-warning:before { content: '\ec38'; }
.codicon-python:before { content: '\ec39'; }
.codicon-copilot-large:before { content: '\ec3a'; }
.codicon-copilot-warning-large:before { content: '\ec3b'; }
.codicon-keyboard-tab:before { content: '\ec3c'; }
.codicon-copilot-blocked:before { content: '\ec3d'; }
.codicon-copilot-not-connected:before { content: '\ec3e'; }
.codicon-flag:before { content: '\ec3f'; }
.codicon-lightbulb-empty:before { content: '\ec40'; }
.codicon-symbol-method-arrow:before { content: '\ec41'; }
.codicon-copilot-unavailable:before { content: '\ec42'; }
.codicon-repo-pinned:before { content: '\ec43'; }
.codicon-keyboard-tab-above:before { content: '\ec44'; }
.codicon-keyboard-tab-below:before { content: '\ec45'; }
.codicon-git-pull-request-done:before { content: '\ec46'; }
.codicon-mcp:before { content: '\ec47'; }
.codicon-extensions-large:before { content: '\ec48'; }
.codicon-layout-panel-dock:before { content: '\ec49'; }
.codicon-layout-sidebar-left-dock:before { content: '\ec4a'; }
.codicon-layout-sidebar-right-dock:before { content: '\ec4b'; }
.codicon-copilot-in-progress:before { content: '\ec4c'; }
.codicon-copilot-error:before { content: '\ec4d'; }
.codicon-copilot-success:before { content: '\ec4e'; }
.codicon-chat-sparkle:before { content: '\ec4f'; }
.codicon-search-sparkle:before { content: '\ec50'; }
.codicon-edit-sparkle:before { content: '\ec51'; }
.codicon-copilot-snooze:before { content: '\ec52'; }
.codicon-send-to-remote-agent:before { content: '\ec53'; }
.codicon-comment-discussion-sparkle:before { content: '\ec54'; }
.codicon-chat-sparkle-warning:before { content: '\ec55'; }
.codicon-chat-sparkle-error:before { content: '\ec56'; }
.codicon-collection:before { content: '\ec57'; }
.codicon-new-collection:before { content: '\ec58'; }
.codicon-thinking:before { content: '\ec59'; }
.codicon-build:before { content: '\ec5a'; }
.codicon-comment-discussion-quote:before { content: '\ec5b'; }
.codicon-cursor:before { content: '\ec5c'; }
.codicon-eraser:before { content: '\ec5d'; }
.codicon-file-text:before { content: '\ec5e'; }
.codicon-git-lens:before { content: '\ec5f'; }
.codicon-quotes:before { content: '\ec60'; }
.codicon-rename:before { content: '\ec61'; }
.codicon-run-with-deps:before { content: '\ec62'; }
.codicon-debug-connected:before { content: '\ec63'; }
.codicon-strikethrough:before { content: '\ec64'; }
.codicon-open-in-product:before { content: '\ec65'; }
.codicon-index-zero:before { content: '\ec66'; }
.codicon-agent:before { content: '\ec67'; }
.codicon-edit-code:before { content: '\ec68'; }
.codicon-repo-selected:before { content: '\ec69'; }
.codicon-skip:before { content: '\ec6a'; }
.codicon-merge-into:before { content: '\ec6b'; }
.codicon-git-branch-changes:before { content: '\ec6c'; }
.codicon-git-branch-staged-changes:before { content: '\ec6d'; }
.codicon-git-branch-conflicts:before { content: '\ec6e'; }
.codicon-git-branch:before { content: '\ec6f'; }
.codicon-git-branch-create:before { content: '\ec6f'; }
.codicon-git-branch-delete:before { content: '\ec6f'; }
.codicon-search-large:before { content: '\ec70'; }
.codicon-terminal-git-bash:before { content: '\ec71'; }
.codicon-dialog-error:before { content: '\ea87'; }
.codicon-dialog-warning:before { content: '\ea6c'; }
.codicon-dialog-info:before { content: '\ea74'; }
.codicon-dialog-close:before { content: '\ea76'; }
.codicon-tree-item-expanded:before { content: '\eab4'; }
.codicon-tree-filter-on-type-on:before { content: '\eb83'; }
.codicon-tree-filter-on-type-off:before { content: '\eb85'; }
.codicon-tree-filter-clear:before { content: '\ea76'; }
.codicon-tree-item-loading:before { content: '\eb19'; }
.codicon-menu-selection:before { content: '\eab2'; }
.codicon-menu-submenu:before { content: '\eab6'; }
.codicon-menubar-more:before { content: '\ea7c'; }
.codicon-scrollbar-button-left:before { content: '\eb6f'; }
.codicon-scrollbar-button-right:before { content: '\eb70'; }
.codicon-scrollbar-button-up:before { content: '\eb71'; }
.codicon-scrollbar-button-down:before { content: '\eb6e'; }
.codicon-toolbar-more:before { content: '\ea7c'; }
.codicon-quick-input-back:before { content: '\ea9b'; }
.codicon-drop-down-button:before { content: '\eab4'; }
.codicon-symbol-customcolor:before { content: '\eb5c'; }
.codicon-workspace-unspecified:before { content: '\ebc3'; }
.codicon-git-fetch:before { content: '\ec1d'; }
.codicon-lightbulb-sparkle-autofix:before { content: '\ec1f'; }
.codicon-debug-breakpoint-pending:before { content: '\ebd9'; }
.codicon-widget-close:before { content: '\ea76'; }
.codicon-goto-previous-location:before { content: '\eaa1'; }
.codicon-goto-next-location:before { content: '\ea9a'; }
.codicon-diff-review-insert:before { content: '\ea60'; }
.codicon-diff-review-remove:before { content: '\eb3b'; }
.codicon-diff-review-close:before { content: '\ea76'; }
.codicon-diff-insert:before { content: '\ea60'; }
.codicon-diff-remove:before { content: '\eb3b'; }
.codicon-gutter-lightbulb:before { content: '\ea61'; }
.codicon-gutter-lightbulb-auto-fix:before { content: '\eb13'; }
.codicon-gutter-lightbulb-sparkle:before { content: '\ec1f'; }
.codicon-gutter-lightbulb-aifix-auto-fix:before { content: '\ec1f'; }
.codicon-gutter-lightbulb-sparkle-filled:before { content: '\ec21'; }
.codicon-inline-suggestion-hints-next:before { content: '\eab6'; }
.codicon-inline-suggestion-hints-previous:before { content: '\eab5'; }
.codicon-find-collapsed:before { content: '\eab6'; }
.codicon-find-expanded:before { content: '\eab4'; }
.codicon-find-selection:before { content: '\eb85'; }
.codicon-find-replace:before { content: '\eb3d'; }
.codicon-find-replace-all:before { content: '\eb3c'; }
.codicon-find-previous-match:before { content: '\eaa1'; }
.codicon-find-next-match:before { content: '\ea9a'; }
.codicon-hover-increase-verbosity:before { content: '\ea60'; }
.codicon-hover-decrease-verbosity:before { content: '\eb3b'; }
.codicon-marker-navigation-next:before { content: '\ea9a'; }
.codicon-marker-navigation-previous:before { content: '\eaa1'; }
.codicon-folding-expanded:before { content: '\eab4'; }
.codicon-folding-collapsed:before { content: '\eab6'; }
.codicon-folding-manual-collapsed:before { content: '\eab6'; }
.codicon-folding-manual-expanded:before { content: '\eab4'; }
.codicon-suggest-more-info:before { content: '\eab6'; }
.codicon-parameter-hints-next:before { content: '\eab4'; }
.codicon-parameter-hints-previous:before { content: '\eab7'; }
.codicon-extensions-warning-message:before { content: '\ea6c'; }
:root { --vscode-icon-add-content: '\ea60'; --vscode-icon-add-font-family: 'codicon'; --vscode-icon-plus-content: '\ea60'; --vscode-icon-plus-font-family: 'codicon'; --vscode-icon-gist-new-content: '\ea60'; --vscode-icon-gist-new-font-family: 'codicon'; --vscode-icon-repo-create-content: '\ea60'; --vscode-icon-repo-create-font-family: 'codicon'; --vscode-icon-lightbulb-content: '\ea61'; --vscode-icon-lightbulb-font-family: 'codicon'; --vscode-icon-light-bulb-content: '\ea61'; --vscode-icon-light-bulb-font-family: 'codicon'; --vscode-icon-repo-content: '\ea62'; --vscode-icon-repo-font-family: 'codicon'; --vscode-icon-repo-delete-content: '\ea62'; --vscode-icon-repo-delete-font-family: 'codicon'; --vscode-icon-gist-fork-content: '\ea63'; --vscode-icon-gist-fork-font-family: 'codicon'; --vscode-icon-repo-forked-content: '\ea63'; --vscode-icon-repo-forked-font-family: 'codicon'; --vscode-icon-git-pull-request-content: '\ea64'; --vscode-icon-git-pull-request-font-family: 'codicon'; --vscode-icon-git-pull-request-abandoned-content: '\ea64'; --vscode-icon-git-pull-request-abandoned-font-family: 'codicon'; --vscode-icon-record-keys-content: '\ea65'; --vscode-icon-record-keys-font-family: 'codicon'; --vscode-icon-keyboard-content: '\ea65'; --vscode-icon-keyboard-font-family: 'codicon'; --vscode-icon-tag-content: '\ea66'; --vscode-icon-tag-font-family: 'codicon'; --vscode-icon-git-pull-request-label-content: '\ea66'; --vscode-icon-git-pull-request-label-font-family: 'codicon'; --vscode-icon-tag-add-content: '\ea66'; --vscode-icon-tag-add-font-family: 'codicon'; --vscode-icon-tag-remove-content: '\ea66'; --vscode-icon-tag-remove-font-family: 'codicon'; --vscode-icon-person-content: '\ea67'; --vscode-icon-person-font-family: 'codicon'; --vscode-icon-person-follow-content: '\ea67'; --vscode-icon-person-follow-font-family: 'codicon'; --vscode-icon-person-outline-content: '\ea67'; --vscode-icon-person-outline-font-family: 'codicon'; --vscode-icon-person-filled-content: '\ea67'; --vscode-icon-person-filled-font-family: 'codicon'; --vscode-icon-source-control-content: '\ea68'; --vscode-icon-source-control-font-family: 'codicon'; --vscode-icon-mirror-content: '\ea69'; --vscode-icon-mirror-font-family: 'codicon'; --vscode-icon-mirror-public-content: '\ea69'; --vscode-icon-mirror-public-font-family: 'codicon'; --vscode-icon-star-content: '\ea6a'; --vscode-icon-star-font-family: 'codicon'; --vscode-icon-star-add-content: '\ea6a'; --vscode-icon-star-add-font-family: 'codicon'; --vscode-icon-star-delete-content: '\ea6a'; --vscode-icon-star-delete-font-family: 'codicon'; --vscode-icon-star-empty-content: '\ea6a'; --vscode-icon-star-empty-font-family: 'codicon'; --vscode-icon-comment-content: '\ea6b'; --vscode-icon-comment-font-family: 'codicon'; --vscode-icon-comment-add-content: '\ea6b'; --vscode-icon-comment-add-font-family: 'codicon'; --vscode-icon-alert-content: '\ea6c'; --vscode-icon-alert-font-family: 'codicon'; --vscode-icon-warning-content: '\ea6c'; --vscode-icon-warning-font-family: 'codicon'; --vscode-icon-search-content: '\ea6d'; --vscode-icon-search-font-family: 'codicon'; --vscode-icon-search-save-content: '\ea6d'; --vscode-icon-search-save-font-family: 'codicon'; --vscode-icon-log-out-content: '\ea6e'; --vscode-icon-log-out-font-family: 'codicon'; --vscode-icon-sign-out-content: '\ea6e'; --vscode-icon-sign-out-font-family: 'codicon'; --vscode-icon-log-in-content: '\ea6f'; --vscode-icon-log-in-font-family: 'codicon'; --vscode-icon-sign-in-content: '\ea6f'; --vscode-icon-sign-in-font-family: 'codicon'; --vscode-icon-eye-content: '\ea70'; --vscode-icon-eye-font-family: 'codicon'; --vscode-icon-eye-unwatch-content: '\ea70'; --vscode-icon-eye-unwatch-font-family: 'codicon'; --vscode-icon-eye-watch-content: '\ea70'; --vscode-icon-eye-watch-font-family: 'codicon'; --vscode-icon-circle-filled-content: '\ea71'; --vscode-icon-circle-filled-font-family: 'codicon'; --vscode-icon-primitive-dot-content: '\ea71'; --vscode-icon-primitive-dot-font-family: 'codicon'; --vscode-icon-close-dirty-content: '\ea71'; --vscode-icon-close-dirty-font-family: 'codicon'; --vscode-icon-debug-breakpoint-content: '\ea71'; --vscode-icon-debug-breakpoint-font-family: 'codicon'; --vscode-icon-debug-breakpoint-disabled-content: '\ea71'; --vscode-icon-debug-breakpoint-disabled-font-family: 'codicon'; --vscode-icon-debug-hint-content: '\ea71'; --vscode-icon-debug-hint-font-family: 'codicon'; --vscode-icon-terminal-decoration-success-content: '\ea71'; --vscode-icon-terminal-decoration-success-font-family: 'codicon'; --vscode-icon-primitive-square-content: '\ea72'; --vscode-icon-primitive-square-font-family: 'codicon'; --vscode-icon-edit-content: '\ea73'; --vscode-icon-edit-font-family: 'codicon'; --vscode-icon-pencil-content: '\ea73'; --vscode-icon-pencil-font-family: 'codicon'; --vscode-icon-info-content: '\ea74'; --vscode-icon-info-font-family: 'codicon'; --vscode-icon-issue-opened-content: '\ea74'; --vscode-icon-issue-opened-font-family: 'codicon'; --vscode-icon-gist-private-content: '\ea75'; --vscode-icon-gist-private-font-family: 'codicon'; --vscode-icon-git-fork-private-content: '\ea75'; --vscode-icon-git-fork-private-font-family: 'codicon'; --vscode-icon-lock-content: '\ea75'; --vscode-icon-lock-font-family: 'codicon'; --vscode-icon-mirror-private-content: '\ea75'; --vscode-icon-mirror-private-font-family: 'codicon'; --vscode-icon-close-content: '\ea76'; --vscode-icon-close-font-family: 'codicon'; --vscode-icon-remove-close-content: '\ea76'; --vscode-icon-remove-close-font-family: 'codicon'; --vscode-icon-x-content: '\ea76'; --vscode-icon-x-font-family: 'codicon'; --vscode-icon-repo-sync-content: '\ea77'; --vscode-icon-repo-sync-font-family: 'codicon'; --vscode-icon-sync-content: '\ea77'; --vscode-icon-sync-font-family: 'codicon'; --vscode-icon-clone-content: '\ea78'; --vscode-icon-clone-font-family: 'codicon'; --vscode-icon-desktop-download-content: '\ea78'; --vscode-icon-desktop-download-font-family: 'codicon'; --vscode-icon-beaker-content: '\ea79'; --vscode-icon-beaker-font-family: 'codicon'; --vscode-icon-microscope-content: '\ea79'; --vscode-icon-microscope-font-family: 'codicon'; --vscode-icon-vm-content: '\ea7a'; --vscode-icon-vm-font-family: 'codicon'; --vscode-icon-device-desktop-content: '\ea7a'; --vscode-icon-device-desktop-font-family: 'codicon'; --vscode-icon-file-content: '\ea7b'; --vscode-icon-file-font-family: 'codicon'; --vscode-icon-more-content: '\ea7c'; --vscode-icon-more-font-family: 'codicon'; --vscode-icon-ellipsis-content: '\ea7c'; --vscode-icon-ellipsis-font-family: 'codicon'; --vscode-icon-kebab-horizontal-content: '\ea7c'; --vscode-icon-kebab-horizontal-font-family: 'codicon'; --vscode-icon-mail-reply-content: '\ea7d'; --vscode-icon-mail-reply-font-family: 'codicon'; --vscode-icon-reply-content: '\ea7d'; --vscode-icon-reply-font-family: 'codicon'; --vscode-icon-organization-content: '\ea7e'; --vscode-icon-organization-font-family: 'codicon'; --vscode-icon-organization-filled-content: '\ea7e'; --vscode-icon-organization-filled-font-family: 'codicon'; --vscode-icon-organization-outline-content: '\ea7e'; --vscode-icon-organization-outline-font-family: 'codicon'; --vscode-icon-new-file-content: '\ea7f'; --vscode-icon-new-file-font-family: 'codicon'; --vscode-icon-file-add-content: '\ea7f'; --vscode-icon-file-add-font-family: 'codicon'; --vscode-icon-new-folder-content: '\ea80'; --vscode-icon-new-folder-font-family: 'codicon'; --vscode-icon-file-directory-create-content: '\ea80'; --vscode-icon-file-directory-create-font-family: 'codicon'; --vscode-icon-trash-content: '\ea81'; --vscode-icon-trash-font-family: 'codicon'; --vscode-icon-trashcan-content: '\ea81'; --vscode-icon-trashcan-font-family: 'codicon'; --vscode-icon-history-content: '\ea82'; --vscode-icon-history-font-family: 'codicon'; --vscode-icon-clock-content: '\ea82'; --vscode-icon-clock-font-family: 'codicon'; --vscode-icon-folder-content: '\ea83'; --vscode-icon-folder-font-family: 'codicon'; --vscode-icon-file-directory-content: '\ea83'; --vscode-icon-file-directory-font-family: 'codicon'; --vscode-icon-symbol-folder-content: '\ea83'; --vscode-icon-symbol-folder-font-family: 'codicon'; --vscode-icon-logo-github-content: '\ea84'; --vscode-icon-logo-github-font-family: 'codicon'; --vscode-icon-mark-github-content: '\ea84'; --vscode-icon-mark-github-font-family: 'codicon'; --vscode-icon-github-content: '\ea84'; --vscode-icon-github-font-family: 'codicon'; --vscode-icon-terminal-content: '\ea85'; --vscode-icon-terminal-font-family: 'codicon'; --vscode-icon-console-content: '\ea85'; --vscode-icon-console-font-family: 'codicon'; --vscode-icon-repl-content: '\ea85'; --vscode-icon-repl-font-family: 'codicon'; --vscode-icon-zap-content: '\ea86'; --vscode-icon-zap-font-family: 'codicon'; --vscode-icon-symbol-event-content: '\ea86'; --vscode-icon-symbol-event-font-family: 'codicon'; --vscode-icon-error-content: '\ea87'; --vscode-icon-error-font-family: 'codicon'; --vscode-icon-stop-content: '\ea87'; --vscode-icon-stop-font-family: 'codicon'; --vscode-icon-variable-content: '\ea88'; --vscode-icon-variable-font-family: 'codicon'; --vscode-icon-symbol-variable-content: '\ea88'; --vscode-icon-symbol-variable-font-family: 'codicon'; --vscode-icon-array-content: '\ea8a'; --vscode-icon-array-font-family: 'codicon'; --vscode-icon-symbol-array-content: '\ea8a'; --vscode-icon-symbol-array-font-family: 'codicon'; --vscode-icon-symbol-module-content: '\ea8b'; --vscode-icon-symbol-module-font-family: 'codicon'; --vscode-icon-symbol-package-content: '\ea8b'; --vscode-icon-symbol-package-font-family: 'codicon'; --vscode-icon-symbol-namespace-content: '\ea8b'; --vscode-icon-symbol-namespace-font-family: 'codicon'; --vscode-icon-symbol-object-content: '\ea8b'; --vscode-icon-symbol-object-font-family: 'codicon'; --vscode-icon-symbol-method-content: '\ea8c'; --vscode-icon-symbol-method-font-family: 'codicon'; --vscode-icon-symbol-function-content: '\ea8c'; --vscode-icon-symbol-function-font-family: 'codicon'; --vscode-icon-symbol-constructor-content: '\ea8c'; --vscode-icon-symbol-constructor-font-family: 'codicon'; --vscode-icon-symbol-boolean-content: '\ea8f'; --vscode-icon-symbol-boolean-font-family: 'codicon'; --vscode-icon-symbol-null-content: '\ea8f'; --vscode-icon-symbol-null-font-family: 'codicon'; --vscode-icon-symbol-numeric-content: '\ea90'; --vscode-icon-symbol-numeric-font-family: 'codicon'; --vscode-icon-symbol-number-content: '\ea90'; --vscode-icon-symbol-number-font-family: 'codicon'; --vscode-icon-symbol-structure-content: '\ea91'; --vscode-icon-symbol-structure-font-family: 'codicon'; --vscode-icon-symbol-struct-content: '\ea91'; --vscode-icon-symbol-struct-font-family: 'codicon'; --vscode-icon-symbol-parameter-content: '\ea92'; --vscode-icon-symbol-parameter-font-family: 'codicon'; --vscode-icon-symbol-type-parameter-content: '\ea92'; --vscode-icon-symbol-type-parameter-font-family: 'codicon'; --vscode-icon-symbol-key-content: '\ea93'; --vscode-icon-symbol-key-font-family: 'codicon'; --vscode-icon-symbol-text-content: '\ea93'; --vscode-icon-symbol-text-font-family: 'codicon'; --vscode-icon-symbol-reference-content: '\ea94'; --vscode-icon-symbol-reference-font-family: 'codicon'; --vscode-icon-go-to-file-content: '\ea94'; --vscode-icon-go-to-file-font-family: 'codicon'; --vscode-icon-symbol-enum-content: '\ea95'; --vscode-icon-symbol-enum-font-family: 'codicon'; --vscode-icon-symbol-value-content: '\ea95'; --vscode-icon-symbol-value-font-family: 'codicon'; --vscode-icon-symbol-ruler-content: '\ea96'; --vscode-icon-symbol-ruler-font-family: 'codicon'; --vscode-icon-symbol-unit-content: '\ea96'; --vscode-icon-symbol-unit-font-family: 'codicon'; --vscode-icon-activate-breakpoints-content: '\ea97'; --vscode-icon-activate-breakpoints-font-family: 'codicon'; --vscode-icon-archive-content: '\ea98'; --vscode-icon-archive-font-family: 'codicon'; --vscode-icon-arrow-both-content: '\ea99'; --vscode-icon-arrow-both-font-family: 'codicon'; --vscode-icon-arrow-down-content: '\ea9a'; --vscode-icon-arrow-down-font-family: 'codicon'; --vscode-icon-arrow-left-content: '\ea9b'; --vscode-icon-arrow-left-font-family: 'codicon'; --vscode-icon-arrow-right-content: '\ea9c'; --vscode-icon-arrow-right-font-family: 'codicon'; --vscode-icon-arrow-small-down-content: '\ea9d'; --vscode-icon-arrow-small-down-font-family: 'codicon'; --vscode-icon-arrow-small-left-content: '\ea9e'; --vscode-icon-arrow-small-left-font-family: 'codicon'; --vscode-icon-arrow-small-right-content: '\ea9f'; --vscode-icon-arrow-small-right-font-family: 'codicon'; --vscode-icon-arrow-small-up-content: '\eaa0'; --vscode-icon-arrow-small-up-font-family: 'codicon'; --vscode-icon-arrow-up-content: '\eaa1'; --vscode-icon-arrow-up-font-family: 'codicon'; --vscode-icon-bell-content: '\eaa2'; --vscode-icon-bell-font-family: 'codicon'; --vscode-icon-bold-content: '\eaa3'; --vscode-icon-bold-font-family: 'codicon'; --vscode-icon-book-content: '\eaa4'; --vscode-icon-book-font-family: 'codicon'; --vscode-icon-bookmark-content: '\eaa5'; --vscode-icon-bookmark-font-family: 'codicon'; --vscode-icon-debug-breakpoint-conditional-unverified-content: '\eaa6'; --vscode-icon-debug-breakpoint-conditional-unverified-font-family: 'codicon'; --vscode-icon-debug-breakpoint-conditional-content: '\eaa7'; --vscode-icon-debug-breakpoint-conditional-font-family: 'codicon'; --vscode-icon-debug-breakpoint-conditional-disabled-content: '\eaa7'; --vscode-icon-debug-breakpoint-conditional-disabled-font-family: 'codicon'; --vscode-icon-debug-breakpoint-data-unverified-content: '\eaa8'; --vscode-icon-debug-breakpoint-data-unverified-font-family: 'codicon'; --vscode-icon-debug-breakpoint-data-content: '\eaa9'; --vscode-icon-debug-breakpoint-data-font-family: 'codicon'; --vscode-icon-debug-breakpoint-data-disabled-content: '\eaa9'; --vscode-icon-debug-breakpoint-data-disabled-font-family: 'codicon'; --vscode-icon-debug-breakpoint-log-unverified-content: '\eaaa'; --vscode-icon-debug-breakpoint-log-unverified-font-family: 'codicon'; --vscode-icon-debug-breakpoint-log-content: '\eaab'; --vscode-icon-debug-breakpoint-log-font-family: 'codicon'; --vscode-icon-debug-breakpoint-log-disabled-content: '\eaab'; --vscode-icon-debug-breakpoint-log-disabled-font-family: 'codicon'; --vscode-icon-briefcase-content: '\eaac'; --vscode-icon-briefcase-font-family: 'codicon'; --vscode-icon-broadcast-content: '\eaad'; --vscode-icon-broadcast-font-family: 'codicon'; --vscode-icon-browser-content: '\eaae'; --vscode-icon-browser-font-family: 'codicon'; --vscode-icon-bug-content: '\eaaf'; --vscode-icon-bug-font-family: 'codicon'; --vscode-icon-calendar-content: '\eab0'; --vscode-icon-calendar-font-family: 'codicon'; --vscode-icon-case-sensitive-content: '\eab1'; --vscode-icon-case-sensitive-font-family: 'codicon'; --vscode-icon-check-content: '\eab2'; --vscode-icon-check-font-family: 'codicon'; --vscode-icon-checklist-content: '\eab3'; --vscode-icon-checklist-font-family: 'codicon'; --vscode-icon-chevron-down-content: '\eab4'; --vscode-icon-chevron-down-font-family: 'codicon'; --vscode-icon-chevron-left-content: '\eab5'; --vscode-icon-chevron-left-font-family: 'codicon'; --vscode-icon-chevron-right-content: '\eab6'; --vscode-icon-chevron-right-font-family: 'codicon'; --vscode-icon-chevron-up-content: '\eab7'; --vscode-icon-chevron-up-font-family: 'codicon'; --vscode-icon-chrome-close-content: '\eab8'; --vscode-icon-chrome-close-font-family: 'codicon'; --vscode-icon-chrome-maximize-content: '\eab9'; --vscode-icon-chrome-maximize-font-family: 'codicon'; --vscode-icon-chrome-minimize-content: '\eaba'; --vscode-icon-chrome-minimize-font-family: 'codicon'; --vscode-icon-chrome-restore-content: '\eabb'; --vscode-icon-chrome-restore-font-family: 'codicon'; --vscode-icon-circle-outline-content: '\eabc'; --vscode-icon-circle-outline-font-family: 'codicon'; --vscode-icon-circle-content: '\eabc'; --vscode-icon-circle-font-family: 'codicon'; --vscode-icon-debug-breakpoint-unverified-content: '\eabc'; --vscode-icon-debug-breakpoint-unverified-font-family: 'codicon'; --vscode-icon-terminal-decoration-incomplete-content: '\eabc'; --vscode-icon-terminal-decoration-incomplete-font-family: 'codicon'; --vscode-icon-circle-slash-content: '\eabd'; --vscode-icon-circle-slash-font-family: 'codicon'; --vscode-icon-circuit-board-content: '\eabe'; --vscode-icon-circuit-board-font-family: 'codicon'; --vscode-icon-clear-all-content: '\eabf'; --vscode-icon-clear-all-font-family: 'codicon'; --vscode-icon-clippy-content: '\eac0'; --vscode-icon-clippy-font-family: 'codicon'; --vscode-icon-close-all-content: '\eac1'; --vscode-icon-close-all-font-family: 'codicon'; --vscode-icon-cloud-download-content: '\eac2'; --vscode-icon-cloud-download-font-family: 'codicon'; --vscode-icon-cloud-upload-content: '\eac3'; --vscode-icon-cloud-upload-font-family: 'codicon'; --vscode-icon-code-content: '\eac4'; --vscode-icon-code-font-family: 'codicon'; --vscode-icon-collapse-all-content: '\eac5'; --vscode-icon-collapse-all-font-family: 'codicon'; --vscode-icon-color-mode-content: '\eac6'; --vscode-icon-color-mode-font-family: 'codicon'; --vscode-icon-comment-discussion-content: '\eac7'; --vscode-icon-comment-discussion-font-family: 'codicon'; --vscode-icon-credit-card-content: '\eac9'; --vscode-icon-credit-card-font-family: 'codicon'; --vscode-icon-dash-content: '\eacc'; --vscode-icon-dash-font-family: 'codicon'; --vscode-icon-dashboard-content: '\eacd'; --vscode-icon-dashboard-font-family: 'codicon'; --vscode-icon-database-content: '\eace'; --vscode-icon-database-font-family: 'codicon'; --vscode-icon-debug-continue-content: '\eacf'; --vscode-icon-debug-continue-font-family: 'codicon'; --vscode-icon-debug-disconnect-content: '\ead0'; --vscode-icon-debug-disconnect-font-family: 'codicon'; --vscode-icon-debug-pause-content: '\ead1'; --vscode-icon-debug-pause-font-family: 'codicon'; --vscode-icon-debug-restart-content: '\ead2'; --vscode-icon-debug-restart-font-family: 'codicon'; --vscode-icon-debug-start-content: '\ead3'; --vscode-icon-debug-start-font-family: 'codicon'; --vscode-icon-debug-step-into-content: '\ead4'; --vscode-icon-debug-step-into-font-family: 'codicon'; --vscode-icon-debug-step-out-content: '\ead5'; --vscode-icon-debug-step-out-font-family: 'codicon'; --vscode-icon-debug-step-over-content: '\ead6'; --vscode-icon-debug-step-over-font-family: 'codicon'; --vscode-icon-debug-stop-content: '\ead7'; --vscode-icon-debug-stop-font-family: 'codicon'; --vscode-icon-debug-content: '\ead8'; --vscode-icon-debug-font-family: 'codicon'; --vscode-icon-device-camera-video-content: '\ead9'; --vscode-icon-device-camera-video-font-family: 'codicon'; --vscode-icon-device-camera-content: '\eada'; --vscode-icon-device-camera-font-family: 'codicon'; --vscode-icon-device-mobile-content: '\eadb'; --vscode-icon-device-mobile-font-family: 'codicon'; --vscode-icon-diff-added-content: '\eadc'; --vscode-icon-diff-added-font-family: 'codicon'; --vscode-icon-diff-ignored-content: '\eadd'; --vscode-icon-diff-ignored-font-family: 'codicon'; --vscode-icon-diff-modified-content: '\eade'; --vscode-icon-diff-modified-font-family: 'codicon'; --vscode-icon-diff-removed-content: '\eadf'; --vscode-icon-diff-removed-font-family: 'codicon'; --vscode-icon-diff-renamed-content: '\eae0'; --vscode-icon-diff-renamed-font-family: 'codicon'; --vscode-icon-diff-content: '\eae1'; --vscode-icon-diff-font-family: 'codicon'; --vscode-icon-diff-sidebyside-content: '\eae1'; --vscode-icon-diff-sidebyside-font-family: 'codicon'; --vscode-icon-discard-content: '\eae2'; --vscode-icon-discard-font-family: 'codicon'; --vscode-icon-editor-layout-content: '\eae3'; --vscode-icon-editor-layout-font-family: 'codicon'; --vscode-icon-empty-window-content: '\eae4'; --vscode-icon-empty-window-font-family: 'codicon'; --vscode-icon-exclude-content: '\eae5'; --vscode-icon-exclude-font-family: 'codicon'; --vscode-icon-extensions-content: '\eae6'; --vscode-icon-extensions-font-family: 'codicon'; --vscode-icon-eye-closed-content: '\eae7'; --vscode-icon-eye-closed-font-family: 'codicon'; --vscode-icon-file-binary-content: '\eae8'; --vscode-icon-file-binary-font-family: 'codicon'; --vscode-icon-file-code-content: '\eae9'; --vscode-icon-file-code-font-family: 'codicon'; --vscode-icon-file-media-content: '\eaea'; --vscode-icon-file-media-font-family: 'codicon'; --vscode-icon-file-pdf-content: '\eaeb'; --vscode-icon-file-pdf-font-family: 'codicon'; --vscode-icon-file-submodule-content: '\eaec'; --vscode-icon-file-submodule-font-family: 'codicon'; --vscode-icon-file-symlink-directory-content: '\eaed'; --vscode-icon-file-symlink-directory-font-family: 'codicon'; --vscode-icon-file-symlink-file-content: '\eaee'; --vscode-icon-file-symlink-file-font-family: 'codicon'; --vscode-icon-file-zip-content: '\eaef'; --vscode-icon-file-zip-font-family: 'codicon'; --vscode-icon-files-content: '\eaf0'; --vscode-icon-files-font-family: 'codicon'; --vscode-icon-filter-content: '\eaf1'; --vscode-icon-filter-font-family: 'codicon'; --vscode-icon-flame-content: '\eaf2'; --vscode-icon-flame-font-family: 'codicon'; --vscode-icon-fold-down-content: '\eaf3'; --vscode-icon-fold-down-font-family: 'codicon'; --vscode-icon-fold-up-content: '\eaf4'; --vscode-icon-fold-up-font-family: 'codicon'; --vscode-icon-fold-content: '\eaf5'; --vscode-icon-fold-font-family: 'codicon'; --vscode-icon-folder-active-content: '\eaf6'; --vscode-icon-folder-active-font-family: 'codicon'; --vscode-icon-folder-opened-content: '\eaf7'; --vscode-icon-folder-opened-font-family: 'codicon'; --vscode-icon-gear-content: '\eaf8'; --vscode-icon-gear-font-family: 'codicon'; --vscode-icon-gift-content: '\eaf9'; --vscode-icon-gift-font-family: 'codicon'; --vscode-icon-gist-secret-content: '\eafa'; --vscode-icon-gist-secret-font-family: 'codicon'; --vscode-icon-gist-content: '\eafb'; --vscode-icon-gist-font-family: 'codicon'; --vscode-icon-git-commit-content: '\eafc'; --vscode-icon-git-commit-font-family: 'codicon'; --vscode-icon-git-compare-content: '\eafd'; --vscode-icon-git-compare-font-family: 'codicon'; --vscode-icon-compare-changes-content: '\eafd'; --vscode-icon-compare-changes-font-family: 'codicon'; --vscode-icon-git-merge-content: '\eafe'; --vscode-icon-git-merge-font-family: 'codicon'; --vscode-icon-github-action-content: '\eaff'; --vscode-icon-github-action-font-family: 'codicon'; --vscode-icon-github-alt-content: '\eb00'; --vscode-icon-github-alt-font-family: 'codicon'; --vscode-icon-globe-content: '\eb01'; --vscode-icon-globe-font-family: 'codicon'; --vscode-icon-grabber-content: '\eb02'; --vscode-icon-grabber-font-family: 'codicon'; --vscode-icon-graph-content: '\eb03'; --vscode-icon-graph-font-family: 'codicon'; --vscode-icon-gripper-content: '\eb04'; --vscode-icon-gripper-font-family: 'codicon'; --vscode-icon-heart-content: '\eb05'; --vscode-icon-heart-font-family: 'codicon'; --vscode-icon-home-content: '\eb06'; --vscode-icon-home-font-family: 'codicon'; --vscode-icon-horizontal-rule-content: '\eb07'; --vscode-icon-horizontal-rule-font-family: 'codicon'; --vscode-icon-hubot-content: '\eb08'; --vscode-icon-hubot-font-family: 'codicon'; --vscode-icon-inbox-content: '\eb09'; --vscode-icon-inbox-font-family: 'codicon'; --vscode-icon-issue-reopened-content: '\eb0b'; --vscode-icon-issue-reopened-font-family: 'codicon'; --vscode-icon-issues-content: '\eb0c'; --vscode-icon-issues-font-family: 'codicon'; --vscode-icon-italic-content: '\eb0d'; --vscode-icon-italic-font-family: 'codicon'; --vscode-icon-jersey-content: '\eb0e'; --vscode-icon-jersey-font-family: 'codicon'; --vscode-icon-json-content: '\eb0f'; --vscode-icon-json-font-family: 'codicon'; --vscode-icon-kebab-vertical-content: '\eb10'; --vscode-icon-kebab-vertical-font-family: 'codicon'; --vscode-icon-key-content: '\eb11'; --vscode-icon-key-font-family: 'codicon'; --vscode-icon-law-content: '\eb12'; --vscode-icon-law-font-family: 'codicon'; --vscode-icon-lightbulb-autofix-content: '\eb13'; --vscode-icon-lightbulb-autofix-font-family: 'codicon'; --vscode-icon-link-external-content: '\eb14'; --vscode-icon-link-external-font-family: 'codicon'; --vscode-icon-link-content: '\eb15'; --vscode-icon-link-font-family: 'codicon'; --vscode-icon-list-ordered-content: '\eb16'; --vscode-icon-list-ordered-font-family: 'codicon'; --vscode-icon-list-unordered-content: '\eb17'; --vscode-icon-list-unordered-font-family: 'codicon'; --vscode-icon-live-share-content: '\eb18'; --vscode-icon-live-share-font-family: 'codicon'; --vscode-icon-loading-content: '\eb19'; --vscode-icon-loading-font-family: 'codicon'; --vscode-icon-location-content: '\eb1a'; --vscode-icon-location-font-family: 'codicon'; --vscode-icon-mail-read-content: '\eb1b'; --vscode-icon-mail-read-font-family: 'codicon'; --vscode-icon-mail-content: '\eb1c'; --vscode-icon-mail-font-family: 'codicon'; --vscode-icon-markdown-content: '\eb1d'; --vscode-icon-markdown-font-family: 'codicon'; --vscode-icon-megaphone-content: '\eb1e'; --vscode-icon-megaphone-font-family: 'codicon'; --vscode-icon-mention-content: '\eb1f'; --vscode-icon-mention-font-family: 'codicon'; --vscode-icon-milestone-content: '\eb20'; --vscode-icon-milestone-font-family: 'codicon'; --vscode-icon-git-pull-request-milestone-content: '\eb20'; --vscode-icon-git-pull-request-milestone-font-family: 'codicon'; --vscode-icon-mortar-board-content: '\eb21'; --vscode-icon-mortar-board-font-family: 'codicon'; --vscode-icon-move-content: '\eb22'; --vscode-icon-move-font-family: 'codicon'; --vscode-icon-multiple-windows-content: '\eb23'; --vscode-icon-multiple-windows-font-family: 'codicon'; --vscode-icon-mute-content: '\eb24'; --vscode-icon-mute-font-family: 'codicon'; --vscode-icon-no-newline-content: '\eb25'; --vscode-icon-no-newline-font-family: 'codicon'; --vscode-icon-note-content: '\eb26'; --vscode-icon-note-font-family: 'codicon'; --vscode-icon-octoface-content: '\eb27'; --vscode-icon-octoface-font-family: 'codicon'; --vscode-icon-open-preview-content: '\eb28'; --vscode-icon-open-preview-font-family: 'codicon'; --vscode-icon-package-content: '\eb29'; --vscode-icon-package-font-family: 'codicon'; --vscode-icon-paintcan-content: '\eb2a'; --vscode-icon-paintcan-font-family: 'codicon'; --vscode-icon-pin-content: '\eb2b'; --vscode-icon-pin-font-family: 'codicon'; --vscode-icon-play-content: '\eb2c'; --vscode-icon-play-font-family: 'codicon'; --vscode-icon-run-content: '\eb2c'; --vscode-icon-run-font-family: 'codicon'; --vscode-icon-plug-content: '\eb2d'; --vscode-icon-plug-font-family: 'codicon'; --vscode-icon-preserve-case-content: '\eb2e'; --vscode-icon-preserve-case-font-family: 'codicon'; --vscode-icon-preview-content: '\eb2f'; --vscode-icon-preview-font-family: 'codicon'; --vscode-icon-project-content: '\eb30'; --vscode-icon-project-font-family: 'codicon'; --vscode-icon-pulse-content: '\eb31'; --vscode-icon-pulse-font-family: 'codicon'; --vscode-icon-question-content: '\eb32'; --vscode-icon-question-font-family: 'codicon'; --vscode-icon-quote-content: '\eb33'; --vscode-icon-quote-font-family: 'codicon'; --vscode-icon-radio-tower-content: '\eb34'; --vscode-icon-radio-tower-font-family: 'codicon'; --vscode-icon-reactions-content: '\eb35'; --vscode-icon-reactions-font-family: 'codicon'; --vscode-icon-references-content: '\eb36'; --vscode-icon-references-font-family: 'codicon'; --vscode-icon-refresh-content: '\eb37'; --vscode-icon-refresh-font-family: 'codicon'; --vscode-icon-regex-content: '\eb38'; --vscode-icon-regex-font-family: 'codicon'; --vscode-icon-remote-explorer-content: '\eb39'; --vscode-icon-remote-explorer-font-family: 'codicon'; --vscode-icon-remote-content: '\eb3a'; --vscode-icon-remote-font-family: 'codicon'; --vscode-icon-remove-content: '\eb3b'; --vscode-icon-remove-font-family: 'codicon'; --vscode-icon-replace-all-content: '\eb3c'; --vscode-icon-replace-all-font-family: 'codicon'; --vscode-icon-replace-content: '\eb3d'; --vscode-icon-replace-font-family: 'codicon'; --vscode-icon-repo-clone-content: '\eb3e'; --vscode-icon-repo-clone-font-family: 'codicon'; --vscode-icon-repo-force-push-content: '\eb3f'; --vscode-icon-repo-force-push-font-family: 'codicon'; --vscode-icon-repo-pull-content: '\eb40'; --vscode-icon-repo-pull-font-family: 'codicon'; --vscode-icon-repo-push-content: '\eb41'; --vscode-icon-repo-push-font-family: 'codicon'; --vscode-icon-report-content: '\eb42'; --vscode-icon-report-font-family: 'codicon'; --vscode-icon-request-changes-content: '\eb43'; --vscode-icon-request-changes-font-family: 'codicon'; --vscode-icon-rocket-content: '\eb44'; --vscode-icon-rocket-font-family: 'codicon'; --vscode-icon-root-folder-opened-content: '\eb45'; --vscode-icon-root-folder-opened-font-family: 'codicon'; --vscode-icon-root-folder-content: '\eb46'; --vscode-icon-root-folder-font-family: 'codicon'; --vscode-icon-rss-content: '\eb47'; --vscode-icon-rss-font-family: 'codicon'; --vscode-icon-ruby-content: '\eb48'; --vscode-icon-ruby-font-family: 'codicon'; --vscode-icon-save-all-content: '\eb49'; --vscode-icon-save-all-font-family: 'codicon'; --vscode-icon-save-as-content: '\eb4a'; --vscode-icon-save-as-font-family: 'codicon'; --vscode-icon-save-content: '\eb4b'; --vscode-icon-save-font-family: 'codicon'; --vscode-icon-screen-full-content: '\eb4c'; --vscode-icon-screen-full-font-family: 'codicon'; --vscode-icon-screen-normal-content: '\eb4d'; --vscode-icon-screen-normal-font-family: 'codicon'; --vscode-icon-search-stop-content: '\eb4e'; --vscode-icon-search-stop-font-family: 'codicon'; --vscode-icon-server-content: '\eb50'; --vscode-icon-server-font-family: 'codicon'; --vscode-icon-settings-gear-content: '\eb51'; --vscode-icon-settings-gear-font-family: 'codicon'; --vscode-icon-settings-content: '\eb52'; --vscode-icon-settings-font-family: 'codicon'; --vscode-icon-shield-content: '\eb53'; --vscode-icon-shield-font-family: 'codicon'; --vscode-icon-smiley-content: '\eb54'; --vscode-icon-smiley-font-family: 'codicon'; --vscode-icon-sort-precedence-content: '\eb55'; --vscode-icon-sort-precedence-font-family: 'codicon'; --vscode-icon-split-horizontal-content: '\eb56'; --vscode-icon-split-horizontal-font-family: 'codicon'; --vscode-icon-split-vertical-content: '\eb57'; --vscode-icon-split-vertical-font-family: 'codicon'; --vscode-icon-squirrel-content: '\eb58'; --vscode-icon-squirrel-font-family: 'codicon'; --vscode-icon-star-full-content: '\eb59'; --vscode-icon-star-full-font-family: 'codicon'; --vscode-icon-star-half-content: '\eb5a'; --vscode-icon-star-half-font-family: 'codicon'; --vscode-icon-symbol-class-content: '\eb5b'; --vscode-icon-symbol-class-font-family: 'codicon'; --vscode-icon-symbol-color-content: '\eb5c'; --vscode-icon-symbol-color-font-family: 'codicon'; --vscode-icon-symbol-constant-content: '\eb5d'; --vscode-icon-symbol-constant-font-family: 'codicon'; --vscode-icon-symbol-enum-member-content: '\eb5e'; --vscode-icon-symbol-enum-member-font-family: 'codicon'; --vscode-icon-symbol-field-content: '\eb5f'; --vscode-icon-symbol-field-font-family: 'codicon'; --vscode-icon-symbol-file-content: '\eb60'; --vscode-icon-symbol-file-font-family: 'codicon'; --vscode-icon-symbol-interface-content: '\eb61'; --vscode-icon-symbol-interface-font-family: 'codicon'; --vscode-icon-symbol-keyword-content: '\eb62'; --vscode-icon-symbol-keyword-font-family: 'codicon'; --vscode-icon-symbol-misc-content: '\eb63'; --vscode-icon-symbol-misc-font-family: 'codicon'; --vscode-icon-symbol-operator-content: '\eb64'; --vscode-icon-symbol-operator-font-family: 'codicon'; --vscode-icon-symbol-property-content: '\eb65'; --vscode-icon-symbol-property-font-family: 'codicon'; --vscode-icon-wrench-content: '\eb65'; --vscode-icon-wrench-font-family: 'codicon'; --vscode-icon-wrench-subaction-content: '\eb65'; --vscode-icon-wrench-subaction-font-family: 'codicon'; --vscode-icon-symbol-snippet-content: '\eb66'; --vscode-icon-symbol-snippet-font-family: 'codicon'; --vscode-icon-tasklist-content: '\eb67'; --vscode-icon-tasklist-font-family: 'codicon'; --vscode-icon-telescope-content: '\eb68'; --vscode-icon-telescope-font-family: 'codicon'; --vscode-icon-text-size-content: '\eb69'; --vscode-icon-text-size-font-family: 'codicon'; --vscode-icon-three-bars-content: '\eb6a'; --vscode-icon-three-bars-font-family: 'codicon'; --vscode-icon-thumbsdown-content: '\eb6b'; --vscode-icon-thumbsdown-font-family: 'codicon'; --vscode-icon-thumbsup-content: '\eb6c'; --vscode-icon-thumbsup-font-family: 'codicon'; --vscode-icon-tools-content: '\eb6d'; --vscode-icon-tools-font-family: 'codicon'; --vscode-icon-triangle-down-content: '\eb6e'; --vscode-icon-triangle-down-font-family: 'codicon'; --vscode-icon-triangle-left-content: '\eb6f'; --vscode-icon-triangle-left-font-family: 'codicon'; --vscode-icon-triangle-right-content: '\eb70'; --vscode-icon-triangle-right-font-family: 'codicon'; --vscode-icon-triangle-up-content: '\eb71'; --vscode-icon-triangle-up-font-family: 'codicon'; --vscode-icon-twitter-content: '\eb72'; --vscode-icon-twitter-font-family: 'codicon'; --vscode-icon-unfold-content: '\eb73'; --vscode-icon-unfold-font-family: 'codicon'; --vscode-icon-unlock-content: '\eb74'; --vscode-icon-unlock-font-family: 'codicon'; --vscode-icon-unmute-content: '\eb75'; --vscode-icon-unmute-font-family: 'codicon'; --vscode-icon-unverified-content: '\eb76'; --vscode-icon-unverified-font-family: 'codicon'; --vscode-icon-verified-content: '\eb77'; --vscode-icon-verified-font-family: 'codicon'; --vscode-icon-versions-content: '\eb78'; --vscode-icon-versions-font-family: 'codicon'; --vscode-icon-vm-active-content: '\eb79'; --vscode-icon-vm-active-font-family: 'codicon'; --vscode-icon-vm-outline-content: '\eb7a'; --vscode-icon-vm-outline-font-family: 'codicon'; --vscode-icon-vm-running-content: '\eb7b'; --vscode-icon-vm-running-font-family: 'codicon'; --vscode-icon-watch-content: '\eb7c'; --vscode-icon-watch-font-family: 'codicon'; --vscode-icon-whitespace-content: '\eb7d'; --vscode-icon-whitespace-font-family: 'codicon'; --vscode-icon-whole-word-content: '\eb7e'; --vscode-icon-whole-word-font-family: 'codicon'; --vscode-icon-window-content: '\eb7f'; --vscode-icon-window-font-family: 'codicon'; --vscode-icon-word-wrap-content: '\eb80'; --vscode-icon-word-wrap-font-family: 'codicon'; --vscode-icon-zoom-in-content: '\eb81'; --vscode-icon-zoom-in-font-family: 'codicon'; --vscode-icon-zoom-out-content: '\eb82'; --vscode-icon-zoom-out-font-family: 'codicon'; --vscode-icon-list-filter-content: '\eb83'; --vscode-icon-list-filter-font-family: 'codicon'; --vscode-icon-list-flat-content: '\eb84'; --vscode-icon-list-flat-font-family: 'codicon'; --vscode-icon-list-selection-content: '\eb85'; --vscode-icon-list-selection-font-family: 'codicon'; --vscode-icon-selection-content: '\eb85'; --vscode-icon-selection-font-family: 'codicon'; --vscode-icon-list-tree-content: '\eb86'; --vscode-icon-list-tree-font-family: 'codicon'; --vscode-icon-debug-breakpoint-function-unverified-content: '\eb87'; --vscode-icon-debug-breakpoint-function-unverified-font-family: 'codicon'; --vscode-icon-debug-breakpoint-function-content: '\eb88'; --vscode-icon-debug-breakpoint-function-font-family: 'codicon'; --vscode-icon-debug-breakpoint-function-disabled-content: '\eb88'; --vscode-icon-debug-breakpoint-function-disabled-font-family: 'codicon'; --vscode-icon-debug-stackframe-active-content: '\eb89'; --vscode-icon-debug-stackframe-active-font-family: 'codicon'; --vscode-icon-circle-small-filled-content: '\eb8a'; --vscode-icon-circle-small-filled-font-family: 'codicon'; --vscode-icon-debug-stackframe-dot-content: '\eb8a'; --vscode-icon-debug-stackframe-dot-font-family: 'codicon'; --vscode-icon-terminal-decoration-mark-content: '\eb8a'; --vscode-icon-terminal-decoration-mark-font-family: 'codicon'; --vscode-icon-debug-stackframe-content: '\eb8b'; --vscode-icon-debug-stackframe-font-family: 'codicon'; --vscode-icon-debug-stackframe-focused-content: '\eb8b'; --vscode-icon-debug-stackframe-focused-font-family: 'codicon'; --vscode-icon-debug-breakpoint-unsupported-content: '\eb8c'; --vscode-icon-debug-breakpoint-unsupported-font-family: 'codicon'; --vscode-icon-symbol-string-content: '\eb8d'; --vscode-icon-symbol-string-font-family: 'codicon'; --vscode-icon-debug-reverse-continue-content: '\eb8e'; --vscode-icon-debug-reverse-continue-font-family: 'codicon'; --vscode-icon-debug-step-back-content: '\eb8f'; --vscode-icon-debug-step-back-font-family: 'codicon'; --vscode-icon-debug-restart-frame-content: '\eb90'; --vscode-icon-debug-restart-frame-font-family: 'codicon'; --vscode-icon-debug-alt-content: '\eb91'; --vscode-icon-debug-alt-font-family: 'codicon'; --vscode-icon-call-incoming-content: '\eb92'; --vscode-icon-call-incoming-font-family: 'codicon'; --vscode-icon-call-outgoing-content: '\eb93'; --vscode-icon-call-outgoing-font-family: 'codicon'; --vscode-icon-menu-content: '\eb94'; --vscode-icon-menu-font-family: 'codicon'; --vscode-icon-expand-all-content: '\eb95'; --vscode-icon-expand-all-font-family: 'codicon'; --vscode-icon-feedback-content: '\eb96'; --vscode-icon-feedback-font-family: 'codicon'; --vscode-icon-git-pull-request-reviewer-content: '\eb96'; --vscode-icon-git-pull-request-reviewer-font-family: 'codicon'; --vscode-icon-group-by-ref-type-content: '\eb97'; --vscode-icon-group-by-ref-type-font-family: 'codicon'; --vscode-icon-ungroup-by-ref-type-content: '\eb98'; --vscode-icon-ungroup-by-ref-type-font-family: 'codicon'; --vscode-icon-account-content: '\eb99'; --vscode-icon-account-font-family: 'codicon'; --vscode-icon-git-pull-request-assignee-content: '\eb99'; --vscode-icon-git-pull-request-assignee-font-family: 'codicon'; --vscode-icon-bell-dot-content: '\eb9a'; --vscode-icon-bell-dot-font-family: 'codicon'; --vscode-icon-debug-console-content: '\eb9b'; --vscode-icon-debug-console-font-family: 'codicon'; --vscode-icon-library-content: '\eb9c'; --vscode-icon-library-font-family: 'codicon'; --vscode-icon-output-content: '\eb9d'; --vscode-icon-output-font-family: 'codicon'; --vscode-icon-run-all-content: '\eb9e'; --vscode-icon-run-all-font-family: 'codicon'; --vscode-icon-sync-ignored-content: '\eb9f'; --vscode-icon-sync-ignored-font-family: 'codicon'; --vscode-icon-pinned-content: '\eba0'; --vscode-icon-pinned-font-family: 'codicon'; --vscode-icon-github-inverted-content: '\eba1'; --vscode-icon-github-inverted-font-family: 'codicon'; --vscode-icon-server-process-content: '\eba2'; --vscode-icon-server-process-font-family: 'codicon'; --vscode-icon-server-environment-content: '\eba3'; --vscode-icon-server-environment-font-family: 'codicon'; --vscode-icon-pass-content: '\eba4'; --vscode-icon-pass-font-family: 'codicon'; --vscode-icon-issue-closed-content: '\eba4'; --vscode-icon-issue-closed-font-family: 'codicon'; --vscode-icon-stop-circle-content: '\eba5'; --vscode-icon-stop-circle-font-family: 'codicon'; --vscode-icon-play-circle-content: '\eba6'; --vscode-icon-play-circle-font-family: 'codicon'; --vscode-icon-record-content: '\eba7'; --vscode-icon-record-font-family: 'codicon'; --vscode-icon-debug-alt-small-content: '\eba8'; --vscode-icon-debug-alt-small-font-family: 'codicon'; --vscode-icon-vm-connect-content: '\eba9'; --vscode-icon-vm-connect-font-family: 'codicon'; --vscode-icon-cloud-content: '\ebaa'; --vscode-icon-cloud-font-family: 'codicon'; --vscode-icon-merge-content: '\ebab'; --vscode-icon-merge-font-family: 'codicon'; --vscode-icon-export-content: '\ebac'; --vscode-icon-export-font-family: 'codicon'; --vscode-icon-graph-left-content: '\ebad'; --vscode-icon-graph-left-font-family: 'codicon'; --vscode-icon-magnet-content: '\ebae'; --vscode-icon-magnet-font-family: 'codicon'; --vscode-icon-notebook-content: '\ebaf'; --vscode-icon-notebook-font-family: 'codicon'; --vscode-icon-redo-content: '\ebb0'; --vscode-icon-redo-font-family: 'codicon'; --vscode-icon-check-all-content: '\ebb1'; --vscode-icon-check-all-font-family: 'codicon'; --vscode-icon-pinned-dirty-content: '\ebb2'; --vscode-icon-pinned-dirty-font-family: 'codicon'; --vscode-icon-pass-filled-content: '\ebb3'; --vscode-icon-pass-filled-font-family: 'codicon'; --vscode-icon-circle-large-filled-content: '\ebb4'; --vscode-icon-circle-large-filled-font-family: 'codicon'; --vscode-icon-circle-large-content: '\ebb5'; --vscode-icon-circle-large-font-family: 'codicon'; --vscode-icon-circle-large-outline-content: '\ebb5'; --vscode-icon-circle-large-outline-font-family: 'codicon'; --vscode-icon-combine-content: '\ebb6'; --vscode-icon-combine-font-family: 'codicon'; --vscode-icon-gather-content: '\ebb6'; --vscode-icon-gather-font-family: 'codicon'; --vscode-icon-table-content: '\ebb7'; --vscode-icon-table-font-family: 'codicon'; --vscode-icon-variable-group-content: '\ebb8'; --vscode-icon-variable-group-font-family: 'codicon'; --vscode-icon-type-hierarchy-content: '\ebb9'; --vscode-icon-type-hierarchy-font-family: 'codicon'; --vscode-icon-type-hierarchy-sub-content: '\ebba'; --vscode-icon-type-hierarchy-sub-font-family: 'codicon'; --vscode-icon-type-hierarchy-super-content: '\ebbb'; --vscode-icon-type-hierarchy-super-font-family: 'codicon'; --vscode-icon-git-pull-request-create-content: '\ebbc'; --vscode-icon-git-pull-request-create-font-family: 'codicon'; --vscode-icon-run-above-content: '\ebbd'; --vscode-icon-run-above-font-family: 'codicon'; --vscode-icon-run-below-content: '\ebbe'; --vscode-icon-run-below-font-family: 'codicon'; --vscode-icon-notebook-template-content: '\ebbf'; --vscode-icon-notebook-template-font-family: 'codicon'; --vscode-icon-debug-rerun-content: '\ebc0'; --vscode-icon-debug-rerun-font-family: 'codicon'; --vscode-icon-workspace-trusted-content: '\ebc1'; --vscode-icon-workspace-trusted-font-family: 'codicon'; --vscode-icon-workspace-untrusted-content: '\ebc2'; --vscode-icon-workspace-untrusted-font-family: 'codicon'; --vscode-icon-workspace-unknown-content: '\ebc3'; --vscode-icon-workspace-unknown-font-family: 'codicon'; --vscode-icon-terminal-cmd-content: '\ebc4'; --vscode-icon-terminal-cmd-font-family: 'codicon'; --vscode-icon-terminal-debian-content: '\ebc5'; --vscode-icon-terminal-debian-font-family: 'codicon'; --vscode-icon-terminal-linux-content: '\ebc6'; --vscode-icon-terminal-linux-font-family: 'codicon'; --vscode-icon-terminal-powershell-content: '\ebc7'; --vscode-icon-terminal-powershell-font-family: 'codicon'; --vscode-icon-terminal-tmux-content: '\ebc8'; --vscode-icon-terminal-tmux-font-family: 'codicon'; --vscode-icon-terminal-ubuntu-content: '\ebc9'; --vscode-icon-terminal-ubuntu-font-family: 'codicon'; --vscode-icon-terminal-bash-content: '\ebca'; --vscode-icon-terminal-bash-font-family: 'codicon'; --vscode-icon-arrow-swap-content: '\ebcb'; --vscode-icon-arrow-swap-font-family: 'codicon'; --vscode-icon-copy-content: '\ebcc'; --vscode-icon-copy-font-family: 'codicon'; --vscode-icon-person-add-content: '\ebcd'; --vscode-icon-person-add-font-family: 'codicon'; --vscode-icon-filter-filled-content: '\ebce'; --vscode-icon-filter-filled-font-family: 'codicon'; --vscode-icon-wand-content: '\ebcf'; --vscode-icon-wand-font-family: 'codicon'; --vscode-icon-debug-line-by-line-content: '\ebd0'; --vscode-icon-debug-line-by-line-font-family: 'codicon'; --vscode-icon-inspect-content: '\ebd1'; --vscode-icon-inspect-font-family: 'codicon'; --vscode-icon-layers-content: '\ebd2'; --vscode-icon-layers-font-family: 'codicon'; --vscode-icon-layers-dot-content: '\ebd3'; --vscode-icon-layers-dot-font-family: 'codicon'; --vscode-icon-layers-active-content: '\ebd4'; --vscode-icon-layers-active-font-family: 'codicon'; --vscode-icon-compass-content: '\ebd5'; --vscode-icon-compass-font-family: 'codicon'; --vscode-icon-compass-dot-content: '\ebd6'; --vscode-icon-compass-dot-font-family: 'codicon'; --vscode-icon-compass-active-content: '\ebd7'; --vscode-icon-compass-active-font-family: 'codicon'; --vscode-icon-azure-content: '\ebd8'; --vscode-icon-azure-font-family: 'codicon'; --vscode-icon-issue-draft-content: '\ebd9'; --vscode-icon-issue-draft-font-family: 'codicon'; --vscode-icon-git-pull-request-closed-content: '\ebda'; --vscode-icon-git-pull-request-closed-font-family: 'codicon'; --vscode-icon-git-pull-request-draft-content: '\ebdb'; --vscode-icon-git-pull-request-draft-font-family: 'codicon'; --vscode-icon-debug-all-content: '\ebdc'; --vscode-icon-debug-all-font-family: 'codicon'; --vscode-icon-debug-coverage-content: '\ebdd'; --vscode-icon-debug-coverage-font-family: 'codicon'; --vscode-icon-run-errors-content: '\ebde'; --vscode-icon-run-errors-font-family: 'codicon'; --vscode-icon-folder-library-content: '\ebdf'; --vscode-icon-folder-library-font-family: 'codicon'; --vscode-icon-debug-continue-small-content: '\ebe0'; --vscode-icon-debug-continue-small-font-family: 'codicon'; --vscode-icon-beaker-stop-content: '\ebe1'; --vscode-icon-beaker-stop-font-family: 'codicon'; --vscode-icon-graph-line-content: '\ebe2'; --vscode-icon-graph-line-font-family: 'codicon'; --vscode-icon-graph-scatter-content: '\ebe3'; --vscode-icon-graph-scatter-font-family: 'codicon'; --vscode-icon-pie-chart-content: '\ebe4'; --vscode-icon-pie-chart-font-family: 'codicon'; --vscode-icon-bracket-content: '\eb0f'; --vscode-icon-bracket-font-family: 'codicon'; --vscode-icon-bracket-dot-content: '\ebe5'; --vscode-icon-bracket-dot-font-family: 'codicon'; --vscode-icon-bracket-error-content: '\ebe6'; --vscode-icon-bracket-error-font-family: 'codicon'; --vscode-icon-lock-small-content: '\ebe7'; --vscode-icon-lock-small-font-family: 'codicon'; --vscode-icon-azure-devops-content: '\ebe8'; --vscode-icon-azure-devops-font-family: 'codicon'; --vscode-icon-verified-filled-content: '\ebe9'; --vscode-icon-verified-filled-font-family: 'codicon'; --vscode-icon-newline-content: '\ebea'; --vscode-icon-newline-font-family: 'codicon'; --vscode-icon-layout-content: '\ebeb'; --vscode-icon-layout-font-family: 'codicon'; --vscode-icon-layout-activitybar-left-content: '\ebec'; --vscode-icon-layout-activitybar-left-font-family: 'codicon'; --vscode-icon-layout-activitybar-right-content: '\ebed'; --vscode-icon-layout-activitybar-right-font-family: 'codicon'; --vscode-icon-layout-panel-left-content: '\ebee'; --vscode-icon-layout-panel-left-font-family: 'codicon'; --vscode-icon-layout-panel-center-content: '\ebef'; --vscode-icon-layout-panel-center-font-family: 'codicon'; --vscode-icon-layout-panel-justify-content: '\ebf0'; --vscode-icon-layout-panel-justify-font-family: 'codicon'; --vscode-icon-layout-panel-right-content: '\ebf1'; --vscode-icon-layout-panel-right-font-family: 'codicon'; --vscode-icon-layout-panel-content: '\ebf2'; --vscode-icon-layout-panel-font-family: 'codicon'; --vscode-icon-layout-sidebar-left-content: '\ebf3'; --vscode-icon-layout-sidebar-left-font-family: 'codicon'; --vscode-icon-layout-sidebar-right-content: '\ebf4'; --vscode-icon-layout-sidebar-right-font-family: 'codicon'; --vscode-icon-layout-statusbar-content: '\ebf5'; --vscode-icon-layout-statusbar-font-family: 'codicon'; --vscode-icon-layout-menubar-content: '\ebf6'; --vscode-icon-layout-menubar-font-family: 'codicon'; --vscode-icon-layout-centered-content: '\ebf7'; --vscode-icon-layout-centered-font-family: 'codicon'; --vscode-icon-target-content: '\ebf8'; --vscode-icon-target-font-family: 'codicon'; --vscode-icon-indent-content: '\ebf9'; --vscode-icon-indent-font-family: 'codicon'; --vscode-icon-record-small-content: '\ebfa'; --vscode-icon-record-small-font-family: 'codicon'; --vscode-icon-error-small-content: '\ebfb'; --vscode-icon-error-small-font-family: 'codicon'; --vscode-icon-terminal-decoration-error-content: '\ebfb'; --vscode-icon-terminal-decoration-error-font-family: 'codicon'; --vscode-icon-arrow-circle-down-content: '\ebfc'; --vscode-icon-arrow-circle-down-font-family: 'codicon'; --vscode-icon-arrow-circle-left-content: '\ebfd'; --vscode-icon-arrow-circle-left-font-family: 'codicon'; --vscode-icon-arrow-circle-right-content: '\ebfe'; --vscode-icon-arrow-circle-right-font-family: 'codicon'; --vscode-icon-arrow-circle-up-content: '\ebff'; --vscode-icon-arrow-circle-up-font-family: 'codicon'; --vscode-icon-layout-sidebar-right-off-content: '\ec00'; --vscode-icon-layout-sidebar-right-off-font-family: 'codicon'; --vscode-icon-layout-panel-off-content: '\ec01'; --vscode-icon-layout-panel-off-font-family: 'codicon'; --vscode-icon-layout-sidebar-left-off-content: '\ec02'; --vscode-icon-layout-sidebar-left-off-font-family: 'codicon'; --vscode-icon-blank-content: '\ec03'; --vscode-icon-blank-font-family: 'codicon'; --vscode-icon-heart-filled-content: '\ec04'; --vscode-icon-heart-filled-font-family: 'codicon'; --vscode-icon-map-content: '\ec05'; --vscode-icon-map-font-family: 'codicon'; --vscode-icon-map-horizontal-content: '\ec05'; --vscode-icon-map-horizontal-font-family: 'codicon'; --vscode-icon-fold-horizontal-content: '\ec05'; --vscode-icon-fold-horizontal-font-family: 'codicon'; --vscode-icon-map-filled-content: '\ec06'; --vscode-icon-map-filled-font-family: 'codicon'; --vscode-icon-map-horizontal-filled-content: '\ec06'; --vscode-icon-map-horizontal-filled-font-family: 'codicon'; --vscode-icon-fold-horizontal-filled-content: '\ec06'; --vscode-icon-fold-horizontal-filled-font-family: 'codicon'; --vscode-icon-circle-small-content: '\ec07'; --vscode-icon-circle-small-font-family: 'codicon'; --vscode-icon-bell-slash-content: '\ec08'; --vscode-icon-bell-slash-font-family: 'codicon'; --vscode-icon-bell-slash-dot-content: '\ec09'; --vscode-icon-bell-slash-dot-font-family: 'codicon'; --vscode-icon-comment-unresolved-content: '\ec0a'; --vscode-icon-comment-unresolved-font-family: 'codicon'; --vscode-icon-git-pull-request-go-to-changes-content: '\ec0b'; --vscode-icon-git-pull-request-go-to-changes-font-family: 'codicon'; --vscode-icon-git-pull-request-new-changes-content: '\ec0c'; --vscode-icon-git-pull-request-new-changes-font-family: 'codicon'; --vscode-icon-search-fuzzy-content: '\ec0d'; --vscode-icon-search-fuzzy-font-family: 'codicon'; --vscode-icon-comment-draft-content: '\ec0e'; --vscode-icon-comment-draft-font-family: 'codicon'; --vscode-icon-send-content: '\ec0f'; --vscode-icon-send-font-family: 'codicon'; --vscode-icon-sparkle-content: '\ec10'; --vscode-icon-sparkle-font-family: 'codicon'; --vscode-icon-insert-content: '\ec11'; --vscode-icon-insert-font-family: 'codicon'; --vscode-icon-mic-content: '\ec12'; --vscode-icon-mic-font-family: 'codicon'; --vscode-icon-thumbsdown-filled-content: '\ec13'; --vscode-icon-thumbsdown-filled-font-family: 'codicon'; --vscode-icon-thumbsup-filled-content: '\ec14'; --vscode-icon-thumbsup-filled-font-family: 'codicon'; --vscode-icon-coffee-content: '\ec15'; --vscode-icon-coffee-font-family: 'codicon'; --vscode-icon-snake-content: '\ec16'; --vscode-icon-snake-font-family: 'codicon'; --vscode-icon-game-content: '\ec17'; --vscode-icon-game-font-family: 'codicon'; --vscode-icon-vr-content: '\ec18'; --vscode-icon-vr-font-family: 'codicon'; --vscode-icon-chip-content: '\ec19'; --vscode-icon-chip-font-family: 'codicon'; --vscode-icon-piano-content: '\ec1a'; --vscode-icon-piano-font-family: 'codicon'; --vscode-icon-music-content: '\ec1b'; --vscode-icon-music-font-family: 'codicon'; --vscode-icon-mic-filled-content: '\ec1c'; --vscode-icon-mic-filled-font-family: 'codicon'; --vscode-icon-repo-fetch-content: '\ec1d'; --vscode-icon-repo-fetch-font-family: 'codicon'; --vscode-icon-copilot-content: '\ec1e'; --vscode-icon-copilot-font-family: 'codicon'; --vscode-icon-lightbulb-sparkle-content: '\ec1f'; --vscode-icon-lightbulb-sparkle-font-family: 'codicon'; --vscode-icon-robot-content: '\ec20'; --vscode-icon-robot-font-family: 'codicon'; --vscode-icon-sparkle-filled-content: '\ec21'; --vscode-icon-sparkle-filled-font-family: 'codicon'; --vscode-icon-diff-single-content: '\ec22'; --vscode-icon-diff-single-font-family: 'codicon'; --vscode-icon-diff-multiple-content: '\ec23'; --vscode-icon-diff-multiple-font-family: 'codicon'; --vscode-icon-surround-with-content: '\ec24'; --vscode-icon-surround-with-font-family: 'codicon'; --vscode-icon-share-content: '\ec25'; --vscode-icon-share-font-family: 'codicon'; --vscode-icon-git-stash-content: '\ec26'; --vscode-icon-git-stash-font-family: 'codicon'; --vscode-icon-git-stash-apply-content: '\ec27'; --vscode-icon-git-stash-apply-font-family: 'codicon'; --vscode-icon-git-stash-pop-content: '\ec28'; --vscode-icon-git-stash-pop-font-family: 'codicon'; --vscode-icon-vscode-content: '\ec29'; --vscode-icon-vscode-font-family: 'codicon'; --vscode-icon-vscode-insiders-content: '\ec2a'; --vscode-icon-vscode-insiders-font-family: 'codicon'; --vscode-icon-code-oss-content: '\ec2b'; --vscode-icon-code-oss-font-family: 'codicon'; --vscode-icon-run-coverage-content: '\ec2c'; --vscode-icon-run-coverage-font-family: 'codicon'; --vscode-icon-run-all-coverage-content: '\ec2d'; --vscode-icon-run-all-coverage-font-family: 'codicon'; --vscode-icon-coverage-content: '\ec2e'; --vscode-icon-coverage-font-family: 'codicon'; --vscode-icon-github-project-content: '\ec2f'; --vscode-icon-github-project-font-family: 'codicon'; --vscode-icon-map-vertical-content: '\ec30'; --vscode-icon-map-vertical-font-family: 'codicon'; --vscode-icon-fold-vertical-content: '\ec30'; --vscode-icon-fold-vertical-font-family: 'codicon'; --vscode-icon-map-vertical-filled-content: '\ec31'; --vscode-icon-map-vertical-filled-font-family: 'codicon'; --vscode-icon-fold-vertical-filled-content: '\ec31'; --vscode-icon-fold-vertical-filled-font-family: 'codicon'; --vscode-icon-go-to-search-content: '\ec32'; --vscode-icon-go-to-search-font-family: 'codicon'; --vscode-icon-percentage-content: '\ec33'; --vscode-icon-percentage-font-family: 'codicon'; --vscode-icon-sort-percentage-content: '\ec33'; --vscode-icon-sort-percentage-font-family: 'codicon'; --vscode-icon-attach-content: '\ec34'; --vscode-icon-attach-font-family: 'codicon'; --vscode-icon-go-to-editing-session-content: '\ec35'; --vscode-icon-go-to-editing-session-font-family: 'codicon'; --vscode-icon-edit-session-content: '\ec36'; --vscode-icon-edit-session-font-family: 'codicon'; --vscode-icon-code-review-content: '\ec37'; --vscode-icon-code-review-font-family: 'codicon'; --vscode-icon-copilot-warning-content: '\ec38'; --vscode-icon-copilot-warning-font-family: 'codicon'; --vscode-icon-python-content: '\ec39'; --vscode-icon-python-font-family: 'codicon'; --vscode-icon-copilot-large-content: '\ec3a'; --vscode-icon-copilot-large-font-family: 'codicon'; --vscode-icon-copilot-warning-large-content: '\ec3b'; --vscode-icon-copilot-warning-large-font-family: 'codicon'; --vscode-icon-keyboard-tab-content: '\ec3c'; --vscode-icon-keyboard-tab-font-family: 'codicon'; --vscode-icon-copilot-blocked-content: '\ec3d'; --vscode-icon-copilot-blocked-font-family: 'codicon'; --vscode-icon-copilot-not-connected-content: '\ec3e'; --vscode-icon-copilot-not-connected-font-family: 'codicon'; --vscode-icon-flag-content: '\ec3f'; --vscode-icon-flag-font-family: 'codicon'; --vscode-icon-lightbulb-empty-content: '\ec40'; --vscode-icon-lightbulb-empty-font-family: 'codicon'; --vscode-icon-symbol-method-arrow-content: '\ec41'; --vscode-icon-symbol-method-arrow-font-family: 'codicon'; --vscode-icon-copilot-unavailable-content: '\ec42'; --vscode-icon-copilot-unavailable-font-family: 'codicon'; --vscode-icon-repo-pinned-content: '\ec43'; --vscode-icon-repo-pinned-font-family: 'codicon'; --vscode-icon-keyboard-tab-above-content: '\ec44'; --vscode-icon-keyboard-tab-above-font-family: 'codicon'; --vscode-icon-keyboard-tab-below-content: '\ec45'; --vscode-icon-keyboard-tab-below-font-family: 'codicon'; --vscode-icon-git-pull-request-done-content: '\ec46'; --vscode-icon-git-pull-request-done-font-family: 'codicon'; --vscode-icon-mcp-content: '\ec47'; --vscode-icon-mcp-font-family: 'codicon'; --vscode-icon-extensions-large-content: '\ec48'; --vscode-icon-extensions-large-font-family: 'codicon'; --vscode-icon-layout-panel-dock-content: '\ec49'; --vscode-icon-layout-panel-dock-font-family: 'codicon'; --vscode-icon-layout-sidebar-left-dock-content: '\ec4a'; --vscode-icon-layout-sidebar-left-dock-font-family: 'codicon'; --vscode-icon-layout-sidebar-right-dock-content: '\ec4b'; --vscode-icon-layout-sidebar-right-dock-font-family: 'codicon'; --vscode-icon-copilot-in-progress-content: '\ec4c'; --vscode-icon-copilot-in-progress-font-family: 'codicon'; --vscode-icon-copilot-error-content: '\ec4d'; --vscode-icon-copilot-error-font-family: 'codicon'; --vscode-icon-copilot-success-content: '\ec4e'; --vscode-icon-copilot-success-font-family: 'codicon'; --vscode-icon-chat-sparkle-content: '\ec4f'; --vscode-icon-chat-sparkle-font-family: 'codicon'; --vscode-icon-search-sparkle-content: '\ec50'; --vscode-icon-search-sparkle-font-family: 'codicon'; --vscode-icon-edit-sparkle-content: '\ec51'; --vscode-icon-edit-sparkle-font-family: 'codicon'; --vscode-icon-copilot-snooze-content: '\ec52'; --vscode-icon-copilot-snooze-font-family: 'codicon'; --vscode-icon-send-to-remote-agent-content: '\ec53'; --vscode-icon-send-to-remote-agent-font-family: 'codicon'; --vscode-icon-comment-discussion-sparkle-content: '\ec54'; --vscode-icon-comment-discussion-sparkle-font-family: 'codicon'; --vscode-icon-chat-sparkle-warning-content: '\ec55'; --vscode-icon-chat-sparkle-warning-font-family: 'codicon'; --vscode-icon-chat-sparkle-error-content: '\ec56'; --vscode-icon-chat-sparkle-error-font-family: 'codicon'; --vscode-icon-collection-content: '\ec57'; --vscode-icon-collection-font-family: 'codicon'; --vscode-icon-new-collection-content: '\ec58'; --vscode-icon-new-collection-font-family: 'codicon'; --vscode-icon-thinking-content: '\ec59'; --vscode-icon-thinking-font-family: 'codicon'; --vscode-icon-build-content: '\ec5a'; --vscode-icon-build-font-family: 'codicon'; --vscode-icon-comment-discussion-quote-content: '\ec5b'; --vscode-icon-comment-discussion-quote-font-family: 'codicon'; --vscode-icon-cursor-content: '\ec5c'; --vscode-icon-cursor-font-family: 'codicon'; --vscode-icon-eraser-content: '\ec5d'; --vscode-icon-eraser-font-family: 'codicon'; --vscode-icon-file-text-content: '\ec5e'; --vscode-icon-file-text-font-family: 'codicon'; --vscode-icon-git-lens-content: '\ec5f'; --vscode-icon-git-lens-font-family: 'codicon'; --vscode-icon-quotes-content: '\ec60'; --vscode-icon-quotes-font-family: 'codicon'; --vscode-icon-rename-content: '\ec61'; --vscode-icon-rename-font-family: 'codicon'; --vscode-icon-run-with-deps-content: '\ec62'; --vscode-icon-run-with-deps-font-family: 'codicon'; --vscode-icon-debug-connected-content: '\ec63'; --vscode-icon-debug-connected-font-family: 'codicon'; --vscode-icon-strikethrough-content: '\ec64'; --vscode-icon-strikethrough-font-family: 'codicon'; --vscode-icon-open-in-product-content: '\ec65'; --vscode-icon-open-in-product-font-family: 'codicon'; --vscode-icon-index-zero-content: '\ec66'; --vscode-icon-index-zero-font-family: 'codicon'; --vscode-icon-agent-content: '\ec67'; --vscode-icon-agent-font-family: 'codicon'; --vscode-icon-edit-code-content: '\ec68'; --vscode-icon-edit-code-font-family: 'codicon'; --vscode-icon-repo-selected-content: '\ec69'; --vscode-icon-repo-selected-font-family: 'codicon'; --vscode-icon-skip-content: '\ec6a'; --vscode-icon-skip-font-family: 'codicon'; --vscode-icon-merge-into-content: '\ec6b'; --vscode-icon-merge-into-font-family: 'codicon'; --vscode-icon-git-branch-changes-content: '\ec6c'; --vscode-icon-git-branch-changes-font-family: 'codicon'; --vscode-icon-git-branch-staged-changes-content: '\ec6d'; --vscode-icon-git-branch-staged-changes-font-family: 'codicon'; --vscode-icon-git-branch-conflicts-content: '\ec6e'; --vscode-icon-git-branch-conflicts-font-family: 'codicon'; --vscode-icon-git-branch-content: '\ec6f'; --vscode-icon-git-branch-font-family: 'codicon'; --vscode-icon-git-branch-create-content: '\ec6f'; --vscode-icon-git-branch-create-font-family: 'codicon'; --vscode-icon-git-branch-delete-content: '\ec6f'; --vscode-icon-git-branch-delete-font-family: 'codicon'; --vscode-icon-search-large-content: '\ec70'; --vscode-icon-search-large-font-family: 'codicon'; --vscode-icon-terminal-git-bash-content: '\ec71'; --vscode-icon-terminal-git-bash-font-family: 'codicon'; --vscode-icon-dialog-error-content: '\ea87'; --vscode-icon-dialog-error-font-family: 'codicon'; --vscode-icon-dialog-warning-content: '\ea6c'; --vscode-icon-dialog-warning-font-family: 'codicon'; --vscode-icon-dialog-info-content: '\ea74'; --vscode-icon-dialog-info-font-family: 'codicon'; --vscode-icon-dialog-close-content: '\ea76'; --vscode-icon-dialog-close-font-family: 'codicon'; --vscode-icon-tree-item-expanded-content: '\eab4'; --vscode-icon-tree-item-expanded-font-family: 'codicon'; --vscode-icon-tree-filter-on-type-on-content: '\eb83'; --vscode-icon-tree-filter-on-type-on-font-family: 'codicon'; --vscode-icon-tree-filter-on-type-off-content: '\eb85'; --vscode-icon-tree-filter-on-type-off-font-family: 'codicon'; --vscode-icon-tree-filter-clear-content: '\ea76'; --vscode-icon-tree-filter-clear-font-family: 'codicon'; --vscode-icon-tree-item-loading-content: '\eb19'; --vscode-icon-tree-item-loading-font-family: 'codicon'; --vscode-icon-menu-selection-content: '\eab2'; --vscode-icon-menu-selection-font-family: 'codicon'; --vscode-icon-menu-submenu-content: '\eab6'; --vscode-icon-menu-submenu-font-family: 'codicon'; --vscode-icon-menubar-more-content: '\ea7c'; --vscode-icon-menubar-more-font-family: 'codicon'; --vscode-icon-scrollbar-button-left-content: '\eb6f'; --vscode-icon-scrollbar-button-left-font-family: 'codicon'; --vscode-icon-scrollbar-button-right-content: '\eb70'; --vscode-icon-scrollbar-button-right-font-family: 'codicon'; --vscode-icon-scrollbar-button-up-content: '\eb71'; --vscode-icon-scrollbar-button-up-font-family: 'codicon'; --vscode-icon-scrollbar-button-down-content: '\eb6e'; --vscode-icon-scrollbar-button-down-font-family: 'codicon'; --vscode-icon-toolbar-more-content: '\ea7c'; --vscode-icon-toolbar-more-font-family: 'codicon'; --vscode-icon-quick-input-back-content: '\ea9b'; --vscode-icon-quick-input-back-font-family: 'codicon'; --vscode-icon-drop-down-button-content: '\eab4'; --vscode-icon-drop-down-button-font-family: 'codicon'; --vscode-icon-symbol-customcolor-content: '\eb5c'; --vscode-icon-symbol-customcolor-font-family: 'codicon'; --vscode-icon-workspace-unspecified-content: '\ebc3'; --vscode-icon-workspace-unspecified-font-family: 'codicon'; --vscode-icon-git-fetch-content: '\ec1d'; --vscode-icon-git-fetch-font-family: 'codicon'; --vscode-icon-lightbulb-sparkle-autofix-content: '\ec1f'; --vscode-icon-lightbulb-sparkle-autofix-font-family: 'codicon'; --vscode-icon-debug-breakpoint-pending-content: '\ebd9'; --vscode-icon-debug-breakpoint-pending-font-family: 'codicon'; --vscode-icon-widget-close-content: '\ea76'; --vscode-icon-widget-close-font-family: 'codicon'; --vscode-icon-goto-previous-location-content: '\eaa1'; --vscode-icon-goto-previous-location-font-family: 'codicon'; --vscode-icon-goto-next-location-content: '\ea9a'; --vscode-icon-goto-next-location-font-family: 'codicon'; --vscode-icon-diff-review-insert-content: '\ea60'; --vscode-icon-diff-review-insert-font-family: 'codicon'; --vscode-icon-diff-review-remove-content: '\eb3b'; --vscode-icon-diff-review-remove-font-family: 'codicon'; --vscode-icon-diff-review-close-content: '\ea76'; --vscode-icon-diff-review-close-font-family: 'codicon'; --vscode-icon-diff-insert-content: '\ea60'; --vscode-icon-diff-insert-font-family: 'codicon'; --vscode-icon-diff-remove-content: '\eb3b'; --vscode-icon-diff-remove-font-family: 'codicon'; --vscode-icon-gutter-lightbulb-content: '\ea61'; --vscode-icon-gutter-lightbulb-font-family: 'codicon'; --vscode-icon-gutter-lightbulb-auto-fix-content: '\eb13'; --vscode-icon-gutter-lightbulb-auto-fix-font-family: 'codicon'; --vscode-icon-gutter-lightbulb-sparkle-content: '\ec1f'; --vscode-icon-gutter-lightbulb-sparkle-font-family: 'codicon'; --vscode-icon-gutter-lightbulb-aifix-auto-fix-content: '\ec1f'; --vscode-icon-gutter-lightbulb-aifix-auto-fix-font-family: 'codicon'; --vscode-icon-gutter-lightbulb-sparkle-filled-content: '\ec21'; --vscode-icon-gutter-lightbulb-sparkle-filled-font-family: 'codicon'; --vscode-icon-inline-suggestion-hints-next-content: '\eab6'; --vscode-icon-inline-suggestion-hints-next-font-family: 'codicon'; --vscode-icon-inline-suggestion-hints-previous-content: '\eab5'; --vscode-icon-inline-suggestion-hints-previous-font-family: 'codicon'; --vscode-icon-find-collapsed-content: '\eab6'; --vscode-icon-find-collapsed-font-family: 'codicon'; --vscode-icon-find-expanded-content: '\eab4'; --vscode-icon-find-expanded-font-family: 'codicon'; --vscode-icon-find-selection-content: '\eb85'; --vscode-icon-find-selection-font-family: 'codicon'; --vscode-icon-find-replace-content: '\eb3d'; --vscode-icon-find-replace-font-family: 'codicon'; --vscode-icon-find-replace-all-content: '\eb3c'; --vscode-icon-find-replace-all-font-family: 'codicon'; --vscode-icon-find-previous-match-content: '\eaa1'; --vscode-icon-find-previous-match-font-family: 'codicon'; --vscode-icon-find-next-match-content: '\ea9a'; --vscode-icon-find-next-match-font-family: 'codicon'; --vscode-icon-hover-increase-verbosity-content: '\ea60'; --vscode-icon-hover-increase-verbosity-font-family: 'codicon'; --vscode-icon-hover-decrease-verbosity-content: '\eb3b'; --vscode-icon-hover-decrease-verbosity-font-family: 'codicon'; --vscode-icon-marker-navigation-next-content: '\ea9a'; --vscode-icon-marker-navigation-next-font-family: 'codicon'; --vscode-icon-marker-navigation-previous-content: '\eaa1'; --vscode-icon-marker-navigation-previous-font-family: 'codicon'; --vscode-icon-folding-expanded-content: '\eab4'; --vscode-icon-folding-expanded-font-family: 'codicon'; --vscode-icon-folding-collapsed-content: '\eab6'; --vscode-icon-folding-collapsed-font-family: 'codicon'; --vscode-icon-folding-manual-collapsed-content: '\eab6'; --vscode-icon-folding-manual-collapsed-font-family: 'codicon'; --vscode-icon-folding-manual-expanded-content: '\eab4'; --vscode-icon-folding-manual-expanded-font-family: 'codicon'; --vscode-icon-suggest-more-info-content: '\eab6'; --vscode-icon-suggest-more-info-font-family: 'codicon'; --vscode-icon-parameter-hints-next-content: '\eab4'; --vscode-icon-parameter-hints-next-font-family: 'codicon'; --vscode-icon-parameter-hints-previous-content: '\eab7'; --vscode-icon-parameter-hints-previous-font-family: 'codicon'; --vscode-icon-extensions-warning-message-content: '\ea6c'; --vscode-icon-extensions-warning-message-font-family: 'codicon'; }
.monaco-editor .inputarea.ime-input { background-color: #fffffe; }
.monaco-editor .view-overlays .current-line-exact { border: 2px solid #eeeeee; }
.monaco-editor .margin-view-overlays .current-line-exact-margin { border: 2px solid #eeeeee; }
.monaco-editor .bracket-indent-guide.lvl-0 { --guide-color: rgba(4, 49, 250, 0.3); --guide-color-active: #0431fa; }
.monaco-editor .bracket-indent-guide.lvl-1 { --guide-color: rgba(49, 147, 49, 0.3); --guide-color-active: #319331; }
.monaco-editor .bracket-indent-guide.lvl-2 { --guide-color: rgba(123, 56, 20, 0.3); --guide-color-active: #7b3814; }
.monaco-editor .bracket-indent-guide.lvl-3 { --guide-color: rgba(4, 49, 250, 0.3); --guide-color-active: #0431fa; }
.monaco-editor .bracket-indent-guide.lvl-4 { --guide-color: rgba(49, 147, 49, 0.3); --guide-color-active: #319331; }
.monaco-editor .bracket-indent-guide.lvl-5 { --guide-color: rgba(123, 56, 20, 0.3); --guide-color-active: #7b3814; }
.monaco-editor .bracket-indent-guide.lvl-6 { --guide-color: rgba(4, 49, 250, 0.3); --guide-color-active: #0431fa; }
.monaco-editor .bracket-indent-guide.lvl-7 { --guide-color: rgba(49, 147, 49, 0.3); --guide-color-active: #319331; }
.monaco-editor .bracket-indent-guide.lvl-8 { --guide-color: rgba(123, 56, 20, 0.3); --guide-color-active: #7b3814; }
.monaco-editor .bracket-indent-guide.lvl-9 { --guide-color: rgba(4, 49, 250, 0.3); --guide-color-active: #0431fa; }
.monaco-editor .bracket-indent-guide.lvl-10 { --guide-color: rgba(49, 147, 49, 0.3); --guide-color-active: #319331; }
.monaco-editor .bracket-indent-guide.lvl-11 { --guide-color: rgba(123, 56, 20, 0.3); --guide-color-active: #7b3814; }
.monaco-editor .bracket-indent-guide.lvl-12 { --guide-color: rgba(4, 49, 250, 0.3); --guide-color-active: #0431fa; }
.monaco-editor .bracket-indent-guide.lvl-13 { --guide-color: rgba(49, 147, 49, 0.3); --guide-color-active: #319331; }
.monaco-editor .bracket-indent-guide.lvl-14 { --guide-color: rgba(123, 56, 20, 0.3); --guide-color-active: #7b3814; }
.monaco-editor .bracket-indent-guide.lvl-15 { --guide-color: rgba(4, 49, 250, 0.3); --guide-color-active: #0431fa; }
.monaco-editor .bracket-indent-guide.lvl-16 { --guide-color: rgba(49, 147, 49, 0.3); --guide-color-active: #319331; }
.monaco-editor .bracket-indent-guide.lvl-17 { --guide-color: rgba(123, 56, 20, 0.3); --guide-color-active: #7b3814; }
.monaco-editor .bracket-indent-guide.lvl-18 { --guide-color: rgba(4, 49, 250, 0.3); --guide-color-active: #0431fa; }
.monaco-editor .bracket-indent-guide.lvl-19 { --guide-color: rgba(49, 147, 49, 0.3); --guide-color-active: #319331; }
.monaco-editor .bracket-indent-guide.lvl-20 { --guide-color: rgba(123, 56, 20, 0.3); --guide-color-active: #7b3814; }
.monaco-editor .bracket-indent-guide.lvl-21 { --guide-color: rgba(4, 49, 250, 0.3); --guide-color-active: #0431fa; }
.monaco-editor .bracket-indent-guide.lvl-22 { --guide-color: rgba(49, 147, 49, 0.3); --guide-color-active: #319331; }
.monaco-editor .bracket-indent-guide.lvl-23 { --guide-color: rgba(123, 56, 20, 0.3); --guide-color-active: #7b3814; }
.monaco-editor .bracket-indent-guide.lvl-24 { --guide-color: rgba(4, 49, 250, 0.3); --guide-color-active: #0431fa; }
.monaco-editor .bracket-indent-guide.lvl-25 { --guide-color: rgba(49, 147, 49, 0.3); --guide-color-active: #319331; }
.monaco-editor .bracket-indent-guide.lvl-26 { --guide-color: rgba(123, 56, 20, 0.3); --guide-color-active: #7b3814; }
.monaco-editor .bracket-indent-guide.lvl-27 { --guide-color: rgba(4, 49, 250, 0.3); --guide-color-active: #0431fa; }
.monaco-editor .bracket-indent-guide.lvl-28 { --guide-color: rgba(49, 147, 49, 0.3); --guide-color-active: #319331; }
.monaco-editor .bracket-indent-guide.lvl-29 { --guide-color: rgba(123, 56, 20, 0.3); --guide-color-active: #7b3814; }
.monaco-editor .vertical { box-shadow: 1px 0 0 0 var(--guide-color) inset; }
.monaco-editor .horizontal-top { border-top: 1px solid var(--guide-color); }
.monaco-editor .horizontal-bottom { border-bottom: 1px solid var(--guide-color); }
.monaco-editor .vertical.indent-active { box-shadow: 1px 0 0 0 var(--guide-color-active) inset; }
.monaco-editor .horizontal-top.indent-active { border-top: 1px solid var(--guide-color-active); }
.monaco-editor .horizontal-bottom.indent-active { border-bottom: 1px solid var(--guide-color-active); }
.monaco-editor .lines-content .core-guide-indent.lvl-0 { --indent-color: #d3d3d3; --indent-color-active: #939393; }
.monaco-editor .lines-content .core-guide-indent.lvl-1 { --indent-color: #d3d3d3; --indent-color-active: #939393; }
.monaco-editor .lines-content .core-guide-indent.lvl-2 { --indent-color: #d3d3d3; --indent-color-active: #939393; }
.monaco-editor .lines-content .core-guide-indent.lvl-3 { --indent-color: #d3d3d3; --indent-color-active: #939393; }
.monaco-editor .lines-content .core-guide-indent.lvl-4 { --indent-color: #d3d3d3; --indent-color-active: #939393; }
.monaco-editor .lines-content .core-guide-indent.lvl-5 { --indent-color: #d3d3d3; --indent-color-active: #939393; }
.monaco-editor .lines-content .core-guide-indent.lvl-6 { --indent-color: #d3d3d3; --indent-color-active: #939393; }
.monaco-editor .lines-content .core-guide-indent.lvl-7 { --indent-color: #d3d3d3; --indent-color-active: #939393; }
.monaco-editor .lines-content .core-guide-indent.lvl-8 { --indent-color: #d3d3d3; --indent-color-active: #939393; }
.monaco-editor .lines-content .core-guide-indent.lvl-9 { --indent-color: #d3d3d3; --indent-color-active: #939393; }
.monaco-editor .lines-content .core-guide-indent.lvl-10 { --indent-color: #d3d3d3; --indent-color-active: #939393; }
.monaco-editor .lines-content .core-guide-indent.lvl-11 { --indent-color: #d3d3d3; --indent-color-active: #939393; }
.monaco-editor .lines-content .core-guide-indent.lvl-12 { --indent-color: #d3d3d3; --indent-color-active: #939393; }
.monaco-editor .lines-content .core-guide-indent.lvl-13 { --indent-color: #d3d3d3; --indent-color-active: #939393; }
.monaco-editor .lines-content .core-guide-indent.lvl-14 { --indent-color: #d3d3d3; --indent-color-active: #939393; }
.monaco-editor .lines-content .core-guide-indent.lvl-15 { --indent-color: #d3d3d3; --indent-color-active: #939393; }
.monaco-editor .lines-content .core-guide-indent.lvl-16 { --indent-color: #d3d3d3; --indent-color-active: #939393; }
.monaco-editor .lines-content .core-guide-indent.lvl-17 { --indent-color: #d3d3d3; --indent-color-active: #939393; }
.monaco-editor .lines-content .core-guide-indent.lvl-18 { --indent-color: #d3d3d3; --indent-color-active: #939393; }
.monaco-editor .lines-content .core-guide-indent.lvl-19 { --indent-color: #d3d3d3; --indent-color-active: #939393; }
.monaco-editor .lines-content .core-guide-indent.lvl-20 { --indent-color: #d3d3d3; --indent-color-active: #939393; }
.monaco-editor .lines-content .core-guide-indent.lvl-21 { --indent-color: #d3d3d3; --indent-color-active: #939393; }
.monaco-editor .lines-content .core-guide-indent.lvl-22 { --indent-color: #d3d3d3; --indent-color-active: #939393; }
.monaco-editor .lines-content .core-guide-indent.lvl-23 { --indent-color: #d3d3d3; --indent-color-active: #939393; }
.monaco-editor .lines-content .core-guide-indent.lvl-24 { --indent-color: #d3d3d3; --indent-color-active: #939393; }
.monaco-editor .lines-content .core-guide-indent.lvl-25 { --indent-color: #d3d3d3; --indent-color-active: #939393; }
.monaco-editor .lines-content .core-guide-indent.lvl-26 { --indent-color: #d3d3d3; --indent-color-active: #939393; }
.monaco-editor .lines-content .core-guide-indent.lvl-27 { --indent-color: #d3d3d3; --indent-color-active: #939393; }
.monaco-editor .lines-content .core-guide-indent.lvl-28 { --indent-color: #d3d3d3; --indent-color-active: #939393; }
.monaco-editor .lines-content .core-guide-indent.lvl-29 { --indent-color: #d3d3d3; --indent-color-active: #939393; }
.monaco-editor .lines-content .core-guide-indent { box-shadow: 1px 0 0 0 var(--indent-color) inset; }
.monaco-editor .lines-content .core-guide-indent.indent-active { box-shadow: 1px 0 0 0 var(--indent-color-active) inset; }
.monaco-editor .line-numbers.dimmed-line-number { color: rgba(35, 120, 147, 0.4); }
.monaco-editor .cursors-layer .cursor { background-color: #000000; border-color: #000000; color: #ffffff; }
.monaco-editor .cursors-layer .cursor-primary { background-color: #000000; border-color: #000000; color: #ffffff; }
.monaco-editor .cursors-layer .cursor-secondary { background-color: #000000; border-color: #000000; color: #ffffff; }
.monaco-editor .unexpected-closing-bracket { color: rgba(255, 18, 18, 0.8); }
.monaco-editor .bracket-highlighting-0 { color: #0431fa; }
.monaco-editor .bracket-highlighting-1 { color: #319331; }
.monaco-editor .bracket-highlighting-2 { color: #7b3814; }
.monaco-editor .bracket-highlighting-3 { color: #0431fa; }
.monaco-editor .bracket-highlighting-4 { color: #319331; }
.monaco-editor .bracket-highlighting-5 { color: #7b3814; }
.monaco-editor .bracket-highlighting-6 { color: #0431fa; }
.monaco-editor .bracket-highlighting-7 { color: #319331; }
.monaco-editor .bracket-highlighting-8 { color: #7b3814; }
.monaco-editor .bracket-highlighting-9 { color: #0431fa; }
.monaco-editor .bracket-highlighting-10 { color: #319331; }
.monaco-editor .bracket-highlighting-11 { color: #7b3814; }
.monaco-editor .bracket-highlighting-12 { color: #0431fa; }
.monaco-editor .bracket-highlighting-13 { color: #319331; }
.monaco-editor .bracket-highlighting-14 { color: #7b3814; }
.monaco-editor .bracket-highlighting-15 { color: #0431fa; }
.monaco-editor .bracket-highlighting-16 { color: #319331; }
.monaco-editor .bracket-highlighting-17 { color: #7b3814; }
.monaco-editor .bracket-highlighting-18 { color: #0431fa; }
.monaco-editor .bracket-highlighting-19 { color: #319331; }
.monaco-editor .bracket-highlighting-20 { color: #7b3814; }
.monaco-editor .bracket-highlighting-21 { color: #0431fa; }
.monaco-editor .bracket-highlighting-22 { color: #319331; }
.monaco-editor .bracket-highlighting-23 { color: #7b3814; }
.monaco-editor .bracket-highlighting-24 { color: #0431fa; }
.monaco-editor .bracket-highlighting-25 { color: #319331; }
.monaco-editor .bracket-highlighting-26 { color: #7b3814; }
.monaco-editor .bracket-highlighting-27 { color: #0431fa; }
.monaco-editor .bracket-highlighting-28 { color: #319331; }
.monaco-editor .bracket-highlighting-29 { color: #7b3814; }
.monaco-editor .squiggly-error { background: url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%206%203'%20enable-background%3D'new%200%200%206%203'%20height%3D'3'%20width%3D'6'%3E%3Cg%20fill%3D'%23e51400'%3E%3Cpolygon%20points%3D'5.5%2C0%202.5%2C3%201.1%2C3%204.1%2C0'%2F%3E%3Cpolygon%20points%3D'4%2C0%206%2C2%206%2C0.6%205.4%2C0'%2F%3E%3Cpolygon%20points%3D'0%2C2%201%2C3%202.4%2C3%200%2C0.6'%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E") repeat-x bottom left; }
:root { --monaco-editor-error-decoration: url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%206%203'%20enable-background%3D'new%200%200%206%203'%20height%3D'3'%20width%3D'6'%3E%3Cg%20fill%3D'%23e51400'%3E%3Cpolygon%20points%3D'5.5%2C0%202.5%2C3%201.1%2C3%204.1%2C0'%2F%3E%3Cpolygon%20points%3D'4%2C0%206%2C2%206%2C0.6%205.4%2C0'%2F%3E%3Cpolygon%20points%3D'0%2C2%201%2C3%202.4%2C3%200%2C0.6'%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E"); }
.monaco-editor .squiggly-warning { background: url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%206%203'%20enable-background%3D'new%200%200%206%203'%20height%3D'3'%20width%3D'6'%3E%3Cg%20fill%3D'%23bf8803'%3E%3Cpolygon%20points%3D'5.5%2C0%202.5%2C3%201.1%2C3%204.1%2C0'%2F%3E%3Cpolygon%20points%3D'4%2C0%206%2C2%206%2C0.6%205.4%2C0'%2F%3E%3Cpolygon%20points%3D'0%2C2%201%2C3%202.4%2C3%200%2C0.6'%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E") repeat-x bottom left; }
:root { --monaco-editor-warning-decoration: url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%206%203'%20enable-background%3D'new%200%200%206%203'%20height%3D'3'%20width%3D'6'%3E%3Cg%20fill%3D'%23bf8803'%3E%3Cpolygon%20points%3D'5.5%2C0%202.5%2C3%201.1%2C3%204.1%2C0'%2F%3E%3Cpolygon%20points%3D'4%2C0%206%2C2%206%2C0.6%205.4%2C0'%2F%3E%3Cpolygon%20points%3D'0%2C2%201%2C3%202.4%2C3%200%2C0.6'%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E"); }
.monaco-editor .squiggly-info { background: url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%206%203'%20enable-background%3D'new%200%200%206%203'%20height%3D'3'%20width%3D'6'%3E%3Cg%20fill%3D'%231a85ff'%3E%3Cpolygon%20points%3D'5.5%2C0%202.5%2C3%201.1%2C3%204.1%2C0'%2F%3E%3Cpolygon%20points%3D'4%2C0%206%2C2%206%2C0.6%205.4%2C0'%2F%3E%3Cpolygon%20points%3D'0%2C2%201%2C3%202.4%2C3%200%2C0.6'%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E") repeat-x bottom left; }
:root { --monaco-editor-info-decoration: url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%206%203'%20enable-background%3D'new%200%200%206%203'%20height%3D'3'%20width%3D'6'%3E%3Cg%20fill%3D'%231a85ff'%3E%3Cpolygon%20points%3D'5.5%2C0%202.5%2C3%201.1%2C3%204.1%2C0'%2F%3E%3Cpolygon%20points%3D'4%2C0%206%2C2%206%2C0.6%205.4%2C0'%2F%3E%3Cpolygon%20points%3D'0%2C2%201%2C3%202.4%2C3%200%2C0.6'%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E"); }
.monaco-editor .squiggly-hint { background: url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20height%3D%223%22%20width%3D%2212%22%3E%3Cg%20fill%3D%22%236c6c6c%22%3E%3Ccircle%20cx%3D%221%22%20cy%3D%221%22%20r%3D%221%22%2F%3E%3Ccircle%20cx%3D%225%22%20cy%3D%221%22%20r%3D%221%22%2F%3E%3Ccircle%20cx%3D%229%22%20cy%3D%221%22%20r%3D%221%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E") no-repeat bottom left; }
:root { --monaco-editor-hint-decoration: url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20height%3D%223%22%20width%3D%2212%22%3E%3Cg%20fill%3D%22%236c6c6c%22%3E%3Ccircle%20cx%3D%221%22%20cy%3D%221%22%20r%3D%221%22%2F%3E%3Ccircle%20cx%3D%225%22%20cy%3D%221%22%20r%3D%221%22%2F%3E%3Ccircle%20cx%3D%229%22%20cy%3D%221%22%20r%3D%221%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E"); }
.monaco-editor.showUnused .squiggly-inline-unnecessary { opacity: 0.467; }
:root { --monaco-editor-unnecessary-decoration-opacity: 0.467; }
.monaco-editor .quickfix-edit-highlight { background-color: rgba(234, 92, 0, 0.33); }
.monaco-editor .monaco-hover .hover-row:not(:first-child):not(:empty) { border-top: 1px solid rgba(200, 200, 200, 0.5); }
.monaco-editor .monaco-hover hr { border-top: 1px solid rgba(200, 200, 200, 0.5); }
.monaco-editor .monaco-hover hr { border-bottom: 0px solid rgba(200, 200, 200, 0.5); }
.monaco-editor .selectionHighlight { background-color: rgba(173, 214, 255, 0.15); }
.monaco-hover.workbench-hover .hover-row:not(:first-child):not(:empty) { border-top: 1px solid rgba(200, 200, 200, 0.5); }
.monaco-hover.workbench-hover hr { border-top: 1px solid rgba(200, 200, 200, 0.5); }
.monaco-editor, .monaco-diff-editor, .monaco-component { --vscode-foreground: #616161;
--vscode-disabledForeground: rgba(97, 97, 97, 0.5);
--vscode-errorForeground: #a1260d;
--vscode-descriptionForeground: #717171;
--vscode-icon-foreground: #424242;
--vscode-focusBorder: #0090f1;
--vscode-textLink-foreground: #006ab1;
--vscode-textLink-activeForeground: #006ab1;
--vscode-textSeparator-foreground: rgba(0, 0, 0, 0.18);
--vscode-textPreformat-foreground: #a31515;
--vscode-textPreformat-background: rgba(0, 0, 0, 0.1);
--vscode-textBlockQuote-background: #f2f2f2;
--vscode-textBlockQuote-border: rgba(0, 122, 204, 0.5);
--vscode-textCodeBlock-background: rgba(220, 220, 220, 0.4);
--vscode-sash-hoverBorder: #0090f1;
--vscode-badge-background: #c4c4c4;
--vscode-badge-foreground: #333333;
--vscode-activityWarningBadge-foreground: #ffffff;
--vscode-activityWarningBadge-background: #bf8803;
--vscode-activityErrorBadge-foreground: #ffffff;
--vscode-activityErrorBadge-background: #e51400;
--vscode-scrollbar-shadow: #dddddd;
--vscode-scrollbarSlider-background: rgba(100, 100, 100, 0.4);
--vscode-scrollbarSlider-hoverBackground: rgba(100, 100, 100, 0.7);
--vscode-scrollbarSlider-activeBackground: rgba(0, 0, 0, 0.6);
--vscode-progressBar-background: #0e70c0;
--vscode-chart-line: #236b8e;
--vscode-chart-axis: rgba(0, 0, 0, 0.6);
--vscode-chart-guide: rgba(0, 0, 0, 0.2);
--vscode-editor-background: #fffffe;
--vscode-editor-foreground: #000000;
--vscode-editorStickyScroll-background: #fffffe;
--vscode-editorStickyScrollGutter-background: #fffffe;
--vscode-editorStickyScrollHover-background: #f0f0f0;
--vscode-editorStickyScroll-shadow: #dddddd;
--vscode-editorWidget-background: #f3f3f3;
--vscode-editorWidget-foreground: #616161;
--vscode-editorWidget-border: #c8c8c8;
--vscode-editorError-foreground: #e51400;
--vscode-editorWarning-foreground: #bf8803;
--vscode-editorInfo-foreground: #1a85ff;
--vscode-editorHint-foreground: #6c6c6c;
--vscode-editorLink-activeForeground: #0000ff;
--vscode-editor-selectionBackground: #add6ff;
--vscode-editor-inactiveSelectionBackground: #e5ebf1;
--vscode-editor-selectionHighlightBackground: rgba(173, 214, 255, 0.3);
--vscode-editor-compositionBorder: #000000;
--vscode-editor-findMatchBackground: #a8ac94;
--vscode-editor-findMatchHighlightBackground: rgba(234, 92, 0, 0.33);
--vscode-editor-findRangeHighlightBackground: rgba(180, 180, 180, 0.3);
--vscode-editor-hoverHighlightBackground: rgba(173, 214, 255, 0.15);
--vscode-editorHoverWidget-background: #f3f3f3;
--vscode-editorHoverWidget-foreground: #616161;
--vscode-editorHoverWidget-border: #c8c8c8;
--vscode-editorHoverWidget-statusBarBackground: #e7e7e7;
--vscode-editorInlayHint-foreground: #969696;
--vscode-editorInlayHint-background: rgba(196, 196, 196, 0.1);
--vscode-editorInlayHint-typeForeground: #969696;
--vscode-editorInlayHint-typeBackground: rgba(196, 196, 196, 0.1);
--vscode-editorInlayHint-parameterForeground: #969696;
--vscode-editorInlayHint-parameterBackground: rgba(196, 196, 196, 0.1);
--vscode-editorLightBulb-foreground: #ddb100;
--vscode-editorLightBulbAutoFix-foreground: #007acc;
--vscode-editorLightBulbAi-foreground: #ddb100;
--vscode-editor-snippetTabstopHighlightBackground: rgba(10, 50, 100, 0.2);
--vscode-editor-snippetFinalTabstopHighlightBorder: rgba(10, 50, 100, 0.5);
--vscode-diffEditor-insertedTextBackground: rgba(156, 204, 44, 0.25);
--vscode-diffEditor-removedTextBackground: rgba(255, 0, 0, 0.2);
--vscode-diffEditor-insertedLineBackground: rgba(155, 185, 85, 0.2);
--vscode-diffEditor-removedLineBackground: rgba(255, 0, 0, 0.2);
--vscode-diffEditor-diagonalFill: rgba(34, 34, 34, 0.2);
--vscode-diffEditor-unchangedRegionForeground: #616161;
--vscode-diffEditor-unchangedCodeBackground: rgba(184, 184, 184, 0.16);
--vscode-widget-shadow: rgba(0, 0, 0, 0.16);
--vscode-toolbar-hoverBackground: rgba(184, 184, 184, 0.31);
--vscode-toolbar-activeBackground: rgba(166, 166, 166, 0.31);
--vscode-breadcrumb-foreground: rgba(97, 97, 97, 0.8);
--vscode-breadcrumb-background: #fffffe;
--vscode-breadcrumb-focusForeground: #4e4e4e;
--vscode-breadcrumb-activeSelectionForeground: #4e4e4e;
--vscode-breadcrumbPicker-background: #f3f3f3;
--vscode-merge-currentHeaderBackground: rgba(64, 200, 174, 0.5);
--vscode-merge-currentContentBackground: rgba(64, 200, 174, 0.2);
--vscode-merge-incomingHeaderBackground: rgba(64, 166, 255, 0.5);
--vscode-merge-incomingContentBackground: rgba(64, 166, 255, 0.2);
--vscode-merge-commonHeaderBackground: rgba(96, 96, 96, 0.4);
--vscode-merge-commonContentBackground: rgba(96, 96, 96, 0.16);
--vscode-editorOverviewRuler-currentContentForeground: rgba(64, 200, 174, 0.5);
--vscode-editorOverviewRuler-incomingContentForeground: rgba(64, 166, 255, 0.5);
--vscode-editorOverviewRuler-commonContentForeground: rgba(96, 96, 96, 0.4);
--vscode-editorOverviewRuler-findMatchForeground: rgba(209, 134, 22, 0.49);
--vscode-editorOverviewRuler-selectionHighlightForeground: rgba(160, 160, 160, 0.8);
--vscode-problemsErrorIcon-foreground: #e51400;
--vscode-problemsWarningIcon-foreground: #bf8803;
--vscode-problemsInfoIcon-foreground: #1a85ff;
--vscode-minimap-findMatchHighlight: #d18616;
--vscode-minimap-selectionOccurrenceHighlight: #c9c9c9;
--vscode-minimap-selectionHighlight: #add6ff;
--vscode-minimap-infoHighlight: #1a85ff;
--vscode-minimap-warningHighlight: #bf8803;
--vscode-minimap-errorHighlight: rgba(255, 18, 18, 0.7);
--vscode-minimap-foregroundOpacity: #000000;
--vscode-minimapSlider-background: rgba(100, 100, 100, 0.2);
--vscode-minimapSlider-hoverBackground: rgba(100, 100, 100, 0.35);
--vscode-minimapSlider-activeBackground: rgba(0, 0, 0, 0.3);
--vscode-charts-foreground: #616161;
--vscode-charts-lines: rgba(97, 97, 97, 0.5);
--vscode-charts-red: #e51400;
--vscode-charts-blue: #1a85ff;
--vscode-charts-yellow: #bf8803;
--vscode-charts-orange: #d18616;
--vscode-charts-green: #388a34;
--vscode-charts-purple: #652d90;
--vscode-input-background: #ffffff;
--vscode-input-foreground: #616161;
--vscode-inputOption-activeBorder: #007acc;
--vscode-inputOption-hoverBackground: rgba(184, 184, 184, 0.31);
--vscode-inputOption-activeBackground: rgba(0, 144, 241, 0.2);
--vscode-inputOption-activeForeground: #000000;
--vscode-input-placeholderForeground: rgba(97, 97, 97, 0.5);
--vscode-inputValidation-infoBackground: #d6ecf2;
--vscode-inputValidation-infoBorder: #007acc;
--vscode-inputValidation-warningBackground: #f6f5d2;
--vscode-inputValidation-warningBorder: #b89500;
--vscode-inputValidation-errorBackground: #f2dede;
--vscode-inputValidation-errorBorder: #be1100;
--vscode-dropdown-background: #ffffff;
--vscode-dropdown-foreground: #616161;
--vscode-dropdown-border: #cecece;
--vscode-button-foreground: #ffffff;
--vscode-button-separator: rgba(255, 255, 255, 0.4);
--vscode-button-background: #007acc;
--vscode-button-hoverBackground: #0062a3;
--vscode-button-secondaryForeground: #ffffff;
--vscode-button-secondaryBackground: #5f6a79;
--vscode-button-secondaryHoverBackground: #4c5561;
--vscode-radio-activeForeground: #000000;
--vscode-radio-activeBackground: rgba(0, 144, 241, 0.2);
--vscode-radio-activeBorder: #007acc;
--vscode-radio-inactiveBorder: rgba(0, 0, 0, 0.2);
--vscode-radio-inactiveHoverBackground: rgba(184, 184, 184, 0.31);
--vscode-checkbox-background: #ffffff;
--vscode-checkbox-selectBackground: #f3f3f3;
--vscode-checkbox-foreground: #616161;
--vscode-checkbox-border: #cecece;
--vscode-checkbox-selectBorder: #424242;
--vscode-checkbox-disabled-background: #cacaca;
--vscode-checkbox-disabled-foreground: #959595;
--vscode-keybindingLabel-background: rgba(221, 221, 221, 0.4);
--vscode-keybindingLabel-foreground: #555555;
--vscode-keybindingLabel-border: rgba(204, 204, 204, 0.4);
--vscode-keybindingLabel-bottomBorder: rgba(187, 187, 187, 0.4);
--vscode-list-focusOutline: #0090f1;
--vscode-list-activeSelectionBackground: #0060c0;
--vscode-list-activeSelectionForeground: #ffffff;
--vscode-list-inactiveSelectionBackground: #e4e6f1;
--vscode-list-hoverBackground: #f0f0f0;
--vscode-list-dropBackground: #d6ebff;
--vscode-list-dropBetweenBackground: #424242;
--vscode-list-highlightForeground: #0066bf;
--vscode-list-focusHighlightForeground: #bbe7ff;
--vscode-list-invalidItemForeground: #b89500;
--vscode-list-errorForeground: #b01011;
--vscode-list-warningForeground: #855f00;
--vscode-listFilterWidget-background: #f3f3f3;
--vscode-listFilterWidget-outline: rgba(0, 0, 0, 0);
--vscode-listFilterWidget-noMatchesOutline: #be1100;
--vscode-listFilterWidget-shadow: rgba(0, 0, 0, 0.16);
--vscode-list-filterMatchBackground: rgba(234, 92, 0, 0.33);
--vscode-list-deemphasizedForeground: #8e8e90;
--vscode-tree-indentGuidesStroke: #a9a9a9;
--vscode-tree-inactiveIndentGuidesStroke: rgba(169, 169, 169, 0.4);
--vscode-tree-tableColumnsBorder: rgba(97, 97, 97, 0.13);
--vscode-tree-tableOddRowsBackground: rgba(97, 97, 97, 0.04);
--vscode-editorActionList-background: #f3f3f3;
--vscode-editorActionList-foreground: #616161;
--vscode-editorActionList-focusForeground: #ffffff;
--vscode-editorActionList-focusBackground: #0060c0;
--vscode-menu-foreground: #616161;
--vscode-menu-background: #ffffff;
--vscode-menu-selectionForeground: #ffffff;
--vscode-menu-selectionBackground: #0060c0;
--vscode-menu-separatorBackground: #d4d4d4;
--vscode-quickInput-background: #f3f3f3;
--vscode-quickInput-foreground: #616161;
--vscode-quickInputTitle-background: rgba(0, 0, 0, 0.06);
--vscode-pickerGroup-foreground: #0066bf;
--vscode-pickerGroup-border: #cccedb;
--vscode-quickInputList-focusForeground: #ffffff;
--vscode-quickInputList-focusBackground: #0060c0;
--vscode-search-resultsInfoForeground: #616161;
--vscode-searchEditor-findMatchBackground: rgba(234, 92, 0, 0.22);
--vscode-editor-lineHighlightBorder: #eeeeee;
--vscode-editor-rangeHighlightBackground: rgba(253, 255, 0, 0.2);
--vscode-editor-symbolHighlightBackground: rgba(234, 92, 0, 0.33);
--vscode-editorCursor-foreground: #000000;
--vscode-editorMultiCursor-primary-foreground: #000000;
--vscode-editorMultiCursor-secondary-foreground: #000000;
--vscode-editorWhitespace-foreground: rgba(51, 51, 51, 0.2);
--vscode-editorLineNumber-foreground: #237893;
--vscode-editorIndentGuide-background: rgba(51, 51, 51, 0.2);
--vscode-editorIndentGuide-activeBackground: rgba(51, 51, 51, 0.2);
--vscode-editorIndentGuide-background1: #d3d3d3;
--vscode-editorIndentGuide-background2: rgba(0, 0, 0, 0);
--vscode-editorIndentGuide-background3: rgba(0, 0, 0, 0);
--vscode-editorIndentGuide-background4: rgba(0, 0, 0, 0);
--vscode-editorIndentGuide-background5: rgba(0, 0, 0, 0);
--vscode-editorIndentGuide-background6: rgba(0, 0, 0, 0);
--vscode-editorIndentGuide-activeBackground1: #939393;
--vscode-editorIndentGuide-activeBackground2: rgba(0, 0, 0, 0);
--vscode-editorIndentGuide-activeBackground3: rgba(0, 0, 0, 0);
--vscode-editorIndentGuide-activeBackground4: rgba(0, 0, 0, 0);
--vscode-editorIndentGuide-activeBackground5: rgba(0, 0, 0, 0);
--vscode-editorIndentGuide-activeBackground6: rgba(0, 0, 0, 0);
--vscode-editorActiveLineNumber-foreground: #0b216f;
--vscode-editorLineNumber-activeForeground: #0b216f;
--vscode-editorRuler-foreground: #d3d3d3;
--vscode-editorCodeLens-foreground: #919191;
--vscode-editorBracketMatch-background: rgba(0, 100, 0, 0.1);
--vscode-editorBracketMatch-border: #b9b9b9;
--vscode-editorOverviewRuler-border: rgba(127, 127, 127, 0.3);
--vscode-editorGutter-background: #fffffe;
--vscode-editorUnnecessaryCode-opacity: rgba(0, 0, 0, 0.47);
--vscode-editorGhostText-foreground: rgba(0, 0, 0, 0.47);
--vscode-editorOverviewRuler-rangeHighlightForeground: rgba(0, 122, 204, 0.6);
--vscode-editorOverviewRuler-errorForeground: rgba(255, 18, 18, 0.7);
--vscode-editorOverviewRuler-warningForeground: #bf8803;
--vscode-editorOverviewRuler-infoForeground: #1a85ff;
--vscode-editorBracketHighlight-foreground1: #0431fa;
--vscode-editorBracketHighlight-foreground2: #319331;
--vscode-editorBracketHighlight-foreground3: #7b3814;
--vscode-editorBracketHighlight-foreground4: rgba(0, 0, 0, 0);
--vscode-editorBracketHighlight-foreground5: rgba(0, 0, 0, 0);
--vscode-editorBracketHighlight-foreground6: rgba(0, 0, 0, 0);
--vscode-editorBracketHighlight-unexpectedBracket-foreground: rgba(255, 18, 18, 0.8);
--vscode-editorBracketPairGuide-background1: rgba(0, 0, 0, 0);
--vscode-editorBracketPairGuide-background2: rgba(0, 0, 0, 0);
--vscode-editorBracketPairGuide-background3: rgba(0, 0, 0, 0);
--vscode-editorBracketPairGuide-background4: rgba(0, 0, 0, 0);
--vscode-editorBracketPairGuide-background5: rgba(0, 0, 0, 0);
--vscode-editorBracketPairGuide-background6: rgba(0, 0, 0, 0);
--vscode-editorBracketPairGuide-activeBackground1: rgba(0, 0, 0, 0);
--vscode-editorBracketPairGuide-activeBackground2: rgba(0, 0, 0, 0);
--vscode-editorBracketPairGuide-activeBackground3: rgba(0, 0, 0, 0);
--vscode-editorBracketPairGuide-activeBackground4: rgba(0, 0, 0, 0);
--vscode-editorBracketPairGuide-activeBackground5: rgba(0, 0, 0, 0);
--vscode-editorBracketPairGuide-activeBackground6: rgba(0, 0, 0, 0);
--vscode-editorUnicodeHighlight-border: #bf8803;
--vscode-diffEditor-move-border: rgba(139, 139, 139, 0.61);
--vscode-diffEditor-moveActive-border: #ffa500;
--vscode-diffEditor-unchangedRegionShadow: rgba(115, 115, 115, 0.75);
--vscode-editorOverviewRuler-bracketMatchForeground: #a0a0a0;
--vscode-actionBar-toggledBackground: rgba(0, 144, 241, 0.2);
--vscode-symbolIcon-arrayForeground: #616161;
--vscode-symbolIcon-booleanForeground: #616161;
--vscode-symbolIcon-classForeground: #d67e00;
--vscode-symbolIcon-colorForeground: #616161;
--vscode-symbolIcon-constantForeground: #616161;
--vscode-symbolIcon-constructorForeground: #652d90;
--vscode-symbolIcon-enumeratorForeground: #d67e00;
--vscode-symbolIcon-enumeratorMemberForeground: #007acc;
--vscode-symbolIcon-eventForeground: #d67e00;
--vscode-symbolIcon-fieldForeground: #007acc;
--vscode-symbolIcon-fileForeground: #616161;
--vscode-symbolIcon-folderForeground: #616161;
--vscode-symbolIcon-functionForeground: #652d90;
--vscode-symbolIcon-interfaceForeground: #007acc;
--vscode-symbolIcon-keyForeground: #616161;
--vscode-symbolIcon-keywordForeground: #616161;
--vscode-symbolIcon-methodForeground: #652d90;
--vscode-symbolIcon-moduleForeground: #616161;
--vscode-symbolIcon-namespaceForeground: #616161;
--vscode-symbolIcon-nullForeground: #616161;
--vscode-symbolIcon-numberForeground: #616161;
--vscode-symbolIcon-objectForeground: #616161;
--vscode-symbolIcon-operatorForeground: #616161;
--vscode-symbolIcon-packageForeground: #616161;
--vscode-symbolIcon-propertyForeground: #616161;
--vscode-symbolIcon-referenceForeground: #616161;
--vscode-symbolIcon-snippetForeground: #616161;
--vscode-symbolIcon-stringForeground: #616161;
--vscode-symbolIcon-structForeground: #616161;
--vscode-symbolIcon-textForeground: #616161;
--vscode-symbolIcon-typeParameterForeground: #616161;
--vscode-symbolIcon-unitForeground: #616161;
--vscode-symbolIcon-variableForeground: #007acc;
--vscode-peekViewTitle-background: #f3f3f3;
--vscode-peekViewTitleLabel-foreground: #000000;
--vscode-peekViewTitleDescription-foreground: #616161;
--vscode-peekView-border: #1a85ff;
--vscode-peekViewResult-background: #f3f3f3;
--vscode-peekViewResult-lineForeground: #646465;
--vscode-peekViewResult-fileForeground: #1e1e1e;
--vscode-peekViewResult-selectionBackground: rgba(51, 153, 255, 0.2);
--vscode-peekViewResult-selectionForeground: #6c6c6c;
--vscode-peekViewEditor-background: #f2f8fc;
--vscode-peekViewEditorGutter-background: #f2f8fc;
--vscode-peekViewEditorStickyScroll-background: #f2f8fc;
--vscode-peekViewEditorStickyScrollGutter-background: #f2f8fc;
--vscode-peekViewResult-matchHighlightBackground: rgba(234, 92, 0, 0.3);
--vscode-peekViewEditor-matchHighlightBackground: rgba(245, 216, 2, 0.87);
--vscode-editorMarkerNavigationError-background: #e51400;
--vscode-editorMarkerNavigationError-headerBackground: rgba(229, 20, 0, 0.1);
--vscode-editorMarkerNavigationWarning-background: #bf8803;
--vscode-editorMarkerNavigationWarning-headerBackground: rgba(191, 136, 3, 0.1);
--vscode-editorMarkerNavigationInfo-background: #1a85ff;
--vscode-editorMarkerNavigationInfo-headerBackground: rgba(26, 133, 255, 0.1);
--vscode-editorMarkerNavigation-background: #fffffe;
--vscode-editor-foldBackground: rgba(173, 214, 255, 0.3);
--vscode-editor-foldPlaceholderForeground: #808080;
--vscode-editorGutter-foldingControlForeground: #424242;
--vscode-editorSuggestWidget-background: #f3f3f3;
--vscode-editorSuggestWidget-border: #c8c8c8;
--vscode-editorSuggestWidget-foreground: #000000;
--vscode-editorSuggestWidget-selectedForeground: #ffffff;
--vscode-editorSuggestWidget-selectedBackground: #0060c0;
--vscode-editorSuggestWidget-highlightForeground: #0066bf;
--vscode-editorSuggestWidget-focusHighlightForeground: #bbe7ff;
--vscode-editorSuggestWidgetStatus-foreground: rgba(0, 0, 0, 0.5);
--vscode-inlineEdit-originalBackground: rgba(255, 0, 0, 0.04);
--vscode-inlineEdit-modifiedBackground: rgba(156, 204, 44, 0.07);
--vscode-inlineEdit-originalChangedLineBackground: rgba(255, 0, 0, 0.16);
--vscode-inlineEdit-originalChangedTextBackground: rgba(255, 0, 0, 0.16);
--vscode-inlineEdit-modifiedChangedLineBackground: rgba(155, 185, 85, 0.14);
--vscode-inlineEdit-modifiedChangedTextBackground: rgba(156, 204, 44, 0.18);
--vscode-inlineEdit-gutterIndicator-primaryForeground: #ffffff;
--vscode-inlineEdit-gutterIndicator-primaryBorder: #007acc;
--vscode-inlineEdit-gutterIndicator-primaryBackground: rgba(0, 122, 204, 0.5);
--vscode-inlineEdit-gutterIndicator-secondaryForeground: #ffffff;
--vscode-inlineEdit-gutterIndicator-secondaryBorder: #5f6a79;
--vscode-inlineEdit-gutterIndicator-secondaryBackground: #5f6a79;
--vscode-inlineEdit-gutterIndicator-successfulForeground: #ffffff;
--vscode-inlineEdit-gutterIndicator-successfulBorder: #007acc;
--vscode-inlineEdit-gutterIndicator-successfulBackground: #007acc;
--vscode-inlineEdit-gutterIndicator-background: rgba(95, 95, 95, 0.09);
--vscode-inlineEdit-originalBorder: rgba(255, 0, 0, 0.2);
--vscode-inlineEdit-modifiedBorder: rgba(62, 81, 18, 0.25);
--vscode-inlineEdit-tabWillAcceptModifiedBorder: rgba(62, 81, 18, 0.25);
--vscode-inlineEdit-tabWillAcceptOriginalBorder: rgba(255, 0, 0, 0.2);
--vscode-editor-linkedEditingBackground: rgba(255, 0, 0, 0.3);
--vscode-editor-wordHighlightBackground: rgba(87, 87, 87, 0.25);
--vscode-editor-wordHighlightStrongBackground: rgba(14, 99, 156, 0.25);
--vscode-editor-wordHighlightTextBackground: rgba(87, 87, 87, 0.25);
--vscode-editorOverviewRuler-wordHighlightForeground: rgba(160, 160, 160, 0.8);
--vscode-editorOverviewRuler-wordHighlightStrongForeground: rgba(192, 160, 192, 0.8);
--vscode-editorOverviewRuler-wordHighlightTextForeground: rgba(160, 160, 160, 0.8);
--vscode-editorHoverWidget-highlightForeground: #0066bf;
--vscode-editor-placeholder-foreground: rgba(0, 0, 0, 0.47);
--vscode-multiDiffEditor-background: #fffffe;
--vscode-multiDiffEditor-border: #cccccc; }

.mtk1 { color: #000000; }
.mtk2 { color: #fffffe; }
.mtk3 { color: #808080; }
.mtk4 { color: #ff0000; }
.mtk5 { color: #0451a5; }
.mtk6 { color: #0000ff; }
.mtk7 { color: #098658; }
.mtk8 { color: #008000; }
.mtk9 { color: #dd0000; }
.mtk10 { color: #383838; }
.mtk11 { color: #cd3131; }
.mtk12 { color: #863b00; }
.mtk13 { color: #af00db; }
.mtk14 { color: #800000; }
.mtk15 { color: #e00000; }
.mtk16 { color: #3030c0; }
.mtk17 { color: #666666; }
.mtk18 { color: #778899; }
.mtk19 { color: #c700c7; }
.mtk20 { color: #a31515; }
.mtk21 { color: #4f76ac; }
.mtk22 { color: #008080; }
.mtk23 { color: #001188; }
.mtk24 { color: #4864aa; }
.mtki { font-style: italic; }
.mtkb { font-weight: bold; }
.mtku { text-decoration: underline; text-underline-position: under; }
.mtks { text-decoration: line-through; }
.mtks.mtku { text-decoration: underline line-through; text-underline-position: under; }
.monaco-editor, .monaco-diff-editor, .monaco-component { forced-color-adjust: none; }</style><script src="/_next/static/chunks/760eeaf1292a2135.js"></script><script src="/_next/static/chunks/c70523ce604bd3cc.js"></script><script src="/_next/static/chunks/07b0419515ee2c98.js"></script><script src="/_next/static/chunks/af5ee95cbd531dcf.js"></script><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>App: Markdown to HTML Converter</title><meta name="description" content="Building an app for Markdown to HTML Converter with Qwen/Qwen3-Coder-480B-A35B-Instruct-FP8"><meta property="og:title" content="App: Markdown to HTML Converter"><meta property="og:description" content="Building an app for Markdown to HTML Converter with Qwen/Qwen3-Coder-480B-A35B-Instruct-FP8"><meta property="og:type" content="website"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="Llama Coder – AI Code Generator"><meta name="twitter:description" content="Generate your next app with Llama 3.1 405B"><meta name="twitter:image" content="https://llamacoder.io/og-image.png"><link rel="icon" href="/favicon.ico?favicon.9656a384.ico" sizes="48x48" type="image/x-icon"><link rel="icon" href="/favicon.ico"></head><body class="flex min-h-full flex-col bg-gray-100 text-gray-900 antialiased monaco-enable-motion underline-links" style=""><!--$--><!--/$--><div hidden=""></div><div class="h-dvh"><div class="flex h-full"><div class="flex w-full shrink-0 flex-col overflow-hidden lg:w-[30%]"><div class="flex items-center gap-4 px-4 py-4"><a href="/" target="_blank"><img class="size-[24px]" src="/logo.svg"></a><p class="italic text-gray-500">Markdown to HTML Converter</p></div><div class="relative grow overflow-hidden"><div style="height: 100%; width: 100%; overflow: auto;"><div class="mx-auto flex w-full max-w-prose flex-col gap-8 py-8 pl-4 pr-2"><div class="pointer-events-none absolute inset-0 z-10" style="background: linear-gradient(rgb(244, 244, 245) 0%, rgba(244, 244, 245, 0) 20px, rgba(244, 244, 245, 0) calc(100% - 20px), rgb(244, 244, 245) 100%); transform: translateY(-1px);"></div><div class="relative inline-flex max-w-[80%] items-end gap-3 self-end"><div class="whitespace-pre-wrap break-words rounded bg-white px-4 py-2 text-gray-600 shadow">we want to make an AI chat md/json converter, and generator to html format. generating a really nice html chat file that can be viewed offline. 

we need the ability to either paste the markdown or json content into a user entry field. or allow uploading of the json or markdown file to convert to html format. 

the generated html file should have a nice modern material design 3 style. dark by default, different colors for the user "Prompt" and AI "Response" 

the pasted text, or uploaded file will start with "Prompt" for a user prompt and "Response" For an AI Response. so if we can make this detection function without AI lets do this please.</div></div><div class=""><div><div class="prose break-words"><p>I'll create a React app that converts AI chat logs into beautifully styled HTML files with Material Design 3 aesthetics. Here's the implementation:</p></div></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/App.tsx</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/components/InputArea.tsx</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/components/ChatPreview.tsx</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/components/ExportButton.tsx</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/types/index.ts</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/utils/parseMarkdown.ts</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/utils/parseJson.ts</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/utils/generateHtml.ts</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/components/ui/badge.tsx</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/components/ui/button.tsx</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/components/ui/card.tsx</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/components/ui/separator.tsx</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/components/ui/textarea.tsx</span></div><div><div class="prose break-words"><p>This implementation provides a complete solution for converting AI chat logs into beautifully styled HTML files with Material Design 3 aesthetics. Key features include:</p>
<ol>
<li>
<p><strong>Input Handling</strong>:</p>
<ul>
<li>Text area for pasting content</li>
<li>File upload with drag-and-drop support</li>
<li>Auto-detection of Markdown or JSON formats</li>
</ul>
</li>
<li>
<p><strong>Parsing Logic</strong>:</p>
<ul>
<li>Robust Markdown parser recognizing various prompt/response formats</li>
<li>Flexible JSON parser supporting multiple common structures</li>
<li>Validation for proper alternating message sequence</li>
</ul>
</li>
<li>
<p><strong>Preview &amp; Export</strong>:</p>
<ul>
<li>Real-time preview of parsed messages</li>
<li>Material Design 3 dark theme styling</li>
<li>Export to standalone HTML with embedded CSS</li>
<li>Responsive design for all screen sizes</li>
</ul>
</li>
<li>
<p><strong>User Experience</strong>:</p>
<ul>
<li>Clear error messaging</li>
<li>Loading states during generation</li>
<li>Success notifications</li>
<li>Intuitive drag-and-drop interface</li>
<li>Character count indicator</li>
</ul>
</li>
</ol>
<p>The generated HTML files are completely self-contained with no external dependencies, featuring a beautiful dark theme with distinct styling for user prompts and AI responses. The design follows Material Design 3 principles with appropriate spacing, typography, and color schemes.</p></div></div><div class="my-4"><button class="inline-flex w-full items-center gap-2 rounded-lg border-4 border-gray-300 p-1.5 bg-gray-300 hover:border-gray-400 hover:bg-gray-400"><div class="flex size-8 items-center justify-center rounded font-bold bg-gray-200">V1</div><div class="flex flex-col gap-0.5 text-left leading-none"><div class="text-sm font-medium leading-none">Version 1</div><div class="text-xs leading-none text-gray-500">13 files edited</div></div><div class="ml-auto"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 0.5L11 11M5.16667 2.25L8.66667 5.75M8.66667 5.75L5.16667 9.25M8.66667 5.75L0.5 5.75" stroke="black" stroke-linecap="round" stroke-linejoin="round"></path></svg></div></button></div></div><div class="relative inline-flex max-w-[80%] items-end gap-3 self-end"><div class="whitespace-pre-wrap break-words rounded bg-white px-4 py-2 text-gray-600 shadow">The code is not working. Can you fix it? Here's the error:

/App.tsx: Could not find dependency: 'sonner' relative to '/App.tsx' (10:0)

   7 | import { parseJson } from "./utils/parseJson";
   8 | import { generateHtml } from "./utils/generateHtml";
   9 | import { AlertCircle } from "lucide-react";
&gt; 10 | import { Toaster, toast } from "sonner";
       ^
  11 | 
  12 | function App() {
  13 |   const [inputText, setInputText] = useState("");</div></div><div class=""><div><div class="prose break-words"><p>I see the issue. The <code>sonner</code> library isn't available in our environment. Let me fix this by removing the dependency and using a simpler notification approach. I'll also make sure all imports are correct.</p></div></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/App.tsx</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/components/InputArea.tsx</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/components/ChatPreview.tsx</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/components/ExportButton.tsx</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/types/index.ts</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/utils/parseMarkdown.ts</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/utils/parseJson.ts</span></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/utils/generateHtml.ts</span></div><div><div class="prose break-words"><p>The main changes I made:</p>
<ol>
<li>Removed the <code>sonner</code> dependency and replaced it with simple state-based notifications using <code>CheckCircle</code> icon</li>
<li>Added success state handling in the App component</li>
<li>Kept all other functionality the same</li>
</ol>
<p>The app should now work correctly without any missing dependencies. The UI provides clear feedback for both errors and success states, and all the core functionality for parsing and exporting chat logs remains intact.</p></div></div><div class="my-4"><button class="inline-flex w-full items-center gap-2 rounded-lg border-4 border-gray-300 p-1.5 bg-gray-300 hover:border-gray-400 hover:bg-gray-400"><div class="flex size-8 items-center justify-center rounded font-bold bg-gray-200">V2</div><div class="flex flex-col gap-0.5 text-left leading-none"><div class="text-sm font-medium leading-none">Version 2</div><div class="text-xs leading-none text-gray-500">8 files edited</div></div><div class="ml-auto"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 0.5L11 11M5.16667 2.25L8.66667 5.75M8.66667 5.75L5.16667 9.25M8.66667 5.75L0.5 5.75" stroke="black" stroke-linecap="round" stroke-linejoin="round"></path></svg></div></button></div></div><div class="relative inline-flex max-w-[80%] items-end gap-3 self-end"><div class="whitespace-pre-wrap break-words rounded bg-white px-4 py-2 text-gray-600 shadow">a basic parser. 

Looks for ## Prompt: or ## User: 
for the user prompt
and 
looks for ## Response: 
for the AI response

parses it then makes a basic chat, no collapsible boxes or anytihng, just separated prompt and response dialogue boxes. 

we want to separate the colors of the user prompt and the AI response boxes aswell for easier differentiation.</div></div><div class=""><div><div class="prose break-words"><p>I'll create a simplified version with a basic parser that looks for the specific headers you mentioned. Here's the implementation:</p></div></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/App.tsx</span></div><div><div class="prose break-words"><p>This implementation provides:</p>
<ol>
<li>
<p><strong>Simple Parser</strong>:</p>
<ul>
<li>Looks for <code>## Prompt:</code> or <code>## User:</code> for user messages</li>
<li>Looks for <code>## Response:</code> for AI messages</li>
<li>Handles multi-line content properly</li>
</ul>
</li>
<li>
<p><strong>Distinct Styling</strong>:</p>
<ul>
<li>User prompts: Blue-themed with left border</li>
<li>AI responses: Purple-themed with left border</li>
<li>Clear visual separation between messages</li>
</ul>
</li>
<li>
<p><strong>Core Features</strong>:</p>
<ul>
<li>Text area for pasting content</li>
<li>File upload functionality</li>
<li>Real-time preview of parsed messages</li>
<li>Export to standalone HTML with embedded CSS</li>
<li>Responsive design for all screen sizes</li>
</ul>
</li>
<li>
<p><strong>User Experience</strong>:</p>
<ul>
<li>Clear error/success messaging</li>
<li>Character count indicator</li>
<li>Loading state during export</li>
<li>Visual feedback for all actions</li>
</ul>
</li>
</ol>
<p>The generated HTML files are completely self-contained with no external dependencies and maintain the same color scheme and styling as the preview. The parser is focused specifically on the headers you specified and handles content blocks properly.</p></div></div><div class="my-4"><button class="inline-flex w-full items-center gap-2 rounded-lg border-4 border-gray-300 p-1.5 bg-gray-300 hover:border-gray-400 hover:bg-gray-400"><div class="flex size-8 items-center justify-center rounded font-bold bg-gray-200">V3</div><div class="flex flex-col gap-0.5 text-left leading-none"><div class="text-sm font-medium leading-none">Version 3</div><div class="text-xs leading-none text-gray-500">1 file edited</div></div><div class="ml-auto"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 0.5L11 11M5.16667 2.25L8.66667 5.75M8.66667 5.75L5.16667 9.25M8.66667 5.75L0.5 5.75" stroke="black" stroke-linecap="round" stroke-linejoin="round"></path></svg></div></button></div></div><div class="relative inline-flex max-w-[80%] items-end gap-3 self-end"><div class="whitespace-pre-wrap break-words rounded bg-white px-4 py-2 text-gray-600 shadow">perfect! now is it possible to have anything that is in blocks 
```
```
show up in a code block?

so it displays cleaner in the generated html?

with a possibly copy button in the code block for easy copying of the content in the block.</div></div><div class=""><div><div class="prose break-words"><p>I'll enhance the parser and HTML generation to handle code blocks with copy functionality. Here's the updated implementation:</p></div></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/App.tsx</span></div><div><div class="prose break-words"><p>This enhanced version now includes:</p>
<ol>
<li>
<p><strong>Code Block Detection</strong>:</p>
<ul>
<li>Automatically detects content wrapped in triple backticks (```)</li>
<li>Supports optional language specification (e.g., ```python)</li>
<li>Renders code blocks with distinct styling</li>
</ul>
</li>
<li>
<p><strong>Copy Functionality</strong>:</p>
<ul>
<li>Each code block has a "Copy" button</li>
<li>Works in both preview and exported HTML</li>
<li>Visual feedback when code is copied ("Copied!" message)</li>
</ul>
</li>
<li>
<p><strong>Improved Styling</strong>:</p>
<ul>
<li>Code blocks have a dark theme with proper syntax-like highlighting</li>
<li>Language indicator in the code block header</li>
<li>Scrollable content for long code blocks</li>
<li>Consistent styling between preview and exported HTML</li>
</ul>
</li>
<li>
<p><strong>Enhanced UX</strong>:</p>
<ul>
<li>Clear visual separation of code blocks from regular text</li>
<li>Responsive design that works on all screen sizes</li>
<li>Success feedback when code is copied</li>
</ul>
</li>
</ol>
<p>The parser still focuses on the same headers you specified (## Prompt:, ## User:, ## Response:) but now also processes any content within triple backticks as code blocks with copy functionality. The exported HTML is completely self-contained with all necessary CSS and JavaScript.</p></div></div><div class="my-4"><button class="inline-flex w-full items-center gap-2 rounded-lg border-4 border-gray-300 p-1.5 bg-gray-300 hover:border-gray-400 hover:bg-gray-400"><div class="flex size-8 items-center justify-center rounded font-bold bg-gray-200">V4</div><div class="flex flex-col gap-0.5 text-left leading-none"><div class="text-sm font-medium leading-none">Version 4</div><div class="text-xs leading-none text-gray-500">1 file edited</div></div><div class="ml-auto"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 0.5L11 11M5.16667 2.25L8.66667 5.75M8.66667 5.75L5.16667 9.25M8.66667 5.75L0.5 5.75" stroke="black" stroke-linecap="round" stroke-linejoin="round"></path></svg></div></button></div></div><div class="relative inline-flex max-w-[80%] items-end gap-3 self-end"><div class="whitespace-pre-wrap break-words rounded bg-white px-4 py-2 text-gray-600 shadow">alright! very nice! your doing very good! 

now can we make it so anything that is the the boxed 

```
```

that has the copy button, also collapsible.
so the chats are able to show nice and clean. </div></div><div class=""><div><div class="prose break-words"><p>I'll add collapsible functionality to the code blocks. Here's the updated implementation:</p></div></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/App.tsx</span></div><div><div class="prose break-words"><p>This implementation adds collapsible functionality to code blocks with the following features:</p>
<ol>
<li>
<p><strong>Collapsible Code Blocks</strong>:</p>
<ul>
<li>Code blocks are collapsed by default to keep the chat clean</li>
<li>Toggle button to show/hide code content</li>
<li>Visual indicators (chevron icons) for collapsed/expanded state</li>
</ul>
</li>
<li>
<p><strong>Enhanced UI</strong>:</p>
<ul>
<li>Clean header with language indicator and action buttons</li>
<li>Consistent styling between preview and exported HTML</li>
<li>Scrollable content area for long code blocks</li>
<li>Smooth transitions between states</li>
</ul>
</li>
<li>
<p><strong>Improved Functionality</strong>:</p>
<ul>
<li>Copy button works in both states</li>
<li>Toggle button text changes based on state ("Show"/"Hide")</li>
<li>Code content is hidden when collapsed but preserved in DOM</li>
<li>Max height with scroll for expanded code blocks</li>
</ul>
</li>
<li>
<p><strong>Exported HTML</strong>:</p>
<ul>
<li>All collapsible functionality works in the exported HTML</li>
<li>Self-contained JavaScript for toggle/copy actions</li>
<li>Consistent styling with the preview</li>
</ul>
</li>
</ol>
<p>The parser still focuses on the same headers you specified, but now code blocks are collapsed by default for a cleaner chat experience. Users can expand specific code blocks when they need to view or copy the content.</p></div></div><div class="my-4"><button class="inline-flex w-full items-center gap-2 rounded-lg border-4 border-gray-300 p-1.5 bg-gray-300 hover:border-gray-400 hover:bg-gray-400"><div class="flex size-8 items-center justify-center rounded font-bold bg-gray-200">V5</div><div class="flex flex-col gap-0.5 text-left leading-none"><div class="text-sm font-medium leading-none">Version 5</div><div class="text-xs leading-none text-gray-500">1 file edited</div></div><div class="ml-auto"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 0.5L11 11M5.16667 2.25L8.66667 5.75M8.66667 5.75L5.16667 9.25M8.66667 5.75L0.5 5.75" stroke="black" stroke-linecap="round" stroke-linejoin="round"></path></svg></div></button></div></div><div class="relative inline-flex max-w-[80%] items-end gap-3 self-end"><div class="whitespace-pre-wrap break-words rounded bg-white px-4 py-2 text-gray-600 shadow">The code is not working. Can you fix it? Here's the error:

/App.tsx: Rendered more hooks than during the previous render. (330:55)

  327 |         // Extract code content
  328 |         const codeContent = part.replace(/^```(\w+)?\n?/, '').replace(/```$/, '').trim();
  329 |         
&gt; 330 |         const [isCollapsed, setIsCollapsed] = useState(true);
                                                               ^
  331 |         
  332 |         return (
  333 |           &lt;div key={index} className={`my-2 rounded-md overflow-hidden ${isCollapsed ? 'collapsed' : 'expanded'}`}&gt;</div></div><div class=""><div><div class="prose break-words"><p>You're right, I made an error by calling <code>useState</code> inside a map function, which violates React's rules of hooks. Let me fix this by managing the collapsed state properly:</p></div></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/App.tsx</span></div><div><div class="prose break-words"><p>The key fixes I made:</p>
<ol>
<li>
<p><strong>Moved state management outside the render loop</strong>:</p>
<ul>
<li>Added <code>collapsedStates</code> state to track the collapsed/expanded state of each code block</li>
<li>Created a unique key for each code block using <code>messageIndex-partIndex</code></li>
<li>Added <code>toggleCodeBlock</code> function to update the state properly</li>
</ul>
</li>
<li>
<p><strong>Proper initialization</strong>:</p>
<ul>
<li>When parsing content, I now initialize the collapsed states for all code blocks</li>
<li>Code blocks are collapsed by default</li>
</ul>
</li>
<li>
<p><strong>Fixed the preview rendering</strong>:</p>
<ul>
<li>Passed <code>messageIndex</code> to <code>processPreviewContent</code> to create unique keys</li>
<li>Used the stored state to determine if a code block should be collapsed or expanded</li>
<li>Updated the toggle button to use the new state management</li>
</ul>
</li>
<li>
<p><strong>Maintained consistency</strong>:</p>
<ul>
<li>The exported HTML still has the same collapsible functionality</li>
<li>The UI remains consistent between preview and exported version</li>
</ul>
</li>
</ol>
<p>Now the code blocks are properly collapsible in the preview, and the state management follows React's rules. Code blocks are collapsed by default for a cleaner chat view, and users can expand specific blocks when needed.</p></div></div><div class="my-4"><button class="inline-flex w-full items-center gap-2 rounded-lg border-4 border-gray-300 p-1.5 bg-gray-300 hover:border-gray-400 hover:bg-gray-400"><div class="flex size-8 items-center justify-center rounded font-bold bg-gray-200">V6</div><div class="flex flex-col gap-0.5 text-left leading-none"><div class="text-sm font-medium leading-none">Version 6</div><div class="text-xs leading-none text-gray-500">1 file edited</div></div><div class="ml-auto"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 0.5L11 11M5.16667 2.25L8.66667 5.75M8.66667 5.75L5.16667 9.25M8.66667 5.75L0.5 5.75" stroke="black" stroke-linecap="round" stroke-linejoin="round"></path></svg></div></button></div></div><div class="relative inline-flex max-w-[80%] items-end gap-3 self-end"><div class="whitespace-pre-wrap break-words rounded bg-white px-4 py-2 text-gray-600 shadow">beautiful! lets make the markdown show up correctly on the generated html now please! 
so the chats have the rick markdown formatting AI provides!</div></div><div class=""><div><div class="prose break-words"><p>I'll enhance the HTML generation to properly render Markdown formatting. Here's the updated implementation:</p></div></div><div class="m-0.5 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600"><path d="M10.5 3.5L11.5 2.5L12.5 3.5L11.5 4.5L10.5 3.5ZM2.5 9.5V11.5H4.5L9.5 6.5L7.5 4.5L2.5 9.5ZM0.5 12.5H13.5V14.5H0.5V12.5Z" fill="currentColor"></path></svg><span class="font-medium text-gray-700">src/App.tsx</span></div><div><div class="prose break-words"><p>The key enhancements I made for Markdown rendering:</p>
<ol>
<li>
<p><strong>Added Markdown Parser</strong>:</p>
<ul>
<li>Created a <code>parseMarkdown</code> function that handles:
<ul>
<li>Bold text (<code>**text**</code> or <code>__text__</code>)</li>
<li>Italic text (<code>*text*</code> or <code>_text_</code>)</li>
<li>Inline code (<code>`code`</code>)</li>
<li>Code blocks (<code> </code>code<code> </code>)</li>
<li>Headers (<code>#</code>, <code>##</code>, <code>###</code>)</li>
<li>Lists (<code>* item</code>)</li>
<li>Links (<code>[text](url)</code>)</li>
<li>Line breaks</li>
</ul>
</li>
</ul>
</li>
<li>
<p><strong>Enhanced HTML Generation</strong>:</p>
<ul>
<li>The exported HTML now properly renders Markdown formatting</li>
<li>Code blocks are still handled separately with collapsible functionality</li>
<li>All other Markdown elements are converted to appropriate HTML tags</li>
</ul>
</li>
<li>
<p><strong>Improved Preview</strong>:</p>
<ul>
<li>The preview now also renders Markdown formatting correctly</li>
<li>Used <code>dangerouslySetInnerHTML</code> for safe rendering of processed Markdown</li>
<li>Maintained the existing code block functionality</li>
</ul>
</li>
<li>
<p><strong>Updated Styling</strong>:</p>
<ul>
<li>Added proper CSS for all Markdown elements in the exported HTML</li>
<li>Headers, links, lists, and inline formatting now display correctly</li>
<li>Maintained the dark theme aesthetic</li>
</ul>
</li>
<li>
<p><strong>User Interface Updates</strong>:</p>
<ul>
<li>Added examples of supported Markdown formatting to the help text</li>
<li>Maintained all existing functionality while adding Markdown support</li>
</ul>
</li>
</ol>
<p>Now the generated HTML will properly display rich Markdown formatting from AI responses, including headers, bold/italic text, lists, links, and code blocks - all with the collapsible functionality for code blocks.</p></div></div><div class="my-4"><button class="inline-flex w-full items-center gap-2 rounded-lg border-4 border-gray-300 p-1.5 bg-gray-300 hover:border-gray-400 hover:bg-gray-400"><div class="flex size-8 items-center justify-center rounded font-bold bg-gray-200">V7</div><div class="flex flex-col gap-0.5 text-left leading-none"><div class="text-sm font-medium leading-none">Version 7</div><div class="text-xs leading-none text-gray-500">1 file edited</div></div><div class="ml-auto"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 0.5L11 11M5.16667 2.25L8.66667 5.75M8.66667 5.75L5.16667 9.25M8.66667 5.75L0.5 5.75" stroke="black" stroke-linecap="round" stroke-linejoin="round"></path></svg></div></button></div></div></div></div></div><div class="mx-auto mb-5 flex w-full max-w-prose shrink-0 px-4"><form class="relative flex w-full" action="javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')"><fieldset class="w-full"><div class="relative flex flex-col rounded-lg border border-gray-300 bg-white"><div class="relative w-full"><div class="w-full p-2.5"><p class="invisible min-h-[48px] w-full whitespace-pre-wrap">a</p></div><textarea placeholder="Ask a follow up..." required="" name="prompt" class="peer absolute inset-0 w-full resize-none bg-transparent p-2.5 placeholder-gray-500 focus:outline-none disabled:opacity-50"></textarea></div><div class="flex w-full justify-between p-1.5 pl-2.5 has-[:disabled]:opacity-50"><div class="max-w-[200px] items-center truncate font-mono text-xs text-gray-500" title="Qwen/Qwen3-Coder-480B-A35B-Instruct-FP8">Qwen 3 Coder</div><button class="relative inline-flex size-6 items-center justify-center rounded bg-blue-500 font-medium text-white shadow-lg outline-blue-300 hover:bg-blue-500/75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" type="submit"><svg width="12" height="6" viewBox="0 0 12 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 2.519a.5.5 0 000 1v-1zm11 .5L7.003.13v5.777L12 3.02zm-11 .5h6.503v-1H1v1z" fill="#fff"></path></svg></button></div></div></fieldset></form></div></div><div class="w-[70%] hidden h-full overflow-hidden py-5 transition-[width] lg:block"><div class="ml-3 flex h-full flex-col rounded-l-xl shadow-lg shadow-gray-400/40"><div class="flex h-full flex-col rounded-l-xl shadow shadow-gray-800/50"><div class="flex h-16 shrink-0 items-center justify-between border-b border-gray-300 px-4"><div class="inline-flex items-center gap-4"><button class="hidden text-gray-400 hover:text-gray-700 md:block"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg></button><span class="hidden md:block"></span><button type="button" role="combobox" aria-controls="radix-_r_1o_" aria-expanded="false" aria-autocomplete="none" dir="ltr" data-state="closed" class="flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&amp;&gt;span]:line-clamp-1 h-[38px] w-16 text-sm font-semibold !outline-none !ring-0 !ring-transparent"><span style="pointer-events: none;">v8</span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down h-4 w-4 opacity-50" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg></button></div><div class="rounded-lg border-2 border-gray-300 p-1"><button class="inline-flex h-7 w-16 items-center justify-center rounded text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50 data-[active]:bg-blue-500 data-[active]:text-white">Code</button><button class="inline-flex h-7 w-16 items-center justify-center rounded text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50 data-[active]:bg-blue-500 data-[active]:text-white" data-active="true">Preview</button></div></div><div class="flex grow flex-col overflow-y-auto bg-white"><div class="flex h-full items-center justify-center"><div class="relative h-full w-full [&amp;_.sp-preview-container]:flex [&amp;_.sp-preview-container]:h-full [&amp;_.sp-preview-container]:w-full [&amp;_.sp-preview-container]:grow [&amp;_.sp-preview-container]:flex-col [&amp;_.sp-preview-container]:justify-center [&amp;_.sp-preview-iframe]:grow sp-wrapper"><div class=" h-full w-full sp-preview sp-stack"><div class=" sp-preview-container"><iframe class=" sp-preview-iframe" title="Sandpack Preview" sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts allow-downloads allow-pointer-lock" allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; clipboard-read; clipboard-write; xr-spatial-tracking;" src="https://2-19-8-sandpack.codesandbox.io/" style="height: 1098px;"></iframe><div class=" sp-preview-actions"></div></div></div></div></div></div><div class="flex items-center justify-between border-t border-gray-300 px-4 py-4"><div class="inline-flex items-center gap-2.5 text-sm"><form action="javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')" class="flex"><button type="submit" class="inline-flex items-center gap-1 rounded border border-gray-300 px-1.5 py-0.5 text-sm text-gray-600 enabled:hover:bg-white disabled:opacity-50"><svg width="10" height="11" viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg" class="size-3"><path d="M9.5 2.5H7.9c-.84 0-1.26 0-1.581.163a1.5 1.5 0 00-.656.656c-.163.32-.163.74-.163 1.581v.6m4-3L8 1m1.5 1.5L8 4M4 1H2.9c-.84 0-1.26 0-1.581.163a1.5 1.5 0 00-.656.656C.5 2.139.5 2.559.5 3.4v4.2c0 .84 0 1.26.163 1.581a1.5 1.5 0 00.656.656c.32.163.74.163 1.581.163h4.2c.84 0 1.26 0 1.581-.163a1.5 1.5 0 00.656-.656c.163-.32.163-.74.163-1.581V6.5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path></svg>Share</button></form><button class="inline-flex items-center gap-1 rounded border border-gray-300 px-1.5 py-0.5 text-sm text-gray-600 transition enabled:hover:bg-white disabled:opacity-50"><svg width="10" height="11" viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg" class="size-3"><path d="M9.226 5.947A4.25 4.25 0 011.32 7.626l-.125-.217m-.42-2.356A4.25 4.25 0 018.68 3.374l.124.217M.747 8.533l.366-1.366 1.366.366M7.52 3.467l1.366.366.366-1.366" stroke="currentColor" stroke-width="0.7" stroke-linecap="round" stroke-linejoin="round"></path></svg>Refresh</button><button class="hidden items-center gap-1 rounded border border-gray-300 px-1.5 py-0.5 text-sm text-gray-600 transition hover:bg-white disabled:opacity-50 md:inline-flex" title="Download files"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-download size-3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" x2="12" y1="15" y2="3"></line></svg>Download</button></div><div class="text-xs text-gray-500 md:hidden">Qwen/Qwen3-Coder-480B-A35B-Instruct-FP8</div></div></div></div></div></div></div><div role="region" aria-label="Notifications (F8)" tabindex="-1" style="pointer-events: none;"><ol tabindex="-1" class="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]"></ol></div><script>requestAnimationFrame(function(){$RT=performance.now()});</script><script>addEventListener("submit",function(a){if(!a.defaultPrevented){var c=a.target,d=a.submitter,e=c.action,b=d;if(d){var f=d.getAttribute("formAction");null!=f&&(e=f,b=null)}"javascript:throw new Error('React form unexpectedly submitted.')"===e&&(a.preventDefault(),b?(a=document.createElement("input"),a.name=b.name,a.value=b.value,b.parentNode.insertBefore(a,b),b=new FormData(c),a.parentNode.removeChild(a)):b=new FormData(c),a=c.ownerDocument||c,(a.$$reactFormReplay=a.$$reactFormReplay||[]).push(c,d,b))}});</script><script src="/_next/static/chunks/9da854c020835f32.js" id="_R_" async=""></script><script>document.querySelectorAll('body link[rel="icon"], body link[rel="apple-touch-icon"]').forEach(el => document.head.appendChild(el))</script><script>$RB=[];$RV=function(a){$RT=performance.now();for(var b=0;b<a.length;b+=2){var c=a[b],e=a[b+1];null!==e.parentNode&&e.parentNode.removeChild(e);var f=c.parentNode;if(f){var g=c.previousSibling,h=0;do{if(c&&8===c.nodeType){var d=c.data;if("/$"===d||"/&"===d)if(0===h)break;else h--;else"$"!==d&&"$?"!==d&&"$~"!==d&&"$!"!==d&&"&"!==d||h++}d=c.nextSibling;f.removeChild(c);c=d}while(c);for(;e.firstChild;)f.insertBefore(e.firstChild,c);g.data="$";g._reactRetry&&requestAnimationFrame(g._reactRetry)}}a.length=0};
$RC=function(a,b){if(b=document.getElementById(b))(a=document.getElementById(a))?(a.previousSibling.data="$~",$RB.push(a,b),2===$RB.length&&("number"!==typeof $RT?requestAnimationFrame($RV.bind(null,$RB)):(a=performance.now(),setTimeout($RV.bind(null,$RB),2300>a&&2E3<a?2300-a:$RT+300-a)))):b.parentNode.removeChild(b)};$RC("B:0","S:0")</script><script>$RC("B:1","S:1")</script><script>(self.__next_f=self.__next_f||[]).push([0])</script><script>self.__next_f.push([1,"1:\"$Sreact.fragment\"\n2:I[42563,[\"/_next/static/chunks/0fe1fed3c6e3041d.js\"],\"default\"]\n3:I[9308,[\"/_next/static/chunks/e81760860a411ce5.js\",\"/_next/static/chunks/0f4af0675c9bcb73.js\"],\"default\"]\n4:I[13306,[\"/_next/static/chunks/e81760860a411ce5.js\",\"/_next/static/chunks/0f4af0675c9bcb73.js\"],\"default\"]\n5:I[72295,[\"/_next/static/chunks/0fe1fed3c6e3041d.js\",\"/_next/static/chunks/3422ba98d8389acc.js\"],\"default\"]\n6:I[53469,[\"/_next/static/chunks/0fe1fed3c6e3041d.js\",\"/_next/static/chunks/780ac47fffc5f200.js\",\"/_next/static/chunks/5948eceb615198b0.js\"],\"default\"]\nd:I[88212,[],\"default\"]\ne:I[34863,[\"/_next/static/chunks/0fe1fed3c6e3041d.js\",\"/_next/static/chunks/780ac47fffc5f200.js\",\"/_next/static/chunks/5948eceb615198b0.js\"],\"Toaster\"]\nf:I[32302,[\"/_next/static/chunks/e81760860a411ce5.js\",\"/_next/static/chunks/0f4af0675c9bcb73.js\"],\"ClientPageRoot\"]\n10:I[33235,[\"/_next/static/chunks/0fe1fed3c6e3041d.js\",\"/_next/static/chunks/780ac47fffc5f200.js\",\"/_next/static/chunks/5948eceb615198b0.js\",\"/_next/static/chunks/9d76c1bc58cf3994.js\",\"/_next/static/chunks/fb9c68c1e40040b8.js\",\"/_next/static/chunks/426cd99fbf40ac08.js\"],\"default\"]\n11:I[7183,[\"/_next/static/chunks/e81760860a411ce5.js\",\"/_next/static/chunks/0f4af0675c9bcb73.js\"],\"OutletBoundary\"]\n12:\"$Sreact.suspense\"\n14:I[7183,[\"/_next/static/chunks/e81760860a411ce5.js\",\"/_next/static/chunks/0f4af0675c9bcb73.js\"],\"ViewportBoundary\"]\n16:I[7183,[\"/_next/static/chunks/e81760860a411ce5.js\",\"/_next/static/chunks/0f4af0675c9bcb73.js\"],\"MetadataBoundary\"]\n18:I[3674,[\"/_next/static/chunks/e81760860a411ce5.js\",\"/_next/static/chunks/0f4af0675c9bcb73.js\"],\"IconMark\"]\n:HL[\"/_next/static/chunks/68c497ff8c65deef.css\",\"style\"]\n:HL[\"/fullLogo.png\",\"image\"]\n:HL[\"/together.png\",\"image\"]\n0:{\"P\":null,\"b\":\"Gj_TRrBqMKBk5Pj0qwEYr\",\"c\":[\"\",\"\"],\"q\":\"\",\"i\":false,\"f\":[[[\"\",{\"children\":[\"(main)\",{\"children\":[\"__PAGE__\",{}]}]},\"$undefined\",\"$undefined\",true],[[\"$\",\"$1\",\"c\",{\"children\":[[[\"$\",\"link\",\"0\",{\"rel\":\"stylesheet\",\"href\":\"/_next/static/chunks/68c497ff8c65deef.css\",\"precedence\":\"next\",\"crossOrigin\":null,\"nonce\":\"$undefined\"}],[\"$\",\"script\",\"script-0\",{\"src\":\"/_next/static/chunks/0fe1fed3c6e3041d.js\",\"async\":true,\"nonce\":\"$undefined\"}]],[\"$\",\"html\",null,{\"lang\":\"en\",\"className\":\"h-full\",\"children\":[[\"$\",\"head\",null,{\"children\":[[\"$\",\"$L2\",null,{\"async\":true,\"defer\":true,\"data-api\":\"$undefined\",\"data-domain\":\"llamacoder.io\",\"data-exclude\":\"$undefined\",\"src\":\"https://plausible.io/js/script.js\",\"integrity\":\"$undefined\",\"crossOrigin\":\"$undefined\"}],[\"$\",\"$L2\",null,{\"id\":\"next-plausible-init\",\"dangerouslySetInnerHTML\":{\"__html\":\"window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) }\"},\"nonce\":\"$undefined\"}],\"$undefined\"]}],[\"$\",\"$L3\",null,{\"parallelRouterKey\":\"children\",\"error\":\"$undefined\",\"errorStyles\":\"$undefined\",\"errorScripts\":\"$undefined\",\"template\":[\"$\",\"$L4\",null,{}],\"templateStyles\":\"$undefined\",\"templateScripts\":\"$undefined\",\"notFound\":[[\"$\",\"body\",null,{\"className\":\"flex min-h-full flex-col bg-gray-100 text-gray-900 antialiased\",\"children\":[\"$\",\"div\",null,{\"className\":\"flex grow flex-col\",\"children\":[[\"$\",\"header\",null,{\"className\":\"relative mx-auto flex w-full shrink-0 items-center justify-center py-6\",\"children\":[[\"$\",\"$L5\",null,{\"href\":\"/\",\"className\":\"flex flex-row items-center gap-3\",\"children\":[[\"$\",\"img\",null,{\"src\":\"/fullLogo.png\",\"alt\":\"\",\"className\":\"mx-auto h-7 object-contain\"}],[\"$\",\"svg\",null,{\"width\":\"1\",\"height\":\"20\",\"viewBox\":\"0 0 1 20\",\"fill\":\"none\",\"xmlns\":\"http://www.w3.org/2000/svg\",\"children\":[\"$\",\"path\",null,{\"d\":\"M0.25 0V19.5\",\"stroke\":\"#C2C2C2\",\"strokeWidth\":\"0.5\"}]}],[\"$\",\"img\",null,{\"src\":\"/together.png\",\"alt\":\"\",\"className\":\"mx-auto h-[24px] object-contain\"}]]}],[\"$\",\"div\",null,{\"className\":\"absolute right-3\",\"children\":[\"$\",\"a\",null,{\"href\":\"https://github.com/nutlope/llamacoder\",\"target\":\"_blank\",\"className\":\"ml-auto hidden items-center gap-3 rounded-xl border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-700 sm:flex\",\"children\":[[\"$\",\"svg\",null,{\"width\":16,\"height\":16,\"viewBox\":\"0 0 16 16"])</script><script>self.__next_f.push([1,"\",\"fill\":\"none\",\"xmlns\":\"http://www.w3.org/2000/svg\",\"className\":\"h-[18px] w-[18px]\",\"children\":[\"$\",\"path\",null,{\"fillRule\":\"evenodd\",\"clipRule\":\"evenodd\",\"d\":\"M8 0C3.582 0 0 3.672 0 8.203c0 3.623 2.292 6.699 5.471 7.783.4.075.546-.178.546-.396 0-.194-.007-.71-.01-1.394-2.226.495-2.696-1.1-2.696-1.1-.363-.948-.888-1.2-.888-1.2-.726-.508.055-.499.055-.499.803.058 1.225.845 1.225.845.714 1.253 1.873.891 2.328.682.074-.53.28-.891.509-1.096-1.776-.207-3.644-.911-3.644-4.054 0-.895.312-1.628.823-2.201-.082-.208-.357-1.042.079-2.17 0 0 .672-.222 2.2.84A7.485 7.485 0 018 3.967c.68.003 1.364.094 2.003.276 1.527-1.062 2.198-.841 2.198-.841.437 1.129.161 1.963.08 2.17.512.574.822 1.307.822 2.202 0 3.15-1.871 3.844-3.653 4.048.288.253.543.753.543 1.519 0 1.095-.01 1.98-.01 2.25 0 .219.144.474.55.394a8.031 8.031 0 003.96-2.989A8.337 8.337 0 0016 8.203C16 3.672 12.418 0 8 0z\",\"fill\":\"currentColor\"}]}],[\"$\",\"div\",null,{\"className\":\"flex items-center gap-1.5\",\"children\":[\"$\",\"span\",null,{\"className\":\"font-semibold text-gray-900\",\"children\":\"6k stars\"}]}]]}]}]]}],[\"$\",\"div\",null,{\"className\":\"flex grow items-center justify-center\",\"children\":[\"$\",\"h2\",null,{\"className\":\"text-3xl\",\"children\":\"404 | Not Found\"}]}]]}]}],[]],\"forbidden\":\"$undefined\",\"unauthorized\":\"$undefined\"}]]}]]}],{\"children\":[[\"$\",\"$1\",\"c\",{\"children\":[[[\"$\",\"script\",\"script-0\",{\"src\":\"/_next/static/chunks/780ac47fffc5f200.js\",\"async\":true,\"nonce\":\"$undefined\"}],[\"$\",\"script\",\"script-1\",{\"src\":\"/_next/static/chunks/5948eceb615198b0.js\",\"async\":true,\"nonce\":\"$undefined\"}]],[\"$\",\"$L6\",null,{\"children\":[\"$\",\"body\",null,{\"className\":\"flex min-h-full flex-col bg-gray-100 text-gray-900 antialiased\",\"children\":[[\"$\",\"$L3\",null,{\"parallelRouterKey\":\"children\",\"error\":\"$undefined\",\"errorStyles\":\"$undefined\",\"errorScripts\":\"$undefined\",\"template\":[\"$\",\"$L4\",null,{}],\"templateStyles\":\"$undefined\",\"templateScripts\":\"$undefined\",\"notFound\":[[\"$\",\"body\",null,{\"className\":\"flex min-h-full flex-col bg-gray-100 text-gray-900 antialiased\",\"children\":[\"$\",\"div\",null,{\"className\":\"flex grow flex-col\",\"children\":[[\"$\",\"header\",null,{\"className\":\"relative mx-auto flex w-full shrink-0 items-center justify-center py-6\",\"children\":[\"$L7\",\"$L8\"]}],\"$L9\"]}]}],[]],\"forbidden\":\"$undefined\",\"unauthorized\":\"$undefined\"}],\"$La\"]}]}]]}],{\"children\":[\"$Lb\",{},null,false,false]},null,false,false]},null,false,false],\"$Lc\",false]],\"m\":\"$undefined\",\"G\":[\"$d\",[]],\"S\":false}\n7:[\"$\",\"$L5\",null,{\"href\":\"/\",\"className\":\"flex flex-row items-center gap-3\",\"children\":[[\"$\",\"img\",null,{\"src\":\"/fullLogo.png\",\"alt\":\"\",\"className\":\"mx-auto h-7 object-contain\"}],[\"$\",\"svg\",null,{\"width\":\"1\",\"height\":\"20\",\"viewBox\":\"0 0 1 20\",\"fill\":\"none\",\"xmlns\":\"http://www.w3.org/2000/svg\",\"children\":[\"$\",\"path\",null,{\"d\":\"M0.25 0V19.5\",\"stroke\":\"#C2C2C2\",\"strokeWidth\":\"0.5\"}]}],[\"$\",\"img\",null,{\"src\":\"/together.png\",\"alt\":\"\",\"className\":\"mx-auto h-[24px] object-contain\"}]]}]\n8:[\"$\",\"div\",null,{\"className\":\"absolute right-3\",\"children\":[\"$\",\"a\",null,{\"href\":\"https://github.com/nutlope/llamacoder\",\"target\":\"_blank\",\"className\":\"ml-auto hidden items-center gap-3 rounded-xl border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-700 sm:flex\",\"children\":[[\"$\",\"svg\",null,{\"width\":16,\"height\":16,\"viewBox\":\"0 0 16 16\",\"fill\":\"none\",\"xmlns\":\"http://www.w3.org/2000/svg\",\"className\":\"h-[18px] w-[18px]\",\"children\":[\"$\",\"path\",null,{\"fillRule\":\"evenodd\",\"clipRule\":\"evenodd\",\"d\":\"M8 0C3.582 0 0 3.672 0 8.203c0 3.623 2.292 6.699 5.471 7.783.4.075.546-.178.546-.396 0-.194-.007-.71-.01-1.394-2.226.495-2.696-1.1-2.696-1.1-.363-.948-.888-1.2-.888-1.2-.726-.508.055-.499.055-.499.803.058 1.225.845 1.225.845.714 1.253 1.873.891 2.328.682.074-.53.28-.891.509-1.096-1.776-.207-3.644-.911-3.644-4.054 0-.895.312-1.628.823-2.201-.082-.208-.357-1.042.079-2.17 0 0 .672-.222 2.2.84A7.485 7.485 0 018 3.967c.68.003 1.364.094 2.003.276 1.527-1.062 2.198-.841 2.198-.841.437 1.129.161 1.963.08 2.17.512.574.822 1.307.822 2.202 0 3.15-1.871 3.844-3.653 4.048.288.253.543.753.543 1.519 0 1.095-.01 1.98-.01 2.25 0 .219.144.474.55.394a8.031 8.031 0 003.96-2"])</script><script>self.__next_f.push([1,".989A8.337 8.337 0 0016 8.203C16 3.672 12.418 0 8 0z\",\"fill\":\"currentColor\"}]}],[\"$\",\"div\",null,{\"className\":\"flex items-center gap-1.5\",\"children\":[\"$\",\"span\",null,{\"className\":\"font-semibold text-gray-900\",\"children\":\"6k stars\"}]}]]}]}]\n9:[\"$\",\"div\",null,{\"className\":\"flex grow items-center justify-center\",\"children\":[\"$\",\"h2\",null,{\"className\":\"text-3xl\",\"children\":\"404 | Not Found\"}]}]\na:[\"$\",\"$Le\",null,{}]\nb:[\"$\",\"$1\",\"c\",{\"children\":[[\"$\",\"$Lf\",null,{\"Component\":\"$10\",\"serverProvidedParams\":{\"searchParams\":{},\"params\":{},\"promises\":null}}],[[\"$\",\"script\",\"script-0\",{\"src\":\"/_next/static/chunks/9d76c1bc58cf3994.js\",\"async\":true,\"nonce\":\"$undefined\"}],[\"$\",\"script\",\"script-1\",{\"src\":\"/_next/static/chunks/fb9c68c1e40040b8.js\",\"async\":true,\"nonce\":\"$undefined\"}],[\"$\",\"script\",\"script-2\",{\"src\":\"/_next/static/chunks/426cd99fbf40ac08.js\",\"async\":true,\"nonce\":\"$undefined\"}]],[\"$\",\"$L11\",null,{\"children\":[\"$\",\"$12\",null,{\"name\":\"Next.MetadataOutlet\",\"children\":\"$@13\"}]}]]}]\nc:[\"$\",\"$1\",\"h\",{\"children\":[null,[\"$\",\"$L14\",null,{\"children\":\"$@15\"}],[\"$\",\"div\",null,{\"hidden\":true,\"children\":[\"$\",\"$L16\",null,{\"children\":[\"$\",\"$12\",null,{\"name\":\"Next.Metadata\",\"children\":\"$@17\"}]}]}],null]}]\n15:[[\"$\",\"meta\",\"0\",{\"charSet\":\"utf-8\"}],[\"$\",\"meta\",\"1\",{\"name\":\"viewport\",\"content\":\"width=device-width, initial-scale=1\"}]]\n17:[[\"$\",\"title\",\"0\",{\"children\":\"Llama Coder – AI Code Generator\"}],[\"$\",\"meta\",\"1\",{\"name\":\"description\",\"content\":\"Generate your next app with Llama 3.1 405B\"}],[\"$\",\"meta\",\"2\",{\"property\":\"og:title\",\"content\":\"Llama Coder – AI Code Generator\"}],[\"$\",\"meta\",\"3\",{\"property\":\"og:description\",\"content\":\"Generate your next app with Llama 3.1 405B\"}],[\"$\",\"meta\",\"4\",{\"property\":\"og:url\",\"content\":\"https://llamacoder.io\"}],[\"$\",\"meta\",\"5\",{\"property\":\"og:site_name\",\"content\":\"llamacoder.io\"}],[\"$\",\"meta\",\"6\",{\"property\":\"og:locale\",\"content\":\"en_US\"}],[\"$\",\"meta\",\"7\",{\"property\":\"og:image\",\"content\":\"https://llamacoder.io/og-image.png\"}],[\"$\",\"meta\",\"8\",{\"property\":\"og:type\",\"content\":\"website\"}],[\"$\",\"meta\",\"9\",{\"name\":\"twitter:card\",\"content\":\"summary_large_image\"}],[\"$\",\"meta\",\"10\",{\"name\":\"twitter:title\",\"content\":\"Llama Coder – AI Code Generator\"}],[\"$\",\"meta\",\"11\",{\"name\":\"twitter:description\",\"content\":\"Generate your next app with Llama 3.1 405B\"}],[\"$\",\"meta\",\"12\",{\"name\":\"twitter:image\",\"content\":\"https://llamacoder.io/og-image.png\"}],[\"$\",\"link\",\"13\",{\"rel\":\"icon\",\"href\":\"/favicon.ico?favicon.9656a384.ico\",\"sizes\":\"48x48\",\"type\":\"image/x-icon\"}],[\"$\",\"link\",\"14\",{\"rel\":\"icon\",\"href\":\"/favicon.ico\"}],[\"$\",\"$L18\",\"15\",{}]]\n13:null\n"])</script><script src="https://plausible.io/js/script.js" async="" defer="" data-domain="llamacoder.io" data-nscript="afterInteractive"></script><script id="next-plausible-init" data-nscript="afterInteractive">window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) }</script><next-route-announcer style="position: absolute;"><template shadowrootmode="open"><div aria-live="assertive" id="__next-route-announcer__" role="alert" style="position: absolute; border: 0px; height: 1px; margin: -1px; padding: 0px; width: 1px; clip: rect(0px, 0px, 0px, 0px); overflow: hidden; white-space: nowrap; overflow-wrap: normal;">App: Markdown to HTML Converter</div></template></next-route-announcer><script src="https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs/loader.js"></script><div class="context-view" aria-hidden="true" style="display: none;"></div><div class="monaco-aria-container"><div class="monaco-alert" role="alert" aria-atomic="true"></div><div class="monaco-alert" role="alert" aria-atomic="true"></div><div class="monaco-status" aria-live="polite" aria-atomic="true"></div><div class="monaco-status" aria-live="polite" aria-atomic="true"></div></div></body></html>
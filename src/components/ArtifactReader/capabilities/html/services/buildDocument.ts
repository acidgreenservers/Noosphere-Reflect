// Assembles the iframe srcDoc document for HTML and JSX/TSX artifacts.
// Uses cdn.ts for sources and transform.ts for code preparation.

import { REACT_CDN, REACT_DOM_CDN, BABEL_CDN, TAILWIND_CDN } from './cdn';
import { transformModuleStatements, escapeScriptTags } from './transform';

/**
 * Build the iframe document for a JSX/TSX artifact.
 * Transforms module statements, escapes script tags, and wires up
 * Babel transpilation + auto-render of the detected default export.
 */
const buildJsxDocument = (userCode: string, isTsx: boolean): string => {
  const presets = isTsx ? ['typescript', 'react'] : ['react'];
  const { code: transformedCode, componentName } = transformModuleStatements(userCode);
  const escaped = escapeScriptTags(transformedCode);
  const renderTarget = componentName || 'App';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <script src="${REACT_CDN}"></script>
  <script src="${REACT_DOM_CDN}"></script>
  <script src="${BABEL_CDN}"></script>
  <script src="${TAILWIND_CDN}"></script>
  <style>
    *{box-sizing:border-box;}
    body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#fff;color:#1a1a1a;}
    #root{min-height:100vh;}
    #__error{padding:16px;color:#dc2626;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;margin:16px;font-family:'SF Mono',Monaco,'Courier New',monospace;font-size:13px;white-space:pre-wrap;word-break:break-word;}
    #__loading{display:flex;align-items:center;justify-content:center;min-height:100vh;color:#999;font-size:14px;}
  </style>
</head>
<body>
  <div id="root"><div id="__loading">Rendering...</div></div>
  <script>
    function showError(msg){
      var root=document.getElementById('root');
      root.innerHTML='<div id="__error">'+msg+'</div>';
    }
    window.onerror=function(msg,src,line,col,err){
      showError(err&&err.stack?err.stack:msg);
    };
    var renderTimeout=setTimeout(function(){
      var loading=document.getElementById('__loading');
      if(loading){
        showError('Rendering timed out. The JSX code may have an error that prevents Babel from transpiling. Check the Source tab to inspect the code.');
      }
    },10000);
  </script>
  <script>
    try{
      var userCode=${JSON.stringify(escaped)};
      var presets=${JSON.stringify(presets)};
      var transformed=Babel.transform(userCode,{presets:presets});
      var transpiledCode=transformed.code;

      // Append an expose-statement that runs INSIDE the new Function scope,
      // capturing the component from the local scope and putting it on window.
      // new Function() creates an isolated scope — function/const/let declarations
      // are local, NOT properties of window, even with fn.call(window).
      var exposeCode=';try{if(typeof ${renderTarget}!=="undefined"){window.__renderComponent=${renderTarget};}}catch(e){}';
      var fn=new Function(transpiledCode+exposeCode);
      fn.call(window);

      // Read the exposed component from window (set inside the function scope)
      var Component=window.__renderComponent;
      delete window.__renderComponent;
      if(typeof Component!=='undefined'){
        clearTimeout(renderTimeout);
        ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(Component));
      }else{
        clearTimeout(renderTimeout);
        var loading=document.getElementById('__loading');
        if(loading){
          showError('Could not find component "${renderTarget}". Define an App component or render manually with ReactDOM.createRoot().');
        }
      }
    }catch(e){
      clearTimeout(renderTimeout);
      showError(e.stack||e.message);
    }
  </script>
</body>
</html>`;
};

/**
 * Build the iframe srcDoc for any artifact handled by HtmlReader.
 * JSX/TSX → transpiled React document; HTML → injected as-is.
 */
export const buildDocument = (content: string, isJsx: boolean, isTsx: boolean): string => {
  if (isJsx) {
    return buildJsxDocument(content, isTsx);
  }
  return content;
};
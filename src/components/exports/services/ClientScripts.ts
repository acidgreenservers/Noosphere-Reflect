/**
 * ClientScripts.ts
 * 
 * Contains raw JavaScript strings that are injected directly into the exported HTML files.
 * Defining these scripts here as strings using standard concatenation avoids all the template 
 * literal escaping nightmares (\${} vs ${}) that cause bundler crashes when embedded deeply 
 * inside TypeScript HTML template strings.
 */

export const INTERACTIVE_SCRIPTS = `
    <script>
        // Initialize Lucide Icons
        document.addEventListener("DOMContentLoaded", () => {
            if (window.lucide) {
                lucide.createIcons();
            }
        });

        // Toggle User Prompt Bubble Expansion (Gemini)
        function toggleUserPrompt(index) {
            const container = document.getElementById('userPromptText_' + index);
            const chevron = document.getElementById('toggleChevron_' + index);

            if (!container || !chevron) return;

            if (container.classList.contains('max-h-[110px]')) {
                container.classList.remove('max-h-[110px]');
                container.classList.add('max-h-[2500px]');
                chevron.style.transform = 'rotate(180deg)';
            } else {
                container.classList.remove('max-h-[2500px]');
                container.classList.add('max-h-[110px]');
                chevron.style.transform = 'rotate(0deg)';
            }
        }

        // Toggle User Message Bubble Expansion (Claude)
        function toggleUserMessage(index) {
            const container = document.getElementById('userTextContainer_' + index);
            const btnText = document.getElementById('toggleUserText_' + index);
            const overlay = document.getElementById('gradientOverlay_' + index);

            if (!container) return;

            if (container.classList.contains('max-h-[140px]')) {
                container.classList.remove('max-h-[140px]');
                container.classList.add('max-h-[10000px]');
                if (overlay) overlay.classList.add('opacity-0');
                if (btnText) btnText.innerText = 'Show less';
            } else {
                container.classList.remove('max-h-[10000px]');
                container.classList.add('max-h-[140px]');
                if (overlay) overlay.classList.remove('opacity-0');
                if (btnText) btnText.innerText = 'Show more';
            }
        }

        // Toggle Thought Block Expansion
        function toggleThoughtBlock(idSuffix) {
            const container = document.getElementById('thoughtContent_' + idSuffix);
            const checkIcon = document.getElementById('thoughtCheck_' + idSuffix);
            const chevron = document.getElementById('thoughtChevron_' + idSuffix);
            
            if (!container) return;
            
            const isClosed = container.classList.contains('max-h-[0px]');
            
            if (isClosed) {
                container.classList.remove('max-h-[0px]', 'opacity-0', 'mb-0');
                container.classList.add('max-h-[10000px]', 'opacity-100', 'mb-4');
                if (checkIcon) checkIcon.classList.remove('hidden');
                if (chevron) {
                    chevron.classList.remove('rotate-0');
                    chevron.classList.add('rotate-90');
                }
            } else {
                container.classList.remove('max-h-[10000px]', 'opacity-100', 'mb-4');
                container.classList.add('max-h-[0px]', 'opacity-0', 'mb-0');
                if (checkIcon) checkIcon.classList.add('hidden');
                if (chevron) {
                    chevron.classList.remove('rotate-90');
                    chevron.classList.add('rotate-0');
                }
            }
        }

        // Generic copy feedback helper using concatenation instead of template literals
        function triggerCopyFeedback(iconContainerId, sizeClass, successColorClass, fallbackIconHtml = null) {
            const container = document.getElementById(iconContainerId);
            if (!container) return;
            
            const originalHtml = fallbackIconHtml !== null ? fallbackIconHtml : container.innerHTML;

            container.innerHTML = '<i data-lucide="check" class="' + sizeClass + ' ' + (successColorClass || '') + '"></i>';
            if (window.lucide) lucide.createIcons();

            setTimeout(() => {
                container.innerHTML = originalHtml;
                if (window.lucide) lucide.createIcons();
            }, 2000);
        }

        function copyPromptText(index, iconColorClass) {
            const container = document.getElementById('userTextContainer_' + index) || document.getElementById('userPromptText_' + index);
            if (!container) return;
            const promptContent = container.innerText;
            const tempTextArea = document.createElement('textarea');
            tempTextArea.value = promptContent;
            document.body.appendChild(tempTextArea);
            tempTextArea.select();
            document.execCommand('copy');
            document.body.removeChild(tempTextArea);

            triggerCopyFeedback('userCopyIcon_' + index, 'w-3.5 h-3.5', iconColorClass);
        }

        function copyMessageText(index, iconColorClass) {
            const container = document.getElementById('aiMessageBody_' + index);
            if (!container) return;
            const text = container.innerText;
            const tempTextArea = document.createElement('textarea');
            tempTextArea.value = text;
            document.body.appendChild(tempTextArea);
            tempTextArea.select();
            document.execCommand('copy');
            document.body.removeChild(tempTextArea);

            triggerCopyFeedback('msgCopyIcon_' + index, 'w-4 h-4', iconColorClass);
        }
        
        // Standardized name across all themes and MarkdownProcessor
        function copyToClipboard(btn) {
            // Find pre either as next sibling or within parent element
            let pre = btn.nextElementSibling;
            if (!pre) {
                const container = btn.parentElement;
                pre = container ? container.querySelector('pre') : null;
            }
            if (pre) {
                const text = pre.innerText;
                const tempTextArea = document.createElement('textarea');
                tempTextArea.value = text;
                document.body.appendChild(tempTextArea);
                tempTextArea.select();
                document.execCommand('copy');
                document.body.removeChild(tempTextArea);
                
                const originalText = btn.innerText;
                btn.innerText = 'Copied!';
                setTimeout(() => { btn.innerText = originalText; }, 2000);
            }
        }
        
        // Legacy support mapping
        function copyCodeBlock(btn) {
            copyToClipboard(btn);
        }

        function copyPublicLink(url) {
            const temp = document.createElement('textarea');
            temp.value = url;
            document.body.appendChild(temp);
            temp.select();
            document.execCommand('copy');
            document.body.removeChild(temp);

            triggerCopyFeedback('copyLinkIcon', 'w-4 h-4', 'text-green-400');
        }
    </script>
`;

export const PREVIEW_DOWNLOAD_SCRIPT = `
    <script>
        function downloadArtifact(e) {
          e.preventDefault();
          const link = e.currentTarget;
          const id = link.getAttribute('data-id');
          
          // Try to open in the parent's immersive reader first
          if (window.parent !== window) {
              window.parent.postMessage({ type: 'open_artifact', artifactId: id }, '*');
              return;
          }

          // Fallback to direct download if not in iframe or parent doesn't intercept
          const b64 = link.getAttribute('data-b64');
          const mime = link.getAttribute('data-mime');
          const filename = link.getAttribute('download');

          if (!b64) {
              // If there's a direct url instead of base64
              const a = document.createElement('a');
              a.style.display = 'none';
              a.href = link.href;
              a.download = filename;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              return;
          }

          try {
              const byteCharacters = atob(b64);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                  byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray], {type: mime});
              const url = URL.createObjectURL(blob);

              const a = document.createElement('a');
              a.style.display = 'none';
              a.href = url;
              a.download = filename;
              document.body.appendChild(a);
              a.click();

              setTimeout(() => {
                  document.body.removeChild(a);
                  window.URL.revokeObjectURL(url);
              }, 100);
          } catch (err) {
              console.error('Download failed', err);
              alert('Download failed: ' + err.message);
          }
        }
    </script>
`;

export const MATHJAX_SCRIPT = `
    <script>
      window.MathJax = {
        tex: { inlineMath: [['$', '$'], ['\\\\(', '\\\\)']] },
        svg: { fontCache: 'global' },
        startup: {
            typeset: false // Auto typeset is default
        }
      };
    </script>
    <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
`;

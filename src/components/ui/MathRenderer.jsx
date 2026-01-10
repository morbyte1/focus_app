import React, { useEffect, useRef } from 'react';

export const MathRenderer = ({ text, className = "" }) => {
  const ref = useRef(null);

  const MathRenderer = ({ text, className = "" }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (!text) return;
    if (!document.getElementById('katex-css')) document.head.appendChild(Object.assign(document.createElement('link'), { id: 'katex-css', rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css' }));
    if (!window.katex && !document.getElementById('katex-js')) {
      const script = document.createElement('script');
      script.id = 'katex-js'; script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
      script.onload = renderMath; document.head.appendChild(script);
    } else renderMath();
  }, [text]);
  
  const renderMath = () => {
    if (ref.current && window.katex && text) {
      try {
        ref.current.innerHTML = '';
        text.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g).forEach(part => {
          const span = document.createElement('span');
          const isBlock = part.startsWith('$$');
          if (isBlock || part.startsWith('$')) {
            try { window.katex.render(part.slice(isBlock ? 2 : 1, isBlock ? -2 : -1), span, { displayMode: isBlock, throwOnError: false }); } catch { span.innerText = part; }
          } else span.innerText = part;
          ref.current.appendChild(span);
        });
      } catch { ref.current.innerText = text; }
    }
  };
  return <div ref={ref} className={className}>{!window.katex && text}</div>;
};
  
  useEffect(() => {
    if (!text) return;
    if (!document.getElementById('katex-css')) document.head.appendChild(Object.assign(document.createElement('link'), { id: 'katex-css', rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css' }));
    if (!window.katex && !document.getElementById('katex-js')) {
      const script = document.createElement('script');
      script.id = 'katex-js'; script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
      script.onload = renderMath; document.head.appendChild(script);
    } else renderMath();
  }, [text]);

  const renderMath = () => {
      // ... (Lógica original do renderMath aqui)
      if (ref.current && window.katex && text) {
        try {
          ref.current.innerHTML = '';
          text.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g).forEach(part => {
            const span = document.createElement('span');
            const isBlock = part.startsWith('$$');
            if (isBlock || part.startsWith('$')) {
              try { window.katex.render(part.slice(isBlock ? 2 : 1, isBlock ? -2 : -1), span, { displayMode: isBlock, throwOnError: false }); } catch { span.innerText = part; }
            } else span.innerText = part;
            ref.current.appendChild(span);
          });
        } catch { ref.current.innerText = text; }
      }
  };

  return <div ref={ref} className={className}>{!window.katex && text}</div>;
};
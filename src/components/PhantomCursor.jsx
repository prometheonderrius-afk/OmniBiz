import React, { useImperativeHandle, forwardRef, useState, useEffect } from 'react';

const PhantomCursor = forwardRef((props, ref) => {
  const [position, setPosition] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const [isClicking, setIsClicking] = useState(false);
  const [ripple, setRipple] = useState(null);

  useImperativeHandle(ref, () => ({
    move: (x, y) => {
      setPosition({ x, y });
    },
    click: () => {
      setIsClicking(true);
      setRipple({ x: position.x, y: position.y, id: Date.now() });
      setTimeout(() => setIsClicking(false), 150);
      
      // Clear ripple after animation
      setTimeout(() => setRipple(null), 600);

      // Dispatch real click event to the element under the cursor
      const element = document.elementFromPoint(position.x, position.y);
      if (element) {
        // Find closest button or clickable element if the exact point is an SVG or inner span
        const clickable = element.closest('button, a, [role="button"]') || element;
        try {
          if (typeof clickable.click === 'function') {
            clickable.click();
          } else {
            // Fallback for SVG elements that might not have .click() in all browsers
            clickable.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
          }
        } catch (err) {
          console.warn("PhantomCursor failed to click:", err);
        }
      }
    },
    moveToElement: (selector) => {
      const el = document.querySelector(selector);
      if (el) {
        const rect = el.getBoundingClientRect();
        // Move to the center of the element
        setPosition({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        });
      } else {
        console.warn(`PhantomCursor: Element ${selector} not found`);
      }
    }
  }));

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 999999 }}>
      {/* Ripple Effect */}
      {ripple && (
        <div 
          key={ripple.id}
          style={{
            position: 'absolute',
            left: ripple.x - 20,
            top: ripple.y - 20,
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(236, 72, 153, 0.4)',
            border: '2px solid rgba(236, 72, 153, 0.8)',
            animation: 'ripple 0.6s linear',
            pointerEvents: 'none'
          }}
        />
      )}
      
      {/* Cursor Icon */}
      <div style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        transition: 'left 0.8s cubic-bezier(0.25, 1, 0.5, 1), top 0.8s cubic-bezier(0.25, 1, 0.5, 1)',
        transform: `scale(${isClicking ? 0.8 : 1})`,
        transformOrigin: 'top left'
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.5))' }}>
          <path d="M4 2L20 10L13 13L18 20L15 22L10 15L4 20V2Z" fill="white" stroke="black" strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
      </div>

      <style>{`
        @keyframes ripple {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
    </div>
  );
});

export default PhantomCursor;

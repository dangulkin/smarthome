import { useCallback, useEffect, useState } from "react";

export function usePreviewCursor() {
  const [previewCursor, setPreviewCursor] = useState({ x: 0, y: 0, visible: false });

  const onPreviewPointerMove = useCallback((event) => {
    if (event.pointerType !== "mouse") {
      return;
    }

    document.body.classList.add("preview-cursor-active");
    const rect = event.currentTarget.getBoundingClientRect();
    setPreviewCursor({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      visible: true
    });
  }, []);

  const onPreviewPointerLeave = useCallback(() => {
    document.body.classList.remove("preview-cursor-active");
    setPreviewCursor((current) => ({ ...current, visible: false }));
  }, []);

  useEffect(() => {
    return () => document.body.classList.remove("preview-cursor-active");
  }, []);

  return { previewCursor, onPreviewPointerMove, onPreviewPointerLeave };
}

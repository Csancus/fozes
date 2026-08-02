"use client";

import { useState } from "react";
import { RichTextEditor } from "@/components/ui/RichTextEditor";

// Rich-text jegyzet szerver-oldali <form>-ban: rejtett inputba szinkronizál.
export function TripNoteField({
  initial = "",
  placeholder,
}: {
  initial?: string;
  placeholder?: string;
}) {
  const [html, setHtml] = useState(initial);
  return (
    <div>
      <span className="block text-sm font-medium mb-2">Jegyzet</span>
      <input type="hidden" name="planNote" value={html} />
      <RichTextEditor
        value={html}
        onChange={setHtml}
        placeholder={placeholder ?? "Bármi, amit érdemes tudni az útról"}
        minHeight={140}
      />
    </div>
  );
}

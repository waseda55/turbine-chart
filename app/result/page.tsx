"use client";

import { Suspense } from "react";
import ResultPageInner from "./result-inner";

export default function ResultPage() {
  return (
    <Suspense fallback={<p>読み込み中…</p>}>
      <ResultPageInner />
    </Suspense>
  );
}

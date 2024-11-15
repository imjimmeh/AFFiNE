import { type PDF, PDFService, PDFStatus } from '@affine/core/modules/pdf';
import { LoadingSvg } from '@affine/core/modules/pdf/views';
import type { AttachmentBlockModel } from '@blocksuite/affine/blocks';
import { useLiveData, useService } from '@toeverything/infra';
import { useEffect, useState } from 'react';

import { PDFViewerInner } from './pdf-viewer-inner';

function PDFViewerStatus({ pdf, ...props }: PDFViewerProps & { pdf: PDF }) {
  const state = useLiveData(pdf.state$);

  if (state?.status !== PDFStatus.Opened) {
    return <LoadingSvg />;
  }

  return <PDFViewerInner {...props} pdf={pdf} state={state} />;
}

export interface PDFViewerProps {
  model: AttachmentBlockModel;
  name: string;
  ext: string;
  size: string;
}

export function PDFViewer({ model, ...props }: PDFViewerProps) {
  const pdfService = useService(PDFService);
  const [pdf, setPdf] = useState<PDF | null>(null);

  useEffect(() => {
    const { pdf, release } = pdfService.get(model);
    setPdf(pdf);

    return release;
  }, [model, pdfService, setPdf]);

  if (!pdf) {
    return <LoadingSvg />;
  }

  return <PDFViewerStatus {...props} model={model} pdf={pdf} />;
}

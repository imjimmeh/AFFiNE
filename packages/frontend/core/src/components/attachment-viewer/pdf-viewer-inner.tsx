import { IconButton, observeResize } from '@affine/component';
import type {
  PDF,
  PDFRendererState,
  PDFStatus,
} from '@affine/core/modules/pdf';
import {
  Item,
  List,
  ListPadding,
  ListWithSmallGap,
  PDFPageRenderer,
  type PDFVirtuosoContext,
  type PDFVirtuosoProps,
  Scroller,
  ScrollSeekPlaceholder,
} from '@affine/core/modules/pdf/views';
import { CollapseIcon, ExpandIcon } from '@blocksuite/icons/rc';
import clsx from 'clsx';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  type ScrollSeekConfiguration,
  Virtuoso,
  type VirtuosoHandle,
} from 'react-virtuoso';

import * as styles from './styles.css';
import { calculatePageNum } from './utils';

const THUMBNAIL_WIDTH = 94;

export interface PDFViewerInnerProps {
  pdf: PDF;
  state: Extract<PDFRendererState, { status: PDFStatus.Opened }>;
}

export const PDFViewerInner = ({ pdf, state }: PDFViewerInnerProps) => {
  const [cursor, setCursor] = useState(0);
  const [collapsed, setCollapsed] = useState(true);
  const [viewportInfo, setViewportInfo] = useState({ width: 0, height: 0 });

  const viewerRef = useRef<HTMLDivElement>(null);
  const pagesScrollerRef = useRef<HTMLElement | null>(null);
  const pagesScrollerHandleRef = useRef<VirtuosoHandle>(null);
  const thumbnailsScrollerHandleRef = useRef<VirtuosoHandle>(null);

  const updateScrollerRef = useCallback(
    (scroller: HTMLElement | Window | null) => {
      pagesScrollerRef.current = scroller as HTMLElement;
    },
    []
  );

  const onScroll = useCallback(() => {
    const el = pagesScrollerRef.current;
    if (!el) return;

    const { pageCount } = state.meta;
    if (!pageCount) return;

    const cursor = calculatePageNum(el, pageCount);

    setCursor(cursor);
  }, [pagesScrollerRef, state]);

  const onPageSelect = useCallback(
    (index: number) => {
      const scroller = pagesScrollerHandleRef.current;
      if (!scroller) return;

      scroller.scrollToIndex({
        index,
        align: 'center',
        behavior: 'smooth',
      });
    },
    [pagesScrollerHandleRef]
  );

  const pageContent = useCallback(
    (
      index: number,
      _: unknown,
      { width, height, onPageSelect, pageClassName }: PDFVirtuosoContext
    ) => {
      return (
        <PDFPageRenderer
          key={index}
          pdf={pdf}
          width={width}
          height={height}
          pageNum={index}
          onSelect={onPageSelect}
          className={pageClassName}
        />
      );
    },
    [pdf]
  );

  const thumbnailsConfig = useMemo(() => {
    const { height: vh } = viewportInfo;
    const { pageCount: t, height: h, width: w } = state.meta;
    const p = h / (w || 1);
    const pw = THUMBNAIL_WIDTH;
    const ph = Math.ceil(pw * p);
    const height = Math.min(vh - 60 - 24 - 24 - 2 - 8, t * ph + (t - 1) * 12);
    return {
      context: {
        width: pw,
        height: ph,
        onPageSelect,
        pageClassName: styles.pdfThumbnail,
      },
      style: { height },
    };
  }, [state, viewportInfo, onPageSelect]);

  const scrollSeekConfig = useMemo<ScrollSeekConfiguration>(() => {
    return {
      enter: velocity => Math.abs(velocity) > 1024,
      exit: velocity => Math.abs(velocity) < 10,
    };
  }, []);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    return observeResize(viewer, ({ contentRect: { width, height } }) =>
      setViewportInfo({ width, height })
    );
  }, []);

  return (
    <div
      ref={viewerRef}
      data-testid="pdf-viewer"
      className={clsx([styles.viewer, { gridding: true, scrollable: true }])}
    >
      <Virtuoso<PDFVirtuosoProps>
        key={pdf.id}
        ref={pagesScrollerHandleRef}
        scrollerRef={updateScrollerRef}
        onScroll={onScroll}
        className={styles.virtuoso}
        totalCount={state.meta.pageCount}
        itemContent={pageContent}
        components={{
          Item,
          List,
          Scroller,
          Header: ListPadding,
          Footer: ListPadding,
          ScrollSeekPlaceholder,
        }}
        context={{
          width: state.meta.width,
          height: state.meta.height,
          pageClassName: styles.pdfPage,
        }}
        scrollSeekConfiguration={scrollSeekConfig}
      />
      <div className={clsx(['thumbnails', styles.pdfThumbnails])}>
        <div className={clsx([styles.pdfThumbnailsList, { collapsed }])}>
          <Virtuoso<PDFVirtuosoProps>
            key={`${pdf.id}-thumbnail`}
            ref={thumbnailsScrollerHandleRef}
            className={styles.virtuoso}
            totalCount={state.meta.pageCount}
            itemContent={pageContent}
            components={{
              Item,
              List: ListWithSmallGap,
              Scroller,
              ScrollSeekPlaceholder,
            }}
            scrollSeekConfiguration={scrollSeekConfig}
            style={thumbnailsConfig.style}
            context={thumbnailsConfig.context}
          />
        </div>
        <div className={clsx(['indicator', styles.pdfIndicator])}>
          <div>
            <span className="page-cursor">
              {state.meta.pageCount > 0 ? cursor + 1 : 0}
            </span>
            /<span className="page-count">{state.meta.pageCount}</span>
          </div>
          <IconButton
            icon={collapsed ? <CollapseIcon /> : <ExpandIcon />}
            onClick={() => setCollapsed(!collapsed)}
          />
        </div>
      </div>
    </div>
  );
};

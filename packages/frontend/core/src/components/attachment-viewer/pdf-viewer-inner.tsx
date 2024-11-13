import { IconButton, observeResize } from '@affine/component';
import type {
  PDF,
  PDFRendererState,
  PDFStatus,
} from '@affine/core/modules/pdf';
import type { PageSize } from '@affine/core/modules/pdf/renderer/types';
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

  const fitToPage = useCallback(
    (viewportInfo: PageSize, actualSize: PageSize) => {
      const { width: vw, height: vh } = viewportInfo;
      const { width: w, height: h } = actualSize;
      let width = 0;
      let height = 0;
      if (h / w > vh / vw) {
        height = vh;
        width = (w / h) * height;
      } else {
        width = vw;
        height = (h / w) * width;
      }
      return {
        width: Math.ceil(width),
        height: Math.ceil(height),
        aspectRatio: width / height,
      };
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
      {
        viewportInfo,
        meta,
        onPageSelect,
        resize,
        pageClassName,
      }: PDFVirtuosoContext
    ) => {
      return (
        <PDFPageRenderer
          key={`${pageClassName}-${index}`}
          pdf={pdf}
          pageNum={index}
          className={pageClassName}
          viewportInfo={viewportInfo}
          actualSize={meta.pageSizes[index]}
          onSelect={onPageSelect}
          resize={resize}
        />
      );
    },
    [pdf]
  );

  const thumbnailsConfig = useMemo(() => {
    const { height: vh } = viewportInfo;
    const { pageCount: t, pageSizes } = state.meta;
    const height = Math.min(
      vh - 60 - 24 - 24 - 2 - 8,
      pageSizes.reduce((h, { height }) => h + height, 0) + (t - 1) * 12
    );
    return {
      context: {
        onPageSelect,
        viewportInfo: {
          width: THUMBNAIL_WIDTH,
          height,
        },
        meta: state.meta,
        resize: fitToPage,
        pageClassName: styles.pdfThumbnail,
      },
      style: { height },
    };
  }, [state, viewportInfo, onPageSelect, fitToPage]);

  // 1. works fine if they are the same size
  // 2. uses the `observeIntersection` when targeting different sizes
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
          viewportInfo: {
            width: viewportInfo.width - 40,
            height: viewportInfo.height - 40,
          },
          meta: state.meta,
          resize: fitToPage,
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
            style={thumbnailsConfig.style}
            context={thumbnailsConfig.context}
            scrollSeekConfiguration={scrollSeekConfig}
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

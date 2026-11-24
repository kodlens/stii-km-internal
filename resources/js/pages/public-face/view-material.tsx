import { Link } from '@inertiajs/react';
import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, Clock, Download, FileText, Filter, FolderOpen, HardDrive, Minus, Plus, Search, Tag } from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import pdfWorker from 'react-pdf/node_modules/pdfjs-dist/build/pdf.worker.min.mjs?url';

import PublicFaceLayout from '@/layouts/public-face-layout';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

type ViewerMaterial = {
  id: number;
  title: string;
  content: string;
  category: string;
  publish_date: string | null;
  document_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  updated_at: string | null;
};

type RelatedMaterial = {
  id: number;
  title: string;
  category: string;
  publish_date: string | null;
  view_url: string | null;
};

type ViewCategory = {
  id: number;
  category: string;
  slug: string;
  count: number;
};

type ViewMaterialProps = {
  search?: string;
  material: ViewerMaterial;
  categories: ViewCategory[];
  totalMaterials: number;
  materialCategorySlugs: string[];
  topics: string[];
  relatedMaterials: RelatedMaterial[];
};

function formatFileSize(bytes: number) {
  if (!bytes) return 'Unknown';

  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;

  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

function MetaItem({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={14} className="shrink-0 text-sky-200" />
      <span className="text-sky-100/70">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}

// function getContentPreview(content: string) {
//   const plainContent = content.replace(/\s+/g, ' ').trim();

//   if (!plainContent) {
//     return 'No summary is available for this material yet.';
//   }

//   return plainContent.length > 180 ? `${plainContent.slice(0, 180)}...` : plainContent;
// }

export default function ViewMaterial({
  search = '',
  material,
  categories,
  totalMaterials,
  materialCategorySlugs,
  topics,
  relatedMaterials,
}: ViewMaterialProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [scale, setScale] = useState(1);
  const [viewerWidth, setViewerWidth] = useState(760);
  const [pdfError, setPdfError] = useState('');

  useEffect(() => {
    const updateViewerWidth = () => {
      if (!viewerRef.current) return;

      setViewerWidth(Math.max(viewerRef.current.clientWidth - 32, 320));
    };

    updateViewerWidth();
    window.addEventListener('resize', updateViewerWidth);

    return () => window.removeEventListener('resize', updateViewerWidth);
  }, []);

  const handleDocumentLoad = ({ numPages }: { numPages: number }) => {
    setPageCount(numPages);
    setPageNumber(1);
    setPdfError('');
  };

  const handlePreviousPage = () => {
    setPageNumber((currentPage) => Math.max(currentPage - 1, 1));
  };

  const handleNextPage = () => {
    setPageNumber((currentPage) => Math.min(currentPage + 1, pageCount));
  };

  const handleZoomOut = () => {
    setScale((currentScale) => Math.max(Number((currentScale - 0.1).toFixed(1)), 0.7));
  };

  const handleZoomIn = () => {
    setScale((currentScale) => Math.min(Number((currentScale + 0.1).toFixed(1)), 1.6));
  };

  return (
    <PublicFaceLayout title={material.title} wide>
      <div className="flex flex-1 flex-col py-8">
        <section className="mb-6 flex flex-col justify-between gap-4 text-white lg:flex-row lg:items-end">
          <div className="max-w-4xl">
            <Link
              href={search ? `/result?search=${encodeURIComponent(search)}` : '/result'}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white hover:text-[#0D4E86] focus:ring-4 focus:ring-white/20 focus:outline-none"
            >
              <ArrowLeft size={16} />
              Back to results
            </Link>

            <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-semibold text-sky-100">
              {material.category.split(', ').map((category) => (
                <span
                  key={category}
                  className="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-white/10 px-2.5 py-1"
                >
                  <Tag size={13} />
                  {category}
                </span>
              ))}
              {material.publish_date && (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-white/10 px-2.5 py-1">
                  <CalendarDays size={14} />
                  {material.publish_date}
                </span>
              )}
            </div>

            <h1 className="mt-4 text-3xl leading-tight font-bold sm:text-4xl">{material.title}</h1>
            {/* <p className="mt-3 max-w-3xl text-sm leading-6 text-sky-100/85">{getContentPreview(material.content)}</p> */}

            <dl className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border border-white/15 bg-white/10 px-5 py-4 text-xs backdrop-blur">
              <MetaItem icon={Tag} label="Category" value={material.category} />
              <MetaItem icon={CalendarDays} label="Published" value={material.publish_date ?? '—'} />
              <MetaItem icon={FileText} label="Pages" value={pageCount ? String(pageCount) : '—'} />
              <MetaItem icon={HardDrive} label="Size" value={formatFileSize(material.file_size)} />
              <MetaItem icon={Clock} label="Updated" value={material.updated_at ?? '—'} />

              <div className="flex items-center gap-2">
                <a
                  href={`${material.document_url}?download=1`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/25 bg-white/10 px-3 py-1.5 font-semibold text-white transition hover:bg-white hover:text-[#0D4E86] focus:ring-4 focus:ring-white/20 focus:outline-none"
                >
                  <Download size={13} />
                  Download
                </a>
              </div>
            </dl>
          </div>
        </section>

        <section className="grid min-h-[760px] gap-4 rounded-xl bg-slate-50 p-4 text-slate-900 shadow-2xl shadow-slate-950/20 lg:h-[780px] lg:grid-cols-[280px_minmax(0,1fr)_320px]">
          <aside className="flex flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:min-h-0">
            <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0D4E86]/10 text-[#0D4E86]">
                <Filter size={18} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-950">Categories</h2>
                <p className="text-xs text-slate-500">Filter knowledge materials</p>
              </div>
            </div>

            <div className="mt-4 min-h-0 flex-1 space-y-5 overflow-y-auto lg:pr-1">
              <div className="flex flex-col gap-1">
                <Link
                  href={search ? `/result?search=${encodeURIComponent(search)}` : '/result'}
                  className="group flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                >
                  <span className="truncate">All Categories</span>
                  <span className="ml-2 shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 group-hover:bg-slate-200">
                    {totalMaterials}
                  </span>
                </Link>

                {categories.map((cat) => {
                  const isCurrentMaterialCategory = materialCategorySlugs.includes(cat.slug);
                  const href = search
                    ? `/result?search=${encodeURIComponent(search)}&category=${cat.slug}`
                    : `/result?category=${cat.slug}`;

                  return (
                    <Link
                      key={cat.slug}
                      href={href}
                      className={`group flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition ${
                        isCurrentMaterialCategory
                          ? 'bg-[#0D4E86]/10 font-semibold text-[#0D4E86] hover:bg-[#0D4E86] hover:text-white'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                      }`}
                    >
                      <span className="truncate text-left">{cat.category}</span>
                      <span
                        className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          isCurrentMaterialCategory
                            ? 'bg-[#0D4E86]/20 text-[#0D4E86] group-hover:bg-white/20 group-hover:text-white'
                            : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                        }`}
                      >
                        {cat.count}
                      </span>
                    </Link>
                  );
                })}
              </div>

              {topics.length > 0 && (
                <div className="border-t border-slate-100 pt-4">
                  <h3 className="text-xs font-bold tracking-wide text-slate-500 uppercase">Topics</h3>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {topics.map((topic) => (
                      <span
                        key={topic}
                        className="inline-flex items-center gap-1 rounded-md bg-[#0D4E86]/10 px-2.5 py-1 text-xs font-semibold text-[#0D4E86]"
                      >
                        <Tag size={12} />
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-slate-100 pt-4">
                <h3 className="text-xs font-bold tracking-wide text-slate-500 uppercase">File Details</h3>
                <dl className="mt-2.5 space-y-2 rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-500">Name</dt>
                    <dd className="max-w-[140px] truncate font-semibold text-slate-800" title={material.file_name}>
                      {material.file_name}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-500">Type</dt>
                    <dd className="font-semibold text-slate-800">{material.file_type || '—'}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-500">Size</dt>
                    <dd className="font-semibold text-slate-800">{formatFileSize(material.file_size)}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-500">Pages</dt>
                    <dd className="font-semibold text-slate-800">{pageCount || '—'}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-500">Updated</dt>
                    <dd className="font-semibold text-slate-800">{material.updated_at ?? '—'}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </aside>

          <div className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex shrink-0 min-h-14 flex-col gap-3 border-b border-slate-200 px-4 py-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex min-w-0 items-center gap-2">
                <FileText size={18} className="shrink-0 text-[#0D4E86]" />
                <p className="truncate text-sm font-bold text-slate-950">{material.title}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handlePreviousPage}
                  disabled={pageNumber <= 1}
                  className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:border-[#0D4E86] hover:text-[#0D4E86] focus:ring-4 focus:ring-[#0D4E86]/15 focus:outline-none disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <ChevronLeft size={14} />
                  Prev
                </button>
                <span className="inline-flex h-9 items-center rounded-lg bg-slate-100 px-3 text-xs font-semibold text-slate-600">
                  Page {pageNumber} of {pageCount || '-'}
                </span>
                <button
                  type="button"
                  onClick={handleNextPage}
                  disabled={pageCount === 0 || pageNumber >= pageCount}
                  className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:border-[#0D4E86] hover:text-[#0D4E86] focus:ring-4 focus:ring-[#0D4E86]/15 focus:outline-none disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Next
                  <ChevronRight size={14} />
                </button>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:border-[#0D4E86] hover:text-[#0D4E86] focus:ring-4 focus:ring-[#0D4E86]/15 focus:outline-none"
                  aria-label="Zoom out"
                >
                  <Minus size={15} />
                </button>
                <span className="inline-flex h-9 min-w-14 items-center justify-center rounded-lg bg-slate-100 px-2 text-xs font-semibold text-slate-600">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:border-[#0D4E86] hover:text-[#0D4E86] focus:ring-4 focus:ring-[#0D4E86]/15 focus:outline-none"
                  aria-label="Zoom in"
                >
                  <Plus size={15} />
                </button>
                <a
                  href={material.document_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:border-[#0D4E86] hover:text-[#0D4E86] focus:ring-4 focus:ring-[#0D4E86]/15 focus:outline-none"
                >
                  Open PDF
                </a>
              </div>
            </div>

            <div ref={viewerRef} className="flex min-h-[700px] flex-1 justify-center overflow-auto bg-slate-100 p-4 lg:min-h-0">
              {pdfError ? (
                <div className="m-auto max-w-md rounded-lg border border-dashed border-slate-300 bg-white px-6 py-8 text-center">
                  <FileText size={28} className="mx-auto text-[#0D4E86]" />
                  <p className="mt-3 text-sm font-bold text-slate-950">PDF preview is unavailable</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{pdfError}</p>
                </div>
              ) : (
                <Document
                  file={material.document_url}
                  onLoadSuccess={handleDocumentLoad}
                  onLoadError={() => setPdfError('The PDF could not be rendered here. You can still use Open PDF as a fallback.')}
                  loading={
                    <div className="m-auto rounded-lg border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-600 shadow-sm">
                      Loading PDF preview...
                    </div>
                  }
                >
                  <Page
                    pageNumber={pageNumber}
                    width={Math.min(viewerWidth, 1100) * scale}
                    renderAnnotationLayer
                    renderTextLayer
                    className="overflow-hidden rounded-md shadow-xl shadow-slate-950/20"
                  />
                </Document>
              )}
            </div>
          </div>

          <aside className="flex flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:min-h-0">
            <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0D4E86]/10 text-[#0D4E86]">
                <FolderOpen size={18} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-950">Related Materials</h2>
                <p className="text-xs text-slate-500">Based on the current material</p>
              </div>
            </div>

            <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto lg:pr-1">
              {relatedMaterials.length > 0 ? (
                relatedMaterials.map((item) => {
                  const relatedHref = item.view_url
                    ? search && !item.view_url.includes('search=')
                      ? `${item.view_url}${item.view_url.includes('?') ? '&' : '?'}search=${encodeURIComponent(search)}`
                      : item.view_url
                    : '#';

                  return (
                    <a
                      key={item.id}
                      href={relatedHref}
                      className="block rounded-lg border border-slate-200 p-3 transition hover:border-[#0D4E86]/40 hover:bg-[#0D4E86]/5 focus:ring-4 focus:ring-[#0D4E86]/15 focus:outline-none"
                    >
                      <p className="line-clamp-2 text-sm leading-5 font-bold text-slate-950">{item.title}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1">
                          <Tag size={12} />
                          {item.category}
                        </span>
                        {item.publish_date && <span>{item.publish_date}</span>}
                      </div>
                    </a>
                  );
                })
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center">
                  <Search size={24} className="mx-auto text-[#0D4E86]" />
                  <p className="mt-3 text-sm font-semibold text-slate-800">No related materials yet</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    More recommendations will appear when matching materials are available.
                  </p>
                </div>
              )}
            </div>
          </aside>
        </section>
      </div>
    </PublicFaceLayout>
  );
}

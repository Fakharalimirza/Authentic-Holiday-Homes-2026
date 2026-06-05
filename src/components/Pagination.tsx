import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const startIndex = itemsPerPage ? (currentPage - 1) * itemsPerPage : 0;
  const endIndex = itemsPerPage && totalItems ? Math.min(startIndex + itemsPerPage, totalItems) : 0;

  // Generate range of visible pages (showing up to 5 surrounding pages)
  const getVisiblePages = () => {
    const range = [];
    const maxVisible = 5;
    
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    // Adjust start if we're near the end
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    return range;
  };

  const visiblePages = getVisiblePages();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-150 dark:border-zinc-850 w-full mt-4">
      {/* Information text */}
      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
        {totalItems && itemsPerPage ? (
          <div>
            Showing <strong className="font-extrabold text-zinc-900 dark:text-white font-mono">{startIndex + 1}</strong> to{' '}
            <strong className="font-extrabold text-zinc-900 dark:text-white font-mono">{endIndex}</strong> of{' '}
            <strong className="font-extrabold text-zinc-900 dark:text-white font-mono">{totalItems}</strong> items
          </div>
        ) : (
          <div>
            Page <strong className="font-extrabold text-zinc-900 dark:text-white font-mono">{currentPage}</strong> of{' '}
            <strong className="font-extrabold text-zinc-900 dark:text-white font-mono">{totalPages}</strong>
          </div>
        )}
      </div>

      {/* Button Controls */}
      <div className="flex items-center gap-1.5 self-center sm:self-auto">
        {/* First Page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          title="First Page"
          className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition-all duration-150 cursor-pointer border border-zinc-200/60 dark:border-zinc-800/80 disabled:cursor-not-allowed"
        >
          <ChevronsLeft size={14} className="stroke-[2.5]" />
        </button>

        {/* Previous Page */}
        <button
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          title="Previous Page"
          className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition-all duration-150 cursor-pointer border border-zinc-200/60 dark:border-zinc-800/80 disabled:cursor-not-allowed flex items-center gap-1 text-[11px] font-bold"
        >
          <ChevronLeft size={14} className="stroke-[2.5]" />
          <span className="hidden md:inline uppercase tracking-wider text-[10px] pr-1">Prev</span>
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1 mx-1.5">
          {visiblePages[0] > 1 && (
            <>
              <button
                onClick={() => onPageChange(1)}
                className={`w-8 h-8 rounded-lg text-xs font-black tracking-tight transition-all duration-150 cursor-pointer flex items-center justify-center border border-zinc-250/20 dark:border-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800`}
              >
                1
              </button>
              {visiblePages[0] > 2 && <span className="text-zinc-400 font-mono text-[10px] px-0.5">...</span>}
            </>
          )}

          {visiblePages.map((page) => {
            const isCurrent = page === currentPage;
            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`w-8 h-8 rounded-lg text-xs font-black tracking-tight transition-all duration-150 cursor-pointer flex items-center justify-center ${
                  isCurrent
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-md shadow-zinc-900/10 dark:shadow-white/5 border border-zinc-900 dark:border-white scale-105'
                    : 'bg-white hover:bg-zinc-100 text-zinc-700 hover:text-zinc-950 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800/80 dark:hover:text-white'
                }`}
              >
                {page}
              </button>
            );
          })}

          {visiblePages[visiblePages.length - 1] < totalPages && (
            <>
              {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                <span className="text-zinc-400 font-mono text-[10px] px-0.5">...</span>
              )}
              <button
                onClick={() => onPageChange(totalPages)}
                className={`w-8 h-8 rounded-lg text-xs font-black tracking-tight transition-all duration-150 cursor-pointer flex items-center justify-center border border-zinc-250/20 dark:border-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800`}
              >
                {totalPages}
              </button>
            </>
          )}
        </div>

        {/* Next Page */}
        <button
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          title="Next Page"
          className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition-all duration-150 cursor-pointer border border-zinc-200/60 dark:border-zinc-800/80 disabled:cursor-not-allowed flex items-center gap-1 text-[11px] font-bold"
        >
          <span className="hidden md:inline uppercase tracking-wider text-[10px] pl-1">Next</span>
          <ChevronRight size={14} className="stroke-[2.5]" />
        </button>

        {/* Last Page */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          title="Last Page"
          className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition-all duration-150 cursor-pointer border border-zinc-200/60 dark:border-zinc-800/80 disabled:cursor-not-allowed"
        >
          <ChevronsRight size={14} className="stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
}

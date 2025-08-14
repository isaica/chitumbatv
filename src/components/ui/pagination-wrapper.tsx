import { useState, useMemo } from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface PaginationWrapperProps<T> {
  data: T[];
  itemsPerPage?: number;
  children: (paginatedData: T[], pagination: PaginationInfo) => React.ReactNode;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
}

export function PaginationWrapper<T>({ 
  data, 
  itemsPerPage = 10, 
  children 
}: PaginationWrapperProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);

  const paginationInfo = useMemo(() => {
    const totalPages = Math.ceil(data.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, data.length);

    return {
      currentPage,
      totalPages,
      totalItems: data.length,
      startIndex,
      endIndex,
    };
  }, [data.length, itemsPerPage, currentPage]);

  const paginatedData = useMemo(() => {
    return data.slice(paginationInfo.startIndex, paginationInfo.endIndex);
  }, [data, paginationInfo.startIndex, paginationInfo.endIndex]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const generatePageNumbers = () => {
    const { currentPage, totalPages } = paginationInfo;
    const pages = [];
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  // Reset to page 1 when data changes
  useMemo(() => {
    setCurrentPage(1);
  }, [data.length]);

  return (
    <div className="space-y-4">
      {children(paginatedData, paginationInfo)}
      
      {paginationInfo.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Mostrando {paginationInfo.startIndex + 1} a {paginationInfo.endIndex} de {paginationInfo.totalItems} resultados
          </div>
          
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {generatePageNumbers().map((page, index) => (
                <PaginationItem key={index}>
                  {page === 'ellipsis' ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      onClick={() => handlePageChange(page as number)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => handlePageChange(Math.min(paginationInfo.totalPages, currentPage + 1))}
                  className={currentPage === paginationInfo.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
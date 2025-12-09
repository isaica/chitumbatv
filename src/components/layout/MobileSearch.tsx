import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { GlobalSearch } from './GlobalSearch';

export function MobileSearch() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setIsOpen(true)}
        className="md:hidden"
      >
        <Search className="w-4 h-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md p-0 gap-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Buscar no sistema</DialogTitle>
            <DialogDescription>
              Pesquise por clientes, filiais, mensalidades e usuários
            </DialogDescription>
          </DialogHeader>
          <div className="p-4">
            <GlobalSearch />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

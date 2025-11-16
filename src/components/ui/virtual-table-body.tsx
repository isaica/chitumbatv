import { useState, useEffect } from 'react';
import { TableBody } from '@/components/ui/table';

type Props<T> = {
  items: T[];
  height: number;
  rowHeight: number;
  renderRow: (item: T, index: number) => JSX.Element;
  containerRef: React.RefObject<HTMLDivElement>;
};

export function VirtualTableBody<T>({ items, height, rowHeight, renderRow, containerRef }: Props<T>) {
  const [range, setRange] = useState({ start: 0, end: Math.ceil(height / rowHeight) + 5 });

  const total = items.length;
  const paddingTop = range.start * rowHeight;
  const visibleItems = items.slice(range.start, Math.min(range.end, total));
  const paddingBottom = Math.max(0, (total - (range.end)) * rowHeight);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const scrollTop = el.scrollTop;
      const start = Math.max(0, Math.floor(scrollTop / rowHeight) - 2);
      const end = Math.min(total, start + Math.ceil(height / rowHeight) + 5);
      setRange({ start, end });
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [height, rowHeight, total]);

  return (
    <TableBody>
      {paddingTop > 0 && (
        <tr style={{ height: paddingTop }}>
          <td colSpan={100} />
        </tr>
      )}
      {visibleItems.map((item, i) => renderRow(item, range.start + i))}
      {paddingBottom > 0 && (
        <tr style={{ height: paddingBottom }}>
          <td colSpan={100} />
        </tr>
      )}
    </TableBody>
  );
}
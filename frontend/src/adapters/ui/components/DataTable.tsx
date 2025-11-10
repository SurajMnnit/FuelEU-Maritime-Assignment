import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
}

export function DataTable<T extends { [key: string]: any }>({ 
  data, 
  columns, 
  onRowClick 
}: DataTableProps<T>) {
  const getCellValue = (row: T, column: Column<T>) => {
    if (typeof column.accessor === 'function') {
      return column.accessor(row);
    }
    return row[column.accessor];
  };

  return (
    <div className="rounded-md border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            {columns.map((column, index) => (
              <TableHead key={index} className={column.className}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center text-muted-foreground py-8">
                No data available
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, rowIndex) => {
              const isBaseline = (row as any).isBaseline;
              return (
              <TableRow
                key={rowIndex}
                onClick={(e) => {
                  // Don't trigger row click if clicking on a button or interactive element
                  const target = e.target as HTMLElement;
                  if (target.closest('button') || target.closest('a') || target.closest('[role="button"]')) {
                    return;
                  }
                  onRowClick?.(row);
                }}
                className={`${onRowClick ? "cursor-pointer hover:bg-muted/30" : ""} ${
                  isBaseline ? "bg-yellow-50 dark:bg-yellow-950/20 border-l-4 border-l-yellow-500" : ""
                }`}
              >
                {columns.map((column, colIndex) => (
                  <TableCell key={colIndex} className={column.className}>
                    {getCellValue(row, column)}
                  </TableCell>
                ))}
              </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

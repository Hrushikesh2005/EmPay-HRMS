import { cn } from "../../utils/cn";

export function DataTable({
  columns,
  data,
  keyField = "id",
  emptyMessage = "No records found.",
  className,
}) {
  return (
    <div className={cn("overflow-x-auto w-full", className)}>
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
          <tr>
            {columns.map((col, index) => (
              <th key={index} className={cn("px-6 py-4", col.headerClassName)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {data.length > 0 ? (
            data.map((row) => (
              <tr
                key={row[keyField]}
                className="hover:bg-slate-50 transition-colors"
              >
                {columns.map((col, colIndex) => (
                  <td
                    key={colIndex}
                    className={cn("px-6 py-4", col.cellClassName)}
                  >
                    {col.render ? col.render(row) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))
          ) : emptyMessage ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-12 text-center text-slate-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

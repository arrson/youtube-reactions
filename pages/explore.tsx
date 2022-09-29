import { getReactions } from "../hooks/api";
import React, { FC } from "react";
import Image from "next/future/image";

import { formatRelative } from "date-fns";
import {
  Bars2Icon,
  ArrowSmallDownIcon,
  ArrowSmallUpIcon,
} from "@heroicons/react/24/solid";
import {
  Column,
  ColumnDef,
  ColumnOrderState,
  flexRender,
  getCoreRowModel,
  Header,
  Table,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";

import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Reaction, Video } from "../hooks/api";

const VideoCell = (video: Video) => (
  <span className="video">
    <div className="videoImage">
      <Image src={video.thumbnail} alt="" width={60} height={34} />
    </div>
    <span className="videoTitle">{video.title}</span>
  </span>
);

const defaultColumns: ColumnDef<Reaction>[] = [
  {
    id: "video",
    accessorFn: (row) => row.reactionTo.title,
    header: "Video",
    cell: (props) => <VideoCell {...props.row.original.reactionTo} />,
  },
  {
    id: "reaction",
    accessorFn: (row) => row.reactionTo.title,
    header: "Reaction",
    cell: (props) => <VideoCell {...props.row.original.reaction} />,
  },
  {
    id: "reportCount",
    accessorKey: "reportCount",
    header: "Reports",
  },
  {
    id: "createdAt",
    accessorKey: "createdAt",
    header: "Created At",
    cell: (props) => (
      <span>
        {formatRelative(new Date(props.getValue() as string), new Date())}
      </span>
    ),
  },
];

const reorderColumn = (
  draggedColumnId: string,
  targetColumnId: string,
  columnOrder: string[]
): ColumnOrderState => {
  columnOrder.splice(
    columnOrder.indexOf(targetColumnId),
    0,
    columnOrder.splice(columnOrder.indexOf(draggedColumnId), 1)[0] as string
  );
  return [...columnOrder];
};

const DraggableColumnHeader: FC<{
  header: Header<Reaction, unknown>;
  table: Table<Reaction>;
  children: React.ReactNode;
}> = ({ header, table, children }) => {
  const { getState, setColumnOrder } = table;
  const { columnOrder } = getState();
  const { column } = header;

  const [, dropRef] = useDrop({
    accept: "column",
    drop: (draggedColumn: Column<Reaction>) => {
      const newColumnOrder = reorderColumn(
        draggedColumn.id,
        column.id,
        columnOrder
      );
      setColumnOrder(newColumnOrder);
    },
  });

  const [{ isDragging }, dragRef, previewRef] = useDrag({
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    item: () => column,
    type: "column",
  });

  return (
    <th
      ref={dropRef}
      colSpan={header.colSpan}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className="px-6 py-3 text-xs font-medium leading-4 tracking-wider text-left text-gray-500 uppercase bg-gray-50"
    >
      <div ref={previewRef} className="flex">
        <button ref={dragRef}>
          <Bars2Icon
            preserveAspectRatio="none"
            className="w-3 h-4 mr-2 text-gray-500"
          />
        </button>
        {children}
      </div>
    </th>
  );
};

const Table = ({
  data,
  columns,
}: {
  data: Reaction[];
  columns: ColumnDef<Reaction>[];
}) => {
  const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>(
    columns.map((column) => column.id as string)
  );
  const [sorting, setSorting] = React.useState<SortingState>([
    { desc: true, id: "createdAt" },
  ]);

  const table = useReactTable<Reaction>({
    data,
    columns,
    state: { sorting, columnOrder },
    onColumnOrderChange: setColumnOrder,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <DraggableColumnHeader
                key={header.id}
                header={header}
                table={table}
              >
                <div
                  {...{
                    className: header.column.getCanSort()
                      ? "cursor-pointer select-none flex flex-1 items-center justify-between"
                      : "",
                    onClick: header.column.getToggleSortingHandler(),
                  }}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                  {{
                    asc: <ArrowSmallUpIcon className="w-4 h-4 text-gray-500" />,
                    desc: (
                      <ArrowSmallDownIcon className="w-4 h-4 text-gray-500" />
                    ),
                  }[header.column.getIsSorted() as string] ?? null}
                </div>
              </DraggableColumnHeader>
            ))}
          </tr>
        ))}
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <td
                key={cell.id}
                className="px-6 py-4 text-sm font-medium leading-5 text-gray-900 whitespace-no-wrap"
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// todo: row actions depending on user permissions
// edit, report, delete
// {
//   id: "action",
//   header: "",
//   accessorKey: "action",
//   fixed: true,
//   cell: (props: any) => (
//     <span>
//       <button onClick={(e) => console.log(props.row.original)}>Edit</button>
//     </span>
//   ),
// },

const Wrapper = () => {
  const [columns] = React.useState(() => [...defaultColumns]);

  const { isLoading, error, data, isFetching } = useQuery(
    ["reactions"],
    getReactions
  );

  if (isLoading) return null;
  // if (error) return "An error has occurred: " + error.message;

  return (
    <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
      <DndProvider backend={HTML5Backend}>
        <Table data={data} columns={columns} />
      </DndProvider>
    </div>
  );
};

export default Wrapper;

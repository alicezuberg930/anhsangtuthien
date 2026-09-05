import { useEffect, useState, type CSSProperties } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  type Row,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { GripVertical } from 'lucide-react'
import { type Banner } from '@/@types/banner'
import {
  DataTablePagination,
  DataTableToolbar,
} from '@/components/data-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { useReorderBannersHook } from '@/hooks/banner.hook'
import { useTableUrlState, type NavigateFn } from '@/hooks/use-table-url-state'
import { bannersColumns as columns } from './banners-columns'

type BannersTableProps = {
  data: Banner[]
  search: Record<string, unknown>
  navigate: NavigateFn
}

const activeOptions = [
  { label: 'Đang bật', value: 'true' },
  { label: 'Đang tắt', value: 'false' },
]

type SortableBannerRowProps = {
  row: Row<Banner>
  disabled: boolean
}

const SortableBannerRow = ({ row, disabled }: SortableBannerRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.original._id, disabled })
  const style: CSSProperties = {
    transform: transform
      ? CSS.Transform.toString({ ...transform, x: 0 })
      : undefined,
    transition,
    opacity: isDragging ? 0.8 : 1,
    position: 'relative',
    zIndex: isDragging ? 1 : 0,
  }

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      data-state={row.getIsSelected() ? 'selected' : undefined}
    >
      <TableCell className='w-10'>
        <Button
          type='button'
          variant='ghost'
          size='icon-sm'
          className='cursor-grab touch-none text-muted-foreground active:cursor-grabbing'
          disabled={disabled}
          aria-label='Kéo để thay đổi thứ tự'
          title='Kéo để thay đổi thứ tự'
          {...attributes}
          {...listeners}
        >
          <GripVertical />
        </Button>
      </TableCell>
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}

export const BannersTable = ({ data, search, navigate }: BannersTableProps) => {
  const [orderedData, setOrderedData] = useState(data)
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const reorderBanners = useReorderBannersHook()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const {
    columnFilters,
    onColumnFiltersChange,
    pagination,
    onPaginationChange,
    ensurePageInRange,
  } = useTableUrlState({
    search,
    navigate,
    pagination: { defaultPage: 1, defaultPageSize: 10 },
    globalFilter: { enabled: false },
    columnFilters: [
      { columnId: 'order', searchKey: 'order', type: 'string' },
      { columnId: 'isActive', searchKey: 'isActive', type: 'array' },
    ],
  })

  const table = useReactTable({
    data: orderedData,
    columns,
    getRowId: (row) => row._id,
    state: {
      pagination,
      rowSelection,
      columnFilters,
      columnVisibility,
    },
    enableSorting: false,
    enableRowSelection: true,
    onPaginationChange,
    onColumnFiltersChange,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    getPaginationRowModel: getPaginationRowModel(),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  useEffect(() => {
    ensurePageInRange(table.getPageCount())
  }, [table, ensurePageInRange])

  useEffect(() => {
    setOrderedData(data)
  }, [data])

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id || reorderBanners.isPending) return

    const oldIndex = orderedData.findIndex((banner) => banner._id === active.id)
    const newIndex = orderedData.findIndex((banner) => banner._id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const previousData = orderedData
    const nextData = arrayMove(orderedData, oldIndex, newIndex).map(
      (banner, index) => ({ ...banner, order: index + 1 })
    )
    setOrderedData(nextData)

    try {
      await reorderBanners.mutateAsync({
        ids: nextData.map((banner) => banner._id),
      })
    } catch {
      setOrderedData(previousData)
    }
  }

  const rows = table.getRowModel().rows

  return (
    <div className='flex flex-1 flex-col gap-4'>
      <DataTableToolbar
        table={table}
        searchPlaceholder='Tìm theo thứ tự...'
        searchKey='order'
        filters={[
          {
            columnId: 'isActive',
            title: 'Trạng thái',
            options: activeOptions,
          },
        ]}
      />
      <div className='table-scroll overflow-hidden rounded-md border'>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  <TableHead className='w-10' />
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {rows.length ? (
                <SortableContext
                  items={rows.map((row) => row.original._id)}
                  strategy={verticalListSortingStrategy}
                >
                  {rows.map((row) => (
                    <SortableBannerRow
                      key={row.id}
                      row={row}
                      disabled={reorderBanners.isPending}
                    />
                  ))}
                </SortableContext>
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 1}
                    className='h-24 text-center'
                  >
                    Không có banner.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DndContext>
      </div>
      <DataTablePagination table={table} className='mt-auto' />
    </div>
  )
}

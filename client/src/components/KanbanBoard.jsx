import {
  closestCorners,
  DndContext,
  DragOverlay,
  MeasuringStrategy,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  defaultAnimateLayoutChanges,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, Plus } from "lucide-react";
import { useEffect, useState } from "react"; // Added useEffect, useMemo
import TicketCard from "./TicketCard";

// Styled for Premium Dark Theme
const STATUS_COLUMNS = [
  {
    key: "todo",
    title: "To Do",
    indicatorColor: "bg-slate-500",
    glowClass: "shadow-none",
  },
  {
    key: "in-progress",
    title: "In Progress",
    indicatorColor: "bg-primary",
    glowClass: "shadow-[0_0_15px_rgba(99,102,241,0.15)]",
  },
  {
    key: "in-review",
    title: "In Review",
    indicatorColor: "bg-amber-400",
    glowClass: "shadow-[0_0_15px_rgba(251,191,36,0.15)]",
  },
  {
    key: "done",
    title: "Done",
    indicatorColor: "bg-accent-mint",
    glowClass: "shadow-[0_0_15px_rgba(52,211,153,0.15)]",
  },
];

// 1. Sortable Item Component
function SortableTicketItem({ ticket, onDelete, onEdit, onOpenDetails }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: ticket._id,
    data: { ...ticket }, // Pass ticket data to context
    animateLayoutChanges: (args) =>
      defaultAnimateLayoutChanges({ ...args, wasDragging: true }),
  });

  const style = {
    transform: CSS.Translate.toString(transform), // Use Translate for performance
    transition,
    opacity: isDragging ? 0 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="touch-none mb-3"
    >
      <TicketCard
        ticket={ticket}
        onDelete={() => onDelete(ticket._id)}
        onEdit={() => onEdit?.(ticket)}
        onOpenDetails={() => onOpenDetails?.(ticket)}
      />
    </div>
  );
}

// 2. Droppable Column Wrapper
function DroppableColumn({ columnKey, children, isOver }) {
  const { setNodeRef } = useDroppable({
    id: `column-${columnKey}`,
    data: { status: columnKey },
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 space-y-3 overflow-y-auto pr-2 min-h-[150px] rounded-xl transition-all duration-200 custom-scrollbar ${
        isOver
          ? "bg-navy-700/50 ring-2 ring-primary/20 shadow-inner"
          : "bg-transparent"
      }`}
    >
      {children}
    </div>
  );
}

// 3. Main Board Component
export default function KanbanBoard({
  tickets,
  onStatusChange,
  onDelete,
  onEdit,
  onOpenDetails,
  onAddTicket,
}) {
  // console.log("KanbanBoard tickets:", tickets);
  // Local state for Optimistic Updates
  const [localTickets, setLocalTickets] = useState(tickets);
  const [collapsed, setCollapsed] = useState({});
  const [activeId, setActiveId] = useState(null);
  const [overColumnKey, setOverColumnKey] = useState(null);

  // Sync local state when props change (server update)
  useEffect(() => {
    setLocalTickets(tickets);
  }, [tickets]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  // Optimistic Drag Over: Move item visually between columns WHILE dragging
  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) {
      setOverColumnKey(null);
      return;
    }

    const activeId = active.id;
    const overId = over.id;

    // Find the containers
    const activeTicket = localTickets.find((t) => t._id === activeId);
    if (!activeTicket) return;

    const activeColumn = activeTicket.status;
    let overColumn = null;

    // Determine target column
    if (String(overId).startsWith("column-")) {
      overColumn = String(overId).replace("column-", "");
      setOverColumnKey(overColumn);
    } else {
      // We are hovering over another ticket
      const overTicket = localTickets.find((t) => t._id === overId);
      if (overTicket) {
        overColumn = overTicket.status;
        setOverColumnKey(overColumn);
      }
    }

    if (!overColumn || activeColumn === overColumn) return;

    // OPTIMISTIC UPDATE: Move item to new column immediately in local state
    setLocalTickets((items) => {
      const newItems = [...items];
      const activeIndex = newItems.findIndex((t) => t._id === activeId);
      // Update status locally
      newItems[activeIndex] = { ...newItems[activeIndex], status: overColumn };
      return newItems;
    });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    setOverColumnKey(null);

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // 1. Determine New Status
    let newStatus = null;
    if (overId.startsWith("column-")) {
      newStatus = overId.replace("column-", "");
    } else {
      // If dropped over a ticket, get that ticket's status
      const overTicket = localTickets.find((t) => t._id === overId);
      if (overTicket) newStatus = overTicket.status;
    }

    if (newStatus) {
      // --- THE FIX IS HERE ---
      // Look at the PROPS (Server Data), not local state, to see if it actually changed
      const originalTicket = tickets.find((t) => t._id === activeId);

      // Only call API if the status is actually different from what the server knows
      if (originalTicket && originalTicket.status !== newStatus) {
        console.log(
          `Moving ${originalTicket.title} from ${originalTicket.status} to ${newStatus}`,
        );
        onStatusChange(activeId, newStatus);
      }

      // Always ensure Local State is synchronized (snaps the card into final position)
      setLocalTickets((items) => {
        const newItems = [...items];
        const activeIndex = newItems.findIndex((t) => t._id === activeId);
        if (activeIndex === -1) return items;

        // Handle reordering if needed
        if (active.id !== over.id) {
          // ... arrayMove logic if you implement reordering within columns later
        }

        newItems[activeIndex] = { ...newItems[activeIndex], status: newStatus };
        return newItems;
      });
    }
  };

  const toggleCollapse = (columnKey) => {
    setCollapsed((prev) => ({
      ...prev,
      [columnKey]: !prev[columnKey],
    }));
  };

  const activeTicket = activeId
    ? localTickets.find((t) => t._id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setActiveId(null);
        setOverColumnKey(null);
        setLocalTickets(tickets); // Revert on cancel
      }}
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.Always,
        },
      }}
    >
      <div className="flex h-full gap-6 min-w-full overflow-x-auto pb-4">
        {STATUS_COLUMNS.map((column) => {
          // RENDER FROM LOCAL STATE
          const columnTickets = localTickets.filter(
            (t) => t.status === column.key,
          );
          const isCollapsed = collapsed[column.key];
          const isOver = overColumnKey === column.key;

          return (
            <div
              key={column.key}
              className={`flex flex-col w-80 flex-shrink-0 h-full max-h-full bg-navy-800/30 backdrop-blur-sm rounded-2xl border border-navy-800/60 transition-colors duration-200 ${
                isOver ? "border-primary/30" : ""
              }`}
            >
              {/* Column Header */}
              <div className="p-4 border-b border-navy-700/50">
                <button
                  onClick={() => toggleCollapse(column.key)}
                  className="w-full flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full ${column.indicatorColor} ${column.glowClass}`}
                    ></div>
                    <h3 className="text-sm font-semibold text-slate-200 tracking-wide">
                      {column.title}
                    </h3>
                    <span className="ml-1 text-xs text-slate-500 font-medium bg-navy-800 px-2 py-0.5 rounded-md border border-navy-700">
                      {columnTickets.length}
                    </span>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-slate-500 transition-transform group-hover:text-slate-300 ${
                      isCollapsed ? "-rotate-90" : ""
                    }`}
                  />
                </button>
              </div>

              {/* Tickets Container */}
              {!isCollapsed && (
                <div className="flex-1 flex flex-col p-3 overflow-hidden">
                  <DroppableColumn columnKey={column.key} isOver={isOver}>
                    <SortableContext
                      items={columnTickets.map((t) => t._id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {columnTickets.length > 0 ? (
                        columnTickets.map((ticket) => (
                          <SortableTicketItem
                            key={ticket._id}
                            ticket={ticket}
                            onDelete={() => onDelete(ticket._id)}
                            onEdit={() => onEdit?.(ticket)}
                            onOpenDetails={() => onOpenDetails?.(ticket)}
                          />
                        ))
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center py-8 opacity-50">
                          <div className="border-2 border-dashed border-navy-600 rounded-lg p-4 w-full h-24 flex items-center justify-center">
                            <p className="text-slate-500 text-xs font-medium">
                              Drop tickets here
                            </p>
                          </div>
                        </div>
                      )}
                    </SortableContext>
                  </DroppableColumn>

                  {/* Add Ticket Button */}
                  <button
                    onClick={() => onAddTicket(column.key)}
                    className="mt-2 w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-navy-800/50 hover:bg-navy-700 text-slate-400 hover:text-white text-xs font-semibold transition border border-dashed border-navy-700 hover:border-solid hover:border-navy-600 group"
                  >
                    <Plus
                      size={14}
                      className="group-hover:scale-110 transition-transform"
                    />
                    Add Task
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Drag Overlay - Snap Back Fix: Set dropAnimation to null to hide snapback */}
      <DragOverlay dropAnimation={null}>
        {activeTicket ? (
          <div className="rotate-2 cursor-grabbing scale-105 shadow-2xl ring-1 ring-navy-600 rounded-xl overflow-hidden">
            <TicketCard
              ticket={activeTicket}
              onDelete={() => {}}
              onEdit={() => {}}
              onOpenDetails={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

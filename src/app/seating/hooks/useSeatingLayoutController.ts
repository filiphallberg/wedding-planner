import { useRef } from 'react';
import type { LayoutEvent } from '../../../state/useEventState';
import type { ProjectControls } from '../types';
import { useActiveProject } from './useActiveProject';
import { useDndSensors } from './useDndSensors';
import { useDragEdgeScroll } from './useDragEdgeScroll';
import { useRosterWidth } from './useRosterWidth';
import { useSeatingDialogs } from './useSeatingDialogs';
import { useSeatingDrag } from './useSeatingDrag';
import { useSortedTables } from './useSortedTables';
import { useTableEditor } from './useTableEditor';

export function useSeatingLayoutController(
  projectControls: ProjectControls,
  eventState: LayoutEvent,
) {
  const mainScrollRef = useRef<HTMLElement | null>(null);
  const sensors = useDndSensors();
  const sortedTables = useSortedTables(eventState.state.tables);
  const { projectMenuLabel } = useActiveProject(projectControls);
  const roster = useRosterWidth();
  const tableEditorState = useTableEditor(eventState.state.tables);
  const dialogs = useSeatingDialogs();
  const drag = useSeatingDrag({
    guests: eventState.state.guests,
    handleDragEnd: eventState.handleDragEnd,
  });

  useDragEdgeScroll(mainScrollRef, drag.activeDragGuest, drag.dragPointer);

  return {
    mainScrollRef,
    sensors,
    sortedTables,
    projectMenuLabel,
    roster,
    tableEditorState,
    dialogs,
    drag,
  };
}

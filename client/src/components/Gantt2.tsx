// src/components/Gantt2.tsx

import React, { useEffect } from "react";
import { Gantt, Task, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import { ganttDateRange2 } from "../helpers/date-helper";

interface Gantt2Props {
  tasks: Task[];
}

const Gantt2: React.FC<Gantt2Props> = ({ tasks }) => {
  useEffect(() => {
    tasks.forEach(task => {
      ganttDateRange2(task);
    });
  }, [tasks]);

  return (
    <Gantt
      tasks={tasks}
      viewMode={ViewMode.Week}
      // ... other props
    />
  );
};

export default Gantt2;

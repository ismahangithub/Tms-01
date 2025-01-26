// src/pages/CalendarPageBigCalendar.tsx

import React, { useEffect, useState, useCallback } from "react";
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import Modal from "react-modal";
import axios from "axios";
import { FaSpinner } from "react-icons/fa";
import toast from "react-hot-toast";

// Import your modals
import CreateMeetingModal from "./CreateMeetingPage";
import CreateEventModal from "../App/calendar/CreateEventModal";

Modal.setAppElement("#root");

/* ----------------------------------
   1) Multi-day splitting utility
---------------------------------- */
interface RawEvent {
  id: string;
  title: string;
  start: Date;
  end?: Date;
  type: "Meeting" | "Project" | "Task" | "Event";
  status?: string;
  description?: string;
  color?: string;
}

function splitMultiDayEvent(rawEvent: RawEvent): RawEvent[] {
  const result: RawEvent[] = [];
  const startDate = new Date(rawEvent.start);
  const endDate = rawEvent.end ? new Date(rawEvent.end) : new Date(rawEvent.start);
  let current = new Date(startDate);

  while (current <= endDate) {
    const singleDayEvent: RawEvent = { ...rawEvent };
    singleDayEvent.start = new Date(current);

    const endOfCurrent = new Date(current);
    endOfCurrent.setHours(23, 59, 59, 999);

    singleDayEvent.end = endOfCurrent > endDate ? endDate : endOfCurrent;
    result.push(singleDayEvent);

    current.setDate(current.getDate() + 1);
    current.setHours(0, 0, 0, 0);
  }

  return result;
}

/* ----------------------------------
   2) Status-based color logic
---------------------------------- */
const statusColorMap: Record<string, string> = {
  pending: "#9E9E9E",
  "in progress": "#FFC107",
  completed: "#4CAF50",
  overdue: "#F44336",
};

const localizer = momentLocalizer(moment);

type EventType = "Meeting" | "Project" | "Task" | "Event";

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end?: Date;
  type: EventType;
  status?: string;
  description?: string;
  color?: string;
}

/* ----------------------------------
   Custom Event Component
---------------------------------- */
const EventComponent: React.FC<{ event: CalendarEvent }> = ({ event }) => (
  <div
    title={event.title}
    style={{
      fontSize: event.type === "Task" ? "0.7rem" : "0.8rem",
      padding: "1px",
      overflow: "hidden",
      whiteSpace: "nowrap",
      textOverflow: "ellipsis",
      backgroundColor: event.color,
      color: "#fff",
      borderRadius: "2px",
    }}
  >
    {event.title}
  </div>
);

const CalendarPageBigCalendar: React.FC = () => {
  const [rawEvents, setRawEvents] = useState<RawEvent[]>([]);
  const [displayEvents, setDisplayEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<string>("month");

  const [isCreateMeetingModalOpen, setIsCreateMeetingModalOpen] = useState<boolean>(false);
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState<boolean>(false);

  const [selectedEvent, setSelectedEvent] = useState<{
    id: string;
    title: string;
    start: string;
    end?: string;
    color: string;
    description?: string;
    type: EventType;
    status?: string;
  } | null>(null);

  /* ----------------------------------
     Fetch events from multiple APIs (Once)
  ---------------------------------- */
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch Meetings
      const meetingsResp = await axios.get("/api/meetings");
      const meetingsData = meetingsResp.data?.data || [];
      const meetingsRaw: RawEvent[] = meetingsData.map((m: any) => ({
        id: m._id,
        title: m.title,
        start: new Date(m.startTime),
        end: new Date(m.endTime),
        type: "Meeting",
        description: m.agenda || "No agenda provided.",
        color: "#006272",
      }));

      // Fetch Projects
      const projectsResp = await axios.get("/api/projects");
      const projectsData = projectsResp.data?.projects || [];
      const projectsRaw: RawEvent[] = projectsData.map((p: any) => {
        const rawStatus = (p.status || "").toLowerCase();
        return {
          id: p._id,
          title: p.name,
          start: new Date(p.startDate),
          end: new Date(p.dueDate),
          type: "Project",
          status: p.status,
          description: `Status: ${p.status}`,
          color: statusColorMap[rawStatus] || "#9E9E9E",
        };
      });

      // Fetch Tasks
      const tasksResp = await axios.get("/api/tasks");
      const tasksData = tasksResp.data?.tasks || [];
      const tasksRaw: RawEvent[] = tasksData.map((t: any) => {
        const rawStatus = (t.status || "").toLowerCase();
        return {
          id: t._id,
          title: t.title,
          start: new Date(t.dueDate),
          end: new Date(t.dueDate),
          type: "Task",
          status: t.status,
          description: t.description || "No description provided.",
          color: statusColorMap[rawStatus] || "#9E9E9E",
        };
      });

      // Fetch General Events
      const eventsResp = await axios.get("/api/events");
      const eventsData = eventsResp.data?.data || [];
      const generalRaw: RawEvent[] = eventsData.map((g: any) => ({
        id: g._id,
        title: g.title,
        start: new Date(g.startTime || g.date),  // Use startTime or fallback to date
        end: g.endTime ? new Date(g.endTime) : undefined,  // Use endTime if available
        type: "Event",
        status: g.status,
        description: g.description || "No description provided.",
        color: g.color || "#FFD700",
      }));

      const combinedRaw = [
        ...meetingsRaw,
        ...projectsRaw,
        ...tasksRaw,
        ...generalRaw,
      ];
      setRawEvents(combinedRaw);
    } catch (err: any) {
      console.error("Error fetching events:", err);
      setError(err.response?.data?.message || "Failed to fetch events.");
      toast.error(err.response?.data?.message || "Failed to fetch events.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  /* ----------------------------------
     Compute display events (always split)
  ---------------------------------- */
  useEffect(() => {
    if (!rawEvents.length) return;

    const processedEvents: CalendarEvent[] = [];
    rawEvents.forEach(raw => {
      const splitted = splitMultiDayEvent(raw);
      splitted.forEach(s => {
        if (!isNaN(s.start.getTime())) {
          processedEvents.push({
            id: s.id,
            title: s.title,
            start: s.start,
            end: s.end,
            type: s.type,
            status: s.status,
            description: s.description,
            color: s.color,
          });
        }
      });
    });
    setDisplayEvents(processedEvents);
  }, [rawEvents]);

  /* ----------------------------------
     Creating functionality retained
  ---------------------------------- */
  const handleEventCreated = () => {
    setIsCreateMeetingModalOpen(false);
    setIsCreateEventModalOpen(false);
    fetchEvents();
    toast.success("Event created successfully!");
  };

  // ------------- Big Calendar Handlers -------------
  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    setSelectedEvent({
      id: "",
      title: "",
      start: start.toISOString(),
      end: end.toISOString(),
      color: "#006272",
      type: "Meeting",
      description: "",
      status: undefined,
    });
    setIsCreateMeetingModalOpen(true);
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    // Simplified version: selecting an event does nothing.
  };

  /* ----------------------------------
     Custom Event Style
  ---------------------------------- */
  const eventStyleGetter = (event: CalendarEvent) => {
    const backgroundColor = event.color || "#000";
    let fontSize = "0.9rem";
    let padding = "2px 4px";

    if (currentView === "week") {
      fontSize = "0.7rem";
      padding = "1px 2px";
    }
    if (event.type === "Task") {
      fontSize = "0.75rem";
    }

    return {
      style: {
        backgroundColor,
        color: "#fff",
        borderRadius: "4px",
        padding,
        border: 0,
        fontSize,
        overflow: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
      },
    };
  };

  const views = { month: true, week: true };

  const containerStyle: React.CSSProperties = {
    padding: "24px",
    backgroundColor: "#f3f4f6",
    minHeight: "100vh",
  };
  const calendarWrapperStyle: React.CSSProperties = {
    backgroundColor: "#ffffff",
    padding: "16px",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  };

  return (
    <div style={containerStyle}>
      <h2
        style={{
          fontSize: "1.875rem",
          fontWeight: 600,
          textAlign: "center",
          marginBottom: "1.5rem",
          color: "#1d4ed8",
        }}
      >
        Project, Task, and Meeting Calendar (Big Calendar)
      </h2>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem", gap: "1rem" }}>
        <button
          onClick={() => {
            setSelectedEvent({
              id: "",
              title: "",
              start: "",
              color: "#006272",
              type: "Meeting",
              description: "",
              status: undefined,
            });
            setIsCreateMeetingModalOpen(true);
          }}
          style={{
            backgroundColor: "#006272",
            color: "#fff",
            fontWeight: 600,
            padding: "8px 16px",
            borderRadius: "4px",
          }}
        >
          + Create Meeting
        </button>

        <button
          onClick={() => {
            setSelectedEvent({
              id: "",
              title: "",
              start: "",
              color: "#FFD700",
              type: "Event",
              description: "",
              status: undefined,
            });
            setIsCreateEventModalOpen(true);
          }}
          style={{
            backgroundColor: "#FFD700",
            color: "#000",
            fontWeight: 600,
            padding: "8px 16px",
            borderRadius: "4px",
          }}
        >
          + Create Event
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "16rem" }}>
          <FaSpinner className="animate-spin" style={{ fontSize: "2rem", color: "#3b82f6" }} />
          <span style={{ marginLeft: "0.5rem", fontSize: "1.25rem", color: "#3b82f6" }}>
            Loading Calendar...
          </span>
        </div>
      ) : error ? (
        <div style={{ textAlign: "center", color: "#ef4444" }}>
          <p>{error}</p>
        </div>
      ) : (
        <div style={calendarWrapperStyle}>
          <Calendar
            localizer={localizer}
            events={displayEvents}
            startAccessor="start"
            endAccessor="end"
            views={views}
            defaultView={Views.MONTH}
            style={{ height: 600 }}
            selectable
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventStyleGetter}
            onView={(view) => setCurrentView(view)}
            components={{ event: EventComponent }}
            popup={true}
          />
        </div>
      )}

      <Modal
        isOpen={isCreateMeetingModalOpen}
        onRequestClose={() => setIsCreateMeetingModalOpen(false)}
        contentLabel="Create Meeting"
        className="max-w-3xl mx-auto my-8 bg-white p-6 rounded shadow-lg outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
      >
        <CreateMeetingModal
          isOpen={isCreateMeetingModalOpen}
          onClose={() => setIsCreateMeetingModalOpen(false)}
          onMeetingCreated={handleEventCreated}
        />
      </Modal>

      <Modal
        isOpen={isCreateEventModalOpen}
        onRequestClose={() => setIsCreateEventModalOpen(false)}
        contentLabel="Create Event"
        className="max-w-3xl mx-auto my-8 bg-white p-6 rounded shadow-lg outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
      >
        <CreateEventModal
          isOpen={isCreateEventModalOpen}
          onClose={() => setIsCreateEventModalOpen(false)}
          onEventCreated={handleEventCreated}
        />
      </Modal>
    </div>
  );
};

export default CalendarPageBigCalendar;

// ============================================================
// AGENT-READABLE SCHEDULING ADAPTER - VERSION 1.0.0
// =============================================================

// This stores the object holding the information for the MCP server
let _backendData = {};

const inferenceLevels = {
  0: { name: "CONFIRMED", method: "explicit_slots" },
  1: { name: "DERIVED", method: "busy_hours_derived" },
  2: { name: "INFERRED", method: "shift_staff_mapping" },
  3: { name: "UNCERTAIN", method: "freeform_message" },
  4: { name: "UNAVAILABLE", method: "no_data" }
};

const modelContext =
  typeof document !== "undefined" &&
  document.modelContext &&
  typeof document.modelContext.registerTool === "function"
    ? document.modelContext
    : null;

// ============================================================
// Tool-facing helper functions
// ============================================================
function getBusinessServices() {
  return typeof _backendData.get_business_services === "function"
    ? JSON.stringify(_backendData.get_business_services())
    : JSON.stringify({});
}

function bookAppointment(startDateTime, finishDateTime, address, jobDetails, message) {
  return typeof _backendData.BookAppointment === "function"
    ? JSON.stringify(_backendData.BookAppointment(startDateTime, finishDateTime, address, jobDetails, message))
    : JSON.stringify({ error: "BookAppointment function not implemented" });
}

function initBackend(backendData) {
  _backendData = backendData || {};
  return _backendData;
}

// ============================================================
// Create the adapter module - only exposes a single function
// ============================================================
const FIND_AVAILABLE_TIMES = (function () {
  async function process(backendData = _backendData, options = {}) {
    _backendData = backendData || {};

    const formatted = formatDataForAI(_backendData);
    const temp = formatSlots(formatted);
    const slots = temp[0];
    const inferenceLevel = temp[1];

    return {
      inferenceLevel,
      slots,
      rawDataInfo: summarizeExtractedData(formatted),
      queryWindow: {
        startDateTime: options.startDateTime || null,
        finishDateTime: options.finishDateTime || null
      }
    };
  }

  function formatDataForAI(backendData) {
    _backendData = backendData || {};
    return _backendData;
  }

  function formatSlots(formatted) {
    const slots = [];
    let result;
    let hours;
    let events;
    let staff;
    let inferenceLevel = 4;
    let working_hours = -1; // -1 = false, 0 = unsure, 1 = true
    let busy_hours = -1; // -1 = false, 0 = unsure, 1 = true

    if (typeof formatted.AvailableSlots === "function") {
      try {
        result = formatted.AvailableSlots();
        if (Array.isArray(result)) {
          return [
            result.map((s) => ({
              slotId: s.slotId || s.id || `slot_${Date.now()}`,
              start: typeof s.start === "object" ? s.start.toISOString() : String(s.start),
              end: typeof s.end === "object" ? s.end.toISOString() : String(s.end),
              resource_ids: s.resource_ids || [],
              service_id: s.service_id || "",
              booking_mode: s.booking_mode || "exact_time"
            })),
            0
          ];
        }
        if (result && typeof result === "object") {
          return [[{
            slotId: result.slotId || result.id || "slot_1",
            start: result.start || String(new Date().toISOString()),
            end: result.end || String(new Date(Date.now() + 3600000).toISOString()),
            resource_ids: result.resource_ids || [],
            service_id: result.service_id || "",
            booking_mode: result.booking_mode || "exact_time"
          }], 0];
        }
      } catch (e) {
        slots.push({
          slotId: "Slot_Available_Time",
          start: (result && result.start) || String(new Date().toISOString()),
          end: (result && result.end) || String(new Date(Date.now() + 3600000).toISOString()),
          resource_ids: [],
          service_id: "",
          booking_mode: "suspected_format_error",
          raw_content: JSON.stringify(result || null)
        });
        inferenceLevel = 3;
      }
    }

    if (typeof formatted.CalendarAppointments === "function") {
      try {
        events = formatted.CalendarAppointments();
        if (Array.isArray(events)) {
          try {
            events.forEach((e) => {
              slots.push({
                slotId: `busy_hours_${Date.now()}`,
                start: typeof e.start === "object" ? e.start.toISOString() : String(e.start),
                end: typeof e.end === "object" ? e.end.toISOString() : String(e.end),
                resource_ids: [],
                service_id: e.service_id || "calendar",
                booking_mode: "exact_time",
                metadata: { note: "Calendar busy interval" }
              });
            });
            busy_hours = 1;
          } catch (e) {
            slots.push({
              slotId: `busy_hours_${Date.now()}`,
              booking_mode: "suspected_exact_times",
              raw_content: JSON.stringify(events)
            });
            busy_hours = 0;
          }
        }
      } catch (e) {
        console.error(e);
      }
    }

    if (typeof formatted.WorkingHours === "function") {
      try {
        hours = formatted.WorkingHours();
        if (typeof hours === "object" && hours !== null) {
          slots.push({
            slotId: "working_hours",
            start: hours.start || "00:00",
            end: typeof hours.end === "object" ? hours.end.toISOString() : String(hours.end || "23:59"),
            resource_ids: [],
            service_id: "hours",
            booking_mode: "time_window",
            metadata: { note: "Business hours" }
          });
          working_hours = 1;
        } else {
          slots.push({
            slotId: "working_hours_primative",
            service_id: "hours",
            booking_mode: "time_window",
            raw_content: JSON.stringify(hours)
          });
          working_hours = 0;
        }
      } catch (e) {
        slots.push({
          slotId: "working_hours_format_error",
          service_id: "hours",
          booking_mode: "time_window",
          raw_content: JSON.stringify(hours)
        });
        working_hours = 0;
      }
    }

    if (typeof formatted.EmployeesAvailableToMeetClient === "function") {
      try {
        staff = formatted.EmployeesAvailableToMeetClient();
        if (Array.isArray(staff)) {
          staff.forEach((emp, i) => {
            slots.push({
              slotId: `emp_${i}`,
              start: new Date().toISOString(),
              end: new Date(Date.now() + 3600000).toISOString(),
              resource_ids: [emp.id || emp.name || "unknown"],
              service_id: "staff",
              booking_mode: "exact_time",
              metadata: {
                name: emp.name || "Unknown",
                skills: emp.skills || [],
                inferenceLevel: 2
              }
            });
          });
          if (inferenceLevel > 2) {
            inferenceLevel = 2;
          }
        }
      } catch (e) {
        slots.push({
          slotId: "empolyees",
          service_id: "staff",
          booking_mode: "exact_time",
          raw_content: JSON.stringify(staff || null)
        });
        inferenceLevel = 3;
      }
    }

    if (typeof formatted.FreeFormMessageRegardingMeetingWithClient === "function") {
      try {
        const msg = formatted.FreeFormMessageRegardingMeetingWithClient("");
        if (typeof msg === "string" || typeof msg === "object") {
          slots.push({
            slotId: "freeformMessage",
            raw_content: JSON.stringify(msg)
          });
          if (inferenceLevel > 3) {
            inferenceLevel = 3;
          }
        }
      } catch (e) {
        console.error(e);
      }
    }

    if (inferenceLevel > 2 && working_hours === 1 && busy_hours === 1) {
      inferenceLevel = 1;
    } else if (inferenceLevel > 2 && (working_hours === 1 || busy_hours === 1)) {
      inferenceLevel = 2;
    }

    return [slots, inferenceLevel];
  }

  function summarizeExtractedData() {
    const data = _backendData;
    return {
      slotCount: typeof data.AvailableSlots === "function" ? "auto" : 0,
      businessCount: 1,
      serviceCount: 1,
      resourceCount: typeof data.EmployeesAvailableToMeetClient === "function" ? "auto" : 0,
      dataQuality: data.postcode ? "partial" : "limited"
    };
  }

  return { process };
})();

// ============================================================
// Register the tools for the AI to use
// ============================================================
if (modelContext) {
  modelContext.registerTool({
    name: "book_appointment",
    description:
      "Sends a request to the backend to book an appointment with the given details" +
      "This function will return \"success\" if the appointment was booked successfully," +
      " a custom message from the provider if it failed, or an error message if it failed.",
    inputSchema: {
      type: "object",
      properties: {
        startDateTime: { type: "Date" },
        finishDateTime: { type: "Date" },
        Address: { type: "string" },
        jobDetails: { type: "string" },
        Message: { type: "string" }
      }
    },
    execute: async (input) => {
      return bookAppointment(
        input.startDateTime,
        input.finishDateTime,
        input.Address,
        input.jobDetails,
        input.Message
      );
    }
  });

  modelContext.registerTool({
    name: "get_business_services",
    description: "Tells the system the servcies rendered from this bussiness",
    inputSchema: {},
    execute: async () => {
      return getBusinessServices();
    }
  });

  modelContext.registerTool({
    name: "find_times_for_appointment",
    description:
      "Returns times that the provider is available to meet with the client. " +
      "This is based on the provider's working hours, existing appointments, and any other constraints provided by the developer." +
      "As the agent you are expected to use this function before booking an appointment to ensure the time you are booking is available.",
    inputSchema: {
      type: "object",
      properties: {
        startDateTime: { type: "Date" },
        finishDateTime: { type: "Date" }
      }
    },
    execute: async (input) => {
      return FIND_AVAILABLE_TIMES.process(_backendData, {
        startDateTime: input.startDateTime,
        finishDateTime: input.finishDateTime
      });
    }
  });
}

const schedulerAdapter = {
  inferenceLevels,
  initBackend,
  getBusinessServices,
  bookAppointment,
  process: FIND_AVAILABLE_TIMES.process
};

export default schedulerAdapter;

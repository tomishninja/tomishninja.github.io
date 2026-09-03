// ============================================================
// AGENT-READABLE SCHEDULING ADAPTER - VERSION 1.0.0
// =============================================================

const inferenceLevels = {
  0: { name: "CONFIRMED", method: "explicit_slots" },
  1: { name: "DERIVED", method: "busy_hours_derived" },
  2: { name: "INFERRED", method: "shift_staff_mapping" },
  3: { name: "UNCERTAIN", method: "freeform_message" },
  4: { name: "UNAVAILABLE", method: "no_data" }
};

// ============================================================
// Create the adapter module - only exposes a single function
// ============================================================
const FIND_AVAILABLE_TIMES = (function () {
  async function process(backendData, options = {}) {
    const formatted = formatDataForAI(backendData);
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
    return backendData || {};
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

  function summarizeExtractedData(data) {
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
// Register the tools for the AI to use with one explicit provider backend.
// ============================================================
async function registerSchedulingTools(backendData) {
  if (
    typeof document === "undefined" ||
    !document.modelContext ||
    typeof document.modelContext.registerTool !== "function"
  ) {
    throw new Error("WebMCP is unavailable in this document");
  }

  if (!backendData || typeof backendData !== "object") {
    throw new TypeError("A provider backend object is required");
  }

  const modelContext = document.modelContext;

  await modelContext.registerTool({
    name: "book_appointment",
    description:
      "Request an appointment from this provider using the selected start and finish times.",
    inputSchema: {
      type: "object",
      properties: {
        startDateTime: { type: "string", format: "date-time" },
        finishDateTime: { type: "string", format: "date-time" },
        address: { type: "string" },
        jobDetails: { type: "string" },
        message: { type: "string" }
      },
      required: ["startDateTime", "finishDateTime"],
      additionalProperties: false
    },
    annotations: { readOnlyHint: false },
    execute: async (input) => {
      if (typeof backendData.BookAppointment !== "function") {
        return { error: "BookAppointment function not implemented" };
      }

      return backendData.BookAppointment(
        input.startDateTime,
        input.finishDateTime,
        input.address,
        input.jobDetails,
        input.message
      );
    }
  });

  await modelContext.registerTool({
    name: "get_business_services",
    description: "Return this provider's services, service areas, timezone, and scheduling capabilities.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false
    },
    annotations: {
      readOnlyHint: true
    },
    execute: async () => {
      return typeof backendData.get_business_services === "function"
        ? backendData.get_business_services()
        : {};
    }
  });

  await modelContext.registerTool({
    name: "find_times_for_appointment",
    description:
      "Returns times that the provider is available to meet with the client. " +
      "This is based on the provider's working hours, existing appointments, and any other constraints provided by the developer." +
      "As the agent you are expected to use this function before booking an appointment to ensure the time you are booking is available.",
    inputSchema: {
      type: "object",
      properties: {
        startDateTime: {
          type: "string",
          format: "date-time"
        },
        finishDateTime: {
          type: "string",
          format: "date-time"
        }
      },
      required: ["startDateTime", "finishDateTime"],
      additionalProperties: false
    },
    annotations: {
      readOnlyHint: true
    },
    execute: async (input) => {
      return FIND_AVAILABLE_TIMES.process(backendData, {
        startDateTime: input.startDateTime,
        finishDateTime: input.finishDateTime
      });
    }
  });
}

const schedulerAdapter = {
  inferenceLevels,
  registerSchedulingTools,
  process: FIND_AVAILABLE_TIMES.process
};

export { inferenceLevels, registerSchedulingTools };
export default schedulerAdapter;

// ============================================================================
// MCP ADAPTER — BACKEND DATA TEMPLATE
// ============================================================================
//
// WHAT THIS FILE IS
// ------------------
// scheduler.js receives one provider backend object when its WebMCP tools are
// registered. That backend is a plain JS object (or class instance) with a handful
// of optional functions on it — CalendarAppointments(), WorkingHours(),
// AvailableSlots(), etc. Depending on WHICH of those functions you provide,
// scheduler.js computes an "inference level" (0 = explicit/confirmed
// down to 4 = no usable data) and formats your data into agent-readable
// slots automatically.
//
// This file exists so you don't have to guess that shape from scratch.
// It gives you a `BackendDataTemplate` class with every supported function
// written out, commented out, with an example return value already filled
// in. You uncomment only the ones your backend can actually support.
//
// HOW TO USE THIS FILE
// ---------------------
// 1. Copy `BackendDataTemplate` (or subclass it) in your own script.
// 2. Uncomment whichever methods you can implement and replace the example
//    body with real logic that reads from YOUR scheduling system.
// 3. You do NOT need to implement every method. Implement as many as you
//    reasonably can — more functions generally means a lower (better)
//    inference level and a more reliable result for the agent.
// 4. It is completely fine to not follow this shape at all. scheduler.js
//    will accept whatever object you hand it and do its best. Following this
//    template just gives you predictably better inference results.
// 5. Once your instance is filled in, register the scheduler tools with it:
//
//      const backend = new MyBackendData();
//      await registerSchedulingTools(backend);   // see USAGE below
//
// INFERENCE LEVELS (computed FOR you by scheduler.js)
// -------------------------------------------------------------
//   Level 0 — CONFIRMED    : AvailableSlots() implemented
//   Level 1 — DERIVED      : CalendarAppointments() AND WorkingHours() implemented
//   Level 2 — INFERRED     : EmployeesAvailableToMeetClient() implemented
//                            (or only WorkingHours() implemented on its own)
//   Level 3 — UNCERTAIN    : FreeFormMessageRegardingMeetingWithClient() implemented
//   Level 4 — UNAVAILABLE  : none of the above implemented
//
// Do NOT set an inference level yourself anywhere — it is derived purely
// from which methods exist on the object you provide.
//
// ============================================================================
// IMPORT — this template defines backend data shape only.
// ============================================================================

// ============================================================================
// CLASS: BackendDataTemplate
// ============================================================================
// Every method below is commented out on purpose. Uncomment ONLY the ones
// you can implement for your backend. Leave the rest commented out — an
// unimplemented method must simply not exist on the object (not exist and
// return null/undefined), otherwise scheduler-adapter.js will think you
// support that inference level when you don't.
// ============================================================================
class BackendDataTemplate {
  constructor() {
    // Optional: service-area postcode(s) for this business.
    // Checked by scheduler-adapter.js as a plain property (not a function).
    // this.postcode = "5000";
  }

  // --------------------------------------------------------------------------
  // get_business_services()
  // --------------------------------------------------------------------------
  // Purpose: Tells the agent what this business is and what it can do.
  // Called once, up front, before any availability search.
  //
  // Expected output: a plain object describing the business, its services,
  // timezone, service area, and opening hours.
  //
  // Example:
  // get_business_services() {
  //   return {
  //     businessId: "sparkys-electrical",
  //     businessName: "Sparky's Electrical",
  //     timezone: "Australia/Adelaide",
  //     serviceAreas: ["5000", "5001", "5006"],
  //     services: [
  //       {
  //         serviceId: "power-point-repair",
  //         name: "Power Point Repair",
  //         defaultDurationMinutes: 60,
  //         requiredCapabilities: ["electrical"]
  //       }
  //     ],
  //     openingHours: { start: "08:00", end: "17:00" }
  //   };
  // }

  // --------------------------------------------------------------------------
  // AvailableSlots()                                     [ -> INFERENCE LEVEL 0 ]
  // --------------------------------------------------------------------------
  // Purpose: You already know exactly which slots are bookable — no
  // derivation needed. This is the strongest, most trusted signal.
  //
  // Expected output: an array of slot objects (a single slot object is also
  // accepted). Each slot should look like:
  //   {
  //     slotId: string,            // unique id you can look up later
  //     start: string|Date,        // ISO 8601 string or Date
  //     end: string|Date,          // ISO 8601 string or Date
  //     resource_ids: string[],    // ids of worker/room/vehicle etc. (optional)
  //     service_id: string,        // which service this slot is for
  //     booking_mode: string       // e.g. "exact_time" or "arrival_window"
  //   }
  //
  // Example:
  // AvailableSlots() {
  //   return [
  //     {
  //       slotId: "slot_2026-09-02_0900",
  //       start: "2026-09-02T09:00:00+09:30",
  //       end: "2026-09-02T10:00:00+09:30",
  //       resource_ids: ["worker_sam"],
  //       service_id: "power-point-repair",
  //       booking_mode: "exact_time"
  //     }
  //   ];
  // }

  // --------------------------------------------------------------------------
  // CalendarAppointments()                    [ -> pairs with WorkingHours() for LEVEL 1 ]
  // --------------------------------------------------------------------------
  // Purpose: You can't say what's free, but you CAN say what's busy (e.g.
  // existing calendar events). scheduler-adapter.js subtracts these busy
  // intervals from WorkingHours() to derive free time deterministically.
  //
  // Expected output: an array of busy-interval objects:
  //   {
  //     start: string|Date,
  //     end: string|Date,
  //     service_id: string   // optional, defaults to "calendar"
  //   }
  //
  // Example:
  // CalendarAppointments() {
  //   return [
  //     { start: "2026-09-02T10:00:00+09:30", end: "2026-09-02T11:30:00+09:30" },
  //     { start: "2026-09-02T13:00:00+09:30", end: "2026-09-02T14:00:00+09:30" }
  //   ];
  // }

  // --------------------------------------------------------------------------
  // WorkingHours()          [ -> pairs with CalendarAppointments() for LEVEL 1 ]
  // --------------------------------------------------------------------------
  // Purpose: Describes when the business is open/operating. On its own
  // (without CalendarAppointments()) this only supports LEVEL 2, because
  // opening hours alone are not enough to safely infer real availability.
  //
  // Expected output: an object with the operating window:
  //   { start: string, end: string }   // "HH:MM" (or ISO string / Date)
  //
  // Example:
  // WorkingHours() {
  //   return { start: "08:00", end: "17:00" };
  // }

  // --------------------------------------------------------------------------
  // EmployeesAvailableToMeetClient()                     [ -> INFERENCE LEVEL 2 ]
  // --------------------------------------------------------------------------
  // Purpose: You track staff/resources and their shifts, but not availability
  // directly. The AI inference layer maps this structure onto slots.
  //
  // Expected output: an array of employee/resource objects:
  //   {
  //     id: string,
  //     name: string,
  //     skills: string[]   // capabilities, e.g. ["hvac", "electrical"]
  //   }
  //
  // Example:
  // EmployeesAvailableToMeetClient() {
  //   return [
  //     { id: "worker_sam", name: "Sam", skills: ["hvac", "electrical"] },
  //     { id: "worker_alex", name: "Alex", skills: ["hvac", "solar"] }
  //   ];
  // }

  // --------------------------------------------------------------------------
  // FreeFormMessageRegardingMeetingWithClient(query)     [ -> INFERENCE LEVEL 3 ]
  // --------------------------------------------------------------------------
  // Purpose: Last resort. You have no structured scheduling data at all,
  // only a free-text description of general availability. The AI must treat
  // this as uncertain and must NOT silently convert vague phrases (e.g.
  // "after lunch") into exact times.
  //
  // Expected output: a plain string (or an object containing one) describing
  // availability in natural language.
  //
  // Example:
  // FreeFormMessageRegardingMeetingWithClient(query) {
  //   return "We're generally free Tuesday and Thursday afternoons, but please call to confirm.";
  // }

  // --------------------------------------------------------------------------
  // BookAppointment(startDateTime, finishDateTime, address, jobDetails, message)
  // --------------------------------------------------------------------------
  // Purpose: This allows the agent to request a booking for a specific slot. The agent will
  // call this function with the start and finish times of the slot it wants to book,
  // along with the address, job details, and any message from the client. Your implementation
  // should attempt to book the appointment in your backend system and return a confirmation
  // object indicating whether the booking was successful or not.
  //
  // Note: This function is optional. If you do not implement it, the agent will not be able to
  // book appointments directly through your system, but it can still provide available slots
  // and other scheduling information.
  //
  // Expected uses : you can use this function to migrate customers to your own contacts or booking form.
  // The intended purpose will have this perform a booking in your backend system.
  // If it seems used incorrectly by the agent you may want to refer the agent to the sche
  //
  // Expected output: a booking confirmation object:
  //   {
  //     status: "confirmed", // or "failed", "pending" or "error"
  //     booking_id: string,
  //     start: string,
  //     end: string,
  //     business_name: string,
  //     service: string,
  //     contact_phone: string,
  //     contact_email: string
  //   }
  //
  // Example:
  // BookAppointment(startDateTime, finishDateTime, address, jobDetails, message) {
  //   // Book the appointment in your backend system here. If successful, return a confirmation object.
  //   try {
  //       // Book the appointment in your backend system here. If successful, return a confirmation object.
  //       
  //   } catch (error) {
  //     // If the booking fails, return an object with status "failed" and an error message.
  //     return {
  //       status: "failed",
  //       error: error.message
  //     };
  //   }
  //
  //   // If the booking is pending, return an object with status "pending" and any relevant information.
  //    if (bookingIsPending) {
  //       return {
  //         status: "pending",
  //         booking_id: `bk_${Date.now()}`,
  //         start: "2026-09-02T09:00:00+09:30",
  //         end: "2026-09-02T10:00:00+09:30",
  //         business_name: "Not Real Services",
  //         service: "power-point-repair",
  //         contact_phone: "not provided",
  //         contact_email: "not provided"
  //       };
  //    }
  //
  //   return {
  //     status: "confirmed",
  //     booking_id: `bk_${Date.now()}`,
  //     start: "2026-09-02T09:00:00+09:30",
  //     end: "2026-09-02T10:00:00+09:30",
  //     business_name: "Not Real Services",
  //     service: "power-point-repair",
  //     contact_phone: "not provided",
  //     contact_email: "not provided"
  //   };
  // }
}

// ============================================================================
// USAGE
// ============================================================================
// 1. Extend or edit BackendDataTemplate above with your own implementations.
// 2. Create an instance and hand it to the scheduler adapter — this is what
  //    is captured directly by the registered WebMCP tool callbacks:
//
//      const backend = new BackendDataTemplate();
  //      await registerSchedulingTools(backend);
//
  // 3. The registered tools will return the computed inference level and
  //    normalized scheduling evidence to the agent when invoked.
// ============================================================================

export { BackendDataTemplate };

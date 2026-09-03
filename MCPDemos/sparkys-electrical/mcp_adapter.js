import { BackendDataTemplate } from "../../adapters/mcp_adapter.js";

class SparkysBackendData extends BackendDataTemplate {
  constructor() {
    super();
    this.postcode = "5000";
  }

  get_business_services() {
    return {
      businessId: "sparkys-electrical",
      businessName: "Sparky's Electrical",
      timezone: "Australia/Adelaide",
      serviceAreas: ["5000", "5001", "5006"],
      services: [
        {
          serviceId: "power-point-repair",
          name: "Power Point Repair",
          defaultDurationMinutes: 60
        },
        {
          serviceId: "ceiling-fan-install",
          name: "Ceiling Fan Installation",
          defaultDurationMinutes: 60
        }
      ]
    };
  }

  WorkingHours() {
    return { start: "08:00", end: "17:00" };
  }

  CalendarAppointments() {
    return [
      {
        start: "2026-09-03T10:00:00+09:30",
        end: "2026-09-03T11:00:00+09:30",
        service_id: "calendar"
      },
      {
        start: "2026-09-03T13:30:00+09:30",
        end: "2026-09-03T14:30:00+09:30",
        service_id: "calendar"
      }
    ];
  }

  BookAppointment(startDateTime, finishDateTime, address, jobDetails, message) {
    return {
      status: "confirmed",
      booking_id: `bk_sparkys_${Date.now()}`,
      start: String(startDateTime || ""),
      end: String(finishDateTime || ""),
      business_name: "Sparky's Electrical",
      service: "power-point-repair",
      notes: {
        address: address || "not provided",
        jobDetails: jobDetails || "not provided",
        message: message || ""
      }
    };
  }
}

export default new SparkysBackendData();

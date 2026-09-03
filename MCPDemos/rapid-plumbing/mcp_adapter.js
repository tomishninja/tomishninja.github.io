import adapter from "https://tomishninja.github.io/javascript/scheduler.js";
import { BackendDataTemplate } from "https://tomishninja.github.io/javascript/mcp_adapter.js";

class RapidPlumbingBackendData extends BackendDataTemplate {
  constructor() {
    super();
    this.postcode = "5000";
  }

  get_business_services() {
    return {
      businessId: "rapid-plumbing",
      businessName: "Rapid Plumbing",
      timezone: "Australia/Adelaide",
      serviceAreas: ["5000", "5002", "5007"],
      services: [
        {
          serviceId: "fixed-plumbing",
          name: "Fixed Plumbing",
          defaultDurationMinutes: 45
        },
        {
          serviceId: "emergency-drain",
          name: "Emergency Drain Cleaning",
          defaultDurationMinutes: 45
        }
      ]
    };
  }

  AvailableSlots() {
    return [
      {
        slotId: "rapid_2026_09_03_0900",
        start: "2026-09-03T09:00:00+09:30",
        end: "2026-09-03T09:45:00+09:30",
        resource_ids: ["rapid-tech-1"],
        service_id: "fixed-plumbing",
        booking_mode: "exact_time"
      },
      {
        slotId: "rapid_2026_09_03_0945",
        start: "2026-09-03T09:45:00+09:30",
        end: "2026-09-03T10:30:00+09:30",
        resource_ids: ["rapid-tech-1"],
        service_id: "fixed-plumbing",
        booking_mode: "exact_time"
      },
      {
        slotId: "rapid_2026_09_03_1030",
        start: "2026-09-03T10:30:00+09:30",
        end: "2026-09-03T11:15:00+09:30",
        resource_ids: ["rapid-tech-2"],
        service_id: "emergency-drain",
        booking_mode: "exact_time"
      }
    ];
  }

  BookAppointment(startDateTime, finishDateTime, address, jobDetails, message) {
    return {
      status: "confirmed",
      booking_id: `bk_rapid_${Date.now()}`,
      start: String(startDateTime || ""),
      end: String(finishDateTime || ""),
      business_name: "Rapid Plumbing",
      service: "fixed-plumbing",
      notes: {
        address: address || "not provided",
        jobDetails: jobDetails || "not provided",
        message: message || ""
      }
    };
  }
}

const backendData = new RapidPlumbingBackendData();
await registerSchedulingTools(backendData);

export default adapter;

import adapter from "../../adapters/scheduler.js";
import { BackendDataTemplate } from "../../adapters/mcp_adapter.js";

class NorthsideAirconBackendData extends BackendDataTemplate {
  constructor() {
    super();
    this.postcode = "5000";
  }

  get_business_services() {
    return {
      businessId: "northside-aircon",
      businessName: "Northside Aircon",
      timezone: "Australia/Adelaide",
      serviceAreas: ["5000", "5008", "5010"],
      services: [
        {
          serviceId: "aircon-install",
          name: "Air conditioner installation",
          defaultDurationMinutes: 90
        }
      ]
    };
  }

  WorkingHours() {
    return { start: "08:00", end: "19:00" };
  }

  EmployeesAvailableToMeetClient() {
    return [
      { id: "sam", name: "Sam", skills: ["hvac", "electrical"] },
      { id: "alex", name: "Alex", skills: ["hvac", "solar"] }
    ];
  }

  BookAppointment(startDateTime, finishDateTime, address, jobDetails, message) {
    return {
      status: "pending",
      booking_id: `bk_northside_${Date.now()}`,
      start: String(startDateTime || ""),
      end: String(finishDateTime || ""),
      business_name: "Northside Aircon",
      service: "aircon-install",
      notes: {
        address: address || "not provided",
        jobDetails: jobDetails || "not provided",
        message: message || ""
      }
    };
  }
}

const backendData = new NorthsideAirconBackendData();
adapter.initBackend(backendData);

export default adapter;

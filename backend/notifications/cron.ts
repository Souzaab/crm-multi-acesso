import { cron } from "encore.dev/cron";
import { agendamentos, units } from "~encore/clients";
import log from "encore.dev/log";

// This cron job runs every hour to check for upcoming appointments.
export const checkUpcomingAppointments = cron("check-appointments", {
  schedule: "0 * * * *", // every hour at minute 0
  handler: async () => {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    try {
      // Iterate over all tenants (units) to check their appointments
      const allUnits = await units.list();
      for (const unit of allUnits.units) {
        const tenantId = unit.id;
        
        const resp = await agendamentos.list({
            tenant_id: tenantId,
            start_date: now.toISOString(),
            end_date: in24Hours.toISOString(),
            status: "agendado",
        });

        for (const appt of resp.agendamentos) {
          // In a real application, this would trigger an email, SMS, or push notification.
          // For now, we just log it to demonstrate the capability.
          log.info(`NOTIFICATION: Upcoming appointment reminder`, {
              tenant: tenantId,
              appointmentId: appt.id,
              leadId: appt.lead_id,
              appointmentTime: appt.data_agendamento,
          });
        }
      }
    } catch (error) {
      log.error("Failed to check for upcoming appointments", { error });
    }
  },
});

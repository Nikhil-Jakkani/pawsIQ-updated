import prisma from '../../../lib/prisma.js';

const toISODate = (d: Date) => d.toISOString().slice(0, 10);

const pad = (n: number) => (n < 10 ? `0${n}` : String(n));

const toTimeHHMM = (date: Date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

const makeSlots = (date: Date, serviceDurationMin: number, startHour = 9, endHour = 17) => {
  const slots: { label: string; iso: string; hhmm: string }[] = [];
  const day = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), startHour, 0, 0));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), endHour, 0, 0));
  for (let t = new Date(day); t < end; t = new Date(t.getTime() + serviceDurationMin * 60_000)) {
    slots.push({
      label: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' }).format(t),
      iso: new Date(t).toISOString(),
      hhmm: toTimeHHMM(new Date(t))
    });
  }
  return slots;
};

const getBookedIsoTimes = async (provider_id: number, dayStartISO: string, dayEndISO: string) => {
  const bookings = await prisma.pIQ_Bookings.findMany({
    where: {
      service_provider_id: provider_id,
      booked_dtm: { gte: new Date(dayStartISO), lt: new Date(dayEndISO) },
    },
    select: { booked_dtm: true },
  });
  return new Set(bookings.map(b => new Date(b.booked_dtm).toISOString()));
};

export const availabilityService = {
  async getDaySlots(params: { services_id: number; provider_id: number; date: string }) {
    const { services_id, provider_id, date } = params;

    const service = await prisma.pIQ_Service_Master.findUnique({ where: { services_id } });
    if (!service) return { date, slots: [] };
    const duration = Number(service.service_duration) || 60;

    // Build the day's slot candidates (UTC)
    const d = new Date(`${date}T00:00:00.000Z`);
    const slots = makeSlots(d, duration, 9, 17);

    // Exclude already booked times
    const dayStartISO = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0)).toISOString();
    const dayEndISO = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1, 0, 0, 0)).toISOString();

    const booked = await getBookedIsoTimes(provider_id, dayStartISO, dayEndISO);
    const available = slots.filter(s => !booked.has(s.iso));

    return { date, slots: available };
  },

  async getRange(params: { services_id: number; provider_id: number; start: string; days: number }) {
    const { services_id, provider_id, start, days } = params;
    const results: { date: string; slots: { label: string; iso: string; hhmm: string }[] }[] = [];

    const startDate = new Date(`${start}T00:00:00.000Z`);
    for (let i = 0; i < Math.max(1, Math.min(30, days || 14)); i++) {
      const d = new Date(startDate);
      d.setUTCDate(startDate.getUTCDate() + i);
      const date = toISODate(d);
      const day = await this.getDaySlots({ services_id, provider_id, date });
      results.push(day);
    }
    return { items: results };
  },
};

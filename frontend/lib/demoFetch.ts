// A thin wrapper around fetch() for the few screens that talk to the backend
// directly (properties, settings, rent-plan offers). For the built-in demo
// accounts it answers from in-memory mock data instead, so the whole UI works
// with no backend at all (e.g. a static Vercel deployment).
import { isDemoUser, mockRentPlansApi } from './mockApi';
import { mockUsers } from './mockData';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

type DemoProperty = {
  id: string;
  name: string;
  address: string;
  units: number;
  monthlyRent: number;
  description?: string;
  tenants: Array<{
    id: string;
    name: string;
    email: string;
    username: string;
    monthlyRent: number;
    nextDueDate: string | null;
    latePaymentCount: number;
  }>;
};

const usernameOf = (email: string) => email.split('@')[0].replace(/[^a-z0-9]/gi, '').toLowerCase();

const nextDue = (day: number) => {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), day);
  if (d < now) d.setMonth(d.getMonth() + 1);
  return d.toISOString();
};

const demoTenant = (id: string, rent: number, day: number, late = 0) => {
  const u = mockUsers.find((m) => m.id === id)!;
  return { id: u.id, name: u.name, email: u.email, username: usernameOf(u.email), monthlyRent: rent, nextDueDate: nextDue(day), latePaymentCount: late };
};

let demoProperties: DemoProperty[] | null = null;
const getDemoProperties = (): DemoProperty[] => {
  if (!demoProperties) {
    demoProperties = [
      {
        id: 'prop-1',
        name: 'Oakwood Court',
        address: '12 Oakwood Road, Manchester M14',
        units: 4,
        monthlyRent: 1800,
        description: 'Four-bed student house, two minutes from campus.',
        tenants: [demoTenant('demo-tenant', 1800, 1), demoTenant('tenant-1', 1500, 1), demoTenant('tenant-2', 2000, 5, 1)],
      },
      {
        id: 'prop-2',
        name: 'The Mill Apartments',
        address: '3 Ancoats Street, Manchester M4',
        units: 6,
        monthlyRent: 1400,
        description: 'Converted mill, one- and two-bed flats.',
        tenants: [demoTenant('tenant-3', 1400, 1), demoTenant('tenant-4', 1600, 10), demoTenant('tenant-5', 1600, 15, 2)],
      },
      {
        id: 'prop-3',
        name: 'Fallowfield Terrace',
        address: '48 Wilmslow Road, Manchester M14',
        units: 3,
        monthlyRent: 1250,
        tenants: [demoTenant('tenant-6', 1250, 3)],
      },
    ];
  }
  return demoProperties;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const currentDemoUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const u = JSON.parse(localStorage.getItem('user') || 'null');
    return u && isDemoUser(u.email) ? u : null;
  } catch {
    return null;
  }
};

async function handleDemo(path: string, init: RequestInit): Promise<Response> {
  await new Promise((r) => setTimeout(r, 250));
  const method = (init.method || 'GET').toUpperCase();
  const body = init.body ? JSON.parse(String(init.body)) : {};
  const url = new URL(path, 'http://demo');
  const p = url.pathname;
  const props = getDemoProperties();

  if (p === '/api/properties' && method === 'GET') return json({ properties: props.map((x) => ({ ...x, occupancy: x.tenants.length })) });
  if (p === '/api/properties' && method === 'POST') {
    props.push({
      id: `prop-${Date.now()}`,
      name: String(body.name || 'New property'),
      address: String(body.address || ''),
      units: Number(body.units) || 1,
      monthlyRent: Number(body.monthlyRent) || 0,
      description: body.description ? String(body.description) : undefined,
      tenants: [],
    });
    return json({ ok: true }, 201);
  }
  if (p === '/api/properties/assign-tenant' && method === 'POST') {
    const prop = props.find((x) => x.id === body.propertyId);
    if (!prop) return json({ error: 'Property not found' }, 404);
    props.forEach((x) => (x.tenants = x.tenants.filter((t) => t.id !== body.tenantId)));
    prop.tenants.push(demoTenant(body.tenantId, prop.monthlyRent, 1));
    return json({ ok: true });
  }
  let m = p.match(/^\/api\/properties\/tenants\/(.+)$/);
  if (m && method === 'DELETE') {
    props.forEach((x) => (x.tenants = x.tenants.filter((t) => t.id !== m![1])));
    return json({ ok: true });
  }
  m = p.match(/^\/api\/properties\/([^/]+)$/);
  if (m && method === 'DELETE') {
    demoProperties = props.filter((x) => x.id !== m![1]);
    return json({ ok: true });
  }
  if (p === '/api/users/tenants') {
    const assigned = new Map(props.flatMap((x) => x.tenants.map((t) => [t.id, x.id] as const)));
    return json({
      tenants: mockUsers
        .filter((u) => u.role === 'tenant')
        .map((u) => ({ ...u, username: usernameOf(u.email), propertyId: assigned.get(u.id) ?? null })),
    });
  }
  if (p === '/api/users/search') {
    const q = (url.searchParams.get('username') || '').toLowerCase();
    const users = mockUsers
      .filter((u) => u.role === 'tenant')
      .map((u) => ({ id: u.id, name: u.name, email: u.email, username: usernameOf(u.email) }))
      .filter((u) => u.username.includes(q) || u.name.toLowerCase().includes(q));
    return json({ users });
  }
  if (p === '/api/rent-plans' && method === 'POST') {
    const plan = await mockRentPlansApi.createPlan({
      tenantId: body.tenantId,
      monthlyRent: Number(body.monthlyRent),
      deposit: Number(body.deposit),
      duration: Number(body.duration),
      description: body.description,
      startDate: body.startDate,
    });
    return json({ plan }, 201);
  }
  if (p === '/api/rent-plans/pending') return json({ plans: [] });
  m = p.match(/^\/api\/rent-plans\/([^/]+)\/(accept|reject)$/);
  if (m) {
    if (m[2] === 'accept') {
      await mockRentPlansApi.acceptPlan(m[1]);
      return json({ sessionUrl: '/dashboard/tenant/rent-plan?success=true&mock=true' });
    }
    await mockRentPlansApi.rejectPlan(m[1]);
    return json({ ok: true });
  }
  if (p === '/api/profile/update' && method === 'PUT') {
    const user = { ...currentDemoUser(), ...body };
    localStorage.setItem('user', JSON.stringify(user));
    return json({ user });
  }
  if (p === '/api/profile/password') return json({ message: 'Demo account: password unchanged' });

  return json({ error: `Not available in demo mode: ${method} ${p}` }, 501);
}

/** fetch() against the backend, or against in-memory demo data for demo accounts. */
export function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  if (currentDemoUser()) return handleDemo(path, init);
  return fetch(`${API_BASE_URL}${path}`, init);
}

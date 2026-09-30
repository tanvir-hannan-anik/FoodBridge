import type { Metadata } from "next";
import { ChatLinks } from "@/components/integrations/chat-links";
import { NgoProfileForm } from "@/components/ngo/ngo-forms";
import { NotificationPrefsForm } from "@/components/notification-prefs";
import { PasswordForm, ProfileForm } from "@/components/profile-forms";
import { AvailabilityToggle } from "@/components/volunteer/task-list";
import { VolunteerProfileForm } from "@/components/volunteer/volunteer-forms";
import { Card, CardBody, CardHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth/dal";
import { ROLE_LABEL } from "@/lib/auth/roles";
import { DONOR_TYPE_LABEL } from "@/lib/donations/meta";
import { NGO_TYPE_LABEL } from "@/lib/ngo/meta";
import { configuredChannels } from "@/lib/notifications/channels";
import { listChannelLinks } from "@/lib/integrations/service";
import { CHAT_CHANNELS } from "@/db/schema";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser();
  const chatLinks = await listChannelLinks(user.id);
  const point = user.lat !== null && user.lng !== null ? { lat: user.lat, lng: user.lng } : null;
  const initials = user.name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="grain relative overflow-hidden rounded-[1.75rem] bg-brand-950 p-6 text-cream-50 sm:p-8">
        <div aria-hidden className="absolute -top-20 -right-16 size-72 rounded-full bg-brand-600/30 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <span className="grid size-20 shrink-0 place-items-center rounded-full bg-accent-400 font-display text-3xl font-semibold text-brand-950">
            {initials}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-widest text-accent-300 uppercase">Profile &amp; settings</p>
            <h1 className="mt-1 truncate font-display text-3xl font-semibold">
              {user.organizationName && user.role === "ngo" ? user.organizationName : user.name}
            </h1>
            <p className="mt-1 truncate text-brand-200">{user.email}</p>
          </div>
        </div>
        <dl className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Fact label="Account">{ROLE_LABEL[user.role]}</Fact>
          {user.donorType && <Fact label="Donor type">{DONOR_TYPE_LABEL[user.donorType].split(" (")[0]}</Fact>}
          {(user.role === "ngo" || user.role === "volunteer") && (
            <Fact label="Verification">{user.status === "active" ? "✓ Verified" : "Under review"}</Fact>
          )}
          {user.role === "volunteer" && <Fact label="Availability">{user.available ? "Available" : "Unavailable"}</Fact>}
          <Fact label="Member since">{formatDate(user.createdAt)}</Fact>
        </dl>
      </section>

      {user.role === "ngo" ? (
        <Card>
          <CardHeader
            title="Organisation profile"
            description={user.ngoType ? NGO_TYPE_LABEL[user.ngoType] : "Tell donors who you serve."}
          />
          <CardBody>
            <NgoProfileForm
              profile={{
                organizationName: user.organizationName,
                ngoType: user.ngoType,
                registrationNo: user.registrationNo,
                name: user.name,
                phone: user.phone,
                address: user.address,
                area: user.area,
                capacity: user.capacity,
                description: user.description,
                point,
              }}
            />
          </CardBody>
        </Card>
      ) : user.role === "volunteer" ? (
        <>
          <Card>
            <CardHeader title="Availability" description="Only available volunteers are offered new pickups." />
            <CardBody>
              <AvailabilityToggle available={user.available} disabled={user.status !== "active"} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Basic information" description="Donors and NGOs see your name and phone during a pickup." />
            <CardBody>
              <VolunteerProfileForm
                profile={{
                  name: user.name,
                  phone: user.phone,
                  area: user.area,
                  address: user.address,
                  description: user.description,
                  point,
                }}
              />
            </CardBody>
          </Card>
        </>
      ) : (
        <Card>
          <CardHeader title="Basic information" description="Used to pre-fill pickup details on new donations." />
          <CardBody>
            <ProfileForm
              profile={{
                name: user.name,
                phone: user.phone,
                organizationName: user.organizationName,
                address: user.address,
                area: user.area,
                point,
                showOrganization: user.role === "donor" && user.donorType !== "individual",
              }}
            />
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader title="Notifications" description="Only important updates about your food, requests and deliveries." />
        <CardBody>
          <NotificationPrefsForm selected={user.notifyChannels} connected={configuredChannels()} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Chat apps" description="Use FoodBridge from WhatsApp or Messenger. The website stays the place where everything is kept." />
        <CardBody>
          <ChatLinks
            enabled={!!process.env.INTEGRATION_SECRET}
            whatsappNumber={process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}
            messengerPage={process.env.NEXT_PUBLIC_MESSENGER_PAGE}
            links={CHAT_CHANNELS.map((channel) => ({ channel, linked: chatLinks.some((l) => l.channel === channel && l.linkedAt) }))}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Password" description="Use at least 8 characters with a letter and a number." />
        <CardBody>
          <PasswordForm />
        </CardBody>
      </Card>
    </div>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-cream-50/10 bg-cream-50/5 px-4 py-3">
      <dt className="text-xs text-brand-300">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold">{children}</dd>
    </div>
  );
}

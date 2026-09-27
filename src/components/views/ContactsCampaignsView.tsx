import React, { useRef, useState } from 'react';
import { useTelephony } from '../../context/TelephonyContext';
import { Contact } from '../../types/telephony';

export const ContactsCampaignsView: React.FC = () => {
  const {
    contacts,
    addContact,
    uploadContactsBatch,
    deleteContact,
    startCall,
    campaigns,
    addNotification,
  } = useTelephony();

  const [search, setSearch] = useState('');
  const [campaignFilter, setCampaignFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Contact Form State
  const [newContact, setNewContact] = useState<Omit<Contact, 'id'>>({
    name: '',
    title: '',
    phone: '',
    email: '',
    company: '',
    arr: '$100,000',
    priority: 'VIP Enterprise',
    campaign: 'Q3 Enterprise SaaS Renewals',
    status: 'New',
    timezone: 'America/New_York (EST)',
    contractExpiryDays: 60,
    notes: '',
  });

  const filteredContacts = contacts.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.email.toLowerCase().includes(search.toLowerCase());

    const matchesCampaign = campaignFilter === 'All' || c.campaign === campaignFilter;
    const matchesPriority = priorityFilter === 'All' || c.priority === priorityFilter;

    return matchesSearch && matchesCampaign && matchesPriority;
  });

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split('\n').filter(Boolean);
      const parsedContacts: Omit<Contact, 'id'>[] = [];

      // Assume CSV header: Name, Title, Phone, Email, Company, ARR, Priority, Campaign
      const rows = lines.slice(1);
      for (const row of rows) {
        const parts = row.split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
        if (parts.length >= 3) {
          parsedContacts.push({
            name: parts[0] || 'Unknown Lead',
            title: parts[1] || 'Decision Maker',
            phone: parts[2] || '+1 (555) 000-0000',
            email: parts[3] || 'lead@company.com',
            company: parts[4] || 'Corporate Client',
            arr: parts[5] || '$50,000',
            priority: (parts[6] as any) || 'Standard',
            campaign: parts[7] || 'Q3 Enterprise SaaS Renewals',
            status: 'New',
            timezone: 'America/New_York (EST)',
            contractExpiryDays: 60,
          });
        }
      }

      if (parsedContacts.length > 0) {
        uploadContactsBatch(parsedContacts);
      } else {
        addNotification('CSV Parse Error', 'Could not parse contacts. Verify header format.', 'error');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const loadSampleLeads = () => {
    const sampleBatch: Omit<Contact, 'id'>[] = [
      {
        name: 'Katherine Bell',
        title: 'Chief Information Officer',
        phone: '+1 (408) 555-7812',
        email: 'kbell@nexuscloud.io',
        company: 'NexusCloud Systems',
        arr: '$180,000',
        priority: 'VIP Enterprise',
        campaign: 'Q3 Enterprise SaaS Renewals',
        status: 'New',
        timezone: 'America/Los_Angeles (PST)',
        contractExpiryDays: 35,
        notes: 'Inbound lead interested in dedicated carrier trunk failover.',
      },
      {
        name: 'Julian Hayes',
        title: 'VP of Lending Operations',
        phone: '+1 (312) 555-3091',
        email: 'jhayes@midwestlending.com',
        company: 'Midwest Lending Corp',
        arr: '$135,000',
        priority: 'VIP Enterprise',
        campaign: 'Mortgage Pre-Approval Warm Leads',
        status: 'New',
        timezone: 'America/Chicago (CST)',
        contractExpiryDays: 50,
        notes: 'Requested rate-lock consultation for branch offices.',
      },
      {
        name: 'Carlos Mendoza',
        title: 'VP of Telecom Networks',
        phone: '+1 (786) 555-9011',
        email: 'cmendoza@caribbeantelecom.com',
        company: 'Caribbean Telecom Gateway',
        arr: '$210,000',
        priority: 'VIP Enterprise',
        campaign: 'VIP Escalations & Retention',
        status: 'New',
        timezone: 'America/New_York (EST)',
        contractExpiryDays: 25,
        notes: 'Sub-20ms SLA guarantee needed for latency-sensitive voice bridging.',
      },
    ];

    uploadContactsBatch(sampleBatch);
  };

  const handleExportCsv = () => {
    const header = 'Name,Title,Phone,Email,Company,ARR,Priority,Campaign,Status,Timezone\n';
    const rows = filteredContacts
      .map(
        (c) =>
          `"${c.name}","${c.title}","${c.phone}","${c.email}","${c.company}","${c.arr}","${c.priority}","${c.campaign}","${c.status}","${c.timezone}"`
      )
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `aetherdial_contacts_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addNotification('Contacts Exported', `Downloaded ${filteredContacts.length} contacts as CSV.`, 'success');
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto bg-surface space-y-5 custom-scrollbar">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-outline-variant pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono-code text-outline mb-1">
            <span>Telephony Hub</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-secondary font-medium">Outbound Campaign Queues & Leads</span>
          </div>
          <h1 className="text-headline-lg font-headline-lg font-bold text-on-surface tracking-tight">
            Campaign Contacts & Lead Dialing Matrix
          </h1>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            Upload CSV contacts, manage lead dispositions, and launch real-time predictive or progressive outbound dialing on Twilio SIP trunks.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleCsvUpload}
            accept=".csv,.txt"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 rounded bg-surface-container-high hover:bg-surface-variant border border-outline-variant text-on-surface text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-secondary text-sm">upload_file</span>
            <span>Upload CSV Contacts</span>
          </button>

          <button
            onClick={loadSampleLeads}
            className="px-3 py-2 rounded bg-surface-container-high hover:bg-surface-variant border border-outline-variant text-on-surface text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-tertiary text-sm">playlist_add</span>
            <span>Load Sample Leads</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3 py-2 rounded bg-surface-container-high hover:bg-surface-variant border border-outline-variant text-on-surface text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-primary text-sm">download</span>
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded bg-secondary hover:bg-secondary-container text-on-secondary text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-sm font-bold">person_add</span>
            <span>Add Single Lead</span>
          </button>
        </div>
      </div>

      {/* Campaign Telemetry Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {campaigns.map((c) => (
          <div
            key={c.id}
            className="p-3 bg-surface-container-low border border-outline-variant rounded flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono-code text-secondary block">{c.type}</span>
                <h4 className="font-bold text-xs text-on-surface truncate max-w-[170px]">{c.name}</h4>
              </div>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono-code bg-surface-container border border-outline-variant text-tertiary">
                {c.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-outline-variant/40 text-[11px] font-mono-code">
              <div>
                <span className="text-outline block text-[9px]">CONNECT RATE</span>
                <span className="text-tertiary font-bold">{c.connectRate}</span>
              </div>
              <div>
                <span className="text-outline block text-[9px]">AGENTS LIVE</span>
                <span className="text-on-surface font-bold">{c.agentsLogged}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 bg-surface-container-low border border-outline-variant rounded flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative w-64">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-sm">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, company, phone..."
              className="w-full bg-surface-container-lowest border border-outline-variant rounded pl-8 pr-3 py-1.5 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-secondary"
            />
          </div>

          {/* Campaign Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-outline">Campaign:</span>
            <select
              value={campaignFilter}
              onChange={(e) => setCampaignFilter(e.target.value)}
              className="bg-surface-container-lowest border border-outline-variant rounded px-2.5 py-1 text-xs text-on-surface focus:outline-none focus:border-secondary"
            >
              <option value="All">All Active Campaigns</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-outline">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-surface-container-lowest border border-outline-variant rounded px-2.5 py-1 text-xs text-on-surface focus:outline-none focus:border-secondary"
            >
              <option value="All">All Priorities</option>
              <option value="VIP Enterprise">VIP Enterprise</option>
              <option value="Mid-Market">Mid-Market</option>
              <option value="Standard">Standard</option>
              <option value="Cold">Cold</option>
            </select>
          </div>
        </div>

        <div className="text-xs font-mono-code text-outline">
          Showing <span className="text-on-surface font-bold">{filteredContacts.length}</span> of {contacts.length} leads
        </div>
      </div>

      {/* Contacts Data Table */}
      <div className="overflow-x-auto rounded border border-outline-variant bg-surface-container-low">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-outline-variant bg-surface-container-lowest text-[11px] font-label-sm text-outline uppercase tracking-wider font-mono-code">
              <th className="py-2.5 px-3">Lead &amp; Company</th>
              <th className="py-2.5 px-3">Phone &amp; Email</th>
              <th className="py-2.5 px-3">ARR Value</th>
              <th className="py-2.5 px-3">Priority</th>
              <th className="py-2.5 px-3">Assigned Campaign</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30 font-body-sm">
            {filteredContacts.map((contact) => (
              <tr key={contact.id} className="hover:bg-surface-container transition-colors group">
                <td className="py-2.5 px-3">
                  <div className="font-bold text-on-surface">{contact.name}</div>
                  <div className="text-[11px] text-outline flex items-center gap-1">
                    <span>{contact.title}</span>
                    <span>•</span>
                    <span className="text-secondary font-medium">{contact.company}</span>
                  </div>
                </td>

                <td className="py-2.5 px-3 font-mono-code">
                  <div className="text-on-surface font-medium">{contact.phone}</div>
                  <div className="text-[11px] text-outline truncate max-w-[170px]">{contact.email}</div>
                </td>

                <td className="py-2.5 px-3 font-mono-code font-bold text-on-surface">
                  {contact.arr}
                </td>

                <td className="py-2.5 px-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono-code font-semibold ${
                      contact.priority === 'VIP Enterprise'
                        ? 'bg-primary-container/20 text-primary border border-primary/30'
                        : contact.priority === 'Mid-Market'
                        ? 'bg-secondary/15 text-secondary border border-secondary/30'
                        : 'bg-surface-container-highest text-outline'
                    }`}
                  >
                    {contact.priority}
                  </span>
                </td>

                <td className="py-2.5 px-3 text-on-surface-variant font-medium">
                  {contact.campaign}
                </td>

                <td className="py-2.5 px-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono-code font-bold ${
                      contact.status === 'Connected'
                        ? 'bg-tertiary/15 text-tertiary border border-tertiary/30'
                        : contact.status === 'Won'
                        ? 'bg-tertiary/20 text-tertiary'
                        : contact.status === 'Follow-up'
                        ? 'bg-secondary/15 text-secondary border border-secondary/30'
                        : contact.status === 'DNC'
                        ? 'bg-error-container/30 text-error'
                        : 'bg-surface-container-highest text-outline'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        contact.status === 'Connected' ? 'bg-tertiary status-pulse' : 'bg-outline'
                      }`}
                    ></span>
                    {contact.status}
                  </span>
                </td>

                <td className="py-2.5 px-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => startCall(contact, 'outbound')}
                      className="px-2.5 py-1 bg-tertiary hover:bg-tertiary-fixed text-on-tertiary font-bold text-xs rounded flex items-center gap-1 transition-all active:scale-95 shadow-xs"
                      title="Launch Softphone & Dial Contact"
                    >
                      <span className="material-symbols-outlined text-sm">call</span>
                      <span>Dial</span>
                    </button>

                    <button
                      onClick={() => deleteContact(contact.id)}
                      className="p-1 text-outline hover:text-error hover:bg-surface-container-highest rounded transition-colors"
                      title="Remove Contact"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Single Contact Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-surface-container-low border border-outline-variant rounded p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-outline-variant pb-2">
              <span className="font-bold text-sm text-on-surface">Add Outbound Lead</span>
              <button onClick={() => setIsAddModalOpen(false)} className="text-outline hover:text-on-surface">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-outline block mb-1">Full Name</label>
                <input
                  type="text"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2 text-on-surface"
                />
              </div>

              <div>
                <label className="text-outline block mb-1">Job Title</label>
                <input
                  type="text"
                  value={newContact.title}
                  onChange={(e) => setNewContact({ ...newContact, title: e.target.value })}
                  placeholder="e.g. VP Infrastructure"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2 text-on-surface"
                />
              </div>

              <div>
                <label className="text-outline block mb-1">Phone Number (E.164)</label>
                <input
                  type="text"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2 text-on-surface font-mono-code"
                />
              </div>

              <div>
                <label className="text-outline block mb-1">Email Address</label>
                <input
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  placeholder="lead@company.com"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2 text-on-surface font-mono-code"
                />
              </div>

              <div>
                <label className="text-outline block mb-1">Company Name</label>
                <input
                  type="text"
                  value={newContact.company}
                  onChange={(e) => setNewContact({ ...newContact, company: e.target.value })}
                  placeholder="e.g. Acme Corp"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2 text-on-surface"
                />
              </div>

              <div>
                <label className="text-outline block mb-1">ARR Value</label>
                <input
                  type="text"
                  value={newContact.arr}
                  onChange={(e) => setNewContact({ ...newContact, arr: e.target.value })}
                  placeholder="$120,000"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2 text-on-surface font-mono-code"
                />
              </div>

              <div>
                <label className="text-outline block mb-1">Campaign</label>
                <select
                  value={newContact.campaign}
                  onChange={(e) => setNewContact({ ...newContact, campaign: e.target.value })}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2 text-on-surface"
                >
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-outline block mb-1">Priority</label>
                <select
                  value={newContact.priority}
                  onChange={(e) => setNewContact({ ...newContact, priority: e.target.value as any })}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2 text-on-surface"
                >
                  <option value="VIP Enterprise">VIP Enterprise</option>
                  <option value="Mid-Market">Mid-Market</option>
                  <option value="Standard">Standard</option>
                  <option value="Cold">Cold</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-3 py-1.5 rounded bg-surface-container hover:bg-surface-container-high border border-outline-variant text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newContact.name && newContact.phone) {
                    addContact(newContact);
                    setIsAddModalOpen(false);
                  }
                }}
                className="px-4 py-1.5 rounded bg-secondary hover:bg-secondary-container text-on-secondary font-bold text-xs"
              >
                Save Contact
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

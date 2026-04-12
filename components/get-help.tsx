"use client";

import { useState } from "react";
import {
  IconMail,
  IconPhone,
  IconMessageQuestion,
  IconChevronDown,
  IconBook,
  IconUsers,
  IconDevices,
  IconClock,
  IconSettings,
  IconShieldLock,
  IconSearch,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { useProfile } from "@/hooks/use-profile";

const faqItems = [
  {
    category: "Account & Access",
    questions: [
      {
        q: "How do I reset my password?",
        a: 'Go to Settings > Account Security and click "Change password." A password reset link will be sent to your registered email. You can also use the "Forgot Password" option on the login page.',
      },
      {
        q: "How do I change my account email?",
        a: "For security purposes, email changes require administrator approval. Please contact our support team via the Contact Information tab or submit a support ticket.",
      },
      {
        q: "What are the different account types?",
        a: 'The portal supports two account types: Admin (full system access, user management, and data control) and User (read-only access for viewing inventory and logs). Your account type is shown in Settings > Profile.',
      },
      {
        q: "I can't log in to my account. What should I do?",
        a: 'First, try resetting your password. If the issue persists, clear your browser cache and cookies. If you still cannot log in, contact support — your account may be locked or deactivated.',
      },
      {
        q: "Can I sign up for an account myself?",
        a: "New users can register through the Sign Up page. After registration, your account must be approved by an administrator before you can access the system.",
      },
    ],
  },
  {
    category: "QR Scanner & Inventory",
    questions: [
      {
        q: "How do I scan a QR code?",
        a: "Open the DTI QR Scanner app and point your device camera at the QR code. The system will automatically capture the code and log the inventory item. Make sure the QR code is clearly visible and well-lit for accurate scanning.",
      },
      {
        q: "What information is captured when I scan a QR code?",
        a: "The QR code scan captures the item ID, scan timestamp, and user information. This data is logged in the Time Logs section for audit trails and inventory tracking purposes.",
      },
      {
        q: "Can I manage my inventory items manually?",
        a: 'Yes, Admins can manage inventory through the "Manage Data" section. You can add, edit, or delete items. Alternatively, you can bulk import items using the import feature with Excel files.',
      },
      {
        q: "How do I import inventory data in bulk?",
        a: 'Go to "Manage Data" and click the "Import" button. Select an Excel file with your inventory data. The system will validate the file and import all items. Ensure your file follows the required format with columns: Item Name, Description, Category, and Quantity.',
      },
      {
        q: "What should I do if a QR code is not scanning?",
        a: "Ensure the QR code is not damaged or faded. Try cleaning your camera lens and ensuring good lighting. If the issue persists, regenerate the QR code in the system or contact support.",
      },
    ],
  },
  {
    category: "Time Logs & Audit Trail",
    questions: [
      {
        q: "What are Time Logs used for?",
        a: "Time Logs track all scanning activities, including scan timestamps, items scanned, user information, and device details. This creates a complete audit trail for inventory accountability.",
      },
      {
        q: "Can I filter or search Time Logs?",
        a: 'Yes, use the "Time Logs" section to filter by date range, user, or item. You can also search by keywords and export filtered results to CSV for reporting purposes.',
      },
      {
        q: "How long are Time Logs stored?",
        a: "All time logs are stored indefinitely for audit and compliance purposes. Admins can delete logs if needed through the Manage Data section.",
      },
      {
        q: "Can regular users see all Time Logs?",
        a: "No, regular users can only view their own scanning logs. Admins have access to all logs for complete system oversight.",
      },
    ],
  },
  {
    category: "Data Management",
    questions: [
      {
        q: "How do I export data from the system?",
        a: 'Navigate to "Manage Data" and use the export button to download your inventory and logs as a CSV file. You can then use this data in Excel or other business intelligence tools.',
      },
      {
        q: "What happens when I delete inventory data?",
        a: "Deleting inventory items removes them from the active inventory database. However, their scan history in Time Logs is preserved for audit purposes. This ensures compliance and data integrity.",
      },
      {
        q: "Can I restore deleted data?",
        a: "Once deleted, inventory items cannot be automatically restored. However, you can contact support to request recovery from backups if the deletion was recent.",
      },
      {
        q: "How frequently is my data backed up?",
        a: "All data is backed up regularly by our hosting provider. For the latest backup schedule and recovery options, contact your administrator or support team.",
      },
    ],
  },
  {
    category: "Security & Privacy",
    questions: [
      {
        q: "How do I enable two-factor authentication (2FA)?",
        a: "Go to Settings > Account Security and enable the two-factor authentication option. This adds an extra layer of security to your account.",
      },
      {
        q: "Is my scanning data private?",
        a: "All scan data is encrypted and stored securely. Only authorized personnel (admins) can view comprehensive logs. Your personal data is never shared with third parties.",
      },
      {
        q: "Can I see which devices are logged into my account?",
        a: "Visit Settings > Account Security to view all active sessions. You can revoke access to any unrecognized device from this section.",
      },
      {
        q: "What should I do if I suspect unauthorized access?",
        a: "Change your password immediately and enable two-factor authentication. Review your active sessions in Settings and revoke any unrecognized devices. Contact support if suspicious activity continues.",
      },
    ],
  },
  {
    category: "User Management (Admin Only)",
    questions: [
      {
        q: "How do I add a new user?",
        a: "Users can register themselves through the Sign Up page. Once they complete registration, they appear in your Manage Users list. You can then adjust their account type and permissions.",
      },
      {
        q: "How do I change a user's account type?",
        a: 'Go to "Manage Users", find the user, and click the "Edit Permissions" button. Change their account type between Admin and User, then save changes.',
      },
      {
        q: "What's the difference between deleting a profile and deleting a user?",
        a: "Deleting a user profile removes their app data but keeps their authentication record. Completely deleting a user removes both their profile and authentication account from the system.",
      },
      {
        q: "Can I bulk edit user permissions?",
        a: "Currently, user permissions must be edited individually through the Manage Users interface. For bulk operations, please contact support.",
      },
    ],
  },
];

const userGuides = [
  {
    icon: IconBook,
    title: "Getting Started",
    description: "Learn the basics of navigating the DTI QR Scanner system.",
    steps: [
      "Log in with your credentials at the login page.",
      "You will be redirected to the Dashboard, which shows an overview of your system activity.",
      "Use the sidebar to navigate: Dashboard, Manage Users, Manage Data, Time Logs, Settings, and Get Help.",
      "Customize your profile in Settings > Profile with your name and contact information.",
      "Enable security features like 2FA in Settings > Account Security for added protection.",
    ],
  },
  {
    icon: IconBook,
    title: "Scanning QR Codes",
    description: "Master the QR scanning functionality for efficient inventory tracking.",
    steps: [
      "Open your device and access the DTI QR Scanner interface from the main dashboard.",
      "Position the camera over the QR code at a distance of 6-8 inches for optimal recognition.",
      "Ensure adequate lighting - avoid shadows and glare on the QR code.",
      "The system will automatically detect and scan the code when it's clearly visible.",
      "A confirmation message will appear with the item details and timestamp.",
      "All scan data is automatically logged and can be reviewed in Time Logs later.",
    ],
  },
  {
    icon: IconBook,
    title: "Managing Inventory Data",
    description: "How to add, edit, monitor, and organize your inventory items.",
    steps: [
      'Navigate to "Manage Data" from the sidebar (admin access required).',
      'Click "Add Item" to manually create new inventory entries with name, description, category, and quantity.',
      'Use the search and filter options to quickly locate items by name, category, or ID.',
      'Click "Edit" on any item to update its details or quantity.',
      'Use the "Import" feature to bulk upload items from an Excel file (CSV format supported).',
      'View item history including last scan date and scan frequency.',
    ],
  },
  {
    icon: IconUsers,
    title: "Managing Users",
    description: "Admin guide to adding, editing, and managing user accounts and permissions.",
    steps: [
      'Navigate to "Manage Users" from the sidebar (admin access required).',
      "View all registered users in a table with their name, email, role, and status.",
      'Use the search bar to find specific users by name or email.',
      'Click "Edit Permissions" to change a user\'s account type (Admin or User).',
      'Click "Delete Data" to remove a user\'s profile and authentication account completely.',
      "Monitor user activity through their scan logs in the Time Logs section.",
      "Only admins can perform user management actions.",
    ],
  },
  {
    icon: IconClock,
    title: "Time Logs & Audit Trail",
    description: "Track, analyze, and export all scanning activities for compliance and reporting.",
    steps: [
      'Navigate to "Time Logs" from the sidebar to view all scanning records.',
      "Each log entry shows: timestamp, user who performed the scan, item scanned, and device used.",
      'Use date range filters to find logs within a specific period.',
      "Filter by user to see individual scanning patterns and activity.",
      'Filter by item to view the complete scan history for specific inventory.',
      "Use the export function to download logs as a CSV file for reporting or analysis.",
      "Admins can see all logs; regular users see only their own activity.",
    ],
  },
  {
    icon: IconSettings,
    title: "Settings & Preferences",
    description: "Configure your profile, security settings, and account preferences.",
    steps: [
      'Go to "Settings" from the sidebar.',
      "In the Profile tab, update your name, email, and other personal information.",
      "In Account Security, manage your password and enable two-factor authentication.",
      "Review active sessions and revoke access to devices you no longer use.",
      "Check the Security Best Practices section for recommended security measures.",
      "All changes are saved automatically and take effect immediately.",
    ],
  },
  {
    icon: IconShieldLock,
    title: "Security Best Practices",
    description: "Keep your account and inventory data safe with these essential security tips.",
    steps: [
      "Use a strong password with at least 12 characters including numbers, symbols, and letters.",
      "Enable two-factor authentication (2FA) in Security Settings for an extra security layer.",
      "Review your active sessions regularly and remove unrecognized devices.",
      "Never share your login credentials with colleagues or write them down.",
      "Log out from public computers and always use secure internet connections.",
      "Be cautious of phishing emails requesting account information.",
      "Contact support immediately if you suspect unauthorized access.",
    ],
  },
  {
    icon: IconBook,
    title: "Importing Bulk Data",
    description: "Efficiently import large quantities of inventory data using Excel files.",
    steps: [
      'Go to "Manage Data" and click the "Import" button.',
      "Prepare your Excel file with required columns: Item Name, Description, Category, Quantity.",
      "Ensure each row represents one inventory item with complete information.",
      "Click 'Choose File' and select your prepared Excel file.",
      "Preview the import data to verify accuracy before confirming.",
      "Click 'Import' to add all items to your inventory database.",
      "Check the import summary report for any items that failed to import.",
    ],
  },
  {
    icon: IconBook,
    title: "Exporting Data & Reports",
    description: "Export inventory and scan data for analysis, reporting, and backup purposes.",
    steps: [
      'Navigate to "Manage Data" or "Time Logs" section.',
      "Apply any filters (date range, user, item type) to the data you want to export.",
      "Click the 'Export' button at the top of the table.",
      "Choose your preferred format (usually CSV for Excel compatibility).",
      "The file will download automatically to your device.",
      "Open the exported file in Excel, Google Sheets, or other spreadsheet applications.",
      "Use the exported data for analysis, reporting, or backup storage.",
    ],
  },
  {
    icon: IconBook,
    title: "Dashboard Overview",
    description: "Understand the key metrics and information displayed on your dashboard.",
    steps: [
      "The Dashboard displays real-time statistics about your inventory system.",
      "Key metrics include total items, recent scans, active users, and system status.",
      "View recent activity logs with the latest scanning events.",
      "Check quick stats cards for at-a-glance information.",
      "Use dashboard insights to identify scanning trends and inventory movements.",
      "Refresh the page to see the latest updates and statistics.",
    ],
  },
];

export function GetHelp() {
  const [activeTab, setActiveTab] = useState("contact");
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [expandedGuide, setExpandedGuide] = useState<number | null>(null);
  const [faqSearch, setFaqSearch] = useState("");

  // Get user profile
  const { data: userProfile } = useProfile();

  // Ticket form state
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketCategory, setTicketCategory] = useState("general");
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitTicket = async () => {
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      toast.error("Please fill in both subject and message");
      return;
    }

    if (!userProfile?.email) {
      toast.error("Unable to retrieve your email. Please try again.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/support/send-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: ticketSubject,
          message: ticketMessage,
          category: ticketCategory,
          userEmail: userProfile.email,
          userName: `${userProfile.firstname || "User"} ${userProfile.lastname || ""}`.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error("Failed to send ticket: " + (error.error || "Unknown error"));
        setIsSubmitting(false);
        return;
      }

      toast.success("Support ticket sent successfully! We'll get back to you within 24 hours.");
      setTicketSubject("");
      setTicketMessage("");
      setTicketCategory("general");
      setShowTicketForm(false);
    } catch (error) {
      toast.error("Error sending ticket: " + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredFaq = faqItems
    .map((cat) => ({
      ...cat,
      questions: cat.questions.filter(
        (item) =>
          item.q.toLowerCase().includes(faqSearch.toLowerCase()) ||
          item.a.toLowerCase().includes(faqSearch.toLowerCase())
      ),
    }))
    .filter((cat) => cat.questions.length > 0);

  return (
    <div className="flex h-[calc(100vh-theme(spacing.4))] w-full gap-6 p-4 text-foreground">
      {/* Help Navigation Sidebar */}
      <div className="w-64 shrink-0 flex flex-col gap-2">
        <h2 className="px-3 text-base font-semibold mb-2">Help & Support</h2>
        <nav className="flex flex-col gap-1">
          <button
            onClick={() => setActiveTab("contact")}
            className={`flex w-full items-center rounded-lg px-3 py-2 text-sm transition-colors text-left ${activeTab === "contact" ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`}
          >
            Contact Information
          </button>
          <button
            onClick={() => setActiveTab("faq")}
            className={`flex w-full items-center rounded-lg px-3 py-2 text-sm transition-colors text-left ${activeTab === "faq" ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`}
          >
            Frequently Asked Questions
          </button>
          <button
            onClick={() => setActiveTab("guides")}
            className={`flex w-full items-center rounded-lg px-3 py-2 text-sm transition-colors text-left ${activeTab === "guides" ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`}
          >
            User Guides
          </button>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto rounded-3xl bg-sidebar p-8 shadow-sm border border-border">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-semibold mb-8">
            {activeTab === "contact" && "Get in Touch"}
            {activeTab === "faq" && "Frequently Asked Questions"}
            {activeTab === "guides" && "Platform Guides"}
          </h1>

          <div className="space-y-8">
            {/* ===================== CONTACT TAB ===================== */}
            {activeTab === "contact" && (
              <>
                <section>
                  <h3 className="text-sm font-semibold mb-4 text-foreground">Contact Support</h3>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between rounded-xl bg-background/50 border border-border p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sidebar-accent border border-border">
                          <IconMail className="h-5 w-5 opacity-70" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium">Email Support</span>
                          <span className="text-xs text-muted-foreground">Average response time: 24 hours</span>
                        </div>
                      </div>
                      <div className="text-sm font-medium">itcgeek03@gmail.com</div>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-background/50 border border-border p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sidebar-accent border border-border">
                          <IconPhone className="h-5 w-5 opacity-70" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium">Call Us</span>
                          <span className="text-xs text-muted-foreground">Mon-Fri, 9am - 6pm PHT</span>
                        </div>
                      </div>
                      <div className="text-sm font-medium">0991-855-2251</div>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-semibold mb-4 text-foreground">Direct Message</h3>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between rounded-xl bg-background/50 border border-border p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sidebar-accent border border-border">
                          <IconMessageQuestion className="h-5 w-5 opacity-70" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium">Send a Message</span>
                          <span className="text-xs text-muted-foreground">Create a support ticket directly from the portal</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowTicketForm(!showTicketForm)}
                        className="rounded-full bg-sidebar-accent hover:bg-sidebar-accent/80 text-foreground px-4 py-2 text-xs font-medium transition-colors border border-border"
                      >
                        {showTicketForm ? "Cancel" : "New Ticket"}
                      </button>
                    </div>

                    {/* Ticket Form */}
                    {showTicketForm && (
                      <div className="rounded-xl bg-background/50 border border-border p-6 space-y-4">
                        <h4 className="text-sm font-semibold">New Support Ticket</h4>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-medium text-muted-foreground">Category</label>
                          <select
                            value={ticketCategory}
                            onChange={(e) => setTicketCategory(e.target.value)}
                            className="rounded-lg bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <option value="general">General Inquiry</option>
                            <option value="account">Account Issue</option>
                            <option value="bug">Bug Report</option>
                            <option value="feature">Feature Request</option>
                            <option value="billing">Billing</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-medium text-muted-foreground">Subject</label>
                          <input
                            type="text"
                            value={ticketSubject}
                            onChange={(e) => setTicketSubject(e.target.value)}
                            placeholder="Brief description of your issue"
                            className="rounded-lg bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-medium text-muted-foreground">Message</label>
                          <textarea
                            value={ticketMessage}
                            onChange={(e) => setTicketMessage(e.target.value)}
                            placeholder="Describe your issue in detail..."
                            rows={5}
                            className="rounded-lg bg-background border border-border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div className="flex justify-end">
                          <button
                            onClick={handleSubmitTicket}
                            disabled={isSubmitting}
                            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 text-sm font-medium transition-colors"
                          >
                            {isSubmitting ? "Sending..." : "Submit Ticket"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* Office hours */}
                <section>
                  <h3 className="text-sm font-semibold mb-4 text-foreground">Office Hours</h3>
                  <div className="rounded-xl bg-background/50 border border-border p-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Monday - Friday</span>
                        <span className="font-medium">9:00 AM - 6:00 PM</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Saturday</span>
                        <span className="font-medium">9:00 AM - 12:00 PM</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sunday</span>
                        <span className="font-medium text-muted-foreground">Closed</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Timezone</span>
                        <span className="font-medium">PHT (UTC+8)</span>
                      </div>
                    </div>
                  </div>
                </section>
              </>
            )}

            {/* ===================== FAQ TAB ===================== */}
            {activeTab === "faq" && (
              <>
                {/* Search */}
                <div className="relative">
                  <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={faqSearch}
                    onChange={(e) => setFaqSearch(e.target.value)}
                    placeholder="Search frequently asked questions..."
                    className="w-full rounded-xl bg-background/50 border border-border pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {filteredFaq.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <IconSearch className="h-10 w-10 text-muted-foreground mb-3" />
                    <h3 className="text-base font-medium">No results found</h3>
                    <p className="text-sm text-muted-foreground mt-1">Try different keywords or browse all questions by clearing the search.</p>
                  </div>
                ) : (
                  filteredFaq.map((category) => (
                    <section key={category.category}>
                      <h3 className="text-sm font-semibold mb-3 text-foreground">{category.category}</h3>
                      <div className="flex flex-col gap-2">
                        {category.questions.map((item) => {
                          const faqKey = `${category.category}-${item.q}`;
                          const isOpen = openFaq === faqKey;
                          return (
                            <div
                              key={faqKey}
                              className="rounded-xl bg-background/50 border border-border overflow-hidden"
                            >
                              <button
                                onClick={() => setOpenFaq(isOpen ? null : faqKey)}
                                className="flex w-full items-center justify-between p-4 text-left text-sm font-medium hover:bg-sidebar-accent/50 transition-colors"
                              >
                                <span>{item.q}</span>
                                <IconChevronDown
                                  className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                                />
                              </button>
                              {isOpen && (
                                <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border pt-3">
                                  {item.a}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  ))
                )}

                {/* Still need help */}
                <section className="rounded-xl bg-background/50 border border-border p-6 text-center">
                  <h3 className="text-base font-medium mb-1">Still have questions?</h3>
                  <p className="text-sm text-muted-foreground mb-4">Can&apos;t find what you&apos;re looking for? Our support team is here to help.</p>
                  <button
                    onClick={() => setActiveTab("contact")}
                    className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 text-sm font-medium transition-colors"
                  >
                    Contact Support
                  </button>
                </section>
              </>
            )}

            {/* ===================== USER GUIDES TAB ===================== */}
            {activeTab === "guides" && (
              <>
                <p className="text-sm text-muted-foreground -mt-4 mb-6">
                  Step-by-step guides to help you make the most of the DTI.
                </p>

                <div className="flex flex-col gap-4">
                  {userGuides.map((guide, index) => {
                    const Icon = guide.icon;
                    const isExpanded = expandedGuide === index;
                    return (
                      <div
                        key={guide.title}
                        className="rounded-xl bg-background/50 border border-border overflow-hidden"
                      >
                        <button
                          onClick={() => setExpandedGuide(isExpanded ? null : index)}
                          className="flex w-full items-center gap-4 p-4 text-left hover:bg-sidebar-accent/50 transition-colors"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sidebar-accent border border-border">
                            <Icon className="h-5 w-5 opacity-70" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium block">{guide.title}</span>
                            <span className="text-xs text-muted-foreground">{guide.description}</span>
                          </div>
                          <IconChevronDown
                            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                          />
                        </button>
                        {isExpanded && (
                          <div className="px-4 pb-4 border-t border-border pt-4">
                            <ol className="space-y-3">
                              {guide.steps.map((step, stepIndex) => (
                                <li key={stepIndex} className="flex items-start gap-3 text-sm">
                                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                                    {stepIndex + 1}
                                  </span>
                                  <span className="text-muted-foreground leading-relaxed pt-0.5">{step}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Quick links */}
                <section>
                  <h3 className="text-sm font-semibold mb-3 text-foreground">Quick Links</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setActiveTab("faq")}
                      className="rounded-xl bg-background/50 border border-border p-4 text-left hover:bg-sidebar-accent/50 transition-colors"
                    >
                      <span className="text-sm font-medium block">FAQ</span>
                      <span className="text-xs text-muted-foreground">Browse common questions</span>
                    </button>
                    <button
                      onClick={() => setActiveTab("contact")}
                      className="rounded-xl bg-background/50 border border-border p-4 text-left hover:bg-sidebar-accent/50 transition-colors"
                    >
                      <span className="text-sm font-medium block">Contact Us</span>
                      <span className="text-xs text-muted-foreground">Get in touch with support</span>
                    </button>
                  </div>
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GetHelp;

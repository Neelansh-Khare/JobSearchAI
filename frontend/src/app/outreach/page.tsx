'use client';

import { useState } from 'react';
import GlassCard from '@/components/GlassCard';
import GlassButton from '@/components/GlassButton';
import { JobSearchAPI, ContactResponsePayload } from '@/services/api'; // Assuming JobSearchAPI exists

export default function OutreachPage() {
  // State for email generation form
  const [emailPurpose, setEmailPurpose] = useState('');
  const [emailTone, setEmailTone] = useState('professional');
  const [recipientName, setRecipientName] = useState('');
  const [recipientCompany, setRecipientCompany] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');

  // State for contact finding form
  const [companyType, setCompanyType] = useState('');
  const [roleTypes, setRoleTypes] = useState(''); // Comma separated string
  const [location, setLocation] = useState('');
  const [useLinkedin, setUseLinkedin] = useState(false);
  const [foundContacts, setFoundContacts] = useState<ContactResponsePayload[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsError, setContactsError] = useState('');

  // Shared outreach states
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [sendSuccess, setSendSuccess] = useState('');

  const handleGenerateEmail = async () => {
    setEmailLoading(true);
    setEmailError('');
    setGeneratedEmail('');
    setSendSuccess('');
    try {
      const response = await JobSearchAPI.generateEmail({
        purpose: emailPurpose,
        tone: emailTone,
        recipient_name: recipientName,
        recipient_company: recipientCompany,
        additional_context: additionalContext,
      });

      const content = response.email_content;

      // Try to extract subject
      if (content.startsWith('Subject:')) {
        const lines = content.split('\n');
        const subjectLine = lines[0].replace('Subject:', '').trim();
        setEmailSubject(subjectLine);
        // The rest is the body
        setGeneratedEmail(lines.slice(1).join('\n').trim());
      } else {
        setEmailSubject(`Outreach to ${recipientCompany}`);
        setGeneratedEmail(content);
      }
    } catch (err: unknown) {
      setEmailError(err instanceof Error ? err.message : 'Failed to generate email.');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!recipientEmail) {
      setEmailError('Recipient email is required to send.');
      return;
    }
    setSendLoading(true);
    setEmailError('');
    setSendSuccess('');
    try {
      await JobSearchAPI.sendEmail({
        recipient_email: recipientEmail,
        subject: emailSubject,
        body: generatedEmail,
        user_id: 1, // Hardcoded for now
      });
      setSendSuccess('Email sent successfully via Gmail!');
    } catch (err: unknown) {
      setEmailError(err instanceof Error ? err.message : 'Failed to send email.');
    } finally {
      setSendLoading(false);
    }
  };

  const handleFindContacts = async () => {
    setContactsLoading(true);
    setContactsError('');
    setFoundContacts([]);
    try {
      const rolesArray = roleTypes.split(',').map(role => role.trim()).filter(role => role !== '');
      const response = await JobSearchAPI.findContacts({
        company_type: companyType,
        role_types: rolesArray,
        location,
        use_linkedin: useLinkedin,
        max_results: 5, // Default for now
      });
      setFoundContacts(response);
    } catch (err: unknown) {
      setContactsError(err instanceof Error ? err.message : 'Failed to find contacts.');
    } finally {
      setContactsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-8 text-center text-indigo-400">Outreach Automation</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl mx-auto">
        {/* Email Generation Card */}
        <GlassCard className="p-6">
          <h2 className="text-2xl font-semibold mb-4 text-indigo-300">Generate Email</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="emailPurpose" className="block text-sm font-medium text-gray-300">Purpose</label>
              <input
                type="text"
                id="emailPurpose"
                className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-white"
                value={emailPurpose}
                onChange={(e) => setEmailPurpose(e.target.value)}
                placeholder="e.g., Cold outreach for a software engineer role"
              />
            </div>
            <div>
              <label htmlFor="emailTone" className="block text-sm font-medium text-gray-300">Tone</label>
              <select
                id="emailTone"
                className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-white"
                value={emailTone}
                onChange={(e) => setEmailTone(e.target.value)}
              >
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="assertive">Assertive</option>
              </select>
            </div>
            <div>
              <label htmlFor="recipientName" className="block text-sm font-medium text-gray-300">Recipient Name</label>
              <input
                type="text"
                id="recipientName"
                className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-white"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="e.g., Jane Doe"
              />
            </div>
            <div>
              <label htmlFor="recipientCompany" className="block text-sm font-medium text-gray-300">Recipient Company</label>
              <input
                type="text"
                id="recipientCompany"
                className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-white"
                value={recipientCompany}
                onChange={(e) => setRecipientCompany(e.target.value)}
                placeholder="e.g., Google"
              />
            </div>
            <div>
              <label htmlFor="additionalContext" className="block text-sm font-medium text-gray-300">Additional Context (Optional)</label>
              <textarea
                id="additionalContext"
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-white"
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                placeholder="e.g., Referencing a recent project or mutual connection."
              ></textarea>
            </div>
            <GlassButton
              onClick={handleGenerateEmail}
              disabled={emailLoading}
              className="w-full text-lg"
            >
              {emailLoading ? 'Generating...' : 'Generate Email'}
            </GlassButton>
            {emailError && <p className="text-red-400 text-sm mt-2">{emailError}</p>}
            {generatedEmail && (
              <div className="mt-4 p-4 bg-gray-800 rounded-md border border-gray-700 space-y-4">
                <h3 className="text-xl font-medium mb-2 text-indigo-200">Generated Email:</h3>
                
                <div>
                  <label htmlFor="emailSubject" className="block text-xs font-medium text-gray-400">Subject</label>
                  <input
                    type="text"
                    id="emailSubject"
                    className="mt-1 block w-full rounded-md border-gray-700 bg-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-white text-sm"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="recipientEmail" className="block text-xs font-medium text-gray-400">Recipient Email</label>
                  <input
                    type="email"
                    id="recipientEmail"
                    className="mt-1 block w-full rounded-md border-gray-700 bg-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-white text-sm"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="e.g., jane@company.com"
                  />
                </div>

                <div>
                  <label htmlFor="emailBody" className="block text-xs font-medium text-gray-400">Body</label>
                  <textarea
                    id="emailBody"
                    rows={10}
                    className="mt-1 block w-full rounded-md border-gray-700 bg-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-white text-sm font-mono"
                    value={generatedEmail}
                    onChange={(e) => setGeneratedEmail(e.target.value)}
                  ></textarea>
                </div>

                <div className="flex space-x-2">
                  <GlassButton
                    onClick={() => navigator.clipboard.writeText(`Subject: ${emailSubject}\n\n${generatedEmail}`)}
                    className="flex-1 px-4 py-2 text-sm"
                  >
                    Copy to Clipboard
                  </GlassButton>
                  <GlassButton
                    onClick={handleSendEmail}
                    disabled={sendLoading}
                    className="flex-1 px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700"
                  >
                    {sendLoading ? 'Sending...' : 'Send via Gmail'}
                  </GlassButton>
                </div>
                {sendSuccess && <p className="text-green-400 text-sm mt-2">{sendSuccess}</p>}
              </div>
            )}
          </div>
        </GlassCard>

        {/* Contact Finding Card */}
        <GlassCard className="p-6">
          <h2 className="text-2xl font-semibold mb-4 text-indigo-300">Find Contacts</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="companyType" className="block text-sm font-medium text-gray-300">Company Type</label>
              <input
                type="text"
                id="companyType"
                className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-white"
                value={companyType}
                onChange={(e) => setCompanyType(e.target.value)}
                placeholder="e.g., Big Tech, Startup, Fintech"
              />
            </div>
            <div>
              <label htmlFor="roleTypes" className="block text-sm font-medium text-gray-300">Role Types (comma-separated)</label>
              <input
                type="text"
                id="roleTypes"
                className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-white"
                value={roleTypes}
                onChange={(e) => setRoleTypes(e.target.value)}
                placeholder="e.g., Hiring Manager, Staff Engineer, Recruiter"
              />
            </div>
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-300">Location</label>
              <input
                type="text"
                id="location"
                className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-white"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., San Francisco, CA"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="useLinkedin"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-700 rounded bg-gray-800"
                checked={useLinkedin}
                onChange={(e) => setUseLinkedin(e.target.checked)}
              />
              <label htmlFor="useLinkedin" className="ml-2 block text-sm font-medium text-gray-300">
                Search LinkedIn (requires Apify API Key configured in backend)
              </label>
            </div>
            <GlassButton
              onClick={handleFindContacts}
              disabled={contactsLoading}
              className="w-full text-lg"
            >
              {contactsLoading ? 'Finding...' : 'Find Contacts'}
            </GlassButton>
            {contactsError && <p className="text-red-400 text-sm mt-2">{contactsError}</p>}
            {foundContacts.length > 0 && (
              <div className="mt-4 p-4 bg-gray-800 rounded-md border border-gray-700">
                <h3 className="text-xl font-medium mb-2 text-indigo-200">Found Contacts:</h3>
                <ul className="list-disc pl-5 space-y-2 text-gray-100">
                  {foundContacts.map((contact, index) => (
                    <li key={index}>
                      <strong>{contact.name}</strong> - {contact.title} at {contact.company} ({contact.location})
                      {contact.linkedin_url && (
                        <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline ml-2 text-sm">LinkedIn</a>
                      )}
                      <span className="ml-2 text-xs text-gray-400">({contact.source})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

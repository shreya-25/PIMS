# Example: Adding Version History Button to Existing Pages

## Quick Examples

### Example 1: Add to Lead Info Page

```jsx
// In your LeadInfo.jsx or similar page

import React, { useContext } from "react";
import { CaseContext } from "../CaseContext";
import { VersionHistoryButton } from "../../components/VersionHistoryButton/VersionHistoryButton";

export const LeadInfo = () => {
  const { selectedLead } = useContext(CaseContext);

  return (
    <div className="lead-info-container">
      <div className="lead-header">
        <h2>Lead Information - {selectedLead?.leadName}</h2>

        {/* Add the version history button here */}
        <VersionHistoryButton leadNo={selectedLead?.leadNo} />
      </div>

      {/* Your existing lead info content */}
      <div className="lead-details">
        <p>Lead No: {selectedLead?.leadNo}</p>
        <p>Description: {selectedLead?.description}</p>
        {/* ... more content ... */}
      </div>
    </div>
  );
};
```

### Example 2: Add to Lead Return Finish Page

```jsx
// In your LRFinish.jsx or CMFinish.jsx

import React, { useContext } from "react";
import { CaseContext } from "../../CaseContext";
import { VersionHistoryButton } from "../../../components/VersionHistoryButton/VersionHistoryButton";

export const LRFinish = () => {
  const { selectedLead } = useContext(CaseContext);

  const handleSubmit = async () => {
    // Your existing submit logic
    // ...

    alert("Lead return submitted successfully!");
  };

  return (
    <div className="finish-page">
      <h2>Review and Submit</h2>

      <div className="action-buttons">
        <button className="btn-submit" onClick={handleSubmit}>
          Submit Lead Return
        </button>

        {/* Add version history button */}
        <VersionHistoryButton
          leadNo={selectedLead?.leadNo}
          className="outline"
          label="View Previous Versions"
        />
      </div>

      {/* Your existing summary content */}
    </div>
  );
};
```

### Example 3: Add to Leads Desk

```jsx
// In your LeadsDesk.jsx or similar dashboard

import React, { useState } from "react";
import { VersionHistoryButton } from "../../components/VersionHistoryButton/VersionHistoryButton";

export const LeadsDesk = () => {
  const [leads, setLeads] = useState([]);

  return (
    <div className="leads-desk">
      <h1>My Leads</h1>

      <table className="leads-table">
        <thead>
          <tr>
            <th>Lead No</th>
            <th>Description</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.leadNo}>
              <td>{lead.leadNo}</td>
              <td>{lead.description}</td>
              <td>{lead.status}</td>
              <td>
                {/* Add version history button in each row */}
                <VersionHistoryButton
                  leadNo={lead.leadNo}
                  className="small outline"
                  label="History"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

### Example 4: Add to Sidebar Navigation

```jsx
// In your Slidebar.jsx or navigation component

import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { CaseContext } from "../../Pages/CaseContext";

export const Slidebar = () => {
  const navigate = useNavigate();
  const { selectedLead } = useContext(CaseContext);

  const menuItems = [
    { label: "Dashboard", path: "/HomePage", icon: "📊" },
    { label: "Cases", path: "/CasePageManager", icon: "📁" },
    { label: "Leads", path: "/LeadsDesk", icon: "🎯" },
    { label: "Search", path: "/SearchLead", icon: "🔍" },

    // Add version history to menu
    {
      label: "Version History",
      path: "/LeadVersionHistory",
      icon: "🕐",
      disabled: !selectedLead?.leadNo // Disable if no lead selected
    },
  ];

  return (
    <div className="sidebar">
      {menuItems.map((item) => (
        <button
          key={item.path}
          className={`menu-item ${item.disabled ? 'disabled' : ''}`}
          onClick={() => !item.disabled && navigate(item.path)}
          disabled={item.disabled}
        >
          <span className="icon">{item.icon}</span>
          <span className="label">{item.label}</span>
        </button>
      ))}
    </div>
  );
};
```

### Example 5: Add to Case Manager Review Page

```jsx
// In your CMReturn.jsx or review page

import React, { useContext, useState } from "react";
import { CaseContext } from "../../CaseContext";
import { VersionHistoryButton } from "../../../components/VersionHistoryButton/VersionHistoryButton";

export const CMReturn = () => {
  const { selectedLead } = useContext(CaseContext);
  const [decision, setDecision] = useState("");

  const handleApprove = async () => {
    // Approve logic
  };

  const handleReturn = async () => {
    // Return logic (triggers "Returned" snapshot automatically)
  };

  return (
    <div className="cm-return">
      <div className="header-with-history">
        <h2>Review Lead Return</h2>

        {/* Show version history for context */}
        <VersionHistoryButton
          leadNo={selectedLead?.leadNo}
          label="View History & Compare"
        />
      </div>

      <div className="review-section">
        {/* Your existing review content */}
        <p>Review the submitted information...</p>

        <div className="decision-buttons">
          <button className="btn-approve" onClick={handleApprove}>
            Approve
          </button>
          <button className="btn-return" onClick={handleReturn}>
            Return for Revisions
          </button>
        </div>
      </div>
    </div>
  );
};
```

### Example 6: Direct Navigation Link

```jsx
// Anywhere in your app

import { Link } from "react-router-dom";

function YourComponent() {
  return (
    <div>
      {/* As a React Router Link */}
      <Link to="/LeadVersionHistory" className="version-link">
        📜 View Version History
      </Link>

      {/* Or as a regular link */}
      <a href="/LeadVersionHistory" className="version-link">
        📜 View Version History
      </a>

      {/* Or programmatically */}
      <button onClick={() => window.location.href = '/LeadVersionHistory'}>
        Go to Version History
      </button>
    </div>
  );
}
```

## Styling the Button in Your Page

### Option 1: Use Built-in Variants

```jsx
{/* Default purple gradient */}
<VersionHistoryButton leadNo={leadNo} />

{/* Outline style */}
<VersionHistoryButton leadNo={leadNo} className="outline" />

{/* Small size */}
<VersionHistoryButton leadNo={leadNo} className="small" />

{/* Combine classes */}
<VersionHistoryButton leadNo={leadNo} className="small outline" />

{/* Icon only (circular button) */}
<VersionHistoryButton leadNo={leadNo} className="icon-only" />
```

### Option 2: Custom Styling

```jsx
// Add custom class
<VersionHistoryButton
  leadNo={leadNo}
  className="my-custom-style"
/>

// In your CSS file
.my-custom-style {
  background: #your-color !important;
  border-radius: 4px;
  padding: 8px 16px;
}
```

### Option 3: Inline Styles

```jsx
<div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
  <h3>Lead #{leadNo}</h3>
  <VersionHistoryButton leadNo={leadNo} className="small" />
</div>
```

## Complete Page Example

Here's a complete example with everything integrated:

```jsx
import React, { useContext, useEffect, useState } from "react";
import { CaseContext } from "../CaseContext";
import { VersionHistoryButton } from "../../components/VersionHistoryButton/VersionHistoryButton";
import api from "../../api";
import "./LeadDetails.css";

export const LeadDetails = () => {
  const { selectedLead, selectedCase } = useContext(CaseContext);
  const [leadData, setLeadData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedLead?.leadNo) {
      fetchLeadData();
    }
  }, [selectedLead]);

  const fetchLeadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await api.get(`/api/lead/${selectedLead.leadNo}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLeadData(data);
    } catch (error) {
      console.error("Error fetching lead data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedLead) {
    return <div className="no-lead">Please select a lead</div>;
  }

  return (
    <div className="lead-details-page">
      {/* Header with title and version button */}
      <div className="page-header">
        <div className="title-section">
          <h1>Lead Details</h1>
          <div className="lead-meta">
            <span className="lead-number">#{selectedLead.leadNo}</span>
            <span className="case-name">{selectedCase?.caseName}</span>
          </div>
        </div>

        {/* Version History Button */}
        <VersionHistoryButton
          leadNo={selectedLead.leadNo}
          label="View History"
        />
      </div>

      {/* Main content */}
      <div className="lead-content">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <>
            <section className="info-section">
              <h2>Basic Information</h2>
              <p><strong>Description:</strong> {leadData?.description}</p>
              <p><strong>Status:</strong> {leadData?.status}</p>
              <p><strong>Assigned To:</strong> {leadData?.assignedTo}</p>
            </section>

            {/* More sections... */}
          </>
        )}
      </div>

      {/* Footer actions */}
      <div className="page-footer">
        <button className="btn-edit">Edit Lead</button>
        <button className="btn-delete">Delete Lead</button>

        {/* Smaller version button in footer */}
        <VersionHistoryButton
          leadNo={selectedLead.leadNo}
          className="small outline"
        />
      </div>
    </div>
  );
};
```

```css
/* LeadDetails.css */

.lead-details-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #eee;
}

.title-section h1 {
  margin: 0 0 10px 0;
  font-size: 28px;
}

.lead-meta {
  display: flex;
  gap: 15px;
  font-size: 14px;
  color: #666;
}

.lead-number {
  font-weight: 600;
  color: #667eea;
}

.page-footer {
  display: flex;
  gap: 15px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 2px solid #eee;
}
```

## Tips

1. **Place the button prominently** where users would naturally look for history
2. **Use the outline variant** when you want it to be less prominent
3. **Use the small variant** in tables or compact layouts
4. **Use the icon-only variant** in very tight spaces
5. **Disable the button** when no lead is selected (button handles this automatically)
6. **Add tooltips** for better UX (button has built-in title attribute)

## Common Placements

✅ **Good places to add the button:**
- Lead detail/info pages
- Lead return finish/submit pages
- Case manager review pages
- Leads dashboard/table
- Navigation sidebar (when lead is selected)
- Lead header sections

❌ **Not recommended:**
- Pages where no lead is selected
- Very small mobile viewports (use icon-only variant)
- Login/registration pages
- General admin pages without lead context

---

**Ready to integrate!** Choose the example that fits your page structure best and customize as needed. 🚀

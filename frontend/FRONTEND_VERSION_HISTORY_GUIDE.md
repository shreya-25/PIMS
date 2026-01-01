# Frontend - Lead Version History Guide

## 🎉 What's Been Created

A complete React component to view and compare lead return versions.

## Files Created

1. **[LeadVersionHistory.jsx](src/Pages/LeadVersionHistory/LeadVersionHistory.jsx)** - Main component
2. **[LeadVersionHistory.css](src/Pages/LeadVersionHistory/LeadVersionHistory.css)** - Styling

## Route Added

The component is now accessible at:
```
/LeadVersionHistory
```

## Features

### 1. **Version History List**
- Shows all versions of the selected lead
- Displays version number, reason, creation date, and creator
- Shows current version badge
- Displays item counts for each category (persons, vehicles, etc.)

### 2. **View Version Details**
- Click "View Details" on any version to see full snapshot
- Shows complete lead return data at that point in time
- Lists all persons, vehicles, evidence, timeline events, etc.

### 3. **Compare Versions**
- Click "Compare Versions" button
- Select two versions to compare
- Shows what changed between versions
- Displays item count differences

### 4. **Manual Snapshot**
- Click "Create Manual Snapshot" button
- Creates a snapshot of the current state

## How to Use

### Access the Page

Navigate to the version history page:
```javascript
// From your navigation/menu
window.location.href = '/LeadVersionHistory';

// Or using React Router Link
<Link to="/LeadVersionHistory">View Version History</Link>
```

### Prerequisites

You must have:
1. Selected a lead (via `CaseContext`)
2. The lead must have `leadNo` property

### Adding to Navigation Menu

You can add a link to your navigation/sidebar. For example:

```jsx
import { useNavigate } from 'react-router-dom';

function YourNavigationComponent() {
  const navigate = useNavigate();

  return (
    <button onClick={() => navigate('/LeadVersionHistory')}>
      Version History
    </button>
  );
}
```

Or if you're using a sidebar component, add an option like:

```jsx
<MenuItem onClick={() => navigate('/LeadVersionHistory')}>
  <HistoryIcon />
  View Version History
</MenuItem>
```

## Component Usage

The component automatically:
1. Reads `selectedLead` from `CaseContext`
2. Fetches version history when lead is selected
3. Displays all versions with details

### Example Integration in Existing Page

If you want to show version history as part of another page:

```jsx
import { LeadVersionHistory } from './Pages/LeadVersionHistory/LeadVersionHistory';

function YourLeadDetailsPage() {
  return (
    <div>
      <h1>Lead Details</h1>
      {/* Your existing content */}

      <div className="version-section">
        <LeadVersionHistory />
      </div>
    </div>
  );
}
```

## API Calls Made

The component makes these API calls:

1. **Get Version History**
   ```
   GET /api/leadreturn-versions/{leadNo}/history
   ```

2. **Get Specific Version Details**
   ```
   GET /api/leadreturn-versions/{leadNo}/version/{versionId}
   ```

3. **Compare Versions**
   ```
   GET /api/leadreturn-versions/{leadNo}/compare/{fromId}/{toId}
   ```

4. **Create Manual Snapshot**
   ```
   POST /api/leadreturn-versions/{leadNo}/snapshot
   ```

## Styling

The component includes:
- Responsive design (mobile-friendly)
- Color-coded status badges
- Gradient header
- Smooth animations
- Interactive cards

Colors used:
- Primary: `#667eea` (purple)
- Success: `#22c55e` (green)
- Current version: Green border
- Selected version: Purple background

## Customization

### Change Colors

Edit [LeadVersionHistory.css](src/Pages/LeadVersionHistory/LeadVersionHistory.css):

```css
/* Change primary color */
.version-history-header {
  background: linear-gradient(135deg, #YOUR_COLOR 0%, #YOUR_COLOR2 100%);
}

/* Change button color */
.btn-primary {
  color: #YOUR_COLOR;
}
```

### Add More Details

In [LeadVersionHistory.jsx](src/Pages/LeadVersionHistory/LeadVersionHistory.jsx), add more sections:

```jsx
{versionDetails.audios?.length > 0 && (
  <div className="details-section">
    <h6>Audios ({versionDetails.audios.length})</h6>
    <ul>
      {versionDetails.audios.map((audio, idx) => (
        <li key={idx}>{audio.audioDescription}</li>
      ))}
    </ul>
  </div>
)}
```

## Screenshots (What It Looks Like)

### Version List View
- Purple gradient header with lead info
- List of version cards showing:
  - Version number with "Current" badge
  - Creation date and creator
  - Status badge (Assigned, Returned, etc.)
  - Reason badge (Created, Reopened, etc.)
  - Item counts grid

### Compare Mode
- Two dropdown selectors
- Comparison results showing:
  - Side-by-side version info
  - Changes table with +/- indicators
  - Green for additions, red for deletions

### Version Details (Expanded)
- Full lead return information
- Categorized lists of all related data
- Chronological timeline events
- Person/vehicle details

## Testing

1. **Select a Lead**
   - Use your existing lead selection mechanism
   - Ensure `selectedLead.leadNo` is set

2. **Navigate to Version History**
   ```
   http://localhost:3000/LeadVersionHistory
   ```

3. **Create a Test Snapshot**
   - Click "Create Manual Snapshot"
   - Should see new version appear

4. **View Details**
   - Click "View Details" on any version
   - Should expand to show full information

5. **Compare Versions**
   - Click "Compare Versions"
   - Select two versions
   - Click "Compare"
   - Should see differences

## Troubleshooting

### "Please select a lead to view version history"
- **Cause**: No lead selected in CaseContext
- **Fix**: Select a lead first using your lead selection mechanism

### No versions showing
- **Cause**: No snapshots exist for this lead yet
- **Fix**:
  1. Create the lead return (auto-creates version 1)
  2. Or click "Create Manual Snapshot"

### API errors
- **Cause**: Backend not running or routes not configured
- **Fix**:
  1. Check backend is running on port 5000 (or your configured port)
  2. Verify routes are added to server.js
  3. Check browser console for specific error

### Styles not loading
- **Cause**: CSS file not found
- **Fix**: Ensure LeadVersionHistory.css is in the same directory as .jsx file

## Next Steps

You can enhance this component by:

1. **Add Export Feature**
   - Export version history to PDF/Excel
   - Download specific version data

2. **Add Restore Feature**
   - Button to restore a previous version
   - Confirmation dialog before restore

3. **Add Filtering**
   - Filter by date range
   - Filter by creator
   - Filter by reason

4. **Add Search**
   - Search within version details
   - Highlight matching text

5. **Add Notifications**
   - Toast notifications on snapshot creation
   - Success/error messages

6. **Add Permissions**
   - Role-based access (only case managers can restore)
   - Hide sensitive data based on access level

---

**You're all set!** Navigate to `/LeadVersionHistory` after selecting a lead to view its version history. 🎉

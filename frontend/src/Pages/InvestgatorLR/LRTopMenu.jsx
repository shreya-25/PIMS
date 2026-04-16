import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Shared top-level navigation bar for all LR-related pages.
 *
 * Props:
 *   activePage            – 'leadInfo' | 'addLeadReturn' | 'chainOfCustody'
 *   selectedCase          – case context object
 *   selectedLead          – lead context object
 *   isGenerating          – boolean (PDF being generated)
 *   onManageLeadReturn    – handler that generates & opens the PDF report
 *   styles                – CSS module from the consuming page
 */
export const LRTopMenu = ({
  activePage,
  selectedCase,
  selectedLead,
  isGenerating = false,
  onManageLeadReturn,
  styles,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const resolve = () => {
    const lead = selectedLead?.leadNo ? selectedLead : location.state?.leadDetails;
    const kase = selectedCase?.caseNo ? selectedCase : location.state?.caseDetails;
    return { lead, kase };
  };

  const goTo = (route) => {
    const { lead, kase } = resolve();
    if (lead && kase) navigate(route, { state: { caseDetails: kase, leadDetails: lead } });
  };

  const isCaseManager = selectedCase?.role === 'Case Manager' || selectedCase?.role === 'Detective Supervisor';

  const isActive = (page) => activePage === page;

  return (
    <div className={styles.topMenuNav}>
      <div className={styles.menuItems}>

        <span
          className={`${styles.menuItem}${isActive('leadInfo') ? ` ${styles.menuItemActive}` : ''}`}
          onClick={!isActive('leadInfo') ? () => goTo('/LeadReview') : undefined}
        >
          Lead Information
        </span>

        <span
          className={`${styles.menuItem}${isActive('addLeadReturn') ? ` ${styles.menuItemActive}` : ''}`}
          onClick={!isActive('addLeadReturn') ? () => goTo('/LRInstruction') : undefined}
        >
          Add Lead Return
        </span>

        {isCaseManager && (
          <span
            className={styles.menuItem}
            onClick={isGenerating ? undefined : onManageLeadReturn}
            title={isGenerating ? 'Preparing report…' : 'Manage Lead Return'}
            style={{ opacity: isGenerating ? 0.6 : 1, pointerEvents: isGenerating ? 'none' : 'auto' }}
          >
            Manage Lead Return
          </span>
        )}

        <span
          className={`${styles.menuItem}${isActive('chainOfCustody') ? ` ${styles.menuItemActive}` : ''}`}
          onClick={!isActive('chainOfCustody') ? () => goTo('/ChainOfCustody') : undefined}
        >
          Lead Chain of Custody
        </span>

      </div>
    </div>
  );
};

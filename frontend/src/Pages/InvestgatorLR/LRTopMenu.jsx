import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Shared top-level navigation bar for all LR-related pages.
 *
 * Props:
 *   activePage   – 'leadInfo' | 'addLeadReturn' | 'manageLeadReturn' | 'chainOfCustody'
 *   selectedCase – case context object
 *   selectedLead – lead context object
 *   styles       – CSS module from the consuming page
 */
export const LRTopMenu = ({
  activePage,
  selectedCase,
  selectedLead,
  styles,
  isReadOnly = false,
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

        {!isReadOnly && (
          <span
            className={`${styles.menuItem}${isActive('addLeadReturn') ? ` ${styles.menuItemActive}` : ''}`}
            onClick={!isActive('addLeadReturn') ? () => goTo('/LRInstruction') : undefined}
          >
            Add Lead Return
          </span>
        )}

        {isCaseManager && (
          <span
            className={`${styles.menuItem}${isActive('manageLeadReturn') ? ` ${styles.menuItemActive}` : ''}`}
            onClick={!isActive('manageLeadReturn') ? () => goTo('/ManageLeadReturn') : undefined}
            title="Manage Lead Return"
          >
            Manage Lead Return
          </span>
        )}

        {isReadOnly && (
          <span
            className={`${styles.menuItem}${isActive('manageLeadReturn') ? ` ${styles.menuItemActive}` : ''}`}
            onClick={!isActive('manageLeadReturn') ? () => goTo('/ManageLeadReturn') : undefined}
            title="View Lead Return"
          >
            View Lead Return
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

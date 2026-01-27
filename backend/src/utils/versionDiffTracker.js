/**
 * Utility to track detailed differences between two versions
 * Generates a comprehensive activity log of what changed
 */

/**
 * Compare two arrays of objects and return detailed changes
 */
function compareArrays(oldArray = [], newArray = [], idField = '_id', labelField = 'description') {
  const changes = {
    added: [],
    deleted: [],
    updated: []
  };

  const oldMap = new Map(oldArray.map(item => [
    item[idField]?.toString() || JSON.stringify(item),
    item
  ]));

  const newMap = new Map(newArray.map(item => [
    item[idField]?.toString() || JSON.stringify(item),
    item
  ]));

  // Find deleted items
  oldMap.forEach((oldItem, id) => {
    if (!newMap.has(id)) {
      changes.deleted.push({
        id: oldItem[idField],
        label: oldItem[labelField] || getItemLabel(oldItem),
        data: oldItem
      });
    }
  });

  // Find added and updated items
  newMap.forEach((newItem, id) => {
    if (!oldMap.has(id)) {
      changes.added.push({
        id: newItem[idField],
        label: newItem[labelField] || getItemLabel(newItem),
        data: newItem
      });
    } else {
      const oldItem = oldMap.get(id);
      const fieldChanges = compareObjects(oldItem, newItem);

      // Debug: Log what compareObjects found
      if (id === 'A') {
        console.log('🔍 DEBUG: Comparing narrative A:', {
          oldContentLength: oldItem.leadReturnResult?.length,
          newContentLength: newItem.leadReturnResult?.length,
          oldKeys: Object.keys(oldItem),
          newKeys: Object.keys(newItem),
          fieldChangesFound: fieldChanges.length,
          changedFields: fieldChanges.map(c => c.field)
        });
      }

      if (fieldChanges.length > 0) {
        changes.updated.push({
          id: newItem[idField],
          label: newItem[labelField] || getItemLabel(newItem),
          changes: fieldChanges,
          oldData: oldItem,
          newData: newItem
        });
      }
    }
  });

  return changes;
}

/**
 * Compare two objects and return field-level changes
 */
function compareObjects(oldObj, newObj) {
  const changes = [];
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

  // Skip these fields from comparison - these are metadata that shouldn't trigger "updated" logs
  const skipFields = [
    '_id',
    'createdAt',
    'updatedAt',
    '__v',
    'completeLeadReturnId',
    'resultId', // MongoDB ObjectId for narratives
    'personId', // MongoDB ObjectId for persons
    'vehicleId', // MongoDB ObjectId for vehicles
    'timelineId', // MongoDB ObjectId for timelines
    'evidenceId', // MongoDB ObjectId for evidences
    'pictureId', // MongoDB ObjectId for pictures
    'audioId', // MongoDB ObjectId for audios
    'videoId', // MongoDB ObjectId for videos
    'enclosureId', // MongoDB ObjectId for enclosures
    'scratchpadId', // MongoDB ObjectId for scratchpads
    'enteredDate', // When record was created
    'enteredBy', // Who created the record
    'lastModifiedDate', // Timestamp metadata
    'lastModifiedBy', // User metadata
    'deletedAt', // Soft delete metadata
    'deletedBy' // Soft delete metadata
  ];

  allKeys.forEach(key => {
    // Debug logging for leadReturnResult field
    if (key === 'leadReturnResult') {
      console.log('🔍 DEBUG compareObjects - leadReturnResult field:', {
        key,
        oldValueLength: oldObj[key]?.length,
        newValueLength: newObj[key]?.length,
        willBeSkipped: skipFields.includes(key) || key.startsWith('_') || key.startsWith('$') || key.includes('$'),
        oldValuePreview: oldObj[key]?.substring(0, 50),
        newValuePreview: newObj[key]?.substring(0, 50),
        areEqual: oldObj[key] === newObj[key]
      });
    }

    // Skip internal MongoDB fields and parent references
    if (skipFields.includes(key) || key.startsWith('_') || key.startsWith('$') || key.includes('$')) return;

    const oldValue = oldObj[key];
    const newValue = newObj[key];

    // Handle nested objects
    if (typeof oldValue === 'object' && typeof newValue === 'object' &&
        oldValue !== null && newValue !== null &&
        !Array.isArray(oldValue) && !Array.isArray(newValue)) {
      const nestedChanges = compareObjects(oldValue, newValue);
      nestedChanges.forEach(change => {
        changes.push({
          field: `${key}.${change.field}`,
          oldValue: change.oldValue,
          newValue: change.newValue
        });
      });
    }
    // Handle arrays
    else if (Array.isArray(oldValue) && Array.isArray(newValue)) {
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({
          field: key,
          oldValue: oldValue,
          newValue: newValue
        });
      }
    }
    // Handle primitive values
    else if (oldValue !== newValue) {
      changes.push({
        field: key,
        oldValue: oldValue,
        newValue: newValue
      });
    }
  });

  return changes;
}

/**
 * Generate a human-readable label for an item
 */
function getItemLabel(item) {
  if (item.firstName && item.lastName) {
    return `${item.firstName} ${item.lastName}`;
  }
  if (item.make && item.model) {
    return `${item.year || ''} ${item.make} ${item.model}`.trim();
  }
  if (item.eventDescription) {
    return item.eventDescription.substring(0, 50);
  }
  if (item.leadReturnResult) {
    return item.leadReturnResult.substring(0, 50);
  }
  if (item.text) {
    return item.text.substring(0, 50);
  }
  if (item.description) {
    return item.description.substring(0, 50);
  }
  return 'Unknown Item';
}

/**
 * Generate detailed activity log between two versions
 */
function generateActivityLog(fromVersion, toVersion) {
  const activities = [];

  // Compare lead return results
  if (fromVersion.leadReturnResults || toVersion.leadReturnResults) {
    console.log('🔍 Comparing narratives...');
    console.log('📊 From version narratives:', fromVersion.leadReturnResults?.length || 0);
    console.log('📊 To version narratives:', toVersion.leadReturnResults?.length || 0);

    // Log narrative IDs for debugging
    if (fromVersion.leadReturnResults?.length > 0) {
      console.log('📋 From version narrative IDs:', fromVersion.leadReturnResults.map(r => ({
        leadReturnId: r.leadReturnId,
        resultId: r.resultId?.toString().substring(0, 8),
        contentLength: r.leadReturnResult?.length || 0,
        contentPreview: r.leadReturnResult?.substring(0, 50) + '...'
      })));
    }
    if (toVersion.leadReturnResults?.length > 0) {
      console.log('📋 To version narrative IDs:', toVersion.leadReturnResults.map(r => ({
        leadReturnId: r.leadReturnId,
        resultId: r.resultId?.toString().substring(0, 8),
        contentLength: r.leadReturnResult?.length || 0,
        contentPreview: r.leadReturnResult?.substring(0, 50) + '...'
      })));
    }

    // CRITICAL FIX: Use 'leadReturnId' (stable identifier like "A", "B", "C")
    // instead of 'resultId' (MongoDB ObjectId which can change)
    const changes = compareArrays(
      fromVersion.leadReturnResults,
      toVersion.leadReturnResults,
      'leadReturnId', // Changed from 'resultId' to 'leadReturnId'
      'leadReturnResult'
    );

    console.log('✅ Narrative changes found:', {
      added: changes.added.length,
      deleted: changes.deleted.length,
      updated: changes.updated.length
    });

    changes.deleted.forEach(item => {
      // For deleted narratives, only show leadReturnId and leadReturnResult
      const narrativeDetails = {
        leadReturnId: item.data.leadReturnId, // The actual narrative ID
        leadReturnResult: item.data.leadReturnResult
      };

      activities.push({
        action: 'deleted',
        entityType: 'Narrative',
        entityId: item.id,
        description: `Deleted narrative: ${item.label}`,
        details: narrativeDetails
      });
    });

    changes.added.forEach(item => {
      // For created narratives, only show leadReturnId and leadReturnResult
      const narrativeDetails = {
        leadReturnId: item.data.leadReturnId, // The actual narrative ID
        leadReturnResult: item.data.leadReturnResult
      };

      activities.push({
        action: 'created',
        entityType: 'Narrative',
        entityId: item.id,
        description: `Created narrative: ${item.label}`,
        details: narrativeDetails
      });
    });

    changes.updated.forEach(item => {
      console.log('📝 Processing updated narrative:', {
        narrativeId: item.newData.leadReturnId,
        allChanges: item.changes.map(c => c.field),
        hasLeadReturnResultChange: item.changes.some(c => c.field === 'leadReturnResult')
      });

      // For narratives, we care about content changes (leadReturnResult)
      // But also show other significant field changes if they occur
      const contentChanges = item.changes.filter(change => change.field === 'leadReturnResult');
      const otherSignificantChanges = item.changes.filter(change =>
        change.field !== 'leadReturnResult' &&
        !change.field.includes('Date') &&
        !change.field.includes('By') &&
        change.field !== 'isDeleted'
      );

      if (contentChanges.length > 0) {
        console.log('✅ Found leadReturnResult change for narrative', item.newData.leadReturnId);
        contentChanges.forEach(change => {
          // Create details with only leadReturnId and leadReturnResult
          const narrativeDetails = {
            leadReturnId: item.newData.leadReturnId, // The actual narrative ID
            leadReturnResult: item.newData.leadReturnResult
          };

          activities.push({
            action: 'updated',
            entityType: 'Narrative',
            entityId: item.id,
            field: change.field,
            description: `Updated narrative ${item.newData.leadReturnId}`,
            oldValue: change.oldValue,
            newValue: change.newValue,
            details: narrativeDetails
          });
        });
      } else if (otherSignificantChanges.length > 0) {
        console.log('ℹ️ Found other significant changes for narrative', item.newData.leadReturnId, 'Fields:', otherSignificantChanges.map(c => c.field));
        // Log other significant changes (like accessLevel changes)
        otherSignificantChanges.forEach(change => {
          const narrativeDetails = {
            leadReturnId: item.newData.leadReturnId,
            leadReturnResult: item.newData.leadReturnResult
          };

          activities.push({
            action: 'updated',
            entityType: 'Narrative',
            entityId: item.id,
            field: change.field,
            description: `Updated narrative ${item.newData.leadReturnId} - ${change.field}`,
            oldValue: change.oldValue,
            newValue: change.newValue,
            details: narrativeDetails
          });
        });
      } else {
        console.log('⚠️ Only metadata changes detected for narrative', item.newData.leadReturnId, 'Changes:', item.changes.map(c => c.field).join(', '));
      }
    });
  }

  // Compare persons
  if (fromVersion.persons || toVersion.persons) {
    const changes = compareArrays(
      fromVersion.persons,
      toVersion.persons,
      'personId',
      'firstName'
    );

    changes.deleted.forEach(item => {
      activities.push({
        action: 'deleted',
        entityType: 'Person',
        entityId: item.id,
        description: `Deleted person: ${item.label}`,
        details: item.data
      });
    });

    changes.added.forEach(item => {
      activities.push({
        action: 'created',
        entityType: 'Person',
        entityId: item.id,
        description: `Added person: ${item.label}`,
        details: item.data
      });
    });

    changes.updated.forEach(item => {
      // Create a details object with only the changed fields
      const changedFieldsOnly = {};
      item.changes.forEach(change => {
        changedFieldsOnly[change.field] = item.newData[change.field];
      });

      item.changes.forEach(change => {
        activities.push({
          action: 'updated',
          entityType: 'Person',
          entityId: item.id,
          field: change.field,
          description: `Updated person ${item.label} - ${change.field}`,
          oldValue: change.oldValue,
          newValue: change.newValue,
          details: changedFieldsOnly // Only include fields that changed
        });
      });
    });
  }

  // Compare vehicles
  if (fromVersion.vehicles || toVersion.vehicles) {
    const changes = compareArrays(
      fromVersion.vehicles,
      toVersion.vehicles,
      'vehicleId',
      'vin'
    );

    changes.deleted.forEach(item => {
      activities.push({
        action: 'deleted',
        entityType: 'Vehicle',
        entityId: item.id,
        description: `Deleted vehicle: ${item.label}`,
        details: item.data
      });
    });

    changes.added.forEach(item => {
      activities.push({
        action: 'created',
        entityType: 'Vehicle',
        entityId: item.id,
        description: `Added vehicle: ${item.label}`,
        details: item.data
      });
    });

    changes.updated.forEach(item => {
      item.changes.forEach(change => {
        activities.push({
          action: 'updated',
          entityType: 'Vehicle',
          entityId: item.id,
          field: change.field,
          description: `Updated vehicle ${item.label} - ${change.field}`,
          oldValue: change.oldValue,
          newValue: change.newValue
        });
      });
    });
  }

  // Compare timeline events
  if (fromVersion.timelines || toVersion.timelines) {
    const changes = compareArrays(
      fromVersion.timelines,
      toVersion.timelines,
      'timelineId',
      'eventDescription'
    );

    changes.deleted.forEach(item => {
      activities.push({
        action: 'deleted',
        entityType: 'Timeline Event',
        entityId: item.id,
        description: `Deleted timeline event: ${item.label}`,
        details: item.data
      });
    });

    changes.added.forEach(item => {
      activities.push({
        action: 'created',
        entityType: 'Timeline Event',
        entityId: item.id,
        description: `Added timeline event: ${item.label}`,
        details: item.data
      });
    });

    changes.updated.forEach(item => {
      item.changes.forEach(change => {
        activities.push({
          action: 'updated',
          entityType: 'Timeline Event',
          entityId: item.id,
          field: change.field,
          description: `Updated timeline event - ${change.field}`,
          oldValue: change.oldValue,
          newValue: change.newValue
        });
      });
    });
  }

  // Compare evidence
  if (fromVersion.evidences || toVersion.evidences) {
    const changes = compareArrays(
      fromVersion.evidences,
      toVersion.evidences,
      'evidenceId',
      'evidenceDescription'
    );

    changes.deleted.forEach(item => {
      activities.push({
        action: 'deleted',
        entityType: 'Evidence',
        entityId: item.id,
        description: `Deleted evidence: ${item.label}`,
        details: item.data
      });
    });

    changes.added.forEach(item => {
      activities.push({
        action: 'created',
        entityType: 'Evidence',
        entityId: item.id,
        description: `Added evidence: ${item.label}`,
        details: item.data
      });
    });

    changes.updated.forEach(item => {
      item.changes.forEach(change => {
        activities.push({
          action: 'updated',
          entityType: 'Evidence',
          entityId: item.id,
          field: change.field,
          description: `Updated evidence - ${change.field}`,
          oldValue: change.oldValue,
          newValue: change.newValue
        });
      });
    });
  }

  // Compare pictures
  if (fromVersion.pictures || toVersion.pictures) {
    const changes = compareArrays(
      fromVersion.pictures,
      toVersion.pictures,
      'pictureId',
      'pictureDescription'
    );

    changes.deleted.forEach(item => {
      activities.push({
        action: 'deleted',
        entityType: 'Picture',
        entityId: item.id,
        description: `Deleted picture: ${item.label}`,
        details: item.data
      });
    });

    changes.added.forEach(item => {
      activities.push({
        action: 'created',
        entityType: 'Picture',
        entityId: item.id,
        description: `Added picture: ${item.label}`,
        details: item.data
      });
    });
  }

  // Compare audio
  if (fromVersion.audios || toVersion.audios) {
    const changes = compareArrays(
      fromVersion.audios,
      toVersion.audios,
      'audioId',
      'audioDescription'
    );

    changes.deleted.forEach(item => {
      activities.push({
        action: 'deleted',
        entityType: 'Audio',
        entityId: item.id,
        description: `Deleted audio: ${item.label}`,
        details: item.data
      });
    });

    changes.added.forEach(item => {
      activities.push({
        action: 'created',
        entityType: 'Audio',
        entityId: item.id,
        description: `Added audio: ${item.label}`,
        details: item.data
      });
    });
  }

  // Compare videos
  if (fromVersion.videos || toVersion.videos) {
    const changes = compareArrays(
      fromVersion.videos,
      toVersion.videos,
      'videoId',
      'videoDescription'
    );

    changes.deleted.forEach(item => {
      activities.push({
        action: 'deleted',
        entityType: 'Video',
        entityId: item.id,
        description: `Deleted video: ${item.label}`,
        details: item.data
      });
    });

    changes.added.forEach(item => {
      activities.push({
        action: 'created',
        entityType: 'Video',
        entityId: item.id,
        description: `Added video: ${item.label}`,
        details: item.data
      });
    });
  }

  // Compare enclosures
  if (fromVersion.enclosures || toVersion.enclosures) {
    const changes = compareArrays(
      fromVersion.enclosures,
      toVersion.enclosures,
      'enclosureId',
      'enclosureDescription'
    );

    changes.deleted.forEach(item => {
      activities.push({
        action: 'deleted',
        entityType: 'Enclosure',
        entityId: item.id,
        description: `Deleted enclosure: ${item.label}`,
        details: item.data
      });
    });

    changes.added.forEach(item => {
      activities.push({
        action: 'created',
        entityType: 'Enclosure',
        entityId: item.id,
        description: `Added enclosure: ${item.label}`,
        details: item.data
      });
    });
  }

  // Compare scratchpads
  if (fromVersion.scratchpads || toVersion.scratchpads) {
    const changes = compareArrays(
      fromVersion.scratchpads,
      toVersion.scratchpads,
      'scratchpadId',
      'text'
    );

    changes.deleted.forEach(item => {
      activities.push({
        action: 'deleted',
        entityType: 'Note',
        entityId: item.id,
        description: `Deleted note: ${item.label}`,
        details: item.data
      });
    });

    changes.added.forEach(item => {
      activities.push({
        action: 'created',
        entityType: 'Note',
        entityId: item.id,
        description: `Added note: ${item.label}`,
        details: item.data
      });
    });

    changes.updated.forEach(item => {
      item.changes.forEach(change => {
        activities.push({
          action: 'updated',
          entityType: 'Note',
          entityId: item.id,
          field: change.field,
          description: `Updated note - ${change.field}`,
          oldValue: change.oldValue,
          newValue: change.newValue
        });
      });
    });
  }

  // Sort by timestamp (if available) or keep order
  return activities;
}

module.exports = {
  compareArrays,
  compareObjects,
  generateActivityLog,
  getItemLabel
};

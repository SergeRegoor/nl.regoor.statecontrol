var obj = StateControl.prototype;

function StateControl(){
	this._settingsKey = 'statecontrol-settings';
	this._settings = getAndFixSettings(this._settingsKey);
}

obj.getSettings = function() { return this._settings; };
obj.getGroups = function() { return this._settings.groups; };
obj.getSections = function() { return this._settings.sections; };
obj.getStates = function() { return this._settings.states; };
obj.getFlowTriggers = function() { return this._settings.flowTriggers; };
obj.getFlowActions = function() { return this._settings.flowActions; };
obj.getEvents = function() { return this._settings.events; };
obj.getGroupById = function(groupId) { return this.getItemFromArray(this._settings.groups, groupId); };
obj.getSectionById = function(sectionId) { return this.getItemFromArray(this._settings.sections, sectionId); };
obj.getStateById = function(stateId) { return this.getItemFromArray(this._settings.states, stateId); };
obj.getFlowTriggerById = function(flowTriggerId) { return this.getItemFromArray(this._settings.flowTriggers, flowTriggerId); };
obj.getFlowActionById = function(flowActionId) { return this.getItemFromArray(this._settings.flowActions, flowActionId); };
obj.getEventById = function(eventId) { return this.getItemFromArray(this._settings.events, eventId); };

obj.getGroupsForAutocomplete = function(searchString, checkGroupForEnabledFlows) {
	var groups = this.getGroups();
	var items = [];
	for (var idx = 0; idx < groups.length; idx++)
		if ((!checkGroupForEnabledFlows || groups[idx].enableFlows) && this.matchesSearchString(groups[idx].description, searchString))
			items[items.length] = { id: groups[idx].id, name: groups[idx].description };
	return items;
};

obj.getSectionsForAutocomplete = function(groupId, searchString, checkGroupForEnabledFlows) { return this.getAutocompleteItems(this.getSections(), groupId, searchString, checkGroupForEnabledFlows); };
obj.getStatesForAutocomplete = function(groupId, searchString, checkGroupForEnabledFlows) { return this.getAutocompleteItems(this.getStates(), groupId, searchString, checkGroupForEnabledFlows); };
obj.getFlowTriggersForAutocomplete = function(groupId, searchString, checkGroupForEnabledFlows) { return this.getAutocompleteItems(this.getFlowTriggers(), groupId, searchString, checkGroupForEnabledFlows); };
obj.getFlowActionsForAutocomplete = function(groupId, searchString, checkGroupForEnabledFlows) { return this.getAutocompleteItems(this.getFlowActions(), groupId, searchString, checkGroupForEnabledFlows); };
obj.getEventsForAutocomplete = function(groupId, searchString, checkGroupForEnabledFlows) { return this.getAutocompleteItems(this.getEvents(), groupId, searchString, checkGroupForEnabledFlows); };

obj.saveSectionState = function(section, stateId) {
	if (section == null) return false;
	if ((stateId == null) || (stateId.length === 0)) return false;
	Homey.manager('settings').set('sectionState'+section.id, stateId);
	return true;
};

obj.getSectionState = function(section) {
	if (section == null) return null;
	var stateId = Homey.manager('settings').get('sectionState' + section.id);
	if ((stateId != null) && (stateId.length > 0))
		return this.getStateById(stateId);
	return null;
};

obj.getEventsToFireForFlowAction = function(flowAction) {
	if (flowAction == null) return [];
	var events = [];
	for (var idx = 0; idx < this._settings.events.length; idx++)
		if (this._settings.events[idx].eventActionId == flowAction.id)
			events[events.length] = this._settings.events[idx];
	return events;
};

obj.matchesSearchString = function(sourceText, searchString) {
	if ((searchString == null) || (searchString.length === 0) || (sourceText == null)) return true;
	if (sourceText.toLowerCase().indexOf(searchString.trim().toLowerCase()) >= 0)
		return true;
	return false;
};

obj.createGuid = function() { 
	var s4 = function() { return (((1+Math.random())*0x10000)|0).toString(16).substring(1); };
	return (s4() + s4() + '-' + s4() + '-4' + s4().substr(0,3) + '-' + s4() + '-' + s4() + s4() + s4()).toLowerCase();
};

obj.secondsSinceEpoch = function(){ 
	return Math.floor(Date.now() / 1000);
};

obj.getItemFromArray = function(sourceArray, itemId) {
	if ((itemId == null) || (itemId.length === 0)) return null;
	if ((sourceArray == null) || (sourceArray.length === 0)) return null;
	for (var idx = 0; idx < sourceArray.length; idx++)
		if (sourceArray[idx].id == itemId)
			return sourceArray[idx];
	return null;
};

obj.getAutocompleteItems = function(sourceArray, groupId, searchString, checkGroupForEnabledFlows) {
	var items = [];
	for (var idx = 0; idx < sourceArray.length; idx++)
		if ((groupId == null) || (groupId == sourceArray[idx].groupId) && this.matchesSearchString(sourceArray[idx].description, searchString)) {
			var canAdd = true;
			if (!checkGroupForEnabledFlows) {
				var group = this.getGroupById();
				if ((group != null) && !group.enableFlows)
					canAdd = false;
			}
			if (canAdd)
				items[items.length] = { id: sourceArray[idx].id, name: sourceArray[idx].description };
		}
	return items;
};

String.prototype.normalize = function(){
	var str = this;
	if (str == null)
		str = '';
	return str.trim().toLowerCase();
};

String.prototype.startsWith = function(text){
	if ((this == null) || (text == null) || (this.length === 0) || (text.length === 0)) return false;
	if (this.indexOf(text) >= 0) return true;
	return false;
};

function getAndFixSettings(settingsKey) {
	var settings = Homey.manager('settings').get(settingsKey);
	if (settings == null) settings = {};
	var needToSave = false;
	
	// Initialize lists
	if (settings.groups == null) { settings.groups = []; needToSave = true; }
	if (settings.sections == null) { settings.sections = []; needToSave = true; }
	if (settings.states == null) { settings.states = []; needToSave = true; }
	if (settings.flowTriggers == null) { settings.flowTriggers = []; needToSave = true; }
	if (settings.flowActions == null) { settings.flowActions = []; needToSave = true; }
	if (settings.events == null) { settings.events = []; needToSave = true; }
	
	// Perform fixes if needed
	try {
		// Fix stateGroups --> groups
		if (settings.stateGroups != null) {
			for (var idx = 0; idx < settings.stateGroups.length; idx++)
				settings.groups[settings.groups.length] = {
					id: settings.stateGroups[idx].id,
					description: settings.stateGroups[idx].description,
					enableFlows: true
				};
			delete settings.stateGroups;
			needToSave = true;
		}
		
		// Fix rooms --> sections
		if (settings.rooms != null) {
			for (var idx = 0; idx < settings.rooms.length; idx++)
				settings.sections[settings.sections.length] = {
					id: settings.rooms[idx].id,
					groupId: settings.rooms[idx].stateGroupId,
					description: settings.rooms[idx].description
				};
			delete settings.rooms;
			needToSave = true;
		}
		
		// Fix states
		for (var idx = 0; idx < settings.states.length; idx++) {
			var state = settings.states[idx];
			if (((state.groupId == null) || (state.groupId.length === 0)) && (state.stateGroupId != null) && (state.stateGroupId.length > 0)) {
				state.groupId = state.stateGroupId;
				delete state.stateGroupId ;
				needToSave = true;
			}
			if ((state.hasPriority == null) && (state.isOverruling != null)) {
				state.hasPriority = state.isOverruling;
				delete state.isOverruling ;
				needToSave = true;
			} 
		}
		
		// Fix actions --> flowTriggers/flowActions
		if (settings.actions != null) {
			for (var idx = 0; idx < settings.actions.length; idx++) {
				var oldAction = settings.actions[idx];
				if (oldAction.isTriggerable) {
					// Add flow trigger based on old action
					var newFlowTrigger = {
						id: oldAction.id,
						groupId: oldAction.stateGroupId,
						description: oldAction.description
					};
					settings.flowTriggers[settings.flowTriggers.length] = newFlowTrigger;
				}
				else if (oldAction.isPerformable) {
					// Add flow action based on old action
					var newFlowAction = {
						id: oldAction.id,
						groupId: oldAction.stateGroupId,
						description: oldAction.description
					};
					settings.flowActions[settings.flowActions.length] = newFlowAction;
					
					// Check for follow-ups of the old action, to add as state events
					if ((oldAction.followUps != null) && (oldAction.followUps.length > 0)) {
						for (var i = 0; i < oldAction.followUps.length; i++) {
							var followUp = oldAction.followUps[i];
							
							if ((followUp.actionId != null) && (followUp.actionId.length > 0)) {
								var doType = 'executeFlowAction';
								for (var j = 0; j < settings.actions.length; j++)
									if ((settings.actions[j].id == followUp.actionId) && settings.actions[j].isTriggerable && !settings.actions[j].isPerformable) {
										doType = 'executeFlowTrigger';
										executeFlowActionId = '';
										executeFlowTriggerId = followUp.actionId;
									}
								
								var newEvent = {
									id: followUp.id,
									groupId: oldAction.stateGroupId,
									eventType: 'onAction',
									eventActionId: oldAction.id,
									delaySeconds: followUp.delaySeconds,
									canOverrideStatePriority: followUp.doNotCheckOverruling,
									doType: doType,
									executeFlowTriggerId: executeFlowTriggerId,
									executeFlowActionId: executeFlowActionId
								};
								settings.events[settings.events] = newEvent;
							}
							if ((followUp.stateId != null) && (followUp.stateId.length > 0)) {
								var newEvent = {
									id: followUp.id,
									groupId: oldAction.stateGroupId,
									eventType: 'onAction',
									eventActionId: oldAction.id,
									delaySeconds: followUp.delaySeconds,
									canOverrideStatePriority: followUp.doNotCheckOverruling,
									doType: 'setState',
									setStateId: followUp.stateId
								};
								settings.events[settings.events] = newEvent;
							}
						}
					}
				}	
			}
			
			delete settings.actions;
			needToSave = true;
		}
		
		// Fix room states
		for (var idx = 0; idx < settings.sections.length; idx++) {
			var newSetting = Homey.manager('settings').get('sectionState'+settings.sections[idx].id);
			if ((newSetting == null) || (newSetting.length === 0)) {
				var oldSetting = Homey.manager('settings').get('roomState'+settings.sections[idx].id);
				if ((oldSetting != null) && (oldSetting.length > 0)) {
					Homey.manager('settings').set('sectionState'+settings.sections[idx].id, oldSetting);
					needToSave = true;
				}
			}
		}
	} catch(exception) {
		Homey.log('Error fixing settings.');
	}
	
	if (needToSave)
		Homey.manager('settings').set(settingsKey, settings);
	return settings;
};


module.exports = StateControl;

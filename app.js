"use strict";
var StateControl = require('./../../lib/state-control.js');
var DEBUG = true;

// Initialize app
module.exports.init = function() {};

// Handle autocomplete params
Homey.manager('flow').on('trigger.flow_trigger.group.autocomplete', function(callback, args){ callback(null, new StateControl().getGroupsForAutocomplete(args.query, true)); });
Homey.manager('flow').on('trigger.flow_trigger.section.autocomplete', function(callback, args){ callback(null, new StateControl().getSectionsForAutocomplete(args.args.group.id, args.query, true)); });
Homey.manager('flow').on('trigger.flow_trigger.trigger.autocomplete', function(callback, args){ callback(null, new StateControl().getFlowTriggersForAutocomplete(args.args.group.id, args.query, true)); });

Homey.manager('flow').on('trigger.state_changed_in.group.autocomplete', function(callback, args){ callback(null, new StateControl().getGroupsForAutocomplete(args.query, false)); });
Homey.manager('flow').on('trigger.state_changed_in.section.autocomplete', function(callback, args){ callback(null, new StateControl().getSectionsForAutocomplete(args.args.group.id, args.query, false)); });
Homey.manager('flow').on('trigger.state_changed_in.state.autocomplete', function(callback, args){ callback(null, new StateControl().getStatesForAutocomplete(args.args.group.id, args.query, false)); });

Homey.manager('flow').on('trigger.state_changed.group.autocomplete', function(callback, args){ callback(null, new StateControl().getGroupsForAutocomplete(args.query, false)); });
Homey.manager('flow').on('trigger.state_changed.section.autocomplete', function(callback, args){ callback(null, new StateControl().getSectionsForAutocomplete(args.args.group.id, args.query, false)); });

Homey.manager('flow').on('condition.state.group.autocomplete', function(callback, args){ callback(null, new StateControl().getGroupsForAutocomplete(args.query, false)); });
Homey.manager('flow').on('condition.state.section.autocomplete', function(callback, args){ callback(null, new StateControl().getSectionsForAutocomplete(args.args.group.id, args.query, false)); });
Homey.manager('flow').on('condition.state.state.autocomplete', function(callback, args){ callback(null, new StateControl().getStatesForAutocomplete(args.args.group.id, args.query, false)); });

Homey.manager('flow').on('action.flow_action.group.autocomplete', function(callback, args){ callback(null, new StateControl().getGroupsForAutocomplete(args.query, true)); });
Homey.manager('flow').on('action.flow_action.section.autocomplete', function(callback, args){ callback(null, new StateControl().getSectionsForAutocomplete(args.args.group.id, args.query, true)); });
Homey.manager('flow').on('action.flow_action.flow_action.autocomplete', function(callback, args){ callback(null, new StateControl().getFlowActionsForAutocomplete(args.args.group.id, args.query, true)); });

Homey.manager('flow').on('action.set_state.group.autocomplete', function(callback, args){ callback(null, new StateControl().getGroupsForAutocomplete(args.query, false)); });
Homey.manager('flow').on('action.set_state.section.autocomplete', function(callback, args){ callback(null, new StateControl().getSectionsForAutocomplete(args.args.group.id, args.query, false)); });
Homey.manager('flow').on('action.set_state.state.autocomplete', function(callback, args){ callback(null, new StateControl().getStatesForAutocomplete(args.args.group.id, args.query, false)); });

// Check flow_trigger trigger
Homey.manager('flow').on('trigger.flow_trigger', function(callback, args, state) {
	if ((args == null) || (state == null) || !isValidParam(args.group) || !isValidParam(args.section) || !isValidParam(args.trigger) || !isValidParam(state.group) || !isValidParam(state.section) || !isValidParam(state.trigger))
		returnCallback(callback, false, 'trigger.flow_trigger', 'check', args);
	else {
		var canTrigger = (args.group.id == state.group.id) && (args.section.id == state.section.id) && (args.trigger.id == state.trigger.id);
		returnCallback(callback, canTrigger, 'trigger.flow_trigger', 'ok', args);
	}
});

// Check state_changed_in trigger
Homey.manager('flow').on('trigger.state_changed_in', function(callback, args, state) {
	if ((args == null) || (state == null) || !isValidParam(args.group) || !isValidParam(args.section) || !isValidParam(args.state) || !isValidParam(state.group) || !isValidParam(state.section) || !isValidParam(state.state)) 
		returnCallback(callback, false, 'trigger.state_changed_in', 'check', args);
	else {
		var canTrigger = (args.group.id == state.group.id) && (args.section.id == state.section.id) && (args.state.id == state.state.id);
		returnCallback(callback, canTrigger, 'trigger.state_changed_in', 'ok', args);
	}
});

// Check state_changed trigger
Homey.manager('flow').on('trigger.state_changed', function(callback, args, state) {
	if ((args == null) || (state == null) || !isValidParam(args.group) || !isValidParam(args.section) || !isValidParam(state.group) || !isValidParam(state.section)) 
		returnCallback(callback, false, 'trigger.state_changed', 'check', args);
	else {
		var canTrigger = (args.group.id == state.group.id) && (args.section.id == state.section.id);
		returnCallback(callback, canTrigger, 'trigger.state_changed', 'ok', args);
	}
});

// Check state condition
Homey.manager('flow').on('condition.state', function(callback, args) {
	if ((args == null) || !isValidParam(args.group) || !isValidParam(args.section) || !isValidParam(args.state)) 
		returnCallback(callback, false, 'condition.state', 'check', args);
	else {
		var sectionHasState = false;
		var stateControl = new StateControl();
		var section = stateControl.getSectionById(args.section.id);
		if (section != null) {
			var currentState = stateControl.getSectionState(section);
			if ((currentState != null) && (currentState.id == args.state.id))
				sectionHasState = true;
		}
		returnCallback(callback, sectionHasState, 'condition.state', 'ok', args);
	}
});

// Perform flow_action action
Homey.manager('flow').on('action.flow_action', function(callback, args) {
	if ((args == null) || !isValidParam(args.group) || !isValidParam(args.section) || !isValidParam(args.flow_action)) 
		returnCallback(callback, false, 'action.flow_action', 'check', args);
	else {
		var stateControl = new StateControl();
		var section = stateControl.getSectionById(args.section.id);
		var flowAction = stateControl.getFlowActionById(args.flow_action.id);
		if ((section != null) && (flowAction != null)) {
			var hasExecutedAction = module.exports.executeFlowAction(stateControl, section, flowAction);
			returnCallback(callback, hasExecutedAction, 'action.flow_action', 'exec', args);
		}
		returnCallback(callback, false, 'action.flow_action', 'not_ok', args);
	}
});

// Perform set_state action
Homey.manager('flow').on('action.set_state', function(callback, args) {
	if ((args == null) || !isValidParam(args.group) || !isValidParam(args.section) || !isValidParam(args.state)) 
		returnCallback(callback, false, 'action.set_state', 'check', args);
	else {
		var stateControl = new StateControl();
		var section = stateControl.getSectionById(args.section.id);
		var state = stateControl.getStateById(args.state.id);
		if ((section != null) && (state != null)) {
			var hasSetState = module.exports.setSectionState(stateControl, section, state, false);
			returnCallback(callback, hasSetState, 'action.set_state', 'exec', args);
		}
		returnCallback(callback, false, 'action.set_state', 'not_ok', args);
	}
});

// Execute action i.e. fire the connected events
module.exports.executeFlowAction = function(stateControl, section, flowAction) {
	if ((stateControl == null) || (section == null) || (flowAction == null)) return false;
	
	var events = stateControl.getEventsToFireForFlowAction(flowAction);
	if (DEBUG) Homey.log('Firing ' + events.length + ' events for action ' + flowAction.description + '.');
	return module.exports.fireEvents(stateControl, section, events);
};

// Fire the events for the section
module.exports.fireEvents = function(stateControl, section, events) {
	if ((stateControl == null) || (section == null) || (events == null) || (events.length == 0)) return false;
	for (var idx = 0; idx < events.length; idx++) {
		if (events[idx].delaySeconds <= 0)
			module.exports.executeEvent(stateControl, section, events[idx]);
		else
			setTimeout(function(){ module.exports.executeEvent(stateControl, section, events[idx]); }, events[idx].delaySeconds*1000);
	}
	return true;
};

// Execute event
module.exports.executeEvent = function(stateControl, section, event) {
	if ((stateControl == null) || (section == null) || (event == null)) return false;
	var currentState = stateControl.getSectionState(section);
	if (currentState == null) return false;
	
	// Check event's condition
	if ((event.conditionStateId != null) && (event.conditionStateId.length > 0)) {
		if (event.conditionIsEqual == null) event.conditionIsEqual = true;
		var conditionState = stateControl.getStateById(event.conditionStateId);
		var conditionHasBeenMet = false;
		if ((conditionState != null) && ((event.conditionIsEqual && (conditionState.id == currentState.id)) || (!event.conditionIsEqual && (conditionState.id != currentState.id))))
			conditionHasBeenMet = true;
		if (!conditionHasBeenMet) {
			if ((conditionState != null) && DEBUG) Homey.log('Not executing event "' + event.id + '" for section "' + section.description + '", the condition "' + conditionState.description + '"="' + event.conditionIsEqual + '" has not been met. Current state is "' + currentState.description + '".');
			if ((conditionState == null) && DEBUG) Homey.log('Not executing event "' + event.id + '" for section "' + section.description + '", the condition "' + conditionState.description + '"="' + event.conditionIsEqual + '" could not be determined. Current state is null.');
			return false;
		} else {
			if (DEBUG) Homey.log('Executing event "' + event.id + '" for section "' + section.description + '", the condition "' + conditionState.description + '"="' + event.conditionIsEqual + '" has been met. Current state is "' + currentState.description + '".');
		}
	}
	
	// We need the group to pass on to flow triggers
	var group = stateControl.getGroupById(section.groupId);
	if (group == null) return false;
	var canExecuteFlowTrigger = true;
	
	// Set state
	if ((event.setStateId != null) && (event.setStateId.length > 0)) {
		canExecuteFlowTrigger = false;
		var newState = stateControl.getStateById(event.setStateId);
		if (newState != null) {
			var hasSetState = module.exports.setSectionState(stateControl, section, newState, event.canOverrideStatePriority);
			if (hasSetState)
				canExecuteFlowTrigger = true;
		}
	}
	
	// Trigger flow_trigger
	if (canExecuteFlowTrigger && (event.executeFlowTriggerId != null) && (event.executeFlowTriggerId.length > 0)) {
		var flowTrigger = stateControl.getFlowTriggerById(event.executeFlowTriggerId);
		if (flowTrigger != null) {
			if (DEBUG) Homey.log('Triggering flow_trigger for trigger "' + flowTrigger.description + '" and section "' + section.description + '".');
			Homey.manager('flow').trigger('flow_trigger', null, { group:group, section:section, trigger:flowTrigger });
		}
	}
	
	return true;
};

// Set a new state for the section
module.exports.setSectionState = function(stateControl, section, newState, canOverrideStatePriority) {
	if ((stateControl == null) || (section == null) || (newState == null)) return false;
	
	// We need the group to pass on to flow triggers
	var group = stateControl.getGroupById(section.groupId);
	if (group == null) return false;
	
	// Get the current state
	var currentState = stateControl.getSectionState(section);
	if ((currentState != null) && (currentState.id == newState.id)) {
		// New state and current state are identical
		if (DEBUG) Homey.log('Not setting state "'+newState.description+'" for section "'+section.description+'", it already has that state.');
		return false;
	} else if ((currentState != null) && currentState.hasPriority && !newState.hasPriority) {
		if (canOverrideStatePriority) {
			if (DEBUG) Homey.log('Setting state "'+newState.description+'" for section "'+section.description+'", even though the current state "'+currentState.description+'" has priority.');
		} else {
			// The current state has priority
			if (DEBUG) Homey.log('Not setting state "'+newState.description+'" for section "'+section.description+'", the current state "'+currentState.description+'" has priority.');
			return false;
		}
	}
	
	// Save the state
	stateControl.saveSectionState(section, newState.id);
	
	// Trigger state_changed_in
	if (DEBUG) Homey.log('Triggering state_changed_in for state "' + newState.description + '" and section "' + section.description + '".');
	Homey.manager('flow').trigger('state_changed_in', null, { group:group, section:section, state:newState });
	
	// Trigger state_changed
	if (DEBUG) Homey.log('Triggering state_changed for section "' + section.description + '".');
	Homey.manager('flow').trigger('state_changed', null, { group:group, section:section });
	
	return true;
};



function returnCallback(callback, result, functionName, phase, args) {
	var argsDescription = '';
	if (args != null) {
		for (var argKey in args) {
			argsDescription += (argsDescription.length > 0 ? ', ' : '') + argKey + ': "';
			var obj = args[argKey];
			if (obj == null)
				argsDescription += 'null';
			else if ((obj.description != null) && (obj.description.length > 0))
				argsDescription += obj.description;
			else if ((obj.name != null) && (obj.name.length > 0))
				argsDescription += obj.name;
			else
				argsDescription += obj;
			argsDescription += '"';
		}
	}
	if (DEBUG) Homey.log('Finished ' + functionName + ' in phase ' + phase + ' with result ' + result + ' (args: '+argsDescription+').');
	callback(null, result);
}

function isValidParam(obj) {
	if (obj == null) return false;
	if (obj.id == null) return false;
	if (obj.id.length == 0) return false;
	return true;
}

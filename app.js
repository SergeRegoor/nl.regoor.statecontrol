"use strict";
var StateControl = require('./../../lib/state-control.js');
var DEBUG = true;

// Initialize app
module.exports.init = function(){};

// Handle autocomplete params
Homey.manager('flow').on('trigger.state_change.state_group.autocomplete', function(callback, args){ callback(null, new StateControl().getStateGroupsForAutocomplete()); });
Homey.manager('flow').on('trigger.state_change.room.autocomplete', function(callback, args){ callback(null, new StateControl().getRoomsForAutocomplete(args.args.state_group.stateGroupId)); });
Homey.manager('flow').on('trigger.state_change.state.autocomplete', function(callback, args){ callback(null, new StateControl().getStatesForAutocomplete(args.args.state_group.stateGroupId)); });
Homey.manager('flow').on('trigger.request_action.state_group.autocomplete', function(callback, args){ callback(null, new StateControl().getStateGroupsForAutocomplete()); });
Homey.manager('flow').on('trigger.request_action.room.autocomplete', function(callback, args){ callback(null, new StateControl().getRoomsForAutocomplete(args.args.state_group.stateGroupId)); });
Homey.manager('flow').on('trigger.request_action.requested_action.autocomplete', function(callback, args){ callback(null, new StateControl().getActionsForAutocomplete(args.args.state_group.stateGroupId)); });
Homey.manager('flow').on('action.set_state.state_group.autocomplete', function(callback, args){ callback(null, new StateControl().getStateGroupsForAutocomplete()); });
Homey.manager('flow').on('action.set_state.room.autocomplete', function(callback, args){ callback(null, new StateControl().getRoomsForAutocomplete(args.args.state_group.stateGroupId)); });
Homey.manager('flow').on('action.set_state.state.autocomplete', function(callback, args){ callback(null, new StateControl().getStatesForAutocomplete(args.args.state_group.stateGroupId)); });
Homey.manager('flow').on('action.perform_action.state_group.autocomplete', function(callback, args){ callback(null, new StateControl().getStateGroupsForAutocomplete()); });
Homey.manager('flow').on('action.perform_action.room.autocomplete', function(callback, args){ callback(null, new StateControl().getRoomsForAutocomplete(args.args.state_group.stateGroupId)); });
Homey.manager('flow').on('action.perform_action.action_to_perform.autocomplete', function(callback, args){ callback(null, new StateControl().getActionsForAutocomplete(args.args.state_group.stateGroupId)); });

// Check state_change trigger
Homey.manager('flow').on('trigger.state_change', function(callback, args, state){
	var canTrigger = false;
	// Have we been triggered for the correct room & state?
	if ((args != null) && (state != null)) {
		var argRoomId = '';
		var argStateId = '';
		var stateRoomId = '';
		var stateStateId = '';
		
		if ((args.room != null) && (args.room.roomId != null))
			argRoomId = args.room.roomId;
		if ((args.state != null) && (args.state.stateId != null))
			argStateId = args.state.stateId;
		
		if (state.roomId != null)
			stateRoomId = state.roomId;
		if (state.stateId != null)
			stateStateId = state.stateId;
		
		if ((argRoomId == stateRoomId) && (argStateId == stateStateId)) {
			var stateControl = new StateControl();
			var room = stateControl.getRoomById(argRoomId);
			var state = stateControl.getStateById(argStateId);
			if ((room != null) && room.isActive && (state != null) && state.isActive)
				canTrigger = true;
		}
	}

	callback(null, canTrigger);
});

// Check state_change trigger
Homey.manager('flow').on('trigger.request_action', function(callback, args, state){
	var canTrigger = false;
	// Have we been triggered for the correct room & state?
	if ((args != null) && (state != null)) {
		var argRoomId = '';
		var argActionId = '';
		var stateRoomId = '';
		var stateActionId = '';
		
		if ((args.room != null) && (args.room.roomId != null))
			argRoomId = args.room.roomId;
		if ((args.requested_action != null) && (args.requested_action.actionId != null))
			argActionId = args.requested_action.actionId;
		
		if (state.roomId != null)
			stateRoomId = state.roomId;
		if (state.actionId != null)
			stateActionId = state.actionId;
		
		if ((argRoomId == stateRoomId) && (argActionId == stateActionId)) {
			var stateControl = new StateControl();
			var room = stateControl.getRoomById(argRoomId);
			var action = stateControl.getActionById(argActionId);
			if ((room != null) && room.isActive && (action != null) && action.isActive)
				canTrigger = true;
		}
	}
	callback(null, canTrigger);
});

// Perform set_state
Homey.manager('flow').on('action.set_state', function(callback, args){
	var successful = false;
	if ((args != null) && (args.room != null) && (args.room.id != null) && (args.state != null) && (args.state.id != null)) {
		var stateControl = new StateControl();
		var room = stateControl.getRoomById(args.room.id);
		var newState = stateControl.getStateById(args.state.id);
		if ((room != null) && room.isActive && (newState != null) && newState.isActive) {
			setRoomState(room, newState, false);
			successful = true;
		}
	}
	callback(null, successful);
});

// Perform perform_action
Homey.manager('flow').on('action.perform_action', function(callback, args){
	var successful = false;
	if ((args != null) && (args.room != null) && (args.room.roomId != null) && (args.action_to_perform != null) && (args.action_to_perform.actionId != null)) {
		var stateControl = new StateControl();
		var room = stateControl.getRoomById(args.room.roomId);
		var action = stateControl.getActionById(args.action_to_perform.actionId);
		if ((room != null) && room.isActive && (action != null) && action.isActive) {
			module.exports.performAction(room, action);
			successful = true;
		}
	}
	callback(null, successful);
});

module.exports.performAction = function(room, action) {
	if ((room == null) || (action == null)) return false;
	if (!room.isActive || !action.isActive) return false;
	if (DEBUG) Homey.log('Performing action "' + action.description + '" for room "' + room.description + '".');
	var canTriggerAction = true;
	var stateControl = new StateControl();
	
	var nextState = stateControl.getStateById(action.stateId);
	if ((nextState != null) && !module.exports.setRoomState(room, nextState, action.doNotCheckOverruling))
		canTriggerAction = false;
	
	if (canTriggerAction) {
		var nextAction = stateControl.getActionById(action.actionId);
		if ((nextAction != null) && nextAction.isActive) {
			if (DEBUG) Homey.log('Triggering request_action "' + nextAction.description + '" for room "' + room.description + '".');
			Homey.manager('flow').trigger('request_action', null, {
				roomId: room.id,
				actionId: nextAction.id
			});
		}
	}
	return true;
};

module.exports.setRoomState = function(room, newState, doNotCheckOverruling) {
	if ((room == null) || (newState == null)) return false;
	if (!room.isActive || !newState.isActive) return false;
	var stateControl = new StateControl();
	
	var currentState = stateControl.getStateById(room.stateId);
	if ((currentState != null) && (currentState.id == newState.id)) {
		if (DEBUG) Homey.log('Not setting room state "' + newState.description + '" for room "' + room.description + '", it already has this state.');
		return true;
	}
	if (newState.isOverruling || (currentState == null) || !currentState.isOverruling || doNotCheckOverruling) {
		if (DEBUG) Homey.log('Setting room state "' + newState.description + '" for room "' + room.description + '".');
		if (stateControl.saveRoomState(room, newState.id)) {
			if (DEBUG) Homey.log('Triggering state_change "' + newState.description + '" for room "' + room.description + '".');
			Homey.manager('flow').trigger('state_change', null, {
				roomId: room.id,
				stateId: newState.id
			});
			return true;
		}
	} else if (currentState != null)
		if (DEBUG) Homey.log('Not changing room state for room "' + room.description + '" to "' + newState.description + '", its current state "' + currentState.description + '" is overruling.');
	
	return false;
}
"use strict";
var StateControl = require('./../../lib/state-control.js');
var DEBUG = true;

// Initialize app
module.exports.init = function(){};

// Handle autocomplete params
Homey.manager('flow').on('trigger.state_change.state_group.autocomplete', function(callback, args){ callback(null, new StateControl().getStateGroupsForAutocomplete(args.query)); });
Homey.manager('flow').on('trigger.state_change.room.autocomplete', function(callback, args){ callback(null, new StateControl().getRoomsForAutocomplete(args.args.state_group.stateGroupId, args.query)); });
Homey.manager('flow').on('trigger.state_change.state.autocomplete', function(callback, args){ callback(null, new StateControl().getStatesForAutocomplete(args.args.state_group.stateGroupId, args.query)); });
Homey.manager('flow').on('trigger.request_action.state_group.autocomplete', function(callback, args){ callback(null, new StateControl().getStateGroupsForAutocomplete(args.query)); });
Homey.manager('flow').on('trigger.request_action.room.autocomplete', function(callback, args){ callback(null, new StateControl().getRoomsForAutocomplete(args.args.state_group.stateGroupId, args.query)); });
Homey.manager('flow').on('trigger.request_action.requested_action.autocomplete', function(callback, args){ callback(null, new StateControl().getTriggerableActionsForAutocomplete(args.args.state_group.stateGroupId, args.query)); });
Homey.manager('flow').on('condition.state.state_group.autocomplete', function(callback, args){ callback(null, new StateControl().getStateGroupsForAutocomplete(args.query)); });
Homey.manager('flow').on('condition.state.room.autocomplete', function(callback, args){ callback(null, new StateControl().getRoomsForAutocomplete(args.args.state_group.stateGroupId, args.query)); });
Homey.manager('flow').on('condition.state.state.autocomplete', function(callback, args){ callback(null, new StateControl().getStatesForAutocomplete(args.args.state_group.stateGroupId, args.query)); });
Homey.manager('flow').on('action.set_state.state_group.autocomplete', function(callback, args){ callback(null, new StateControl().getStateGroupsForAutocomplete(args.query)); });
Homey.manager('flow').on('action.set_state.room.autocomplete', function(callback, args){ callback(null, new StateControl().getRoomsForAutocomplete(args.args.state_group.stateGroupId, args.query)); });
Homey.manager('flow').on('action.set_state.state.autocomplete', function(callback, args){ callback(null, new StateControl().getStatesForAutocomplete(args.args.state_group.stateGroupId, args.query)); });
Homey.manager('flow').on('action.perform_action.state_group.autocomplete', function(callback, args){ callback(null, new StateControl().getStateGroupsForAutocomplete(args.query)); });
Homey.manager('flow').on('action.perform_action.room.autocomplete', function(callback, args){ callback(null, new StateControl().getRoomsForAutocomplete(args.args.state_group.stateGroupId, args.query)); });
Homey.manager('flow').on('action.perform_action.action_to_perform.autocomplete', function(callback, args){ callback(null, new StateControl().getPerformableActionsForAutocomplete(args.args.state_group.stateGroupId, args.query)); });

// Check state_change trigger
Homey.manager('flow').on('trigger.state_change', function(callback, args, state){
	var canTrigger = false;
	// Have we been triggered for the correct room & state?
	if ((args != null) && (state != null)) {
		var argStateGroupId = '';
		var argRoomId = '';
		var argStateId = '';
		if ((args.state_group != null) && (args.state_group.stateGroupId != null))
			argStateGroupId = args.state_group.stateGroupId;
		if ((args.room != null) && (args.room.roomId != null))
			argRoomId = args.room.roomId;
		if ((args.state != null) && (args.state.stateId != null))
			argStateId = args.state.stateId;
		
		var stateStateGroupId = '';
		var stateRoomId = '';
		var stateStateId = '';
		if (state.stateGroupId != null)
			stateStateGroupId = state.stateGroupId;
		if (state.roomId != null)
			stateRoomId = state.roomId;
		if (state.stateId != null)
			stateStateId = state.stateId;
		
		if ((argStateGroupId == stateStateGroupId) && (argRoomId == stateRoomId) && (argStateId == stateStateId)) {
			var stateControl = new StateControl();
			var stateGroup = stateControl.getStateGroupById(argStateGroupId);
			var room = stateControl.getRoomById(argRoomId);
			var state = stateControl.getStateById(argStateId);
			if ((stateGroup != null) && (room != null) && room.isActive && (state != null) && state.isActive)
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
		var argStateGroupId = '';
		var argRoomId = '';
		var argActionId = '';
		if ((args.state_group != null) && (args.state_group.stateGroupId != null))
			argStateGroupId = args.state_group.stateGroupId;
		if ((args.room != null) && (args.room.roomId != null))
			argRoomId = args.room.roomId;
		if ((args.requested_action != null) && (args.requested_action.actionId != null))
			argActionId = args.requested_action.actionId;
		
		var stateStateGroupId = '';
		var stateRoomId = '';
		var stateActionId = '';
		if (state.stateGroupId != null)
			stateStateGroupId = state.stateGroupId;
		if (state.roomId != null)
			stateRoomId = state.roomId;
		if (state.actionId != null)
			stateActionId = state.actionId;
		
		if ((argStateGroupId == stateStateGroupId) && (argRoomId == stateRoomId) && (argActionId == stateActionId)) {
			var stateControl = new StateControl();
			var stateGroup = stateControl.getStateGroupById(argStateGroupId);
			var room = stateControl.getRoomById(argRoomId);
			var action = stateControl.getActionById(argActionId);
			if ((stateGroup != null) && (room != null) && room.isActive && (action != null) && action.isActive && action.isTriggerable)
				canTrigger = true;
		}
	}
	callback(null, canTrigger);
});

// Condition for state
Homey.manager('flow').on('condition.state', function(callback, args) {
	var successful = false;
	if ((args != null) && (args.state_group != null) && (args.room != null) && (args.state != null)) {
		var stateGroupId = '';
		var roomId = '';
		var stateId = '';
		if (args.state_group.stateGroupId != null)
			stateGroupId = args.state_group.stateGroupId;
		if (args.room.roomId != null)
			roomId = args.room.roomId;
		if (args.state.stateId != null)
			stateId = args.state.stateId;
		
		if ((stateGroupId.length > 0) && (roomId.length > 0) && (stateId.length > 0)) {
			var stateControl = new StateControl();
			var room = stateControl.getRoomById(roomId);
			if (room != null) {
				var state = stateControl.getRoomState(room);
				if ((state != null) && (state.id == stateId)) {
					successful = true;
					if (DEBUG) Homey.log('Condition "state" has been met. Room "' + room.description + '" has state "' + state.description + '".');
				}
			}
		}
	}
	callback(null, successful);
});

// Perform set_state
Homey.manager('flow').on('action.set_state', function(callback, args){
	if (DEBUG) Homey.log('Action "set_state" has been called.');
	var successful = false;
	if ((args != null) && (args.room != null) && (args.room.roomId != null) && (args.state != null) && (args.state.stateId != null)) {
		var stateControl = new StateControl();
		var room = stateControl.getRoomById(args.room.roomId);
		var newState = stateControl.getStateById(args.state.stateId);
		if ((room != null) && room.isActive && (newState != null) && newState.isActive) {
			module.exports.setRoomState(room, newState, false);
			successful = true;
		}
	}
	callback(null, successful);
});

// Perform perform_action
Homey.manager('flow').on('action.perform_action', function(callback, args){
	if (DEBUG) Homey.log('Action "perform_action" has been called.');
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
	if ((room == null) || (action == null) || (action.followUps == null) || !action.isPerformable) return false;
	if (!room.isActive || !action.isActive) return false;
	if (DEBUG) Homey.log('Performing action "' + action.description + '" for room "' + room.description + '".');
	var stateControl = new StateControl();
	
	for (var idx = 0; idx < action.followUps.length; idx++) {
		var followUp = action.followUps[idx];
		if (followUp.isActive) {
			var delayInSeconds = followUp.delaySeconds;
			if (delayInSeconds <= 0)
				module.exports.performFollowUp(room, action, followUp);
			else {
				setTimeout(function(){
					module.exports.performFollowUp(room, action, followUp);
				}, delayInSeconds*1000);
			}
		}
	}
	return true;
};

module.exports.performFollowUp = function(room, action, followUp) {
	if ((room == null) || (followUp == null)) return false;
	if (!room.isActive || !followUp.isActive) return false;
	if (DEBUG) Homey.log('Performing follow-up for action "' + action.description + '" for room "' + room.description + '". Follow-up delay '+followUp.delaySeconds+' seconds.');
	var stateControl = new StateControl();
	
	var canTriggerAction = true;
	var followUpState = stateControl.getStateById(followUp.stateId);
	if ((followUpState != null) && !module.exports.setRoomState(room, followUpState, followUp.doNotCheckOverruling))
		canTriggerAction = false;
	
	if (canTriggerAction) {
		var followUpAction = stateControl.getActionById(followUp.actionId);
		if ((followUpAction != null) && followUpAction.isActive) {
			if (DEBUG) Homey.log('Triggering request_action "' + followUpAction.description + '" for room "' + room.description + '".');
			Homey.manager('flow').trigger('request_action', null, {
				stateGroupId: room.stateGroupId,
				roomId: room.id,
				actionId: followUpAction.id
			});
		}
	}
}

module.exports.setRoomState = function(room, newState, doNotCheckOverruling) {
	if ((room == null) || (newState == null)) return false;
	if (!room.isActive || !newState.isActive) return false;
	var stateControl = new StateControl();
	
	var currentState = stateControl.getRoomState(room);
	if ((currentState != null) && (currentState.id == newState.id)) {
		if (DEBUG) Homey.log('Not setting room state "' + newState.description + '" for room "' + room.description + '", it already has this state.');
		return true;
	}
	if (newState.isOverruling || (currentState == null) || !currentState.isOverruling || doNotCheckOverruling) {
		if (DEBUG) Homey.log('Setting room state "' + newState.description + '" for room "' + room.description + '".');
		if (stateControl.saveRoomState(room, newState.id)) {
			if (DEBUG) Homey.log('Triggering state_change "' + newState.description + '" for room "' + room.description + '".');
			Homey.manager('flow').trigger('state_change', null, {
				stateGroupId: room.stateGroupId,
				roomId: room.id,
				stateId: newState.id
			});
			return true;
		}
	} else if (currentState != null)
		if (DEBUG) Homey.log('Not changing room state for room "' + room.description + '" to "' + newState.description + '", its current state "' + currentState.description + '" is overruling.');
	
	return false;
}
"use strict";
var StateControl = require('./../../lib/state-control.js');
var DEBUG = true;

module.exports = [
	{
		description:			'Set room state',
		method: 				'POST',
		path:					'/set-room-state/', // ?stategroupid=&roomid=&stateid=
		fn: function(callback, args) {
			var result = {
				successful: true,
				errorMessage: ''
			};
			try {
				var stateGroupId = args.query.stategroupid;
				var roomId = args.query.roomid;
				var stateId = args.query.stateid;
				
				if ((stateGroupId == null) || (stateGroupId.length == 0)) throw new Error('No state group ID supplied.');
				if ((roomId == null) || (roomId.length == 0)) throw new Error('No room ID supplied.');
				if ((stateId == null) || (stateId.length == 0)) throw new Error('No state ID supplied.');
				
				var stateControl = new StateControl();
				var stateGroup = stateControl.getStateGroupById(stateGroupId);
				var room = stateControl.getRoomById(roomId);
				var state = stateControl.getStateById(stateId);
				
				if (stateGroup == null) throw new Error('Could not find state group with ID '+stateGroupId+'.');
				if (room == null) throw new Error('Could not find room with ID '+roomId+'.');
				if (state == null) throw new Error('Could not find state with ID '+stateId+'.');
				if (!room.isActive) throw new Error('Room not active.');
				if (!state.isActive) throw new Error('State not active.');
				
				Homey.app.setRoomState(stateGroup, room, state, true);
				
			} catch(exception) {
				result.errorMessage = exception.message;
			}
			callback(null, result);
		}
	},
	{
		description:			'Perform action for room',
		method: 				'POST',
		path:					'/perform-action/', // ?stategroupid=&roomid=&actionid=
		fn: function(callback, args) {
			var result = {
				successful: true,
				errorMessage: ''
			};
			try {
				var stateGroupId = args.query.stategroupid;
				var roomId = args.query.roomid;
				var actionId = args.query.actionid;
				
				if ((stateGroupId == null) || (stateGroupId.length == 0)) throw new Error('No state group ID supplied.');
				if ((roomId == null) || (roomId.length == 0)) throw new Error('No room ID supplied.');
				if ((actionId == null) || (actionId.length == 0)) throw new Error('No action ID supplied.');
				
				var roomStateControl = new RoomStateControl();
				var stateGroup = roomStateControl.getStateGroupById(stateGroupId);
				var room = roomStateControl.getRoomById(roomId);
				var action = roomStateControl.getActionById(actionId);
				
				if (stateGroup == null) throw new Error('Could not find state group with ID '+stateGroupId+'.');
				if (room == null) throw new Error('Could not find room with ID '+roomId+'.');
				if (action == null) throw new Error('Could not find action with ID '+actionId+'.');
				if (!room.isActive) throw new Error('Room not active.');
				if (!action.isActive) throw new Error('Action not active.');
				
				Homey.app.performAction(stateGroup, room, action);
				
			} catch(exception) {
				result.errorMessage = exception.message;
			}
			callback(null, result);
		}
	}
];
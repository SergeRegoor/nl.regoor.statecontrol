// Definition of list types
var _listTypes = [
	{
		type: 'stateGroups',
		title: {localText:'list.stateGroups.title'},
		explanation: {localText:'list.stateGroups.explanation'},
		addButton: {localText:'list.stateGroups.addButton'},
		source: '_settings.stateGroups',
		columns: [
			{ type:'move', title:'' },
			{ type:'edit', title:'' },
			{ type:'delete', title:'' },
			{ property:'description', title:{localText:'list.stateGroups.description'} }
		],
		filter: null,
		formType: 'stateGroup',
		deleteItem: function(masterParentId, parentId, stateGroup) {
			var nrOfRooms = $.grep(_settings.rooms, function(room){ return room.stateGroupId == stateGroup.id; }).length;
			var nrOfStates = $.grep(_settings.states, function(state){ return state.stateGroupId == stateGroup.id; }).length;
			var nrOfActions = $.grep(_settings.actions, function(action){ return action.stateGroupId == stateGroup.id; }).length;
			if ((nrOfRooms > 0) || (nrOfStates > 0) || (nrOfActions)) {
				var errorMessage = __('list.stateGroups.inUse.error') + ' (';
				if (nrOfRooms == 1) errorMessage += __('list.rooms.inUse.one'); else if (nrOfRooms > 1) errorMessage += __('list.rooms.inUse.multiple').replace('[quantity]', nrOfRooms);
				if ((nrOfRooms >= 1) && (nrOfStates >= 1)) errorMessage += ', ';
				if (nrOfStates == 1) errorMessage += __('list.states.inUse.one'); else if (nrOfStates > 1) errorMessage += __('list.states.inUse.multiple').replace('[quantity]', nrOfStates);
				if (((nrOfRooms+nrOfStates) >= 1) && (nrOfActions >= 1)) errorMessage += ', ';
				if (nrOfActions == 1) errorMessage += __('list.actions.inUse.one'); else if (nrOfActions > 1) errorMessage += __('list.actions.inUse.multiple').replace('[quantity]', nrOfActions);
				errorMessage += ').';
				alert(errorMessage);
				return false;
			}
			if (!confirm(__('list.stateGroups.confirmDelete').replace('[description]',stateGroup.description))) return false;
			_settings.stateGroups = $.grep(_settings.stateGroups, function(item){ return item.id != stateGroup.id; });
			saveSettings();
			initializeTabs();
			$('.tabControl').invalidateTabs();
			$('.list[rel-listtype="stateGroups"]').renderList();
			return true;
		}
	},
	{
		type: 'rooms',
		title: {localText: 'list.rooms.title'},
		explanation: {localText:'list.rooms.explanation'},
		addButton: {localText:'list.rooms.addButton'},
		source: '_settings.rooms',
		columns: [
			{ type:'move', title:'' },
			{ type:'edit', title:'' },
			{ type:'delete', title:'' },
			{ property:'description', title:{localText:'list.rooms.description'} },
			{ property:'isActive', title:{localText:'list.rooms.isActive'}, propertyType:'boolean' },
			{ type:'roomState', title:{localText:'list.rooms.currentState'} }
		],
		filter: { property:'stateGroupId', compareTo:'parentId' },
		formType: 'room',
		deleteItem: function(masterParentId, parentId, room) {
			if (!confirm(__('list.rooms.confirmDelete').replace('[description]',room.description))) return false;
			_settings.rooms = $.grep(_settings.rooms, function(item){ return item.id != room.id; });
			saveSettings();
			$('.list[rel-listtype="rooms"][rel-parentid="'+room.stateGroupId+'"]').renderList();
			return true;
		}
	},
	{
		type: 'states',
		title: {localText: 'list.states.title'},
		explanation: {localText:'list.states.explanation'},
		addButton: {localText:'list.states.addButton'},
		source: '_settings.states',
		columns: [
			{ type:'move', title:'' },
			{ type:'edit', title:'' },
			{ type:'delete', title:'' },
			{ property:'description', title:{localText:'list.states.description'} },
			{ property:'isActive', title:{localText:'list.states.isActive'}, propertyType:'boolean' },
			{ property:'isOverruling', title:{localText:'list.states.isOverruling'}, propertyType:'boolean' }
		],
		filter: { property:'stateGroupId', compareTo:'parentId' },
		formType: 'state',
		deleteItem: function(masterParentId, parentId, state, callback) {
			function performDelete(nrOfRoomsInUse) {
				var nrOfFollowUps = 0;
				$.each(_settings.actions, function(i, action){
					nrOfFollowUps += $.grep(action.followUps, function(followUp){ return followUp.stateId == state.id; }).length;
				});
				if ((nrOfRoomsInUse > 0) || (nrOfFollowUps > 0)) {
					var errorMessage = __('list.states.inUse.error') + ' (';
					if (nrOfRoomsInUse == 1) errorMessage += __('list.rooms.inUse.one'); else if (nrOfRoomsInUse > 1) errorMessage += __('list.rooms.inUse.multiple').replace('[quantity]', nrOfRoomsInUse);
					if ((nrOfRoomsInUse > 0) && (nrOfFollowUps > 0)) errorMessage += ', ';
					if (nrOfFollowUps == 1) errorMessage += __('list.followUps.inUse.one'); else if (nrOfFollowUps > 1) errorMessage += __('list.followUps.inUse.multiple').replace('[quantity]', nrOfFollowUps);
					errorMessage += ').';
					alert(errorMessage);
					if (callback != null)
						callback(false);
					return;
				}
				if (!confirm(__('list.states.confirmDelete').replace('[description]',state.description))) return false;
				_settings.states = $.grep(_settings.states, function(item){ return item.id != state.id; });
				saveSettings();
				$('.list[rel-listtype="states"][rel-parentid="'+state.stateGroupId+'"]').renderList();
				if (callback != null)
					callback(true);
			}
			
			var nrOfRoomsToCheckForState = _settings.rooms.length;
			var nrOfRoomsCheckedForState = 0;
			var nrOfRoomsInUse = 0;
			$.each(_settings.rooms, function(i, room){
				getRoomState(room.id, function(roomState){
					nrOfRoomsCheckedForState++;
					if (roomState.id == state.id)
						nrOfRoomsInUse++;
					if (nrOfRoomsCheckedForState >= nrOfRoomsToCheckForState)
						performDelete(nrOfRoomsInUse);
				});
			});
		}
	},
	{
		type: 'actions',
		title: {localText: 'list.actions.title'},
		explanation: {localText:'list.actions.explanation'},
		addButton: {localText:'list.actions.addButton'},
		source: '_settings.actions',
		columns: [
			{ type:'move', title:'' },
			{ type:'edit', title:'' },
			{ type:'delete', title:'' },
			{ property:'description', title:{localText:'list.actions.description'} },
			{ property:'isActive', title:{localText:'list.actions.isActive'}, propertyType:'boolean' },
			{ property:'isTriggerable', title:{localText:'list.actions.isTriggerable'}, propertyType:'boolean' },
			{ property:'isPerformable', title:{localText:'list.actions.isPerformable'}, propertyType:'boolean' },
			{ property:'followUps', title:{localText:'list.actions.nrOfFollowUps'}, propertyType:'array' }
		],
		filter: { property:'stateGroupId', compareTo:'parentId' },
		formType: 'action',
		deleteItem: function(masterParentId, parentId, action) {
			var nrOfFollowUps = 0;
			$.each(_settings.actions, function(i, act){
				nrOfFollowUps += $.grep(act.followUps, function(followUp){ return followUp.actionId == action.id; }).length;
			});
			if (nrOfFollowUps > 0) {
				var errorMessage = __('list.actions.inUse.error') + ' (';
				if (nrOfFollowUps == 1) errorMessage += __('list.followUps.inUse.one'); else if (nrOfFollowUps > 1) errorMessage += __('list.followUps.inUse.multiple').replace('[quantity]', nrOfFollowUps);
				errorMessage += ').';
				alert(errorMessage);
				return false;
			}
			if (!confirm(__('list.actions.confirmDelete').replace('[description]',action.description))) return false;
			_settings.actions = $.grep(_settings.actions, function(item){ return item.id != action.id; });
			saveSettings();
			$('.list[rel-listtype="actions"][rel-parentid="'+action.stateGroupId+'"]').renderList();
			return true;
		}
	},
	{
		type: 'followUps',
		title: {localText: 'list.followUps.title'},
		explanation: {localText:'list.followUps.explanation'},
		addButton: {localText:'list.followUps.addButton'},
		source: 'getActionById(parentId).followUps',
		columns: [
			{ type:'move', title:'' },
			{ type:'edit', title:'' },
			{ type:'delete', title:'' },
			{ property:'isActive', title:{localText:'list.followUps.isActive'}, propertyType:'boolean' },
			{ property:'delaySeconds', title:{localText:'list.followUps.delaySeconds'} },
			{ property:'stateId', title:{localText:'list.followUps.newState'}, propertyType:'state' },
			{ property:'actionId', title:{localText:'list.followUps.newAction'}, propertyType:'action' }
		],
		filter: null,
		formType: 'followUp',
		deleteItem: function(stateGroupId, actionId, followUp) {
			if (!confirm(__('list.followUps.confirmDelete'))) return false;
			var action = findObjInArray(_settings.actions, 'id', actionId);
			if (action == null) return false;
			action.followUps = $.grep(action.followUps, function(item){ return item.id != followUp.id; });
			saveSettings();
			$('.list[rel-listtype="followUps"][rel-masterparentid="'+stateGroupId+'"][rel-parentid="'+actionId+'"]').renderList();
			return true;
		}
	}
];


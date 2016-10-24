// Definition of list types
var _listTypes = [
	{
		type: 'stateGroups',
		title: 'State groepen',
		explanation: 'uitleg over state groepen',
		addButtonText: 'Toevoegen',
		source: '_settings.stateGroups',
		columns: [
			{ type:'move', title:'' },
			{ type:'edit', title:'' },
			{ type:'delete', title:'' },
			{ property:'description', title:'Omschrijving' }
		],
		filter: null,
		formType: 'stateGroup',
		deleteItem: function(masterParentId, parentId, stateGroup) {
			var nrOfRooms = $.grep(_settings.rooms, function(room){ return room.stateGroupId == stateGroup.id; }).length;
			var nrOfStates = $.grep(_settings.states, function(state){ return state.stateGroupId == stateGroup.id; }).length;
			var nrOfActions = $.grep(_settings.actions, function(action){ return action.stateGroupId == stateGroup.id; }).length;
			if ((nrOfRooms > 0) || (nrOfStates > 0) || (nrOfActions)) {
				var errorMessage = 'De state group is nog in gebruik (';
				if (nrOfRooms == 1) errorMessage += '1 ruimte'; else if (nrOfRooms > 1) errorMessage += nrOfRooms + ' ruimtes';
				if ((nrOfRooms >= 1) && (nrOfStates >= 1)) errorMessage += ', ';
				if (nrOfStates == 1) errorMessage += '1 state'; else if (nrOfStates > 1) errorMessage += nrOfStates + ' states';
				if (((nrOfRooms+nrOfStates) >= 1) && (nrOfActions >= 1)) errorMessage += ', ';
				if (nrOfActions == 1) errorMessage += '1 actie'; else if (nrOfActions > 1) errorMessage += nrOfActions + ' acties';
				errorMessage += ').';
				alert(errorMessage);
				return false;
			}
			if (!confirm('Weet je zeker dat je de state groep "'+stateGroup.description+'" wilt verwijderen?')) return false;
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
		title: 'Ruimtes',
		explanation: 'uitleg over rooms',
		addButtonText: 'Toevoegen',
		source: '_settings.rooms',
		columns: [
			{ type:'move', title:'' },
			{ type:'edit', title:'' },
			{ type:'delete', title:'' },
			{ property:'description', title:'Omschrijving' },
			{ property:'isActive', title:'Actief', propertyType:'boolean' },
			{ property:'stateId', title:'State', propertyType:'state' }
		],
		filter: { property:'stateGroupId', compareTo:'parentId' },
		formType: 'room',
		deleteItem: function(masterParentId, parentId, room) {
			if (!confirm('Weet je zeker dat je de ruimte "'+room.description+'" wilt verwijderen?\nFlows waarin je deze ruimte gebruikt, zullen niet meer werken.')) return false;
			_settings.rooms = $.grep(_settings.rooms, function(item){ return item.id != room.id; });
			saveSettings();
			$('.list[rel-listtype="rooms"][rel-parentid="'+room.stateGroupId+'"]').renderList();
			return true;
		}
	},
	{
		type: 'states',
		title: 'States',
		explanation: 'uitleg over states',
		addButtonText: 'Toevoegen',
		source: '_settings.states',
		columns: [
			{ type:'move', title:'' },
			{ type:'edit', title:'' },
			{ type:'delete', title:'' },
			{ property:'description', title:'Omschrijving' },
			{ property:'isActive', title:'Actief', propertyType:'boolean' },
			{ property:'isOverruling', title:'Prioriteit', propertyType:'boolean' }
		],
		filter: { property:'stateGroupId', compareTo:'parentId' },
		formType: 'state',
		deleteItem: function(masterParentId, parentId, state) {
			var nrOfRooms = $.grep(_settings.rooms, function(room){ return room.stateId == state.id; }).length;
			var nrOfStates = $.grep(_settings.states, function(sta){ return sta.delayStateId == state.id; }).length;
			var nrOfActions = $.grep(_settings.actions, function(action){ return action.nextStateId == state.id; }).length;
			if ((nrOfRooms > 0) || (nrOfStates > 0) || (nrOfActions)) {
				var errorMessage = 'De state is nog in gebruik (';
				if (nrOfRooms == 1) errorMessage += '1 ruimte'; else if (nrOfRooms > 1) errorMessage += nrOfRooms + ' ruimtes';
				if ((nrOfRooms >= 1) && (nrOfStates >= 1)) errorMessage += ', ';
				if (nrOfStates == 1) errorMessage += '1 state'; else if (nrOfStates > 1) errorMessage += nrOfStates + ' states';
				if (((nrOfRooms+nrOfStates) >= 1) && (nrOfActions >= 1)) errorMessage += ', ';
				if (nrOfActions == 1) errorMessage += '1 actie'; else if (nrOfActions > 1) errorMessage += nrOfActions + ' acties';
				errorMessage += ').';
				alert(errorMessage);
				return false;
			}
			if (!confirm('Weet je zeker dat je de state "'+state.description+'" wilt verwijderen?\nFlows waarin je deze state gebruikt, zullen niet meer werken.')) return false;
			_settings.states = $.grep(_settings.states, function(item){ return item.id != state.id; });
			saveSettings();
			$('.list[rel-listtype="states"][rel-parentid="'+state.stateGroupId+'"]').renderList();
			return true;
		}
	},
	{
		type: 'actions',
		title: 'Acties',
		explanation: 'uitleg over acties',
		addButtonText: 'Toevoegen',
		source: '_settings.actions',
		columns: [
			{ type:'move', title:'' },
			{ type:'edit', title:'' },
			{ type:'delete', title:'' },
			{ property:'description', title:'Omschrijving' },
			{ property:'isActive', title:'Actief', propertyType:'boolean' },
			{ property:'isTriggerable', title:'Triggerable', propertyType:'boolean' },
			{ property:'isPerformable', title:'Performable', propertyType:'boolean' },
			{ property:'followUps', title:'# Follow-ups', propertyType:'array' }
		],
		filter: { property:'stateGroupId', compareTo:'parentId' },
		formType: 'action',
		deleteItem: function(masterParentId, parentId, action) {
			var nrOfRooms = 0;
			var nrOfStates = $.grep(_settings.states, function(state){ return state.delayActionIdId == action.id; }).length; // not used yet
			var nrOfActions = $.grep(_settings.actions, function(act){ return act.performActionId == action.id; }).length;
			if ((nrOfRooms > 0) || (nrOfStates > 0) || (nrOfActions)) {
				var errorMessage = 'De state is nog in gebruik (';
				if (nrOfRooms == 1) errorMessage += '1 ruimte'; else if (nrOfRooms > 1) errorMessage += nrOfRooms + ' ruimtes';
				if ((nrOfRooms >= 1) && (nrOfStates >= 1)) errorMessage += ', ';
				if (nrOfStates == 1) errorMessage += '1 state'; else if (nrOfStates > 1) errorMessage += nrOfStates + ' states';
				if (((nrOfRooms+nrOfStates) >= 1) && (nrOfActions >= 1)) errorMessage += ', ';
				if (nrOfActions == 1) errorMessage += '1 actie'; else if (nrOfActions > 1) errorMessage += nrOfActions + ' acties';
				errorMessage += ').';
				alert(errorMessage);
				return false;
			}
			if (!confirm('Weet je zeker dat je de actie "'+action.description+'" wilt verwijderen?\nFlows waarin je deze actie gebruikt, zullen niet meer werken.')) return false;
			_settings.actions = $.grep(_settings.actions, function(item){ return item.id != action.id; });
			saveSettings();
			$('.list[rel-listtype="actions"][rel-parentid="'+action.stateGroupId+'"]').renderList();
			return true;
		}
	},
	{
		type: 'followUps',
		title: 'Follow-up states & actions',
		explanation: null,
		addButtonText: 'Toevoegen',
		source: 'getActionById(parentId).followUps',
		columns: [
			{ type:'move', title:'' },
			{ type:'edit', title:'' },
			{ type:'delete', title:'' },
			{ property:'isActive', title:'Actief', propertyType:'boolean' },
			{ property:'delaySeconds', title:'Delay' },
			{ property:'stateId', title:'State', propertyType:'state' },
			{ property:'actionId', title:'Action', propertyType:'action' }
		],
		filter: null,
		formType: 'followUp',
		deleteItem: function(stateGroupId, actionId, followUp) {
			if (!confirm('Weet je zeker dat je deze follow-up wilt verwijderen?')) return false;
			var action = findObjInArray(_settings.actions, 'id', actionId);
			if (action == null) return false;
			action.followUps = $.grep(action.followUps, function(item){ return item.id != followUp.id; });
			saveSettings();
			$('.list[rel-listtype="followUps"][rel-masterparentid="'+stateGroupId+'"][rel-parentid="'+actionId+'"]').renderList();
			return true;
		}
	}
];


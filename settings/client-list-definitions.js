// Definition of list types
var _listTypes = [
	{
		type: 'stateOverview',
		title: {localText:'list.stateOverview.title'},
		explanation: null,
		addButton: null,
		formType: 'section',
		source: '_settings.sections',
		columns: [
			{ property:'groupId', title:{localText:'list.stateOverview.group'}, propertyType:'group' },
			{ type:'setObject', title:'', onSetObject:function(cellObj, section){ cellObj.append($('<button/>').text('-').attr('title', __('list.editButton')).addClass('editButton').click(function(){ $('button[rel-id="'+section.id+'"].editButton').showForm(); })); } },
			{ property:'description', title:{localText:'list.stateOverview.section'} },
			{ type:'sectionState', title:{localText:'list.stateOverview.currentState'} }
		],
		filter: null
	},
	{
		type: 'groups',
		title: {localText:'list.groups.title'},
		explanation: {localText:'list.groups.explanation'},
		addButton: {localText:'list.groups.addButton'},
		source: '_settings.groups',
		columns: [
			{ type:'move', title:'' },
			{ type:'edit', title:'' },
			{ type:'delete', title:'' },
			{ property:'description', title:{localText:'list.groups.description'} },
			{ property:'enableFlows', title:{localText:'list.groups.enableFlows'}, propertyType:'boolean' }
		],
		filter: null,
		formType: 'group',
		deleteItem: function(masterParentId, parentId, group) {
			var inUseMessage = '';
			var nrOfSections = $.grep(_settings.sections, function(x){ return x.groupId == group.id; }).length;
			var nrOfStates = $.grep(_settings.states, function(x){ return x.groupId == group.id; }).length;
			var nrOfFlowTriggers = $.grep(_settings.flowTriggers, function(x){ return x.groupId == group.id; }).length;
			var nrOfFlowActions = $.grep(_settings.flowActions, function(x){ return x.groupId == group.id; }).length;
			var nrOfEvents = $.grep(_settings.events, function(x){ return x.groupId == group.id; }).length;
			if (nrOfSections == 1) inUseMessage += ', ' + __('list.sections.inUse.one'); else if (nrOfSections > 1) inUseMessage += ', ' + __('list.sections.inUse.multiple').replace('[quantity]', nrOfSections);
			if (nrOfStates == 1) inUseMessage += ', ' + __('list.states.inUse.one'); else if (nrOfStates > 1) inUseMessage += ', ' + __('list.states.inUse.multiple').replace('[quantity]', nrOfStates);
			if (nrOfFlowTriggers == 1) inUseMessage += ', ' + __('list.flowTriggers.inUse.one'); else if (nrOfFlowTriggers > 1) inUseMessage += ', ' + __('list.flowTriggers.inUse.multiple').replace('[quantity]', nrOfFlowTriggers);
			if (nrOfFlowActions == 1) inUseMessage += ', ' + __('list.flowActions.inUse.one'); else if (nrOfFlowActions > 1) inUseMessage += ', ' + __('list.flowActions.inUse.multiple').replace('[quantity]', nrOfFlowActions);
			if (nrOfEvents == 1) inUseMessage += ', ' + __('list.events.inUse.one'); else if (nrOfEvents > 1) inUseMessage += ', ' + __('list.events.inUse.multiple').replace('[quantity]', nrOfEvents);
		    if (inUseMessage.length > 2)
                alertDialog(__('list.groups.inUse.error') + ' (' + inUseMessage.substring(2) + ').');
            else
                confirmDialog(__('list.groups.confirmDelete').replace('[description]', group.description), function () {
                    _settings.groups = $.grep(_settings.groups, function (item) { return item.id != group.id; });
                    saveSettings();
                    $('.tabControl').invalidateTabs();
		        });
		}
	},
	{
		type: 'sections',
		title: {localText: 'list.sections.title'},
		explanation: {localText:'list.sections.explanation'},
		addButton: {localText:'list.sections.addButton'},
		source: '_settings.sections',
		columns: [
			{ type:'move', title:'' },
			{ type:'edit', title:'' },
			{ type:'delete', title:'' },
			{ property:'description', title:{localText:'list.sections.description'} },
			{ type:'sectionState', title:{localText:'list.sections.currentState'} }
		],
		filter: { property:'groupId', compareTo:'parentId' },
		formType: 'section',
        deleteItem: function (masterParentId, parentId, section) {
            confirmDialog(__('list.sections.confirmDelete').replace('[description]', section.description), function() {
                _settings.sections = $.grep(_settings.sections, function (item) { return item.id != section.id; });
                saveSettings();
                $('.tabControl').invalidateTabs();
            });
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
			{ property:'hasPriority', title:{localText:'list.states.hasPriority'}, propertyType:'boolean' }
		],
		filter: { property:'groupId', compareTo:'parentId' },
		formType: 'state',
		deleteItem: function(masterParentId, parentId, state, callback) {
			var nrOfSections = 0;
			$.each(_settings.sections, function(i, section){
				var sectionState = findObjInArray(_sectionStates, 'sectionId', section.id);
				if ((sectionState != null) && (sectionState.stateId == state.id))
					nrOfSections++;
			});
				
			var inUseMessage = '';
			var nrOfEvents = $.grep(_settings.events, function(x){ return (x.conditionStateId == state.id) || (x.setStateId == state.id); }).length;
			if (nrOfSections == 1) inUseMessage += ', ' + __('list.sections.inUse.one'); else if (nrOfSections > 1) inUseMessage += ', ' + __('list.sections.inUse.multiple').replace('[quantity]', nrOfSections);
			if (nrOfEvents == 1) inUseMessage += ', ' + __('list.events.inUse.one'); else if (nrOfEvents > 1) inUseMessage += ', ' + __('list.events.inUse.multiple').replace('[quantity]', nrOfEvents);
			if (inUseMessage.length > 2)
				alertDialog(__('list.states.inUse.error') + ' (' + inUseMessage.substring(2) + ').');
			else
		        confirmDialog(__('list.states.confirmDelete').replace('[description]', state.description), function() {
                    _settings.states = $.grep(_settings.states, function (item) { return item.id != state.id; });
                    saveSettings();
                    $('.tabControl').invalidateTabs();
                });
		}
	},
	{
		type: 'flowTriggers',
		title: {localText: 'list.flowTriggers.title'},
		explanation: {localText:'list.flowTriggers.explanation'},
		addButton: {localText:'list.flowTriggers.addButton'},
		source: '_settings.flowTriggers',
		columns: [
			{ type:'move', title:'' },
			{ type:'edit', title:'' },
			{ type:'delete', title:'' },
			{ property:'description', title:{localText:'list.flowTriggers.description'} }
		],
		filter: { property:'groupId', compareTo:'parentId' },
		formType: 'flowTrigger',
		deleteItem: function(masterParentId, parentId, flowTrigger) {
			var inUseMessage = '';
			var nrOfEvents = $.grep(_settings.events, function(x){ return x.executeFlowTriggerId == flowTrigger.id; }).length;
			if (nrOfEvents == 1) inUseMessage += ', ' + __('list.events.inUse.one'); else if (nrOfEvents > 1) inUseMessage += ', ' + __('list.events.inUse.multiple').replace('[quantity]', nrOfEvents);
			if (inUseMessage.length > 2)
				alertDialog(__('list.flowTriggers.inUse.error') + ' (' + inUseMessage.substring(2) + ').');
			else
                confirmDialog(__('list.flowTriggers.confirmDelete').replace('[description]', flowTrigger.description), function() {
                    _settings.flowTriggers = $.grep(_settings.flowTriggers, function (item) { return item.id != flowTrigger.id; });
                    saveSettings();
                    $('.tabControl').invalidateTabs();
                });
		}
	},
	{
		type: 'flowActions',
		title: {localText: 'list.flowActions.title'},
		explanation: {localText:'list.flowActions.explanation'},
		addButton: {localText:'list.flowActions.addButton'},
		source: '_settings.flowActions',
		columns: [
			{ type:'move', title:'' },
			{ type:'edit', title:'' },
			{ type:'delete', title:'' },
			{ property:'description', title:{localText:'list.flowActions.description'} }
		],
		filter: { property:'groupId', compareTo:'parentId' },
		formType: 'flowAction',
		deleteItem: function(masterParentId, parentId, flowAction) {
			var inUseMessage = '';
			var nrOfEvents = $.grep(_settings.events, function(x){ return x.eventActionId == flowAction.id; }).length;
			if (nrOfEvents == 1) inUseMessage += ', ' + __('list.events.inUse.one'); else if (nrOfEvents > 1) inUseMessage += ', ' + __('list.events.inUse.multiple').replace('[quantity]', nrOfEvents);
			if (inUseMessage.length > 2)
				alertDialog(__('list.flowActions.inUse.error') + ' (' + inUseMessage.substring(2) + ').');
			else
                confirmDialog(__('list.flowActions.confirmDelete').replace('[description]', flowAction.description), function() {
                    _settings.flowActions = $.grep(_settings.flowActions, function (item) { return item.id != flowAction.id; });
                    saveSettings();
                    $('.tabControl').invalidateTabs();
                });
		}
	},
	{
		type: 'events',
		title: {localText: 'list.events.title'},
		explanation: {localText: 'list.events.explanation'},
		addButton: {localText: 'list.events.addButton'},
		source: '_settings.events',
		columns: [
			{ type:'move', title:'' },
			{ type:'edit', title:'' },
			{ type:'delete', title:'' },
			{ type:'getValue', title:{localText:'list.events.eventType'}, onGetValue:function(event) {
				var flowAction = findObjInArray(_settings.flowActions, 'id', event.eventActionId);
				if (flowAction != null) return __('list.events.after') + ' ' + flowAction.description; else return '';
			} },
			{ property:'delaySeconds', title:{localText:'list.events.delaySeconds'}, cellPostfix:' s' },
			{ type:'getValue', title:{localText:'list.events.conditionType'}, onGetValue:function(event) {
				var conditionState = findObjInArray(_settings.states, 'id', event.conditionStateId);
				if ((conditionState != null) && event.conditionIsEqual) return __('list.events.if') + ' ' + conditionState.description;
				if ((conditionState != null) && !event.conditionIsEqual) return __('list.events.ifNot') + ' ' + conditionState.description;
				return __('list.events.always');
			} },
			{ type:'getValue', title:{localText:'list.events.executionType'}, onGetValue:function(event) {
				var executionDescription = '<ul>';
				
				var setState = findObjInArray(_settings.states, 'id', event.setStateId);
				if (setState != null) 
					executionDescription += '<li>' + __('list.events.set') + ' ' + setState.description + (event.canOverrideStatePriority ? ' *' : '') + '</li>';
				
				var flowTrigger = findObjInArray(_settings.flowTriggers, 'id', event.executeFlowTriggerId);
				if (flowTrigger != null)
					executionDescription += '<li>' + __('list.events.trigger') + ' ' + flowTrigger.description + '</li>';
				
				return executionDescription + '</ul>';
			} },
		],
		filter: { property:'groupId', compareTo:'parentId' },
		formType: 'event',
		onAdd: function(groupId, addCallback) {
			var nrOfFlowActions = $.grep(_settings.flowActions, function(x){ return x.groupId == groupId; }).length;
		    if (nrOfFlowActions == 0)
		        alertDialog(__('list.events.cannotAdd'));
		    else
		        addCallback();
		},
        deleteItem: function (masterParentId, parentId, event) {
            confirmDialog(__('list.events.confirmDelete').replace('[description]', event.description), function() {
                _settings.events = $.grep(_settings.events, function (item) { return item.id != event.id; });
                saveSettings();
                $('.tabControl').invalidateTabs();
            });
		}
	}
];

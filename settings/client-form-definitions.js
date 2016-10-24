// Definition of form types
var _formTypes = [
	{
		type: 'stateGroup',
		source: '_settings.stateGroups',
		filter: null,
		listType: 'stateGroups',
		fields: [
			{ property:'description', title:{localText:'edit.stateGroup.description'}, isMandatory:true }
		],
		afterSave: function(stateGroup, formObj) { initializeTabs(); $('.tabControl').invalidateTabs(); }
	},
	{
		type: 'room',
		source: '_settings.rooms',
		filter: { property:'stateGroupId', compareTo:'parentId' },
		listType: 'rooms',
		fields: [
			{ property:'description', title:{localText:'edit.room.description'}, isMandatory:true },
			{ property:'isActive', title:{localText:'edit.room.isActive'}, propertyType:'boolean', defaultValue:true },
			{ type:'currentRoomState', title:{localText:'edit.room.currentState'} },
			{ type:'newRoomState', title:{localText:'edit.room.newState'}, info:{localText:'edit.room.newStateInfo'}, addEmptyItem:true }
		],
		afterSave: function(room, formObj) {
			var newStateId = formObj.find('select#fieldnewRoomState option:selected').val();
			if ((newStateId != null) && (newStateId.length > 0))
				setRoomState(room.id, newStateId);
		}
	},
	{
		type: 'state',
		source: '_settings.states',
		filter: { property:'stateGroupId', compareTo:'parentId' },
		listType: 'states',
		fields: [
			{ property:'description', title:{localText:'edit.state.description'}, isMandatory:true },
			{ property:'isActive', title:{localText:'edit.state.isActive'}, propertyType:'boolean', defaultValue:true },
			{ property:'isOverruling', title:{localText:'edit.state.isOverruling'}, propertyType:'boolean', defaultValue:false, info:{localText:'edit.state.isOverrulingInfo'} }
		]
	},
	{
		type: 'action',
		popupWidth: 600,
		source: '_settings.actions',
		filter: { property:'stateGroupId', compareTo:'parentId' },
		listType: 'actions',
		fields: [
			{ property:'description', title:{localText:'edit.action.description'}, isMandatory:true },
			{ property:'isActive', title:{localText:'edit.action.isActive'}, propertyType:'boolean', defaultValue:true },
			{ property:'isTriggerable', title:{localText:'edit.action.isTriggerable'}, width:50, propertyType:'boolean', defaultValue:true, info:{localText:'edit.action.isTriggerableInfo'} },
			{ property:'isPerformable', title:{localText:'edit.action.isPerformable'}, width:50, propertyType:'boolean', defaultValue:true, info:{localText:'edit.action.isPerformableInfo'}, onChange:function(formObj, checkBox){
				formObj.find('.listContainer').hide();
				if (checkBox.is(':checked'))
					formObj.find('.listContainer').show();
			} },
			{ property:'followUps', propertyType:'array' }
		],
		controls: [
			{type:'list', listType:'followUps' }
		],
		onShow: function(formObj, action) {
			formObj.find('.listContainer').hide();
			if (action.isPerformable)
				formObj.find('.listContainer').show();
		}
	},
	{
		type: 'followUp',
		source: 'getActionById(parentId).followUps',
		filter: null,
		listType: 'followUps',
		fields: [
			{ property:'isActive', title:{localText:'edit.followUp.isActive'}, width:20, propertyType:'boolean', defaultValue:true },
			{ property:'doNotCheckOverruling', title:{localText:'edit.followUp.doNotCheckOverruling'}, width:80, propertyType:'boolean', defaultValue:false, info:{localText:'edit.followUp.doNotCheckOverrulingInfo'} },
			{ property:'delaySeconds', title:{localText:'edit.followUp.delaySeconds'}, defaultValue:0, isNumeric:true },
			{ property:'stateId', title:{localText:'edit.followUp.nextState'}, propertyType:'state' },
			{ property:'actionId', title:{localText:'edit.followUp.nextAction'}, propertyType:'action', info:{localText:'edit.followUp.nextActionInfo'} }
		]
	}
];


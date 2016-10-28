// Definition of form types
var _formTypes = [
	{
		type: 'group',
		source: '_settings.groups',
		filter: null,
		listType: 'groups',
		fields: [
			{ property:'description', title:{localText:'edit.group.description'}, isMandatory:true },
			{ property:'enableFlows', title:{localText:'edit.group.enableFlows'}, propertyType:'boolean', defaultValue:true }
		],
		onShow: function(formObj, group) {
			if ($.grep(_settings.flowTriggers, function(x){ return x.groupId == group.id; }).length > 0)
				formObj.find('#fieldenableFlowTriggers').prop('disabled',true);
			if ($.grep(_settings.flowActions, function(x){ return x.groupId == group.id; }).length > 0)
				formObj.find('#fieldenableFlowActions').prop('disabled',true);
		},
		afterSave: function(group, formObj) { $('.tabControl').invalidateTabs(); }
	},
	{
		type: 'section',
		source: '_settings.sections',
		filter: { property:'groupId', compareTo:'parentId' },
		listType: 'sections',
		fields: [
			{ property:'description', title:{localText:'edit.section.description'}, isMandatory:true },
			{ type:'currentSectionState', title:{localText:'edit.section.currentState'} },
			{ type:'newSectionState', title:{localText:'edit.section.newState'}, info:{localText:'edit.section.newStateInfo'}, addEmptyItem:true }
		],
		onShow: function(formObj, section) {
			if (_settings.states.length == 0)
				$('#fieldContainerundefined').hide();
		},
		afterSave: function(section, formObj) {
			var newStateId = formObj.find('select#fieldnewSectionState option:selected').val();
			if ((newStateId != null) && (newStateId.length > 0))
				setSectionState(section, newStateId);
		}
	},
	{
		type: 'state',
		source: '_settings.states',
		filter: { property:'groupId', compareTo:'parentId' },
		listType: 'states',
		fields: [
			{ property:'description', title:{localText:'edit.state.description'}, isMandatory:true },
			{ property:'hasPriority', title:{localText:'edit.state.hasPriority'}, propertyType:'boolean', defaultValue:false, info:{localText:'edit.state.hasPriorityInfo'} }
		]
	},
	{
		type: 'flowTrigger',
		source: '_settings.flowTriggers',
		filter: { property:'groupId', compareTo:'parentId' },
		listType: 'flowTriggers',
		fields: [
			{ property:'description', title:{localText:'edit.flowTrigger.description'}, isMandatory:true }
		]
	},
	{
		type: 'flowAction',
		source: '_settings.flowActions',
		filter: { property:'groupId', compareTo:'parentId' },
		listType: 'flowActions',
		fields: [
			{ property:'description', title:{localText:'edit.flowAction.description'}, isMandatory:true }
		]
	},
	{
		type: 'event',
		source: '_settings.events',
		filter: { property:'groupId', compareTo:'parentId' },
		listType: 'events',
		fields: [
			{ property:'eventActionId', title:{localText:'edit.event.eventAction'}, width:55, propertyType:'flowAction' },
			{ property:'delaySeconds', title:{localText:'edit.event.delaySeconds'}, width:45, defaultValue:0, isNumeric:true },
			{ property:'conditionStateId', title:{localText:'edit.event.conditionState'}, propertyType:'state', addEmptyItem:true },
			{ property:'conditionIsEqual', propertyType:'boolean', defaultValue:true },
			{ property:'setStateId', title:{localText:'edit.event.setState'}, propertyType:'state', addEmptyItem:true },
			{ property:'canOverrideStatePriority', title:{localText:'edit.event.canOverrideStatePriority'}, propertyType:'boolean' },
			{ property:'executeFlowTriggerId', title:{localText:'edit.event.executeFlowTrigger'}, propertyType:'flowTrigger', addEmptyItem:true }
		],
		heightOffset: -70,
		onShow: function(formObj, event) {
			formObj.find('#fieldContainerconditionIsEqual').hide();
			var conditionIsEqualObj = formObj.find('#fieldconditionIsEqual');
			conditionIsEqualObj.detach();
			formObj.find('#fieldContainerconditionStateId').prepend(conditionIsEqualObj);
			formObj.find('#fieldContainerconditionStateId label').attr('for', conditionIsEqualObj.attr('id'));
			conditionIsEqualObj.change(function(){
				var newLabel = __('edit.event.conditionState');
				if (!conditionIsEqualObj.prop('checked'))
					newLabel = newLabel.replace('[','').replace(']','');
				else {
					var startIdx = newLabel.indexOf('[');
					var endIdx = newLabel.indexOf(']');
					if ((startIdx >= 0) && (endIdx > startIdx))
						newLabel = newLabel.replace(newLabel.substring(startIdx, endIdx+1), '');
				}
				formObj.find('#fieldContainerconditionStateId label').text(newLabel);
			});
			conditionIsEqualObj.trigger('change');
			
			function setControls() {
				formObj.find('#fieldconditionIsEqual, #fieldContainercanOverrideStatePriority').hide();
				if ((formObj.find('#fieldconditionStateId').val() != null) && (formObj.find('#fieldconditionStateId').val().length > 0))
					formObj.find('#fieldconditionIsEqual').show();
				if ((formObj.find('#fieldsetStateId').val() != null) && (formObj.find('#fieldsetStateId').val().length > 0))
					formObj.find('#fieldContainercanOverrideStatePriority').show();
			}
			
			formObj.find('input[type="radio"], select').change(function(){ setControls(); });
			setControls();
		},
		onValidate: function(formObj, event) {
			var errorMessages = '';
			
			var eventActionObj = formObj.find('#fieldeventActionId');
			var setStateObj = formObj.find('#fieldsetStateId');
			var executeFlowTriggerObj = formObj.find('#fieldexecuteFlowTriggerId');
			
			if ((eventActionObj.val() == null) || (eventActionObj.val().length == 0))
				errorMessages += __('edit.error.noFlowToTriggerEvent') + '\n';
			if (((setStateObj.val() == null) || (setStateObj.val().length == 0)) && ((executeFlowTriggerObj.val() == null) || (executeFlowTriggerObj.val().length == 0)))
				errorMessages += __('edit.error.eventStateOrTrigger') + '\n';
			
			return errorMessages;
		}
	}
];

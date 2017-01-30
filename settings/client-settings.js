var _settings = {};

// Array which will contain all tabs
var _tabs = [];
var _sectionStates = [];

function onHomeyReady(){
	// Get app's settings from our own API
	Homey.api('GET', '/get-settings/', function(err, result){
		if (err || ((result != null) && !result.successful || (result.settings == null))) alert('Settings could not be loaded, sorry. Please try again.');
		else {
			_settings = result.settings;
			
			// Initialize and load tabs, and select first tab
			$('.tabControl').invalidateTabs();
			
			// Retrieve current section states every second
			retrieveSectionStates();
			repeatFunction(1000, retrieveSectionStates);
		}
	});
	Homey.ready();
};

// Retrieve section states
function retrieveSectionStates() {
	Homey.api('GET', '/section-states/', function(err, result){
		if (err || (result == null) || !result.successful) return;
		_sectionStates = result.sectionStates;
	});
	return true;
}

// Set section state
function setSectionState(section, newStateId) {
	Homey.api('POST', '/set-section-state/?groupid='+section.groupId+'&sectionid='+section.id+'&stateid='+newStateId, function(err, result){
		if (err || (result == null) || !result.successful) {
		}
	});
}

// Save settings to Homey
function saveSettings() {
	Homey.set('statecontrol-settings', _settings, function(err){ if (err) alert('Error during saving of your settings. Please try again.'); });
};

// Initialize array of tabs
function initializeTabs() {
	_tabs = [];
	
	if ((_settings.groups.length > 0) && (_settings.sections.length > 0) && (_settings.states.length > 0))
		_tabs[_tabs.length] = { id:'stateOverview', title:__('tab.stateOverview.title'), parentId:'', controls:[ { type:'list', listType:'stateOverview' } ] };
	
	// Add a tab for each group, each tab with lists for events, flow triggers and flow actions
	$.each(_settings.groups, function(i, group) {
		if (group.enableFlows)
			_tabs[_tabs.length] = { id:'group'+group.id, title:__('tab.group.eventsFor')+' '+group.description, parentId:group.id, controls:[
				{ title:__('tab.group.eventsFor')+' '+group.description, type:'list', listType:'events' },
				{ title:__('tab.group.flowActionsFor')+' '+group.description, type:'list', listType:'flowActions' },
				{ title:__('tab.group.flowTriggersFor')+' '+group.description, type:'list', listType:'flowTriggers' }
			]};
	});
	
	// If groups have been defined, add tabs for the sections and states
	if (_settings.groups.length > 0) {
		var statesTab = { id:'states', title:__('tab.states.title'), controls:[] };
		$.each(_settings.groups, function(i, group){
			statesTab.controls[statesTab.controls.length] = { title:__('tab.states.statesFor')+' '+group.description, type:'list', listType:'states', parentId:group.id };
		});
		_tabs[_tabs.length] = statesTab;
		
		var sectionsTab = { id:'sections', title:__('tab.sections.title'), controls:[] };
		$.each(_settings.groups, function(i, group){
			sectionsTab.controls[sectionsTab.controls.length] = { title:__('tab.sections.sectionsFor')+' '+group.description, type:'list', listType:'sections', parentId:group.id };
		});
		_tabs[_tabs.length] = sectionsTab;
	}
	
	_tabs[_tabs.length] = { id:'groups', title:__('tab.groups.title'), parentId:'', controls:[ { type:'list', listType:'groups' } ] };
	_tabs[_tabs.length] = { id:'explanation', title:__('tab.explanation.title'), parentId:'', controls:[ { type:'content', url:__('explanationUrl') } ] };
}

// (Re)load tabs in UI
$.fn.invalidateTabs = function() {
	initializeTabs();
	var tabControlObj = $(this);
	var activeTabId = '';
	if (tabControlObj.find('.tab.active').length > 0)
		activeTabId = tabControlObj.find('.tab.active').attr('rel-tabid');
	var scrollTopValue = $(window).scrollTop();
	
	tabControlObj.find('.tabs, .pages').empty();
	$.each(_tabs, function(i, tab){ addTab(tab); });
	tabControlObj.loadLocalizedTexts();
	
	if (activeTabId.length > 0) {
		tabControlObj.find('.tab[rel-tabid="'+activeTabId+'"]').selectTab();
		if (scrollTopValue >= 0)
			$(window).scrollTop(scrollTopValue);
	} else
		tabControlObj.find('.tab').eq(0).selectTab();
}

// Load the tab and its controls
function addTab(tab) {
	// Add tab item & page
	$('.tabControl .tabs').append($('<div/>').addClass('tab').attr('rel-tabid',tab.id).text(tab.title).applyLocalText(tab).attr('rel-parentid', tab.parentId).click(function(){ $(this).selectTab(); }));
	var page = $('<div/>').addClass('page');
	$('.tabControl .pages').append(	page).attr('rel-parentid', tab.parentId);
	page.append($('<h2/>').addClass('tabTitle').text(tab.title).applyLocalText(tab));
	
	// Iterate through defined controls, and add them
	$.each(tab.controls, function(i, control){
		if (control.type == 'list') {
			var parentId = control.parentId;
			if (parentId == null)
				parentId = tab.parentId;
			loadList(control.listType, control.title, null, parentId, page);
		} else if (control.type == 'content') {
			$.get(control.url, function(html){ page.html(html); });
		}
	});
}

// Select a tab; make the tab and its respective page active
$.fn.selectTab = function() {
	var tabObj = $(this);
	$('.tabControl .tab').removeClass('active');
	$('.tabControl .page').removeClass('active');
	tabObj.addClass('active');
	$('.tabControl .page').eq(tabObj.index()).addClass('active');
}

// Load a list into its container
function loadList(listTypeName, listTitle, masterParentId, parentId, containerObj) {
	// Find the list type
	var listType = findObjInArray(_listTypes, 'type', listTypeName);
	if (listType == null) return;
	
	// Add the list's container, title and explanation
	var listParentObj = $('<fieldset/>').addClass('listContainer');
	containerObj.append(listParentObj);
	var legendObj = $('<legend/>');
	listParentObj.append(legendObj);
	if ((listTitle != null) && (listTitle.length > 0))
		legendObj.text(listTitle);
	else
		legendObj.applyLocalText(listType.title);
	
	if (listType.explanation != null)
		listParentObj.append($('<p/>').applyLocalText(listType.explanation));
	
	// Add the header row and its columns
	var headRowObj = $('<div/>').addClass('lister listRow head').attr('rel-listtype', listTypeName);
	listParentObj.append(headRowObj);
	$.each(listType.columns, function(i, column){ headRowObj.append($('<div/>').addClass('col').applyLocalText(column.title)); });
	
	// Create the list object
	var listObj = $('<div/>').addClass('list lister').attr('rel-masterparentid', masterParentId).attr('rel-parentid', parentId).attr('rel-listtype', listTypeName);
	listParentObj.append(listObj);
	
	// Add button
	if (listType.addButton != null) {
		var addButtonObj = $('<button/>').applyLocalText(listType.addButton).attr('rel-masterparentid', masterParentId).attr('rel-parentid', parentId).attr('rel-formtype', listType.formType).click(function(){
            if (listType.onAdd != null) {
                listType.onAdd($(this).attr('rel-parentid'), () => {
                    $(this).showForm();
                });
            } else
                $(this).showForm();
		});
		listParentObj.append(addButtonObj);
	}
	
	// Load localized texts
	listParentObj.loadLocalizedTexts();
		
	// Render the list
	listObj.renderList();
	
	return listParentObj;
}

// Render a list's items
$.fn.renderList = function() {
	// Get the list object and the list type definition
	var listObj = $(this);
	var listType = findObjInArray(_listTypes, 'type', listObj.attr('rel-listtype'));
	if (listType == null) return;
	var masterParentId = listObj.attr('rel-masterparentid');
	var parentId = listObj.attr('rel-parentid');
	
	// Remove current item rows
	listObj.find('.row.item').remove();
	
	// Determine source items (and if specified, with filter)
	var sourceItems = [];
	if (listType.filter != null) {
		var compareToValue = '';
		if (listType.filter.compareTo == 'parentId')
			compareToValue = parentId;
		sourceItems = getFilteredSourceItems(listType.source, listType.filter, compareToValue);
	} else
		sourceItems = eval(listType.source);
	
	// Hide the list if there are not items to be shown
	if ((sourceItems == null) || (sourceItems.length == 0)) {
		listObj.parent().find('.listRow.head').hide();
		listObj.hide();
	}
	else {
		listObj.parent().find('.listRow.head').show();
		listObj.show();
	}
	
	// Iterate through the source items and create the rows
	$.each(sourceItems, function(e, sourceItem){
		// Create the row
		var rowObj = $('<div/>').addClass('row item').attr('rel-id', sourceItem.id);
		listObj.append(rowObj);
		
		// Iterate through the columns to add as cells
		$.each(listType.columns, function(i, column){
			var cellObj = $('<div/>').addClass('col');
			// Buttons
			if (column.type == 'edit')
				cellObj.append($('<button/>').text('-').attr('title', __('list.editButton')).addClass('editButton').attr('rel-id',sourceItem.id).attr('rel-masterparentid', masterParentId).attr('rel-parentid', parentId).attr('rel-formtype', listType.formType).click(function(){ $(this).showForm(); }));
			else if (column.type == 'delete')
				cellObj.append($('<button/>').text('-').attr('title', __('list.editButton')).addClass('deleteButton').attr('rel-id',sourceItem.id).attr('rel-parentid', parentId).click(function(){ if (listType.deleteItem != null) listType.deleteItem(listObj.attr('rel-masterparentid'), listObj.attr('rel-parentid'), sourceItem); }));
			else if (column.type == 'move')
				cellObj.append($('<button/>').text('-').attr('title', __('list.moveButton')).addClass('moveButton').attr('rel-id',sourceItem.id).attr('rel-parentid', parentId));
			else if (column.type == 'sectionState') {
				function updateSectionState() { 
					cellObj.empty();
					var sectionState = findObjInArray(_sectionStates, 'sectionId', sourceItem.id);
					if (sectionState != null) {
					var state = findObjInArray(_settings.states, 'id', sectionState.stateId);
						if (state != null) {
							var spanObj = $('<span/>').text(state.description);
							if (state.hasPriority) spanObj.addClass('hasPriorityState');
							cellObj.append(spanObj);
						}
					}
					return true;
				}
				updateSectionState();
				repeatFunction(250, updateSectionState);
			} else {
				// Value cell
				var cellValue = '';
				if (column.type == 'getValue')
					cellValue = column.onGetValue(sourceItem);
				else if (column.type == 'setObject') {
					cellValue = null;
					column.onSetObject(cellObj, sourceItem);
				}
				else if (column.propertyType == 'boolean')
					cellValue = sourceItem[column.property] ? __('boolean.yes') : __('boolean.no');
				else if (column.propertyType == 'state') {
					cellValue = null;
					var state = findObjInArray(_settings.states, 'id', sourceItem[column.property]);
					if (state != null) {
						var spanObj = $('<span/>').text(state.description);
						if (state.hasPriority) spanObj.addClass('hasPriorityState');
						cellObj.append(spanObj);
					}
				}
				else if (column.propertyType == 'flowTrigger') {
					var flowTrigger = findObjInArray(_settings.flowTriggers, 'id', sourceItem[column.property]);
					if (flowTrigger != null) cellValue = flowTrigger.description;
				}
				else if (column.propertyType == 'flowAction') {
					var flowAction = findObjInArray(_settings.flowActions, 'id', sourceItem[column.property]);
					if (flowAction != null) cellValue = flowAction.description;
				}
				else if (column.propertyType == 'group') {
					cellValue = null;
					var group = findObjInArray(_settings.groups, 'id', sourceItem[column.property]);
					if (group != null) {
						if (!group.enableFlows)
							cellValue = group.description;
						else
							cellObj.append($('<a/>').attr('href','#').text(group.description).click(function(e){
								e.preventDefault();
								$('.tab[rel-tabid="group'+group.id+'"]').selectTab();
							}));
					}
				}
				else if (column.propertyType == 'array')
					cellValue = sourceItem[column.property].length;
				else
					cellValue = sourceItem[column.property];
				
				if (cellValue != null) {
					if (column.cellPostfix != null)
						cellValue += column.cellPostfix;
					cellObj.html(cellValue);
				}
			}
			rowObj.append(cellObj);
		});
	});
	
	// Load localized texts
	listObj.loadLocalizedTexts();
	
	// Make list sortable
	listObj.dragsort('destroy');
	listObj.dragsort({dragSelector:'.moveButton', dragBetween:false, dragEnd:function(){
		var sourceItem = findObjInArray(sourceItems, 'id', $(this).attr('rel-id'));
		if (sourceItem == null) return;
		if (($(this).index() < 0) || ($(this).index() >= sourceItems.length)) return;
		var destinationItem = sourceItems[$(this).index()];
		if (destinationItem == null) return;
		var unfilteredSourceItems = eval(listType.source);
		if ((unfilteredSourceItems == null) || (unfilteredSourceItems.length == 0)) return;
		var indexOfDestinationItem = unfilteredSourceItems.indexOf(destinationItem);
		if ((indexOfDestinationItem < 0) || (indexOfDestinationItem >= unfilteredSourceItems.length)) return;
		var indexOfSourceItem = unfilteredSourceItems.indexOf(sourceItem);
		if ((indexOfSourceItem < 0) || (indexOfSourceItem >= unfilteredSourceItems.length)) return;
		unfilteredSourceItems.splice(indexOfDestinationItem, 0, unfilteredSourceItems.splice(indexOfSourceItem, 1)[0]);
		saveSettings();
		listObj.renderList();
	}});
}

// Show a popup with a form
$.fn.showForm = function() {
	// Get the button object and the settings from its attributes
	var buttonObj = $(this);
	var masterParentId = buttonObj.attr('rel-masterparentid');
	var parentId = buttonObj.attr('rel-parentid');
	var itemId = buttonObj.attr('rel-id');
	if ((itemId == null) || (itemId.length == 0)) itemId = '';
	
	// Get the form type
	var formTypeName = buttonObj.attr('rel-formtype');
	var formType = findObjInArray(_formTypes, 'type', formTypeName);
	if (formType == null) return;
	
	// Create the popup
	var popupHeight = 75;
	$.each(formType.fields, function(i, field){
		var fieldType = getFieldTypeOfFormField(field);
		if (fieldType == 'boolean')
			popupHeight += 35;
		else if (fieldType == 'array')
			popupHeight += 250;
		else
			popupHeight += 65;
	});
	if (formType.heightOffset != null)
		popupHeight += formType.heightOffset;
	var zIndex = 25;
	if ((masterParentId != null) && (masterParentId.length > 0))
		zIndex = 50;
	if ((popupHeight + zIndex) > ($(window).height() - 25))
		popupHeight = $(window).height() - 50;
	var popupWidth = 450;
	if ((formType.popupWidth != null) && (formType.popupWidth > 0))
		popupWidth = formType.popupWidth;
	var popupContainer = loadPopup(createGuid(), null, zIndex, popupWidth, popupHeight);
	
	// Get the source item, or create a new one
	var sourceItems = [];
	if (formType.filter != null) {
		var compareToValue = '';
		if (formType.filter.compareTo == 'parentId')
			compareToValue = parentId;
		sourceItems = getFilteredSourceItems(formType.source, formType.filter, compareToValue);
	} else
		sourceItems = eval(formType.source);
	
	var isNew = false;
	var sourceItem = findObjInArray(sourceItems, 'id', itemId);
	if (sourceItem == null) {
		isNew = true;
		sourceItem = { id:createGuid() };
		if ((formType.filter != null) && (formType.filter.property != null) && (parentId != null) && (parentId.length > 0))
			sourceItem[formType.filter.property] = parentId;
	}
	// Fill the source item with default values
	$.each(formType.fields, function(i, field){
		if (sourceItem[field.property] == null) {
			if ((field.propertyType != 'array') && (field.type != 'sectionState')) {
				var defaultValue = '';
				if (field.defaultValue != null)
					defaultValue = field.defaultValue;
				sourceItem[field.property] = defaultValue;
			} else if (field.propertyType == 'array')
				sourceItem[field.property] = [];
		}
	});
	
	popupContainer.attr('rel-id', sourceItem.id);
	
	// Render the fields
	var columnContainer = null;
	$.each(formType.fields, function(i, field){
		if (field.propertyType != 'array') {
			var fieldParent = popupContainer;
			var fieldType = getFieldTypeOfFormField(field);
			
			// Place field in a column container, if the field has specified a width
			if ((field.width != null) && (field.width > 0) && (columnContainer == null)) {
				columnContainer = $('<div/>').addClass('columnContainer');
				popupContainer.append(columnContainer);
			} else if (((field.width == null) || (field.width <= 0)) && (columnContainer != null))
				columnContainer = null;
				
			if ((field.width != null) && (field.width > 0) && (columnContainer != null)) {
				fieldParent = $('<div/>').addClass('col').css('width', field.width+'%');
				columnContainer.append(fieldParent);
			}
			
			// Create the field container
			var fieldRowObj = $('<div/>').addClass('field row').attr('id', 'fieldContainer'+field.property);
			fieldParent.append(fieldRowObj);
			var inputControl = null;
			
			// Show a clickable tool tip if necessary
			var hasTooltip = false;
			if ((field.info != null) && (field.info.localText != null) && (field.info.localText.length > 0)) {
				hasTooltip = true;
				fieldRowObj.append($('<div/>').addClass('infoTooltip').text('i').click(function(){
					var tooltipPopup = loadPopup(createGuid(), null, 200, 450, 175);
					tooltipPopup.append($('<p/>').applyLocalText(field.info));
					tooltipPopup.append($('<button/>').addClass('right').text(__('close')).click(function(){ tooltipPopup.closePopup(); }));
				}));
			}
			
			// If the field is for a boolean, the checkbox needs to be shown before the label
			if (fieldType == 'boolean') {
				inputControl = $('<input/>').attr('type', 'checkbox').prop('checked', sourceItem[field.property]);
				fieldRowObj.append(inputControl);
			}
			
			// Add the label
			var labelObj = $('<label/>').attr('for', 'field'+field.property).applyLocalText(field.title);
			if (hasTooltip) labelObj.addClass('withTooltip');
			fieldRowObj.append(labelObj);
			
			// Add a text input if appropriate
			if (fieldType == 'text') {
				inputControl = $('<input/>').attr('type', 'text').val(sourceItem[field.property]);
				fieldRowObj.append(inputControl);
			} else if (fieldType == 'radio') {
				inputControl = $('<div/>').addClass('columnContainer');
				$.each(field.items, function(i, item){
					var colObj = $('<div/>').addClass('col').css('width', (100/field.items.length)+'%');
					inputControl.append(colObj);
					var radioObj = $('<input/>').attr('type','radio').val(item.id).attr('name',field.property).attr('id', 'field'+field.property+item.id);
					if (sourceItem[field.property] == item.id)
						radioObj.prop('checked', true);
					colObj.append(radioObj);
					colObj.append($('<label/>').attr('for', 'field'+field.property+item.id).applyLocalText(item.title));
				});
				fieldRowObj.append(inputControl);
			} else if ((fieldType == 'state') || (fieldType == 'newSectionState') || (fieldType == 'flowTrigger') || (fieldType == 'flowAction')) {
				// Add a dropdown if appropriate
				var selectObj = $('<select/>');
				if (field.type != null)
					selectObj.attr('id', 'field'+field.type);
				if (field.addEmptyItem) selectObj.append($('<option/>').val('').text(''));
				
				// Determine the dropdown's list items
				var listItems = [];
				if ((fieldType == 'state') || (fieldType == 'newSectionState'))
					listItems = _settings.states;
				else if (fieldType == 'flowTrigger')
					listItems = _settings.flowTriggers;
				else if (fieldType == 'flowAction')
					listItems = _settings.flowActions;
					
				// Add the list items as options to the dropdown
				$.each($.grep(listItems, function(item){
					if ((masterParentId != null) && (masterParentId.length > 0))
						return (item.groupId == masterParentId) && (item.id != sourceItem.id) && (item.id != parentId);
					else
						return (item.groupId == parentId) && (item.id != sourceItem.id) && (item.id != parentId);
				}), function(i, item){
					selectObj.append($('<option/>').val(item.id).text(item.description));
				});
				
				// Set the current value
				selectObj.val(sourceItem[field.property]);
				inputControl = selectObj;
				fieldRowObj.append(inputControl);
			}
			else if (fieldType == 'currentSectionState') {
				var sectionStateObj = $('<div/>');
				fieldRowObj.append(sectionStateObj);
				function updateSectionState() { 
					sectionStateObj.empty();
					var sectionState = findObjInArray(_sectionStates, 'sectionId', sourceItem.id);
					if (sectionState != null) {
						var state = findObjInArray(_settings.states, 'id', sectionState.stateId);
						if (state != null) {
							var spanObj = $('<span/>').text(state.description);
							if (state.hasPriority) spanObj.addClass('hasPriorityState');
							sectionStateObj.append(spanObj);
						}
					}
					else if (_settings.states.length == 0)
						sectionStateObj.text(__('list.states.noStates'));
					else
						sectionStateObj.text(__('list.states.hasNoState'));
					return true;
				}
				updateSectionState();
				repeatFunction(250, updateSectionState);
			}
			
			if ((inputControl != null) && (field.property != null) && (fieldType != 'radio'))
				inputControl.attr('id', 'field'+field.property);
			if ((inputControl != null) && (field.onChange != null)) {
				inputControl.change(function(){ field.onChange(popupContainer, inputControl); });
				inputControl.blur(function(){ field.onChange(popupContainer, inputControl); });
				inputControl.focus(function(){ field.onChange(popupContainer, inputControl); });
			}
			
			// Set client's focus on the first field
			if (i == 0) fieldRowObj.find('input').eq(0).focus();
		}
	});
	
	// Render additional controls
	if (!isNew && (formType.controls != null) && (formType.controls.length > 0)) {
		// Iterate through defined controls, and add them
		$.each(formType.controls, function(i, control){
			if (control.type == 'list') {
				var listObj = loadList(control.listType, null, parentId, sourceItem.id, popupContainer);
				listObj.hide();
			}
		});
	}
	
	// Add the save button
	popupContainer.append($('<button/>').addClass('right').text(__('edit.saveButton')).click(function(){
		// Validate input
		var errorMessages = '';
		$.each(formType.fields, function(i, field){
			if ((field.propertyType != 'array') && (field.type != 'sectionState')) {
				if ((field.isMandatory != null) && field.isMandatory && (getFieldValueOfFormField(popupContainer, field).toString().length == 0))
					errorMessages += __('edit.error.isMandatory').replace('[field]', __(field.title.localText));
				else if ((field.isNumeric != null) && field.isNumeric && !isNotNegativeInteger(getFieldValueOfFormField(popupContainer, field).toString()))
					errorMessages += __('edit.error.isNotPositiveNumber').replace('[field]', __(field.title.localText));
			}
		});
		if ((errorMessages.length == 0) && (formType.onValidate != null)) {
			var customErrorMessages = formType.onValidate(popupContainer, sourceItem);
			if ((customErrorMessages != null) && (customErrorMessages.length > 0))
				errorMessages += customErrorMessages;
		}
		if (errorMessages.length > 0) { alert(errorMessages); return; }
		
		// Save field values to source item
		$.each(formType.fields, function(i, field){
			if ((field.propertyType != 'array') && (field.type != 'sectionState'))
				sourceItem[field.property] = getFieldValueOfFormField(popupContainer, field);
		});
		
		// Add the source item to its source, if it's new
		var unfilteredSourceItems = eval(formType.source);
		if (findObjInArray(unfilteredSourceItems, 'id', sourceItem.id) == null)
			unfilteredSourceItems[unfilteredSourceItems.length] = sourceItem;
		
		// Save settings
		saveSettings();
		if (formType.afterSave != null)
			formType.afterSave(sourceItem, popupContainer);
		
		// Render the parent list
		$('.list[rel-listtype="'+formType.listType+'"][rel-parentid="'+parentId+'"]').renderList();
		
		popupContainer.closePopup();
	}));
	
	// Add the cancel button
	popupContainer.append($('<button/>').addClass('right').text(__('edit.cancelButton')).click(function(){ popupContainer.closePopup(); }));
	
	// Load localized texts
	popupContainer.loadLocalizedTexts();
	
	if (formType.onShow != null)
		formType.onShow(popupContainer, sourceItem);
}

// Get source items, filtered is necessary
function getFilteredSourceItems(source, filter, compareToValue) {
	var sourceItems = eval(source);
	if (filter != null)
		sourceItems = $.grep(sourceItems, function(item){ return item[filter.property] == compareToValue; });
	return sourceItems;
}

// Get the type of field
function getFieldTypeOfFormField(field) {
	var fieldType = '';
	if (field.propertyType != null)
		fieldType = field.propertyType;
	if (field.type != null)
		fieldType = field.type;
	if ((fieldType == null) || (fieldType.length == 0))
		fieldType = 'text';
	return fieldType;
}

// Get the value of the form field
function getFieldValueOfFormField(formContainer, field) {
	var fieldType = getFieldTypeOfFormField(field);
	var fieldObj = formContainer.find('#field'+field.property);
	var fieldValue = '';
	if (fieldType == 'boolean')
		fieldValue = fieldObj.prop('checked');
	else if (fieldType == 'radio')
		fieldValue = formContainer.find('input[type="radio"][name="'+field.property+'"]:checked').val();
	else
		fieldValue = fieldObj.val();
	return fieldValue;
}

// Get the specified flow trigger from the settings object
function getFlowTriggerById(flowTriggerId) {
	return findObjInArray(_settings.flowTriggers, "id", flowTriggerId);
}

// Get the specified flow action from the settings object
function getFlowActionById(flowActionId) {
	return findObjInArray(_settings.flowActions, "id", flowActionId);
}

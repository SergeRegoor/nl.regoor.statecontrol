var _settingsKey = 'statecontrol-settings';
var _settings = {};

// Array which will contain all tabs
var _tabs = [];
var _roomStates = [];

$(document).ready(function(){
});

function onHomeyReady(){
	// Get app's settings from Homey
	Homey.get(_settingsKey, function(error, settingValue){ 
		_settings = settingValue;
		if (_settings == null) _settings = {};
		if (_settings.stateGroups == null) _settings.stateGroups = [];
		if (_settings.rooms == null) _settings.rooms = [];
		if (_settings.states == null) _settings.states = [];
		if (_settings.actions == null) _settings.actions = [];
		
		// Initialize and load tabs, and select first tab
		initializeTabs();
		$.each(_tabs, function(i, tab){ loadTab(tab, i); });
		$('.tabControl .tab').eq(0).selectTab();
		
		// Retrieve current room states every second
		retrieveRoomStates();
		repeatFunction(1000, retrieveRoomStates);
	});
	Homey.ready();
};

// Retrieve room states
function retrieveRoomStates() {
	Homey.api('GET', '/room-states/', function(err, result){
		if (err || (result == null) || !result.successful) return;
		_roomStates = result.roomStates;
	});
	return true;
}

// Save settings to Homey
function saveSettings() { Homey.set(_settingsKey, _settings); };

// Get room state
function getRoomState(roomId, callback) {
	var room = findObjInArray(_settings.rooms, 'id', roomId);
	if (room == null) return null;
	Homey.get('roomState'+room.id, function(error, settingValue) {
		if (error) callback(null);
		if (!error) {
			var state = null;
			var stateId = settingValue;
			if ((stateId != null) && (stateId.length > 0))
				state = findObjInArray(_settings.states, 'id', stateId);
			callback(state);
		}
	});
}

// Set room state
function setRoomState(roomId, stateId, callback) {
	var room = findObjInArray(_settings.rooms, 'id', roomId);
	var state = findObjInArray(_settings.states, 'id', stateId);
	if ((room == null) || (state == null)) return null;
	Homey.set('roomState'+room.id, state.id, function(){ if (callback != null) callback(); });
}

// Get the description of the state
function getStateDescription(state) {
	if (state == null) return '';
	return state.description;
}

// Initialize array of tabs
function initializeTabs() {
	_tabs = [];
	$.each(_settings.stateGroups, function(i, stateGroup){ addStateGroupTab(stateGroup); });
	addSettingsTab();
}

// Add tab definitions
function addStateGroupTab(stateGroup) { _tabs[_tabs.length] = { title:stateGroup.description, parentId:stateGroup.id, controls:[{type:'list', listType:'rooms' }, {type:'list', listType:'states' }, {type:'list', listType:'actions' }] }; }
function addSettingsTab() { _tabs[_tabs.length] = { localText:'tab.settings.title', parentId:'', controls:[{type:'list', listType:'stateGroups' }] }; }

// Select a tab; make the tab and its respective page active
$.fn.selectTab = function() {
	var tabObj = $(this);
	$('.tabControl .tab').removeClass('active');
	$('.tabControl .page').removeClass('active');
	tabObj.addClass('active');
	$('.tabControl .page').eq(tabObj.index()).addClass('active');
}

// (Re)load tabs in UI
$.fn.invalidateTabs = function() {
	var tabControlObj = $(this);
	tabControlObj.find('.tab').each(function(){
		var tabObj = $(this);
		var tab = findObjInArray(_tabs, 'parentId', tabObj.attr('rel-parentid'));
		if (tab == null) {
			tabControlObj.find('.page').eq(tabObj.index()).remove();
			tabObj.remove();
		} else {
			tabObj.text(tab.title);
			if (tab.localText != null) tabObj.attr('rel-localized', tab.localText);
			tabControlObj.find('.page').eq(tabObj.index()).find('.tabTitle').text(tab.title);
		}
	});
	$.each(_tabs, function(i, tab){
		var tabObj = tabControlObj.find('.tab[rel-parentid="'+tab.parentId+'"]');
		if (tabObj.length == 0)
			loadTab(tab, i);
	});
	tabControl.loadLocalizedTexts();
}

// Load the tab and its controls
function loadTab(tab, index) {
	// Add tab item & page
	$('.tabControl .tabs').insert(index, $('<div/>').addClass('tab').text(tab.title).applyLocalText(tab).attr('rel-parentid', tab.parentId).click(function(){ $(this).selectTab(); }));
	var page = $('<div/>').addClass('page');
	$('.tabControl .pages').insert(index, page).attr('rel-parentid', tab.parentId);
	page.append($('<h2/>').addClass('tabTitle').text(tab.title).applyLocalText(tab));
	
	// Iterate through defined controls, and add them
	$.each(tab.controls, function(i, control){
		if (control.type == 'list')
			loadList(control.listType, null, tab.parentId, page);
	});
}

// Load a list into its container
function loadList(listTypeName, masterParentId, parentId, containerObj) {
	// Find the list type
	var listType = findObjInArray(_listTypes, 'type', listTypeName);
	if (listType == null) return;
	
	// Add the list's container, title and explanation
	var listParentObj = $('<fieldset/>');
	containerObj.append(listParentObj);
	listParentObj.append($('<legend/>').applyLocalText(listType.title));
	listParentObj.append($('<p/>').applyLocalText(listType.explanation));
	
	// Add the header row and its columns
	var headRowObj = $('<div/>').addClass('lister listRow head').attr('rel-listtype', listTypeName);
	listParentObj.append(headRowObj);
	$.each(listType.columns, function(i, column){ headRowObj.append($('<div/>').addClass('col').applyLocalText(column.title)); });
	
	// Create the list object
	var listObj = $('<div/>').addClass('list lister').attr('rel-masterparentid', masterParentId).attr('rel-parentid', parentId).attr('rel-listtype', listTypeName);
	listParentObj.append(listObj);
	
	// Add button
	var addButtonObj = $('<button/>').applyLocalText(listType.addButton).attr('rel-masterparentid', masterParentId).attr('rel-parentid', parentId).attr('rel-formtype', listType.formType).click(function(){ $(this).showForm(); });
	listParentObj.append(addButtonObj);
	
	// Load localized texts
	listParentObj.loadLocalizedTexts();
		
	// Render the list
	listObj.renderList();
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
			else if (column.type == 'roomState') {
				function updateRoomState() { 
					var roomState = findObjInArray(_roomStates, 'roomId', sourceItem.id);
					if (roomState != null)
						cellObj.text(getStateDescription(findObjInArray(_settings.states, 'id', roomState.stateId))); 
					return true;
				}
				updateRoomState();
				repeatFunction(250, updateRoomState);
			} else {
				// Value cell
				var cellValue = '';
				if (column.propertyType == 'boolean')
					cellValue = sourceItem[column.property] ? __('boolean.yes') : __('boolean.no');
				else if (column.propertyType == 'state') {
					var state = findObjInArray(_settings.states, 'id', sourceItem[column.property]);
					if (state != null) cellValue = state.description;
				}
				else if (column.propertyType == 'action') {
					var action = findObjInArray(_settings.actions, 'id', sourceItem[column.property]);
					if (action != null) cellValue = action.description;
				}
				else if (column.propertyType == 'array')
					cellValue = sourceItem[column.property].length;
				else
					cellValue = sourceItem[column.property];
				cellObj.text(cellValue);
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
			popupHeight += 200;
		else
			popupHeight += 65;
	});
	var zIndex = 100;
	if ((masterParentId != null) && (masterParentId.length > 0))
		zIndex = 150;
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
		// Fill the new source item with default values
		$.each(formType.fields, function(i, field){
			if ((field.propertyType != 'array') && (field.type != 'roomState')) {
				var defaultValue = '';
				if (field.defaultValue != null)
					defaultValue = field.defaultValue;
				sourceItem[field.property] = defaultValue;
			} else
				sourceItem[field.property] = [];
		});
	}
	
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
			var fieldRowObj = $('<div/>').addClass('field row');
			fieldParent.append(fieldRowObj);
			
			// Show a clickable tool tip if necessary
			if ((field.info != null) && (field.info.localText != null) && (field.info.localText.length > 0))
				fieldRowObj.append($('<div/>').addClass('infoTooltip').text('i').click(function(){
					var tooltipPopup = loadPopup(createGuid(), null, 200, 450, 175);
					tooltipPopup.append($('<p/>').applyLocalText(field.info));
					tooltipPopup.append($('<button/>').addClass('right').text(__('close')).click(function(){ tooltipPopup.closePopup(); }));
				}));
			
			// If the field is for a boolean, the checkbox needs to be shown before the label
			if (fieldType == 'boolean')
				fieldRowObj.append($('<input/>').attr('type', 'checkbox').attr('id', 'field'+field.property).prop('checked', sourceItem[field.property]));
			
			// Add the label
			fieldRowObj.append($('<label/>').attr('for', 'field'+field.property).applyLocalText(field.title));
			
			// Add a text input if appropriate
			if (fieldType == 'text')
				fieldRowObj.append($('<input/>').attr('type', 'text').attr('id', 'field'+field.property).val(sourceItem[field.property]));
			else if ((fieldType == 'state') || (fieldType == 'newRoomState') || (fieldType == 'action')) {
				// Add a dropdown if appropriate
				var selectObj = $('<select/>');
				if (field.property != null)
					selectObj.attr('id', 'field'+field.property);
				else if (field.type != null)
					selectObj.attr('id', 'field'+field.type);
				fieldRowObj.append(selectObj);
				if (field.addEmptyItem) selectObj.append($('<option/>').val('').text(''));
				
				// Determine the dropdown's list items
				var listItems = [];
				if ((fieldType == 'state') || (fieldType == 'newRoomState'))
					listItems = _settings.states;
				else if (fieldType == 'action')
					listItems = _settings.actions;
					
				// Add the list items as options to the dropdown
				$.each($.grep(listItems, function(item){
					if ((masterParentId != null) && (masterParentId.length > 0))
						return (item.stateGroupId == masterParentId) && (item.id != sourceItem.id) && (item.id != parentId);
					else
						return (item.stateGroupId == parentId) && (item.id != sourceItem.id) && (item.id != parentId);
				}), function(i, item){
					selectObj.append($('<option/>').val(item.id).text(item.description));
				});
				
				// Set the current value
				selectObj.val(sourceItem[field.property]);
			}
			else if (fieldType == 'currentRoomState') {
				var roomStateObj = $('<div/>');
				fieldRowObj.append(roomStateObj);
				function updateRoomState() { 
					var roomState = findObjInArray(_roomStates, 'roomId', sourceItem.id);
					if (roomState != null)
						roomStateObj.text(getStateDescription(findObjInArray(_settings.states, 'id', roomState.stateId))); 
					return true;
				}
				updateRoomState();
				repeatFunction(250, updateRoomState);
			}
			
			// Set client's focus on the first field
			if (i == 0) fieldRowObj.find('input').eq(0).focus();
		}
	});
	
	// Render additional controls
	if (!isNew && (formType.controls != null) && (formType.controls.length > 0)) {
		// Iterate through defined controls, and add them
		$.each(formType.controls, function(i, control){
			if (control.type == 'list')
				loadList(control.listType, parentId, sourceItem.id, popupContainer);
		});
	}
	
	// Add the save button
	popupContainer.append($('<button/>').addClass('right').text(__('edit.saveButton')).click(function(){
		// Validate input
		var errorMessages = '';
		$.each(formType.fields, function(i, field){
			if ((field.propertyType != 'array') && (field.type != 'roomState')) {
				if ((field.isMandatory != null) && field.isMandatory && (getFieldValueOfFormField(popupContainer, field).toString().length == 0))
					errorMessages += __('edit.error.isMandatory').replace('[field]', field.title);
				else if ((field.isNumeric != null) && field.isNumeric && !isNotNegativeInteger(getFieldValueOfFormField(popupContainer, field).toString()))
					errorMessages += __('edit.error.isNotPositiveNumber').replace('[field]', field.title);
			}
		});
		if (errorMessages.length > 0) { alert(errorMessages); return; }
		
		// Save field values to source item
		$.each(formType.fields, function(i, field){
			if ((field.propertyType != 'array') && (field.type != 'roomState'))
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
	else
		fieldValue = fieldObj.val();
	return fieldValue;
}

// Get the specified action from the settings object
function getActionById(actionId) {
	return findObjInArray(_settings.actions, "id", actionId);
}

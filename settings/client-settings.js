var _settingsKey = 'statecontrol-settings';
var _settings = {};

// Array which will contain all tabs
var _tabs = [];

$(document).ready(function(){
});

$.fn.selectTab = function() {
	var tabObj = $(this);
	$('.tabControl .tab').removeClass('active');
	$('.tabControl .page').removeClass('active');
	tabObj.addClass('active');
	$('.tabControl .page').eq(tabObj.index()).addClass('active');
}

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
			tabControlObj.find('.page').eq(tabObj.index()).find('.tabTitle').text(tab.title);
		}
	});
	$.each(_tabs, function(i, tab){
		var tabObj = tabControlObj.find('.tab[rel-parentid="'+tab.parentId+'"]');
		if (tabObj.length == 0)
			loadTab(tab, i);
	});
}

function onHomeyReady(){
	Homey.get(_settingsKey, function(error, settingValue){ 
		_settings = settingValue;
		if (_settings == null) _settings = {};
		if (_settings.stateGroups == null) _settings.stateGroups = [];
		if (_settings.rooms == null) _settings.rooms = [];
		if (_settings.states == null) _settings.states = [];
		if (_settings.actions == null) _settings.actions = [];
		
		initializeTabs();
		$.each(_tabs, function(i, tab){ loadTab(tab, i); });
		$('.tabControl .tab').eq(0).selectTab();
	});
	
	Homey.ready();
};

function initializeTabs() {
	_tabs = [];
	$.each(_settings.stateGroups, function(i, stateGroup){ addStateGroupTab(stateGroup); });
	addSettingsTab();
}

function saveSettings() {
	Homey.set(_settingsKey, _settings);	
};

function addStateGroupTab(stateGroup) { _tabs[_tabs.length] = { title:stateGroup.description, parentId:stateGroup.id, controls:[{type:'list', listType:'rooms' }, {type:'list', listType:'states' }, {type:'list', listType:'actions' }] }; }
function addSettingsTab() { _tabs[_tabs.length] = { title:'Instellingen', parentId:'', controls:[{type:'list', listType:'stateGroups' }] }; }

// Load the tab and its controls
function loadTab(tab, index) {
	// Add tab item & page
	$('.tabControl .tabs').insert(index, $('<div/>').addClass('tab').text(tab.title).attr('rel-parentid', tab.parentId).click(function(){ $(this).selectTab(); }));
	var page = $('<div/>').addClass('page');
	$('.tabControl .pages').insert(index, page).attr('rel-parentid', tab.parentId);
	page.append($('<h2/>').addClass('tabTitle').text('Groep ' + tab.title));
	
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
	listParentObj.append($('<legend/>').text(listType.title));
	listParentObj.append($('<p/>').text(listType.explanation));
	
	// Add the header row and its columns
	var headRowObj = $('<div/>').addClass('lister listRow head').attr('rel-listtype', listTypeName);
	listParentObj.append(headRowObj);
	$.each(listType.columns, function(i, column){ headRowObj.append($('<div/>').addClass('col').text(column.title)); });
	
	// Create the list object
	var listObj = $('<div/>').addClass('list lister').attr('rel-masterparentid', masterParentId).attr('rel-parentid', parentId).attr('rel-listtype', listTypeName);
	listParentObj.append(listObj);
	
	// Add button
	var addButtonObj = $('<button/>').text(listType.addButtonText).attr('rel-masterparentid', masterParentId).attr('rel-parentid', parentId).attr('rel-formtype', listType.formType).click(function(){ $(this).showForm(); });
	listParentObj.append(addButtonObj);
		
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
	
	if ((sourceItems == null) || (sourceItems.length == 0))
		listObj.hide();
	else
		listObj.show();
	
	// Iterate through the source items and create the rows
	$.each(sourceItems, function(e, sourceItem){
		// Create the row
		var rowObj = $('<div/>').addClass('row item').attr('rel-id', sourceItem.id);
		listObj.append(rowObj);
		
		// Iterate through the columns to add as cells
		$.each(listType.columns, function(i, column){
			var cellObj = $('<div/>').addClass('col');
			if (column.type == 'edit')
				cellObj.append($('<button/>').text('Wijzig').addClass('editButton').attr('rel-id',sourceItem.id).attr('rel-masterparentid', masterParentId).attr('rel-parentid', parentId).attr('rel-formtype', listType.formType).click(function(){ $(this).showForm(); }));
			else if (column.type == 'delete')
				cellObj.append($('<button/>').text('Verwijder').addClass('deleteButton').attr('rel-id',sourceItem.id).attr('rel-parentid', parentId).click(function(){ if (listType.deleteItem != null) listType.deleteItem(listObj.attr('rel-masterparentid'), listObj.attr('rel-parentid'), sourceItem); }));
			else if (column.type == 'move')
				cellObj.append($('<button/>').text('Verplaats').addClass('moveButton').attr('rel-id',sourceItem.id).attr('rel-parentid', parentId));
			else {
				var cellValue = '';
				if (column.propertyType == 'boolean')
					cellValue = sourceItem[column.property] ? 'Ja' : 'Nee';
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

function getFilteredSourceItems(source, filter, compareToValue) {
	var sourceItems = eval(source);
	if (filter != null)
		sourceItems = $.grep(sourceItems, function(item){ return item[filter.property] == compareToValue; });
	return sourceItems;
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
			if (field.propertyType != 'array') {
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
			
			if ((field.width != null) && (field.width > 0) && (columnContainer == null)) {
				columnContainer = $('<div/>').addClass('columnContainer');
				popupContainer.append(columnContainer);
			} else if (((field.width == null) || (field.width <= 0)) && (columnContainer != null))
				columnContainer = null;
				
			if ((field.width != null) && (field.width > 0) && (columnContainer != null)) {
				fieldParent = $('<div/>').addClass('col').css('width', field.width+'%');
				columnContainer.append(fieldParent);
			}
			
			var fieldRowObj = $('<div/>').addClass('field row');
			fieldParent.append(fieldRowObj);
			if ((field.info != null) && (field.info.length > 0))
				fieldRowObj.append($('<div/>').addClass('infoTooltip').text(field.info).click(function(){
					var tooltipPopup = loadPopup(createGuid(), null, 200, 450, 175);
					tooltipPopup.append($('<p/>').text(field.info));
					tooltipPopup.append($('<button/>').addClass('right').text('Sluiten').click(function(){ tooltipPopup.closePopup(); }));
				}));
			if (fieldType == 'boolean')
				fieldRowObj.append($('<input/>').attr('type', 'checkbox').attr('id', 'field'+field.property).prop('checked', sourceItem[field.property]));
			fieldRowObj.append($('<label/>').attr('for', 'field'+field.property).text(field.title));
			if (fieldType == 'text')
				fieldRowObj.append($('<input/>').attr('type', 'text').attr('id', 'field'+field.property).val(sourceItem[field.property]));
			else if ((fieldType == 'state') || (fieldType == 'action')) {
				var selectObj = $('<select/>').attr('id', 'field'+field.property);
				fieldRowObj.append(selectObj);
				if (field.addEmptyItem) selectObj.append($('<option/>').val('').text(''));
				var listItems = [];
				if (fieldType == 'state')
					listItems = _settings.states;
				else if (fieldType == 'action')
					listItems = _settings.actions;
				$.each($.grep(listItems, function(item){
					if ((masterParentId != null) && (masterParentId.length > 0))
						return (item.stateGroupId == masterParentId) && (item.id != sourceItem.id) && (item.id != parentId);
					else
						return (item.stateGroupId == parentId) && (item.id != sourceItem.id) && (item.id != parentId);
				}), function(i, item){
					selectObj.append($('<option/>').val(item.id).text(item.description));
				});
				selectObj.val(sourceItem[field.property]);
			}
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
	popupContainer.append($('<button/>').addClass('right').text('Bewaren').click(function(){
		// Validate input
		var errorMessages = '';
		$.each(formType.fields, function(i, field){
			if (field.propertyType != 'array') {
				if ((field.isMandatory != null) && field.isMandatory && (getFieldValueOfFormField(popupContainer, field).toString().length == 0))
					errorMessages += field.title + ' is verplicht.\n';
			}
		});
		if (errorMessages.length > 0) { alert(errorMessages); return; }
		
		// Save field values to source item
		$.each(formType.fields, function(i, field){
			if (field.propertyType != 'array')
				sourceItem[field.property] = getFieldValueOfFormField(popupContainer, field);
		});
		
		// Add the source item to its source, if it's new
		var unfilteredSourceItems = eval(formType.source);
		if (findObjInArray(unfilteredSourceItems, 'id', sourceItem.id) == null)
			unfilteredSourceItems[unfilteredSourceItems.length] = sourceItem;
		
		// Save settings
		saveSettings();
		if (formType.afterSave != null)
			formType.afterSave(sourceItem);
		
		// Render the parent list
		$('.list[rel-listtype="'+formType.listType+'"][rel-parentid="'+parentId+'"]').renderList();
		
		popupContainer.closePopup();
	}));
	
	// Add the cancel button
	popupContainer.append($('<button/>').addClass('right').text('Annuleren').click(function(){ popupContainer.closePopup(); }));
}

function getFieldTypeOfFormField(field) {
	var fieldType = '';
	if (field.propertyType != null)
		fieldType = field.propertyType;
	if ((fieldType == null) || (fieldType.length == 0))
		fieldType = 'text';
	return fieldType;
}

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

function getActionById(actionId) {
	return findObjInArray(_settings.actions, "id", actionId);
}